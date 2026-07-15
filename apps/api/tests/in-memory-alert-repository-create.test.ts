import { describe, expect, it } from '@jest/globals';

import type { Alert } from '@industrial-monitoring/contracts';

import { createInMemoryAlertRepository } from '../src/machines/in-memory-alert-repository.js';

describe('In-memory alert repository creation', () => {
  it('adds a new alert to the machine history', () => {
    const repository = createInMemoryAlertRepository();

    const alert: Alert = {
      id: 'automatic-alert-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      level: 'WARNING',
      component: 'Temperature Sensor',
      message: 'Machine temperature reached the warning threshold',
      acknowledged: false,
    };

    const result = repository.addMachineAlert('mixer-01', alert);

    expect(result).toEqual({
      status: 'CREATED',
      alert,
    });

    const history = repository.getMachineAlertHistory('mixer-01');

    expect(history).toBeDefined();
    expect(history).toContainEqual(alert);
  });

  it('prioritizes alert history by severity and then by newest timestamp', () => {
    const repository = createInMemoryAlertRepository();

    repository.addMachineAlert('mixer-01', {
      id: 'alert-newer-info',
      timestamp: new Date('2026-07-12T10:00:30.000Z'),
      level: 'INFO',
      component: 'monitoring-system',
      message: 'Newer informational event',
      acknowledged: false,
    });

    repository.addMachineAlert('mixer-01', {
      id: 'alert-newer-warning',
      timestamp: new Date('2026-07-12T10:00:31.000Z'),
      level: 'WARNING',
      component: 'motor',
      message: 'Newer warning event',
      acknowledged: false,
    });

    repository.addMachineAlert('mixer-01', {
      id: 'alert-older-critical',
      timestamp: new Date('2026-07-12T09:59:59.000Z'),
      level: 'CRITICAL',
      component: 'temperature-sensor',
      message: 'Older critical event',
      acknowledged: false,
    });

    const history = repository.getMachineAlertHistory('mixer-01');

    expect(history?.map((alert) => alert.id)).toEqual([
      'alert-003',
      'alert-older-critical',
      'alert-newer-warning',
      'alert-002',
      'alert-newer-info',
      'alert-001',
    ]);
  });
});
