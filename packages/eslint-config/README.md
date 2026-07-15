# @industrial-monitoring/eslint-config

Configurações ESLint compartilhadas do monorepo.

## Propósito

Manter regras consistentes de lint para pacotes Node, contratos e frontend React.

## Responsabilidade no monorepo

Fornecer presets reutilizáveis:

- `@industrial-monitoring/eslint-config/base`
- `@industrial-monitoring/eslint-config/node`
- `@industrial-monitoring/eslint-config/react`

## O que está implementado

- Regras base recomendadas do ESLint e TypeScript ESLint.
- Ignora diretórios gerados como `dist`, `.test-dist`, `.turbo` e `coverage`.
- Regras de consistência como `curly`, `eqeqeq`, `object-shorthand` e `consistent-type-imports`.
- Preset Node com globals adequados para ESM e CommonJS.
- Preset React com React Hooks e React Refresh.
- Testes de consumo dos presets.

## O que não pertence a este pacote

- Regras específicas de domínio industrial.
- Configuração de Jest, Next.js ou Turborepo.
- Formatação Prettier.

## Estrutura principal

```text
base.js
node.js
react.js
tests/
```

## Dependências internas

Este pacote é consumido por:

- `apps/api`
- `packages/contracts`
- testes internos de configuração

## Scripts disponíveis

```bash
pnpm --filter @industrial-monitoring/eslint-config lint
```

## Como executar

O pacote não roda aplicação. Ele é importado pelos `eslint.config.*` dos consumidores.

## Como testar

```bash
pnpm --filter @industrial-monitoring/eslint-config lint
```

## Decisões relevantes

- Presets são separados por ambiente para evitar globals incorretos.
- Type imports são incentivados para reduzir imports runtime desnecessários.
- Diretórios gerados são ignorados no preset base.

## Limitações atuais

- O frontend Next usa `eslint-config-next` diretamente em `apps/web`.
- Não há preset específico para testes Jest.

## Evoluções futuras

- Adicionar preset de testes caso mais pacotes precisem de globals Jest.
- Revisar regras React Refresh caso componentes compartilhados sejam extraídos.
- Documentar política de exceções para regras por pacote.
