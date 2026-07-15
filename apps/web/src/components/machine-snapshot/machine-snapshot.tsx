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

const MACHINE_STATE_STYLES: Readonly<
  Record<MachineStatusTransport['state'], string>
> = {
  RUNNING: 'border-success/30 bg-success/10 text-success',
  STOPPED: 'border-muted/30 bg-muted/10 text-muted',
  MAINTENANCE: 'border-warning/30 bg-warning/10 text-warning',
  ERROR: 'border-danger/30 bg-danger/10 text-danger',
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
  const machineStateStyle = MACHINE_STATE_STYLES[machineStatus.state];

  return (
    <>
      <section
        aria-labelledby="machine-status-title"
        className="rounded-xl border border-border bg-surface p-6 text-foreground"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 id="machine-status-title" className="text-lg font-semibold">
              Status da máquina
            </h2>

            <time
              aria-label="Última atualização da máquina"
              dateTime={machineStatus.timestamp}
              className="mt-1 block text-sm text-muted"
            >
              Atualizado agora
            </time>
          </div>

          <div
            role="status"
            aria-label="Estado atual da máquina"
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${machineStateStyle}`}
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
            className="rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">Temperatura</h3>

            <p className="mt-3 text-3xl font-semibold">
              {numberFormatter.format(machineStatus.metrics.temperature)} °C
            </p>
          </article>

          <article
            aria-label="Métrica de RPM"
            className="rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">RPM</h3>

            <p className="mt-3 text-3xl font-semibold">
              {integerFormatter.format(machineStatus.metrics.rpm)}
            </p>
          </article>

          <article
            aria-label="Métrica de tempo em operação"
            className="rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">
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
            className="rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">OEE geral</h3>

            <p className="mt-3 text-3xl font-semibold">
              {formatPercentage(machineStatus.oee.overall)}
            </p>
          </article>

          <article
            aria-label="Disponibilidade"
            className="rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">Disponibilidade</h3>

            <p className="mt-3 text-3xl font-semibold">
              {formatPercentage(machineStatus.oee.availability)}
            </p>
          </article>

          <article
            aria-label="Desempenho"
            className="rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">Desempenho</h3>

            <p className="mt-3 text-3xl font-semibold">
              {formatPercentage(machineStatus.oee.performance)}
            </p>
          </article>

          <article
            aria-label="Qualidade"
            className="rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">Qualidade</h3>

            <p className="mt-3 text-3xl font-semibold">
              {formatPercentage(machineStatus.oee.quality)}
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
