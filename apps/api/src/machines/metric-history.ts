import type { MetricHistory } from '@industrial-monitoring/contracts';

interface StoredMetricHistory extends Omit<MetricHistory, 'timestamp'> {
  timestamp: string;
}

const METRIC_HISTORY_BY_MACHINE_ID: Readonly<
  Record<string, readonly StoredMetricHistory[]>
> = {
  'mixer-01': [
    {
      timestamp: '2026-07-12T10:00:00.000Z',
      temperature: 68,
      rpm: 1100,
      efficiency: 89,
    },
    {
      timestamp: '2026-07-12T10:00:03.000Z',
      temperature: 69,
      rpm: 1140,
      efficiency: 90,
    },
    {
      timestamp: '2026-07-12T10:00:06.000Z',
      temperature: 70,
      rpm: 1170,
      efficiency: 91,
    },
    {
      timestamp: '2026-07-12T10:00:09.000Z',
      temperature: 71,
      rpm: 1190,
      efficiency: 91.5,
    },
    {
      timestamp: '2026-07-12T10:00:12.000Z',
      temperature: 72,
      rpm: 1200,
      efficiency: 92,
    },
  ],
};

export function getMachineMetricHistory(
  machineId: string,
): MetricHistory[] | undefined {
  const storedHistory = METRIC_HISTORY_BY_MACHINE_ID[machineId];

  if (storedHistory === undefined) {
    return undefined;
  }

  return storedHistory.map((metric) => ({
    ...metric,
    timestamp: new Date(metric.timestamp),
  }));
}
