'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type CancelRetry = () => void;

type ScheduleRetry = (
  callback: () => void,
  intervalInMilliseconds: number,
) => CancelRetry;

interface MachineDataRetryProps {
  onRetry?: () => void;
  scheduleRetry?: ScheduleRetry;
}

interface RetrySchedulerProps {
  onRetry(): void;
  scheduleRetry: ScheduleRetry;
}

const RETRY_INTERVAL_IN_MILLISECONDS = 3000;

const scheduleRetryWithInterval: ScheduleRetry = (
  callback,
  intervalInMilliseconds,
) => {
  const intervalId = setInterval(callback, intervalInMilliseconds);

  return () => {
    clearInterval(intervalId);
  };
};

function RetryScheduler({ onRetry, scheduleRetry }: RetrySchedulerProps) {
  useEffect(() => {
    return scheduleRetry(onRetry, RETRY_INTERVAL_IN_MILLISECONDS);
  }, [onRetry, scheduleRetry]);

  return (
    <p
      role="status"
      aria-label="Tentativa de reconexão"
      aria-live="polite"
      className="mt-4 text-sm text-slate-300"
    >
      Tentando reconectar automaticamente...
    </p>
  );
}

function RouterMachineDataRetry({
  scheduleRetry,
}: Pick<RetrySchedulerProps, 'scheduleRetry'>) {
  const router = useRouter();

  const retry = useCallback(() => {
    router.refresh();
  }, [router]);

  return <RetryScheduler onRetry={retry} scheduleRetry={scheduleRetry} />;
}

export function MachineDataRetry({
  onRetry,
  scheduleRetry = scheduleRetryWithInterval,
}: MachineDataRetryProps) {
  if (onRetry !== undefined) {
    return <RetryScheduler onRetry={onRetry} scheduleRetry={scheduleRetry} />;
  }

  return <RouterMachineDataRetry scheduleRetry={scheduleRetry} />;
}
