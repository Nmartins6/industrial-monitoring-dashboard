import type { MachineStatus } from '@industrial-monitoring/contracts';

export type MachineConditionCode = 'HIGH_TEMPERATURE' | 'CRITICAL_TEMPERATURE';

export type MachineConditionSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface MachineCondition {
  code: MachineConditionCode;
  severity: MachineConditionSeverity;
  message: string;
}

export interface MachineConditionEvaluation {
  machineStatus: MachineStatus;
  conditions: MachineCondition[];
}

export interface MachineConditionEvaluator {
  evaluate(machineStatus: MachineStatus): MachineConditionEvaluation;
}

export interface CreateMachineConditionEvaluatorOptions {
  warningTemperature?: number;
  criticalTemperature: number;
}

function cloneMachineStatus(machineStatus: MachineStatus): MachineStatus {
  return {
    ...machineStatus,
    timestamp: new Date(machineStatus.timestamp.getTime()),
    metrics: {
      ...machineStatus.metrics,
    },
    oee: {
      ...machineStatus.oee,
    },
  };
}

function validateTemperatureThresholds(
  options: CreateMachineConditionEvaluatorOptions,
): void {
  if (
    options.warningTemperature !== undefined &&
    options.warningTemperature >= options.criticalTemperature
  ) {
    throw new Error(
      'Warning temperature must be lower than critical temperature',
    );
  }
}

export function createMachineConditionEvaluator(
  options: CreateMachineConditionEvaluatorOptions,
): MachineConditionEvaluator {
  validateTemperatureThresholds(options);
  return {
    evaluate(machineStatus: MachineStatus): MachineConditionEvaluation {
      const evaluatedMachineStatus = cloneMachineStatus(machineStatus);

      if (machineStatus.metrics.temperature >= options.criticalTemperature) {
        return {
          machineStatus: {
            ...evaluatedMachineStatus,
            state: 'ERROR',
          },
          conditions: [
            {
              code: 'CRITICAL_TEMPERATURE',
              severity: 'CRITICAL',
              message: 'Machine temperature reached the critical threshold',
            },
          ],
        };
      }

      if (
        options.warningTemperature !== undefined &&
        machineStatus.metrics.temperature >= options.warningTemperature
      ) {
        return {
          machineStatus: evaluatedMachineStatus,
          conditions: [
            {
              code: 'HIGH_TEMPERATURE',
              severity: 'WARNING',
              message: 'Machine temperature reached the warning threshold',
            },
          ],
        };
      }

      return {
        machineStatus: evaluatedMachineStatus,
        conditions: [],
      };
    },
  };
}
