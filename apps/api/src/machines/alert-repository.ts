import type { Alert } from '@industrial-monitoring/contracts';

export type AddMachineAlertResult =
  | {
      status: 'CREATED';
      alert: Alert;
    }
  | {
      status: 'MACHINE_NOT_FOUND';
    };

export type AcknowledgeMachineAlertResult =
  | {
      status: 'ACKNOWLEDGED';
      alert: Alert;
    }
  | {
      status: 'MACHINE_NOT_FOUND';
    }
  | {
      status: 'ALERT_NOT_FOUND';
    };

export interface AlertRepository {
  addMachineAlert(machineId: string, alert: Alert): AddMachineAlertResult;

  acknowledgeMachineAlert(
    machineId: string,
    alertId: string,
  ): AcknowledgeMachineAlertResult;

  getMachineAlertHistory(machineId: string): Alert[] | undefined;
}
