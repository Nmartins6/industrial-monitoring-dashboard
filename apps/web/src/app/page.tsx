const LAST_UPDATE_AT = '2026-07-13T00:00:00.000Z';

const ALERT_HISTORY = [
  {
    id: 'alert-003',
    level: 'Critical',
    message: 'Temperature exceeded the critical threshold',
    component: 'temperature-sensor',
    timestamp: '2026-07-12T10:00:12.000Z',
    displayTime: '10:00:12',
    acknowledged: false,
  },
  {
    id: 'alert-002',
    level: 'Warning',
    message: 'Motor vibration is above the recommended level',
    component: 'motor',
    timestamp: '2026-07-12T10:00:09.000Z',
    displayTime: '10:00:09',
    acknowledged: false,
  },
  {
    id: 'alert-001',
    level: 'Information',
    message: 'Machine monitoring started',
    component: 'monitoring-system',
    timestamp: '2026-07-12T10:00:00.000Z',
    displayTime: '10:00:00',
    acknowledged: true,
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Machine monitoring
            </p>

            <h1 className="text-2xl font-semibold tracking-tight">
              Industrial Monitoring Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Machine
              </p>

              <p className="font-medium">Mixer 01</p>
            </div>

            <div
              role="status"
              aria-label="Realtime connection status"
              className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-emerald-400"
              />
              Connected
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section
          aria-labelledby="machine-status-title"
          className="rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 id="machine-status-title" className="text-lg font-semibold">
                Machine status
              </h2>

              <time
                aria-label="Last machine update"
                dateTime={LAST_UPDATE_AT}
                className="mt-1 block text-sm text-slate-400"
              >
                Updated just now
              </time>
            </div>

            <div
              role="status"
              aria-label="Current machine state"
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300"
            >
              Running
            </div>
          </div>
        </section>

        <section aria-labelledby="current-metrics-title" className="mt-6">
          <h2 id="current-metrics-title" className="text-lg font-semibold">
            Current metrics
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article
              aria-label="Temperature metric"
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-sm font-medium text-slate-400">
                Temperature
              </h3>

              <p className="mt-3 text-3xl font-semibold">72 °C</p>
            </article>

            <article
              aria-label="RPM metric"
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-sm font-medium text-slate-400">RPM</h3>

              <p className="mt-3 text-3xl font-semibold">1,200</p>
            </article>

            <article
              aria-label="Uptime metric"
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-sm font-medium text-slate-400">Uptime</h3>

              <p className="mt-3 text-3xl font-semibold">8 h</p>
            </article>
          </div>
        </section>

        <section aria-labelledby="oee-title" className="mt-6">
          <h2 id="oee-title" className="text-lg font-semibold">
            Overall equipment effectiveness
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article
              aria-label="Overall OEE"
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-sm font-medium text-slate-400">
                Overall OEE
              </h3>

              <p className="mt-3 text-3xl font-semibold">88.4%</p>
            </article>

            <article
              aria-label="Availability"
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-sm font-medium text-slate-400">
                Availability
              </h3>

              <p className="mt-3 text-3xl font-semibold">96%</p>
            </article>

            <article
              aria-label="Performance"
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-sm font-medium text-slate-400">
                Performance
              </h3>

              <p className="mt-3 text-3xl font-semibold">94%</p>
            </article>

            <article
              aria-label="Quality"
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-sm font-medium text-slate-400">Quality</h3>

              <p className="mt-3 text-3xl font-semibold">98%</p>
            </article>
          </div>
        </section>

        <section aria-labelledby="alert-history-title" className="mt-6">
          <div className="flex items-center justify-between">
            <h2 id="alert-history-title" className="text-lg font-semibold">
              Alert history
            </h2>

            <p className="text-sm text-slate-400">Latest machine events</p>
          </div>

          <ul className="mt-4 space-y-3">
            {ALERT_HISTORY.map((alert) => (
              <li
                key={alert.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <article>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold">{alert.level}</p>

                        <p className="text-xs text-slate-400">
                          {alert.component}
                        </p>
                      </div>

                      <p className="mt-2 text-sm text-slate-200">
                        {alert.message}
                      </p>
                    </div>

                    <time
                      aria-label={`${alert.level} alert timestamp`}
                      dateTime={alert.timestamp}
                      className="text-sm text-slate-400"
                    >
                      {alert.displayTime}
                    </time>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {alert.acknowledged
                      ? 'Acknowledged'
                      : 'Awaiting acknowledgement'}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
