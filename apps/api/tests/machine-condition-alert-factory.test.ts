import { describe, expect, it } from '@jest/globals';

import type { MachineCondition } from '../src/machines/machine-condition-evaluator.js';

import { createMachineAlertFromCondition } from '../src/machines/machine-condition-alert-factory.js';

describe('Machine condition alert factory', () => {
  it('creates an unacknowledged warning alert from a machine condition', () => {
    const condition: MachineCondition = {
      code: 'HIGH_TEMPERATURE',
      severity: 'WARNING',
      message: 'Machine temperature reached the warning threshold',
    };

    const timestamp = new Date('2026-07-12T15:00:03.000Z');

    const alert = createMachineAlertFromCondition({
      id: 'alert-high-temperature-01',
      timestamp,
      component: 'Temperature Sensor',
      condition,
    });

    expect(alert).toEqual({
      id: 'alert-high-temperature-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      level: 'WARNING',
      component: 'Temperature Sensor',
      message: 'Machine temperature reached the warning threshold',
      acknowledged: false,
    });

    expect(alert.timestamp).not.toBe(timestamp);

    expect(timestamp).toEqual(new Date('2026-07-12T15:00:03.000Z'));
  });

  it('creates an unacknowledged critical alert from a machine condition', () => {
    const condition: MachineCondition = {
      code: 'CRITICAL_TEMPERATURE',
      severity: 'CRITICAL',
      message: 'Machine temperature reached the critical threshold',
    };

    const timestamp = new Date('2026-07-12T15:00:06.000Z');

    const alert = createMachineAlertFromCondition({
      id: 'alert-critical-temperature-01',
      timestamp,
      component: 'Temperature Sensor',
      condition,
    });

    expect(alert).toEqual({
      id: 'alert-critical-temperature-01',
      timestamp: new Date('2026-07-12T15:00:06.000Z'),
      level: 'CRITICAL',
      component: 'Temperature Sensor',
      message: 'Machine temperature reached the critical threshold',
      acknowledged: false,
    });

    expect(alert.timestamp).not.toBe(timestamp);
  });
});
