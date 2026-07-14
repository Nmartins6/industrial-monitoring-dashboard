import { describe, expect, it, jest } from '@jest/globals';

import type {
  AlertCreatedEvent,
  AlertUpdatedEvent,
  ConnectedEvent,
  MachineStatusUpdatedEvent,
  MetricRecordedEvent,
  RealtimeEvent,
} from '@industrial-monitoring/contracts';

import { createMachineRealtimeClient } from './machine-realtime-client';

type RealtimeEventListener = (event: MessageEvent<string>) => void;

class FakeEventSource {
  readonly listeners = new Map<string, RealtimeEventListener>();

  readonly errorListeners = new Map<string, () => void>();

  addEventListener(
    type: string,
    listener: RealtimeEventListener | (() => void),
  ): void {
    if (type === 'error') {
      this.errorListeners.set(type, listener as () => void);

      return;
    }

    this.listeners.set(type, listener as RealtimeEventListener);
  }

  readonly close = jest.fn();

  emit(type: string, event: RealtimeEvent): void {
    const listener = this.listeners.get(type);

    if (listener === undefined) {
      throw new Error(`No listener registered for ${type}`);
    }

    listener({
      data: JSON.stringify(event),
    } as MessageEvent<string>);
  }

  emitError(): void {
    const listener = this.errorListeners.get('error');

    if (listener === undefined) {
      throw new Error('No listener registered for error');
    }

    listener();
  }
}

