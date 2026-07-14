import { describe, expect, it, jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';

import { MachineDataRetry } from './machine-data-retry';

describe('MachineDataRetry', () => {
  it('tenta carregar novamente os dados da máquina em intervalos regulares', () => {
    let retryCallback: (() => void) | undefined;

    const cancelRetry = jest.fn();

    const scheduleRetry = jest.fn(
      (callback: () => void, intervalInMilliseconds: number) => {
        expect(intervalInMilliseconds).toBe(3000);

        retryCallback = callback;

        return cancelRetry;
      },
    );

    const onRetry = jest.fn();

    const { unmount } = render(
      <MachineDataRetry onRetry={onRetry} scheduleRetry={scheduleRetry} />,
    );

    expect(
      screen.getByRole('status', {
        name: 'Tentativa de reconexão',
      }),
    ).toHaveTextContent('Tentando reconectar automaticamente...');

    expect(scheduleRetry).toHaveBeenCalledTimes(1);

    if (retryCallback === undefined) {
      throw new Error('Retry callback was not scheduled');
    }

    const runScheduledRetry = retryCallback;

    act(() => {
      runScheduledRetry();
    });

    expect(onRetry).toHaveBeenCalledTimes(1);

    unmount();

    expect(cancelRetry).toHaveBeenCalledTimes(1);
  });
});
