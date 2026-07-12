import type {
  AlertTransport,
  ISODateString,
  MachineStatusTransport,
  MetricHistoryTransport,
} from './transport.js';

export const REALTIME_EVENT_TYPES = [
  'CONNECTED',
  'MACHINE_STATUS_UPDATED',
  'METRIC_RECORDED',
  'ALERT_CREATED',
  'ALERT_UPDATED',
] as const;

export type RealtimeEventType = (typeof REALTIME_EVENT_TYPES)[number];

interface RealtimeEventBase {
  id: string;
  emittedAt: ISODateString;
}

export interface ConnectedEvent extends RealtimeEventBase {
  type: 'CONNECTED';
  payload: {
    connectedAt: ISODateString;
  };
}

export interface MachineStatusUpdatedEvent extends RealtimeEventBase {
  type: 'MACHINE_STATUS_UPDATED';
  payload: MachineStatusTransport;
}

export interface MetricRecordedEvent extends RealtimeEventBase {
  type: 'METRIC_RECORDED';
  payload: MetricHistoryTransport;
}

export interface AlertCreatedEvent extends RealtimeEventBase {
  type: 'ALERT_CREATED';
  payload: AlertTransport;
}

export interface AlertUpdatedEvent extends RealtimeEventBase {
  type: 'ALERT_UPDATED';
  payload: AlertTransport;
}

export type RealtimeEvent =
  | ConnectedEvent
  | MachineStatusUpdatedEvent
  | MetricRecordedEvent
  | AlertCreatedEvent
  | AlertUpdatedEvent;
