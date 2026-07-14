'use client';

import { useEffect, useState } from 'react';

import type {
  AlertTransport,
  MachineStatusTransport,
  MetricHistoryTransport,
  RealtimeEvent,
} from '@industrial-monitoring/contracts';

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

const ALERT_LEVEL_LABELS: Record<AlertTransport['level'], string> = {
  INFO: 'Informativo',
  WARNING: 'Aviso',
  CRITICAL: 'Crítico',
};

const ALERT_LEVEL_ACCESSIBLE_LABELS: Record<AlertTransport['level'], string> = {
  INFO: 'informativo',
  WARNING: 'de aviso',
  CRITICAL: 'crítico',
};

const ALERT_COMPONENT_LABELS: Readonly<Record<string, string>> = {
  'temperature-sensor': 'Sensor de temperatura',
  motor: 'Motor',
  'monitoring-system': 'Sistema de monitoramento',
};

function getAlertComponentLabel(component: string): string {
  return ALERT_COMPONENT_LABELS[component] ?? component;
}

const ALERT_MESSAGE_LABELS: Readonly<Record<string, string>> = {
  'Temperature exceeded the critical threshold':
    'A temperatura excedeu o limite crítico',

  'Motor vibration is above the recommended level':
    'A vibração do motor está acima do nível recomendado',

  'Machine monitoring started': 'Monitoramento da máquina iniciado',
};

function getAlertMessageLabel(message: string): string {
  return ALERT_MESSAGE_LABELS[message] ?? message;
}

const METRIC_HISTORY_LIMIT = 30;

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

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

  return (
    <>
      <div className="mb-6 flex justify-end">
        <div
          role="status"
          aria-label="Status da conexão em tempo real"
          aria-live="polite"
          className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300"
        >
          {CONNECTION_STATUS_LABELS[connectionStatus]}
        </div>
      </div>

      <MachineSnapshot machineStatus={machineStatus} />

      {isMetricHistoryEnabled ? (
        <MachineMetricHistory metricHistory={metricHistory} />
      ) : null}

      {isAlertHistoryEnabled ? (
        <section
          aria-labelledby="realtime-alert-history-title"
          className="mt-6"
        >
          <div className="flex items-center justify-between">
            <h2
              id="realtime-alert-history-title"
              className="text-lg font-semibold"
            >
              Histórico de alertas
            </h2>

            <p className="text-sm text-slate-400">
              Eventos mais recentes da máquina
            </p>
          </div>

          <ul className="mt-4 space-y-3">
            {alerts.map((alert) => {
              const isAcknowledging = acknowledgingAlertIds.has(alert.id);

              const hasAcknowledgementError = acknowledgementErrorAlertIds.has(
                alert.id,
              );

              const levelLabel = ALERT_LEVEL_LABELS[alert.level];

              const accessibleLevelLabel =
                ALERT_LEVEL_ACCESSIBLE_LABELS[alert.level];

              const componentLabel = getAlertComponentLabel(alert.component);

              const messageLabel = getAlertMessageLabel(alert.message);

              return (
                <li
                  key={alert.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <article>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-semibold">{levelLabel}</p>

                          <p className="text-xs text-slate-400">
                            {componentLabel}
                          </p>
                        </div>

                        <p className="mt-2 text-sm text-slate-200">
                          {messageLabel}
                        </p>
                      </div>

                      <time
                        aria-label={`Horário do alerta ${accessibleLevelLabel}`}
                        dateTime={alert.timestamp}
                        className="text-sm text-slate-400"
                      >
                        {timeFormatter.format(new Date(alert.timestamp))}
                      </time>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        {alert.acknowledged
                          ? 'Reconhecido'
                          : 'Aguardando reconhecimento'}
                      </p>

                      {!alert.acknowledged ? (
                        <button
                          type="button"
                          aria-label={`${
                            isAcknowledging ? 'Reconhecendo' : 'Reconhecer'
                          } alerta ${accessibleLevelLabel}`}
                          aria-busy={isAcknowledging}
                          disabled={isAcknowledging}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => {
                            void handleAcknowledgeAlert(alert.id);
                          }}
                        >
                          {isAcknowledging
                            ? 'Reconhecendo...'
                            : 'Reconhecer alerta'}
                        </button>
                      ) : null}
                    </div>

                    {hasAcknowledgementError ? (
                      <p role="alert">
                        Não foi possível reconhecer o alerta. Tente novamente.
                      </p>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </>
  );
}
