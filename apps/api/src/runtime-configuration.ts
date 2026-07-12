import { resolve } from 'node:path';

export interface RuntimeEnvironment {
  PORT?: string;
  DATABASE_PATH?: string;
}

export interface RuntimeConfiguration {
  port: number;
  databasePath: string;
}

const DEFAULT_PORT = 3333;
const DEFAULT_DATABASE_PATH = 'data/industrial-monitoring.db';

function resolvePort(portValue: string | undefined): number {
  if (portValue === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(portValue);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

function resolveDatabasePath(
  databasePathValue: string | undefined,
  currentWorkingDirectory: string,
): string {
  const databasePath = databasePathValue ?? DEFAULT_DATABASE_PATH;

  if (databasePath === ':memory:') {
    return databasePath;
  }

  return resolve(currentWorkingDirectory, databasePath);
}

export function resolveRuntimeConfiguration(
  environment: RuntimeEnvironment,
  currentWorkingDirectory: string,
): RuntimeConfiguration {
  return {
    port: resolvePort(environment.PORT),
    databasePath: resolveDatabasePath(
      environment.DATABASE_PATH,
      currentWorkingDirectory,
    ),
  };
}
