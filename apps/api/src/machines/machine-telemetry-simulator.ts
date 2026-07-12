import type { MachineStatus } from '@industrial-monitoring/contracts';

export interface TelemetryRandomSource {
  next(): number;
}

export interface MachineTelemetrySimulator {
  next(previousStatus: MachineStatus, timestamp: Date): MachineStatus;
}

export interface CreateMachineTelemetrySimulatorOptions {
  randomSource?: TelemetryRandomSource;
}

const systemTelemetryRandomSource: TelemetryRandomSource = {
  next(): number {
    return Math.random();
  },
};

function validateRandomValue(randomValue: number): number {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue > 1) {
    throw new Error('Telemetry random value must be between 0 and 1');
  }

  return randomValue;
}

function calculateVariation(
  randomValue: number,
  minimum: number,
  maximum: number,
): number {
  const validatedRandomValue = validateRandomValue(randomValue);

  return minimum + validatedRandomValue * (maximum - minimum);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function calculateElapsedSeconds(
  previousTimestamp: Date,
  currentTimestamp: Date,
): number {
  const elapsedMilliseconds =
    currentTimestamp.getTime() - previousTimestamp.getTime();

  return Math.max(0, Math.floor(elapsedMilliseconds / 1_000));
}

export function createMachineTelemetrySimulator(
  options: CreateMachineTelemetrySimulatorOptions = {},
): MachineTelemetrySimulator {
  const randomSource = options.randomSource ?? systemTelemetryRandomSource;

  return {
    next(previousStatus: MachineStatus, timestamp: Date): MachineStatus {
      const temperatureVariation = calculateVariation(
        randomSource.next(),
        -2,
        2,
      );

      const rpmVariation = calculateVariation(randomSource.next(), -100, 100);

      const efficiencyVariation = calculateVariation(
        randomSource.next(),
        -2,
        2,
      );

      const elapsedSeconds = calculateElapsedSeconds(
        previousStatus.timestamp,
        timestamp,
      );

      return {
        id: previousStatus.id,
        timestamp: new Date(timestamp.getTime()),
        state: previousStatus.state,
        metrics: {
          temperature: roundToOneDecimal(
            clamp(
              previousStatus.metrics.temperature + temperatureVariation,
              0,
              Number.MAX_SAFE_INTEGER,
            ),
          ),
          rpm: Math.round(
            clamp(
              previousStatus.metrics.rpm + rpmVariation,
              0,
              Number.MAX_SAFE_INTEGER,
            ),
          ),
          uptime: previousStatus.metrics.uptime + elapsedSeconds,
          efficiency: roundToOneDecimal(
            clamp(
              previousStatus.metrics.efficiency + efficiencyVariation,
              0,
              100,
            ),
          ),
        },
        oee: {
          ...previousStatus.oee,
        },
      };
    },
  };
}
