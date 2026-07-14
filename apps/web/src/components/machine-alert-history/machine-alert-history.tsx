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
  INFO: 'border-sky-800 bg-sky-950/30',
  WARNING: 'border-amber-800 bg-amber-950/30',
  CRITICAL: 'border-red-800 bg-red-950/30',
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
      className="rounded-2xl border border-slate-800 bg-slate-950 p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          Histórico de alertas
        </h2>

        <p className="mt-1 text-sm text-slate-400">
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

                      <p className="text-xs text-slate-400">{componentLabel}</p>
                    </div>

                    <p className="mt-2 text-sm text-slate-200">
                      {messageLabel}
                    </p>
                  </div>

                  <time
                    aria-label={`Horário do alerta ${accessibleLevelLabel}`}
                    dateTime={alert.timestamp}
                    className="text-sm text-slate-400"
                  >
                    {timeFormatter.format(new Date(alert.timestamp))}
                  </time>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
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
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <p role="alert" className="mt-3 text-sm text-red-300">
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
