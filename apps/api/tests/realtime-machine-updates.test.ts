import { once } from 'node:events';
import { type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import type {
  ConnectedEvent,
  MachineStatus,
  MachineStatusUpdatedEvent,
  MetricRecordedEvent,
  RealtimeEvent,
} from '@industrial-monitoring/contracts';

import { createHttpServer } from '../src/app.js';
import type {
  RealtimeScheduledTask,
  RealtimeScheduler,
} from '../src/realtime/realtime-scheduler.js';

import type { MachineTelemetrySimulator } from '../src/machines/machine-telemetry-simulator.js';

class ManualRealtimeScheduler implements RealtimeScheduler {
  private callback: (() => void) | undefined;

  scheduledIntervalMs: number | undefined;
  wasCancelled = false;

  scheduleEvery(
    intervalMs: number,
    callback: () => void,
  ): RealtimeScheduledTask {
    this.scheduledIntervalMs = intervalMs;
    this.callback = callback;

    return {
      cancel: () => {
        this.wasCancelled = true;
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

class DeterministicMachineTelemetrySimulator implements MachineTelemetrySimulator {
  next(previousStatus: MachineStatus, timestamp: Date): MachineStatus {
    return {
      id: previousStatus.id,
      timestamp: new Date(timestamp.getTime()),
      state: previousStatus.state,
      metrics: {
        temperature: previousStatus.metrics.temperature + 1,
        rpm: previousStatus.metrics.rpm - 50,
        uptime: previousStatus.metrics.uptime + 3,
        efficiency:
          Math.round((previousStatus.metrics.efficiency + 0.4) * 10) / 10,
      },
      oee: {
        ...previousStatus.oee,
      },
    };
  }
}

interface SseFrame {
  id: string;
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

      const idLine = lines.find((line) => line.startsWith('id: '));

      const eventLine = lines.find((line) => line.startsWith('event: '));

      const dataLine = lines.find((line) => line.startsWith('data: '));

      if (
        idLine === undefined ||
        eventLine === undefined ||
        dataLine === undefined
      ) {
        throw new Error('The SSE frame is missing required fields');
      }

      return {
        id: idLine.slice('id: '.length),
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

async function readNextSseFrameWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  pendingContent: {
    value: string;
  },
): Promise<SseFrame> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for the next SSE frame'));
    }, 500);
  });

  try {
    return await Promise.race([
      readNextSseFrame(reader, decoder, pendingContent),
      timeoutPromise,
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

describe('Realtime machine status updates', () => {
  const scheduler = new ManualRealtimeScheduler();

  const telemetrySimulator = new DeterministicMachineTelemetrySimulator();

  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createHttpServer({
      realtimeScheduler: scheduler,
      machineTelemetrySimulator: telemetrySimulator,
    });

    server.listen(0, '127.0.0.1');

    await once(server, 'listening');

    const address = server.address();

    if (address === null || typeof address === 'string') {
      throw new Error('Could not determine the test server address');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error !== undefined) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('sends a machine status update every three seconds', async () => {
    const abortController = new AbortController();

    const response = await fetch(`${baseUrl}/api/v1/machines/mixer-01/events`, {
      headers: {
        accept: 'text/event-stream',
      },
      signal: abortController.signal,
    });

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

      const connectedEvent = connectedFrame.event as ConnectedEvent;

      expect(connectedEvent.type).toBe('CONNECTED');

      expect(scheduler.scheduledIntervalMs).toBe(3_000);

      scheduler.runScheduledTask();

      const statusFrame = await readNextSseFrame(
        reader,
        decoder,
        pendingContent,
      );

      expect(statusFrame.eventName).toBe('MACHINE_STATUS_UPDATED');

      const statusEvent = statusFrame.event as MachineStatusUpdatedEvent;

      expect(statusEvent).toEqual({
        id: expect.any(String),
        type: 'MACHINE_STATUS_UPDATED',
        emittedAt: expect.any(String),
        payload: {
          id: 'mixer-01',
          timestamp: expect.any(String),
          state: 'RUNNING',
          metrics: {
            temperature: 73,
            rpm: 1150,
            uptime: 28_803,
            efficiency: 92.4,
          },
          oee: {
            overall: 88.4,
            availability: 96,
            performance: 94,
            quality: 98,
          },
        },
      });

      expect(statusFrame.id).toBe(statusEvent.id);

      expect(new Date(statusEvent.emittedAt).toISOString()).toBe(
        statusEvent.emittedAt,
      );

      expect(new Date(statusEvent.payload.timestamp).toISOString()).toBe(
        statusEvent.payload.timestamp,
      );

      const metricFrame = await readNextSseFrameWithTimeout(
        reader,
        decoder,
        pendingContent,
      );

      expect(metricFrame.eventName).toBe('METRIC_RECORDED');

      const metricEvent = metricFrame.event as MetricRecordedEvent;

      expect(metricEvent).toEqual({
        id: expect.any(String),
        type: 'METRIC_RECORDED',
        emittedAt: expect.any(String),
        payload: {
          timestamp: expect.any(String),
          temperature: 73,
          rpm: 1150,
          efficiency: 92.4,
        },
      });

      expect(metricFrame.id).toBe(metricEvent.id);

      expect(new Date(metricEvent.emittedAt).toISOString()).toBe(
        metricEvent.emittedAt,
      );

      expect(new Date(metricEvent.payload.timestamp).toISOString()).toBe(
        metricEvent.payload.timestamp,
      );

      expect(metricEvent.emittedAt).toBe(statusEvent.emittedAt);

      expect(metricEvent.payload.timestamp).toBe(statusEvent.payload.timestamp);
    } finally {
      abortController.abort();

      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  });

  it('creates independent events for consecutive update cycles', async () => {
    const abortController = new AbortController();

    const response = await fetch(`${baseUrl}/api/v1/machines/mixer-01/events`, {
      headers: {
        accept: 'text/event-stream',
      },
      signal: abortController.signal,
    });

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

      const firstStatusFrame = await readNextSseFrameWithTimeout(
        reader,
        decoder,
        pendingContent,
      );

      const firstMetricFrame = await readNextSseFrameWithTimeout(
        reader,
        decoder,
        pendingContent,
      );

      scheduler.runScheduledTask();

      const secondStatusFrame = await readNextSseFrameWithTimeout(
        reader,
        decoder,
        pendingContent,
      );

      const secondMetricFrame = await readNextSseFrameWithTimeout(
        reader,
        decoder,
        pendingContent,
      );

      expect(firstStatusFrame.eventName).toBe('MACHINE_STATUS_UPDATED');

      expect(firstMetricFrame.eventName).toBe('METRIC_RECORDED');

      expect(secondStatusFrame.eventName).toBe('MACHINE_STATUS_UPDATED');

      expect(secondMetricFrame.eventName).toBe('METRIC_RECORDED');

      const eventIds = [
        firstStatusFrame.id,
        firstMetricFrame.id,
        secondStatusFrame.id,
        secondMetricFrame.id,
      ];

      expect(new Set(eventIds).size).toBe(eventIds.length);

      const firstStatusEvent =
        firstStatusFrame.event as MachineStatusUpdatedEvent;

      const firstMetricEvent = firstMetricFrame.event as MetricRecordedEvent;

      const secondStatusEvent =
        secondStatusFrame.event as MachineStatusUpdatedEvent;

      const secondMetricEvent = secondMetricFrame.event as MetricRecordedEvent;

      expect(firstStatusEvent.payload.metrics).toEqual({
        temperature: 73,
        rpm: 1150,
        uptime: 28_803,
        efficiency: 92.4,
      });

      expect(secondStatusEvent.payload.metrics).toEqual({
        temperature: 74,
        rpm: 1100,
        uptime: 28_806,
        efficiency: 92.8,
      });

      expect(firstMetricEvent.payload).toEqual({
        timestamp: firstStatusEvent.payload.timestamp,
        temperature: 73,
        rpm: 1150,
        efficiency: 92.4,
      });

      expect(secondMetricEvent.payload).toEqual({
        timestamp: secondStatusEvent.payload.timestamp,
        temperature: 74,
        rpm: 1100,
        efficiency: 92.8,
      });

      expect(firstStatusFrame.id).toBe(firstStatusEvent.id);

      expect(firstMetricFrame.id).toBe(firstMetricEvent.id);

      expect(secondStatusFrame.id).toBe(secondStatusEvent.id);

      expect(secondMetricFrame.id).toBe(secondMetricEvent.id);

      expect(firstMetricEvent.emittedAt).toBe(firstStatusEvent.emittedAt);

      expect(firstMetricEvent.payload.timestamp).toBe(
        firstStatusEvent.payload.timestamp,
      );

      expect(secondMetricEvent.emittedAt).toBe(secondStatusEvent.emittedAt);

      expect(secondMetricEvent.payload.timestamp).toBe(
        secondStatusEvent.payload.timestamp,
      );
    } finally {
      abortController.abort();

      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  });
});
