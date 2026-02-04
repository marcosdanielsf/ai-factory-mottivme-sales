# Como Executar as Migrations do AI Sales Squad

## Arquivos de Migration

| Arquivo | Descricao | Tamanho |
|---------|-----------|---------|
| `016_agent_templates.sql` | Tabela de templates globais | ~180 linhas |
| `017_agent_mode_config.sql` | Config de modos por agente | ~327 linhas |
| `018_seed_mode_templates.sql` | Insere 37 templates | ~1200 linhas |
| `FULL_016_017_018_ai_sales_squad.sql` | **Tudo junto** | ~1752 linhas |

## Metodo 1: Supabase Dashboard (RECOMENDADO)

### Passo 1: Abrir SQL Editor
1. Acesse: https://supabase.com/dashboard/project/bfumywvwubvernvhjehk
2. Menu lateral > **SQL Editor**
3. Clique em **+ New query**

### Passo 2: Executar
**Opcao A - Tudo de uma vez:**
1. Copie todo o conteudo de `FULL_016_017_018_ai_sales_squad.sql`
2. Cole no SQL Editor
3. Clique **Run** (Ctrl+Enter)

**Opcao B - Em partes (se der erro):**
1. Execute `016_agent_templates.sql` primeiro
2. Depois `017_agent_mode_config.sql`
3. Por ultimo `018_seed_mode_templates.sql`

### Passo 3: Verificar
Execute no SQL Editor:
```sql
-- Verificar tabela de templates
SELECT COUNT(*) as total_templates FROM agent_templates;
-- Esperado: 37

-- Verificar por categoria
SELECT category, COUNT(*) as total
FROM agent_templates
GROUP BY category
ORDER BY total DESC;

-- Verificar views criadas
SELECT * FROM mode_usage_stats LIMIT 5;
```

## Metodo 2: Via psql (se tiver senha do DB)

```bash
# Substitua YOUR_DB_PASSWORD pela senha do banco
PGPASSWORD='YOUR_DB_PASSWORD' psql \
  -h db.bfumywvwubvernvhjehk.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f migrations/FULL_016_017_018_ai_sales_squad.sql
```

## O que cada migration faz

### 016_agent_templates.sql
- Cria tabela `agent_templates`
- Biblioteca global de 37 modos
- Compartilhada entre todos os clientes

### 017_agent_mode_config.sql
- Cria tabela `agent_mode_config`
- Habilita/desabilita modos por agente
- Cria views:
  - `agent_full_config` - visao consolidada do agente
  - `mode_usage_stats` - estatisticas de uso
- Cria funcoes:
  - `toggle_agent_mode()` - liga/desliga modo
  - `build_prompts_by_mode()` - constroi prompts
  - `sync_agent_prompts_by_mode()` - sincroniza automaticamente
- Cria trigger de auto-sync

### 018_seed_mode_templates.sql
- Insere os 37 templates de modo
- Cada um com prompt completo, tools e metricas

## Resultado Esperado

```
Total templates: 37

Por categoria:
- acquisition: 7
- post_sale: 8
- recovery: 5
- management: 5
- qualification: 3
- nurture: 4
- scheduling: 2
- closing: 3
```

## Rollback (se precisar desfazer)

```sql
-- CUIDADO: Isso remove TUDO das migrations
DROP TABLE IF EXISTS agent_mode_config CASCADE;
DROP TABLE IF EXISTS agent_templates CASCADE;
DROP VIEW IF EXISTS agent_full_config CASCADE;
DROP VIEW IF EXISTS mode_usage_stats CASCADE;
DROP FUNCTION IF EXISTS toggle_agent_mode CASCADE;
DROP FUNCTION IF EXISTS build_prompts_by_mode CASCADE;
DROP FUNCTION IF EXISTS sync_agent_prompts_by_mode CASCADE;
DROP FUNCTION IF EXISTS get_agent_active_modes CASCADE;
DROP FUNCTION IF EXISTS get_template_by_mode CASCADE;
DROP FUNCTION IF EXISTS list_templates_by_category CASCADE;
```
