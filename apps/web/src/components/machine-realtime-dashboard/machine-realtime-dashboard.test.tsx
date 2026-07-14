import { describe, expect, it, jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import type {
  AlertCreatedEvent,
  AlertTransport,
  AlertUpdatedEvent,
  ConnectedEvent,
  MachineStatusTransport,
  MachineStatusUpdatedEvent,
  MetricHistoryTransport,
  MetricRecordedEvent,
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

  it('acknowledges an unacknowledged alert through the dashboard action', async () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-14T18:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 82,
        rpm: 1250,
        uptime: 7200,
        efficiency: 91,
      },
      oee: {
        overall: 87,
        availability: 95,
        performance: 93,
        quality: 98,
      },
    };

    const alert: AlertTransport = {
      id: 'alert-003',
      level: 'CRITICAL',
      message: 'Temperature exceeded the critical threshold',
      component: 'temperature-sensor',
      timestamp: '2026-07-14T18:00:00.000Z',
      acknowledged: false,
    };

    const acknowledgedAlert: AlertTransport = {
      ...alert,
      acknowledged: true,
    };

    const acknowledgeAlert = jest.fn(
      async (machineId: string, alertId: string): Promise<AlertTransport> => {
        expect(machineId).toBe('mixer-01');
        expect(alertId).toBe('alert-003');

        return acknowledgedAlert;
      },
    );

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        initialAlerts={[alert]}
        connectToMachine={() => jest.fn()}
        acknowledgeAlert={acknowledgeAlert}
      />,
    );

    const alertHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de alertas',
    });

    const alertItem = within(alertHistoryRegion).getByRole('listitem');

    expect(alertItem).toHaveTextContent('Aguardando reconhecimento');

    const acknowledgeButton = within(alertItem).getByRole('button', {
      name: 'Reconhecer alerta crítico',
    });

    fireEvent.click(acknowledgeButton);

    await waitFor(() => {
      expect(acknowledgeAlert).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(alertItem).toHaveTextContent('Reconhecido');
    });

    expect(
      within(alertItem).queryByRole('button', {
        name: 'Reconhecer alerta crítico',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders a summary of the initial machine metric history', () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T19:00:03.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 73,
        rpm: 1220,
        uptime: 3664,
        efficiency: 93,
      },
      oee: {
        overall: 88,
        availability: 95,
        performance: 94,
        quality: 98,
      },
    };

    const initialMetricHistory: MetricHistoryTransport[] = [
      {
        timestamp: '2026-07-13T19:00:00.000Z',
        temperature: 72,
        rpm: 1200,
        efficiency: 92,
      },
      {
        timestamp: '2026-07-13T19:00:03.000Z',
        temperature: 73,
        rpm: 1220,
        efficiency: 93,
      },
    ];

    const connectToMachine = jest.fn(() => jest.fn());

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        initialMetricHistory={initialMetricHistory}
        connectToMachine={connectToMachine}
      />,
    );

    const metricHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de métricas',
    });

    expect(
      within(metricHistoryRegion).getByRole('heading', {
        level: 2,
        name: 'Histórico de métricas',
      }),
    ).toBeInTheDocument();

    expect(metricHistoryRegion).toHaveTextContent('2 medições no período');

    expect(metricHistoryRegion).toHaveTextContent('Última temperatura: 73 °C');

    expect(metricHistoryRegion).toHaveTextContent('Última rotação: 1.220 RPM');

    expect(metricHistoryRegion).toHaveTextContent('Última eficiência: 93%');

    expect(
      within(metricHistoryRegion).getByRole('figure', {
        name: 'Histórico de temperatura',
      }),
    ).toBeInTheDocument();

    expect(
      within(metricHistoryRegion).getByRole('figure', {
        name: 'Histórico de rotação',
      }),
    ).toBeInTheDocument();

    expect(
      within(metricHistoryRegion).getByRole('figure', {
        name: 'Histórico de eficiência',
      }),
    ).toBeInTheDocument();
  });

  it('adds a metric received in real time to the history', () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T19:00:03.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 73,
        rpm: 1220,
        uptime: 3664,
        efficiency: 93,
      },
      oee: {
        overall: 88,
        availability: 95,
        performance: 94,
        quality: 98,
      },
    };

    const initialMetricHistory: MetricHistoryTransport[] = [
      {
        timestamp: '2026-07-13T19:00:00.000Z',
        temperature: 72,
        rpm: 1200,
        efficiency: 92,
      },
      {
        timestamp: '2026-07-13T19:00:03.000Z',
        temperature: 73,
        rpm: 1220,
        efficiency: 93,
      },
    ];

    let onEvent: ((event: RealtimeEvent) => void) | undefined;

    const connectToMachine = jest.fn(
      (
        machineId: string,
        options: {
          onEvent(event: RealtimeEvent): void;
        },
      ) => {
        expect(machineId).toBe('mixer-01');

        onEvent = options.onEvent;

        return jest.fn();
      },
    );

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        initialMetricHistory={initialMetricHistory}
        connectToMachine={connectToMachine}
      />,
    );

    const metricHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de métricas',
    });

    expect(metricHistoryRegion).toHaveTextContent('2 medições no período');

    if (onEvent === undefined) {
      throw new Error('Realtime event listener was not registered');
    }

    const emitRealtimeEvent = onEvent;

    const metricRecordedEvent: MetricRecordedEvent = {
      id: 'event-metric-001',
      emittedAt: '2026-07-13T19:00:06.000Z',
      type: 'METRIC_RECORDED',
      payload: {
        timestamp: '2026-07-13T19:00:06.000Z',
        temperature: 74.5,
        rpm: 1240,
        efficiency: 94.2,
      },
    };

    act(() => {
      emitRealtimeEvent(metricRecordedEvent);
    });

    expect(metricHistoryRegion).toHaveTextContent('3 medições no período');

    expect(metricHistoryRegion).toHaveTextContent(
      'Última temperatura: 74,5 °C',
    );

    expect(metricHistoryRegion).toHaveTextContent('Última rotação: 1.240 RPM');

    expect(metricHistoryRegion).toHaveTextContent('Última eficiência: 94,2%');

    expect(connectToMachine).toHaveBeenCalledTimes(1);
  });

  it('keeps only the 30 most recent metric history entries', () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T19:01:27.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 79,
        rpm: 1290,
        uptime: 3748,
        efficiency: 99,
      },
      oee: {
        overall: 90,
        availability: 95,
        performance: 96,
        quality: 98,
      },
    };

    const initialMetricHistory: MetricHistoryTransport[] = Array.from(
      { length: 30 },
      (_, index) => ({
        timestamp: new Date(
          Date.parse('2026-07-13T19:00:00.000Z') + index * 3000,
        ).toISOString(),
        temperature: 70 + index,
        rpm: 1000 + index * 10,
        efficiency: 80 + index,
      }),
    );

    let onEvent: ((event: RealtimeEvent) => void) | undefined;

    const connectToMachine = jest.fn(
      (
        _machineId: string,
        options: {
          onEvent(event: RealtimeEvent): void;
        },
      ) => {
        onEvent = options.onEvent;

        return jest.fn();
      },
    );

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        initialMetricHistory={initialMetricHistory}
        connectToMachine={connectToMachine}
      />,
    );

    const metricHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de métricas',
    });

    expect(metricHistoryRegion).toHaveTextContent('30 medições no período');

    if (onEvent === undefined) {
      throw new Error('Realtime event listener was not registered');
    }

    const emitRealtimeEvent = onEvent;

    const metricRecordedEvent: MetricRecordedEvent = {
      id: 'event-metric-limit-001',
      emittedAt: '2026-07-13T19:01:30.000Z',
      type: 'METRIC_RECORDED',
      payload: {
        timestamp: '2026-07-13T19:01:30.000Z',
        temperature: 82.5,
        rpm: 1350,
        efficiency: 96.5,
      },
    };

    act(() => {
      emitRealtimeEvent(metricRecordedEvent);
    });

    expect(metricHistoryRegion).toHaveTextContent('30 medições no período');

    expect(metricHistoryRegion).toHaveTextContent(
      'Última temperatura: 82,5 °C',
    );

    expect(metricHistoryRegion).toHaveTextContent('Última rotação: 1.350 RPM');

    expect(metricHistoryRegion).toHaveTextContent('Última eficiência: 96,5%');
  });

  it('disables the alert acknowledgement action while the request is pending', async () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-14T18:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 82,
        rpm: 1250,
        uptime: 7200,
        efficiency: 91,
      },
      oee: {
        overall: 87,
        availability: 95,
        performance: 93,
        quality: 98,
      },
    };

    const alert: AlertTransport = {
      id: 'alert-003',
      level: 'CRITICAL',
      message: 'Temperature exceeded the critical threshold',
      component: 'temperature-sensor',
      timestamp: '2026-07-14T18:00:00.000Z',
      acknowledged: false,
    };

    let resolveAcknowledgement: ((alert: AlertTransport) => void) | undefined;

    const acknowledgeAlert = jest.fn(
      async (): Promise<AlertTransport> =>
        new Promise<AlertTransport>((resolve) => {
          resolveAcknowledgement = resolve;
        }),
    );

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        initialAlerts={[alert]}
        connectToMachine={() => jest.fn()}
        acknowledgeAlert={acknowledgeAlert}
      />,
    );

    const acknowledgeButton = screen.getByRole('button', {
      name: 'Reconhecer alerta crítico',
    });

    fireEvent.click(acknowledgeButton);

    await waitFor(() => {
      expect(acknowledgeAlert).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByRole('button', {
        name: 'Reconhecendo alerta crítico',
      }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Reconhecendo alerta crítico',
      }),
    );

    expect(acknowledgeAlert).toHaveBeenCalledTimes(1);

    if (resolveAcknowledgement === undefined) {
      throw new Error('Acknowledgement request was not started');
    }

    const completeAcknowledgement = resolveAcknowledgement;

    act(() => {
      completeAcknowledgement({
        ...alert,
        acknowledged: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Reconhecido')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', {
        name: 'Reconhecendo alerta crítico',
      }),
    ).not.toBeInTheDocument();
  });

  it('shows an error and allows retry when alert acknowledgement fails', async () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-14T18:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 82,
        rpm: 1250,
        uptime: 7200,
        efficiency: 91,
      },
      oee: {
        overall: 87,
        availability: 95,
        performance: 93,
        quality: 98,
      },
    };

    const alert: AlertTransport = {
      id: 'alert-003',
      level: 'CRITICAL',
      message: 'Temperature exceeded the critical threshold',
      component: 'temperature-sensor',
      timestamp: '2026-07-14T18:00:00.000Z',
      acknowledged: false,
    };

    const acknowledgeAlert = jest
      .fn<() => Promise<AlertTransport>>()
      .mockRejectedValueOnce(new Error('API unavailable'))
      .mockResolvedValueOnce({
        ...alert,
        acknowledged: true,
      });

    render(
      <MachineRealtimeDashboard
        initialMachineStatus={initialMachineStatus}
        initialAlerts={[alert]}
        connectToMachine={() => jest.fn()}
        acknowledgeAlert={acknowledgeAlert}
      />,
    );

    const alertItem = screen.getByRole('listitem');

    const acknowledgeButton = within(alertItem).getByRole('button', {
      name: 'Reconhecer alerta crítico',
    });

    fireEvent.click(acknowledgeButton);

    expect(await within(alertItem).findByRole('alert')).toHaveTextContent(
      'Não foi possível reconhecer o alerta. Tente novamente.',
    );

    expect(alertItem).toHaveTextContent('Aguardando reconhecimento');

    const retryButton = within(alertItem).getByRole('button', {
      name: 'Reconhecer alerta crítico',
    });

    expect(retryButton).toBeEnabled();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(alertItem).toHaveTextContent('Reconhecido');
    });

    expect(acknowledgeAlert).toHaveBeenCalledTimes(2);

    expect(within(alertItem).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('acknowledges an alert through the browser API client by default', async () => {
    const initialMachineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-14T18:00:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 82,
        rpm: 1250,
        uptime: 7200,
        efficiency: 91,
      },
      oee: {
        overall: 87,
        availability: 95,
        performance: 93,
        quality: 98,
      },
    };

    const alert: AlertTransport = {
      id: 'alert-003',
      level: 'CRITICAL',
      message: 'Temperature exceeded the critical threshold',
      component: 'temperature-sensor',
      timestamp: '2026-07-14T18:00:00.000Z',
      acknowledged: false,
    };

    const previousApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const previousFetch = globalThis.fetch;

    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://api.example.test';

    const fetchMock = jest.fn(
      async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        expect(input).toBe(
          'http://api.example.test/api/v1/machines/mixer-01/alerts/alert-003/acknowledge',
        );

        expect(init).toEqual({
          method: 'PATCH',
          headers: {
            accept: 'application/json',
          },
        });

        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            ...alert,
            acknowledged: true,
          }),
        } as Response;
      },
    );

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    try {
      render(
        <MachineRealtimeDashboard
          initialMachineStatus={initialMachineStatus}
          initialAlerts={[alert]}
          connectToMachine={() => jest.fn()}
        />,
      );

      const alertItem = screen.getByRole('listitem');

      fireEvent.click(
        within(alertItem).getByRole('button', {
          name: 'Reconhecer alerta crítico',
        }),
      );

      await waitFor(() => {
        expect(alertItem).toHaveTextContent('Reconhecido');
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      expect(
        within(alertItem).queryByRole('button', {
          name: 'Reconhecer alerta crítico',
        }),
      ).not.toBeInTheDocument();
    } finally {
      if (previousApiBaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_API_BASE_URL = previousApiBaseUrl;
      }

      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        writable: true,
        value: previousFetch,
      });
    }
  });
});
