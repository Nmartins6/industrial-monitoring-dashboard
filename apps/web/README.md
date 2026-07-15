# Aplicação web

Frontend Next.js do dashboard de monitoramento industrial da máquina `mixer-01`.

## Propósito

Renderizar a experiência de monitoramento em tempo real com snapshot inicial, gráficos, alertas, OEE, tema e Storybook dos componentes estáveis.

## Responsabilidade no monorepo

Esta aplicação concentra:

- SSR dos dados iniciais;
- cliente HTTP para a API;
- cliente SSE com reconexão;
- dashboard em tempo real;
- componentes visuais;
- tema claro, escuro e sistema;
- feedback visual e sonoro para alertas críticos;
- Storybook.

## O que está implementado

- Carregamento inicial de status, métricas e alertas pela API.
- Atualizações por SSE.
- Reconexão e status visual de conexão.
- Histórico de métricas com Recharts.
- Tendências de temperatura, RPM e eficiência.
- Cards de máquina e OEE.
- Histórico de alertas ordenado por severidade e timestamp.
- Reconhecimento de alertas via PATCH.
- Controle acessível para ativar/desativar som crítico.
- Preferência de som persistida em `localStorage`.
- Tema claro, escuro e sistema.
- Tokens semânticos em Tailwind.
- Prevenção de mismatch de hidratação no tema com `useSyncExternalStore`.
- Estados vazio, loading e erro.
- Testes com Jest e React Testing Library.
- Storybook com temas claro e escuro.

## O que não pertence ao frontend

- Persistência SQLite.
- Simulação de telemetria.
- Cálculo de OEE no backend.
- Regras de threshold.
- Autenticação.

## Estrutura principal

```text
src/
├── app/
├── components/
│   ├── brand-logo/
│   ├── machine-alert-history/
│   ├── machine-data-retry/
│   ├── machine-metric-history/
│   ├── machine-realtime-dashboard/
│   ├── machine-snapshot/
│   └── theme-selector/
└── lib/
    ├── api/
    ├── realtime/
    └── theme/
```

## Dependências internas

- `@industrial-monitoring/contracts`

## Scripts disponíveis

```bash
pnpm --filter @industrial-monitoring/web dev
pnpm --filter @industrial-monitoring/web build
pnpm --filter @industrial-monitoring/web start
pnpm --filter @industrial-monitoring/web typecheck
pnpm --filter @industrial-monitoring/web lint
pnpm --filter @industrial-monitoring/web test
pnpm --filter @industrial-monitoring/web storybook
pnpm --filter @industrial-monitoring/web storybook:build
```

## Como executar

Compile os contratos em um clone limpo:

```bash
pnpm --filter @industrial-monitoring/contracts build
```

Inicie o frontend:

```bash
pnpm --filter @industrial-monitoring/web dev
```

Endereço padrão:

```text
http://localhost:3000
```

Para dados reais da aplicação local, mantenha a API em:

```text
http://localhost:3333
```

## Variáveis de ambiente

```text
API_BASE_URL=http://localhost:3333
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333
```

- `API_BASE_URL`: usado no servidor Next.js para buscar dados iniciais.
- `NEXT_PUBLIC_API_BASE_URL`: usado no navegador para SSE e PATCH de reconhecimento.

## Fluxo de dados

SSR:

```text
GET /api/v1/machines/mixer-01/status
GET /api/v1/machines/mixer-01/metrics/history
GET /api/v1/machines/mixer-01/alerts
```

Navegador:

```text
GET /api/v1/machines/mixer-01/events
PATCH /api/v1/machines/mixer-01/alerts/:alertId/acknowledge
```

## Cliente HTTP

`src/lib/api/machine-api-client.ts` expõe:

- `getMachineStatus`
- `getMetricHistory`
- `getAlertHistory`
- `acknowledgeAlert`

Todas as leituras usam `cache: no-store`.

## Cliente SSE

`src/lib/realtime/machine-realtime-client.ts` abre `EventSource`, escuta eventos nomeados, sinaliza conexão/desconexão e agenda reconexão após falhas.

## Tema

`ThemeSelector` suporta:

- claro;
- escuro;
- sistema.

A preferência é persistida em `localStorage`, e `useSyncExternalStore` mantém snapshots de servidor e cliente alinhados.

## Som crítico

O som crítico começa desativado ou segue a preferência persistida. O usuário precisa ativar explicitamente pelo botão textual do dashboard. A reprodução usa Web Audio API e falhas de áudio não impedem a atualização dos alertas.

## Storybook

```bash
pnpm --filter @industrial-monitoring/web storybook
pnpm --filter @industrial-monitoring/web storybook:build
```

Stories estáticas existem para:

- `BrandLogo`
- `ThemeSelector`
- `MachineSnapshot`
- `MachineMetricHistory`
- `MachineAlertHistory`

As stories não chamam a API, não abrem `EventSource` e não dependem de backend ativo.

## Como testar

```bash
pnpm --filter @industrial-monitoring/web test
pnpm --filter @industrial-monitoring/web typecheck
pnpm --filter @industrial-monitoring/web lint
pnpm --filter @industrial-monitoring/web storybook:build
```

## Decisões relevantes

- Snapshot inicial por HTTP e atualizações por SSE.
- Janela de 30 medições no navegador para evitar crescimento indefinido.
- Ordenação de alertas vem dos contratos compartilhados.
- Tokens Tailwind usam variáveis semânticas.
- Componentes puros foram priorizados no Storybook.

## Limitações atuais

- Não há testes E2E.
- Não há suporte offline/PWA.
- O dashboard monitora apenas `mixer-01`.
- Storybook não cobre o componente `MachineRealtimeDashboard` para evitar simulação completa de SSE.

## Evoluções futuras

- Playwright.
- Suporte offline/PWA.
- Múltiplas máquinas.
- Preferências avançadas por usuário.
- Maior isolamento de componentes visuais.
- Screenshots reais em `docs/assets` para a entrega do desafio.
