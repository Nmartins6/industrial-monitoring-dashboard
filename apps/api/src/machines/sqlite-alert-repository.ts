import { DatabaseSync } from 'node:sqlite';

import type { Alert } from '@industrial-monitoring/contracts';

import type {
  AcknowledgeMachineAlertResult,
  AlertRepository,
} from './alert-repository.js';

export interface CreateSqliteAlertRepositoryOptions {
  databasePath: string;
}

export interface SqliteAlertRepository extends AlertRepository {
  close(): void;
}

interface AlertRow {
  id: string;
  level: Alert['level'];
  message: string;
  component: string;
  timestamp: string;
  acknowledged: number;
}

interface SeedAlert extends Omit<Alert, 'timestamp'> {
  machineId: string;
  timestamp: string;
}

const INITIAL_ALERTS: readonly SeedAlert[] = [
  {
    id: 'alert-001',
    machineId: 'mixer-01',
    level: 'INFO',
    message: 'Machine monitoring started',
    component: 'monitoring-system',
    timestamp: '2026-07-12T10:00:00.000Z',
    acknowledged: true,
  },
  {
    id: 'alert-002',
    machineId: 'mixer-01',
    level: 'WARNING',
    message: 'Motor vibration is above the recommended level',
    component: 'motor',
    timestamp: '2026-07-12T10:00:09.000Z',
    acknowledged: false,
  },
  {
    id: 'alert-003',
    machineId: 'mixer-01',
    level: 'CRITICAL',
    message: 'Temperature exceeded the critical threshold',
    component: 'temperature-sensor',
    timestamp: '2026-07-12T10:00:12.000Z',
    acknowledged: false,
  },
];

function mapAlertRowToDomain(row: AlertRow): Alert {
  return {
    id: row.id,
    level: row.level,
    message: row.message,
    component: row.component,
    timestamp: new Date(row.timestamp),
    acknowledged: row.acknowledged === 1,
  };
}

function createSchema(database: DatabaseSync): void {
  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY
    ) STRICT;

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      level TEXT NOT NULL
        CHECK (level IN ('INFO', 'WARNING', 'CRITICAL')),
      message TEXT NOT NULL,
      component TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      acknowledged INTEGER NOT NULL
        CHECK (acknowledged IN (0, 1)),
      FOREIGN KEY (machine_id)
        REFERENCES machines(id)
        ON DELETE CASCADE
    ) STRICT;

    CREATE INDEX IF NOT EXISTS
      alerts_machine_timestamp_index
    ON alerts (
      machine_id,
      timestamp DESC
    );
  `);
}

function seedInitialData(database: DatabaseSync): void {
  const insertMachine = database.prepare(`
    INSERT OR IGNORE INTO machines (id)
    VALUES (?)
  `);

  const insertAlert = database.prepare(`
    INSERT OR IGNORE INTO alerts (
      id,
      machine_id,
      level,
      message,
      component,
      timestamp,
      acknowledged
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  database.exec('BEGIN');

  try {
    insertMachine.run('mixer-01');

    for (const alert of INITIAL_ALERTS) {
      insertAlert.run(
        alert.id,
        alert.machineId,
        alert.level,
        alert.message,
        alert.component,
        alert.timestamp,
        alert.acknowledged ? 1 : 0,
      );
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function createSqliteAlertRepository(
  options: CreateSqliteAlertRepositoryOptions,
): SqliteAlertRepository {
  const database = new DatabaseSync(options.databasePath);

  createSchema(database);
  seedInitialData(database);

  const findMachine = database.prepare(`
    SELECT id
    FROM machines
    WHERE id = ?
    LIMIT 1
  `);

  const findAlertHistory = database.prepare(`
    SELECT
      id,
      level,
      message,
      component,
      timestamp,
      acknowledged
    FROM alerts
    WHERE machine_id = ?
    ORDER BY timestamp DESC
  `);

  const acknowledgeAlert = database.prepare(`
    UPDATE alerts
    SET acknowledged = 1
    WHERE machine_id = ?
      AND id = ?
  `);

  const findAlert = database.prepare(`
    SELECT
      id,
      level,
      message,
      component,
      timestamp,
      acknowledged
    FROM alerts
    WHERE machine_id = ?
      AND id = ?
    LIMIT 1
  `);

  function getMachineAlertHistory(machineId: string): Alert[] | undefined {
    const machine = findMachine.get(machineId);

    if (machine === undefined) {
      return undefined;
    }

    const rows = findAlertHistory.all(machineId) as unknown as AlertRow[];

    return rows.map(mapAlertRowToDomain);
  }

  function acknowledgeMachineAlert(
    machineId: string,
    alertId: string,
  ): AcknowledgeMachineAlertResult {
    const machine = findMachine.get(machineId);

    if (machine === undefined) {
      return {
        status: 'MACHINE_NOT_FOUND',
      };
    }

    const result = acknowledgeAlert.run(machineId, alertId);

    if (result.changes === 0) {
      return {
        status: 'ALERT_NOT_FOUND',
      };
    }

    const row = findAlert.get(machineId, alertId) as unknown as
      AlertRow | undefined;

    if (row === undefined) {
      return {
        status: 'ALERT_NOT_FOUND',
      };
    }

    return {
      status: 'ACKNOWLEDGED',
      alert: mapAlertRowToDomain(row),
    };
  }

  function close(): void {
    database.close();
  }

  return {
    acknowledgeMachineAlert,
    close,
    getMachineAlertHistory,
  };
}
