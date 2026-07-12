import {
  serializeAlert,
  serializeMachineStatus,
  serializeMetricHistory,
  type Alert,
  type AlertTransport,
  type MachineStatus,
  type MachineStatusTransport,
  type MetricHistory,
  type MetricHistoryTransport,
} from '../src/index.js';

const machineStatus: MachineStatus = {
  id: 'mixer-01',
  timestamp: new Date('2026-07-12T12:00:00.000Z'),
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
};

const alert: Alert = {
  id: 'alert-temperature-high-001',
  level: 'CRITICAL',
  message: 'Temperature exceeded the critical threshold',
  component: 'temperature-sensor',
  timestamp: new Date('2026-07-12T12:00:00.000Z'),
  acknowledged: false,
};

const metricHistory: MetricHistory = {
  timestamp: new Date('2026-07-12T12:00:00.000Z'),
  temperature: 78,
  rpm: 1200,
  efficiency: 92,
};

const machineStatusTransport: MachineStatusTransport =
  serializeMachineStatus(machineStatus);

const alertTransport: AlertTransport = serializeAlert(alert);

const metricHistoryTransport: MetricHistoryTransport =
  serializeMetricHistory(metricHistory);

const invalidAlertTransport: AlertTransport = {
  ...alertTransport,

  // @ts-expect-error Transport timestamps must be strings.
  timestamp: new Date(),
};

export {
  alertTransport,
  invalidAlertTransport,
  machineStatusTransport,
  metricHistoryTransport,
};
