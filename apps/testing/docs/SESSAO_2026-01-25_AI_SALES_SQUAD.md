# Sessao 2026-01-25 - AI Sales Squad & QA Agent Tester

## Resumo do que foi feito

### 1. MIGRATIONS SQL - AI Sales Squad (37 Modos)

**Arquivos criados:**
- `migrations/016_agent_templates.sql` - Tabela de templates globais
- `migrations/017_agent_mode_config.sql` - Config de modos por agente
- `migrations/018_seed_mode_templates.sql` - 37 templates inseridos
- `migrations/FULL_016_017_018_ai_sales_squad.sql` - Arquivo combinado
- `migrations/README_EXECUTAR.md` - Instrucoes de execucao

**Status:** ✅ Executado no Supabase (37 templates criados)

**Arquitetura:**
```
ERRADO: 37 agentes separados por cliente
CERTO:  1 agente por cliente com 37 modos em prompts_by_mode
```

**Tabelas criadas:**
| Tabela | Funcao |
|--------|--------|
| `agent_templates` | 37 modos globais (biblioteca) |
| `agent_mode_config` | Habilita/desabilita modos por agente |

**Funcoes criadas:**
- `toggle_agent_mode(agent_id, mode_name, enabled)` - Liga/desliga modo
- `get_agent_active_modes(agent_id)` - Lista modos ativos
- `sync_agent_prompts_by_mode(agent_id)` - Sincroniza automaticamente

**Views criadas:**
- `agent_full_config` - Visao consolidada do agente
- `mode_usage_stats` - Estatisticas de uso

---

### 2. SKILL: agent-mode-manager

**Arquivo:** `~/.claude/skills/agent-mode-manager.md`

**Keywords para carregamento automatico:**
- modo, mode, toggle_mode, habilitar modo, agent_mode_config, agent_templates

**Comandos principais:**
```sql
-- Habilitar modo
SELECT toggle_agent_mode('UUID', 'sdr_inbound', true);

-- Ver modos ativos
SELECT * FROM get_agent_active_modes('UUID');

-- Listar templates
SELECT * FROM list_templates_by_category();
```

**CLAUDE.md atualizado** com nova keyword.

---

### 3. QA AGENT TESTER - Prompt Atualizado

**Arquivo:** `prompts/qa-agent-tester.md`

**Mudancas principais:**

1. **Identificacao por TIPO_LEAD** (novo campo GHL)
   - `paciente` → Simula paciente interessado
   - `medico_mentoria` → Simula medico frio (social selling)
   - `empresario` → Simula empresario
   - `investidor` → Simula investidor

2. **Social Selling** para Dr. Alberto, Dra. Eline, Dra. Gabriella (mentoria)
   - Lead FRIO, foi abordado, NAO esta interessado
   - Script de resistencia inicial → curiosidade → dor → objecoes

3. **Dra. Gabriella com 2 perfis:**
   - `TIPO_LEAD: paciente` → Clinica (paciente Luciana)
   - `TIPO_LEAD: medico_mentoria` → Mentoria (Dra. Juliana, social selling)

4. **Identificacao pelo contexto:**
```
<contexto_conversa>
LEAD: Dra. Gabriella Rossmann
TIPO_LEAD: medico_mentoria  ← CAMPO NOVO
</contexto_conversa>
```

**Arquivos relacionados:**
- `prompts/qa-agent-tester.md` - Prompt principal
- `prompts/qa-agent-tester-CALL-TEMPLATE.md` - Template de chamada n8n
- `scripts/criar-campo-tipo-lead-ghl.sh` - Script para criar campo no GHL

---

### 4. CAMPO GHL A CRIAR

| Config | Valor |
|--------|-------|
| **Nome** | Tipo de Lead |
| **Tipo** | Lista suspensa (unica) |
| **Opcoes** | paciente, medico_mentoria, empresario, investidor |

---

## Proximos passos

1. [ ] Criar campo "Tipo de Lead" no GHL (via API ou manual)
2. [ ] Passar TIPO_LEAD no webhook para o QA Agent
3. [ ] Testar QA Agent com diferentes perfis
4. [ ] Habilitar modos para agentes existentes via `toggle_agent_mode()`

---

## Arquivos modificados/criados nesta sessao

```
ai-factory-agents/
├── migrations/
│   ├── 016_agent_templates.sql ✅
│   ├── 017_agent_mode_config.sql ✅
│   ├── 018_seed_mode_templates.sql ✅
│   ├── FULL_016_017_018_ai_sales_squad.sql ✅
│   └── README_EXECUTAR.md ✅
├── prompts/
│   ├── qa-agent-tester.md ✅ (atualizado)
│   └── qa-agent-tester-CALL-TEMPLATE.md ✅
├── scripts/
│   └── criar-campo-tipo-lead-ghl.sh ✅
└── docs/
    ├── AI-SALES-SQUAD.md (v2.0)
    └── SESSAO_2026-01-25_AI_SALES_SQUAD.md ✅ (este arquivo)

~/.claude/
└── skills/
    └── agent-mode-manager.md ✅
```

---

*Sessao finalizada em 2026-01-25*
