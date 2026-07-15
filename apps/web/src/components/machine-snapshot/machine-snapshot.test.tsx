import { describe, expect, it } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import type { MachineStatusTransport } from '@industrial-monitoring/contracts';

import { MachineSnapshot } from './machine-snapshot';

describe('MachineSnapshot', () => {
  it('renders the machine status received from the API contract', () => {
    const machineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T14:30:00.000Z',
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

    render(<MachineSnapshot machineStatus={machineStatus} />);

    const statusRegion = screen.getByRole('region', {
      name: 'Status da máquina',
    });

    expect(
      within(statusRegion).getByRole('status', {
        name: 'Estado atual da máquina',
      }),
    ).toHaveTextContent('Em operação');

    expect(
      within(statusRegion).getByLabelText('Última atualização da máquina'),
    ).toHaveAttribute('datetime', '2026-07-13T14:30:00.000Z');

    const metricsRegion = screen.getByRole('region', {
      name: 'Métricas atuais',
    });

    expect(within(metricsRegion).getByText('73,8 °C')).toBeInTheDocument();

    expect(within(metricsRegion).getByText('1.234')).toBeInTheDocument();

    expect(within(metricsRegion).getByText('1 h 1 min')).toBeInTheDocument();

    const oeeRegion = screen.getByRole('region', {
      name: 'Eficiência global do equipamento (OEE)',
    });

    expect(within(oeeRegion).getByText('87,6%')).toBeInTheDocument();

    expect(within(oeeRegion).getByText('95,2%')).toBeInTheDocument();

    expect(within(oeeRegion).getByText('94,1%')).toBeInTheDocument();

    expect(within(oeeRegion).getByText('97,8%')).toBeInTheDocument();
  });

  it('renders accessible progress bars for the OEE indicators', () => {
    const machineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T14:30:00.000Z',
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

    render(<MachineSnapshot machineStatus={machineStatus} />);

    const oeeProgress = screen.getByRole('progressbar', {
      name: 'Progresso do OEE geral',
    });

    expect(oeeProgress).toHaveAttribute('aria-valuemin', '0');
    expect(oeeProgress).toHaveAttribute('aria-valuemax', '100');
    expect(oeeProgress).toHaveAttribute('aria-valuenow', '87.6');
    expect(oeeProgress).toHaveStyle({
      width: '87.6%',
    });

    const availabilityProgress = screen.getByRole('progressbar', {
      name: 'Progresso da disponibilidade',
    });

    expect(availabilityProgress).toHaveAttribute('aria-valuenow', '95.2');

    expect(availabilityProgress).toHaveStyle({
      width: '95.2%',
    });

    const performanceProgress = screen.getByRole('progressbar', {
      name: 'Progresso do desempenho',
    });

    expect(performanceProgress).toHaveAttribute('aria-valuenow', '94.1');

    expect(performanceProgress).toHaveStyle({
      width: '94.1%',
    });

    const qualityProgress = screen.getByRole('progressbar', {
      name: 'Progresso da qualidade',
    });

    expect(qualityProgress).toHaveAttribute('aria-valuenow', '97.8');

    expect(qualityProgress).toHaveStyle({
      width: '97.8%',
    });
  });

  it('limits OEE progress bars to the valid percentage range', () => {
    const machineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T14:30:00.000Z',
      state: 'RUNNING',
      metrics: {
        temperature: 73.8,
        rpm: 1234,
        uptime: 3661,
        efficiency: 92.4,
      },
      oee: {
        overall: -5,
        availability: 110,
        performance: 50,
        quality: 100,
      },
    };

    render(<MachineSnapshot machineStatus={machineStatus} />);

    const oeeProgress = screen.getByRole('progressbar', {
      name: 'Progresso do OEE geral',
    });

    expect(oeeProgress).toHaveAttribute('aria-valuenow', '0');

    expect(oeeProgress).toHaveStyle({
      width: '0%',
    });

    const availabilityProgress = screen.getByRole('progressbar', {
      name: 'Progresso da disponibilidade',
    });

    expect(availabilityProgress).toHaveAttribute('aria-valuenow', '100');

    expect(availabilityProgress).toHaveStyle({
      width: '100%',
    });

    const performanceProgress = screen.getByRole('progressbar', {
      name: 'Progresso do desempenho',
    });

    expect(performanceProgress).toHaveAttribute('aria-valuenow', '50');

    expect(performanceProgress).toHaveStyle({
      width: '50%',
    });
  });

  it('uses semantic theme tokens for snapshot surfaces and labels', () => {
    const machineStatus: MachineStatusTransport = {
      id: 'mixer-01',
      timestamp: '2026-07-13T14:30:00.000Z',
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

    render(<MachineSnapshot machineStatus={machineStatus} />);

    const statusRegion = screen.getByRole('region', {
      name: 'Status da máquina',
    });

    expect(statusRegion).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    const statusContent = statusRegion.firstElementChild;

    expect(statusContent).not.toBeNull();

    expect(statusContent).toHaveClass(
      'flex-col',
      'items-start',
      'gap-4',
      'sm:flex-row',
      'sm:justify-between',
    );

    expect(
      within(statusRegion).getByLabelText('Última atualização da máquina'),
    ).toHaveClass('text-muted');

    const stateBadge = within(statusRegion).getByRole('status', {
      name: 'Estado atual da máquina',
    });

    expect(stateBadge).toHaveClass('self-start');

    const temperatureCard = screen.getByRole('article', {
      name: 'Métrica de temperatura',
    });

    expect(temperatureCard).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    expect(
      within(temperatureCard).getByRole('heading', {
        name: 'Temperatura',
      }),
    ).toHaveClass('text-muted');

    const rpmCard = screen.getByRole('article', {
      name: 'Métrica de RPM',
    });

    expect(rpmCard).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    const uptimeCard = screen.getByRole('article', {
      name: 'Métrica de tempo em operação',
    });

    expect(uptimeCard).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    const oeeCard = screen.getByRole('article', {
      name: 'OEE geral',
    });

    expect(oeeCard).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    expect(
      within(oeeCard).getByRole('heading', {
        name: 'OEE geral',
      }),
    ).toHaveClass('text-muted');
  });

  it.each([
    {
      state: 'RUNNING' as const,
      label: 'Em operação',
      borderClass: 'border-success/30',
      backgroundClass: 'bg-success/10',
      textClass: 'text-success',
    },
    {
      state: 'STOPPED' as const,
      label: 'Parada',
      borderClass: 'border-muted/30',
      backgroundClass: 'bg-muted/10',
      textClass: 'text-muted',
    },
    {
      state: 'MAINTENANCE' as const,
      label: 'Em manutenção',
      borderClass: 'border-warning/30',
      backgroundClass: 'bg-warning/10',
      textClass: 'text-warning',
    },
    {
      state: 'ERROR' as const,
      label: 'Com erro',
      borderClass: 'border-danger/30',
      backgroundClass: 'bg-danger/10',
      textClass: 'text-danger',
    },
  ])(
    'uses semantic status styles for $state',
    ({ state, label, borderClass, backgroundClass, textClass }) => {
      const machineStatus: MachineStatusTransport = {
        id: 'mixer-01',
        timestamp: '2026-07-13T14:30:00.000Z',
        state,
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

      render(<MachineSnapshot machineStatus={machineStatus} />);

      const stateBadge = screen.getByRole('status', {
        name: 'Estado atual da máquina',
      });

      expect(stateBadge).toHaveTextContent(label);

      expect(stateBadge).toHaveClass(borderClass, backgroundClass, textClass);
    },
  );
});
