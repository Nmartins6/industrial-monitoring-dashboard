import { resolve } from 'node:path';

import { describe, expect, it } from '@jest/globals';

import { resolveRuntimeConfiguration } from '../src/runtime-configuration.js';

describe('Runtime configuration', () => {
  it('uses the default port and SQLite database path', () => {
    const configuration = resolveRuntimeConfiguration({}, '/workspace');

    expect(configuration).toEqual({
      port: 3333,
      databasePath: resolve('/workspace', 'data', 'industrial-monitoring.db'),
    });
  });

  it('uses environment variable overrides', () => {
    const configuration = resolveRuntimeConfiguration(
      {
        PORT: '4444',
        DATABASE_PATH: 'var/custom-monitoring.db',
      },
      '/workspace',
    );

    expect(configuration).toEqual({
      port: 4444,
      databasePath: resolve('/workspace', 'var/custom-monitoring.db'),
    });
  });

  it('preserves an in-memory SQLite database path', () => {
    const configuration = resolveRuntimeConfiguration(
      {
        DATABASE_PATH: ':memory:',
      },
      '/workspace',
    );

    expect(configuration.databasePath).toBe(':memory:');
  });

  it.each(['0', '65536', 'invalid', '3333.5'])(
    'rejects the invalid port %s',
    (port) => {
      expect(() =>
        resolveRuntimeConfiguration(
          {
            PORT: port,
          },
          '/workspace',
        ),
      ).toThrow('PORT must be an integer between 1 and 65535');
    },
  );
});
