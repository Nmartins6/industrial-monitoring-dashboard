export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Monitoramento de máquinas
            </p>

            <h1 className="text-2xl font-semibold tracking-tight">
              Painel de Monitoramento Industrial
            </h1>
          </div>

          <div
            role="status"
            aria-label="Carregando dados da máquina"
            aria-live="polite"
            className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300"
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 animate-pulse rounded-full bg-slate-400"
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
              className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
            />
          ))}
        </section>
      </main>
    </div>
  );
}
