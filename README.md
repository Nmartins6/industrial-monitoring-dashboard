# Industrial Monitoring Dashboard

Dashboard web para monitoramento de uma máquina industrial em tempo real.

O projeto está sendo desenvolvido de forma incremental, com TDD, contratos compartilhados, validação automatizada e separação clara entre domínio, infraestrutura, API e interface web.

## Status atual

**Checkpoint:** M16 concluída e integrada à `main`.

A fundação completa da API e da aplicação web já está implementada. O frontend ainda utiliza dados estáticos e será conectado à API na próxima milestone.

### Progresso

- [x] Fundação do monorepo
- [x] Configuração de TypeScript, ESLint, Prettier e Turborepo
- [x] Contratos compartilhados
- [x] API HTTP
- [x] Persistência SQLite
- [x] Histórico e reconhecimento de alertas
- [x] Stream em tempo real com Server-Sent Events
- [x] Simulador dinâmico de telemetria
- [x] Avaliação de condições operacionais
- [x] Alertas automáticos
- [x] Deduplicação de alertas ativos
- [x] Cálculo dinâmico de OEE
- [x] Fundação da aplicação Next.js
- [x] Testes do frontend com Jest e React Testing Library
- [x] Estrutura semântica inicial do dashboard
- [ ] Integração tipada entre frontend e API
- [ ] Consumo do stream SSE pelo frontend
- [ ] Gráficos de histórico em tempo real
- [ ] Interação com alertas
- [ ] Aplicação da identidade visual definitiva
- [ ] Revisão final de responsividade e acessibilidade
- [ ] Pipeline final de CI/CD e documentação de entrega

## Objetivo

A aplicação deve permitir o acompanhamento de uma máquina industrial por meio de:

- estado operacional atual;
- temperatura;
- RPM;
- uptime;
- eficiência;
- disponibilidade;
- performance;
- qualidade;
- OEE geral;
- histórico de métricas;
- alertas por severidade;
- atualizações em tempo real;
- indicação de desconexão ou falha de comunicação.

## Arquitetura

O projeto utiliza um monorepo administrado com `pnpm` e Turborepo.

```text
industrial-monitoring-dashboard/
├── apps/
│   ├── api/             # API HTTP, SQLite, telemetria e SSE
│   └── web/             # Aplicação Next.js
├── packages/
│   └── contracts/       # Tipos, contratos e eventos compartilhados
├── compose.dev.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

### Separação de responsabilidades

```text
Contracts
├── tipos de domínio
├── tipos de transporte
├── serializadores
└── eventos em tempo real

API
├── rotas HTTP
├── repositórios
├── persistência SQLite
├── simulação de telemetria
├── avaliação de condições
├── cálculo de OEE
├── criação de alertas
└── stream SSE

