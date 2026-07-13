import type { MachineCondition } from './machine-condition-evaluator.js';

export interface MachineConditionTransitionTracker {
  track(currentConditions: readonly MachineCondition[]): MachineCondition[];
}

export function createMachineConditionTransitionTracker(): MachineConditionTransitionTracker {
  let activeConditionCodes = new Set<string>();

  return {
    track(currentConditions: readonly MachineCondition[]): MachineCondition[] {
      const currentConditionCodes = new Set(
        currentConditions.map((condition) => condition.code),
      );

      const newlyActiveConditions = currentConditions.filter(
        (condition) => !activeConditionCodes.has(condition.code),
      );

      activeConditionCodes = currentConditionCodes;

      return [...newlyActiveConditions];
    },
  };
}
