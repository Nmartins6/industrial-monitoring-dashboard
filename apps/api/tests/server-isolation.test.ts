import { once } from 'node:events';
import { type Server } from 'node:http';

import { describe, expect, it } from '@jest/globals';

import type { AlertTransport } from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';

interface TestServer {
  server: Server;
  baseUrl: string;
}

async function startTestServer(): Promise<TestServer> {
  const server = createHttpServer();

  server.listen(0, '127.0.0.1');

  await once(server, 'listening');

  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('Could not determine the test server address');
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

async function closeTestServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

describe('HTTP server state isolation', () => {
  it('starts each server with a fresh alert state', async () => {
    const firstTestServer = await startTestServer();

    try {
      const acknowledgementResponse = await fetch(
        `${firstTestServer.baseUrl}/api/v1/machines/mixer-01/alerts/alert-002/acknowledge`,
        {
          method: 'PATCH',
        },
      );

      expect(acknowledgementResponse.status).toBe(200);

      const acknowledgedAlert =
        (await acknowledgementResponse.json()) as AlertTransport;

      expect(acknowledgedAlert.acknowledged).toBe(true);
    } finally {
      await closeTestServer(firstTestServer.server);
    }

    const secondTestServer = await startTestServer();

    try {
      const alertHistoryResponse = await fetch(
        `${secondTestServer.baseUrl}/api/v1/machines/mixer-01/alerts`,
      );

      expect(alertHistoryResponse.status).toBe(200);

      const alertHistory =
        (await alertHistoryResponse.json()) as AlertTransport[];

      const alert = alertHistory.find(
        (currentAlert) => currentAlert.id === 'alert-002',
      );

      expect(alert).toBeDefined();
      expect(alert?.acknowledged).toBe(false);
    } finally {
      await closeTestServer(secondTestServer.server);
    }
  });
});
