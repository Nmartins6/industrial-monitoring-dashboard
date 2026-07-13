import { describe, expect, it } from '@jest/globals';

import type { MachineStatus } from '@industrial-monitoring/contracts';

import {
  createMachineTelemetrySimulator,
  type TelemetryRandomSource,
} from '../src/machines/machine-telemetry-simulator.js';

class SequenceTelemetryRandomSource implements TelemetryRandomSource {
  private currentIndex = 0;

  constructor(private readonly values: readonly number[]) {}

  next(): number {
    const value = this.values[this.currentIndex];

    if (value === undefined) {
      throw new Error('No deterministic random value is available');
    }

    this.currentIndex += 1;

    return value;
  }
}

describe('Machine telemetry simulator', () => {
  it('creates the next telemetry snapshot deterministically', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
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
    };

    const randomSource = new SequenceTelemetryRandomSource([
      0.75, 0.25, 0.6, 0.5, 0.5,
    ]);

    const simulator = createMachineTelemetrySimulator({
      randomSource,
    });

    const nextStatus = simulator.next(
      previousStatus,
      new Date('2026-07-12T15:00:03.000Z'),
    );

    expect(nextStatus).toEqual({
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      state: 'RUNNING',
      metrics: {
        temperature: 73,
        rpm: 1150,
        uptime: 28_803,
        efficiency: 92.4,
      },
      oee: {
        overall: 86.9,
        availability: 96,
        performance: 92.4,
        quality: 98,
      },
    });

    expect(nextStatus).not.toBe(previousStatus);
    expect(nextStatus.metrics).not.toBe(previousStatus.metrics);

    expect(previousStatus.metrics).toEqual({
      temperature: 72,
      rpm: 1200,
      uptime: 28_800,
      efficiency: 92,
    });
  });

  it('keeps simulated metrics within valid limits', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
      state: 'RUNNING',
      metrics: {
        temperature: 0.5,
        rpm: 50,
        uptime: 28_800,
        efficiency: 99.5,
      },
      oee: {
        overall: 88.4,
        availability: 96,
        performance: 94,
        quality: 98,
      },
    };

    const randomSource = new SequenceTelemetryRandomSource([0, 0, 1, 0.5, 0.5]);

    const simulator = createMachineTelemetrySimulator({
      randomSource,
    });

    const nextStatus = simulator.next(
      previousStatus,
      new Date('2026-07-12T15:00:03.000Z'),
    );

    expect(nextStatus.metrics).toEqual({
      temperature: 0,
      rpm: 0,
      uptime: 28_803,
      efficiency: 100,
    });
  });

  it('does not reduce uptime or efficiency below zero', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
      state: 'RUNNING',
      metrics: {
        temperature: 72,
        rpm: 1200,
        uptime: 28_800,
        efficiency: 0.5,
      },
      oee: {
        overall: 88.4,
        availability: 96,
        performance: 94,
        quality: 98,
      },
    };

    const randomSource = new SequenceTelemetryRandomSource([
      0.5, 0.5, 0, 0.5, 0.5,
    ]);

    const simulator = createMachineTelemetrySimulator({
      randomSource,
    });

    const nextStatus = simulator.next(
      previousStatus,
      new Date('2026-07-12T14:59:57.000Z'),
    );

    expect(nextStatus.metrics).toEqual({
      temperature: 72,
      rpm: 1200,
      uptime: 28_800,
      efficiency: 0,
    });
  });

  it.each([-0.1, 1.1])(
    'rejects the random value %s when it is outside the valid range',
    (invalidRandomValue) => {
      const previousStatus: MachineStatus = {
        id: 'mixer-01',
        timestamp: new Date('2026-07-12T15:00:00.000Z'),
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
      };

      const randomSource = new SequenceTelemetryRandomSource([
        invalidRandomValue,
        0.5,
        0.5,
        0.5,
        0.5,
      ]);

      const simulator = createMachineTelemetrySimulator({
        randomSource,
      });

      expect(() => {
        simulator.next(previousStatus, new Date('2026-07-12T15:00:03.000Z'));
      }).toThrow('Telemetry random value must be between 0 and 1');
    },
  );

  it('rejects a non-finite random value', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
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
    };

    const randomSource = new SequenceTelemetryRandomSource([
      Number.NaN,
      0.5,
      0.5,
      0.5,
      0.5,
    ]);

    const simulator = createMachineTelemetrySimulator({
      randomSource,
    });

    expect(() => {
      simulator.next(previousStatus, new Date('2026-07-12T15:00:03.000Z'));
    }).toThrow('Telemetry random value must be between 0 and 1');
  });

  it('recalculates OEE from the simulated machine efficiency', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
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
    };

    const randomSource = new SequenceTelemetryRandomSource([
      0.5, 0.5, 0.6, 0.5, 0.5,
    ]);

    const simulator = createMachineTelemetrySimulator({
      randomSource,
    });

    const nextStatus = simulator.next(
      previousStatus,
      new Date('2026-07-12T15:00:03.000Z'),
    );

    expect(nextStatus.metrics.efficiency).toBe(92.4);

    expect(nextStatus.oee).toEqual({
      overall: 86.9,
      availability: 96,
      performance: 92.4,
      quality: 98,
    });
  });

  it('evolves availability and quality before recalculating OEE', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
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
    };

    const randomSource = new SequenceTelemetryRandomSource([
      0.5, 0.5, 0.5, 1, 0,
    ]);

    const simulator = createMachineTelemetrySimulator({
      randomSource,
    });

    const nextStatus = simulator.next(
      previousStatus,
      new Date('2026-07-12T15:00:03.000Z'),
    );

    expect(nextStatus.metrics.efficiency).toBe(92);

    expect(nextStatus.oee).toEqual({
      overall: 86.8,
      availability: 96.5,
      performance: 92,
      quality: 97.8,
    });
  });

  it('does not generate operating telemetry while the machine is stopped', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
      state: 'STOPPED',
      metrics: {
        temperature: 60,
        rpm: 0,
        uptime: 28_800,
        efficiency: 0,
      },
      oee: {
        overall: 0,
        availability: 95,
        performance: 0,
        quality: 98,
      },
    };

    const randomSource = new SequenceTelemetryRandomSource([0.5, 1, 1, 0, 0.5]);

    const simulator = createMachineTelemetrySimulator({
      randomSource,
    });

    const nextStatus = simulator.next(
      previousStatus,
      new Date('2026-07-12T15:00:03.000Z'),
    );

    expect(nextStatus).toEqual({
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      state: 'STOPPED',
      metrics: {
        temperature: 60,
        rpm: 0,
        uptime: 28_800,
        efficiency: 0,
      },
      oee: {
        overall: 0,
        availability: 94.5,
        performance: 0,
        quality: 98,
      },
    });
  });

  it('does not generate operating telemetry while the machine is under maintenance', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
      state: 'MAINTENANCE',
      metrics: {
        temperature: 55,
        rpm: 0,
        uptime: 28_800,
        efficiency: 0,
      },
      oee: {
        overall: 0,
        availability: 90,
        performance: 0,
        quality: 98,
      },
    };

    const randomSource = new SequenceTelemetryRandomSource([
      0.75, 1, 1, 0, 0.5,
    ]);

    const simulator = createMachineTelemetrySimulator({
      randomSource,
    });

    const nextStatus = simulator.next(
      previousStatus,
      new Date('2026-07-12T15:00:03.000Z'),
    );

    expect(nextStatus).toEqual({
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      state: 'MAINTENANCE',
      metrics: {
        temperature: 56,
        rpm: 0,
        uptime: 28_800,
        efficiency: 0,
      },
      oee: {
        overall: 0,
        availability: 89.5,
        performance: 0,
        quality: 98,
      },
    });
  });

  it('does not generate operating telemetry while the machine is in error', () => {
    const previousStatus: MachineStatus = {
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:00.000Z'),
      state: 'ERROR',
      metrics: {
        temperature: 90,
        rpm: 0,
        uptime: 28_800,
        efficiency: 0,
      },
      oee: {
        overall: 0,
        availability: 85,
        performance: 0,
        quality: 98,
      },
    };

    const randomSource = new SequenceTelemetryRandomSource([
      0.25, 1, 1, 0, 0.5,
    ]);

    const simulator = createMachineTelemetrySimulator({
      randomSource,
    });

    const nextStatus = simulator.next(
      previousStatus,
      new Date('2026-07-12T15:00:03.000Z'),
    );

    expect(nextStatus).toEqual({
      id: 'mixer-01',
      timestamp: new Date('2026-07-12T15:00:03.000Z'),
      state: 'ERROR',
      metrics: {
        temperature: 89,
        rpm: 0,
        uptime: 28_800,
        efficiency: 0,
      },
      oee: {
        overall: 0,
        availability: 84.5,
        performance: 0,
        quality: 98,
      },
    });
  });
});
