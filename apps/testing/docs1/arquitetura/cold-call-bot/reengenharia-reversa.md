---
title: Reengenharia Reversa - Cold Call Bot
description: Metodologia de construção acelerada com sub-agentes especializados
---

# 🔄 Reengenharia Reversa

## Visão Geral

Em aproximadamente **6 horas**, saímos de um bot que não salvava chamadas e tinha voz cortando para um sistema completo com dashboard de custos, retry automático e controles por lead. Foram **~15 sub-agentes**, **~25 commits** e **4 fases principais**.

---

## 🧠 Metodologia: Sub-Agentes Especializados

### Princípio Core
**Nunca fazer tudo sozinho.** Decompor em tarefas paralelas com contexto cirúrgico.

### Padrão de Decomposição

```
1. DIAGNOSTICAR (orquestrador, rápido)
   - curl direto nas APIs
   - grep no código
   - Entender a arquitetura antes de delegar

2. DECOMPOR (identificar tarefas paralelas)
   - O que pode rodar ao mesmo tempo?
   - O que depende de quê?

3. SPAWNAR com contexto PRECISO
   - Cada agente recebe: arquivos, schemas, APIs, design system
   - Nada genérico — tudo específico
   - Modelo Sonnet pra tasks de código (mais rápido, suficiente)

4. INTEGRAR (orquestrador, pós-agentes)
   - Wire imports, verificar TypeScript, commit + push
   - Resolver conflitos entre agentes

5. VALIDAR (curl, browser, user feedback)
   - Testar endpoints direto
   - Pedir validação visual do usuário
```

---

## Fase 1: Dashboard de Custos

### Decisão Arquitetural
O backend já tinha `GET /costs/summary`. Só precisava de frontend.

### Decomposição

```
PARALELO:
├── Agente 1: Hook (useCostSummary.ts)
│   Contexto: response shape da API, env vars, padrão dos hooks existentes
│
└── Agente 2: Componentes (3 arquivos)
    Contexto: design system, StatCard existente, props interfaces
    
SERIAL (orquestrador):
└── Integração no ColdCallDashboard.tsx
    Wire imports, add seção, commit + push
```

### Por Que Funcionou
- Hook e componentes são **independentes** — mesmo contrato de dados
- Interfaces TypeScript EXATAS passadas pros agentes
- Integração é simples (imports + JSX) — feito pelo orquestrador

### O Que Deu Errado
- **CORS** — URL do Vercel em vez do custom domain
- **Supabase key** — Railway tinha env var que bypassava o fallback
- **Error state silencioso** — `costData ? render : null` = sumia sem feedback

::: tip Lição Aprendida
Sempre adicionar error state VISÍVEL. `null` silencioso é o pior UX.
:::

---

## Fase 2: Chamadas Não Salvando

### Diagnóstico (Antes de Spawnar)

```bash
# 1. Quantos registros existem?
curl Supabase → 5 registros (todos teste)

# 2. API de custos funciona?
curl /costs/summary → funciona (5 records)

# 3. Webhook salva?
curl /debug/supabase-test → erro 400 "invalid integer 42.0"
```

### Decomposição

```
PARALELO:
├── Agente Backend: Debug webhook flow
│   DICA CRÍTICA: "Olhe pra asyncio.create_task + task.cancel()"
│
├── Agente Supabase: Verificar RLS, constraints, test insert
│
└── Agente Frontend UX: Melhorar componentes de custo
```

### A Dica que Fez Diferença

No prompt do agente backend, foi incluída uma **dica direcional**:

> **ATENÇÃO ESPECIAL:** Olhe MUITO bem pra isso no `on_client_disconnected`:
> ```python
> asyncio.create_task(_send_call_ended_webhook(session))
> await task.cancel()  # ← ISSO PODE ESTAR MATANDO O WEBHOOK TASK!
> ```

**Resultado:** O agente confirmou e fixou em 3 minutos. Sem a dica, teria perdido tempo investigando outras hipóteses.

::: warning Lição Aprendida
Quando você SUSPEITA da causa, diga pro agente. Direcionar > deixar livre.
:::

