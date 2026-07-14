import { describe, expect, it, jest } from '@jest/globals';
import { act, render, screen, within } from '@testing-library/react';

import type {
  AlertCreatedEvent,
  AlertUpdatedEvent,
  ConnectedEvent,
  MachineStatusTransport,
  MachineStatusUpdatedEvent,
  RealtimeEvent,
} from '@industrial-monitoring/contracts';

import { MachineRealtimeDashboard } from './machine-realtime-dashboard';

type BrowserEventListener = (event: MessageEvent<string>) => void;

class FakeBrowserEventSource {
  static readonly instances: FakeBrowserEventSource[] = [];

  readonly listeners = new Map<string, BrowserEventListener>();

  readonly close = jest.fn();

  readonly url: string;

  constructor(url: string | URL) {
    this.url = String(url);

    FakeBrowserEventSource.instances.push(this);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void {
    this.listeners.set(type, listener as BrowserEventListener);
  }

  emit(type: string, event: RealtimeEvent): void {
    const listener = this.listeners.get(type);

    if (listener === undefined) {
      throw new Error(`No browser listener registered for ${type}`);
    }

    listener({
      data: JSON.stringify(event),
    } as MessageEvent<string>);
  }
}

describe('MachineRealtimeDashboard', () => {
  it('renders the initial machine snapshot received from the server', () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T19:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 73.8,
        rpm: 1234,
        uptime: 3661,
        efficiency: 92.4,
      },
      oee: {
        overall: 87.6,
        availability: 95.2,
        performance: 94.1,
        quality: 97.8,
      },
    };

    const connectToMachine = jest.fn(() => jest.fn());

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        connectToMachine={connectToMachine}
      />,
    );

    expect(screen.getByText('73,8 °C')).toBeInTheDocument();

    expect(screen.getByText('1.234')).toBeInTheDocument();

    expect(screen.getByText('1 h 1 min')).toBeInTheDocument();

