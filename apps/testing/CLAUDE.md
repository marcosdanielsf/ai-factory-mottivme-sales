# AI Factory Agents - Instruções para Claude

> **IMPORTANTE**: Leia primeiro o [INDEX.md](./INDEX.md) para entender a estrutura do projeto.

## Diretório do Projeto
```
/Users/marcosdaniels/Projects/mottivme/ai-factory-agents
```

## Navegação Rápida

| Preciso de... | Onde está |
|---------------|-----------|
| Mapa completo do projeto | [INDEX.md](./INDEX.md) |
| Fluxos n8n | `SDR Julia Amare - Corrigido.json`, `[ GHL ] Follow Up Eterno - CORRIGIDO.json` |
| Sistema de Follow-up | [docs/ARQUITETURA_FOLLOW_UP_UNIVERSAL.md](./docs/ARQUITETURA_FOLLOW_UP_UNIVERSAL.md) |
| Prompts da Isabella | Pasta `prompts/` |
| Migrations SQL | Pasta `migrations/` |

## Regras para Claude

### 1. Sempre informar comando completo
```bash
cd /Users/marcosdaniels/Projects/mottivme/ai-factory-agents
python nome_do_arquivo.py
```

### 2. Variáveis de ambiente
```bash
export GROQ_API_KEY="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"
export SUPABASE_URL="https://bfumywvwubvernvhjehk.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"
```

### 3. Scripts principais
| Script | Descrição | Comando |
|--------|-----------|---------|
| `run_isabella_tests.py` | Testes E2E Isabella | `python run_isabella_tests.py --priority` |
| `run_groq_e2e_tests.py` | Testes E2E Groq | `python run_groq_e2e_tests.py --quick` |

## Contexto do Projeto

### O que é isso?
Sistema de automação de vendas e atendimento usando:
- **GHL (GoHighLevel)** - CRM com contatos e conversas
- **n8n** - Workflows de automação
- **Supabase** - Banco de dados e histórico
- **Gemini/Groq** - IA para respostas

### Arquivos Principais

#### Fluxos n8n
- `SDR Julia Amare - Corrigido.json` - Fluxo principal de atendimento
- `[ GHL ] Follow Up Eterno - CORRIGIDO.json` - Follow-up automático

#### Documentação
- `INDEX.md` - Mapa de navegação do projeto
- `docs/ARQUITETURA_FOLLOW_UP_UNIVERSAL.md` - Sistema FUU (futuro)
- `docs/INTEGRACAO_FOLLOW_UP_ETERNO.md` - Follow-up v2.5 (atual)

### Tabelas Supabase Principais

| Tabela | Função |
|--------|--------|
| `n8n_schedule_tracking` | Tracking de leads ativos |
| `n8n_historico_mensagens` | Histórico de conversas |
| `follow_up_cadencias` | Intervalos de follow-up |
| `socialfy_ai_agents` | Configuração dos agentes |

## Repositórios Relacionados

| Repo | Path | Função |
|------|------|--------|
| **ai-factory-agents** (ESTE) | `~/Projects/mottivme/ai-factory-agents` | Fluxos, prompts, migrations |
| **AgenticOSKevsAcademy** | `~/Projects/mottivme/AgenticOSKevsAcademy` | APIs Python (Railway) |
| **socialfy-platform** | `~/Projects/mottivme/socialfy-platform` | Frontend CRM |

## Idioma
Sempre responder em **português brasileiro**.

---

*Ver [INDEX.md](./INDEX.md) para documentação completa.*