---

## Fase 3: Qualidade de Voz

### Por Que 3 Agentes de Research

Cada um com ângulo diferente:
1. **Issues/fóruns** — problemas reportados por outros
2. **Docs oficiais** — configurações recomendadas
3. **Código fonte** — o que os exemplos oficiais fazem diferente

### Convergência

Os 3 convergiram em pontos similares:
- SmartTurn agressivo demais (1.5s → 2.5s)
- Sample rate hardcoded causando double resample
- Deepgram endpointing curto pra PT-BR

**Divergências Valiosas:**
- **Agente 1** trouxe: Bug #3669 do Cartesia (flush_audio não chamado)
- **Agente 3** trouxe: Remover audio_in/out_sample_rate do PipelineParams

### Aplicação
Consolidados os 3 reports e aplicados 6 fixes de uma vez (com tag pra rollback).

::: tip Lição Aprendida
Research paralelo com ângulos diferentes > 1 agente tentando cobrir tudo.
:::

---

## Fase 4: Sistema de Retry

### Abordagem Incremental

```
Sprint 1: Sistema base (retry-cadence-system)
├── SQL tabela + triggers
├── Endpoints backend
├── Frontend básico
│
Sprint 2: Controles por lead (retry-controls-ui)
├── Toggle ON/OFF
├── Dropdown tentativas
├── Controles globais
```

### Por Que Não Spawnou Junto

Sprint 2 dependia do Sprint 1 (precisava dos endpoints pra conectar o UI).
Mas o usuário pediu os controles DURANTE o Sprint 1, então o Sprint 2 foi spawnado usando as interfaces que o Sprint 1 ia criar.

::: info Lição Aprendida
Dá pra spawnar dependências se você define o contrato antes.
:::

---

## 🎯 Padrões Reutilizáveis

### 1. Spawn Paralelo com Contrato Fixo

Define interfaces/props/response shapes **ANTES** de spawnar.
Agentes trabalham no mesmo contrato sem se conhecer.
Integração é plug-and-play.

### 2. Diagnóstico Antes de Delegar

5 min de curl/grep valem mais que 30 min de agente cego.
Sempre verificar: API responde? Banco aceita? CORS ok?

### 3. Research Triangulado

3 agentes com ângulos diferentes > 1 agente genérico.
A convergência valida. A divergência revela blind spots.

### 4. Dica Direcional no Prompt

Se você suspeita da causa, diga.
"Olhe pra X" economiza 80% do tempo do agente.
Mas deixe ele validar — pode estar errado.

### 5. Tag Antes de Deploy Arriscado

```bash
git tag pre-fix-YYYYMMDD
```
Rollback em 10 segundos se der problema.

### 6. Error State Sempre Visível

Nunca `data ? render : null`.
Sempre `error ? errorBanner : data ? render : emptyState`.

---

## 📊 Números da Sessão

| Métrica | Valor |
|---------|-------|
| Duração total | ~6h |
| Sub-agentes spawned | ~15 |
| Commits backend | ~11 |
| Commits frontend | ~4 |
| SQLs manuais | 4 |
| Docs de research | 7 |
| Bugs encontrados | 8 |
| Features entregues | 4 (custos, voice, drilldown, retry) |
| Modelo sub-agentes | Sonnet (todos) |
| Modelo orquestrador | Opus |

---

## 🔑 Meta-Insight

O valor do orquestrador (Opus) não é escrever código — é:

1. **Diagnosticar** rápido (curl, grep)
2. **Decompor** bem (paralelo vs serial)
3. **Dar contexto cirúrgico** (interfaces, dicas, design system)
4. **Integrar** o output dos agentes
5. **Validar** antes de entregar

Os sub-agentes (Sonnet) fazem o trabalho pesado de implementação.

O orquestrador faz o trabalho intelectual de direção.

---

## Próximos Passos

- [ ] Aplicar metodologia em outros projetos da AI Factory
- [ ] Documentar templates de prompts para cada tipo de sub-agente
- [ ] Criar checklist de diagnóstico antes de spawnar
- [ ] Automatizar validações pós-integração
