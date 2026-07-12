import { createHttpServer } from './app.js';

const DEFAULT_PORT = 3333;
const MIN_PORT = 1;
const MAX_PORT = 65_535;

function resolvePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const parsedPort = Number(value);

  if (
    !Number.isInteger(parsedPort) ||
    parsedPort < MIN_PORT ||
    parsedPort > MAX_PORT
  ) {
    return DEFAULT_PORT;
  }

  return parsedPort;
}

const port = resolvePort(process.env.PORT);
const server = createHttpServer();

server.listen(port, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`Received ${signal}. Closing HTTP server.`);

  server.close(() => {
    console.log('HTTP server closed.');
  });
}

process.once('SIGINT', () => {
  shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  shutdown('SIGTERM');
});
