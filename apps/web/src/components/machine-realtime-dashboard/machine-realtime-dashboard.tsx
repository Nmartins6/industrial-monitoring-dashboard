'use client';

import { useEffect, useRef, useState } from 'react';

import { sortAlertsByPriority } from '@industrial-monitoring/contracts';

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

type PlayCriticalAlertSound = () => void;

interface MachineRealtimeDashboardProps {
  initialMachineStatus: MachineStatusTransport;
  initialMetricHistory?: readonly MetricHistoryTransport[];
  initialAlerts?: readonly AlertTransport[];
  connectToMachine?: ConnectToMachine;
  acknowledgeAlert?: AcknowledgeAlert;
  playCriticalAlertSound?: PlayCriticalAlertSound;
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

const CRITICAL_ALERT_SOUND_STORAGE_KEY = 'stw-critical-alert-sound-enabled';

function getStoredCriticalAlertSoundEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(CRITICAL_ALERT_SOUND_STORAGE_KEY) === '1'
    );
  } catch {
    return false;
  }
}

function storeCriticalAlertSoundEnabled(isEnabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      CRITICAL_ALERT_SOUND_STORAGE_KEY,
      isEnabled ? '1' : '0',
    );
  } catch {
    return;
  }
}

const playCriticalAlertWithBrowserAudio: PlayCriticalAlertSound = () => {
  if (
    typeof window === 'undefined' ||
    typeof window.AudioContext === 'undefined'
  ) {
    return;
  }

  const audioContext = new window.AudioContext();

  const playTone = () => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    const startTime = audioContext.currentTime;
    const endTime = startTime + 0.25;

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.addEventListener(
      'ended',
      () => {
        void audioContext.close();
      },
      {
        once: true,
      },
    );

    oscillator.start(startTime);
    oscillator.stop(endTime);
  };

  if (audioContext.state === 'suspended') {
    void audioContext
      .resume()
      .then(() => {
        playTone();
      })
      .catch(() => {
        void audioContext.close();
      });

    return;
  }

  playTone();
};

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
  playCriticalAlertSound,
}: MachineRealtimeDashboardProps) {
  const [machineStatus, setMachineStatus] = useState(initialMachineStatus);

  const [metricHistory, setMetricHistory] = useState<MetricHistoryTransport[]>(
    () => [...(initialMetricHistory ?? [])].slice(-METRIC_HISTORY_LIMIT),
  );

  const [alerts, setAlerts] = useState<AlertTransport[]>(() => [
    ...sortAlertsByPriority(initialAlerts ?? []),
  ]);

  const [acknowledgingAlertIds, setAcknowledgingAlertIds] = useState<
    Set<string>
  >(() => new Set());

  const [acknowledgementErrorAlertIds, setAcknowledgementErrorAlertIds] =
    useState<Set<string>>(() => new Set());

  const [connectionStatus, setConnectionStatus] =
    useState<DisplayConnectionStatus>('connecting');

  const [isCriticalAlertSoundEnabled, setIsCriticalAlertSoundEnabled] =
    useState(getStoredCriticalAlertSoundEnabled);

  const isCriticalAlertSoundEnabledRef = useRef(isCriticalAlertSoundEnabled);

  const isAlertHistoryEnabled = initialAlerts !== undefined;

  const isMetricHistoryEnabled = initialMetricHistory !== undefined;

  const acknowledgeMachineAlert = acknowledgeAlert ?? acknowledgeWithBrowserApi;

  const notifyCriticalAlert =
    playCriticalAlertSound ?? playCriticalAlertWithBrowserAudio;

  useEffect(() => {
    isCriticalAlertSoundEnabledRef.current = isCriticalAlertSoundEnabled;
  }, [isCriticalAlertSoundEnabled]);

  function handleCriticalAlertSoundToggle(): void {
    const nextIsEnabled = !isCriticalAlertSoundEnabled;

    setIsCriticalAlertSoundEnabled(nextIsEnabled);
    storeCriticalAlertSoundEnabled(nextIsEnabled);
  }

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
          setMetricHistory((currentMetricHistory) => {
            // O stream é contínuo; a janela móvel mantém o gráfico leve no
            // navegador enquanto o backend não persiste histórico longo.
            return [...currentMetricHistory, event.payload].slice(
              -METRIC_HISTORY_LIMIT,
            );
          });

          return;
        }

        if (event.type === 'ALERT_CREATED') {
          if (
            event.payload.level === 'CRITICAL' &&
            !event.payload.acknowledged &&
            isCriticalAlertSoundEnabledRef.current
          ) {
            try {
              notifyCriticalAlert();
            } catch {
              // Falha de áudio não deve impedir a atualização do alerta.
            }
          }

          setAlerts((currentAlerts) =>
            sortAlertsByPriority([event.payload, ...currentAlerts]),
          );

          return;
        }

        if (event.type === 'ALERT_UPDATED') {
          setAlerts((currentAlerts) =>
            sortAlertsByPriority(
              currentAlerts.map((alert) =>
                alert.id === event.payload.id ? event.payload : alert,
              ),
            ),
          );
        }
      },

      onConnectionChange(status) {
        setConnectionStatus(status);
      },
    });

    return disconnect;
  }, [connectToMachine, initialMachineStatus.id, notifyCriticalAlert]);

  const connectionStatusStyle = CONNECTION_STATUS_STYLES[connectionStatus];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          aria-pressed={isCriticalAlertSoundEnabled}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
          onClick={handleCriticalAlertSoundToggle}
        >
          {isCriticalAlertSoundEnabled
            ? 'Desativar som de alertas críticos'
            : 'Ativar som de alertas críticos'}
        </button>

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
        <div className="mt-8">
          <MachineAlertHistory
            alerts={alerts}
            acknowledgingAlertIds={acknowledgingAlertIds}
            acknowledgementErrorAlertIds={acknowledgementErrorAlertIds}
            onAcknowledgeAlert={(alertId) => {
              void handleAcknowledgeAlert(alertId);
            }}
          />
        </div>
      ) : null}
    </>
  );
}
