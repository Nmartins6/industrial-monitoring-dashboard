import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from '@jest/globals';

import type { Alert } from '@industrial-monitoring/contracts';

import { createSqliteAlertRepository } from '../src/machines/sqlite-alert-repository.js';

describe('SQLite alert repository creation', () => {
  it('persists a new machine alert after reopening the database', async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), 'industrial-monitoring-alerts-'),
    );

    const databasePath = join(temporaryDirectory, 'alerts.db');

    let repository: ReturnType<typeof createSqliteAlertRepository> | undefined;

    const alert: Alert = {
      id: 'automatic-alert-persisted-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      level: 'WARNING',
      component: 'Temperature Sensor',
      message: 'Machine temperature reached the warning threshold',
      acknowledged: false,
    };

    try {
      repository = createSqliteAlertRepository({
        databasePath,
      });

      const result = repository.addMachineAlert('mixer-01', alert);

      expect(result).toEqual({
        status: 'CREATED',
        alert,
      });

      const historyBeforeReopening =
        repository.getMachineAlertHistory('mixer-01');

      expect(historyBeforeReopening?.[0]).toEqual(alert);

      repository.close();
      repository = undefined;

      repository = createSqliteAlertRepository({
        databasePath,
      });

      const historyAfterReopening =
        repository.getMachineAlertHistory('mixer-01');

      expect(historyAfterReopening?.[0]).toEqual(alert);
    } finally {
      repository?.close();

      await rm(temporaryDirectory, {
        recursive: true,
        force: true,
      });
    }
  });
});
