import { once } from 'node:events';
import { type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import type { ConnectedEvent } from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';

interface ErrorResponse {
  error: string;
}

async function readFirstSseFrame(response: Response): Promise<string> {
  if (response.body === null) {
    throw new Error('SSE response body is not available');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let receivedContent = '';

  try {
    while (!receivedContent.includes('\n\n')) {
      const result = await reader.read();

      if (result.done) {
        break;
      }

      receivedContent += decoder.decode(result.value, {
        stream: true,
      });
    }

    const frameEndIndex = receivedContent.indexOf('\n\n');

    if (frameEndIndex === -1) {
      throw new Error(
        'The SSE connection ended before a complete event was received',
      );
    }

    return receivedContent.slice(0, frameEndIndex + 2);
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

describe('GET /api/v1/machines/:machineId/events', () => {
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

  it('opens an SSE connection and sends a connected event', async () => {
    const abortController = new AbortController();

    const timeout = setTimeout(() => {
      abortController.abort();
    }, 2_000);

    try {
      const response = await fetch(
        `${baseUrl}/api/v1/machines/mixer-01/events`,
        {
          headers: {
            accept: 'text/event-stream',
            origin: 'http://localhost:3000',
          },
          signal: abortController.signal,
        },
      );

      expect(response.status).toBe(200);

      if (response.status !== 200) {
        return;
      }

      expect(response.headers.get('content-type')).toBe(
        'text/event-stream; charset=utf-8',
      );

      expect(response.headers.get('cache-control')).toBe('no-cache');

      expect(response.headers.get('access-control-allow-origin')).toBe(
        'http://localhost:3000',
      );

      expect(response.headers.get('vary')).toContain('Origin');

      const frame = (await readFirstSseFrame(response)).replaceAll(
        '\r\n',
        '\n',
      );

      const lines = frame.trimEnd().split('\n');

      const idLine = lines.find((line) => line.startsWith('id: '));

      const eventLine = lines.find((line) => line.startsWith('event: '));

      const dataLine = lines.find((line) => line.startsWith('data: '));

      expect(idLine).toBeDefined();
      expect(eventLine).toBe('event: CONNECTED');
      expect(dataLine).toBeDefined();

      if (idLine === undefined || dataLine === undefined) {
        throw new Error('The SSE event is missing required fields');
      }

      const event = JSON.parse(
        dataLine.slice('data: '.length),
      ) as ConnectedEvent;

      expect(event).toEqual({
        id: expect.any(String),
        type: 'CONNECTED',
        emittedAt: expect.any(String),
        payload: {
          connectedAt: expect.any(String),
        },
      });

      expect(idLine).toBe(`id: ${event.id}`);

      expect(new Date(event.emittedAt).toISOString()).toBe(event.emittedAt);

      expect(event.payload.connectedAt).toBe(event.emittedAt);
    } finally {
      clearTimeout(timeout);
      abortController.abort();
    }
  });
  it('returns not found when the machine does not exist', async () => {
    const response = await fetch(
      `${baseUrl}/api/v1/machines/unknown-machine/events`,
      {
        headers: {
          accept: 'text/event-stream',
        },
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

  it('rejects unsupported HTTP methods', async () => {
    const response = await fetch(`${baseUrl}/api/v1/machines/mixer-01/events`, {
      method: 'POST',
      headers: {
        accept: 'text/event-stream',
      },
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
