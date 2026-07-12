import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';

import {
  serializeAlert,
  serializeMachineStatus,
  serializeMetricHistory,
} from '@industrial-monitoring/contracts';

import type { AlertRepository } from './machines/alert-repository.js';
import { createInMemoryAlertRepository } from './machines/in-memory-alert-repository.js';

import { getMachineStatusSnapshot } from './machines/machine-status.js';
import { getMachineMetricHistory } from './machines/metric-history.js';

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

export function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  alertRepository: AlertRepository,
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

  return createServer((request, response) => {
    handleRequest(request, response, alertRepository);
  });
}
