export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">
              Monitoramento de máquinas
            </p>

            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Painel de Monitoramento Industrial
            </h1>
          </div>

          <div
            role="status"
            aria-label="Carregando dados da máquina"
            aria-live="polite"
            className="flex self-start items-center gap-2 rounded-full border border-info/30 bg-info/10 px-3 py-2 text-sm font-medium text-info"
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 animate-pulse rounded-full bg-info"
            />
            Carregando dados da máquina...
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section
          aria-label="Marcadores de carregamento do painel"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-32 animate-pulse rounded-xl border border-border bg-surface-secondary"
            />
          ))}
        </section>
      </main>
    </div>
  );
}
