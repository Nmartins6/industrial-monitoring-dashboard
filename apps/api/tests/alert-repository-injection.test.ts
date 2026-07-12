import { once } from 'node:events';
import { type Server } from 'node:http';

import { describe, expect, it } from '@jest/globals';

import type { Alert, AlertTransport } from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';
import type {
  AcknowledgeMachineAlertResult,
  AlertRepository,
} from '../src/machines/alert-repository.js';

interface TestServer {
  server: Server;
  baseUrl: string;
}

async function startTestServer(
  alertRepository: AlertRepository,
): Promise<TestServer> {
  const server = createHttpServer({
    alertRepository,
  });

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

describe('Alert repository injection', () => {
  it('uses the injected repository when listing alerts', async () => {
    const injectedAlert: Alert = {
      id: 'injected-alert-001',
      level: 'WARNING',
      message: 'Alert supplied by the injected repository',
      component: 'injected-component',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
      acknowledged: false,
    };

    const alertRepository: AlertRepository = {
      getMachineAlertHistory(machineId: string): Alert[] | undefined {
        if (machineId !== 'custom-machine') {
          return undefined;
        }

        return [injectedAlert];
      },

      acknowledgeMachineAlert(): AcknowledgeMachineAlertResult {
        return {
          status: 'ALERT_NOT_FOUND',
        };
      },
    };

    const testServer = await startTestServer(alertRepository);

    try {
      const response = await fetch(
        `${testServer.baseUrl}/api/v1/machines/custom-machine/alerts`,
      );

      expect(response.status).toBe(200);

      const body = (await response.json()) as AlertTransport[];

      expect(body).toEqual([
        {
          id: 'injected-alert-001',
          level: 'WARNING',
          message: 'Alert supplied by the injected repository',
          component: 'injected-component',
          timestamp: '2026-07-12T15:00:00.000Z',
          acknowledged: false,
        },
      ]);
    } finally {
      await closeTestServer(testServer.server);
    }
  });
});
