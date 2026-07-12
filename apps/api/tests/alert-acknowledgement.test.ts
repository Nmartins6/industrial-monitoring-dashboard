import { once } from 'node:events';
import { type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import type { AlertTransport } from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';

interface ErrorResponse {
  error: string;
}

describe('PATCH /api/v1/machines/:machineId/alerts/:alertId/acknowledge', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createHttpServer();
    server.listen(0, '127.0.0.1');

    await once(server, 'listening');

    const address = server.address();

    if (address === null || typeof address === 'string') {
      throw new Error('Could not determine the test server address');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error !== undefined) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('acknowledges an existing alert and persists the change', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/machines/mixer-01/alerts/alert-003/acknowledge`,
      {
        method: 'PATCH',
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const acknowledgedAlert = (await response.json()) as AlertTransport;

    expect(acknowledgedAlert).toEqual({
      id: 'alert-003',
      level: 'CRITICAL',
      message: 'Temperature exceeded the critical threshold',
      component: 'temperature-sensor',
      timestamp: '2026-07-12T10:00:12.000Z',
      acknowledged: true,
    });

    const historyResponse = await fetch(
      `${baseUrl}/api/v1/machines/mixer-01/alerts`,
    );

    expect(historyResponse.status).toBe(200);

    const alertHistory = (await historyResponse.json()) as AlertTransport[];

    const persistedAlert = alertHistory.find(
      (alert) => alert.id === 'alert-003',
    );

    expect(persistedAlert).toEqual(acknowledgedAlert);
  });

  it('returns not found when the machine does not exist', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/machines/unknown-machine/alerts/alert-003/acknowledge`,
      {
        method: 'PATCH',
      },
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const body = (await response.json()) as ErrorResponse;

    expect(body).toEqual({
      error: 'Machine not found',
    });
  });

  it('returns not found when the alert does not exist', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/machines/mixer-01/alerts/unknown-alert/acknowledge`,
      {
        method: 'PATCH',
      },
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const body = (await response.json()) as ErrorResponse;

    expect(body).toEqual({
      error: 'Alert not found',
    });
  });

  it('rejects unsupported HTTP methods', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/machines/mixer-01/alerts/alert-003/acknowledge`,
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('PATCH');
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const body = (await response.json()) as ErrorResponse;

    expect(body).toEqual({
      error: 'Method not allowed',
    });
  });
});
