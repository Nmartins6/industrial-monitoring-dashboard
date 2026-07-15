import type {
  AlertTransport,
  MachineStatusTransport,
  MetricHistoryTransport,
} from '@industrial-monitoring/contracts';

import {
  createMachineApiClient,
  MachineApiError,
} from '@/lib/api/machine-api-client';

import { BrandLogo } from '@/components/brand-logo/brand-logo';
import { MachineDataRetry } from '@/components/machine-data-retry/machine-data-retry';
import { MachineRealtimeDashboard } from '@/components/machine-realtime-dashboard/machine-realtime-dashboard';
import { ThemeSelector } from '@/components/theme-selector/theme-selector';

const DEFAULT_API_BASE_URL = 'http://localhost:3333';

type LoadMachineStatus = (machineId: string) => Promise<MachineStatusTransport>;

type LoadMetricHistory = (
  machineId: string,
) => Promise<MetricHistoryTransport[]>;

type LoadAlertHistory = (machineId: string) => Promise<AlertTransport[]>;

type MachineLoadFailure = 'not-found' | 'unavailable';

interface RenderDashboardPageOptions {
  loadMachineStatus: LoadMachineStatus;
  loadMetricHistory?: LoadMetricHistory;
  loadAlertHistory?: LoadAlertHistory;
  retryMachineData?: () => void;
}

export async function renderDashboardPage({
  loadMachineStatus,
  loadMetricHistory,
  loadAlertHistory,
  retryMachineData,
}: RenderDashboardPageOptions) {
  let machineStatus: MachineStatusTransport | null = null;

  let metricHistory: MetricHistoryTransport[] | undefined;

  let machineLoadFailure: MachineLoadFailure | null = null;

  let alertHistory: AlertTransport[] | undefined;

  try {
    machineStatus = await loadMachineStatus('mixer-01');

    if (loadMetricHistory !== undefined) {
      metricHistory = await loadMetricHistory('mixer-01');
    }

    if (loadAlertHistory !== undefined) {
      alertHistory = await loadAlertHistory('mixer-01');
    }
  } catch (error) {
    const isMachineNotFound =
      error instanceof MachineApiError && error.status === 404;

    machineLoadFailure = isMachineNotFound ? 'not-found' : 'unavailable';
  }

  const isConnected = machineStatus !== null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface text-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <BrandLogo />

            <div>
              <p className="text-sm font-medium text-muted">
                Monitoramento de máquinas
              </p>

              <h1 className="text-2xl font-semibold tracking-tight">
                Painel de Monitoramento Industrial
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ThemeSelector />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">
                Máquina
              </p>

              <p className="font-medium">Mixer 01</p>
            </div>

            {!isConnected ? (
              <div
                role="status"
                aria-label="Status da conexão em tempo real"
                className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300"
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-red-400"
                />
                Desconectado
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {machineStatus === null ? (
          <section
            role="alert"
            aria-labelledby={
              machineLoadFailure === 'not-found'
                ? 'machine-not-found-title'
                : 'machine-data-unavailable-title'
            }
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-6"
          >
            {machineLoadFailure === 'not-found' ? (
              <>
                <h2
                  id="machine-not-found-title"
                  className="text-lg font-semibold text-red-200"
                >
                  Máquina não encontrada
                </h2>

                <p className="mt-2 text-sm text-red-100">
                  A máquina monitorada não foi encontrada.
                </p>
              </>
            ) : (
              <>
                <h2
                  id="machine-data-unavailable-title"
                  className="text-lg font-semibold text-red-200"
                >
                  Dados da máquina indisponíveis
                </h2>

                <p className="mt-2 text-sm text-red-100">
                  Não foi possível carregar os dados mais recentes da máquina.
                </p>

                <MachineDataRetry onRetry={retryMachineData} />
              </>
            )}
          </section>
        ) : (
          <>
            <MachineRealtimeDashboard
              initialMachineStatus={machineStatus}
              initialMetricHistory={metricHistory}
              initialAlerts={alertHistory}
            />
          </>
        )}
      </main>
    </div>
  );
}

async function loadMachineStatusFromApi(
  machineId: string,
): Promise<MachineStatusTransport> {
  const client = createMachineApiClient({
    baseUrl: process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
    fetch: globalThis.fetch,
  });

  return client.getMachineStatus(machineId);
}

async function loadMetricHistoryFromApi(
  machineId: string,
): Promise<MetricHistoryTransport[]> {
  const client = createMachineApiClient({
    baseUrl: process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
    fetch: globalThis.fetch,
  });

  return client.getMetricHistory(machineId);
}

async function loadAlertHistoryFromApi(
  machineId: string,
): Promise<AlertTransport[]> {
  const client = createMachineApiClient({
    baseUrl: process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
    fetch: globalThis.fetch,
  });

  return client.getAlertHistory(machineId);
}

export default async function Home() {
  return renderDashboardPage({
    loadMachineStatus: loadMachineStatusFromApi,
    loadMetricHistory: loadMetricHistoryFromApi,
    loadAlertHistory: loadAlertHistoryFromApi,
  });
}