    expect(screen.getByText('87,6%')).toBeInTheDocument();
  });

  it('updates the snapshot when the machine status changes', () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T19:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 73.8,
        rpm: 1234,
        uptime: 3661,
        efficiency: 92.4,
      },
      oee: {
        overall: 87.6,
        availability: 95.2,
        performance: 94.1,
        quality: 97.8,
      },
    };

    let onEvent: ((event: RealtimeEvent) => void) | undefined;

    const disconnect = jest.fn();

    const connectToMachine = jest.fn(
      (
        machineId: string,
        options: {
          onEvent(event: RealtimeEvent): void;
        },
      ) => {
        expect(machineId).toBe('mixer-01');

        onEvent = options.onEvent;

        return disconnect;
      },
    );

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        connectToMachine={connectToMachine}
      />,
    );

    expect(screen.getByText('73,8 °C')).toBeInTheDocument();

    if (onEvent === undefined) {
      throw new Error('Realtime event listener was not registered');
    }

    const emitRealtimeEvent = onEvent;

    const machineStatusUpdatedEvent: MachineStatusUpdatedEvent = {
      id: 'event-007',
      emittedAt: '2026-07-13T19:00:03.000Z',
      type: 'MACHINE_STATUS_UPDATED',
      payload: {
        id: 'mixer-01',
        timestamp: '2026-07-13T19:00:03.000Z',
        state: 'MAINTENANCE',
        metrics: {
          temperature: 64.7,
          rpm: 0,
          uptime: 3661,
          efficiency: 0,
        },
        oee: {
          overall: 0,
          availability: 82.5,
          performance: 0,
          quality: 97.1,
        },
      },
    };

    act(() => {
      emitRealtimeEvent(machineStatusUpdatedEvent);
    });

    expect(
      screen.getByRole('status', {
        name: 'Estado atual da máquina',
      }),
    ).toHaveTextContent('Em manutenção');

    expect(screen.getByText('64,7 °C')).toBeInTheDocument();

    expect(
      screen.getByRole('article', {
        name: 'Métrica de RPM',
      }),
    ).toHaveTextContent('0');

    expect(
      screen.getByRole('article', {
        name: 'OEE geral',
      }),
    ).toHaveTextContent('0%');

    expect(connectToMachine).toHaveBeenCalledTimes(1);
  });

  it('updates the realtime connection status', () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T19:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 73.8,
        rpm: 1234,
        uptime: 3661,
        efficiency: 92.4,
      },
      oee: {
        overall: 87.6,
        availability: 95.2,
        performance: 94.1,
        quality: 97.8,
      },
    };

    let onConnectionChange:
      ((status: 'connected' | 'disconnected') => void) | undefined;

    const connectToMachine = jest.fn(
      (
        _machineId: string,
        options: {
          onEvent(event: RealtimeEvent): void;

          onConnectionChange(status: 'connected' | 'disconnected'): void;
        },
      ) => {
        onConnectionChange = options.onConnectionChange;

        return jest.fn();
      },
    );

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        connectToMachine={connectToMachine}
      />,
    );

    const connectionStatus = screen.getByRole('status', {
      name: 'Status da conexão em tempo real',
    });

    expect(connectionStatus).toHaveTextContent('Conectando');

    if (onConnectionChange === undefined) {
      throw new Error('Connection status listener was not registered');
    }

    const changeConnectionStatus = onConnectionChange;

    act(() => {
      changeConnectionStatus('connected');
    });

    expect(connectionStatus).toHaveTextContent('Conectado');

    act(() => {
      changeConnectionStatus('disconnected');
    });

    expect(connectionStatus).toHaveTextContent('Desconectado');

    expect(connectToMachine).toHaveBeenCalledTimes(1);
  });

  it('connects to the machine stream with the browser EventSource by default', () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T19:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 73.8,
        rpm: 1234,
        uptime: 3661,
        efficiency: 92.4,
      },
      oee: {
        overall: 87.6,
        availability: 95.2,
        performance: 94.1,
        quality: 97.8,
      },
    };

    const previousEventSource = globalThis.EventSource;

    const previousApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    FakeBrowserEventSource.instances.length = 0;

    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.example.test';

    Object.defineProperty(globalThis, 'EventSource', {
      configurable: true,
      writable: true,
      value: FakeBrowserEventSource,
    });

    try {
      const { unmount } = render(
        <MachineRealtimeDashboard
          initialMachineStatus={initialMachineStatus}
        />,
      );

      const eventSource = FakeBrowserEventSource.instances[0];

      expect(eventSource).toBeDefined();

      if (eventSource === undefined) {
        throw new Error('Browser EventSource was not created');
      }

      expect(eventSource.url).toBe(
        'http://api.example.test/api/v1/machines/mixer-01/events',
      );

      const connectedEvent: ConnectedEvent = {
        id: 'event-008',
        emittedAt: '2026-07-13T19:00:03.000Z',
        type: 'CONNECTED',
        payload: {
          connectedAt: '2026-07-13T19:00:03.000Z',
        },
      };

      act(() => {
        eventSource.emit('CONNECTED', connectedEvent);
      });

      expect(
        screen.getByRole('status', {
          name: 'Status da conexão em tempo real',
        }),
      ).toHaveTextContent('Conectado');

      unmount();

      expect(eventSource.close).toHaveBeenCalledTimes(1);
    } finally {
      if (previousApiBaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_API_BASE_URL = previousApiBaseUrl;
      }

      if (previousEventSource === undefined) {
        Reflect.deleteProperty(globalThis, 'EventSource');
      } else {
        Object.defineProperty(globalThis, 'EventSource', {
          configurable: true,
          writable: true,
          value: previousEventSource,
        });
      }
    }
  });

  it('adds a new alert received in real time', () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T19:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 73.8,
        rpm: 1234,
        uptime: 3661,
        efficiency: 92.4,
      },
      oee: {
        overall: 87.6,
        availability: 95.2,
        performance: 94.1,
        quality: 97.8,
      },
    };

    let onEvent: ((event: RealtimeEvent) => void) | undefined;

    const connectToMachine = jest.fn(
      (
        _machineId: string,
        options: {
          onEvent(event: RealtimeEvent): void;
          onConnectionChange(status: 'connected' | 'disconnected'): void;
        },
      ) => {
        onEvent = options.onEvent;

        return jest.fn();
      },
    );

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        initialAlerts={[]}
        connectToMachine={connectToMachine}
      />,
    );

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();

    if (onEvent === undefined) {
      throw new Error('Realtime event listener was not registered');
    }

    const emitRealtimeEvent = onEvent;

    const alertCreatedEvent: AlertCreatedEvent = {
      id: 'event-009',
      emittedAt: '2026-07-13T19:00:06.000Z',
      type: 'ALERT_CREATED',
      payload: {
        id: 'alert-001',
        level: 'CRITICAL',
        message: 'Temperatura excedeu o limite crítico',
        component: 'temperature-sensor',
        timestamp: '2026-07-13T19:00:06.000Z',
        acknowledged: false,
      },
    };

    act(() => {
      emitRealtimeEvent(alertCreatedEvent);
    });

    const alertHistory = screen.getByRole('region', {
      name: 'Histórico de alertas',
    });

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Histórico de alertas',
      }),
    ).toBeInTheDocument();

    const alertItems = within(alertHistory).getAllByRole('listitem');

    expect(alertItems).toHaveLength(1);

    expect(alertItems[0]).toHaveTextContent('Crítico');

    expect(alertItems[0]).toHaveTextContent(
      'Temperatura excedeu o limite crítico',
    );

    expect(alertItems[0]).toHaveTextContent('temperature-sensor');

    expect(alertItems[0]).toHaveTextContent('Aguardando reconhecimento');
  });

  it('updates an existing alert received in real time', () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T19:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 73.8,
        rpm: 1234,
        uptime: 3661,
        efficiency: 92.4,
      },
      oee: {
        overall: 87.6,
        availability: 95.2,
        performance: 94.1,
        quality: 97.8,
      },
    };

    let onEvent: ((event: RealtimeEvent) => void) | undefined;

    const connectToMachine = jest.fn(
      (
        _machineId: string,
        options: {
          onEvent(event: RealtimeEvent): void;
          onConnectionChange(status: 'connected' | 'disconnected'): void;
        },
      ) => {
        onEvent = options.onEvent;

        return jest.fn();
      },
    );

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        initialAlerts={[
          {
            id: 'alert-001',
            level: 'CRITICAL',
            message: 'Temperatura excedeu o limite crítico',
            component: 'temperature-sensor',
            timestamp: '2026-07-13T19:00:06.000Z',
            acknowledged: false,
          },
        ]}
        connectToMachine={connectToMachine}
      />,
    );

    expect(screen.getByText('Aguardando reconhecimento')).toBeInTheDocument();

    if (onEvent === undefined) {
      throw new Error('Realtime event listener was not registered');
    }

    const emitRealtimeEvent = onEvent;

    const alertUpdatedEvent: AlertUpdatedEvent = {
      id: 'event-010',
      emittedAt: '2026-07-13T19:00:09.000Z',
      type: 'ALERT_UPDATED',
      payload: {
        id: 'alert-001',
        level: 'CRITICAL',
        message: 'Temperatura excedeu o limite crítico',
        component: 'temperature-sensor',
        timestamp: '2026-07-13T19:00:06.000Z',
        acknowledged: true,
      },
    };

    act(() => {
      emitRealtimeEvent(alertUpdatedEvent);
    });

    const alertHistory = screen.getByRole('region', {
      name: 'Histórico de alertas',
    });

    expect(within(alertHistory).getAllByRole('listitem')).toHaveLength(1);

    expect(within(alertHistory).getByText('Reconhecido')).toBeInTheDocument();

    expect(
      within(alertHistory).queryByText('Aguardando reconhecimento'),
    ).not.toBeInTheDocument();
  });
});
