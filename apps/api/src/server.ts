import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { createRuntimeHttpServer } from './runtime.js';
import { resolveRuntimeConfiguration } from './runtime-configuration.js';

const configuration = resolveRuntimeConfiguration(process.env, process.cwd());

if (configuration.databasePath !== ':memory:') {
  mkdirSync(dirname(configuration.databasePath), {
    recursive: true,
  });
}

const runtime = createRuntimeHttpServer({
  databasePath: configuration.databasePath,
});

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down...`);

  try {
    await runtime.close();
    console.log('HTTP server and SQLite database closed.');
  } catch (error) {
    console.error('Failed to shut down cleanly.', error);
    process.exitCode = 1;
  }
}

runtime.server.listen(configuration.port, '0.0.0.0', () => {
  console.log(`API running at http://0.0.0.0:${configuration.port}`);

  console.log(`SQLite database: ${configuration.databasePath}`);
});

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});
