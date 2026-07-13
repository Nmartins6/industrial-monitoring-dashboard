export interface MachineOeeComponents {
  availability: number;
  performance: number;
  quality: number;
}

export interface MachineOeeResult extends MachineOeeComponents {
  overall: number;
}

export interface MachineOeeCalculator {
  calculate(components: MachineOeeComponents): MachineOeeResult;
}

function validateOeeComponents(components: MachineOeeComponents): void {
  const values = [
    components.availability,
    components.performance,
    components.quality,
  ];

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error('OEE components must be finite numbers');
  }
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function createMachineOeeCalculator(): MachineOeeCalculator {
  return {
    calculate(components: MachineOeeComponents): MachineOeeResult {
      validateOeeComponents(components);

      const availability = clampPercentage(components.availability);

      const performance = clampPercentage(components.performance);

      const quality = clampPercentage(components.quality);

      const overall =
        (availability / 100) * (performance / 100) * (quality / 100) * 100;

      return {
        overall: roundToOneDecimal(overall),
        availability,
        performance,
        quality,
      };
    },
  };
}
