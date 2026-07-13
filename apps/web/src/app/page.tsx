import type { MachineStatusTransport } from '@industrial-monitoring/contracts';

import { MachineSnapshot } from '@/components/machine-snapshot/machine-snapshot';
import {
  createMachineApiClient,
  MachineApiError,
} from '@/lib/api/machine-api-client';

const ALERT_HISTORY = [
  {
    id: 'alert-003',
    level: 'Critical',
    message: 'A temperatura excedeu o limite crítico',
    component: 'Sensor de temperatura',
    timestamp: '2026-07-12T10:00:12.000Z',
    displayTime: '10:00:12',
    acknowledged: false,
  },
  {
    id: 'alert-002',
    level: 'Warning',
    message: 'A vibração do motor está acima do nível recomendado',
    component: 'Motor',
    timestamp: '2026-07-12T10:00:09.000Z',
    displayTime: '10:00:09',
    acknowledged: false,
  },
  {
    id: 'alert-001',
    level: 'Information',
    message: 'Monitoramento da máquina iniciado',
    component: 'Sistema de monitoramento',
    timestamp: '2026-07-12T10:00:00.000Z',
    displayTime: '10:00:00',
    acknowledged: true,
  },
] as const;

const DEFAULT_API_BASE_URL = 'http://localhost:3333';

const ALERT_LEVEL_LABELS: Record<
  (typeof ALERT_HISTORY)[number]['level'],
  string
> = {
  Critical: 'Crítico',
  Warning: 'Alerta',
  Information: 'Informativo',
};

type LoadMachineStatus = (machineId: string) => Promise<MachineStatusTransport>;

type MachineLoadFailure = 'not-found' | 'unavailable';

interface RenderDashboardPageOptions {
  loadMachineStatus: LoadMachineStatus;
}

export async function renderDashboardPage({
  loadMachineStatus,
}: RenderDashboardPageOptions) {
  let machineStatus: MachineStatusTransport | null = null;

  let machineLoadFailure: MachineLoadFailure | null = null;

  try {
    machineStatus = await loadMachineStatus('mixer-01');
  } catch (error) {
    const isMachineNotFound =
      error instanceof MachineApiError && error.status === 404;

    machineLoadFailure = isMachineNotFound ? 'not-found' : 'unavailable';
  }

  const isConnected = machineStatus !== null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Monitoramento de máquinas
            </p>

            <h1 className="text-2xl font-semibold tracking-tight">
              Painel de Monitoramento Industrial
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Máquina
              </p>

              <p className="font-medium">Mixer 01</p>
            </div>

            <div
              role="status"
              aria-label="Status da conexão em tempo real"
              className={
                isConnected
                  ? 'flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300'
                  : 'flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300'
              }
            >
              <span
                aria-hidden="true"
                className={
                  isConnected
                    ? 'h-2 w-2 rounded-full bg-emerald-400'
                    : 'h-2 w-2 rounded-full bg-red-400'
                }
              />

              {isConnected ? 'Conectado' : 'Desconectado'}
            </div>
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
              </>
            )}
          </section>
        ) : (
          <>
            <MachineSnapshot machineStatus={machineStatus} />

            <section aria-labelledby="alert-history-title" className="mt-6">
              <div className="flex items-center justify-between">
                <h2 id="alert-history-title" className="text-lg font-semibold">
                  Histórico de alertas
                </h2>

                <p className="text-sm text-slate-400">
                  Eventos mais recentes da máquina
                </p>
              </div>

              <ul className="mt-4 space-y-3">
                {ALERT_HISTORY.map((alert) => {
                  const alertLevelLabel = ALERT_LEVEL_LABELS[alert.level];

                  return (
                    <li
                      key={alert.id}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                    >
                      <article>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-sm font-semibold">
                                {alertLevelLabel}
                              </p>

                              <p className="text-xs text-slate-400">
                                {alert.component}
                              </p>
                            </div>

                            <p className="mt-2 text-sm text-slate-200">
                              {alert.message}
                            </p>
                          </div>

                          <time
                            aria-label={`Horário do alerta ${alertLevelLabel.toLowerCase()}`}
                            dateTime={alert.timestamp}
                            className="text-sm text-slate-400"
                          >
                            {alert.displayTime}
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

export default async function Home() {
  return renderDashboardPage({
    loadMachineStatus: loadMachineStatusFromApi,
  });
}
