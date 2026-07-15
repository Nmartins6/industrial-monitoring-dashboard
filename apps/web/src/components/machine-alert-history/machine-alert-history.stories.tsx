import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { AlertTransport } from '@industrial-monitoring/contracts';

import { MachineAlertHistory } from './machine-alert-history';

const alerts: AlertTransport[] = [
  {
    id: 'alert-critical',
    level: 'CRITICAL',
    message: 'Temperature exceeded the critical threshold',
    component: 'temperature-sensor',
    timestamp: '2026-07-13T19:00:12.000Z',
    acknowledged: false,
  },
  {
    id: 'alert-warning',
    level: 'WARNING',
    message: 'Motor vibration is above the recommended level',
    component: 'motor',
    timestamp: '2026-07-13T19:00:09.000Z',
    acknowledged: false,
  },
  {
    id: 'alert-info',
    level: 'INFO',
    message: 'Machine monitoring started',
    component: 'monitoring-system',
    timestamp: '2026-07-13T19:00:00.000Z',
    acknowledged: true,
  },
];

const meta = {
  title: 'Componentes/MachineAlertHistory',
  component: MachineAlertHistory,
  args: {
    alerts,
    acknowledgingAlertIds: new Set<string>(),
    acknowledgementErrorAlertIds: new Set<string>(),
    onAcknowledgeAlert: () => undefined,
  },
} satisfies Meta<typeof MachineAlertHistory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    alerts: [],
  },
};

export const Info: Story = {
  args: {
    alerts: [alerts[2]],
  },
};

export const Warning: Story = {
  args: {
    alerts: [alerts[1]],
  },
};

export const UnacknowledgedCritical: Story = {
  args: {
    alerts: [alerts[0]],
  },
};

export const AcknowledgedCritical: Story = {
  args: {
    alerts: [
      {
        ...alerts[0],
        acknowledged: true,
      },
    ],
  },
};

export const MultipleSeverities: Story = {};

export const AcknowledgementError: Story = {
  args: {
    alerts: [alerts[0]],
    acknowledgementErrorAlertIds: new Set(['alert-critical']),
  },
};

export const Acknowledging: Story = {
  args: {
    alerts: [alerts[0]],
    acknowledgingAlertIds: new Set(['alert-critical']),
  },
};
