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
});
