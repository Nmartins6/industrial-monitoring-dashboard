export const MACHINE_STATES = [
  'RUNNING',
  'STOPPED',
  'MAINTENANCE',
  'ERROR',
] as const;

export type MachineState = (typeof MACHINE_STATES)[number];

export interface MachineMetrics {
  temperature: number;
  rpm: number;
  uptime: number;
  efficiency: number;
}

export interface OeeMetrics {
  overall: number;
  availability: number;
  performance: number;
  quality: number;
}

export interface MachineStatus {
  id: string;
  timestamp: Date;
  state: MachineState;
  metrics: MachineMetrics;
  oee: OeeMetrics;
}