describe('Machine realtime client', () => {
  it('receives the named CONNECTED event from the machine stream', () => {
    const eventSource = new FakeEventSource();

    const eventSourceFactory = jest.fn((url: string) => {
      expect(url).toBe('http://localhost:3333/api/v1/machines/mixer-01/events');

      return eventSource;
    });

    const onEvent = jest.fn();

    const client = createMachineRealtimeClient({
      baseUrl: 'http://localhost:3333',
      eventSourceFactory,
    });

    client.connect('mixer-01', {
      onEvent,
    });

    const connectedEvent: ConnectedEvent = {
      id: 'event-001',
      emittedAt: '2026-07-13T18:00:00.000Z',
      type: 'CONNECTED',
      payload: {
        connectedAt: '2026-07-13T18:00:00.000Z',
      },
    };

    eventSource.emit('CONNECTED', connectedEvent);

    expect(eventSourceFactory).toHaveBeenCalledTimes(1);

    expect(onEvent).toHaveBeenCalledTimes(1);

    expect(onEvent).toHaveBeenCalledWith(connectedEvent);
  });

  it('receives the named MACHINE_STATUS_UPDATED event', () => {
    const eventSource = new FakeEventSource();

    const eventSourceFactory = jest.fn(() => eventSource);

    const onEvent = jest.fn();

    const client = createMachineRealtimeClient({
      baseUrl: 'http://localhost:3333',
      eventSourceFactory,
    });

    client.connect('mixer-01', {
      onEvent,
    });

    const machineStatusUpdatedEvent: MachineStatusUpdatedEvent = {
      id: 'event-002',
      emittedAt: '2026-07-13T18:00:03.000Z',
      type: 'MACHINE_STATUS_UPDATED',
      payload: {
        id: 'mixer-01',
        timestamp: '2026-07-13T18:00:03.000Z',
        state: 'RUNNING',
        metrics: {
          temperature: 73.2,
          rpm: 1210,
          uptime: 28_803,
          efficiency: 92.4,
        },
        oee: {
          overall: 88.7,
          availability: 96.1,
          performance: 94.2,
          quality: 98,
        },
      },
    };

    eventSource.emit('MACHINE_STATUS_UPDATED', machineStatusUpdatedEvent);

    expect(onEvent).toHaveBeenCalledTimes(1);

    expect(onEvent).toHaveBeenCalledWith(machineStatusUpdatedEvent);
  });

  it('closes the machine event stream when disconnected', () => {
    const eventSource = new FakeEventSource();

    const eventSourceFactory = jest.fn(() => eventSource);

    const client = createMachineRealtimeClient({
      baseUrl: 'http://localhost:3333',
      eventSourceFactory,
    });

    const disconnect = client.connect('mixer-01', {
      onEvent: jest.fn(),
    });

    disconnect();

    expect(eventSource.close).toHaveBeenCalledTimes(1);
  });

  it('receives the named METRIC_RECORDED event', () => {
    const eventSource = new FakeEventSource();

    const eventSourceFactory = jest.fn(() => eventSource);

    const onEvent = jest.fn();

    const client = createMachineRealtimeClient({
      baseUrl: 'http://localhost:3333',
      eventSourceFactory,
    });

    client.connect('mixer-01', {
      onEvent,
    });

    const metricRecordedEvent: MetricRecordedEvent = {
      id: 'event-003',
      emittedAt: '2026-07-13T18:00:03.000Z',
      type: 'METRIC_RECORDED',
      payload: {
        timestamp: '2026-07-13T18:00:03.000Z',
        temperature: 73.2,
        rpm: 1210,
        efficiency: 92.4,
      },
    };

    eventSource.emit('METRIC_RECORDED', metricRecordedEvent);

    expect(onEvent).toHaveBeenCalledTimes(1);

    expect(onEvent).toHaveBeenCalledWith(metricRecordedEvent);
  });

  it('receives the named ALERT_CREATED event', () => {
    const eventSource = new FakeEventSource();

    const eventSourceFactory = jest.fn(() => eventSource);

    const onEvent = jest.fn();

    const client = createMachineRealtimeClient({
      baseUrl: 'http://localhost:3333',
      eventSourceFactory,
    });

    client.connect('mixer-01', {
      onEvent,
    });

    const alertCreatedEvent: AlertCreatedEvent = {
      id: 'event-004',
      emittedAt: '2026-07-13T18:00:06.000Z',
      type: 'ALERT_CREATED',
      payload: {
        id: 'alert-001',
        level: 'CRITICAL',
        message: 'Temperature exceeded the critical threshold',
        component: 'temperature-sensor',
        timestamp: '2026-07-13T18:00:06.000Z',
        acknowledged: false,
      },
    };

    eventSource.emit('ALERT_CREATED', alertCreatedEvent);

    expect(onEvent).toHaveBeenCalledTimes(1);

    expect(onEvent).toHaveBeenCalledWith(alertCreatedEvent);
  });

  it('receives the named ALERT_UPDATED event', () => {
    const eventSource = new FakeEventSource();

    const eventSourceFactory = jest.fn(() => eventSource);

    const onEvent = jest.fn();

    const client = createMachineRealtimeClient({
      baseUrl: 'http://localhost:3333',
      eventSourceFactory,
    });

    client.connect('mixer-01', {
      onEvent,
    });

    const alertUpdatedEvent: AlertUpdatedEvent = {
      id: 'event-005',
      emittedAt: '2026-07-13T18:00:09.000Z',
      type: 'ALERT_UPDATED',
      payload: {
        id: 'alert-001',
        level: 'CRITICAL',
        message: 'Temperature exceeded the critical threshold',
        component: 'temperature-sensor',
        timestamp: '2026-07-13T18:00:06.000Z',
        acknowledged: true,
      },
    };

    eventSource.emit('ALERT_UPDATED', alertUpdatedEvent);

    expect(onEvent).toHaveBeenCalledTimes(1);

    expect(onEvent).toHaveBeenCalledWith(alertUpdatedEvent);
  });

  it('reports when the machine stream is connected', () => {
    const eventSource = new FakeEventSource();

    const eventSourceFactory = jest.fn(() => eventSource);

    const onConnectionChange = jest.fn();

    const client = createMachineRealtimeClient({
      baseUrl: 'http://localhost:3333',
      eventSourceFactory,
    });

    client.connect('mixer-01', {
      onEvent: jest.fn(),
      onConnectionChange,
    });

    const connectedEvent: ConnectedEvent = {
      id: 'event-006',
      emittedAt: '2026-07-13T18:00:12.000Z',
      type: 'CONNECTED',
      payload: {
        connectedAt: '2026-07-13T18:00:12.000Z',
      },
    };

    eventSource.emit('CONNECTED', connectedEvent);

    expect(onConnectionChange).toHaveBeenCalledTimes(1);

    expect(onConnectionChange).toHaveBeenCalledWith('connected');
  });

  it('reports when the machine stream is disconnected', () => {
    const eventSource = new FakeEventSource();

    const eventSourceFactory = jest.fn(() => eventSource);

    const onConnectionChange = jest.fn();

    const client = createMachineRealtimeClient({
      baseUrl: 'http://localhost:3333',
      eventSourceFactory,
    });

    client.connect('mixer-01', {
      onEvent: jest.fn(),
      onConnectionChange,
    });

    eventSource.emitError();

    expect(onConnectionChange).toHaveBeenCalledTimes(1);

    expect(onConnectionChange).toHaveBeenCalledWith('disconnected');
  });

  it('reconnects after the machine stream fails', () => {
    const eventSources: FakeEventSource[] = [];

    const eventSourceFactory = jest.fn(() => {
      const eventSource = new FakeEventSource();

      eventSources.push(eventSource);

      return eventSource;
    });

    let scheduledReconnect: (() => void) | undefined;

    const cancelScheduledReconnect = jest.fn();

    const scheduleReconnect = jest.fn(
      (callback: () => void, delayInMilliseconds: number) => {
        expect(delayInMilliseconds).toBe(3000);

        scheduledReconnect = callback;

        return cancelScheduledReconnect;
      },
    );

    const onConnectionChange = jest.fn();

    const client = createMachineRealtimeClient({
      baseUrl: 'http://localhost:3333',
      eventSourceFactory,
      scheduleReconnect,
    });

    const disconnect = client.connect('mixer-01', {
      onEvent: jest.fn(),
      onConnectionChange,
    });

    expect(eventSourceFactory).toHaveBeenCalledTimes(1);

    const firstEventSource = eventSources[0];

    expect(firstEventSource).toBeDefined();

    if (firstEventSource === undefined) {
      throw new Error('Initial EventSource was not created');
    }

    firstEventSource.emitError();

    expect(onConnectionChange).toHaveBeenCalledWith('disconnected');

    expect(firstEventSource.close).toHaveBeenCalledTimes(1);

    expect(scheduleReconnect).toHaveBeenCalledTimes(1);

    if (scheduledReconnect === undefined) {
      throw new Error('Reconnect was not scheduled');
    }

    const runScheduledReconnect = scheduledReconnect;

    runScheduledReconnect();

    expect(eventSourceFactory).toHaveBeenCalledTimes(2);

    const secondEventSource = eventSources[1];

    expect(secondEventSource).toBeDefined();

    if (secondEventSource === undefined) {
      throw new Error('Replacement EventSource was not created');
    }

    const connectedEvent: ConnectedEvent = {
      id: 'event-reconnected-001',
      emittedAt: '2026-07-13T21:00:00.000Z',
      type: 'CONNECTED',
      payload: {
        connectedAt: '2026-07-13T21:00:00.000Z',
      },
    };

    secondEventSource.emit('CONNECTED', connectedEvent);

    expect(onConnectionChange).toHaveBeenLastCalledWith('connected');

    disconnect();

    expect(secondEventSource.close).toHaveBeenCalledTimes(1);
  });
});
