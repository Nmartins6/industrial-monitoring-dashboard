import { type ServerResponse } from 'node:http';

import type { RealtimeEvent } from '@industrial-monitoring/contracts';

interface OpenSseConnectionOptions {
  allowedOrigin: string;
}

export function openSseConnection(
  response: ServerResponse,
  { allowedOrigin }: OpenSseConnectionOptions,
): void {
  response.writeHead(200, {
    'access-control-allow-origin': allowedOrigin,
    'cache-control': 'no-cache',
    connection: 'keep-alive',
    'content-type': 'text/event-stream; charset=utf-8',
    vary: 'Origin',
  });

  response.flushHeaders();
}

export function writeSseEvent(
  response: ServerResponse,
  event: RealtimeEvent,
): void {
  // Cada evento usa o nome explícito do contrato para o cliente registrar
  // listeners específicos em vez de depender do evento genérico "message".
  response.write(`id: ${event.id}\n`);
  response.write(`event: ${event.type}\n`);
  response.write(`data: ${JSON.stringify(event)}\n\n`);
}
