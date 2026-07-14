'use client';

import { useEffect, useState } from 'react';

import type {
  AlertTransport,
  MachineStatusTransport,
  RealtimeEvent,
} from '@industrial-monitoring/contracts';

import { MachineSnapshot } from '@/components/machine-snapshot/machine-snapshot';
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

interface MachineRealtimeDashboardProps {
  initialMachineStatus: MachineStatusTransport;
  initialAlerts?: readonly AlertTransport[];
  connectToMachine?: ConnectToMachine;
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

export function MachineRealtimeDashboard({
  initialMachineStatus,
  initialAlerts,
  connectToMachine,
}: MachineRealtimeDashboardProps) {
  const [machineStatus, setMachineStatus] = useState(initialMachineStatus);

  const [alerts, setAlerts] = useState<AlertTransport[]>(() => [
    ...(initialAlerts ?? []),
  ]);

  const [connectionStatus, setConnectionStatus] =
    useState<DisplayConnectionStatus>('connecting');

  const isAlertHistoryEnabled = initialAlerts !== undefined;

  useEffect(() => {
    const connect = connectToMachine ?? connectWithBrowserEventSource;

    const disconnect = connect(initialMachineStatus.id, {
      onEvent(event) {
        if (event.type === 'MACHINE_STATUS_UPDATED') {
          setMachineStatus(event.payload);

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
              const levelLabel = ALERT_LEVEL_LABELS[alert.level];

              const accessibleLevelLabel =
                ALERT_LEVEL_ACCESSIBLE_LABELS[alert.level];

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
                            {alert.component}
                          </p>
                        </div>

                        <p className="mt-2 text-sm text-slate-200">
                          {alert.message}
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

                    <p className="mt-3 text-xs text-slate-500">
                      {alert.acknowledged
                        ? 'Reconhecido'
                        : 'Aguardando reconhecimento'}
                    </p>
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
