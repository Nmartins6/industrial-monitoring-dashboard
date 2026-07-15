import { describe, expect, it } from '@jest/globals';

import { isThemePreference, resolveTheme, THEME_STORAGE_KEY } from './theme';

describe('theme', () => {
  describe('resolveTheme', () => {
    it('preserves an explicit light preference', () => {
      expect(resolveTheme('light', true)).toBe('light');
    });

    it('preserves an explicit dark preference', () => {
      expect(resolveTheme('dark', false)).toBe('dark');
    });

    it('uses the system preference when configured as system', () => {
      expect(resolveTheme('system', true)).toBe('dark');
      expect(resolveTheme('system', false)).toBe('light');
    });
  });

  describe('isThemePreference', () => {
    it('accepts the supported theme preferences', () => {
      expect(isThemePreference('light')).toBe(true);
      expect(isThemePreference('dark')).toBe(true);
      expect(isThemePreference('system')).toBe(true);
    });

    it('rejects invalid or missing preferences', () => {
      expect(isThemePreference('automatic')).toBe(false);
      expect(isThemePreference('')).toBe(false);
      expect(isThemePreference(null)).toBe(false);
    });
  });

  it('uses a project-specific local storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('stw-theme');
  });
});
