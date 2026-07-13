import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';

import { randomUUID } from 'node:crypto';

import { openSseConnection, writeSseEvent } from './realtime/sse.js';

import {
  createAlertCreatedEvent,
  createConnectedEvent,
  createMachineStatusUpdatedEvent,
  createMetricRecordedEvent,
  serializeAlert,
  serializeMachineStatus,
  serializeMetricHistory,
} from '@industrial-monitoring/contracts';

import {
  systemRealtimeScheduler,
  type RealtimeScheduler,
} from './realtime/realtime-scheduler.js';

import {
  createMachineTelemetrySimulator,
  type MachineTelemetrySimulator,
} from './machines/machine-telemetry-simulator.js';

import {
  createMachineConditionEvaluator,
  type MachineConditionEvaluator,
} from './machines/machine-condition-evaluator.js';

import { createMachineAlertFromCondition } from './machines/machine-condition-alert-factory.js';
import { createInMemoryAlertRepository } from './machines/in-memory-alert-repository.js';
import { getMachineStatusSnapshot } from './machines/machine-status.js';
import { getMachineMetricHistory } from './machines/metric-history.js';
import { createMachineConditionTransitionTracker } from './machines/machine-condition-transition-tracker.js';

import type { AlertRepository } from './machines/alert-repository.js';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

interface ErrorResponse {
  error: string;
}

interface AlertAcknowledgementPathParameters {
  machineId: string;
  alertId: string;
}

export interface CreateHttpServerOptions {
  alertRepository?: AlertRepository;
  realtimeScheduler?: RealtimeScheduler;
  machineTelemetrySimulator?: MachineTelemetrySimulator;
  machineConditionEvaluator?: MachineConditionEvaluator;
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });

  response.end(JSON.stringify(body));
}

function getMachineIdFromStatusPath(pathname: string): string | undefined {
  const match = /^\/api\/v1\/machines\/([^/]+)\/status$/.exec(pathname);

  return match?.[1];
}

function getMachineIdFromMetricHistoryPath(
  pathname: string,
): string | undefined {
  const match = /^\/api\/v1\/machines\/([^/]+)\/metrics\/history$/.exec(
    pathname,
  );

  return match?.[1];
}

function getMachineIdFromAlertHistoryPath(
  pathname: string,
): string | undefined {
  const match = /^\/api\/v1\/machines\/([^/]+)\/alerts$/.exec(pathname);

  return match?.[1];
}

function getAlertAcknowledgementPathParameters(
  pathname: string,
): AlertAcknowledgementPathParameters | undefined {
  const match =
    /^\/api\/v1\/machines\/([^/]+)\/alerts\/([^/]+)\/acknowledge$/.exec(
      pathname,
    );

  const machineId = match?.[1];
  const alertId = match?.[2];

  if (machineId === undefined || alertId === undefined) {
    return undefined;
  }

  return {
    machineId,
    alertId,
  };
}

function getMachineIdFromEventsPath(pathname: string): string | undefined {
  const match = /^\/api\/v1\/machines\/([^/]+)\/events$/.exec(pathname);

  return match?.[1];
}

