'use client';

import { useEffect, useSyncExternalStore } from 'react';

import {
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme/theme';

const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';

const THEME_PREFERENCE_CHANGE_EVENT = 'stw-theme-preference-change';

function getSystemThemeQuery(): MediaQueryList | null {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return null;
  }

  return window.matchMedia(DARK_MODE_MEDIA_QUERY);
}

function applyThemePreference(preference: ThemePreference): void {
  const systemThemeQuery = getSystemThemeQuery();

  const resolvedTheme = resolveTheme(
    preference,
    systemThemeQuery?.matches ?? false,
  );

  document.documentElement.dataset.theme = resolvedTheme;
}

function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);

  return isThemePreference(storedPreference) ? storedPreference : 'system';
}

function getServerThemePreference(): ThemePreference {
  return 'system';
}

function subscribeToThemePreference(onStoreChange: () => void): () => void {
  function handleStorageChange(event: StorageEvent): void {
    if (event.key === null || event.key === THEME_STORAGE_KEY) {
      onStoreChange();
    }
  }

  function handleLocalPreferenceChange(): void {
    onStoreChange();
  }

  window.addEventListener('storage', handleStorageChange);

  window.addEventListener(
    THEME_PREFERENCE_CHANGE_EVENT,
    handleLocalPreferenceChange,
  );

  return () => {
    window.removeEventListener('storage', handleStorageChange);

    window.removeEventListener(
      THEME_PREFERENCE_CHANGE_EVENT,
      handleLocalPreferenceChange,
    );
  };
}

function getThemeButtonClassName(isActive: boolean): string {
  const baseClassName =
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-secondary';

  if (isActive) {
    return `${baseClassName} bg-primary text-primary-foreground`;
  }

  return `${baseClassName} text-muted hover:bg-surface-elevated hover:text-foreground`;
}

export function ThemeSelector() {
  const preference = useSyncExternalStore(
    subscribeToThemePreference,
    getStoredThemePreference,
    getServerThemePreference,
  );

  useEffect(() => {
    applyThemePreference(preference);

    if (preference !== 'system') {
      return;
    }

    const systemThemeQuery = getSystemThemeQuery();

    if (systemThemeQuery === null) {
      return;
    }

    function handleSystemThemeChange(event: MediaQueryListEvent): void {
      const resolvedTheme = resolveTheme('system', event.matches);

      document.documentElement.dataset.theme = resolvedTheme;
    }

    systemThemeQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      systemThemeQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [preference]);

  function handleThemeChange(nextPreference: ThemePreference): void {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);

    window.dispatchEvent(new Event(THEME_PREFERENCE_CHANGE_EVENT));
  }

  return (
    <div
      role="group"
      aria-label="Seleção de tema"
      className="flex items-center gap-1 rounded-lg border border-border bg-surface-secondary p-1"
    >
      <button
        type="button"
        aria-label="Usar tema claro"
        aria-pressed={preference === 'light'}
        className={getThemeButtonClassName(preference === 'light')}
        onClick={() => {
          handleThemeChange('light');
        }}
      >
        Claro
      </button>

      <button
        type="button"
        aria-label="Usar tema escuro"
        aria-pressed={preference === 'dark'}
        className={getThemeButtonClassName(preference === 'dark')}
        onClick={() => {
          handleThemeChange('dark');
        }}
      >
        Escuro
      </button>

      <button
        type="button"
        aria-label="Usar tema do sistema"
        aria-pressed={preference === 'system'}
        className={getThemeButtonClassName(preference === 'system')}
        onClick={() => {
          handleThemeChange('system');
        }}
      >
        Sistema
      </button>
    </div>
  );
}
