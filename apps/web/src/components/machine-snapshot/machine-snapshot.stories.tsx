import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { MachineStatusTransport } from '@industrial-monitoring/contracts';

import { MachineSnapshot } from './machine-snapshot';

const baseMachineStatus: MachineStatusTransport = {
  id: 'mixer-01',
  timestamp: '2026-07-13T19:00:00.000Z',
  state: 'RUNNING',
  metrics: {
    temperature: 78.4,
    rpm: 1200,
    uptime: 19_380,
    efficiency: 92,
  },
  oee: {
    overall: 87.4,
    availability: 96,
    performance: 94,
    quality: 97,
  },
};

const meta = {
  title: 'Componentes/MachineSnapshot',
  component: MachineSnapshot,
  args: {
    machineStatus: baseMachineStatus,
  },
} satisfies Meta<typeof MachineSnapshot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const Stopped: Story = {
  args: {
    machineStatus: {
      ...baseMachineStatus,
      state: 'STOPPED',
      metrics: {
        ...baseMachineStatus.metrics,
        rpm: 0,
        efficiency: 0,
      },
    },
  },
};

export const Maintenance: Story = {
  args: {
    machineStatus: {
      ...baseMachineStatus,
      state: 'MAINTENANCE',
      metrics: {
        ...baseMachineStatus.metrics,
        rpm: 0,
        efficiency: 0,
      },
    },
  },
};

export const Error: Story = {
  args: {
    machineStatus: {
      ...baseMachineStatus,
      state: 'ERROR',
      metrics: {
        ...baseMachineStatus.metrics,
        temperature: 93.5,
        rpm: 0,
        efficiency: 0,
      },
      oee: {
        overall: 0,
        availability: 71,
        performance: 0,
        quality: 92,
      },
    },
  },
};

export const IntermediateOee: Story = {
  args: {
    machineStatus: {
      ...baseMachineStatus,
      oee: {
        overall: 51.2,
        availability: 80,
        performance: 72,
        quality: 89,
      },
    },
  },
};

export const VisualLimits: Story = {
  args: {
    machineStatus: {
      ...baseMachineStatus,
      oee: {
        overall: 0,
        availability: 100,
        performance: 0,
        quality: 100,
      },
    },
  },
};
