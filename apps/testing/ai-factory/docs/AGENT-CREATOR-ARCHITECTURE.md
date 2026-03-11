# AGENT CREATOR - Arquitetura do Meta-Agente

> **Data:** 2026-01-24
> **Versão:** 1.0
> **Status:** Especificação Completa
> **Gerado por:** Orquestração de 3 Subagentes

---

## 1. VISÃO GERAL

O **Agent Creator** é um meta-agente capaz de criar outros agentes SDR personalizados para diferentes clientes/verticais, usando Isabella Amare v7.0.7 como gold standard.

### Automação Atual vs Meta

| Aspecto | Atual | Meta |
|---------|-------|------|
| Auditoria | Manual | Automática |
| Score | LLM calcula | Trigger SQL |
| Correção | 3 sprints manuais | Auto-fix loop |
| Deploy | REST API manual | Workflow n8n |
| **Automação** | ~40% | 100% |

---

## 2. ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT CREATOR v1.0                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   BRIEFING   │───▶│   BUILDER    │───▶│  VALIDATOR   │───▶│ DEPLOYER  │ │
│  │   Intake     │    │   Core       │    │  & Scorer    │    │ & Version │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│         │                   │                   │                  │        │
│         ▼                   ▼                   ▼                  ▼        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        SHARED MEMORY (RAG)                            │  │
│  │  Templates │ Rules │ Examples │ Checklists │ Version DB               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       FEEDBACK LOOP                                   │  │
│  │         Score < 70% ──▶ AUTO-CORRECT ──▶ Re-validate (max 3x)        │  │
│  │         Score >= 70% ──▶ DEPLOY ──▶ Supabase                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. FLUXO DE CRIAÇÃO

```
FASE 1: INTAKE (Briefing)
├── Nome cliente/empresa
├── Vertical/nicho
├── Produto + valores
├── Tom de voz
├── Endereços/unidades
├── Ferramentas (pagamento, calendário)
├── Regras especiais
├── Objeções comuns
└── Proibições

FASE 2: BUILDER (Geração)
├── system_prompt (CRITICS)
├── tools_config
├── compliance_rules
├── personality_config
├── business_config
├── qualification_config
├── prompts_by_mode
└── hyperpersonalization

FASE 3: VALIDATOR (Score)
├── Checklist 200 pontos
├── Score mínimo: 70%
├── Auto-fix se < 70%
└── Max 3 loops

FASE 4: DEPLOYER
├── Gerar SQL/REST
├── Incrementar version
├── Deploy Supabase
└── Criar changelog
```

---

## 4. SCORECARD (200 pontos)

| Seção | Pontos | Critérios |
|-------|--------|-----------|
| Role | 20 | Nome, cargo, empresa, tom, propósito |
| Constraints | 30 | Formatação, proibições, limites |
| Inputs | 20 | 6 blocos XML documentados |
| Tools | 30 | Categorias, parâmetros, max_chamadas |
| Instructions | 40 | Fluxo completo (min 10 fases) |
| Conclusions | 20 | Formato saída, anti-patterns |
| Solutions | 20 | Min 8 cenários |
| JSONBs | 20 | Todos preenchidos, sem nulls |

**Mínimo aprovação: 140/200 (70%)**

---

## 5. CHECKLIST PRODUCTION-READY

### CRÍTICO (bloqueia deploy)
- [ ] system_prompt > 500 chars
- [ ] compliance_rules.proibicoes >= 3 itens
- [ ] tools_config com pelo menos 1 tool
- [ ] qualification_config.score_minimo definido
- [ ] business_config.empresa.nome preenchido
- [ ] version segue semver (X.Y.Z)

### IMPORTANTE
- [ ] personality_config.regra_apelidos definido
- [ ] hyperpersonalization com setor/tipo_agente
- [ ] prompts_by_mode com modo 'sdr_inbound'
- [ ] compliance_rules.escalacao.triggers definidos
- [ ] business_config.objecoes >= 3

### RECOMENDADO
- [ ] validation_score >= 80
- [ ] total_test_runs >= 5
- [ ] prompts_by_mode >= 3 modos
- [ ] qualification_config.fases_venda definido

---

## 6. JSON SCHEMAS (Validação)

