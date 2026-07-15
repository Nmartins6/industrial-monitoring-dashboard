# @industrial-monitoring/contracts

Pacote de contratos TypeScript compartilhados entre API e frontend.

## Propósito

Definir os tipos de domínio e transporte usados pelo dashboard industrial: máquina, métricas, alertas, histórico e eventos em tempo real.

## Responsabilidade no monorepo

Este pacote é a fonte comum para:

- estados de máquina;
- métricas atuais;
- OEE;
- alertas e níveis de severidade;
- histórico de métricas;
- payloads de transporte HTTP/SSE;
- serializadores de `Date` para ISO string;
- factories de eventos SSE;
- ordenação compartilhada do histórico de alertas.

## O que está implementado

- `MachineStatus`, `Alert` e `MetricHistory` de domínio.
- Tipos de transporte com timestamp em ISO string.
- Serializadores para status, alerta e histórico.
- Eventos `CONNECTED`, `MACHINE_STATUS_UPDATED`, `METRIC_RECORDED`, `ALERT_CREATED` e `ALERT_UPDATED`.
- `sortAlertsByPriority`, com severidade antes de timestamp.
- Testes de tipo com `tsc`.

## O que não pertence a este pacote

- Componentes React.
- Rotas HTTP.
- Persistência SQLite.
- Lógica de simulação da máquina.
- Estilos ou tokens visuais.

## Estrutura principal

```text
src/
├── alert.ts
├── machine-status.ts
├── metric-history.ts
├── realtime-event.ts
├── realtime-event-factory.ts
├── transport.ts
└── index.ts
```

## Dependências internas

Usa os presets de TypeScript e ESLint do workspace:

- `@industrial-monitoring/typescript-config`
- `@industrial-monitoring/eslint-config`

## Scripts disponíveis

```bash
pnpm --filter @industrial-monitoring/contracts build
pnpm --filter @industrial-monitoring/contracts typecheck
pnpm --filter @industrial-monitoring/contracts lint
```

## Como executar

Compile antes do primeiro `pnpm dev` em um clone limpo:

```bash
pnpm --filter @industrial-monitoring/contracts build
```

## Como testar

```bash
pnpm --filter @industrial-monitoring/contracts typecheck
```

Os arquivos em `tests/` usam `@ts-expect-error` para provar restrições de tipos.

## Decisões relevantes

- `Date` é usado no domínio.
- ISO string é usado no transporte porque JSON e SSE não preservam objetos `Date`.
- A ordenação de alertas fica aqui para API e frontend aplicarem a mesma regra.

## Limitações atuais

- Não há validação runtime de payload externo.
- O pacote precisa ser compilado para consumidores Node importarem via `dist`.

## Evoluções futuras

- Adicionar validação runtime com schema se payloads externos crescerem.
- Gerar documentação de contrato a partir dos tipos.
- Expandir eventos para múltiplas máquinas.
