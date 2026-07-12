import { ALERT_LEVELS, type Alert, type AlertLevel } from '../src/index.js';

const validAlert: Alert = {
  id: 'alert-temperature-high-001',
  level: 'CRITICAL',
  message: 'Temperature exceeded the critical threshold',
  component: 'temperature-sensor',
  timestamp: new Date(),
  acknowledged: false,
};

const validLevel: AlertLevel = 'WARNING';

const invalidAlert: Alert = {
  ...validAlert,

  // @ts-expect-error DANGER is not a valid alert level.
  level: 'DANGER',
};

export { ALERT_LEVELS, invalidAlert, validAlert, validLevel };
