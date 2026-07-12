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
