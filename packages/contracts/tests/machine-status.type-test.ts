import {
  MACHINE_STATES,
  type MachineState,
  type MachineStatus,
} from '../src/index.js';

const validMachineStatus: MachineStatus = {
  id: 'mixer-01',
  timestamp: new Date(),
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

const validState: MachineState = 'MAINTENANCE';

const invalidMachineStatus: MachineStatus = {
  ...validMachineStatus,

  // @ts-expect-error PAUSED is not a valid machine state.
  state: 'PAUSED',
};

export { invalidMachineStatus, MACHINE_STATES, validMachineStatus, validState };
