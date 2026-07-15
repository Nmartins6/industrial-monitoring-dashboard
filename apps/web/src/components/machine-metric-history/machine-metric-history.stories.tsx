import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { MetricHistoryTransport } from '@industrial-monitoring/contracts';

import { MachineMetricHistory } from './machine-metric-history';

const normalHistory: MetricHistoryTransport[] = [
  {
    timestamp: '2026-07-13T19:00:00.000Z',
    temperature: 76,
    rpm: 1220,
    efficiency: 90,
  },
  {
    timestamp: '2026-07-13T19:00:03.000Z',
    temperature: 77.1,
    rpm: 1210,
    efficiency: 90.5,
  },
  {
    timestamp: '2026-07-13T19:00:06.000Z',
    temperature: 78.4,
    rpm: 1200,
    efficiency: 91,
  },
  {
    timestamp: '2026-07-13T19:00:09.000Z',
    temperature: 78.1,
    rpm: 1235,
    efficiency: 92,
  },
];

const meta = {
  title: 'Componentes/MachineMetricHistory',
  component: MachineMetricHistory,
  args: {
    metricHistory: normalHistory,
  },
} satisfies Meta<typeof MachineMetricHistory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NormalHistory: Story = {};

export const TemperatureRising: Story = {
  args: {
    metricHistory: normalHistory.map((metric, index) => ({
      ...metric,
      temperature: 72 + index * 4,
    })),
  },
};

export const RpmFalling: Story = {
  args: {
    metricHistory: normalHistory.map((metric, index) => ({
      ...metric,
      rpm: 1350 - index * 80,
    })),
  },
};

export const EfficiencyStable: Story = {
  args: {
    metricHistory: normalHistory.map((metric) => ({
      ...metric,
      efficiency: 91,
    })),
  },
};

export const SingleMeasurement: Story = {
  args: {
    metricHistory: [normalHistory[0]],
  },
};

export const EmptyHistory: Story = {
  args: {
    metricHistory: [],
  },
};
