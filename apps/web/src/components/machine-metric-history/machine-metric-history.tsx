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
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

        <XAxis
          dataKey="time"
          minTickGap={24}
          tick={{
            fill: '#94a3b8',
            fontSize: 12,
          }}
          tickLine={false}
          axisLine={{
            stroke: '#475569',
          }}
        />

        <YAxis
          width={48}
          domain={['auto', 'auto']}
          tick={{
            fill: '#94a3b8',
            fontSize: 12,
          }}
          tickLine={false}
          axisLine={{
            stroke: '#475569',
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

  const chartData: ChartMetric[] = metricHistory.map((metric) => ({
    ...metric,
    time: metricTimeFormatter.format(new Date(metric.timestamp)),
  }));

  return (
    <section aria-labelledby="machine-metric-history-title" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="machine-metric-history-title" className="text-lg font-semibold">
          Histórico de métricas
        </h2>

        <p className="text-sm text-slate-400">
          {metricHistory.length}{' '}
          {metricHistory.length === 1 ? 'medição' : 'medições'} no período
        </p>
      </div>

      {latestMetric === undefined ? (
        <p className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
          Nenhuma medição disponível.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <p className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
              Última temperatura:{' '}
              <strong>
                {metricNumberFormatter.format(latestMetric.temperature)} °C
              </strong>
            </p>

            <p className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
              Última rotação:{' '}
              <strong>
                {metricNumberFormatter.format(latestMetric.rpm)} RPM
              </strong>
            </p>

            <p className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
              Última eficiência:{' '}
              <strong>
                {metricNumberFormatter.format(latestMetric.efficiency)}%
              </strong>
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <figure
              aria-labelledby="temperature-history-title"
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
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
                stroke="#f97316"
              />
            </figure>

            <figure
              aria-labelledby="rotation-history-title"
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <figcaption id="rotation-history-title" className="font-semibold">
                Histórico de rotação
              </figcaption>

              <MetricLineChart
                data={chartData}
                dataKey="rpm"
                accessibleLabel="Gráfico de rotação ao longo do tempo"
                lineLabel="Rotação"
                stroke="#38bdf8"
              />
            </figure>

            <figure
              aria-labelledby="efficiency-history-title"
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
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
                stroke="#22c55e"
              />
            </figure>
          </div>
        </>
      )}
    </section>
  );
}
