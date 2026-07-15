# Desafio Técnico: Dashboard de Automação Industrial

## Contexto

Desenvolver uma solução de monitoramento em tempo real para uma linha de produção industrial. O sistema deve fornecer visibilidade completa sobre o estado das máquinas, métricas de performance e alertas operacionais. Deverá ser feito focando em uma máquina específica do processo, misturador, prensa, resfriador...

## Objetivo

Criar um dashboard de monitoramento industrial usando arquitetura de monorepo, com componentes reutilizáveis e dados em tempo real.

---

## Layout mínimo

```
+--------------------------------------------------------------------------------------------------------+
|  [Logo]     Dashboard de Monitoramento     [Dark/Light Toggle]          [Status Conexão]    [Config]   |
+--------------------------------------------------------------------------------------------------------+
|                                                                                                        |
|  +------------------+  +------------------+  +------------------+  +----------------------+            |
|  |  Estado Máquina  |  |   Temperatura    |  |       RPM        |  |   Tempo de Operação  |            |
|  |    [Ligada]      |  |     78°C ▲       |  |      1200 ▼      |  |       5h 23m         |            |
|  |   Status: OK     |  |    Máx: 85°C     |  |    Máx: 1500     |  |                      |            |
|  +------------------+  +------------------+  +------------------+  +----------------------+            |
|                                                                                                        |
|  +----------------------------------------------------------------------------------------+            |
|  |  Gráfico de Métricas                                                                   |            |
|  |                                                                                        |            |
|  |  [Linha de temperatura]                                                                |            |
|  |  [Linha de RPM]                                                                        |            |
|  |  [Indicador de eficiência]                                                             |            |
|  |                                                                                        |            |
|  +----------------------------------------------------------------------------------------+            |
|                                                                                                        |
|  +-----------------------------------+  +-------------------------------------------------+            |
|  |  Alertas Recentes                 |  |  Métricas de Eficiência                         |            |
|  |  [Lista de alertas com severidade]|  |  - OEE: 92%                                     |            |
|  |  - Crítico: Temp. Alta (2min)     |  |  - Disponibilidade: 98%                         |            |
|  |  - Aviso: RPM Baixo (5min)        |  |  - Performance: 95%                             |            |
|  |  - Info: Manutenção Próxima       |  |  - Qualidade: 94%                               |            |
|  +-----------------------------------+  +-------------------------------------------------+            |
|                                                                                                        |
+--------------------------------------------------------------------------------------------------------+
```

## Requisitos Técnicos Obrigatórios

### Stack Tecnológico

- **Framework**: React 18+ ou Next.js 14+
- **Linguagem**: TypeScript (obrigatório)
- **Estilização**: Tailwind CSS
- **Arquitetura**: Monorepo (recomendado estrutura Turborepo)
- **Dados**: SQLite com dados mockados (recomendado) ou estrutura backend simulada.
- **Testes**: Jest + React Testing Library
- **Gráficos**: Chart.js, Recharts ou similar

---

## Funcionalidades Obrigatórias

### 1. Monitoramento em Tempo Real

- Estados da máquina: Ligada, Desligada, Em Manutenção, Erro
- Métricas: Temperatura, RPM, Tempo de Operação
- Atualização simulada em tempo real (intervalo de 2-5 segundos)
- Tratamento de erros e indicação visual de perda de conexão

### 2. Visualização de Dados

- Cards de métricas com valores atuais e indicadores de tendência
- Gráficos de histórico de temperatura e RPM
- Medidores visuais para métricas críticas
- Interface responsiva para desktop, tablet e mobile

### 3. Sistema de Alertas

- Níveis: INFO, WARNING, CRITICAL
- Histórico de alertas
- Priorização por severidade e timestamp
- Feedback visual/sonoro para alertas críticos

### 4. Métricas de Eficiência Industrial

- OEE (Overall Equipment Effectiveness)
- Disponibilidade (uptime/tempo total)
- Performance (velocidade real vs. teórica)
- Qualidade (produtos bons vs. total)

---

## Estrutura de Dados

### Tipos TypeScript Obrigatórios

```typescript
interface MachineStatus {
  id: string;
  timestamp: Date;
  state: "RUNNING" | "STOPPED" | "MAINTENANCE" | "ERROR";
  metrics: {
    temperature: number;
    rpm: number;
    uptime: number;
    efficiency: number;
  };
  oee: {
    overall: number;
    availability: number;
    performance: number;
    quality: number;
  };
}

interface Alert {
  id: string;
  level: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  component: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface MetricHistory {
  timestamp: Date;
  temperature: number;
  rpm: number;
  efficiency: number;
}
```

---

## Critérios de Avaliação

### 1. Arquitetura e Organização

- **Monorepo**: Configuração e separação de responsabilidades
- **Componentização**: Reutilização e organização
- **Tipagem**: TypeScript rigoroso e interfaces bem definidas

### 2. Funcionalidades

- **Tempo Real**: Atualização fluida e tratamento de desconexão
- **Visualização**: Gráficos, cards e responsividade (Computador e Tablet)
- **Sistema de Alertas**: Priorização, histórico e notificações

### 3. Qualidade e UX

- **Interface**: Design limpo, hierarquia visual, uso do Tailwind CSS
- **Experiência**: Usabilidade, feedback visual e navegação
- **Extras**: Dark mode, animações, documentação

---

## Diferenciais (Pontos Extras)

### Funcionalidades Avançadas

- Modo Dark/Light funcional
- Histórico persistente (LocalStorage ou IndexedDB)
- Documentação com Storybook
- Testes E2E

### Técnicas Avançadas

- Otimizações de performance
- Suporte offline
- Animações suaves
- Acessibilidade completa

---

## Entrega Obrigatória

### 1. Repositório GitHub

- **README.md** completo com instruções de instalação e execução
- **Código organizado** podem ser feitos comentários para explicar trecho do código e porque foi pensado desta forma. (Ponto positivo se fizer)
- **Documentação** das decisões técnicas

### 2. Demonstração

- **Vídeo** (máx. 3 minutos) mostrando funcionalidades principais
- **OU Screenshots** de alta qualidade da aplicação funcionando
- **Deverá** ser anexado no próprio Github

### 3. Dados de Teste

- **SQLite** com dados pré-populados (recomendado)
- **OU** Mock de dados com estrutura realista
- **Simulação** de mudanças de estado em tempo real

---

## Tempo Estimado

**4-6 horas** para implementação completa

## Critérios de Aprovação

- **Todas as funcionalidades obrigatórias** implementadas
- **Código executável** sem erros
- **Documentação** clara e completa
- **Estrutura backend**
- **Estrutura frontend**

## Red Flags (Desqualificação)

- Ausência de TypeScript
- Código não executável
- Falta de documentação básica
- Problemas graves de performance

---

**Boa sorte!** 🚀

_Este desafio avalia suas habilidades técnicas e capacidade de criar soluções robustas para monitoramento industrial._
