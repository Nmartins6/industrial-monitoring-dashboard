# Aplicação web

Frontend do dashboard de monitoramento industrial.

A aplicação foi construída com Next.js, React, TypeScript, Tailwind CSS e Recharts.

## Tecnologias

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- React Testing Library
- Server-Sent Events

## Execução

A partir da raiz do monorepo, compile primeiro os contratos compartilhados:

```bash
pnpm --filter @industrial-monitoring/contracts build
```

Depois inicie o frontend:

```bash
pnpm --filter @industrial-monitoring/web dev
```

Endereço padrão:

```text
http://localhost:3000
```

Para utilizar todos os recursos do dashboard, a API também deve estar disponível:

```text
http://localhost:3333
```

## Variáveis de ambiente

```text
API_BASE_URL=http://localhost:3333
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333
```

### `API_BASE_URL`

Utilizada pelo servidor Next.js para carregar os dados iniciais.

### `NEXT_PUBLIC_API_BASE_URL`

Utilizada pelo navegador para abrir a conexão Server-Sent Events.

Exemplo:

```bash
API_BASE_URL=http://localhost:3333 \
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333 \
pnpm --filter @industrial-monitoring/web dev
```

## Fluxo de dados

Ao abrir a página, o servidor Next.js carrega:

```text
GET /api/v1/machines/:machineId/status
GET /api/v1/machines/:machineId/metrics/history
```

Depois da renderização inicial, o navegador abre:

```text
GET /api/v1/machines/:machineId/events
```

O stream SSE mantém os dados atualizados sem recarregar a página.

## Eventos consumidos

```text
CONNECTED
MACHINE_STATUS_UPDATED
METRIC_RECORDED
ALERT_CREATED
ALERT_UPDATED
```

### `CONNECTED`

Informa que o stream SSE foi conectado.

### `MACHINE_STATUS_UPDATED`

Atualiza o estado atual da máquina, suas métricas e os indicadores de OEE.

### `METRIC_RECORDED`

Adiciona uma nova medição ao histórico utilizado pelos gráficos.

### `ALERT_CREATED`

Adiciona um novo alerta ao início do histórico.

### `ALERT_UPDATED`

Atualiza um alerta existente, incluindo seu estado de reconhecimento.

## Histórico de métricas

O dashboard apresenta gráficos de:

- temperatura;
- rotação;
- eficiência.

O histórico inicial é carregado pela API.

Novas medições são incorporadas por meio do evento:

```text
METRIC_RECORDED
```

O navegador mantém apenas as 30 medições mais recentes para evitar crescimento indefinido do estado local.

Os gráficos incluem:

- horários no eixo horizontal;
- tooltip;
- resumo textual;
- identificação acessível;
- comportamento responsivo.

## Conexão em tempo real

O frontend apresenta os seguintes estados:

```text
Conectando
Conectado
Desconectado
```

Quando a conexão é interrompida, o cliente:

- informa a desconexão;
- fecha a conexão atual;
- agenda uma nova tentativa;
- reconecta automaticamente.

Quando o frontend inicia antes da API, a página tenta carregar os dados novamente até que o backend esteja disponível.

## Alertas

O frontend atualmente:

- apresenta alertas informativos, de aviso e críticos;
- adiciona novos alertas em tempo real;
- atualiza alertas existentes;
- apresenta o estado de reconhecimento.

O histórico inicial de alertas ainda é definido no frontend.

A integração completa com o endpoint de alertas será realizada na próxima etapa.

## Estrutura principal

```text
src/
├── app/
│   ├── layout.tsx
│   ├── loading.tsx
│   └── page.tsx
├── components/
│   ├── machine-data-retry/
│   ├── machine-metric-history/
│   ├── machine-realtime-dashboard/
│   └── machine-snapshot/
└── lib/
    ├── api/
    │   └── machine-api-client.ts
    └── realtime/
        └── machine-realtime-client.ts
```

## Responsabilidades dos componentes

### `MachineSnapshot`

Apresenta:

- estado atual da máquina;
- métricas atuais;
- uptime;
- eficiência;
- indicadores de OEE.

### `MachineRealtimeDashboard`

Responsável por:

- manter o estado recebido inicialmente;
- abrir a conexão SSE;
- processar eventos em tempo real;
- atualizar o status da máquina;
- atualizar o histórico de métricas;
- limitar o histórico a 30 pontos;
- adicionar e atualizar alertas;
- apresentar o estado da conexão.

### `MachineMetricHistory`

Responsável por:

- apresentar os gráficos;
- formatar valores;
- formatar os horários;
- apresentar o resumo textual acessível.

### `MachineDataRetry`

Responsável por tentar carregar novamente os dados quando a API estiver indisponível no carregamento inicial.

## Cliente HTTP

O cliente HTTP tipado está localizado em:

```text
src/lib/api/machine-api-client.ts
```

Métodos disponíveis:

```text
getMachineStatus(machineId)
getMetricHistory(machineId)
```

As requisições utilizam:

```text
cache: no-store
Accept: application/json
```

Falhas HTTP são representadas pela classe:

```text
MachineApiError
```

## Cliente SSE

O cliente de comunicação em tempo real está localizado em:

```text
src/lib/realtime/machine-realtime-client.ts
```

Responsabilidades:

- construir a URL do stream;
- registrar os eventos nomeados;
- interpretar os contratos;
- informar mudanças de conexão;
- reconectar após falhas;
- cancelar tentativas pendentes;
- fechar a conexão ao desmontar.

## Testes

Execute:

```bash
pnpm --filter @industrial-monitoring/web test
```

Executar um arquivo específico:

```bash
pnpm --filter @industrial-monitoring/web test -- page.test.tsx
```

```bash
pnpm --filter @industrial-monitoring/web test -- \
  machine-realtime-dashboard.test.tsx
```

```bash
pnpm --filter @industrial-monitoring/web test -- \
  machine-metric-history.test.tsx
```

## Validação

### Testes

```bash
pnpm --filter @industrial-monitoring/web test
```

### TypeScript

```bash
pnpm --filter @industrial-monitoring/web typecheck
```

### ESLint

```bash
pnpm --filter @industrial-monitoring/web lint
```

### Build

```bash
pnpm --filter @industrial-monitoring/web build
```

### Validação completa

```bash
pnpm --filter @industrial-monitoring/web test
pnpm --filter @industrial-monitoring/web typecheck
pnpm --filter @industrial-monitoring/web lint
pnpm --filter @industrial-monitoring/web build
```

## Próxima etapa

```text
M20 — Gerenciamento de alertas
```

Objetivos:

- carregar o histórico inicial de alertas pela API;
- remover os alertas estáticos;
- permitir o reconhecimento de alertas;
- apresentar estados de envio e falha;
- atualizar a interface após `ALERT_UPDATED`.
