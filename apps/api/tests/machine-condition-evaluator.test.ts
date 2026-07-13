import { describe, expect, it } from '@jest/globals';

import type { MachineStatus } from '@industrial-monitoring/contracts';

import { createMachineConditionEvaluator } from '../src/machines/machine-condition-evaluator.js';

describe('Machine condition evaluator', () => {
  it('marks the machine as error when temperature reaches the critical threshold', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      state: 'RUNNING',
      metrics: {
        temperature: 90,
        rpm: 1200,
        uptime: 28_803,
        efficiency: 92,
      },
      oee: {
        overall: 88.4,
        availability: 96,
        performance: 94,
        quality: 98,
      },
    };

    const evaluator = createMachineConditionEvaluator({
      criticalTemperature: 90,
    });

    const evaluation = evaluator.evaluate(previousStatus);

    expect(evaluation.machineStatus).toEqual({
      ...previousStatus,
      state: 'ERROR',
    });

    expect(evaluation.conditions).toEqual([
      {
        code: 'CRITICAL_TEMPERATURE',
        severity: 'CRITICAL',
        message: 'Machine temperature reached the critical threshold',
      },
    ]);

    expect(evaluation.machineStatus).not.toBe(previousStatus);

    expect(previousStatus.state).toBe('RUNNING');
  });

  it('preserves the machine state below the critical temperature', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      state: 'RUNNING',
      metrics: {
        temperature: 89.9,
        rpm: 1200,
        uptime: 28_803,
        efficiency: 92,
      },
      oee: {
        overall: 88.4,
        availability: 96,
        performance: 94,
        quality: 98,
      },
    };

    const evaluator = createMachineConditionEvaluator({
      criticalTemperature: 90,
    });

    const evaluation = evaluator.evaluate(previousStatus);

    expect(evaluation.machineStatus).toEqual(previousStatus);

    expect(evaluation.conditions).toEqual([]);

    expect(evaluation.machineStatus).not.toBe(previousStatus);

    expect(evaluation.machineStatus.metrics).not.toBe(previousStatus.metrics);

    expect(evaluation.machineStatus.oee).not.toBe(previousStatus.oee);

    expect(evaluation.machineStatus.timestamp).not.toBe(
      previousStatus.timestamp,
    );
  });

  it('creates a warning condition when temperature reaches the warning threshold', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      state: 'RUNNING',
      metrics: {
        temperature: 80,
        rpm: 1200,
        uptime: 28_803,
        efficiency: 92,
      },
      oee: {
        overall: 88.4,
        availability: 96,
        performance: 94,
        quality: 98,
      },
    };

    const evaluator = createMachineConditionEvaluator({
      warningTemperature: 80,
      criticalTemperature: 90,
    });

    const evaluation = evaluator.evaluate(previousStatus);

    expect(evaluation.machineStatus).toEqual(previousStatus);

    expect(evaluation.machineStatus.state).toBe('RUNNING');

    expect(evaluation.conditions).toEqual([
      {
        code: 'HIGH_TEMPERATURE',
        severity: 'WARNING',
        message: 'Machine temperature reached the warning threshold',
      },
    ]);

    expect(evaluation.machineStatus).not.toBe(previousStatus);

    expect(previousStatus.state).toBe('RUNNING');
  });

  it.each([
    [90, 90],
    [95, 90],
  ])(
    'rejects warning temperature %s when the critical temperature is %s',
    (warningTemperature, criticalTemperature) => {
      expect(() => {
        createMachineConditionEvaluator({
          warningTemperature,
          criticalTemperature,
        });
      }).toThrow('Warning temperature must be lower than critical temperature');
    },
  );
});
