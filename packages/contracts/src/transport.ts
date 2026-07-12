import type { Alert, AlertLevel } from './alert.js';
import type {
  MachineMetrics,
  MachineState,
  MachineStatus,
  OeeMetrics,
} from './machine-status.js';
import type { MetricHistory } from './metric-history.js';

export type ISODateString = string;

export interface MachineStatusTransport {
  id: string;
  timestamp: ISODateString;
  state: MachineState;
  metrics: MachineMetrics;
  oee: OeeMetrics;
}

export interface AlertTransport {
  id: string;
  level: AlertLevel;
  message: string;
  component: string;
  timestamp: ISODateString;
  acknowledged: boolean;
}

export interface MetricHistoryTransport {
  timestamp: ISODateString;
  temperature: number;
  rpm: number;
  efficiency: number;
}

export function serializeMachineStatus(
  machineStatus: MachineStatus,
): MachineStatusTransport {
  return {
    ...machineStatus,
    timestamp: machineStatus.timestamp.toISOString(),
  };
}

export function serializeAlert(alert: Alert): AlertTransport {
  return {
    ...alert,
    timestamp: alert.timestamp.toISOString(),
  };
}

export function serializeMetricHistory(
  metricHistory: MetricHistory,
): MetricHistoryTransport {
  return {
    ...metricHistory,
    timestamp: metricHistory.timestamp.toISOString(),
  };
}
