# Industrial Monitoring Dashboard

Dashboard de monitoramento em tempo real para uma linha de produção industrial, focado na máquina `mixer-01`.

O projeto atende ao desafio técnico com monorepo TypeScript, API Node.js, frontend Next.js, contratos compartilhados, dados simulados em tempo real, persistência SQLite para alertas e documentação por pacote.

## Demonstração

O vídeo real de demonstração da aplicação está em:

```text
docs/assets/resolucao-desafio.mp4
```

Link direto: [resolucao-desafio.mp4](docs/assets/resolucao-desafio.mp4).

## Funcionalidades implementadas

- Snapshot inicial da máquina por HTTP.
- Atualização em tempo real por Server-Sent Events.
- Estados `RUNNING`, `STOPPED`, `MAINTENANCE` e `ERROR`.
- Temperatura, RPM, tempo em operação e eficiência.
- Histórico gráfico de temperatura, RPM e eficiência.
- Tendências visuais para métricas recentes.
- OEE, disponibilidade, desempenho e qualidade.
- Histórico de alertas via API.
- Alertas `INFO`, `WARNING` e `CRITICAL`.
- Priorização de alertas por severidade e timestamp.
- Reconhecimento de alertas.
- Feedback visual para críticos não reconhecidos.
- Som para alertas críticos novos após ativação explícita do usuário.
- Reconexão automática do SSE.
- Estados de carregamento, erro e vazio.
- Tema claro, escuro e sistema.
- Storybook para componentes estáveis do frontend.

## Stack real

- pnpm 11
- Turborepo
- TypeScript
- Next.js 16
- React 19
- Tailwind CSS 4
- Recharts
- Node.js HTTP nativo
- SQLite via `node:sqlite`
- Jest
- React Testing Library
- Storybook 10
- ESLint
- Prettier

## Arquitetura do monorepo

```text
industrial-monitoring-dashboard/
├── apps/
│   ├── api/
│   └── web/
├── docs/
│   ├── REQUIREMENTS.md
│   └── TECHNICAL_DECISIONS.md
├── packages/
│   ├── contracts/
│   ├── eslint-config/
│   └── typescript-config/
├── DesafioTécnico.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── turbo.json
```

## Pré-requisitos

```text
Node.js >=24.16.0 <25
pnpm >=11.11.0 <12
```

Verifique:

```bash
node --version
pnpm --version
```

## Instalação

```bash
pnpm install --frozen-lockfile
```

## Preparação dos contratos

Em um clone limpo, compile o pacote compartilhado antes do primeiro `pnpm dev`:

```bash
pnpm --filter @industrial-monitoring/contracts build
```

Isso gera o `dist` consumido pela API e por imports runtime.

## Execução completa

```bash
pnpm --filter @industrial-monitoring/contracts build
pnpm dev
```

Endereços padrão:

```text
Frontend: http://localhost:3000
API:      http://localhost:3333
```

## Execução separada

API:

```bash
pnpm --filter @industrial-monitoring/contracts build
pnpm --filter @industrial-monitoring/api dev
```

Frontend:

```bash
pnpm --filter @industrial-monitoring/web dev
```

Storybook:

```bash
pnpm storybook
```

## Variáveis de ambiente

```text
API_BASE_URL=http://localhost:3333
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333
WEB_ORIGIN=http://localhost:3000
PORT=3333
DATABASE_PATH=data/industrial-monitoring.db
```

- `API_BASE_URL`: usado pelo servidor Next.js para SSR dos dados iniciais.
- `NEXT_PUBLIC_API_BASE_URL`: usado pelo navegador para SSE e reconhecimento de alertas.
- `WEB_ORIGIN`: origem permitida pela API para CORS/SSE.
- `PORT`: porta HTTP da API.
- `DATABASE_PATH`: caminho do SQLite; aceita `:memory:`.

## Comandos

```bash
pnpm format
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm check
pnpm storybook
pnpm storybook:build
```

## Fluxo de dados inicial

Ao abrir a página, o servidor Next.js busca:

```text
GET /api/v1/machines/mixer-01/status
GET /api/v1/machines/mixer-01/metrics/history
GET /api/v1/machines/mixer-01/alerts
```

Esses dados são passados ao dashboard como estado inicial.

## Fluxo SSE

Depois da renderização inicial, o navegador abre:

```text
GET /api/v1/machines/mixer-01/events
```

Eventos consumidos:

```text
CONNECTED
MACHINE_STATUS_UPDATED
METRIC_RECORDED
ALERT_CREATED
ALERT_UPDATED
```

O cliente fecha conexões quebradas, sinaliza desconexão e agenda reconexão.

## Persistência SQLite

O runtime da API usa SQLite para alertas em:

```text
data/industrial-monitoring.db
```

O banco é criado automaticamente quando a API sobe com `DATABASE_PATH` padrão. Os alertas iniciais são semeados com `INSERT OR IGNORE`, e reconhecimentos persistem entre reinícios.

## Documentação dos pacotes

- [API](apps/api/README.md)
- [Frontend](apps/web/README.md)
- [Contratos](packages/contracts/README.md)
- [ESLint config](packages/eslint-config/README.md)
- [TypeScript config](packages/typescript-config/README.md)
- [Decisões técnicas](docs/TECHNICAL_DECISIONS.md)
- [Matriz de requisitos](docs/REQUIREMENTS.md)
- [Vídeo de demonstração](docs/assets/resolucao-desafio.mp4)

## Limitações atuais

- Apenas `mixer-01` possui dados mockados.
- Histórico persistente cobre alertas; métricas históricas ainda são dados simulados/estáticos.
- Não há autenticação.
- Thresholds de alerta são definidos no código.
- Não há testes E2E.
- Não há suporte offline/PWA.

## Evoluções futuras

- Framework ou roteador HTTP se a API crescer.
- Paginação de alertas.
- Persistência do histórico de métricas.
- Playwright.
- CI/CD.
- Docker como opção de empacotamento.
- Observabilidade.
- Autenticação.
- Suporte a múltiplas máquinas.
- Configuração de thresholds.
- PWA/offline.
- Maior isolamento de componentes visuais.

## Licença

Projeto desenvolvido para fins de avaliação técnica.
