# Industrial Monitoring Dashboard

Dashboard web para monitoramento de uma máquina industrial em tempo real.

O projeto foi desenvolvido como um monorepo TypeScript composto por:

- aplicação web em Next.js;
- API HTTP em Node.js;
- persistência SQLite;
- contratos compartilhados;
- comunicação em tempo real por Server-Sent Events;
- testes automatizados;
- validações de lint, tipos, formatação e build.

## Status do projeto

**Checkpoint atual: M19 concluída.**

A aplicação atualmente:

- carrega o estado inicial da máquina pela API;
- exibe estado operacional, temperatura, RPM, uptime e eficiência;
- calcula e apresenta os indicadores de OEE;
- carrega o histórico inicial de métricas;
- apresenta gráficos de temperatura, rotação e eficiência;
- atualiza o dashboard em tempo real;
- recebe novos alertas pelo stream SSE;
- atualiza alertas existentes;
- identifica conexão, desconexão e reconexão;
- recupera-se quando o frontend é iniciado antes da API;
- mantém uma janela móvel com as 30 medições mais recentes;
- apresenta os textos da interface em português do Brasil.

Próxima etapa planejada:

```text
M20 — Gerenciamento de alertas
```

## Tecnologias

### Monorepo e qualidade

- pnpm
- Turborepo
- TypeScript
- ESLint
- Prettier
- Jest

### Frontend

- Next.js
- React
- Tailwind CSS
- Recharts
- React Testing Library
- Server-Sent Events

### API

- Node.js
- HTTP nativo
- SQLite
- Server-Sent Events
- Jest

## Estrutura do projeto