Web
├── estrutura da interface
├── componentes acessíveis
├── status da máquina
├── métricas
├── indicadores de OEE
└── histórico de alertas
```

## Tecnologias

### Monorepo e qualidade

- Node.js 24
- pnpm 11
- Turborepo
- TypeScript
- ESLint
- Prettier
- Jest

### API

- Node.js HTTP nativo
- SQLite por meio de `node:sqlite`
- Server-Sent Events
- Arquitetura orientada a contratos e injeção de dependências

### Web

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Jest
- React Testing Library
- Testing Library Jest DOM

## Funcionalidades implementadas

### API HTTP

Endpoints disponíveis:

```text
GET /health
GET /api/v1/machines/:machineId/status
GET /api/v1/machines/:machineId/metrics/history
GET /api/v1/machines/:machineId/alerts
PATCH /api/v1/machines/:machineId/alerts/:alertId/acknowledge
GET /api/v1/machines/:machineId/events
```

As rotas possuem tratamento para:

- máquina inexistente;
- alerta inexistente;
- método HTTP não permitido;
- rota inexistente;
- respostas JSON tipadas;
- headers `Allow` quando aplicável.

### Persistência

O runtime da API utiliza SQLite.

O banco padrão é criado em:

```text
data/industrial-monitoring.db
```

A persistência implementada cobre:

- máquinas cadastradas;
- histórico de alertas;
- reconhecimento de alertas;
- criação de alertas automáticos;
- manutenção dos dados após reiniciar a aplicação.

Os repositórios são abstraídos por interfaces, permitindo o uso de implementações em memória nos testes.

### Atualizações em tempo real

O endpoint SSE é:

```text
GET /api/v1/machines/mixer-01/events
```

Ao abrir uma conexão, a API envia:

```text
CONNECTED
```

A cada aproximadamente três segundos, envia:

```text
MACHINE_STATUS_UPDATED
METRIC_RECORDED
```

Quando uma nova condição operacional é detectada, também pode enviar:

```text
ALERT_CREATED
```

O agendamento é cancelado automaticamente quando o cliente encerra a conexão.

### Simulação de telemetria

A telemetria evolui de forma gradual e testável.

Valores simulados:

- temperatura;
- RPM;
- uptime;
- eficiência;
- disponibilidade;
- qualidade;
- performance;
- OEE geral.

A fonte pseudoaleatória é injetável, permitindo testes determinísticos.

Limites protegidos:

```text
temperatura >= 0
RPM >= 0
eficiência entre 0 e 100
disponibilidade entre 0 e 100
qualidade entre 0 e 100
```

Valores inválidos, não finitos ou fora da faixa esperada da fonte pseudoaleatória são rejeitados.

### Estados operacionais

Estados suportados:

```text
RUNNING
STOPPED
MAINTENANCE
ERROR
```

Para uma máquina em `RUNNING`:

- RPM e eficiência podem variar;
- uptime aumenta;
- OEE é recalculado.

Para `STOPPED`, `MAINTENANCE` ou `ERROR`:

- RPM permanece em zero;
- eficiência e performance permanecem em zero;
- uptime não aumenta;
- OEE geral permanece em zero;
- temperatura ainda pode ser monitorada.

### Avaliação de condições

Regras atualmente implementadas:

```text
temperatura abaixo de 80 °C
→ nenhuma condição

temperatura entre 80 °C e 89,9 °C
→ HIGH_TEMPERATURE
→ severidade WARNING
→ máquina continua RUNNING

temperatura igual ou superior a 90 °C
→ CRITICAL_TEMPERATURE
→ severidade CRITICAL
→ estado da máquina passa para ERROR
```

As regras são isoladas da camada HTTP e não conhecem banco, SSE ou detalhes de infraestrutura.

### Alertas automáticos

Uma condição nova pode gerar:

1. criação do objeto `Alert`;
2. persistência no repositório;
3. emissão do evento `ALERT_CREATED`.

Alertas automáticos nascem com:

```text
acknowledged: false
```

Também existe controle de transição para evitar alertas duplicados:

```text
normal → crítico
→ cria alerta

crítico → crítico
→ não cria outro alerta

crítico → normal → crítico
→ cria um novo alerta
```

### OEE

O cálculo utiliza:

```text
OEE = disponibilidade × performance × qualidade
```

Exemplo:

```text
disponibilidade: 96%
performance:     94%
qualidade:       98%

OEE:
0,96 × 0,94 × 0,98 × 100
= 88,4%
```

O cálculo é isolado, validado e reutilizado pelo simulador de telemetria.

### Interface web

A aplicação web já possui estrutura inicial para:

- cabeçalho do dashboard;
- identificação da máquina;
- indicador de conexão;
- estado operacional;
- horário da última atualização;
- temperatura;
- RPM;
- uptime;
- OEE geral;
- disponibilidade;
- performance;
- qualidade;
- histórico de alertas.

A estrutura foi construída com HTML semântico e consultas de teste orientadas por acessibilidade.

Neste checkpoint, os valores exibidos pelo frontend ainda são estáticos.

## Identidade visual

A identidade visual definitiva ainda não foi aplicada.

A paleta de cores e os logos serão fornecidos antes da etapa de estilização final. As cores atuais do frontend são temporárias e servem apenas para facilitar a visualização da estrutura.

A estilização definitiva deverá ser centralizada em tokens de design, evitando cores e valores de marca espalhados pelos componentes.

## Como executar

### Pré-requisitos

```text
Node.js >= 24.16 e < 25
pnpm >= 11.11 e < 12
```

### Instalação

```bash
pnpm install --frozen-lockfile
```

### Executar API e frontend

Para iniciar todos os pacotes com script de desenvolvimento:

```bash
pnpm dev
```

Ou separadamente:

```bash
pnpm --filter @industrial-monitoring/api dev
```

```bash
pnpm --filter @industrial-monitoring/web dev
```

Endereços padrão:

```text
API: http://localhost:3333
Web: http://localhost:3000
```

### Build de produção

```bash
pnpm build
```

Para iniciar o frontend após o build:

```bash
pnpm --filter @industrial-monitoring/web start
```

### Validação completa

```bash
pnpm check
```

Esse comando executa:

```text
Prettier
TypeScript
ESLint
Jest
Build
```

### Testes por pacote

API:

```bash
pnpm --filter @industrial-monitoring/api test
```

Frontend:

```bash
pnpm --filter @industrial-monitoring/web test
```

Cobertura da API:

```bash
pnpm --filter @industrial-monitoring/api test:coverage
```

Cobertura do frontend:

```bash
pnpm --filter @industrial-monitoring/web test:coverage
```

## Validação manual do SSE

Inicie a API:

```bash
pnpm --filter @industrial-monitoring/api dev
```

Em outro terminal:

```bash
curl --http1.1 --no-buffer -N \
  -H 'Accept: text/event-stream' \
  http://localhost:3333/api/v1/machines/mixer-01/events
