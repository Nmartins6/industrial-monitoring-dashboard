import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';

import {
  serializeMachineStatus,
  serializeMetricHistory,
} from '@industrial-monitoring/contracts';

import { getMachineStatusSnapshot } from './machines/machine-status.js';
import { getMachineMetricHistory } from './machines/metric-history.js';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

interface ErrorResponse {
  error: string;
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

export function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
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

export function createHttpServer(): Server {
  return createServer(handleRequest);
}