### personality_config
```json
{
  "required": ["tom_voz", "nivel_formalidade"],
  "properties": {
    "tom_voz": {"enum": ["acolhedor", "profissional", "direto", "assertivo"]},
    "nivel_formalidade": {"type": "integer", "minimum": 1, "maximum": 10},
    "uso_emojis": {"type": "boolean"},
    "regra_apelidos": {
      "properties": {
        "politica": {"enum": ["NUNCA_USAR", "PERMITIDO", "MODERADO"]},
        "proibidos": {"type": "array"}
      }
    }
  }
}
```

### business_config
```json
{
  "required": ["nome_negocio"],
  "properties": {
    "nome_negocio": {"type": "string"},
    "cnpj": {"type": "string", "pattern": "^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$"},
    "ceps": {"type": "array"},
    "precos": {
      "properties": {
        "parcelamento": {"properties": {"max_parcelas": {"type": "integer"}}}
      }
    }
  }
}
```

### qualification_config
```json
{
  "required": ["bant"],
  "properties": {
    "bant": {
      "properties": {
        "budget": {"properties": {"peso": {"type": "number"}, "indicadores_positivos": {"type": "array"}}},
        "authority": {"properties": {"peso": {"type": "number"}}},
        "need": {"properties": {"peso": {"type": "number"}}},
        "timeline": {"properties": {"peso": {"type": "number"}}}
      }
    },
    "fases_venda": {"type": "object"},
    "threshold_qualificado": {"type": "number", "minimum": 0, "maximum": 1}
  }
}
```

### compliance_rules
```json
{
  "required": ["proibicoes"],
  "properties": {
    "proibicoes": {"type": "array", "minItems": 3},
    "anti_alucinacao": {"type": "array"},
    "objecoes_mapeadas": {"type": "object"},
    "gatilhos_escalacao": {"type": "array"}
  }
}
```

---

## 7. FERRAMENTAS DO META-AGENTE

| Ferramenta | Função | Implementação |
|------------|--------|---------------|
| `validate_agent` | Valida config (200pts) | n8n webhook |
| `search_templates` | Busca template por vertical | Supabase RAG |
| `generate_jsonb` | Gera JSONB formatado | LLM + schema |
| `deploy_agent` | INSERT Supabase | REST API |
| `rollback_version` | Reverte versão | UPDATE SQL |
| `compare_versions` | Diff entre versões | JSON diff |

---

## 8. CENÁRIOS DE CRIAÇÃO

| Vertical | Base | Adaptações |
|----------|------|------------|
| Clínica Médica | Isabella v7.0.7 | Endereços, valores, especialidade |
| Imobiliária | Template genérico | Visitas, bairros, faixas preço |
| Educação/Cursos | Template genérico | Matrícula, desconto lote |
| SaaS B2B | Template genérico | Demo, tamanho empresa |
| Clínica Estética | Isabella v7.0.7 | Procedimentos, antes/depois |
| Serviços Profissionais | Template genérico | Reunião inicial, formalidade |

---

## 9. MÉTRICAS DE SUCESSO

### Agent Creator
| Métrica | Target |
|---------|--------|
| Deploy primeira tentativa | > 70% |
| Tempo médio criação | < 15min |
| Score médio agentes | > 80% |
| Taxa rollback | < 10% |

### Agentes Criados
| Métrica | Target |
|---------|--------|
| Taxa conversão | > 15% |
| Score conversa (AI Judge) | > 75% |
| Taxa escalação | < 5% |
| NPS cliente | > 8 |

---

## 10. PRÓXIMOS PASSOS

### Opção 1: Workflow n8n (Recomendado)
- Criar workflow "Agent Creator"
- Nodes: Briefing → Builder → Validator → Deployer
- Integração Supabase + RAG

### Opção 2: Expandir Skill Claude
- Atualizar `~/.claude/skills/agent-creator-sdr.md`
- Incluir fluxo completo + ferramentas
- Execução via `/sl agent-creator-sdr`

### Opção 3: API Python (Railway)
- Endpoint: POST /agent-creator/create
- Body: { briefing }
- Response: { agent_id, sql, score }

---

## REFERÊNCIAS

- **Gold Standard:** Isabella Amare v7.0.7
- **Tabela:** agent_versions (Supabase)
- **Framework:** CRITICS
- **SQLs Exemplo:** `~/Projects/ai-factory/sql/`
