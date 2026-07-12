import { clearInterval, setInterval } from 'node:timers';

export interface RealtimeScheduledTask {
  cancel(): void;
}

export interface RealtimeScheduler {
  scheduleEvery(
    intervalMs: number,
    callback: () => void,
  ): RealtimeScheduledTask;
}

export const systemRealtimeScheduler: RealtimeScheduler = {
  scheduleEvery(
    intervalMs: number,
    callback: () => void,
  ): RealtimeScheduledTask {
    const interval = setInterval(callback, intervalMs);

    interval.unref();

    return {
      cancel(): void {
        clearInterval(interval);
      },
    };
  },
};
