export const ALERT_LEVELS = ['INFO', 'WARNING', 'CRITICAL'] as const;

export type AlertLevel = (typeof ALERT_LEVELS)[number];

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  component: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface PrioritizedAlert {
  id: string;
  level: AlertLevel;
  timestamp: Date | string;
}

const ALERT_LEVEL_PRIORITY: Readonly<Record<AlertLevel, number>> = {
  CRITICAL: 3,
  WARNING: 2,
  INFO: 1,
};

function getAlertTimestampInMilliseconds(timestamp: Date | string): number {
  return timestamp instanceof Date
    ? timestamp.getTime()
    : Date.parse(timestamp);
}

export function compareAlertsByPriority(
  firstAlert: PrioritizedAlert,
  secondAlert: PrioritizedAlert,
): number {
  const levelDifference =
    ALERT_LEVEL_PRIORITY[secondAlert.level] -
    ALERT_LEVEL_PRIORITY[firstAlert.level];

  if (levelDifference !== 0) {
    return levelDifference;
  }

  const timestampDifference =
    getAlertTimestampInMilliseconds(secondAlert.timestamp) -
    getAlertTimestampInMilliseconds(firstAlert.timestamp);

  if (timestampDifference !== 0) {
    return timestampDifference;
  }

  return firstAlert.id.localeCompare(secondAlert.id);
}

export function sortAlertsByPriority<TAlert extends PrioritizedAlert>(
  alerts: readonly TAlert[],
): TAlert[] {
  return [...alerts].sort(compareAlertsByPriority);
}
