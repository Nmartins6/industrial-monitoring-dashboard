import { describe, expect, it } from '@jest/globals';

import type { MachineCondition } from '../src/machines/machine-condition-evaluator.js';

import { createMachineConditionTransitionTracker } from '../src/machines/machine-condition-transition-tracker.js';

const criticalTemperatureCondition: MachineCondition = {
  code: 'CRITICAL_TEMPERATURE',
  severity: 'CRITICAL',
  message: 'Machine temperature reached the critical threshold',
};

describe('Machine condition transition tracker', () => {
  it('returns a condition only when it becomes active', () => {
    const tracker = createMachineConditionTransitionTracker();

    const firstDetection = tracker.track([criticalTemperatureCondition]);

    const repeatedDetection = tracker.track([criticalTemperatureCondition]);

    expect(firstDetection).toEqual([criticalTemperatureCondition]);

    expect(repeatedDetection).toEqual([]);
  });

  it('returns the condition again after it clears and becomes active later', () => {
    const tracker = createMachineConditionTransitionTracker();

    tracker.track([criticalTemperatureCondition]);

    const clearedConditions = tracker.track([]);

    const detectedAgain = tracker.track([criticalTemperatureCondition]);

    expect(clearedConditions).toEqual([]);

    expect(detectedAgain).toEqual([criticalTemperatureCondition]);
  });
});
