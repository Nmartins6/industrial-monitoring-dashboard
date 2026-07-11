type MachineState = 'RUNNING' | 'STOPPED' | 'MAINTENANCE' | 'ERROR';

interface MachineReading {
  state: MachineState;
  temperature: number;
  rpm: number;
}

function formatMachineReading(reading: MachineReading): string {
  return [
    `State: ${reading.state}`,
    `Temperature: ${reading.temperature} °C`,
    `RPM: ${reading.rpm}`,
  ].join(' | ');
}

const sampleReading: MachineReading = {
  state: 'RUNNING',
  temperature: 78,
  rpm: 1200,
};

export const formattedReading = formatMachineReading(sampleReading);
