import { once } from 'node:events';
import { type Server } from 'node:http';

import { describe, expect, it } from '@jest/globals';

import type {
  Alert,
  AlertCreatedEvent,
  MachineStatus,
  MachineStatusUpdatedEvent,
  RealtimeEvent,
} from '@industrial-monitoring/contracts';

import type {
  AcknowledgeMachineAlertResult,
  AddMachineAlertResult,
  AlertRepository,
} from '../src/machines/alert-repository.js';

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

class RecordingAlertRepository implements AlertRepository {
  readonly createdAlerts: Array<{
    machineId: string;
    alert: Alert;
  }> = [];

  addMachineAlert(machineId: string, alert: Alert): AddMachineAlertResult {
    if (machineId !== 'mixer-01') {
      return {
        status: 'MACHINE_NOT_FOUND',
      };
    }

    const storedAlert: Alert = {
      ...alert,
      timestamp: new Date(alert.timestamp.getTime()),
    };

    this.createdAlerts.push({
      machineId,
      alert: storedAlert,
    });

    return {
      status: 'CREATED',
      alert: {
        ...storedAlert,
        timestamp: new Date(storedAlert.timestamp.getTime()),
      },
    };
  }

  acknowledgeMachineAlert(
    machineId: string,
    alertId: string,
  ): AcknowledgeMachineAlertResult {
    void machineId;
    void alertId;

    return {
      status: 'ALERT_NOT_FOUND',
    };
  }

  getMachineAlertHistory(machineId: string): Alert[] | undefined {
    if (machineId !== 'mixer-01') {
      return undefined;
    }

    return [];
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

  it('persists and emits an alert when a critical condition is detected', async () => {
    const scheduler = new ManualRealtimeScheduler();

    const alertRepository = new RecordingAlertRepository();

    const server = createHttpServer({
      alertRepository,
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

        const statusFrame = await readNextSseFrameWithTimeout(
          reader,
          decoder,
          pendingContent,
        );

        const metricFrame = await readNextSseFrameWithTimeout(
          reader,
          decoder,
          pendingContent,
        );

        const alertFrame = await readNextSseFrameWithTimeout(
          reader,
          decoder,
          pendingContent,
        );

        expect(statusFrame.eventName).toBe('MACHINE_STATUS_UPDATED');

        expect(metricFrame.eventName).toBe('METRIC_RECORDED');

        expect(alertFrame.eventName).toBe('ALERT_CREATED');

        const alertEvent = alertFrame.event as AlertCreatedEvent;

        expect(alertEvent.payload).toEqual({
          id: expect.any(String),
          timestamp: expect.any(String),
          level: 'CRITICAL',
          component: 'temperature-sensor',
          message: 'Machine temperature reached the critical threshold',
          acknowledged: false,
        });

        expect(alertRepository.createdAlerts).toHaveLength(1);

        const persistedAlert = alertRepository.createdAlerts[0];

        expect(persistedAlert).toBeDefined();

        if (persistedAlert === undefined) {
          throw new Error('The automatic alert was not persisted');
        }

        expect(persistedAlert.machineId).toBe('mixer-01');

        expect(persistedAlert.alert).toEqual({
          id: alertEvent.payload.id,
          timestamp: new Date(alertEvent.payload.timestamp),
          level: 'CRITICAL',
          component: 'temperature-sensor',
          message: 'Machine temperature reached the critical threshold',
          acknowledged: false,
        });
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

  it('does not create repeated alerts while the critical condition remains active', async () => {
    const scheduler = new ManualRealtimeScheduler();

    const alertRepository = new RecordingAlertRepository();

    const server = createHttpServer({
      alertRepository,
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

        const firstAlertFrame = await readNextSseFrameWithTimeout(
          reader,
          decoder,
          pendingContent,
        );

        expect(firstStatusFrame.eventName).toBe('MACHINE_STATUS_UPDATED');

        expect(firstMetricFrame.eventName).toBe('METRIC_RECORDED');

        expect(firstAlertFrame.eventName).toBe('ALERT_CREATED');

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

        expect(secondStatusFrame.eventName).toBe('MACHINE_STATUS_UPDATED');

        expect(secondMetricFrame.eventName).toBe('METRIC_RECORDED');

        await expect(
          readNextSseFrameWithTimeout(reader, decoder, pendingContent),
        ).rejects.toThrow('Timed out waiting for the next SSE frame');

        expect(alertRepository.createdAlerts).toHaveLength(1);
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
