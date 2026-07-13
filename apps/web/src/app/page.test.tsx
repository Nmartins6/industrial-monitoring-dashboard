import { describe, expect, it } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import Home from './page';

describe('Home page', () => {
  it('presents the industrial monitoring dashboard', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Industrial Monitoring Dashboard',
      }),
    ).toBeInTheDocument();
  });

  it('shows the monitored machine and realtime connection status', () => {
    render(<Home />);

    expect(screen.getByRole('banner')).toBeInTheDocument();

    expect(screen.getByText('Mixer 01')).toBeInTheDocument();

    expect(
      screen.getByRole('status', {
        name: 'Realtime connection status',
      }),
    ).toHaveTextContent('Connected');
  });

  it('shows the current machine operating status', () => {
    render(<Home />);

    const machineStatusRegion = screen.getByRole('region', {
      name: 'Machine status',
    });

    expect(
      within(machineStatusRegion).getByRole('heading', {
        level: 2,
        name: 'Machine status',
      }),
    ).toBeInTheDocument();

    expect(
      within(machineStatusRegion).getByRole('status', {
        name: 'Current machine state',
      }),
    ).toHaveTextContent('Running');

    const lastUpdate = within(machineStatusRegion).getByLabelText(
      'Last machine update',
    );

    expect(lastUpdate).toHaveAttribute('datetime');
    expect(lastUpdate).toHaveTextContent('Updated just now');
  });

  it('shows the current machine metrics', () => {
    render(<Home />);

    const metricsRegion = screen.getByRole('region', {
      name: 'Current metrics',
    });

    expect(
      within(metricsRegion).getByRole('heading', {
        level: 2,
        name: 'Current metrics',
      }),
    ).toBeInTheDocument();

    const temperatureMetric = within(metricsRegion).getByRole('article', {
      name: 'Temperature metric',
    });

    expect(
      within(temperatureMetric).getByRole('heading', {
        level: 3,
        name: 'Temperature',
      }),
    ).toBeInTheDocument();

    expect(within(temperatureMetric).getByText('72 °C')).toBeInTheDocument();

    const rpmMetric = within(metricsRegion).getByRole('article', {
      name: 'RPM metric',
    });

    expect(
      within(rpmMetric).getByRole('heading', {
        level: 3,
        name: 'RPM',
      }),
    ).toBeInTheDocument();

    expect(within(rpmMetric).getByText('1,200')).toBeInTheDocument();

    const uptimeMetric = within(metricsRegion).getByRole('article', {
      name: 'Uptime metric',
    });

    expect(
      within(uptimeMetric).getByRole('heading', {
        level: 3,
        name: 'Uptime',
      }),
    ).toBeInTheDocument();

    expect(within(uptimeMetric).getByText('8 h')).toBeInTheDocument();
  });

  it('shows the current machine OEE indicators', () => {
    render(<Home />);

    const oeeRegion = screen.getByRole('region', {
      name: 'Overall equipment effectiveness',
    });

    expect(
      within(oeeRegion).getByRole('heading', {
        level: 2,
        name: 'Overall equipment effectiveness',
      }),
    ).toBeInTheDocument();

    const overallOee = within(oeeRegion).getByRole('article', {
      name: 'Overall OEE',
    });

    expect(within(overallOee).getByText('88.4%')).toBeInTheDocument();

    const availability = within(oeeRegion).getByRole('article', {
      name: 'Availability',
    });

    expect(within(availability).getByText('96%')).toBeInTheDocument();

    const performance = within(oeeRegion).getByRole('article', {
      name: 'Performance',
    });

    expect(within(performance).getByText('94%')).toBeInTheDocument();

    const quality = within(oeeRegion).getByRole('article', {
      name: 'Quality',
    });

    expect(within(quality).getByText('98%')).toBeInTheDocument();
  });

  it('shows the machine alert history from newest to oldest', () => {
    render(<Home />);

    const alertHistoryRegion = screen.getByRole('region', {
      name: 'Alert history',
    });

    expect(
      within(alertHistoryRegion).getByRole('heading', {
        level: 2,
        name: 'Alert history',
      }),
    ).toBeInTheDocument();

    const alertItems = within(alertHistoryRegion).getAllByRole('listitem');

    expect(alertItems).toHaveLength(3);

    const criticalAlert = alertItems[0];

    expect(criticalAlert).toBeDefined();

    if (criticalAlert === undefined) {
      throw new Error('Critical alert was not rendered');
    }

    expect(within(criticalAlert).getByText('Critical')).toBeInTheDocument();

    expect(
      within(criticalAlert).getByText(
        'Temperature exceeded the critical threshold',
      ),
    ).toBeInTheDocument();

    expect(
      within(criticalAlert).getByText('temperature-sensor'),
    ).toBeInTheDocument();

    const criticalAlertTimestamp = within(criticalAlert).getByLabelText(
      'Critical alert timestamp',
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

    expect(within(warningAlert).getByText('Warning')).toBeInTheDocument();

    expect(
      within(warningAlert).getByText(
        'Motor vibration is above the recommended level',
      ),
    ).toBeInTheDocument();

    const informationAlert = alertItems[2];

    expect(informationAlert).toBeDefined();

    if (informationAlert === undefined) {
      throw new Error('Information alert was not rendered');
    }

    expect(
      within(informationAlert).getByText('Information'),
    ).toBeInTheDocument();

    expect(
      within(informationAlert).getByText('Machine monitoring started'),
    ).toBeInTheDocument();
  });
});
