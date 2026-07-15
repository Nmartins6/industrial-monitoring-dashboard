import type { MachineStatusTransport } from '@industrial-monitoring/contracts';

interface MachineSnapshotProps {
  machineStatus: MachineStatusTransport;
}

interface OeeProgressBarProps {
  accessibleLabel: string;
  value: number;
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

function normalizePercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function OeeProgressBar({ accessibleLabel, value }: OeeProgressBarProps) {
  const normalizedValue = normalizePercentage(value);

  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-secondary">
      <div
        role="progressbar"
        aria-label={accessibleLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
        aria-valuetext={formatPercentage(normalizedValue)}
        className="h-full rounded-full bg-primary transition-[width]"
        style={{
          width: `${normalizedValue}%`,
        }}
      />
    </div>
  );
}

function AnimatedValue({
  children,
  valueKey,
}: {
  children: string;
  valueKey: string | number;
}) {
  return (
    <span key={valueKey} className="metric-value-change">
      {children}
    </span>
  );
}

export function MachineSnapshot({ machineStatus }: MachineSnapshotProps) {
  const machineStateStyle = MACHINE_STATE_STYLES[machineStatus.state];

  const temperatureLabel = `${numberFormatter.format(
    machineStatus.metrics.temperature,
  )} °C`;

  const rpmLabel = integerFormatter.format(machineStatus.metrics.rpm);

  const uptimeLabel = formatUptime(machineStatus.metrics.uptime);

  const overallOeeLabel = formatPercentage(machineStatus.oee.overall);

  const availabilityLabel = formatPercentage(machineStatus.oee.availability);

  const performanceLabel = formatPercentage(machineStatus.oee.performance);

  const qualityLabel = formatPercentage(machineStatus.oee.quality);

  return (
    <>
      <section
        aria-labelledby="machine-status-title"
        className="dashboard-card rounded-xl border border-border bg-surface p-6 text-foreground"
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
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
            className={`self-start rounded-full border px-4 py-2 text-sm font-semibold ${machineStateStyle}`}
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
            className="dashboard-card rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">Temperatura</h3>

            <p className="mt-3 text-3xl font-semibold">
              <AnimatedValue valueKey={machineStatus.metrics.temperature}>
                {temperatureLabel}
              </AnimatedValue>
            </p>
          </article>

          <article
            aria-label="Métrica de RPM"
            className="dashboard-card rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">RPM</h3>

            <p className="mt-3 text-3xl font-semibold">
              <AnimatedValue valueKey={machineStatus.metrics.rpm}>
                {rpmLabel}
              </AnimatedValue>
            </p>
          </article>

          <article
            aria-label="Métrica de tempo em operação"
            className="dashboard-card rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">
              Tempo em operação
            </h3>

            <p className="mt-3 text-3xl font-semibold">
              <AnimatedValue valueKey={machineStatus.metrics.uptime}>
                {uptimeLabel}
              </AnimatedValue>
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
            className="dashboard-card rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">OEE geral</h3>

            <p className="mt-3 text-3xl font-semibold">
              <AnimatedValue valueKey={machineStatus.oee.overall}>
                {overallOeeLabel}
              </AnimatedValue>
            </p>

            <OeeProgressBar
              accessibleLabel="Progresso do OEE geral"
              value={machineStatus.oee.overall}
            />
          </article>

          <article
            aria-label="Disponibilidade"
            className="dashboard-card rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">Disponibilidade</h3>

            <p className="mt-3 text-3xl font-semibold">
              <AnimatedValue valueKey={machineStatus.oee.availability}>
                {availabilityLabel}
              </AnimatedValue>
            </p>

            <OeeProgressBar
              accessibleLabel="Progresso da disponibilidade"
              value={machineStatus.oee.availability}
            />
          </article>

          <article
            aria-label="Desempenho"
            className="dashboard-card rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">Desempenho</h3>

            <p className="mt-3 text-3xl font-semibold">
              <AnimatedValue valueKey={machineStatus.oee.performance}>
                {performanceLabel}
              </AnimatedValue>
            </p>

            <OeeProgressBar
              accessibleLabel="Progresso do desempenho"
              value={machineStatus.oee.performance}
            />
          </article>

          <article
            aria-label="Qualidade"
            className="dashboard-card rounded-xl border border-border bg-surface p-6 text-foreground"
          >
            <h3 className="text-sm font-medium text-muted">Qualidade</h3>

            <p className="mt-3 text-3xl font-semibold">
              <AnimatedValue valueKey={machineStatus.oee.quality}>
                {qualityLabel}
              </AnimatedValue>
            </p>

            <OeeProgressBar
              accessibleLabel="Progresso da qualidade"
              value={machineStatus.oee.quality}
            />
          </article>
        </div>
      </section>
    </>
  );
}
