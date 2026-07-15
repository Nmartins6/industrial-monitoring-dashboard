import { fireEvent, render, screen, within } from '@testing-library/react';

import { describe, expect, it, jest } from '@jest/globals';

import type { AlertTransport } from '@industrial-monitoring/contracts';

import { MachineAlertHistory } from './machine-alert-history';

describe('MachineAlertHistory', () => {
  it('renders a localized alert and requests its acknowledgement', () => {
    const alert: AlertTransport = {
      id: 'alert-003',
      level: 'CRITICAL',
      message: 'Temperature exceeded the critical threshold',
      component: 'temperature-sensor',
      timestamp: '2026-07-14T18:00:00.000Z',
      acknowledged: false,
    };

    const onAcknowledgeAlert = jest.fn();

    render(
      <MachineAlertHistory
        alerts={[alert]}
        acknowledgingAlertIds={new Set()}
        acknowledgementErrorAlertIds={new Set()}
        onAcknowledgeAlert={onAcknowledgeAlert}
      />,
    );

    const alertHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de alertas',
    });

    const alertItem = within(alertHistoryRegion).getByRole('listitem');

    expect(alertItem).toHaveTextContent('Crítico');
    expect(alertItem).toHaveTextContent('Sensor de temperatura');
    expect(alertItem).toHaveTextContent(
      'A temperatura excedeu o limite crítico',
    );
    expect(alertItem).toHaveTextContent('Aguardando reconhecimento');

    fireEvent.click(
      within(alertItem).getByRole('button', {
        name: 'Reconhecer alerta crítico',
      }),
    );

    expect(onAcknowledgeAlert).toHaveBeenCalledTimes(1);
    expect(onAcknowledgeAlert).toHaveBeenCalledWith('alert-003');
  });

  it('uses distinct visual styles for each alert level', () => {
    const alerts: AlertTransport[] = [
      {
        id: 'alert-critical',
        level: 'CRITICAL',
        message: 'Temperature exceeded the critical threshold',
        component: 'temperature-sensor',
        timestamp: '2026-07-14T18:00:00.000Z',
        acknowledged: false,
      },
      {
        id: 'alert-warning',
        level: 'WARNING',
        message: 'Motor vibration is above the recommended level',
        component: 'motor',
        timestamp: '2026-07-14T17:55:00.000Z',
        acknowledged: false,
      },
      {
        id: 'alert-info',
        level: 'INFO',
        message: 'Machine monitoring started',
        component: 'monitoring-system',
        timestamp: '2026-07-14T17:50:00.000Z',
        acknowledged: true,
      },
    ];

    render(
      <MachineAlertHistory
        alerts={alerts}
        acknowledgingAlertIds={new Set()}
        acknowledgementErrorAlertIds={new Set()}
        onAcknowledgeAlert={jest.fn()}
      />,
    );

    const alertItems = screen.getAllByRole('listitem');

    expect(alertItems).toHaveLength(3);

    expect(alertItems[0]).toHaveAttribute('data-alert-level', 'CRITICAL');

    expect(alertItems[0]).toHaveClass(
      'border-danger/30',
      'bg-danger/10',
      'text-foreground',
    );

    expect(alertItems[1]).toHaveAttribute('data-alert-level', 'WARNING');

    expect(alertItems[1]).toHaveClass(
      'border-warning/30',
      'bg-warning/10',
      'text-foreground',
    );

    expect(alertItems[2]).toHaveAttribute('data-alert-level', 'INFO');

    expect(alertItems[2]).toHaveClass(
      'border-info/30',
      'bg-info/10',
      'text-foreground',
    );
  });

  it('uses semantic theme tokens for the alert panel and actions', () => {
    const alert: AlertTransport = {
      id: 'alert-critical',
      level: 'CRITICAL',
      message: 'Temperature exceeded the critical threshold',
      component: 'temperature-sensor',
      timestamp: '2026-07-14T18:00:00.000Z',
      acknowledged: false,
    };

    render(
      <MachineAlertHistory
        alerts={[alert]}
        acknowledgingAlertIds={new Set()}
        acknowledgementErrorAlertIds={new Set(['alert-critical'])}
        onAcknowledgeAlert={jest.fn()}
      />,
    );

    const alertHistoryRegion = screen.getByRole('region', {
      name: 'Histórico de alertas',
    });

    expect(alertHistoryRegion).toHaveClass(
      'border-border',
      'bg-surface',
      'text-foreground',
    );

    expect(
      within(alertHistoryRegion).getByText('Eventos mais recentes da máquina'),
    ).toHaveClass('text-muted');

    const alertItem = within(alertHistoryRegion).getByRole('listitem');

    expect(within(alertItem).getByText('Sensor de temperatura')).toHaveClass(
      'text-muted',
    );

    expect(
      within(alertItem).getByText('A temperatura excedeu o limite crítico'),
    ).toHaveClass('text-foreground');

    expect(
      within(alertItem).getByLabelText('Horário do alerta crítico'),
    ).toHaveClass('text-muted');

    expect(
      within(alertItem).getByText('Aguardando reconhecimento'),
    ).toHaveClass('text-muted');

    expect(
      within(alertItem).getByRole('button', {
        name: 'Reconhecer alerta crítico',
      }),
    ).toHaveClass('border-primary', 'bg-primary', 'text-primary-foreground');

    expect(within(alertItem).getByRole('alert')).toHaveClass('text-danger');
  });
});
