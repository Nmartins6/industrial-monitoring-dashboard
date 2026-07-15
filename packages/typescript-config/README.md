# @industrial-monitoring/typescript-config

Presets TypeScript compartilhados do monorepo.

## Propósito

Centralizar opções estritas para manter API, frontend e pacotes internos alinhados.

## Responsabilidade no monorepo

Expor presets:

- `@industrial-monitoring/typescript-config/base`
- `@industrial-monitoring/typescript-config/node`
- `@industrial-monitoring/typescript-config/react`

## O que está implementado

- Flags estritas em `base.json`.
- Preset Node com `module` e `moduleResolution` em `NodeNext`.
- Preset React/Next com DOM libs, JSX e `moduleResolution` `Bundler`.
- Teste de consumo do preset Node.

## O que não pertence a este pacote

- Paths específicos de cada app.
- Configuração de Jest.
- Configuração de build do Next.js.

## Estrutura principal

```text
base.json
node.json
react.json
tests/
```

## Dependências internas

Consumido por:

- `apps/api`
- `packages/contracts`
- testes internos do pacote

## Scripts disponíveis

```bash
pnpm --filter @industrial-monitoring/typescript-config typecheck
```

## Como executar

Este pacote não executa aplicação. Use `extends` no `tsconfig.json` do consumidor.

Exemplo:

```json
{
  "extends": "@industrial-monitoring/typescript-config/node"
}
```

## Como testar

```bash
pnpm --filter @industrial-monitoring/typescript-config typecheck
```

## Decisões relevantes

- `strict`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes` ficam no preset base.
- Node usa ESM com resolução `NodeNext`.
- React/Next usa resolução `Bundler` e não emite arquivos.

## Limitações atuais

- Ainda não há preset específico para bibliotecas React publicáveis.
- O pacote valida o preset Node; o uso React é validado indiretamente pelo frontend.

## Evoluções futuras

- Adicionar teste de consumo do preset React.
- Criar preset para testes se Jest exigir ajustes globais recorrentes.
- Versionar mudanças de flags com notas de migração internas.
