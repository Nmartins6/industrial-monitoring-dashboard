import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import { act, render, screen, within } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { THEME_STORAGE_KEY } from '@/lib/theme/theme';

import { ThemeSelector } from './theme-selector';

describe('ThemeSelector', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();

    delete document.documentElement.dataset.theme;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    });
  });

  afterEach(() => {
    localStorage.clear();

    delete document.documentElement.dataset.theme;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
  });

  it('applies a saved dark preference to the document', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    render(<ThemeSelector />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    expect(
      screen.getByRole('button', {
        name: 'Usar tema escuro',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('hydrates a saved preference without changing the server HTML', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const serverHtml = renderToString(<ThemeSelector />);

    const container = document.createElement('div');

    container.innerHTML = serverHtml;
    document.body.append(container);

    const serverThemeSelector = within(container);

    expect(
      serverThemeSelector.getByRole('button', {
        name: 'Usar tema do sistema',
      }),
    ).toHaveAttribute('aria-pressed', 'true');

    expect(
      serverThemeSelector.getByRole('button', {
        name: 'Usar tema escuro',
      }),
    ).toHaveAttribute('aria-pressed', 'false');

    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const root = hydrateRoot(container, <ThemeSelector />);

    try {
      await act(async () => {
        await Promise.resolve();
      });

      const hydrationMessages = consoleError.mock.calls.flat().join(' ');

      expect(hydrationMessages).not.toContain(
        'A tree hydrated but some attributes of the server rendered HTML',
      );

      expect(
        within(container).getByRole('button', {
          name: 'Usar tema escuro',
        }),
      ).toHaveAttribute('aria-pressed', 'true');

      expect(
        within(container).getByRole('button', {
          name: 'Usar tema do sistema',
        }),
      ).toHaveAttribute('aria-pressed', 'false');

      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    } finally {
      await act(async () => {
        root.unmount();
      });

      consoleError.mockRestore();
      container.remove();
    }
  });

  it('uses semantic theme styles and highlights the saved preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    render(<ThemeSelector />);

    const themeSelector = screen.getByRole('group', {
      name: 'Seleção de tema',
    });

    expect(themeSelector).toHaveClass('border-border', 'bg-surface-secondary');

    const lightButton = screen.getByRole('button', {
      name: 'Usar tema claro',
    });

    const darkButton = screen.getByRole('button', {
      name: 'Usar tema escuro',
    });

    expect(darkButton).toHaveClass('bg-primary', 'text-primary-foreground');

    expect(lightButton).toHaveClass('text-muted');
    expect(lightButton).not.toHaveClass('bg-primary');
  });

  it('follows system theme changes while using the system preference', () => {
    let changeListener: ((event: MediaQueryListEvent) => void) | undefined;

    const mediaQueryList = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,

      addEventListener: jest.fn(
        (eventName: string, listener: (event: MediaQueryListEvent) => void) => {
          if (eventName === 'change') {
            changeListener = listener;
          }
        },
      ),

      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue(mediaQueryList),
    });

    localStorage.setItem(THEME_STORAGE_KEY, 'system');

    render(<ThemeSelector />);

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    if (changeListener === undefined) {
      throw new Error('System theme change listener was not registered');
    }

    const notifyThemeChange = changeListener;

    act(() => {
      notifyThemeChange({
        matches: true,
      } as MediaQueryListEvent);
    });

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
