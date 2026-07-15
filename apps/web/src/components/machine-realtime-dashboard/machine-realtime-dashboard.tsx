'use client';

import { useEffect, useState } from 'react';

import type {
  AlertTransport,
  MachineStatusTransport,
  MetricHistoryTransport,
  RealtimeEvent,
} from '@industrial-monitoring/contracts';

import { MachineAlertHistory } from '@/components/machine-alert-history/machine-alert-history';
import { MachineMetricHistory } from '@/components/machine-metric-history/machine-metric-history';
import { MachineSnapshot } from '@/components/machine-snapshot/machine-snapshot';
import { createMachineApiClient } from '@/lib/api/machine-api-client';
import { createMachineRealtimeClient } from '@/lib/realtime/machine-realtime-client';

type Disconnect = () => void;

type RealtimeConnectionStatus = 'connected' | 'disconnected';

type DisplayConnectionStatus = 'connecting' | RealtimeConnectionStatus;

interface ConnectToMachineOptions {
  onEvent(event: RealtimeEvent): void;

  onConnectionChange(status: RealtimeConnectionStatus): void;
}

type ConnectToMachine = (
  machineId: string,
  options: ConnectToMachineOptions,
) => Disconnect;

type AcknowledgeAlert = (
  machineId: string,
  alertId: string,
) => Promise<AlertTransport>;

interface MachineRealtimeDashboardProps {
  initialMachineStatus: MachineStatusTransport;
  initialMetricHistory?: readonly MetricHistoryTransport[];
  initialAlerts?: readonly AlertTransport[];
  connectToMachine?: ConnectToMachine;
  acknowledgeAlert?: AcknowledgeAlert;
}

const DEFAULT_API_BASE_URL = 'http://localhost:3333';

const CONNECTION_STATUS_LABELS: Record<DisplayConnectionStatus, string> = {
  connecting: 'Conectando',
  connected: 'Conectado',
  disconnected: 'Desconectado',
};

const CONNECTION_STATUS_STYLES: Readonly<
  Record<DisplayConnectionStatus, string>
> = {
  connecting: 'border-info/30 bg-info/10 text-info',
  connected: 'border-success/30 bg-success/10 text-success',
  disconnected: 'border-danger/30 bg-danger/10 text-danger',
};

const METRIC_HISTORY_LIMIT = 30;

const connectWithBrowserEventSource: ConnectToMachine = (
  machineId,
  options,
) => {
  const client = createMachineRealtimeClient({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,

    eventSourceFactory(url) {
      const eventSource = new EventSource(url);

      return {
        addEventListener(type, listener) {
          eventSource.addEventListener(type, listener as EventListener);
        },

        close() {
          eventSource.close();
        },
      };
    },
  });

  return client.connect(machineId, options);
};

const acknowledgeWithBrowserApi: AcknowledgeAlert = async (
  machineId,
  alertId,
) => {
  const client = createMachineApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    fetch: globalThis.fetch,
  });

  return client.acknowledgeAlert(machineId, alertId);
};

export function MachineRealtimeDashboard({
  initialMachineStatus,
  initialMetricHistory,
  initialAlerts,
  connectToMachine,
  acknowledgeAlert,
}: MachineRealtimeDashboardProps) {
  const [machineStatus, setMachineStatus] = useState(initialMachineStatus);

  const [metricHistory, setMetricHistory] = useState<MetricHistoryTransport[]>(
    () => [...(initialMetricHistory ?? [])].slice(-METRIC_HISTORY_LIMIT),
  );

  const [alerts, setAlerts] = useState<AlertTransport[]>(() => [
    ...(initialAlerts ?? []),
  ]);

  const [acknowledgingAlertIds, setAcknowledgingAlertIds] = useState<
    Set<string>
  >(() => new Set());

  const [acknowledgementErrorAlertIds, setAcknowledgementErrorAlertIds] =
    useState<Set<string>>(() => new Set());

  const [connectionStatus, setConnectionStatus] =
    useState<DisplayConnectionStatus>('connecting');

  const isAlertHistoryEnabled = initialAlerts !== undefined;

  const isMetricHistoryEnabled = initialMetricHistory !== undefined;

  const acknowledgeMachineAlert = acknowledgeAlert ?? acknowledgeWithBrowserApi;

  async function handleAcknowledgeAlert(alertId: string): Promise<void> {
    if (acknowledgingAlertIds.has(alertId)) {
      return;
    }

    setAcknowledgementErrorAlertIds((currentAlertIds) => {
      const nextAlertIds = new Set(currentAlertIds);

      nextAlertIds.delete(alertId);

      return nextAlertIds;
    });

    setAcknowledgingAlertIds((currentAlertIds) => {
      const nextAlertIds = new Set(currentAlertIds);

      nextAlertIds.add(alertId);

      return nextAlertIds;
    });

    try {
      const acknowledgedAlert = await acknowledgeMachineAlert(
        initialMachineStatus.id,
        alertId,
      );

      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === acknowledgedAlert.id ? acknowledgedAlert : alert,
        ),
      );
    } catch {
      setAcknowledgementErrorAlertIds((currentAlertIds) => {
        const nextAlertIds = new Set(currentAlertIds);

        nextAlertIds.add(alertId);

        return nextAlertIds;
      });
    } finally {
      setAcknowledgingAlertIds((currentAlertIds) => {
        const nextAlertIds = new Set(currentAlertIds);

        nextAlertIds.delete(alertId);

        return nextAlertIds;
      });
    }
  }

  useEffect(() => {
    const connect = connectToMachine ?? connectWithBrowserEventSource;

    const disconnect = connect(initialMachineStatus.id, {
      onEvent(event) {
        if (event.type === 'MACHINE_STATUS_UPDATED') {
          setMachineStatus(event.payload);

          return;
        }

        if (event.type === 'METRIC_RECORDED') {
          setMetricHistory((currentMetricHistory) =>
            [...currentMetricHistory, event.payload].slice(
              -METRIC_HISTORY_LIMIT,
            ),
          );

          return;
        }

        if (event.type === 'ALERT_CREATED') {
          setAlerts((currentAlerts) => [event.payload, ...currentAlerts]);

          return;
        }

        if (event.type === 'ALERT_UPDATED') {
          setAlerts((currentAlerts) =>
            currentAlerts.map((alert) =>
              alert.id === event.payload.id ? event.payload : alert,
            ),
          );
        }
      },

      onConnectionChange(status) {
        setConnectionStatus(status);
      },
    });

    return disconnect;
  }, [connectToMachine, initialMachineStatus.id]);

  const connectionStatusStyle = CONNECTION_STATUS_STYLES[connectionStatus];

  return (
    <>
      <div className="mb-6 flex justify-end">
        <div
          role="status"
          aria-label="Status da conexão em tempo real"
          aria-live="polite"
          className={`rounded-full border px-4 py-2 text-sm font-medium ${connectionStatusStyle}`}
        >
          {CONNECTION_STATUS_LABELS[connectionStatus]}
        </div>
      </div>

      <MachineSnapshot machineStatus={machineStatus} />

      {isMetricHistoryEnabled ? (
        <MachineMetricHistory metricHistory={metricHistory} />
      ) : null}

      {isAlertHistoryEnabled ? (
        <MachineAlertHistory
          alerts={alerts}
          acknowledgingAlertIds={acknowledgingAlertIds}
          acknowledgementErrorAlertIds={acknowledgementErrorAlertIds}
          onAcknowledgeAlert={(alertId) => {
            void handleAcknowledgeAlert(alertId);
          }}
        />
      ) : null}
    </>
  );
}
