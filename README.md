# Industrial Monitoring Dashboard

Dashboard web para monitoramento de uma máquina industrial em tempo real.

O projeto utiliza um monorepo com frontend em Next.js, API em Node.js, contratos TypeScript compartilhados, persistência SQLite e comunicação em tempo real por Server-Sent Events.

## Status do projeto

**Checkpoint atual: M18 concluída.**

A aplicação já:

- carrega o estado inicial da máquina pela API;
- atualiza estado, métricas e OEE em tempo real;
- recebe novos alertas pelo stream SSE;
- atualiza alertas existentes;
- identifica conexão, desconexão e reconexão;
- recupera-se quando o frontend inicia antes da API;
- apresenta os textos da interface em português do Brasil.

Próxima etapa:

```text
M19 — Histórico de métricas e gráficos
```

## Tecnologias

### Monorepo

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
- React Testing Library
- Server-Sent Events

### API

- Node.js HTTP
- SQLite
- Server-Sent Events
- Jest

## Estrutura

```text
industrial-monitoring-dashboard/
├── apps/
│   ├── api/                  # API, SQLite, telemetria e stream SSE
│   └── web/                  # Dashboard Next.js
├── packages/
│   ├── contracts/            # Contratos compartilhados
│   ├── eslint-config/        # Configuração compartilhada de lint
│   └── typescript-config/    # Configuração compartilhada de TypeScript
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

O README raiz apresenta apenas a visão geral, a execução do projeto e o estado atual.

Detalhes específicos de implementação devem permanecer próximos de cada aplicação ou pacote.

## Pré-requisitos

Versões utilizadas durante o desenvolvimento:

```text
Node.js 24
pnpm 11
```

Confirme o ambiente:

```bash
node --version
pnpm --version
```

## Instalação

Na raiz do projeto:

```bash
pnpm install --frozen-lockfile
```

## Preparação obrigatória no primeiro uso

A API importa o pacote interno:

```text
@industrial-monitoring/contracts
```

Esse pacote expõe seus arquivos compilados por meio do diretório `dist`. Em um clone limpo, compile os contratos antes de iniciar o ambiente de desenvolvimento:

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

Também execute novamente o build dos contratos após alterar seus tipos, serializadores ou eventos:

```bash
pnpm --filter @industrial-monitoring/contracts build
```

## Execução rápida

Para uma primeira execução:

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

## Executar separadamente

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

Responsabilidades:

```text
API_BASE_URL
→ comunicação do servidor Next.js com a API

NEXT_PUBLIC_API_BASE_URL
→ comunicação do navegador com o stream SSE

WEB_ORIGIN
→ origem autorizada pela API para acessar o SSE
```

Exemplo de execução explícita:

```bash
WEB_ORIGIN=http://localhost:3000 \
pnpm --filter @industrial-monitoring/api dev
```

```bash
API_BASE_URL=http://localhost:3333 \
NEXT_PUBLIC_API_BASE_URL=http://localhost:3333 \
pnpm --filter @industrial-monitoring/web dev
```

## Validação

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

Também é possível executar por aplicação:

```bash
pnpm --filter @industrial-monitoring/api test
pnpm --filter @industrial-monitoring/web test
```

```bash
pnpm --filter @industrial-monitoring/api typecheck
pnpm --filter @industrial-monitoring/web typecheck
```

```bash
pnpm --filter @industrial-monitoring/api build
pnpm --filter @industrial-monitoring/web build
```

## Funcionalidades implementadas

### Monitoramento

- estado operacional da máquina;
- temperatura;
- RPM;
- uptime;
- eficiência;
- disponibilidade;
- performance;
- qualidade;
- OEE geral.

### Tempo real

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

- níveis informativo, aviso e crítico;
- histórico em ordem cronológica;
- indicação de reconhecimento;
- inclusão de alertas em tempo real;
- atualização de alertas existentes.

### Qualidade

- TypeScript estrito;
- contratos compartilhados;
- testes unitários e de integração;
- TDD;
- lint;
- formatação automática;
- build validado pelo monorepo.

## Próximos passos

### M19 — Histórico e gráficos

- carregar o histórico inicial de métricas;
- exibir gráficos de temperatura, RPM e eficiência;
- consumir `METRIC_RECORDED` nos gráficos;
- limitar a quantidade de pontos no navegador;
- garantir responsividade;
- testar atualizações sem recarregar a página.

### Etapas posteriores

- reconhecimento de alertas pela interface;
- aviso visual e sonoro para alertas críticos;
- aplicação da identidade visual definitiva;
- revisão de acessibilidade e responsividade;
- Docker e documentação final de entrega;
- screenshots e demonstração.

## Evoluções técnicas planejadas

Estas melhorias foram identificadas, mas não fazem parte da implementação atual para evitar uma alteração arquitetural ampla perto da entrega.

### Preparação automática dos contratos

Atualmente, o build inicial de `packages/contracts` precisa ser executado antes do primeiro `pnpm dev`.

Uma evolução será configurar o pipeline do Turborepo para garantir automaticamente que as dependências internas estejam compiladas antes da inicialização das aplicações.

### Roteamento da API

A API atual utiliza o módulo HTTP nativo do Node.js. O despacho das rotas está centralizado na função `handleRequest`.

Com o crescimento da aplicação, essa função passou a acumular responsabilidades como:

- identificação da rota;
- validação do método HTTP;
- extração de parâmetros;
- seleção do handler;
- tratamento das respostas.

Uma evolução posterior será adotar um roteador HTTP ou framework, como Express ou Fastify, e separar os handlers por domínio e rota.

Essa mudança deve preservar:

- contratos compartilhados;
- regras de negócio;
- repositórios;
- testes;
- stream SSE;
- tratamento de erros.

## Licença

Projeto desenvolvido para fins de avaliação técnica.
