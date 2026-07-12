import type {
  AlertCreatedEvent,
  ConnectedEvent,
  MachineStatusUpdatedEvent,
  MetricRecordedEvent,
  RealtimeEvent,
  RealtimeEventType,
} from '../src/index.js';

const connectedEvent: ConnectedEvent = {
  id: 'event-001',
  type: 'CONNECTED',
  emittedAt: '2026-07-12T23:45:00.000Z',
  payload: {
    connectedAt: '2026-07-12T23:45:00.000Z',
  },
};

const machineStatusEvent: MachineStatusUpdatedEvent = {
  id: 'event-002',
  type: 'MACHINE_STATUS_UPDATED',
  emittedAt: '2026-07-12T23:45:03.000Z',
  payload: {
    id: 'mixer-01',
    timestamp: '2026-07-12T23:45:03.000Z',
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
};

const metricRecordedEvent: MetricRecordedEvent = {
  id: 'event-003',
  type: 'METRIC_RECORDED',
  emittedAt: '2026-07-12T23:45:03.000Z',
  payload: {
    timestamp: '2026-07-12T23:45:03.000Z',
    temperature: 78,
    rpm: 1200,
    efficiency: 92,
  },
};

const alertCreatedEvent: AlertCreatedEvent = {
  id: 'event-004',
  type: 'ALERT_CREATED',
  emittedAt: '2026-07-12T23:45:03.000Z',
  payload: {
    id: 'alert-temperature-high-001',
    level: 'CRITICAL',
    message: 'Temperature exceeded the critical threshold',
    component: 'temperature-sensor',
    timestamp: '2026-07-12T23:45:03.000Z',
    acknowledged: false,
  },
};

const validEventType: RealtimeEventType = 'MACHINE_STATUS_UPDATED';

// @ts-expect-error UNKNOWN is not a valid realtime event type.
const invalidEventType: RealtimeEventType = 'UNKNOWN';

function getEventDescription(event: RealtimeEvent): string {
  switch (event.type) {
    case 'CONNECTED':
      return `Connected at ${event.payload.connectedAt}`;

    case 'MACHINE_STATUS_UPDATED':
      return `Machine state: ${event.payload.state}`;

    case 'METRIC_RECORDED':
      return `Temperature: ${event.payload.temperature}`;

    case 'ALERT_CREATED':
      return `Alert created: ${event.payload.message}`;

    case 'ALERT_UPDATED':
      return `Alert updated: ${event.payload.message}`;
  }
}

export {
  alertCreatedEvent,
  connectedEvent,
  getEventDescription,
  invalidEventType,
  machineStatusEvent,
  metricRecordedEvent,
  validEventType,
};
