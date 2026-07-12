import type {
  AlertCreatedEvent,
  AlertUpdatedEvent,
  ConnectedEvent,
  MachineStatusUpdatedEvent,
  MetricRecordedEvent,
} from './realtime-event.js';
import type {
  AlertTransport,
  ISODateString,
  MachineStatusTransport,
  MetricHistoryTransport,
} from './transport.js';

interface RealtimeEventMetadata {
  id: string;
  emittedAt: ISODateString;
}

interface RealtimeEventInput<TPayload> extends RealtimeEventMetadata {
  payload: TPayload;
}

export function createConnectedEvent(
  metadata: RealtimeEventMetadata,
): ConnectedEvent {
  return {
    ...metadata,
    type: 'CONNECTED',
    payload: {
      connectedAt: metadata.emittedAt,
    },
  };
}

export function createMachineStatusUpdatedEvent(
  input: RealtimeEventInput<MachineStatusTransport>,
): MachineStatusUpdatedEvent {
  return {
    ...input,
    type: 'MACHINE_STATUS_UPDATED',
  };
}

export function createMetricRecordedEvent(
  input: RealtimeEventInput<MetricHistoryTransport>,
): MetricRecordedEvent {
  return {
    ...input,
    type: 'METRIC_RECORDED',
  };
}

export function createAlertCreatedEvent(
  input: RealtimeEventInput<AlertTransport>,
): AlertCreatedEvent {
  return {
    ...input,
    type: 'ALERT_CREATED',
  };
}

export function createAlertUpdatedEvent(
  input: RealtimeEventInput<AlertTransport>,
): AlertUpdatedEvent {
  return {
    ...input,
    type: 'ALERT_UPDATED',
  };
}
