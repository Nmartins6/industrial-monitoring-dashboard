import type { Alert } from '@industrial-monitoring/contracts';

import type { MachineCondition } from './machine-condition-evaluator.js';

export interface CreateMachineAlertFromConditionInput {
  id: string;
  timestamp: Date;
  component: string;
  condition: MachineCondition;
}

export function createMachineAlertFromCondition(
  input: CreateMachineAlertFromConditionInput,
): Alert {
  return {
    id: input.id,
    timestamp: new Date(input.timestamp.getTime()),
    level: input.condition.severity,
    component: input.component,
    message: input.condition.message,
    acknowledged: false,
  };
}
