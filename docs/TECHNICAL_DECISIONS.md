# Decisões técnicas

## Monorepo com pnpm e Turborepo

**Contexto**  
O desafio exige frontend, backend, contratos compartilhados e validações independentes.

**Decisão**  
Usar workspaces pnpm com Turborepo para orquestrar `build`, `test`, `lint` e `typecheck`.

**Alternativas consideradas**  
Repositórios separados ou um único app sem pacotes internos.

**Vantagens**  
Facilita contratos compartilhados, builds por pacote e comandos de validação na raiz.

**Trade-offs e limitações**  
O primeiro `pnpm dev` depende do build inicial dos contratos.

**Consequências**  
Apps e pacotes evoluem de forma isolada, mas com validação integrada.

**Evidências no repositório**  
`pnpm-workspace.yaml`, `turbo.json`, `apps/`, `packages/`.

## TypeScript estrito

**Contexto**  
O domínio trafega métricas, alertas, timestamps e eventos em tempo real.

**Decisão**  
Centralizar flags rígidas em `@industrial-monitoring/typescript-config`.

**Alternativas consideradas**  
Configuração TypeScript própria em cada app ou modo menos estrito.

**Vantagens**  
Reduz divergência entre runtime Node, contratos e frontend.

**Trade-offs e limitações**  
Testes e mocks precisam ser mais explícitos.

**Consequências**  
Erros de contrato aparecem no desenvolvimento antes da execução.

**Evidências no repositório**  
`packages/typescript-config/base.json`, `apps/api/tsconfig.json`, `apps/web/tsconfig.json`.

## Contratos compartilhados

**Contexto**  
API e frontend usam os mesmos tipos de máquina, alerta, histórico e eventos SSE.

**Decisão**  
Criar `@industrial-monitoring/contracts` como pacote interno.

**Alternativas consideradas**  
Duplicar tipos por app ou gerar tipos a partir de OpenAPI.

**Vantagens**  
Evita divergência de nomes, níveis, estados e payloads.

**Trade-offs e limitações**  
O pacote precisa ser compilado antes do uso via Node.

**Consequências**  
Mudanças em contratos quebram consumidores durante typecheck.

**Evidências no repositório**  
`packages/contracts/src/index.ts`, `packages/contracts/tests/*.type-test.ts`.

## Timestamps ISO no transporte

**Contexto**  
`Date` não atravessa HTTP/SSE preservando tipo.

**Decisão**  
Usar `Date` no domínio e ISO string nos tipos de transporte.

**Alternativas consideradas**  
Usar epoch em milissegundos ou strings livres.

**Vantagens**  
ISO é legível, ordenável quando UTC e simples de serializar.

**Trade-offs e limitações**  
Consumidores precisam reconstruir `Date` quando necessário.

**Consequências**  
Serializadores ficam no pacote de contratos.

**Evidências no repositório**  
`packages/contracts/src/transport.ts`.

## API com HTTP nativo

**Contexto**  
A API tem poucas rotas e precisa expor JSON e SSE.

**Decisão**  
Usar `node:http` sem Express/Fastify nesta entrega.

**Alternativas consideradas**  
Express, Fastify ou roteador dedicado.

**Vantagens**  
Menos dependências e controle direto do lifecycle SSE.

**Trade-offs e limitações**  
O despacho manual de rotas cresce em complexidade se a API aumentar.

**Consequências**  
Um framework HTTP é evolução futura razoável.

**Evidências no repositório**  
`apps/api/src/app.ts`, `apps/api/src/server.ts`.

## SSE em vez de WebSocket ou polling

**Contexto**  
O dashboard recebe eventos do servidor, mas não precisa enviar comandos contínuos pelo mesmo canal.

**Decisão**  
Usar Server-Sent Events para atualizações em tempo real.

**Alternativas consideradas**  
WebSocket ou polling HTTP periódico.

**Vantagens**  
Modelo simples, reconexão natural no navegador e bom encaixe para eventos unidirecionais.

**Trade-offs e limitações**  
Não atende comunicação bidirecional contínua.

**Consequências**  
Reconhecimento de alertas usa PATCH HTTP separado.

**Evidências no repositório**  
`apps/api/src/realtime/sse.ts`, `apps/web/src/lib/realtime/machine-realtime-client.ts`.

## Snapshot inicial por HTTP e atualizações por SSE

