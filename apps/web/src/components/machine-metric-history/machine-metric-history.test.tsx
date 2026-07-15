import { describe, expect, it } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import type { MetricHistoryTransport } from '@industrial-monitoring/contracts';

import { MachineMetricHistory } from './machine-metric-history';

describe('MachineMetricHistory', () => {
  it('renders accessible charts for the machine metric history', () => {
    const metricHistory: MetricHistoryTransport[] = [
      {
        timestamp: '2026-07-13T19:00:00.000Z',
        temperature: 72,
        rpm: 1200,
        efficiency: 92,
      },
      {
        timestamp: '2026-07-13T19:00:03.000Z',
        temperature: 73.5,
        rpm: 1240,
        efficiency: 93.2,
      },
    ];

    render(<MachineMetricHistory metricHistory={metricHistory} />);

    const metricHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de métricas',
    });

    expect(
      within(metricHistoryRegion).getByRole('heading', {
        level: 2,
        name: 'Histórico de métricas',
      }),
    ).toBeInTheDocument();

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

    const temperatureFigure = within(metricHistoryRegion).getByRole('figure', {
      name: 'Histórico de temperatura',
    });

    expect(
      within(temperatureFigure).getByRole('img', {
        name: 'Gráfico de temperatura ao longo do tempo',
      }),
    ).toBeInTheDocument();

    const rotationFigure = within(metricHistoryRegion).getByRole('figure', {
      name: 'Histórico de rotação',
    });

    expect(
      within(rotationFigure).getByRole('img', {
        name: 'Gráfico de rotação ao longo do tempo',
      }),
    ).toBeInTheDocument();

    const efficiencyFigure = within(metricHistoryRegion).getByRole('figure', {
      name: 'Histórico de eficiência',
    });

    expect(
      within(efficiencyFigure).getByRole('img', {
        name: 'Gráfico de eficiência ao longo do tempo',
      }),
    ).toBeInTheDocument();

    expect(metricHistoryRegion).toHaveTextContent(
      'Última temperatura: 73,5 °C',
    );

    expect(metricHistoryRegion).toHaveTextContent('Última rotação: 1.240 RPM');

    expect(metricHistoryRegion).toHaveTextContent('Última eficiência: 93,2%');
  });

  it('uses semantic theme tokens for metric summaries and charts', () => {
    const metricHistory: MetricHistoryTransport[] = [
      {
        timestamp: '2026-07-13T19:00:00.000Z',
        temperature: 72,
        rpm: 1200,
        efficiency: 92,
      },
      {
        timestamp: '2026-07-13T19:00:03.000Z',
        temperature: 73.5,
        rpm: 1240,
        efficiency: 93.2,
      },
    ];

    render(<MachineMetricHistory metricHistory={metricHistory} />);

    const metricHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de métricas',
    });

    expect(
      within(metricHistoryRegion).getByText('2 medições no período'),
    ).toHaveClass('text-muted');

    const temperatureSummary =
      within(metricHistoryRegion).getByText(/Última temperatura:/);

    expect(temperatureSummary).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    const rotationSummary =
      within(metricHistoryRegion).getByText(/Última rotação:/);

    expect(rotationSummary).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    const efficiencySummary =
      within(metricHistoryRegion).getByText(/Última eficiência:/);

    expect(efficiencySummary).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    const temperatureFigure = within(metricHistoryRegion).getByRole('figure', {
      name: 'Histórico de temperatura',
    });

    expect(temperatureFigure).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    const rotationFigure = within(metricHistoryRegion).getByRole('figure', {
      name: 'Histórico de rotação',
    });

    expect(rotationFigure).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    const efficiencyFigure = within(metricHistoryRegion).getByRole('figure', {
      name: 'Histórico de eficiência',
    });

    expect(efficiencyFigure).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );
  });

  it('uses semantic colors for chart grids, axes and metric lines', () => {
    const metricHistory: MetricHistoryTransport[] = [
      {
        timestamp: '2026-07-13T19:00:00.000Z',
        temperature: 72,
        rpm: 1200,
        efficiency: 92,
      },
      {
        timestamp: '2026-07-13T19:00:03.000Z',
        temperature: 73.5,
        rpm: 1240,
        efficiency: 93.2,
      },
    ];

    const { container } = render(
      <MachineMetricHistory metricHistory={metricHistory} />,
    );

    const gridLines = container.querySelectorAll(
      '.recharts-cartesian-grid line',
    );

    expect(gridLines.length).toBeGreaterThan(0);

    for (const gridLine of gridLines) {
      expect(gridLine).toHaveAttribute('stroke', 'var(--border)');
    }

    const axisLines = container.querySelectorAll(
      '.recharts-cartesian-axis-line',
    );

    expect(axisLines.length).toBeGreaterThan(0);

    for (const axisLine of axisLines) {
      expect(axisLine).toHaveAttribute('stroke', 'var(--border-strong)');
    }

    const axisTickLabels = container.querySelectorAll(
      '.recharts-cartesian-axis-tick-value',
    );

    expect(axisTickLabels.length).toBeGreaterThan(0);

    for (const tickLabel of axisTickLabels) {
      expect(tickLabel).toHaveAttribute('fill', 'var(--muted)');
    }

    const metricLines = container.querySelectorAll('.recharts-line-curve');

    expect(metricLines).toHaveLength(3);

    expect(metricLines[0]).toHaveAttribute('stroke', 'var(--warning)');

    expect(metricLines[1]).toHaveAttribute('stroke', 'var(--info)');

    expect(metricLines[2]).toHaveAttribute('stroke', 'var(--success)');
  });
});
