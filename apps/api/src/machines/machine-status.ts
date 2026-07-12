import type { MachineStatus } from '@industrial-monitoring/contracts';

type StoredMachineStatus = Omit<MachineStatus, 'timestamp'>;

const MACHINE_STATUS_BY_ID: Readonly<Record<string, StoredMachineStatus>> = {
  'mixer-01': {
    id: 'mixer-01',
    state: 'RUNNING',
    metrics: {
      temperature: 72,
      rpm: 1200,
      uptime: 28_800,
      efficiency: 92,
    },
    oee: {
      overall: 88.4,
      availability: 96,
      performance: 94,
      quality: 98,
    },
  },
};

export function getMachineStatusSnapshot(
  machineId: string,
): MachineStatus | undefined {
  const storedStatus = MACHINE_STATUS_BY_ID[machineId];

  if (storedStatus === undefined) {
    return undefined;
  }

  return {
    ...storedStatus,
    timestamp: new Date(),
    metrics: {
      ...storedStatus.metrics,
    },
    oee: {
      ...storedStatus.oee,
    },
  };
}
