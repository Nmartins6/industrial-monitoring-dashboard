import { once } from 'node:events';
import { type Server } from 'node:http';

import { describe, expect, it } from '@jest/globals';

import type { Alert, AlertTransport } from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';
import type {
  AcknowledgeMachineAlertResult,
  AddMachineAlertResult,
  AlertRepository,
} from '../src/machines/alert-repository.js';
import { createInMemoryAlertRepository } from '../src/machines/in-memory-alert-repository.js';

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
      addMachineAlert(machineId: string, alert: Alert): AddMachineAlertResult {
        void machineId;

        return {
          status: 'CREATED',
          alert,
        };
      },

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

  it('returns machine not found when adding an alert to an unknown machine', () => {
    const repository = createInMemoryAlertRepository();

    const alert: Alert = {
      id: 'automatic-alert-unknown-machine',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      level: 'WARNING',
      component: 'Temperature Sensor',
      message: 'Machine temperature reached the warning threshold',
      acknowledged: false,
    };

    const result = repository.addMachineAlert('unknown-machine', alert);

    expect(result).toEqual({
      status: 'MACHINE_NOT_FOUND',
    });

    expect(
      repository.getMachineAlertHistory('unknown-machine'),
    ).toBeUndefined();
  });
});
