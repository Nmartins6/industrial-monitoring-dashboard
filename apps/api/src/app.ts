import { type IncomingMessage, type ServerResponse } from 'node:http';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

interface ErrorResponse {
  error: string;
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: HealthResponse | ErrorResponse,
): void {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });

  response.end(JSON.stringify(body));
}

export function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
    });

    return;
  }

  sendJson(response, 404, {
    error: 'Route not found',
  });
}
