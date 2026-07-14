import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { act, render, screen, within } from '@testing-library/react';

import type {
  AlertTransport,
  AlertCreatedEvent,
  MachineStatusTransport,
  MetricHistoryTransport,
  RealtimeEvent,
} from '@industrial-monitoring/contracts';

import Home, { renderDashboardPage } from './page';
import { MachineApiError } from '@/lib/api/machine-api-client';

const DEFAULT_MACHINE_STATUS: MachineStatusTransport = {
  id: 'mixer-01',
  timestamp: '2026-07-13T00:00:00.000Z',
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

const DEFAULT_ALERT_HISTORY: AlertTransport[] = [
  {
    id: 'alert-003',
    level: 'CRITICAL',
    message: 'A temperatura excedeu o limite crítico',
    component: 'Sensor de temperatura',
    timestamp: '2026-07-12T10:00:12.000Z',
    acknowledged: false,
  },
  {
    id: 'alert-002',
    level: 'WARNING',
    message: 'A vibração do motor está acima do nível recomendado',
    component: 'Motor',
    timestamp: '2026-07-12T10:00:09.000Z',
    acknowledged: false,
  },
  {
    id: 'alert-001',
    level: 'INFO',
    message: 'Monitoramento da máquina iniciado',
    component: 'Sistema de monitoramento',
    timestamp: '2026-07-12T10:00:00.000Z',
    acknowledged: true,
  },
];

async function renderHome(): Promise<void> {
  const page = await renderDashboardPage({
    loadMachineStatus: async () => DEFAULT_MACHINE_STATUS,
    loadAlertHistory: async () => DEFAULT_ALERT_HISTORY,
  });

  render(page);
}

class FakePageEventSource {
  static readonly instances: FakePageEventSource[] = [];

  readonly url: string;

  readonly listeners = new Map<string, EventListenerOrEventListenerObject>();

  constructor(url: string | URL) {
    this.url = String(url);

    FakePageEventSource.instances.push(this);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void {
    this.listeners.set(type, listener);
  }

  emit(type: string, event: RealtimeEvent): void {
    const listener = this.listeners.get(type);

    if (listener === undefined) {
      throw new Error(`No page listener registered for ${type}`);
    }

    const messageEvent = {
      data: JSON.stringify(event),
    } as MessageEvent<string>;

    if (typeof listener === 'function') {
      listener(messageEvent);

      return;
    }

    listener.handleEvent(messageEvent);
  }

  close(): void {}
}

const previousEventSource = globalThis.EventSource;

beforeAll(() => {
  Object.defineProperty(globalThis, 'EventSource', {
    configurable: true,
    writable: true,
    value: FakePageEventSource,
  });
});

afterAll(() => {
  if (previousEventSource === undefined) {
    Reflect.deleteProperty(globalThis, 'EventSource');

    return;
  }

  Object.defineProperty(globalThis, 'EventSource', {
    configurable: true,
    writable: true,
    value: previousEventSource,
  });
});

describe('Home page', () => {
  it('shows the dashboard heading', async () => {
    await renderHome();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Painel de Monitoramento Industrial',
      }),
    ).toBeInTheDocument();
  });

  it('shows the monitored machine and realtime connection status', async () => {
    await renderHome();

    expect(screen.getByRole('banner')).toBeInTheDocument();

    expect(screen.getByText('Mixer 01')).toBeInTheDocument();

    expect(
      screen.getByRole('status', {
        name: 'Status da conexão em tempo real',
      }),
    ).toHaveTextContent('Conectando');
  });

  it('shows the current machine operating status', async () => {
    await renderHome();

    const machineStatusRegion = screen.getByRole('region', {
      name: 'Status da máquina',
    });

    expect(
      within(machineStatusRegion).getByRole('heading', {
        level: 2,
        name: 'Status da máquina',
      }),
    ).toBeInTheDocument();

    expect(
      within(machineStatusRegion).getByRole('status', {
        name: 'Estado atual da máquina',
      }),
    ).toHaveTextContent('Em operação');

    const lastUpdate = within(machineStatusRegion).getByLabelText(
      'Última atualização da máquina',
    );

    expect(lastUpdate).toHaveAttribute('datetime');
    expect(lastUpdate).toHaveTextContent('Atualizado agora');
  });

  it('shows the current machine metrics', async () => {
    await renderHome();

    const metricsRegion = screen.getByRole('region', {
      name: 'Métricas atuais',
    });

    expect(
      within(metricsRegion).getByRole('heading', {
        level: 2,
        name: 'Métricas atuais',
      }),
    ).toBeInTheDocument();

    const temperatureMetric = within(metricsRegion).getByRole('article', {
      name: 'Métrica de temperatura',
    });

    expect(
      within(temperatureMetric).getByRole('heading', {
        level: 3,
        name: 'Temperatura',
      }),
    ).toBeInTheDocument();

    expect(within(temperatureMetric).getByText('72 °C')).toBeInTheDocument();

    const rpmMetric = within(metricsRegion).getByRole('article', {
      name: 'Métrica de RPM',
    });

    expect(
      within(rpmMetric).getByRole('heading', {
        level: 3,
        name: 'RPM',
      }),
    ).toBeInTheDocument();

    expect(within(rpmMetric).getByText('1.200')).toBeInTheDocument();

    const uptimeMetric = within(metricsRegion).getByRole('article', {
      name: 'Métrica de tempo em operação',
    });

    expect(
      within(uptimeMetric).getByRole('heading', {
        level: 3,
        name: 'Tempo em operação',
      }),
    ).toBeInTheDocument();

    expect(within(uptimeMetric).getByText('8 h')).toBeInTheDocument();
  });

  it('shows the current machine OEE indicators', async () => {
    await renderHome();

    const oeeRegion = screen.getByRole('region', {
      name: 'Eficiência global do equipamento (OEE)',
    });

    expect(
      within(oeeRegion).getByRole('heading', {
        level: 2,
        name: 'Eficiência global do equipamento (OEE)',
      }),
    ).toBeInTheDocument();

    const overallOee = within(oeeRegion).getByRole('article', {
      name: 'OEE geral',
    });

    expect(within(overallOee).getByText('88,4%')).toBeInTheDocument();

    const availability = within(oeeRegion).getByRole('article', {
      name: 'Disponibilidade',
    });

    expect(within(availability).getByText('96%')).toBeInTheDocument();

    const performance = within(oeeRegion).getByRole('article', {
      name: 'Desempenho',
    });

    expect(within(performance).getByText('94%')).toBeInTheDocument();

    const quality = within(oeeRegion).getByRole('article', {
      name: 'Qualidade',
    });

    expect(within(quality).getByText('98%')).toBeInTheDocument();
  });

  it('shows the machine alert history from newest to oldest', async () => {
    await renderHome();

    const alertHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de alertas',
    });

    expect(
      within(alertHistoryRegion).getByRole('heading', {
        level: 2,
        name: 'Histórico de alertas',
      }),
    ).toBeInTheDocument();

    const alertItems = within(alertHistoryRegion).getAllByRole('listitem');

    expect(alertItems).toHaveLength(3);

    const criticalAlert = alertItems[0];

    expect(criticalAlert).toBeDefined();

    if (criticalAlert === undefined) {
      throw new Error('Critical alert was not rendered');
    }

    expect(within(criticalAlert).getByText('Crítico')).toBeInTheDocument();

    expect(
      within(criticalAlert).getByText('A temperatura excedeu o limite crítico'),
    ).toBeInTheDocument();

    expect(
      within(criticalAlert).getByText('Sensor de temperatura'),
    ).toBeInTheDocument();

    const criticalAlertTimestamp = within(criticalAlert).getByLabelText(
      'Horário do alerta crítico',
    );

    expect(criticalAlertTimestamp).toHaveAttribute(
      'datetime',
      '2026-07-12T10:00:12.000Z',
    );

    const warningAlert = alertItems[1];

    expect(warningAlert).toBeDefined();

    if (warningAlert === undefined) {
      throw new Error('Warning alert was not rendered');
    }

    expect(within(warningAlert).getByText('Aviso')).toBeInTheDocument();

    expect(
      within(warningAlert).getByText(
        'A vibração do motor está acima do nível recomendado',
      ),
    ).toBeInTheDocument();

    const informationAlert = alertItems[2];

    expect(informationAlert).toBeDefined();

    if (informationAlert === undefined) {
      throw new Error('Information alert was not rendered');
    }

    expect(
      within(informationAlert).getByText('Informativo'),
    ).toBeInTheDocument();

    expect(
      within(informationAlert).getByText('Monitoramento da máquina iniciado'),
    ).toBeInTheDocument();
  });

  it('loads the machine snapshot through the dashboard dependency', async () => {
    const machineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T15:45:00.000Z',
      state: 'MAINTENANCE',
      metrics: {
        temperature: 64.7,
        rpm: 0,
        uptime: 43_210,
        efficiency: 0,
      },
      oee: {
        overall: 0,
        availability: 81.3,
        performance: 0,
        quality: 96.4,
      },
    };

    const loadMachineStatus = jest.fn(
      async (machineId: string): Promise<MachineStatusTransport> => {
        expect(machineId).toBe('mixer-01');

        return machineStatus;
      },
    );

    const page = await renderDashboardPage({
      loadMachineStatus,
    });

    render(page);

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

    expect(loadMachineStatus).toHaveBeenCalledTimes(1);
  });

  it('loads the initial machine data from the configured API', async () => {
    const machineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T16:30:00.000Z',
      state: 'MAINTENANCE',
      metrics: {
        temperature: 65.4,
        rpm: 0,
        uptime: 45_000,
        efficiency: 0,
      },
      oee: {
        overall: 0,
        availability: 82.5,
        performance: 0,
        quality: 97.1,
      },
    };

    const metricHistory: MetricHistoryTransport[] = [
      {
        timestamp: '2026-07-13T16:29:57.000Z',
        temperature: 64.8,
        rpm: 0,
        efficiency: 0,
      },
      {
        timestamp: '2026-07-13T16:30:00.000Z',
        temperature: 65.4,
        rpm: 0,
        efficiency: 0,
      },
    ];

    const alertHistory: AlertTransport[] = [
      {
        id: 'alert-api-001',
        level: 'CRITICAL',
        message: 'Temperature exceeded the critical threshold',
        component: 'temperature-sensor',
        timestamp: '2026-07-13T16:30:00.000Z',
        acknowledged: false,
      },
    ];

    const previousApiBaseUrl = process.env.API_BASE_URL;
    const previousFetch = globalThis.fetch;

    const fetchMock = jest.fn(
      async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        expect(init).toEqual({
          cache: 'no-store',
          headers: {
            accept: 'application/json',
          },
        });

        const url = String(input);

        if (url === 'http://api.example.test/api/v1/machines/mixer-01/status') {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => machineStatus,
          } as Response;
        }

        if (
          url ===
          'http://api.example.test/api/v1/machines/mixer-01/metrics/history'
        ) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => metricHistory,
          } as Response;
        }

        if (url === 'http://api.example.test/api/v1/machines/mixer-01/alerts') {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => alertHistory,
          } as Response;
        }

        throw new Error(`Unexpected API request: ${url}`);
      },
    );

    process.env.API_BASE_URL = 'http://api.example.test';

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    try {
      const page = await Home();

      render(page);

      expect(
        screen.getByRole('status', {
          name: 'Estado atual da máquina',
        }),
      ).toHaveTextContent('Em manutenção');

      const currentMetricsRegion = screen.getByRole('region', {
        name: 'Métricas atuais',
      });

      const temperatureMetric = within(currentMetricsRegion).getByRole(
        'article',
        {
          name: 'Métrica de temperatura',
        },
      );

      expect(
        within(temperatureMetric).getByText('65,4 °C'),
      ).toBeInTheDocument();

      const metricHistoryRegion = screen.getByRole('region', {
        name: 'Histórico de métricas',
      });

      expect(metricHistoryRegion).toHaveTextContent('2 medições no período');

      expect(metricHistoryRegion).toHaveTextContent(
        'Última temperatura: 65,4 °C',
      );

      expect(metricHistoryRegion).toHaveTextContent('Última rotação: 0 RPM');

      expect(metricHistoryRegion).toHaveTextContent('Última eficiência: 0%');

      const alertHistoryRegion = screen.getByRole('region', {
        name: 'Histórico de alertas',
      });

      const alertItems = within(alertHistoryRegion).getAllByRole('listitem');

      expect(alertItems).toHaveLength(1);

      expect(alertHistoryRegion).toHaveTextContent(
        'A temperatura excedeu o limite crítico',
      );

      expect(alertHistoryRegion).not.toHaveTextContent(
        'Temperature exceeded the critical threshold',
      );

      expect(alertHistoryRegion).toHaveTextContent('Sensor de temperatura');

      expect(alertHistoryRegion).not.toHaveTextContent('temperature-sensor');

      expect(alertHistoryRegion).toHaveTextContent('Aguardando reconhecimento');

      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      if (previousApiBaseUrl === undefined) {
        delete process.env.API_BASE_URL;
      } else {
        process.env.API_BASE_URL = previousApiBaseUrl;
      }

      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        writable: true,
        value: previousFetch,
      });
    }
  });

  it('shows a not found state when the monitored machine does not exist', async () => {
    const loadMachineStatus = jest.fn(
      async (): Promise<MachineStatusTransport> => {
        throw new MachineApiError(
          'Failed to load machine status: 404 Not Found',
          404,
        );
      },
    );

    const page = await renderDashboardPage({
      loadMachineStatus,
    });

    render(page);

    expect(
      screen.getByRole('status', {
        name: 'Status da conexão em tempo real',
      }),
    ).toHaveTextContent('Desconectado');

    const errorAlert = screen.getByRole('alert');

    expect(
      within(errorAlert).getByRole('heading', {
        level: 2,
        name: 'Máquina não encontrada',
      }),
    ).toBeInTheDocument();

    expect(errorAlert).toHaveTextContent(
      'A máquina monitorada não foi encontrada.',
    );

    expect(
      screen.queryByRole('region', {
        name: 'Status da máquina',
      }),
    ).not.toBeInTheDocument();

    expect(loadMachineStatus).toHaveBeenCalledTimes(1);
  });

  it('shows an unavailable state when the machine data cannot be loaded', async () => {
    const loadMachineStatus = jest.fn(
      async (): Promise<MachineStatusTransport> => {
        throw new MachineApiError(
          'Failed to load machine status: 500 Internal Server Error',
          500,
        );
      },
    );

    const retryMachineData = jest.fn();

    const page = await renderDashboardPage({
      loadMachineStatus,
      retryMachineData,
    });

    render(page);

    expect(
      screen.getByRole('status', {
        name: 'Status da conexão em tempo real',
      }),
    ).toHaveTextContent('Desconectado');

    const errorAlert = screen.getByRole('alert');

    expect(
      within(errorAlert).getByRole('heading', {
        level: 2,
        name: 'Dados da máquina indisponíveis',
      }),
    ).toBeInTheDocument();

    expect(errorAlert).toHaveTextContent(
      'Não foi possível carregar os dados mais recentes da máquina.',
    );

    expect(
      screen.queryByRole('region', {
        name: 'Status da máquina',
      }),
    ).not.toBeInTheDocument();

    expect(loadMachineStatus).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole('status', {
        name: 'Tentativa de reconexão',
      }),
    ).toHaveTextContent('Tentando reconectar automaticamente...');
  });

  it('adds real-time alerts to the page history', async () => {
    await renderHome();

    const eventSource =
      FakePageEventSource.instances[FakePageEventSource.instances.length - 1];

    expect(eventSource).toBeDefined();

    if (eventSource === undefined) {
      throw new Error('Page EventSource was not created');
    }

    const alertCreatedEvent: AlertCreatedEvent = {
      id: 'event-page-alert-001',
      emittedAt: '2026-07-13T20:00:00.000Z',
      type: 'ALERT_CREATED',
      payload: {
        id: 'alert-realtime-001',
        level: 'CRITICAL',
        message: 'Temperatura excedeu o limite crítico',
        component: 'temperature-sensor',
        timestamp: '2026-07-13T20:00:00.000Z',
        acknowledged: false,
      },
    };

    act(() => {
      eventSource.emit('ALERT_CREATED', alertCreatedEvent);
    });

    const alertHistory = screen.getByRole('region', {
      name: 'Histórico de alertas',
    });

    expect(within(alertHistory).getAllByRole('listitem')).toHaveLength(4);

    expect(alertHistory).toHaveTextContent(
      'Temperatura excedeu o limite crítico',
    );

    expect(alertHistory).toHaveTextContent('Crítico');

    expect(alertHistory).toHaveTextContent('Aguardando reconhecimento');
  });

  it('loads the initial metric history through the dashboard dependency', async () => {
    const metricHistory: MetricHistoryTransport[] = [
      {
        timestamp: '2026-07-13T15:44:57.000Z',
        temperature: 63.8,
        rpm: 0,
        efficiency: 0,
      },
      {
        timestamp: '2026-07-13T15:45:00.000Z',
        temperature: 64.7,
        rpm: 0,
        efficiency: 0,
      },
    ];

    const loadMachineStatus = jest.fn(
      async (machineId: string): Promise<MachineStatusTransport> => {
        expect(machineId).toBe('mixer-01');

        return DEFAULT_MACHINE_STATUS;
      },
    );

    const loadMetricHistory = jest.fn(
      async (machineId: string): Promise<MetricHistoryTransport[]> => {
        expect(machineId).toBe('mixer-01');

        return metricHistory;
      },
    );

    const page = await renderDashboardPage({
      loadMachineStatus,
      loadMetricHistory,
    });

    render(page);

    const metricHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de métricas',
    });

    expect(metricHistoryRegion).toHaveTextContent('2 medições no período');

    expect(metricHistoryRegion).toHaveTextContent(
      'Última temperatura: 64,7 °C',
    );

    expect(metricHistoryRegion).toHaveTextContent('Última rotação: 0 RPM');

    expect(metricHistoryRegion).toHaveTextContent('Última eficiência: 0%');

    expect(loadMachineStatus).toHaveBeenCalledTimes(1);
    expect(loadMetricHistory).toHaveBeenCalledTimes(1);
  });

  it('loads the initial alert history through the dashboard dependency', async () => {
    const alertHistory: AlertTransport[] = [
      {
        id: 'alert-custom-001',
        level: 'WARNING',
        message: 'Pressure is above the recommended level',
        component: 'pressure-sensor',
        timestamp: '2026-07-14T18:00:00.000Z',
        acknowledged: false,
      },
    ];

    const loadMachineStatus = jest.fn(
      async (machineId: string): Promise<MachineStatusTransport> => {
        expect(machineId).toBe('mixer-01');

        return DEFAULT_MACHINE_STATUS;
      },
    );

    const loadAlertHistory = jest.fn(
      async (machineId: string): Promise<AlertTransport[]> => {
        expect(machineId).toBe('mixer-01');

        return alertHistory;
      },
    );

    const page = await renderDashboardPage({
      loadMachineStatus,
      loadAlertHistory,
    });

    render(page);

    const alertHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de alertas',
    });

    const alertItems = within(alertHistoryRegion).getAllByRole('listitem');

    expect(alertItems).toHaveLength(1);

    expect(alertHistoryRegion).toHaveTextContent(
      'Pressure is above the recommended level',
    );

    expect(alertHistoryRegion).toHaveTextContent('pressure-sensor');

    expect(alertHistoryRegion).toHaveTextContent('Aguardando reconhecimento');

    expect(loadMachineStatus).toHaveBeenCalledTimes(1);
    expect(loadAlertHistory).toHaveBeenCalledTimes(1);
  });

  it('does not render an alert history when no initial alerts are loaded', async () => {
    const page = await renderDashboardPage({
      loadMachineStatus: async () => DEFAULT_MACHINE_STATUS,
    });

    render(page);

    expect(
      screen.queryByRole('region', {
        name: 'Histórico de alertas',
      }),
    ).not.toBeInTheDocument();
  });
});
