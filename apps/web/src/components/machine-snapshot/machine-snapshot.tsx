import type { MachineStatusTransport } from '@industrial-monitoring/contracts';

interface MachineSnapshotProps {
  machineStatus: MachineStatusTransport;
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

const MACHINE_STATE_LABELS: Record<MachineStatusTransport['state'], string> = {
  RUNNING: 'Em operação',
  STOPPED: 'Parada',
  MAINTENANCE: 'Em manutenção',
  ERROR: 'Com erro',
};

function formatUptime(uptimeInSeconds: number): string {
  const totalMinutes = Math.floor(uptimeInSeconds / 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} h`);
  }

  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes} min`);
  }

  return parts.join(' ');
}

function formatPercentage(value: number): string {
  return `${numberFormatter.format(value)}%`;
}

export function MachineSnapshot({ machineStatus }: MachineSnapshotProps) {
  return (
    <>
      <section
        aria-labelledby="machine-status-title"
        className="rounded-xl border border-slate-800 bg-slate-900 p-6"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 id="machine-status-title" className="text-lg font-semibold">
              Status da máquina
            </h2>

            <time
              aria-label="Última atualização da máquina"
              dateTime={machineStatus.timestamp}
              className="mt-1 block text-sm text-slate-400"
            >
              Atualizado agora
            </time>
          </div>

          <div
            role="status"
            aria-label="Estado atual da máquina"
            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300"
          >
            {MACHINE_STATE_LABELS[machineStatus.state]}
          </div>
        </div>
      </section>

      <section aria-labelledby="current-metrics-title" className="mt-6">
        <h2 id="current-metrics-title" className="text-lg font-semibold">
          Métricas atuais
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            aria-label="Métrica de temperatura"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="text-sm font-medium text-slate-400">Temperatura</h3>

            <p className="mt-3 text-3xl font-semibold">
              {numberFormatter.format(machineStatus.metrics.temperature)} °C
            </p>
          </article>

          <article
            aria-label="Métrica de RPM"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="text-sm font-medium text-slate-400">RPM</h3>

            <p className="mt-3 text-3xl font-semibold">
              {integerFormatter.format(machineStatus.metrics.rpm)}
            </p>
          </article>

          <article
            aria-label="Métrica de tempo em operação"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="text-sm font-medium text-slate-400">
              Tempo em operação
            </h3>

            <p className="mt-3 text-3xl font-semibold">
              {formatUptime(machineStatus.metrics.uptime)}
            </p>
          </article>
        </div>
      </section>

      <section aria-labelledby="oee-title" className="mt-6">
        <h2 id="oee-title" className="text-lg font-semibold">
          Eficiência global do equipamento (OEE)
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article
            aria-label="OEE geral"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="text-sm font-medium text-slate-400">OEE geral</h3>

            <p className="mt-3 text-3xl font-semibold">
              {formatPercentage(machineStatus.oee.overall)}
            </p>
          </article>

          <article
            aria-label="Disponibilidade"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="text-sm font-medium text-slate-400">
              Disponibilidade
            </h3>

            <p className="mt-3 text-3xl font-semibold">
              {formatPercentage(machineStatus.oee.availability)}
            </p>
          </article>

          <article
            aria-label="Desempenho"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="text-sm font-medium text-slate-400">Desempenho</h3>

            <p className="mt-3 text-3xl font-semibold">
              {formatPercentage(machineStatus.oee.performance)}
            </p>
          </article>

          <article
            aria-label="Qualidade"
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h3 className="text-sm font-medium text-slate-400">Qualidade</h3>

            <p className="mt-3 text-3xl font-semibold">
              {formatPercentage(machineStatus.oee.quality)}
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
