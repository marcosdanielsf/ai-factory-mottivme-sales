# Sessao 2026-01-25: Agent Briefer Wizard

> Sistema para criar agentes SDR via WhatsApp

---

## Resumo

Criamos um fluxo completo onde um "Agent Briefer" coleta briefing via WhatsApp em 5 fases e envia para o Agent Creator (workflow 17) que gera SQL e deploya no Supabase.

---

## Arquivos Criados

| Arquivo | Descricao | Status |
|---------|-----------|--------|
| `migrations/019_agent_briefing_schema.sql` | Schema + funcoes RPC | Executado |
| `workflows/1. core/18-WhatsApp-Agent-Wizard.json` | Workflow n8n (v2 corrigido) | Pronto para importar |
| `prompts/agent-briefer-wizard.md` | Documentacao dos prompts | Completo |
| `migrations/run_019_migration.js` | Script para rodar migration | Backup |

---

## Decisoes Tecnicas

| Decisao | Opcao Escolhida |
|---------|-----------------|
| Trigger | Keyword ("criar agente", "/wizard") |
| Fases | 5 simplificadas (~8 perguntas) |
| Timeout | 24 horas |
| Quem pode usar | Qualquer contato GHL |

---

## Fases do Briefing

1. **Identificacao** - Nome do negocio, vertical
2. **Location** - Location ID do GHL
3. **Modos** - Quais funcoes (SDR, scheduler, followup, etc)
4. **Personalidade** - Tom de voz, uso de emojis
5. **Confirmacao** - Revisar e confirmar criacao

---

## Funcoes Supabase (Testadas OK)

```sql
-- Criar/buscar sessao
SELECT get_or_create_briefing_session('loc123', 'contact456');

-- Atualizar fase
SELECT update_briefing_phase('session-uuid', 2, 'location', '{"location_id": "abc123"}');

-- Finalizar sessao
SELECT finalize_briefing_session('session-uuid', 'agent-version-uuid', 180);

-- Logar mensagem
SELECT log_briefing_message('session-uuid', 'inbound', 'mensagem do usuario');

-- Abandonar sessoes antigas (24h)
SELECT abandon_stale_briefings();
```

---

## Correcao Importante

**Problema:** Groq Chat Model nodes estavam sendo usados diretamente no fluxo (mostravam erro).

**Solucao:** Conectar Chat Model nodes aos AI Agent nodes via conexao `ai_languageModel`:

```json
{
  "Groq Fase 1": {
    "ai_languageModel": [[{
      "node": "4.1 Agent Fase 1",
      "type": "ai_languageModel",
      "index": 0
    }]]
  }
}
```

---

## Proximos Passos

- [ ] Importar workflow v2 corrigido no n8n
- [ ] Configurar webhook GHL -> `/webhook/agent-wizard`
- [ ] Setar env vars (GHL_API_KEY, N8N_WEBHOOK_URL)
- [ ] Testar fluxo E2E com mensagem WhatsApp
- [ ] Conectar saida ao workflow 17-Agent-Creator

---

## Para Retomar

```
/ms search "agent-briefer"
```

Ou diga: **"continuar agent briefer wizard"**
