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
    expect(history?.[0]).toEqual(alert);
  });
});
