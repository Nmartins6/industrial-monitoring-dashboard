import { once } from 'node:events';
import { type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import type { MachineStatusTransport } from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';

interface ErrorResponse {
  error: string;
}

describe('GET /api/v1/machines/:machineId/status', () => {
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

  it('returns the current machine status snapshot', async () => {
    const response = await fetch(`${baseUrl}/api/v1/machines/mixer-01/status`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const body = (await response.json()) as MachineStatusTransport;

    expect(body).toEqual({
      id: 'mixer-01',
      timestamp: expect.any(String),
      state: 'RUNNING',
      metrics: {
        temperature: 72,
        rpm: 1200,
        uptime: 28_800,
        efficiency: 92,
      },
      oee: {
        overall: 88.4,
        availability: 96,
        performance: 94,
        quality: 98,
      },
    });

    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('returns not found when the machine does not exist', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/machines/unknown-machine/status`,
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
    const response = await fetch(`${baseUrl}/api/v1/machines/mixer-01/status`, {
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
