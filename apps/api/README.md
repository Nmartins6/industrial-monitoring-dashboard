# API

API HTTP de monitoramento industrial para a máquina `mixer-01`.

## Propósito

Fornecer snapshots, histórico, persistência de alertas e eventos em tempo real para o dashboard web.

## Responsabilidade no monorepo

Esta aplicação concentra:

- rotas HTTP JSON;
- stream Server-Sent Events;
- simulação de telemetria;
- avaliação de condições da máquina;
- cálculo de OEE;
- criação, listagem e reconhecimento de alertas;
- persistência SQLite no runtime;
- repositório em memória para testes e injeção.

## O que está implementado

- HTTP nativo com `node:http`.
- CORS restrito por `WEB_ORIGIN`.
- Health check.
- Status atual da máquina.
- Histórico inicial de métricas.
- Histórico de alertas ordenado por severidade e timestamp.
- Reconhecimento de alertas via PATCH.
- SSE com eventos `CONNECTED`, `MACHINE_STATUS_UPDATED`, `METRIC_RECORDED` e `ALERT_CREATED`.
- Simulação a cada 3 segundos.
- Estados `RUNNING`, `STOPPED`, `MAINTENANCE` e `ERROR` nos contratos.
- Repositórios de alertas em memória e SQLite.
- Encerramento de servidor e banco no runtime.

## O que não pertence à API

- Renderização React.
- Gráficos.
- Tema claro/escuro.
- Reprodução sonora no navegador.
- Autenticação ou autorização de usuários.

## Estrutura principal

```text
src/
├── app.ts
├── runtime.ts
├── runtime-configuration.ts
├── server.ts
├── machines/
└── realtime/
```

## Endpoints

```text
GET /health
GET /api/v1/machines/:machineId/status
GET /api/v1/machines/:machineId/metrics/history
GET /api/v1/machines/:machineId/alerts
PATCH /api/v1/machines/:machineId/alerts/:alertId/acknowledge
GET /api/v1/machines/:machineId/events
```

O endpoint de eventos mantém uma conexão SSE aberta e envia eventos nomeados.

## Dependências internas

- `@industrial-monitoring/contracts`

## Scripts disponíveis

```bash
pnpm --filter @industrial-monitoring/api dev
pnpm --filter @industrial-monitoring/api build
pnpm --filter @industrial-monitoring/api start
pnpm --filter @industrial-monitoring/api typecheck
pnpm --filter @industrial-monitoring/api lint
pnpm --filter @industrial-monitoring/api test
pnpm --filter @industrial-monitoring/api test:coverage
```

## Como executar

Compile os contratos antes do primeiro uso:

```bash
pnpm --filter @industrial-monitoring/contracts build
pnpm --filter @industrial-monitoring/api dev
```

Endereço padrão:

```text
http://localhost:3333
```

## Variáveis de ambiente

```text
PORT=3333
DATABASE_PATH=data/industrial-monitoring.db
WEB_ORIGIN=http://localhost:3000
```

- `PORT`: porta HTTP da API.
- `DATABASE_PATH`: caminho do SQLite. Aceita `:memory:` para uso efêmero.
- `WEB_ORIGIN`: origem autorizada no CORS e no stream SSE.

## Como testar

```bash
pnpm --filter @industrial-monitoring/api test
```

Os testes de endpoint abrem servidores locais em `127.0.0.1`.

## Decisões relevantes

- A API usa HTTP nativo porque o conjunto de rotas ainda é pequeno.
- SSE foi escolhido para fluxo unidirecional de telemetria.
- Reconhecimento de alertas usa PATCH separado, não o canal SSE.
- SQLite é acessado por `node:sqlite`.
- `AlertRepository` permite trocar memória e SQLite sem alterar handlers.
- O simulador aceita fontes injetadas para testes determinísticos.
- OEE é calculado em regra pura.

## Por que não Express ou Fastify agora

O estado atual da API tem poucas rotas e forte necessidade de controlar headers e lifecycle do SSE. Um framework HTTP adicionaria dependência e abstração sem remover complexidade relevante nesta entrega.

Se a API crescer, a introdução de um roteador ou framework pode separar handlers por domínio e reduzir o tamanho de `handleRequest`.

## Limitações atuais

- Apenas a máquina `mixer-01` tem dados mockados.
- Histórico persistente cobre alertas; histórico longo de métricas ainda é mockado/estático.
- Não há autenticação.
- Thresholds são configurados no código.

## Evoluções futuras

- Framework ou roteador HTTP.
- Paginação de alertas.
- Persistência do histórico de métricas.
- Observabilidade.
- Autenticação.
- Suporte a múltiplas máquinas.
- Configuração de thresholds.
- CI/CD.
- Docker como opção de empacotamento, não como requisito de execução atual.