**Contexto**  
A página precisa renderizar dados iniciais e continuar recebendo mudanças.

**Decisão**  
Carregar status, histórico de métricas e histórico de alertas por HTTP; depois assinar SSE.

**Alternativas consideradas**  
Enviar tudo pelo SSE ou fazer polling completo.

**Vantagens**  
SSR simples e stream dedicado apenas a mudanças.

**Trade-offs e limitações**  
Há dois caminhos de dados que precisam respeitar a mesma ordenação de alertas.

**Consequências**  
A regra de ordenação foi centralizada nos contratos.

**Evidências no repositório**  
`apps/web/src/app/page.tsx`, `apps/web/src/components/machine-realtime-dashboard/machine-realtime-dashboard.tsx`.

## SQLite via node:sqlite

**Contexto**  
O desafio recomenda SQLite com dados mockados.

**Decisão**  
Usar `DatabaseSync` de `node:sqlite`.

**Alternativas consideradas**  
Prisma, better-sqlite3 ou armazenamento somente em memória.

**Vantagens**  
Sem dependência externa e persistência real para alertas.

**Trade-offs e limitações**  
Requer Node compatível com `node:sqlite`.

**Consequências**  
O runtime cria o diretório do banco antes de iniciar o servidor.

**Evidências no repositório**  
`apps/api/src/machines/sqlite-alert-repository.ts`, `apps/api/src/runtime.ts`.

## Abstração de repositório

**Contexto**  
Testes e runtime precisam trocar persistência sem alterar rotas.

**Decisão**  
Definir `AlertRepository` e implementar memória e SQLite.

**Alternativas consideradas**  
Acessar SQLite diretamente nos handlers.

**Vantagens**  
Facilita testes, injeção e isolamento de estado.

**Trade-offs e limitações**  
Mais uma camada pequena para manter.

**Consequências**  
O endpoint pode ser testado com repositório injetado.

**Evidências no repositório**  
`apps/api/src/machines/alert-repository.ts`, `apps/api/tests/alert-repository-injection.test.ts`.

## Simulador determinístico e testável

**Contexto**  
Telemetria em tempo real precisa variar sem deixar testes instáveis.

**Decisão**  
Permitir injeção de fonte randômica e calculadora de OEE.

**Alternativas consideradas**  
Usar `Math.random` diretamente em toda a lógica.

**Vantagens**  
Testes conseguem prever temperatura, RPM e eficiência.

**Trade-offs e limitações**  
Ainda é uma simulação, não leitura de CLP ou sensor real.

**Consequências**  
O simulador pode evoluir sem tocar na API HTTP.

**Evidências no repositório**  
`apps/api/src/machines/machine-telemetry-simulator.ts`.

## Regras puras para OEE

**Contexto**  
OEE precisa ser previsível e testado.

**Decisão**  
Calcular OEE em função pura com validação e normalização percentual.

**Alternativas consideradas**  
Calcular no componente ou direto no simulador.

**Vantagens**  
Regra de domínio isolada e simples de testar.

**Trade-offs e limitações**  
Não há decomposição por ordens de produção reais.

**Consequências**  
O frontend apenas apresenta os valores recebidos.

**Evidências no repositório**  
`apps/api/src/machines/machine-oee-calculator.ts`.

## Histórico limitado a 30 pontos no navegador

**Contexto**  
O SSE pode enviar métricas continuamente.

**Decisão**  
Manter uma janela móvel de 30 medições no estado React.

**Alternativas consideradas**  
Acumular tudo ou paginar histórico no frontend.

**Vantagens**  
Evita crescimento indefinido de memória e mantém gráficos leves.

**Trade-offs e limitações**  
Histórico longo não fica disponível no navegador.

**Consequências**  
Persistência de histórico de métricas é evolução futura.

**Evidências no repositório**  
`apps/web/src/components/machine-realtime-dashboard/machine-realtime-dashboard.tsx`.

## Recharts

**Contexto**  
O desafio exige gráficos com biblioteca dedicada.

**Decisão**  
Usar Recharts para linhas de temperatura, RPM e eficiência.

**Alternativas consideradas**  
Chart.js ou gráficos manuais em SVG.

**Vantagens**  
Integra bem com React e reduz código de visualização.

**Trade-offs e limitações**  
O pacote precisa de cuidados em ambientes como Storybook e testes.

