import { once } from 'node:events';
import { type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import type { MetricHistoryTransport } from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';

interface ErrorResponse {
  error: string;
}

describe('GET /api/v1/machines/:machineId/metrics/history', () => {
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

  it('returns the machine metric history in chronological order', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/machines/mixer-01/metrics/history`,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const body = (await response.json()) as MetricHistoryTransport[];

    expect(body).toEqual([
      {
        timestamp: '2026-07-12T10:00:00.000Z',
        temperature: 68,
        rpm: 1100,
        efficiency: 89,
      },
      {
        timestamp: '2026-07-12T10:00:03.000Z',
        temperature: 69,
        rpm: 1140,
        efficiency: 90,
      },
      {
        timestamp: '2026-07-12T10:00:06.000Z',
        temperature: 70,
        rpm: 1170,
        efficiency: 91,
      },
      {
        timestamp: '2026-07-12T10:00:09.000Z',
        temperature: 71,
        rpm: 1190,
        efficiency: 91.5,
      },
      {
        timestamp: '2026-07-12T10:00:12.000Z',
        temperature: 72,
        rpm: 1200,
        efficiency: 92,
      },
    ]);

    for (const metric of body) {
      expect(new Date(metric.timestamp).toISOString()).toBe(metric.timestamp);
    }
  });

  it('returns not found when the machine does not exist', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/machines/unknown-machine/metrics/history`,
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
    const response = await fetch(
      `${baseUrl}/api/v1/machines/mixer-01/metrics/history`,
      {
        method: 'POST',
      },
    );

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
