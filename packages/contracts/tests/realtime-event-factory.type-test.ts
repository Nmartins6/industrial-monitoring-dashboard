import {
  createAlertCreatedEvent,
  createAlertUpdatedEvent,
  createConnectedEvent,
  createMachineStatusUpdatedEvent,
  createMetricRecordedEvent,
  type AlertCreatedEvent,
  type AlertUpdatedEvent,
  type ConnectedEvent,
  type MachineStatusUpdatedEvent,
  type MetricRecordedEvent,
} from '../src/index.js';

const emittedAt = '2026-07-12T23:45:03.000Z';

const connectedEvent: ConnectedEvent = createConnectedEvent({
  id: 'event-001',
  emittedAt,
});

const machineStatusEvent: MachineStatusUpdatedEvent =
  createMachineStatusUpdatedEvent({
    id: 'event-002',
    emittedAt,
    payload: {
      id: 'mixer-01',
      timestamp: emittedAt,
      state: 'RUNNING',
      metrics: {
        temperature: 78,
        rpm: 1200,
        uptime: 19_380,
        efficiency: 92,
      },
      oee: {
        overall: 87.5,
        availability: 98,
        performance: 95,
        quality: 94,
      },
    },
  });

const metricRecordedEvent: MetricRecordedEvent = createMetricRecordedEvent({
  id: 'event-003',
  emittedAt,
  payload: {
    timestamp: emittedAt,
    temperature: 78,
    rpm: 1200,
    efficiency: 92,
  },
});

const alertPayload = {
  id: 'alert-temperature-high-001',
  level: 'CRITICAL',
  message: 'Temperature exceeded the critical threshold',
  component: 'temperature-sensor',
  timestamp: emittedAt,
  acknowledged: false,
} as const;

const alertCreatedEvent: AlertCreatedEvent = createAlertCreatedEvent({
  id: 'event-004',
  emittedAt,
  payload: alertPayload,
});

const alertUpdatedEvent: AlertUpdatedEvent = createAlertUpdatedEvent({
  id: 'event-005',
  emittedAt,
  payload: {
    ...alertPayload,
    acknowledged: true,
  },
});

createMetricRecordedEvent({
  id: 'event-invalid',
  emittedAt,
  payload: {
    timestamp: emittedAt,
    temperature: 78,

    // @ts-expect-error RPM must be represented as a number.
    rpm: '1200',

    efficiency: 92,
  },
});

export {
  alertCreatedEvent,
  alertUpdatedEvent,
  connectedEvent,
  machineStatusEvent,
  metricRecordedEvent,
};
