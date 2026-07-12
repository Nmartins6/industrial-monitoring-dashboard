import { once } from 'node:events';
import { type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import type { AlertTransport } from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';

interface ErrorResponse {
  error: string;
}

describe('GET /api/v1/machines/:machineId/alerts', () => {
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

  it('returns the machine alert history from newest to oldest', async () => {
    const response = await fetch(`${baseUrl}/api/v1/machines/mixer-01/alerts`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const body = (await response.json()) as AlertTransport[];

    expect(body).toEqual([
      {
        id: 'alert-003',
        level: 'CRITICAL',
        message: 'Temperature exceeded the critical threshold',
        component: 'temperature-sensor',
        timestamp: '2026-07-12T10:00:12.000Z',
        acknowledged: false,
      },
      {
        id: 'alert-002',
        level: 'WARNING',
        message: 'Motor vibration is above the recommended level',
        component: 'motor',
        timestamp: '2026-07-12T10:00:09.000Z',
        acknowledged: false,
      },
      {
        id: 'alert-001',
        level: 'INFO',
        message: 'Machine monitoring started',
        component: 'monitoring-system',
        timestamp: '2026-07-12T10:00:00.000Z',
        acknowledged: true,
      },
    ]);

    for (const alert of body) {
      expect(new Date(alert.timestamp).toISOString()).toBe(alert.timestamp);
    }
  });

  it('returns not found when the machine does not exist', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/machines/unknown-machine/alerts`,
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

  it('rejects unsupported HTTP methods', async () => {
    const response = await fetch(`${baseUrl}/api/v1/machines/mixer-01/alerts`, {
      method: 'POST',
    });

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const body = (await response.json()) as ErrorResponse;

    expect(body).toEqual({
      error: 'Method not allowed',
    });
  });
});
