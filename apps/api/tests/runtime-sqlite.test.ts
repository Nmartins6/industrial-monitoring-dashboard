import { mkdtempSync, rmSync } from 'node:fs';
import { once } from 'node:events';
import { type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from '@jest/globals';

import type { AlertTransport } from '@industrial-monitoring/contracts';

import { createRuntimeHttpServer } from '../src/runtime.js';

async function startServer(server: Server): Promise<string> {
  server.listen(0, '127.0.0.1');

  await once(server, 'listening');

  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('Could not determine the test server address');
  }

  return `http://127.0.0.1:${address.port}`;
}

describe('SQLite runtime server', () => {
  it('persists alert changes across server restarts', async () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'industrial-monitoring-runtime-'),
    );

    const databasePath = join(temporaryDirectory, 'monitoring.db');

    try {
      const firstRuntime = createRuntimeHttpServer({
        databasePath,
      });

      const firstBaseUrl = await startServer(firstRuntime.server);

      try {
        const acknowledgementResponse = await fetch(
          `${firstBaseUrl}/api/v1/machines/mixer-01/alerts/alert-003/acknowledge`,
          {
            method: 'PATCH',
          },
        );

        expect(acknowledgementResponse.status).toBe(200);
      } finally {
        await firstRuntime.close();
      }

      const secondRuntime = createRuntimeHttpServer({
        databasePath,
      });

      const secondBaseUrl = await startServer(secondRuntime.server);

      try {
        const historyResponse = await fetch(
          `${secondBaseUrl}/api/v1/machines/mixer-01/alerts`,
        );

        expect(historyResponse.status).toBe(200);

        const alertHistory = (await historyResponse.json()) as AlertTransport[];

        const persistedAlert = alertHistory.find(
          (alert) => alert.id === 'alert-003',
        );

        expect(persistedAlert).toBeDefined();
        expect(persistedAlert?.acknowledged).toBe(true);
      } finally {
        await secondRuntime.close();
      }
    } finally {
      rmSync(temporaryDirectory, {
        recursive: true,
        force: true,
      });
    }
  });
});
