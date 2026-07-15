import { describe, expect, it } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import Loading from './loading';

describe('Dashboard loading state', () => {
  it('shows that the machine data is being loaded', () => {
    const { container } = render(<Loading />);

    const page = container.firstElementChild;

    expect(page).not.toBeNull();
    expect(page).toHaveClass(
      'min-h-screen',
      'bg-background',
      'text-foreground',
    );

    const dashboardHeader = screen.getByRole('banner');

    expect(dashboardHeader).toHaveClass('border-border', 'bg-surface');

    const headerContent = dashboardHeader.firstElementChild;

    expect(headerContent).not.toBeNull();
    expect(headerContent).toHaveClass('px-6', 'py-5');

    expect(
      within(dashboardHeader).getByText('Monitoramento de máquinas'),
    ).toHaveClass('text-muted');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Painel de Monitoramento Industrial',
      }),
    ).toHaveClass('text-foreground');

    const loadingStatus = screen.getByRole('status', {
      name: 'Carregando dados da máquina',
    });

    expect(loadingStatus).toHaveTextContent('Carregando dados da máquina...');

    expect(loadingStatus).toHaveClass(
      'border-info/30',
      'bg-info/10',
      'text-info',
    );

    const loadingIndicator = loadingStatus.querySelector(
      '[aria-hidden="true"]',
    );

    expect(loadingIndicator).not.toBeNull();
    expect(loadingIndicator).toHaveClass('bg-info');

    const loadingMarkers = screen.getByRole('region', {
      name: 'Marcadores de carregamento do painel',
    });

    const skeletons = loadingMarkers.querySelectorAll(
      ':scope > [aria-hidden="true"]',
    );

    expect(skeletons).toHaveLength(3);

    for (const skeleton of skeletons) {
      expect(skeleton).toHaveClass('border-border', 'bg-surface-secondary');
    }
  });
});