```

O stream deve começar com:

```text
CONNECTED
```

E depois emitir ciclos com:

```text
MACHINE_STATUS_UPDATED
METRIC_RECORDED
```

Quando uma nova condição for detectada:

```text
ALERT_CREATED
```

Encerre o `curl` com `Ctrl+C`.

## Estratégia de desenvolvimento

O projeto está sendo implementado em milestones pequenas.

Cada comportamento relevante segue o ciclo:

```text
RED
→ criação do teste que descreve o comportamento esperado

GREEN
→ implementação mínima para fazer o teste passar

REFACTOR
→ melhoria estrutural mantendo os testes verdes
```

Antes de integrar cada milestone:

```bash
pnpm install --frozen-lockfile
pnpm check
git diff --check
```

## Onde o desenvolvimento parou

A milestone **M16 — Fundação da aplicação web** foi concluída.

O frontend já possui sua estrutura inicial e testes, mas ainda não consome dados reais.

O próximo ponto de desenvolvimento é:

```text
M17 — Integração tipada com a API
```

## Próximos passos

### M17 — Cliente HTTP tipado

- adicionar `@industrial-monitoring/contracts` como dependência do frontend;
- criar cliente HTTP isolado;
- configurar a URL da API por variável de ambiente;
- buscar o snapshot inicial da máquina;
- substituir estado, métricas e OEE estáticos;
- tratar carregamento, erro e máquina inexistente.

### M18 — Integração SSE

- criar cliente de eventos em tempo real;
- consumir `CONNECTED`;
- consumir `MACHINE_STATUS_UPDATED`;
- consumir `METRIC_RECORDED`;
- consumir `ALERT_CREATED`;
- atualizar a interface sem recarregar a página;
- implementar estado de conexão;
- tratar desconexão e reconexão.

### M19 — Histórico e gráficos

- integrar histórico inicial de métricas;
- adicionar gráficos de temperatura, RPM e eficiência;
- acrescentar pontos recebidos por SSE;
- limitar a quantidade de pontos mantidos no navegador;
- garantir comportamento responsivo.

### M20 — Alertas interativos

- carregar histórico real de alertas;
- atualizar a lista com `ALERT_CREATED`;
- reconhecer alertas pelo frontend;
- refletir `ALERT_UPDATED`;
- adicionar aviso visual;
- avaliar aviso sonoro para alertas críticos.

### M21 — Identidade visual e experiência

- aplicar paleta oficial;
- adicionar logos;
- centralizar tokens de design;
- revisar modo escuro;
- revisar responsividade;
- revisar contraste e acessibilidade;
- melhorar estados vazios, carregamento e erro.

### M22 — Entrega

- revisar Docker e execução completa;
- finalizar CI/CD;
- atualizar documentação;
- adicionar screenshots;
- preparar demonstração;
- revisar todos os requisitos obrigatórios e extras;
- validar o projeto em ambiente limpo.

## Licença

Projeto desenvolvido para fins de avaliação técnica.

Uso não autorizado não é permitido.
