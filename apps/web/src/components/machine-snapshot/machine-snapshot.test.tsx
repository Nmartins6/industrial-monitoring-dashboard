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
});
