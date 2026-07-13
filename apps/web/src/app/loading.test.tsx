import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import Loading from './loading';

describe('Dashboard loading state', () => {
  it('shows that the machine data is being loaded', () => {
    render(<Loading />);

    const loadingStatus = screen.getByRole('status', {
      name: 'Carregando dados da máquina',
    });

    expect(loadingStatus).toHaveTextContent('Carregando dados da máquina...');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Painel de Monitoramento Industrial',
      }),
    ).toBeInTheDocument();
  });
});
