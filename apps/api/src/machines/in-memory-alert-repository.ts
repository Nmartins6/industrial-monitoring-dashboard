import type { Alert } from '@industrial-monitoring/contracts';

import type {
  AcknowledgeMachineAlertResult,
  AddMachineAlertResult,
  AlertRepository,
} from './alert-repository.js';

interface StoredAlert extends Omit<Alert, 'timestamp'> {
  timestamp: string;
}

const INITIAL_ALERT_HISTORY_BY_MACHINE_ID: Readonly<
  Record<string, readonly StoredAlert[]>
> = {
  'mixer-01': [
    {
      id: 'alert-001',
      level: 'INFO',
      message: 'Machine monitoring started',
      component: 'monitoring-system',
      timestamp: '2026-07-12T10:00:00.000Z',
      acknowledged: true,
    },
    {
      id: 'alert-002',
      level: 'WARNING',
      message: 'Motor vibration is above the recommended level',
      component: 'motor',
      timestamp: '2026-07-12T10:00:09.000Z',
      acknowledged: false,
    },
    {
      id: 'alert-003',
      level: 'CRITICAL',
      message: 'Temperature exceeded the critical threshold',
      component: 'temperature-sensor',
      timestamp: '2026-07-12T10:00:12.000Z',
      acknowledged: false,
    },
  ],
};

function createInitialAlertHistory(): Record<string, StoredAlert[]> {
  const alertHistory: Record<string, StoredAlert[]> = {};

  for (const [machineId, storedAlerts] of Object.entries(
    INITIAL_ALERT_HISTORY_BY_MACHINE_ID,
  )) {
    alertHistory[machineId] = storedAlerts.map((storedAlert) => ({
      ...storedAlert,
    }));
  }

  return alertHistory;
}

function mapStoredAlertToDomain(storedAlert: StoredAlert): Alert {
  return {
    ...storedAlert,
    timestamp: new Date(storedAlert.timestamp),
  };
}

function mapDomainAlertToStored(alert: Alert): StoredAlert {
  return {
    ...alert,
    timestamp: alert.timestamp.toISOString(),
  };
}

export function createInMemoryAlertRepository(): AlertRepository {
  const alertHistoryByMachineId = createInitialAlertHistory();

  function addMachineAlert(
    machineId: string,
    alert: Alert,
  ): AddMachineAlertResult {
    const storedAlerts = alertHistoryByMachineId[machineId];

    if (storedAlerts === undefined) {
      return {
        status: 'MACHINE_NOT_FOUND',
      };
    }

    const storedAlert = mapDomainAlertToStored(alert);

    storedAlerts.unshift(storedAlert);

    return {
      status: 'CREATED',
      alert: mapStoredAlertToDomain(storedAlert),
    };
  }

  function getMachineAlertHistory(machineId: string): Alert[] | undefined {
    const storedAlerts = alertHistoryByMachineId[machineId];

    if (storedAlerts === undefined) {
      return undefined;
    }

    return storedAlerts
      .map(mapStoredAlertToDomain)
      .sort(
        (firstAlert, secondAlert) =>
          secondAlert.timestamp.getTime() - firstAlert.timestamp.getTime(),
      );
  }

  function acknowledgeMachineAlert(
    machineId: string,
    alertId: string,
  ): AcknowledgeMachineAlertResult {
    const storedAlerts = alertHistoryByMachineId[machineId];

    if (storedAlerts === undefined) {
      return {
        status: 'MACHINE_NOT_FOUND',
      };
    }

    const storedAlert = storedAlerts.find((alert) => alert.id === alertId);

    if (storedAlert === undefined) {
      return {
        status: 'ALERT_NOT_FOUND',
      };
    }

    storedAlert.acknowledged = true;

    return {
      status: 'ACKNOWLEDGED',
      alert: mapStoredAlertToDomain(storedAlert),
    };
  }

  return {
    addMachineAlert,
    acknowledgeMachineAlert,
    getMachineAlertHistory,
  };
}
