import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from '@jest/globals';

import { createSqliteAlertRepository } from '../src/machines/sqlite-alert-repository.js';

describe('SQLite alert repository', () => {
  it('loads the initial alert history from newest to oldest', () => {
    const repository = createSqliteAlertRepository({
      databasePath: ':memory:',
    });

    try {
      const alertHistory = repository.getMachineAlertHistory('mixer-01');

      expect(alertHistory).toEqual([
        {
          id: 'alert-003',
          level: 'CRITICAL',
          message: 'Temperature exceeded the critical threshold',
          component: 'temperature-sensor',
          timestamp: new Date('2026-07-12T10:00:12.000Z'),
          acknowledged: false,
        },
        {
          id: 'alert-002',
          level: 'WARNING',
          message: 'Motor vibration is above the recommended level',
          component: 'motor',
          timestamp: new Date('2026-07-12T10:00:09.000Z'),
          acknowledged: false,
        },
        {
          id: 'alert-001',
          level: 'INFO',
          message: 'Machine monitoring started',
          component: 'monitoring-system',
          timestamp: new Date('2026-07-12T10:00:00.000Z'),
          acknowledged: true,
        },
      ]);
    } finally {
      repository.close();
    }
  });

  it('persists acknowledgement after reopening the database', () => {
    const temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'industrial-monitoring-alerts-'),
    );

    const databasePath = join(temporaryDirectory, 'alerts.db');

    try {
      const firstRepository = createSqliteAlertRepository({
        databasePath,
      });

      try {
        const result = firstRepository.acknowledgeMachineAlert(
          'mixer-01',
          'alert-003',
        );

        expect(result.status).toBe('ACKNOWLEDGED');

        if (result.status === 'ACKNOWLEDGED') {
          expect(result.alert.acknowledged).toBe(true);
        }
      } finally {
        firstRepository.close();
      }

      const secondRepository = createSqliteAlertRepository({
        databasePath,
      });

      try {
        const alertHistory =
          secondRepository.getMachineAlertHistory('mixer-01');

        const persistedAlert = alertHistory?.find(
          (alert) => alert.id === 'alert-003',
        );

        expect(persistedAlert).toBeDefined();
        expect(persistedAlert?.acknowledged).toBe(true);
      } finally {
        secondRepository.close();
      }
    } finally {
      rmSync(temporaryDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  it('returns machine not found when the machine does not exist', () => {
    const repository = createSqliteAlertRepository({
      databasePath: ':memory:',
    });

    try {
      const result = repository.acknowledgeMachineAlert(
        'unknown-machine',
        'alert-003',
      );

      expect(result).toEqual({
        status: 'MACHINE_NOT_FOUND',
      });
    } finally {
      repository.close();
    }
  });

  it('returns alert not found when the alert does not exist', () => {
    const repository = createSqliteAlertRepository({
      databasePath: ':memory:',
    });

    try {
      const result = repository.acknowledgeMachineAlert(
        'mixer-01',
        'unknown-alert',
      );

      expect(result).toEqual({
        status: 'ALERT_NOT_FOUND',
      });
    } finally {
      repository.close();
    }
  });
});