**Consequências**  
Stories e testes usam dados estáticos, sem backend.

**Evidências no repositório**  
`apps/web/src/components/machine-metric-history/machine-metric-history.tsx`.

## Tailwind com tokens semânticos

**Contexto**  
Tema claro/escuro e estados industriais precisam de consistência visual.

**Decisão**  
Definir cores semânticas em CSS variables e expor ao Tailwind.

**Alternativas consideradas**  
Classes com cores fixas ou tema via biblioteca de UI.

**Vantagens**  
Componentes usam `bg-surface`, `text-danger`, `border-border` etc.

**Trade-offs e limitações**  
Alterações visuais exigem atenção às variáveis globais.

**Consequências**  
Storybook precisa importar `globals.css`.

**Evidências no repositório**  
`apps/web/src/app/globals.css`.

## Tema claro, escuro e sistema

**Contexto**  
Dark mode é diferencial do desafio.

**Decisão**  
Oferecer preferências `light`, `dark` e `system`.

**Alternativas consideradas**  
Apenas seguir o sistema ou apenas toggle binário.

**Vantagens**  
Usuário escolhe explicitamente ou delega ao sistema.

**Trade-offs e limitações**  
Exige sincronização com `localStorage` e media query.

**Consequências**  
O logo alterna conforme o tema resolvido.

**Evidências no repositório**  
`apps/web/src/components/theme-selector/theme-selector.tsx`, `apps/web/src/components/brand-logo/brand-logo.tsx`.

## useSyncExternalStore para hidratação

**Contexto**  
Preferência de tema depende de `localStorage`, que só existe no navegador.

**Decisão**  
Usar `useSyncExternalStore` para alinhar snapshot de servidor e cliente.

**Alternativas consideradas**  
Ler localStorage diretamente no render ou usar apenas `useEffect`.

**Vantagens**  
Reduz risco de mismatch de hidratação.

**Trade-offs e limitações**  
Código do seletor fica mais explícito.

**Consequências**  
Mudanças locais disparam evento interno para atualizar a store.

**Evidências no repositório**  
`apps/web/src/components/theme-selector/theme-selector.tsx`.

## Feedback sonoro com Web Audio API

**Contexto**  
Alertas críticos pedem feedback sonoro, mas navegadores bloqueiam áudio automático.

**Decisão**  
Usar Web Audio API somente após ativação explícita do usuário e persistir a preferência.

**Alternativas consideradas**  
Tocar automaticamente ou usar arquivo de áudio.

**Vantagens**  
Respeita políticas do navegador e dispensa asset externo.

**Trade-offs e limitações**  
O usuário precisa ativar o som antes do primeiro alerta audível.

**Consequências**  
Falhas de áudio são isoladas e não impedem atualização do dashboard.

**Evidências no repositório**  
`apps/web/src/components/machine-realtime-dashboard/machine-realtime-dashboard.tsx`.

## Desenvolvimento orientado por testes

**Contexto**  
Mudanças funcionais deveriam ser comprovadas sem refatoração ampla.

**Decisão**  
Adicionar testes antes de corrigir priorização de alertas e som crítico.

**Alternativas consideradas**  
Validar só manualmente.

**Vantagens**  
Regressões ficam cobertas em API e frontend.

**Trade-offs e limitações**  
Mais manutenção de mocks e fixtures.

**Consequências**  
`pnpm test` cobre contratos, API e web.

**Evidências no repositório**  
`apps/api/tests/*`, `apps/web/src/**/*.test.*`.

## Evoluções futuras conscientes

**Contexto**  
Alguns extras agregam valor, mas não são necessários para cumprir a entrega atual.

**Decisão**  
Não implementar nesta task: Playwright, PWA/offline, Docker, autenticação, CI/CD, múltiplas máquinas, observabilidade e configuração dinâmica de thresholds.

**Alternativas consideradas**  
Adicionar esses itens agora.

**Vantagens**  
Mantém escopo focado nos requisitos obrigatórios.

**Trade-offs e limitações**  
Extras como E2E, offline e múltiplas máquinas seguem fora do escopo desta entrega.

**Consequências**  
Esses itens ficam documentados como evolução futura, não como funcionalidade pronta.

**Evidências no repositório**  
`docs/REQUIREMENTS.md`, READMEs dos apps e pacotes.
