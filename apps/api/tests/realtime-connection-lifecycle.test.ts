import { once } from 'node:events';
import { type Server } from 'node:http';

import { describe, expect, it } from '@jest/globals';

import { createHttpServer } from '../src/app.js';
import type {
  RealtimeScheduledTask,
  RealtimeScheduler,
} from '../src/realtime/realtime-scheduler.js';

class ObservableRealtimeScheduler implements RealtimeScheduler {
  private resolveCancellation: (() => void) | undefined;

  readonly cancellation = new Promise<void>((resolve) => {
    this.resolveCancellation = resolve;
  });

  wasCancelled = false;

  scheduleEvery(): RealtimeScheduledTask {
    return {
      cancel: () => {
        this.wasCancelled = true;
        this.resolveCancellation?.();
      },
    };
  }
}

interface TestServer {
  server: Server;
  baseUrl: string;
}

async function startTestServer(
  scheduler: RealtimeScheduler,
): Promise<TestServer> {
  const server = createHttpServer({
    realtimeScheduler: scheduler,
  });

  server.listen(0, '127.0.0.1');

  await once(server, 'listening');

  const address = server.address();

  if (address === null || typeof address === 'string') {
    throw new Error('Could not determine the test server address');
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

async function closeTestServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error !== undefined) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function waitForCancellation(
  scheduler: ObservableRealtimeScheduler,
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new Error('The realtime task was not cancelled'));
    }, 2_000);
  });

  try {
    await Promise.race([scheduler.cancellation, timeoutPromise]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

describe('Realtime connection lifecycle', () => {
  it('cancels the scheduled task when the client disconnects', async () => {
    const scheduler = new ObservableRealtimeScheduler();

    const testServer = await startTestServer(scheduler);

    const abortController = new AbortController();

    try {
      const response = await fetch(
        `${testServer.baseUrl}/api/v1/machines/mixer-01/events`,
        {
          headers: {
            accept: 'text/event-stream',
          },
          signal: abortController.signal,
        },
      );

      expect(response.status).toBe(200);
      expect(response.body).not.toBeNull();

      if (response.body === null) {
        throw new Error('SSE response body is not available');
      }

      const reader = response.body.getReader();

      try {
        const firstChunk = await reader.read();

        expect(firstChunk.done).toBe(false);

        abortController.abort();

        await reader.cancel().catch(() => undefined);

        await waitForCancellation(scheduler);

        expect(scheduler.wasCancelled).toBe(true);
      } finally {
        reader.releaseLock();
      }
    } finally {
      abortController.abort();
      await closeTestServer(testServer.server);
    }
  });
});