export function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  alertRepository: AlertRepository,
  realtimeScheduler: RealtimeScheduler,
  machineTelemetrySimulator: MachineTelemetrySimulator,
  machineConditionEvaluator: MachineConditionEvaluator,
): void {
  const requestUrl = new URL(request.url ?? '/', 'http://localhost');

  if (request.method === 'GET' && requestUrl.pathname === '/health') {
    const healthResponse: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    sendJson(response, 200, healthResponse);
    return;
  }

  const eventsMachineId = getMachineIdFromEventsPath(requestUrl.pathname);

  if (eventsMachineId !== undefined) {
    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET');

      const errorResponse: ErrorResponse = {
        error: 'Method not allowed',
      };

      sendJson(response, 405, errorResponse);
      return;
    }

    const machineStatus = getMachineStatusSnapshot(eventsMachineId);

    if (machineStatus === undefined) {
      const errorResponse: ErrorResponse = {
        error: 'Machine not found',
      };

      sendJson(response, 404, errorResponse);
      return;
    }

    let currentMachineStatus = machineStatus;

    const conditionTransitionTracker =
      createMachineConditionTransitionTracker();

    const emittedAt = new Date().toISOString();

    const connectedEvent = createConnectedEvent({
      id: randomUUID(),
      emittedAt,
    });

    openSseConnection(response);
    writeSseEvent(response, connectedEvent);

    const scheduledTask = realtimeScheduler.scheduleEvery(3_000, () => {
      if (response.destroyed || response.writableEnded) {
        return;
      }

      const updateTimestamp = new Date();

      const simulatedMachineStatus = machineTelemetrySimulator.next(
        currentMachineStatus,
        updateTimestamp,
      );

      const conditionEvaluation = machineConditionEvaluator.evaluate(
        simulatedMachineStatus,
      );

      currentMachineStatus = conditionEvaluation.machineStatus;

      const newlyActiveConditions = conditionTransitionTracker.track(
        conditionEvaluation.conditions,
      );

      const updateEmittedAt = updateTimestamp.toISOString();

      const serializedMachineStatus =
        serializeMachineStatus(currentMachineStatus);

      const machineStatusUpdatedEvent = createMachineStatusUpdatedEvent({
        id: randomUUID(),
        emittedAt: updateEmittedAt,
        payload: serializedMachineStatus,
      });

      const metricRecordedEvent = createMetricRecordedEvent({
        id: randomUUID(),
        emittedAt: updateEmittedAt,
        payload: {
          timestamp: serializedMachineStatus.timestamp,
          temperature: serializedMachineStatus.metrics.temperature,
          rpm: serializedMachineStatus.metrics.rpm,
          efficiency: serializedMachineStatus.metrics.efficiency,
        },
      });

      const alertCreatedEvents = newlyActiveConditions.flatMap((condition) => {
        const alert = createMachineAlertFromCondition({
          id: randomUUID(),
          timestamp: updateTimestamp,
          component: 'temperature-sensor',
          condition,
        });

        const creationResult = alertRepository.addMachineAlert(
          eventsMachineId,
          alert,
        );

        if (creationResult.status !== 'CREATED') {
          return [];
        }

        return [
          createAlertCreatedEvent({
            id: randomUUID(),
            emittedAt: updateEmittedAt,
            payload: serializeAlert(creationResult.alert),
          }),
        ];
      });

      writeSseEvent(response, machineStatusUpdatedEvent);

      writeSseEvent(response, metricRecordedEvent);

      for (const alertCreatedEvent of alertCreatedEvents) {
        writeSseEvent(response, alertCreatedEvent);
      }
    });

    response.once('close', () => {
      scheduledTask.cancel();
    });

    return;
  }

  const alertAcknowledgementParameters = getAlertAcknowledgementPathParameters(
    requestUrl.pathname,
  );

  if (alertAcknowledgementParameters !== undefined) {
    if (request.method !== 'PATCH') {
      response.setHeader('allow', 'PATCH');

      const errorResponse: ErrorResponse = {
        error: 'Method not allowed',
      };

      sendJson(response, 405, errorResponse);
      return;
    }

    const result = alertRepository.acknowledgeMachineAlert(
      alertAcknowledgementParameters.machineId,
      alertAcknowledgementParameters.alertId,
    );
    if (result.status === 'MACHINE_NOT_FOUND') {
      const errorResponse: ErrorResponse = {
        error: 'Machine not found',
      };

      sendJson(response, 404, errorResponse);
      return;
    }

    if (result.status === 'ALERT_NOT_FOUND') {
      const errorResponse: ErrorResponse = {
        error: 'Alert not found',
      };

      sendJson(response, 404, errorResponse);
      return;
    }

    sendJson(response, 200, serializeAlert(result.alert));

    return;
  }

  const alertHistoryMachineId = getMachineIdFromAlertHistoryPath(
    requestUrl.pathname,
  );

  if (alertHistoryMachineId !== undefined) {
    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET');

      const errorResponse: ErrorResponse = {
        error: 'Method not allowed',
      };

      sendJson(response, 405, errorResponse);
      return;
    }

    const alertHistory = alertRepository.getMachineAlertHistory(
      alertHistoryMachineId,
    );

    if (alertHistory === undefined) {
      const errorResponse: ErrorResponse = {
        error: 'Machine not found',
      };

      sendJson(response, 404, errorResponse);
      return;
    }

    sendJson(response, 200, alertHistory.map(serializeAlert));

    return;
  }

  const metricHistoryMachineId = getMachineIdFromMetricHistoryPath(
    requestUrl.pathname,
  );

  if (metricHistoryMachineId !== undefined) {
    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET');

      const errorResponse: ErrorResponse = {
        error: 'Method not allowed',
      };

      sendJson(response, 405, errorResponse);
      return;
    }

    const metricHistory = getMachineMetricHistory(metricHistoryMachineId);

    if (metricHistory === undefined) {
      const errorResponse: ErrorResponse = {
        error: 'Machine not found',
      };

      sendJson(response, 404, errorResponse);
      return;
    }

    sendJson(response, 200, metricHistory.map(serializeMetricHistory));

    return;
  }
  const machineId = getMachineIdFromStatusPath(requestUrl.pathname);

  if (machineId !== undefined) {
    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET');

      const errorResponse: ErrorResponse = {
        error: 'Method not allowed',
      };

      sendJson(response, 405, errorResponse);
      return;
    }

    const machineStatus = getMachineStatusSnapshot(machineId);

    if (machineStatus === undefined) {
      const errorResponse: ErrorResponse = {
        error: 'Machine not found',
      };

      sendJson(response, 404, errorResponse);
      return;
    }

    sendJson(response, 200, serializeMachineStatus(machineStatus));

    return;
  }

  const errorResponse: ErrorResponse = {
    error: 'Route not found',
  };

  sendJson(response, 404, errorResponse);
}

export function createHttpServer(
  options: CreateHttpServerOptions = {},
): Server {
  const alertRepository =
    options.alertRepository ?? createInMemoryAlertRepository();

  const realtimeScheduler =
    options.realtimeScheduler ?? systemRealtimeScheduler;

  const machineTelemetrySimulator =
    options.machineTelemetrySimulator ?? createMachineTelemetrySimulator();

  const machineConditionEvaluator =
    options.machineConditionEvaluator ??
    createMachineConditionEvaluator({
      warningTemperature: 80,
      criticalTemperature: 90,
    });

  return createServer((request, response) => {
    handleRequest(
      request,
      response,
      alertRepository,
      realtimeScheduler,
      machineTelemetrySimulator,
      machineConditionEvaluator,
    );
  });
}
