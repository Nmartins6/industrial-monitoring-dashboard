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
    expect(alertItems[0]).toHaveClass('border-red-800');
    expect(alertItems[0]).toHaveClass('bg-red-950/30');

    expect(alertItems[1]).toHaveAttribute('data-alert-level', 'WARNING');
    expect(alertItems[1]).toHaveClass('border-amber-800');
    expect(alertItems[1]).toHaveClass('bg-amber-950/30');

    expect(alertItems[2]).toHaveAttribute('data-alert-level', 'INFO');
    expect(alertItems[2]).toHaveClass('border-sky-800');
    expect(alertItems[2]).toHaveClass('bg-sky-950/30');
  });
});
