import { once } from 'node:events';
import { type Server } from 'node:http';

import { describe, expect, it } from '@jest/globals';

import type {
  MachineStatus,
  MachineStatusUpdatedEvent,
  RealtimeEvent,
} from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';
import { createMachineConditionEvaluator } from '../src/machines/machine-condition-evaluator.js';
import type { MachineTelemetrySimulator } from '../src/machines/machine-telemetry-simulator.js';
import type {
  RealtimeScheduledTask,
  RealtimeScheduler,
} from '../src/realtime/realtime-scheduler.js';

class ManualRealtimeScheduler implements RealtimeScheduler {
  private callback: (() => void) | undefined;

  scheduleEvery(
    _intervalMs: number,
    callback: () => void,
  ): RealtimeScheduledTask {
    this.callback = callback;

    return {
      cancel(): void {
        // Nothing to cancel in the manual scheduler.
      },
    };
  }

  runScheduledTask(): void {
    if (this.callback === undefined) {
      throw new Error('No realtime task has been scheduled');
    }

    this.callback();
  }
}

class CriticalTemperatureSimulator implements MachineTelemetrySimulator {
  next(previousStatus: MachineStatus, timestamp: Date): MachineStatus {
    return {
      ...previousStatus,
      timestamp: new Date(timestamp.getTime()),
      metrics: {
        ...previousStatus.metrics,
        temperature: 90,
        uptime: previousStatus.metrics.uptime + 3,
      },
      oee: {
        ...previousStatus.oee,
      },
    };
  }
}

class WarningTemperatureSimulator implements MachineTelemetrySimulator {
  next(previousStatus: MachineStatus, timestamp: Date): MachineStatus {
    return {
      ...previousStatus,
      timestamp: new Date(timestamp.getTime()),
      metrics: {
        ...previousStatus.metrics,
        temperature: 80,
        uptime: previousStatus.metrics.uptime + 3,
      },
      oee: {
        ...previousStatus.oee,
      },
    };
  }
}

interface SseFrame {
  eventName: string;
  event: RealtimeEvent;
}

async function readNextSseFrame(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  pendingContent: {
    value: string;
  },
): Promise<SseFrame> {
  while (true) {
    const normalizedContent = pendingContent.value.replaceAll('\r\n', '\n');

    const frameEndIndex = normalizedContent.indexOf('\n\n');

    if (frameEndIndex !== -1) {
      const rawFrame = normalizedContent.slice(0, frameEndIndex);

      pendingContent.value = normalizedContent.slice(frameEndIndex + 2);

      const lines = rawFrame.split('\n');

      const eventLine = lines.find((line) => line.startsWith('event: '));

      const dataLine = lines.find((line) => line.startsWith('data: '));

      if (eventLine === undefined || dataLine === undefined) {
        throw new Error('The SSE frame is missing required fields');
      }

      return {
        eventName: eventLine.slice('event: '.length),
        event: JSON.parse(dataLine.slice('data: '.length)) as RealtimeEvent,
      };
    }

    const result = await reader.read();

    if (result.done) {
      throw new Error(
        'The SSE connection ended before a complete event was received',
      );
    }

    pendingContent.value += decoder.decode(result.value, {
      stream: true,
    });
  }
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

describe('Realtime machine condition evaluation', () => {
  it('emits the machine as error when telemetry reaches the critical temperature', async () => {
    const scheduler = new ManualRealtimeScheduler();

    const server = createHttpServer({
      realtimeScheduler: scheduler,
      machineTelemetrySimulator: new CriticalTemperatureSimulator(),
      machineConditionEvaluator: createMachineConditionEvaluator({
        warningTemperature: 80,
        criticalTemperature: 90,
      }),
    });

    server.listen(0, '127.0.0.1');

    await once(server, 'listening');

    const address = server.address();

    if (address === null || typeof address === 'string') {
      throw new Error('Could not determine the test server address');
    }

    const abortController = new AbortController();

    try {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/v1/machines/mixer-01/events`,
        {
          headers: {
            accept: 'text/event-stream',
          },
          signal: abortController.signal,
        },
      );

      expect(response.status).toBe(200);
      expect(response.body).not.toBeNull();

      if (response.body === null) {
        throw new Error('SSE response body is not available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const pendingContent = {
        value: '',
      };

      try {
        const connectedFrame = await readNextSseFrame(
          reader,
          decoder,
          pendingContent,
        );

        expect(connectedFrame.eventName).toBe('CONNECTED');

        scheduler.runScheduledTask();

        const statusFrame = await readNextSseFrame(
          reader,
          decoder,
          pendingContent,
        );

        expect(statusFrame.eventName).toBe('MACHINE_STATUS_UPDATED');

        const statusEvent = statusFrame.event as MachineStatusUpdatedEvent;

        expect(statusEvent.payload.state).toBe('ERROR');

        expect(statusEvent.payload.metrics.temperature).toBe(90);
      } finally {
        abortController.abort();

        await reader.cancel().catch(() => undefined);

        reader.releaseLock();
      }
    } finally {
      abortController.abort();
      await closeServer(server);
    }
  });

  it('keeps the machine running when telemetry reaches the warning temperature', async () => {
    const scheduler = new ManualRealtimeScheduler();

    const server = createHttpServer({
      realtimeScheduler: scheduler,
      machineTelemetrySimulator: new WarningTemperatureSimulator(),
      machineConditionEvaluator: createMachineConditionEvaluator({
        warningTemperature: 80,
        criticalTemperature: 90,
      }),
    });

    server.listen(0, '127.0.0.1');

    await once(server, 'listening');

    const address = server.address();

    if (address === null || typeof address === 'string') {
      throw new Error('Could not determine the test server address');
    }

    const abortController = new AbortController();

    try {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/v1/machines/mixer-01/events`,
        {
          headers: {
            accept: 'text/event-stream',
          },
          signal: abortController.signal,
        },
      );

      expect(response.status).toBe(200);
      expect(response.body).not.toBeNull();

      if (response.body === null) {
        throw new Error('SSE response body is not available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const pendingContent = {
        value: '',
      };

      try {
        const connectedFrame = await readNextSseFrame(
          reader,
          decoder,
          pendingContent,
        );

        expect(connectedFrame.eventName).toBe('CONNECTED');

        scheduler.runScheduledTask();

        const statusFrame = await readNextSseFrame(
          reader,
          decoder,
          pendingContent,
        );

        expect(statusFrame.eventName).toBe('MACHINE_STATUS_UPDATED');

        const statusEvent = statusFrame.event as MachineStatusUpdatedEvent;

        expect(statusEvent.payload.state).toBe('RUNNING');

        expect(statusEvent.payload.metrics.temperature).toBe(80);
      } finally {
        abortController.abort();

        await reader.cancel().catch(() => undefined);

        reader.releaseLock();
      }
    } finally {
      abortController.abort();
      await closeServer(server);
    }
  });
});
