import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import type { MachineStatusTransport } from '@industrial-monitoring/contracts';

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

async function renderHome(): Promise<void> {
  const page = await renderDashboardPage({
    loadMachineStatus: async () => DEFAULT_MACHINE_STATUS,
  });

  render(page);
}

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
    ).toHaveTextContent('Conectado');
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

    expect(within(warningAlert).getByText('Alerta')).toBeInTheDocument();

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

  it('loads the initial machine snapshot from the configured API', async () => {
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

    const previousApiBaseUrl = process.env.API_BASE_URL;
    const previousFetch = globalThis.fetch;

    const fetchMock = jest.fn(
      async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        expect(input).toBe(
          'http://api.example.test/api/v1/machines/mixer-01/status',
        );

        expect(init).toEqual({
          cache: 'no-store',
          headers: {
            accept: 'application/json',
          },
        });

        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => machineStatus,
        } as Response;
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

      expect(screen.getByText('65,4 °C')).toBeInTheDocument();

      expect(fetchMock).toHaveBeenCalledTimes(1);
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
  });
});
