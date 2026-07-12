import { once } from 'node:events';
import { type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { createHttpServer } from '../src/app.js';

interface HealthResponse {
  status: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
}

describe('HTTP application', () => {
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
    server.close();
    await once(server, 'close');
  });

  it('returns the application health status', async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const body = (await response.json()) as HealthResponse;

    expect(body.status).toBe('ok');
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it('returns not found for an unknown route', async () => {
    const response = await fetch(`${baseUrl}/unknown`);

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const body = (await response.json()) as ErrorResponse;

    expect(body).toEqual({
      error: 'Route not found',
    });
  });
});
