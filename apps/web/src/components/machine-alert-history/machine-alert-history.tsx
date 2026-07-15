import type { AlertTransport } from '@industrial-monitoring/contracts';

interface MachineAlertHistoryProps {
  alerts: readonly AlertTransport[];
  acknowledgingAlertIds: ReadonlySet<string>;
  acknowledgementErrorAlertIds: ReadonlySet<string>;
  onAcknowledgeAlert: (alertId: string) => void;
}

const ALERT_LEVEL_LABELS: Readonly<Record<AlertTransport['level'], string>> = {
  INFO: 'Informativo',
  WARNING: 'Aviso',
  CRITICAL: 'Crítico',
};

const ALERT_LEVEL_ACCESSIBLE_LABELS: Readonly<
  Record<AlertTransport['level'], string>
> = {
  INFO: 'informativo',
  WARNING: 'de aviso',
  CRITICAL: 'crítico',
};

const ALERT_LEVEL_STYLES: Readonly<Record<AlertTransport['level'], string>> = {
  INFO: 'border-info/30 bg-info/10 text-foreground',
  WARNING: 'border-warning/30 bg-warning/10 text-foreground',
  CRITICAL: 'border-danger/30 bg-danger/10 text-foreground',
};

const ALERT_COMPONENT_LABELS: Readonly<Record<string, string>> = {
  'temperature-sensor': 'Sensor de temperatura',
  motor: 'Motor',
  'monitoring-system': 'Sistema de monitoramento',
};

const ALERT_MESSAGE_LABELS: Readonly<Record<string, string>> = {
  'Temperature exceeded the critical threshold':
    'A temperatura excedeu o limite crítico',

  'Motor vibration is above the recommended level':
    'A vibração do motor está acima do nível recomendado',

  'Machine monitoring started': 'Monitoramento da máquina iniciado',
};

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function getAlertComponentLabel(component: string): string {
  return ALERT_COMPONENT_LABELS[component] ?? component;
}

function getAlertMessageLabel(message: string): string {
  return ALERT_MESSAGE_LABELS[message] ?? message;
}

export function MachineAlertHistory({
  alerts,
  acknowledgingAlertIds,
  acknowledgementErrorAlertIds,
  onAcknowledgeAlert,
}: MachineAlertHistoryProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Histórico de alertas"
      className="rounded-2xl border border-border bg-surface p-6 text-foreground"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Histórico de alertas
        </h2>

        <p className="mt-1 text-sm text-muted">
          Eventos mais recentes da máquina
        </p>
      </div>

      <ul className="mt-4 space-y-3">
        {alerts.map((alert) => {
          const isAcknowledging = acknowledgingAlertIds.has(alert.id);

          const hasAcknowledgementError = acknowledgementErrorAlertIds.has(
            alert.id,
          );

          const levelLabel = ALERT_LEVEL_LABELS[alert.level];

          const accessibleLevelLabel =
            ALERT_LEVEL_ACCESSIBLE_LABELS[alert.level];

          const levelStyle = ALERT_LEVEL_STYLES[alert.level];

          const componentLabel = getAlertComponentLabel(alert.component);

          const messageLabel = getAlertMessageLabel(alert.message);

          return (
            <li
              key={alert.id}
              data-alert-level={alert.level}
              className={`rounded-xl border p-5 ${levelStyle}`}
            >
              <article>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-semibold">{levelLabel}</p>

                      <p className="text-xs text-muted">{componentLabel}</p>
                    </div>

                    <p className="mt-2 text-sm text-foreground">
                      {messageLabel}
                    </p>
                  </div>

                  <time
                    aria-label={`Horário do alerta ${accessibleLevelLabel}`}
                    dateTime={alert.timestamp}
                    className="text-sm text-muted"
                  >
                    {timeFormatter.format(new Date(alert.timestamp))}
                  </time>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted">
                    {alert.acknowledged
                      ? 'Reconhecido'
                      : 'Aguardando reconhecimento'}
                  </p>

                  {!alert.acknowledged ? (
                    <button
                      type="button"
                      aria-label={`${
                        isAcknowledging ? 'Reconhecendo' : 'Reconhecer'
                      } alerta ${accessibleLevelLabel}`}
                      aria-busy={isAcknowledging}
                      disabled={isAcknowledging}
                      className="rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => {
                        onAcknowledgeAlert(alert.id);
                      }}
                    >
                      {isAcknowledging
                        ? 'Reconhecendo...'
                        : 'Reconhecer alerta'}
                    </button>
                  ) : null}
                </div>

                {hasAcknowledgementError ? (
                  <p role="alert" className="mt-3 text-sm text-danger">
                    Não foi possível reconhecer o alerta. Tente novamente.
                  </p>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
