import { type Server } from 'node:http';

import { createHttpServer } from './app.js';
import { createSqliteAlertRepository } from './machines/sqlite-alert-repository.js';

export interface CreateRuntimeHttpServerOptions {
  databasePath: string;
}

export interface RuntimeHttpServer {
  server: Server;
  close(): Promise<void>;
}

export function createRuntimeHttpServer(
  options: CreateRuntimeHttpServerOptions,
): RuntimeHttpServer {
  const alertRepository = createSqliteAlertRepository({
    databasePath: options.databasePath,
  });

  const server = createHttpServer({
    alertRepository,
  });

  async function close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error !== undefined) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    alertRepository.close();
  }

  return {
    server,
    close,
  };
}