```text
industrial-monitoring-dashboard/
├── apps/
│   ├── api/                  # API, telemetria, persistência e stream SSE
│   └── web/                  # Dashboard Next.js
├── packages/
│   ├── contracts/            # Contratos TypeScript compartilhados
│   ├── eslint-config/        # Configurações compartilhadas do ESLint
│   └── typescript-config/    # Configurações compartilhadas do TypeScript
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

Este README apresenta a visão geral, os requisitos para execução e o estado atual do projeto.

Detalhes específicos de implementação devem permanecer próximos de cada aplicação ou pacote.

## Pré-requisitos

Versões utilizadas durante o desenvolvimento:

```text
Node.js 24
pnpm 11
```

Confira o ambiente:

```bash
node --version
pnpm --version
```

## Instalação

Na raiz do projeto, execute:

```bash
pnpm install --frozen-lockfile
```

## Preparação obrigatória no primeiro uso

A API e o frontend utilizam o pacote interno:

```text
@industrial-monitoring/contracts
```

Esse pacote expõe seus arquivos compilados por meio do diretório `dist`.

Em um clone limpo, compile os contratos antes de iniciar o ambiente de desenvolvimento:

```bash
pnpm --filter @industrial-monitoring/contracts build
```

Depois execute:

```bash
pnpm dev
```

Sem a compilação inicial dos contratos, a API pode apresentar um erro semelhante a:

```text
Error [ERR_MODULE_NOT_FOUND]:
Cannot find module
'@industrial-monitoring/contracts/dist/index.js'
```

O build dos contratos também deve ser executado novamente depois de alterações em tipos, serializadores ou eventos compartilhados:

```bash
pnpm --filter @industrial-monitoring/contracts build
```

## Execução rápida

Fluxo recomendado para a primeira execução:

```bash
pnpm install --frozen-lockfile
pnpm --filter @industrial-monitoring/contracts build
pnpm dev
```

Endereços padrão:

```text
Frontend: http://localhost:3000
API:      http://localhost:3333
```

## Executar as aplicações separadamente

### API

```bash
pnpm --filter @industrial-monitoring/contracts build
pnpm --filter @industrial-monitoring/api dev
```

### Frontend

```bash
pnpm --filter @industrial-monitoring/web dev
```

## Variáveis de ambiente

Os valores padrão permitem executar o projeto localmente sem criar um arquivo `.env`.

Variáveis disponíveis:

```text
API_BASE_URL=http://localhost:3333
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333
WEB_ORIGIN=http://localhost:3000
```

### `API_BASE_URL`

Utilizada pelo servidor Next.js para carregar os dados iniciais da API.

### `NEXT_PUBLIC_API_BASE_URL`

Utilizada pelo navegador para abrir a conexão Server-Sent Events.

### `WEB_ORIGIN`

Define a origem autorizada pela API para acessar o stream SSE.

Exemplo de execução explícita da API:

```bash
WEB_ORIGIN=http://localhost:3000 \
pnpm --filter @industrial-monitoring/api dev
```

Exemplo de execução explícita do frontend:

```bash
API_BASE_URL=http://localhost:3333 \
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333 \
pnpm --filter @industrial-monitoring/web dev
```

## Validação do projeto

Execute todas as verificações do monorepo:

```bash
pnpm check
```

O comando valida:

```text
formatação
tipos
lint
testes
build
```

Também é possível executar as verificações separadamente.

### Testes

```bash
pnpm --filter @industrial-monitoring/api test
pnpm --filter @industrial-monitoring/web test
```

### Tipos

```bash
pnpm --filter @industrial-monitoring/api typecheck
pnpm --filter @industrial-monitoring/web typecheck
```

### Lint

```bash
pnpm --filter @industrial-monitoring/api lint
pnpm --filter @industrial-monitoring/web lint
```

### Build

```bash
pnpm --filter @industrial-monitoring/api build
pnpm --filter @industrial-monitoring/web build
```

### Formatação

```bash
pnpm format
pnpm format:check
```

## Funcionalidades implementadas

### Monitoramento da máquina

O dashboard apresenta:

- estado operacional;
- temperatura;
- RPM;
- tempo em operação;
- eficiência;
- disponibilidade;
- performance;
- qualidade;
- OEE geral.

### Histórico de métricas

O frontend carrega o histórico inicial por meio da API e apresenta gráficos de:

- temperatura;
- rotação;
- eficiência.

Os gráficos:

- utilizam Recharts;
- recebem novos pontos em tempo real;
- apresentam horários no eixo horizontal;
- possuem resumo textual acessível;
- funcionam em diferentes tamanhos de tela;
- mantêm apenas as 30 medições mais recentes no navegador.

### Comunicação em tempo real

Eventos disponíveis:

```text
CONNECTED
MACHINE_STATUS_UPDATED
METRIC_RECORDED
ALERT_CREATED
ALERT_UPDATED
```

O frontend:

- abre uma conexão SSE;
- atualiza os dados sem recarregar a página;
- informa o estado atual da conexão;
- tenta reconectar após interrupções;
- recupera-se quando a API inicia depois do frontend;
- encerra conexões e agendamentos ao desmontar componentes.

### Alertas

Atualmente o dashboard:

- apresenta alertas informativos, de aviso e críticos;
- recebe novos alertas em tempo real;
- atualiza alertas existentes;
- apresenta o estado de reconhecimento;
- mantém os alertas mais recentes no início da lista.

O carregamento inicial dos alertas ainda utiliza dados definidos no frontend.

A integração completa do histórico inicial de alertas com a API será realizada na M20.

### Qualidade

O projeto utiliza:

- TypeScript estrito;
- contratos compartilhados;
- testes unitários;
- testes de integração;
- desenvolvimento orientado por testes;
- lint;
- formatação automática;
- build validado pelo monorepo.

## Fluxo principal de dados

Ao abrir o dashboard, o servidor Next.js carrega:

```text
GET /api/v1/machines/:machineId/status
GET /api/v1/machines/:machineId/metrics/history
```

Depois da renderização inicial, o navegador abre:

```text
GET /api/v1/machines/:machineId/events
```

Os eventos recebidos pelo stream atualizam o estado local do React sem recarregar a página.

## Próximos passos

### M20 — Gerenciamento de alertas

- carregar o histórico inicial de alertas pela API;
- remover os alertas estáticos do frontend;
- permitir o reconhecimento de alertas;
- enviar a ação de reconhecimento para a API;
- atualizar os alertas após `ALERT_UPDATED`;
- destacar alertas críticos não reconhecidos;
- testar estados de carregamento, sucesso e falha.

### Etapas posteriores

- aviso visual e sonoro para alertas críticos;
- aplicação da identidade visual definitiva;
- revisão de acessibilidade;
- revisão completa de responsividade;
- Docker para execução e entrega;
- pipeline final de CI/CD;
- documentação técnica final;
- screenshots e demonstração da aplicação.

## Evoluções técnicas planejadas

Algumas melhorias arquiteturais foram identificadas, mas não fazem parte da implementação atual para evitar alterações amplas próximas da entrega.

### Preparação automática dos contratos

Atualmente, o build inicial de `packages/contracts` precisa ser executado antes do primeiro `pnpm dev`.

Uma evolução será configurar o pipeline do Turborepo para garantir automaticamente que as dependências internas estejam compiladas antes da inicialização das aplicações.

### Roteamento da API

A API atual utiliza o módulo HTTP nativo do Node.js.

O despacho das rotas está centralizado na função `handleRequest`, que atualmente participa de responsabilidades como:

- identificação da rota;
- validação do método HTTP;
- extração de parâmetros da URL;
- seleção do comportamento correspondente;
- tratamento das respostas.

Com o crescimento da aplicação, uma evolução recomendada será adotar um roteador HTTP ou framework, como Express ou Fastify, e separar os handlers por domínio e rota.

Essa alteração deverá preservar:

- contratos compartilhados;
- regras de negócio;
- repositórios;
- testes;
- stream SSE;
- tratamento de erros.

## Documentação específica

Detalhes específicos do frontend estão disponíveis em:

```text
apps/web/README.md
```

A documentação específica da API poderá ser adicionada em:

```text
apps/api/README.md
```

## Licença

Projeto desenvolvido para fins de avaliação técnica.
