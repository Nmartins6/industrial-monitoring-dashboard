'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { MetricHistoryTransport } from '@industrial-monitoring/contracts';

interface MachineMetricHistoryProps {
  metricHistory: readonly MetricHistoryTransport[];
}

type MetricDataKey = 'temperature' | 'rpm' | 'efficiency';

interface ChartMetric extends MetricHistoryTransport {
  time: string;
}

interface MetricLineChartProps {
  data: readonly ChartMetric[];
  dataKey: MetricDataKey;
  accessibleLabel: string;
  lineLabel: string;
  stroke: string;
}

type MetricTrend = 'up' | 'down' | 'stable' | 'unavailable';

interface MetricTrendIndicatorProps {
  accessibleLabel: string;
  trend: MetricTrend;
}

function MetricLineChart({
  data,
  dataKey,
  accessibleLabel,
  lineLabel,
  stroke,
}: MetricLineChartProps) {
  return (
    <div role="img" aria-label={accessibleLabel} className="mt-4 h-64 w-full">
      <LineChart
        accessibilityLayer={false}
        data={data}
        width="100%"
        height={256}
        margin={{
          top: 8,
          right: 12,
          bottom: 0,
          left: -12,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

        <XAxis
          dataKey="time"
          minTickGap={24}
          tick={{
            fill: 'var(--muted)',
            fontSize: 12,
          }}
          tickLine={false}
          axisLine={{
            stroke: 'var(--border-strong)',
          }}
        />

        <YAxis
          width={48}
          domain={['auto', 'auto']}
          tick={{
            fill: 'var(--muted)',
            fontSize: 12,
          }}
          tickLine={false}
          axisLine={{
            stroke: 'var(--border-strong)',
          }}
        />

        <Tooltip />

        <Line
          type="monotone"
          dataKey={dataKey}
          name={lineLabel}
          stroke={stroke}
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 4,
          }}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
}

const METRIC_TREND_PRESENTATION: Readonly<
  Record<
    MetricTrend,
    {
      symbol: string;
      label: string;
      className: string;
    }
  >
> = {
  up: {
    symbol: '↑',
    label: 'Em alta',
    className: 'text-info',
  },
  down: {
    symbol: '↓',
    label: 'Em queda',
    className: 'text-info',
  },
  stable: {
    symbol: '→',
    label: 'Estável',
    className: 'text-muted',
  },
  unavailable: {
    symbol: '—',
    label: 'Tendência indisponível',
    className: 'text-muted',
  },
};

function calculateMetricTrend(
  currentValue: number,
  previousValue: number | undefined,
): MetricTrend {
  if (previousValue === undefined) {
    return 'unavailable';
  }

  if (currentValue > previousValue) {
    return 'up';
  }

  if (currentValue < previousValue) {
    return 'down';
  }

  return 'stable';
}

function MetricTrendIndicator({
  accessibleLabel,
  trend,
}: MetricTrendIndicatorProps) {
  const presentation = METRIC_TREND_PRESENTATION[trend];

  return (
    <p
      role="status"
      aria-label={accessibleLabel}
      className={`mt-2 flex items-center gap-1 text-sm font-medium ${presentation.className}`}
    >
      <span aria-hidden="true">{presentation.symbol}</span>

      <span>{presentation.label}</span>
    </p>
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

const metricNumberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

const metricTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function MachineMetricHistory({
  metricHistory,
}: MachineMetricHistoryProps) {
  const latestMetric = metricHistory[metricHistory.length - 1];

  const previousMetric =
    metricHistory.length >= 2
      ? metricHistory[metricHistory.length - 2]
      : undefined;

  const chartData: ChartMetric[] = metricHistory.map((metric) => ({
    ...metric,
    time: metricTimeFormatter.format(new Date(metric.timestamp)),
  }));

  const temperatureTrend: MetricTrend =
    latestMetric === undefined
      ? 'unavailable'
      : calculateMetricTrend(
          latestMetric.temperature,
          previousMetric?.temperature,
        );

  const rotationTrend: MetricTrend =
    latestMetric === undefined
      ? 'unavailable'
      : calculateMetricTrend(latestMetric.rpm, previousMetric?.rpm);

  const efficiencyTrend: MetricTrend =
    latestMetric === undefined
      ? 'unavailable'
      : calculateMetricTrend(
          latestMetric.efficiency,
          previousMetric?.efficiency,
        );

  const latestTemperatureLabel =
    latestMetric === undefined
      ? ''
      : `${metricNumberFormatter.format(latestMetric.temperature)} °C`;

  const latestRpmLabel =
    latestMetric === undefined
      ? ''
      : `${metricNumberFormatter.format(latestMetric.rpm)} RPM`;

  const latestEfficiencyLabel =
    latestMetric === undefined
      ? ''
      : `${metricNumberFormatter.format(latestMetric.efficiency)}%`;

  return (
    <section aria-labelledby="machine-metric-history-title" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="machine-metric-history-title" className="text-lg font-semibold">
          Histórico de métricas
        </h2>

        <p className="text-sm text-muted">
          {metricHistory.length}{' '}
          {metricHistory.length === 1 ? 'medição' : 'medições'} no período
        </p>
      </div>

      {latestMetric === undefined ? (
        <p className="mt-4 rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Nenhuma medição disponível.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <article
              aria-label="Resumo da temperatura"
              className="dashboard-card rounded-lg border border-border bg-surface p-4 text-sm text-foreground"
            >
              <p>
                Última temperatura:{' '}
                <strong>
                  <AnimatedValue valueKey={latestMetric.temperature}>
                    {latestTemperatureLabel}
                  </AnimatedValue>
                </strong>
              </p>

              <MetricTrendIndicator
                accessibleLabel="Tendência da temperatura"
                trend={temperatureTrend}
              />
            </article>

            <article
              aria-label="Resumo da rotação"
              className="dashboard-card rounded-lg border border-border bg-surface p-4 text-sm text-foreground"
            >
              <p>
                Última rotação:{' '}
                <strong>
                  <AnimatedValue valueKey={latestMetric.rpm}>
                    {latestRpmLabel}
                  </AnimatedValue>
                </strong>
              </p>

              <MetricTrendIndicator
                accessibleLabel="Tendência da rotação"
                trend={rotationTrend}
              />
            </article>

            <article
              aria-label="Resumo da eficiência"
              className="dashboard-card rounded-lg border border-border bg-surface p-4 text-sm text-foreground"
            >
              <p>
                Última eficiência:{' '}
                <strong>
                  <AnimatedValue valueKey={latestMetric.efficiency}>
                    {latestEfficiencyLabel}
                  </AnimatedValue>
                </strong>
              </p>

              <MetricTrendIndicator
                accessibleLabel="Tendência da eficiência"
                trend={efficiencyTrend}
              />
            </article>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <figure
              aria-labelledby="temperature-history-title"
              className="dashboard-card rounded-xl border border-border bg-surface p-5 text-foreground"
            >
              <figcaption
                id="temperature-history-title"
                className="font-semibold"
              >
                Histórico de temperatura
              </figcaption>

              <MetricLineChart
                data={chartData}
                dataKey="temperature"
                accessibleLabel="Gráfico de temperatura ao longo do tempo"
                lineLabel="Temperatura"
                stroke="var(--warning)"
              />
            </figure>

            <figure
              aria-labelledby="rotation-history-title"
              className="dashboard-card rounded-xl border border-border bg-surface p-5 text-foreground"
            >
              <figcaption id="rotation-history-title" className="font-semibold">
                Histórico de rotação
              </figcaption>

              <MetricLineChart
                data={chartData}
                dataKey="rpm"
                accessibleLabel="Gráfico de rotação ao longo do tempo"
                lineLabel="Rotação"
                stroke="var(--info)"
              />
            </figure>

            <figure
              aria-labelledby="efficiency-history-title"
              className="dashboard-card rounded-xl border border-border bg-surface p-5 text-foreground"
            >
              <figcaption
                id="efficiency-history-title"
                className="font-semibold"
              >
                Histórico de eficiência
              </figcaption>

              <MetricLineChart
                data={chartData}
                dataKey="efficiency"
                accessibleLabel="Gráfico de eficiência ao longo do tempo"
                lineLabel="Eficiência"
                stroke="var(--success)"
              />
            </figure>
          </div>
        </>
      )}
    </section>
  );
}
