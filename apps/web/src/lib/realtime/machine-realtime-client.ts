import type { RealtimeEvent } from '@industrial-monitoring/contracts';

type RealtimeEventListener = (event: MessageEvent<string>) => void;

type RealtimeErrorListener = () => void;

interface EventSourceLike {
  addEventListener(
    type: string,
    listener: RealtimeEventListener | RealtimeErrorListener,
  ): void;

  close(): void;
}

type EventSourceFactory = (url: string) => EventSourceLike;

type Disconnect = () => void;

type ScheduleReconnect = (
  callback: () => void,
  delayInMilliseconds: number,
) => Disconnect;

type RealtimeConnectionStatus = 'connected' | 'disconnected';

interface CreateMachineRealtimeClientOptions {
  baseUrl: string;
  eventSourceFactory: EventSourceFactory;
  scheduleReconnect?: ScheduleReconnect;
}

interface ConnectOptions {
  onEvent(event: RealtimeEvent): void;

  onConnectionChange?(status: RealtimeConnectionStatus): void;
}

interface MachineRealtimeClient {
  connect(machineId: string, options: ConnectOptions): Disconnect;
}

const RECONNECT_DELAY_IN_MILLISECONDS = 3000;

const scheduleReconnectWithTimeout: ScheduleReconnect = (
  callback,
  delayInMilliseconds,
) => {
  const timeoutId = setTimeout(callback, delayInMilliseconds);

  return () => {
    clearTimeout(timeoutId);
  };
};

export function createMachineRealtimeClient({
  baseUrl,
  eventSourceFactory,
  scheduleReconnect = scheduleReconnectWithTimeout,
}: CreateMachineRealtimeClientOptions): MachineRealtimeClient {
  return {
    connect(
      machineId: string,
      { onEvent, onConnectionChange }: ConnectOptions,
    ): Disconnect {
      let currentEventSource: EventSourceLike | undefined;

      let cancelScheduledReconnect: Disconnect | undefined;

      let isDisconnected = false;

      const connectToStream = (): void => {
        if (isDisconnected) {
          return;
        }

        const eventSource = eventSourceFactory(
          `${baseUrl}/api/v1/machines/${machineId}/events`,
        );

        currentEventSource = eventSource;

        const handleEvent: RealtimeEventListener = (messageEvent) => {
          const realtimeEvent = JSON.parse(messageEvent.data) as RealtimeEvent;

          onEvent(realtimeEvent);

          if (realtimeEvent.type === 'CONNECTED') {
            onConnectionChange?.('connected');
          }
        };

        eventSource.addEventListener('CONNECTED', handleEvent);

        eventSource.addEventListener('MACHINE_STATUS_UPDATED', handleEvent);

        eventSource.addEventListener('METRIC_RECORDED', handleEvent);

        eventSource.addEventListener('ALERT_CREATED', handleEvent);

        eventSource.addEventListener('ALERT_UPDATED', handleEvent);

        eventSource.addEventListener('error', () => {
          // O navegador também tenta reconectar EventSource, mas fechamos a
          // instância para manter um único ciclo controlado e testável.
          if (isDisconnected || cancelScheduledReconnect !== undefined) {
            return;
          }

          onConnectionChange?.('disconnected');

          eventSource.close();

          if (currentEventSource === eventSource) {
            currentEventSource = undefined;
          }

          cancelScheduledReconnect = scheduleReconnect(() => {
            cancelScheduledReconnect = undefined;

            connectToStream();
          }, RECONNECT_DELAY_IN_MILLISECONDS);
        });
      };

      connectToStream();

      return () => {
        isDisconnected = true;

        cancelScheduledReconnect?.();
        cancelScheduledReconnect = undefined;

        currentEventSource?.close();
        currentEventSource = undefined;
      };
    },
  };
}
