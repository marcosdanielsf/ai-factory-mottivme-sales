#!/usr/bin/env python3
"""
Gera V8 do Follow Up Eterno com integração FUU Outbound Instagram
Baseado no arquivo CORRETO: workflows/1. core/0.2 Fluxo de Follow Up Eterno
"""
import json
import copy
import uuid
from datetime import datetime

# Paths
V7_PATH = '../workflows/1. core/0.2 Fluxo de Follow Up Eterno'
V8_PATH = '../workflows/1. core/0.3 Fluxo de Follow Up Eterno - V8 FUU Outbound.json'

# Ler V7
with open(V7_PATH, 'r') as f:
    workflow = json.load(f)

print(f"✅ Lido V7 com {len(workflow.get('nodes', []))} nodes")
print(f"   Nome original: {workflow.get('name')}")

# =============================================================================
# MODIFICAÇÃO 1: Query "Buscar Config Agente" - follow_up_type dinâmico
# =============================================================================
for node in workflow.get('nodes', []):
    if node.get('name') == 'Buscar Config Agente':
        # Nova query com follow_up_type dinâmico baseado na source
        new_query = """-- V8: follow_up_type dinâmico (inbound vs outbound)
SELECT
  agent_name,
  company_name,
  company_description,
  agent_role,
  tone,
  use_slang,
  use_emoji,
  max_emoji_per_message,
  max_message_lines,
  offer_value_attempt,
  breakup_attempt,
  custom_prompts,
  message_examples
FROM fuu_agent_configs
WHERE (
    location_id = '{{ $('Informacoes Relevantes - FUP').item.json.location_id }}'
    OR location_id = 'default'
    OR location_id = 'DEFAULT_CONFIG'
  )
  AND follow_up_type = COALESCE(
      NULLIF('{{ $('Sem Resposta').item.json.follow_up_type || '' }}', ''),
      CASE
          WHEN LOWER(COALESCE('{{ $('Sem Resposta').item.json.source }}', 'whatsapp')) IN ('instagram', 'instagram_dm')
               AND COALESCE({{ $('Sem Resposta').item.json.is_outbound }}, false) = true
          THEN 'sdr_outbound_instagram'
          ELSE 'sdr_inbound'
      END
  )
  AND is_active = true
ORDER BY
  CASE
    WHEN location_id = '{{ $('Informacoes Relevantes - FUP').item.json.location_id }}' THEN 0
    WHEN location_id = 'default' THEN 1
    ELSE 2
  END
LIMIT 1;"""

        node['parameters']['query'] = new_query
        print("✅ Modificado: Buscar Config Agente (follow_up_type dinâmico)")

# =============================================================================
# MODIFICAÇÃO 2: Query "Sem Resposta" - ADICIONAR suporte a fuu_queue
# =============================================================================
for node in workflow.get('nodes', []):
    if node.get('name') == 'Sem Resposta':
        # Nova query que une n8n_schedule_tracking COM fuu_queue
        new_query = """-- V8: Unificado inbound (n8n_schedule_tracking) + outbound (fuu_queue)
WITH ultima_msg AS (
  SELECT DISTINCT ON (session_id)
    session_id,
    COALESCE(message->>'type', 'unknown') as last_sender,
    COALESCE(message->>'content', '') as last_content,
    created_at as last_message_at
  FROM n8n_historico_mensagens
  WHERE message->>'content' IS NOT NULL
    AND message->>'content' != ''
  ORDER BY session_id, created_at DESC
),
-- INBOUND: leads que vieram até nós (tabela original)
inbound_leads AS (
  SELECT
    t.unique_id,
    t.location_name,
    COALESCE(t.source, 'whatsapp') as source,
    COALESCE(t.follow_up_count, 0) as follow_up_count,
    t.api_key,
    t.location_id,
    c.tentativa,
    c.intervalo_minutos,
    COALESCE(um.last_sender, 'unknown') as last_sender,
    COALESCE(um.last_content, '') as last_content,
    um.last_message_at as ultima_msg,
    'sdr_inbound' as follow_up_type,
    false as is_outbound,
    NULL::uuid as queue_id
  FROM n8n_schedule_tracking t
  JOIN follow_up_cadencias c
    ON LOWER(COALESCE(t.source, 'whatsapp')) = c.canal
    AND COALESCE(t.follow_up_count, 0) + 1 = c.tentativa
  LEFT JOIN ultima_msg um ON um.session_id = t.unique_id
  WHERE t.ativo = true
    AND t.location_id IS NOT NULL
    AND t.api_key IS NOT NULL
    AND (
      (um.last_sender = 'ai' AND um.last_message_at < NOW() - (c.intervalo_minutos || ' minutes')::INTERVAL)
      OR
      (um.session_id IS NULL AND t.follow_up_count = 0)
    )
),
-- OUTBOUND: leads que estamos prospectando (fuu_queue)
outbound_leads AS (
  SELECT
    fq.contact_id as unique_id,
    COALESCE(fq.contact_name, 'Lead') as location_name,
    'instagram' as source,
    fq.current_attempt as follow_up_count,
    COALESCE(
      (SELECT api_key FROM n8n_schedule_tracking WHERE location_id = fq.location_id LIMIT 1),
      ''
    ) as api_key,
    fq.location_id,
    fq.current_attempt + 1 as tentativa,
    COALESCE(
      (SELECT interval_minutes FROM fuu_cadences
       WHERE follow_up_type = fq.follow_up_type
         AND attempt_number = fq.current_attempt + 1
       LIMIT 1),
      60
    ) as intervalo_minutos,
    'ai' as last_sender,
    '' as last_content,
    fq.scheduled_at as ultima_msg,
    fq.follow_up_type,
    true as is_outbound,
    fq.id as queue_id
  FROM fuu_queue fq
  WHERE fq.status IN ('pending', 'in_progress')
    AND fq.scheduled_at <= NOW()
    AND fq.follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation')
)
-- União dos dois tipos
SELECT * FROM inbound_leads
UNION ALL
SELECT * FROM outbound_leads
ORDER BY ultima_msg ASC NULLS LAST
LIMIT 50;"""

        node['parameters']['query'] = new_query
        print("✅ Modificado: Sem Resposta (UNION inbound + outbound)")

# =============================================================================
# NOVO NODE: FUU Avançar Tentativa (após enviar mensagem)
# =============================================================================
# Encontrar posição do node "Atualizar Follow-up Count"
update_count_pos = [0, 0]
for node in workflow.get('nodes', []):
    if node.get('name') == 'Atualizar Follow-up Count':
        update_count_pos = node.get('position', [0, 0])
        break

fuu_advance_node = {
    "parameters": {
        "operation": "executeQuery",
        "query": """-- V8: Avançar tentativa FUU para outbound
-- Só executa se for outbound (queue_id não nulo)
DO $$
BEGIN
  IF '{{ $('Sem Resposta').item.json.queue_id || '' }}' != '' THEN
    PERFORM fuu_advance_attempt(
      p_queue_id := '{{ $('Sem Resposta').item.json.queue_id }}'::uuid,
      p_result := 'sent'
    );
  END IF;
END $$;""",
        "options": {}
    },
    "id": str(uuid.uuid4()),
    "name": "FUU: Avançar Tentativa Outbound",
    "type": "n8n-nodes-base.postgres",
    "typeVersion": 2.5,
    "position": [update_count_pos[0] + 250, update_count_pos[1]],
    "credentials": {
        "postgres": {
            "id": "w2mBaRwhZ3tM4FUw",
            "name": "Postgres Marcos Daniels."
        }
    },
    "notes": "Avança tentativa na fuu_queue para leads outbound",
    "notesInFlow": False
}

workflow['nodes'].append(fuu_advance_node)
print("✅ Adicionado: FUU: Avançar Tentativa Outbound")

# =============================================================================
# NOVO NODE: FUU Marcar Respondido (quando lead responde - vai em outro fluxo)
# =============================================================================
fuu_mark_responded_node = {
    "parameters": {
        "operation": "executeQuery",
        "query": """-- V8: Marcar como respondido quando lead responde
-- Use este node no webhook de resposta do GHL
SELECT fuu_mark_responded(
    p_contact_id := '{{ $json.contact_id }}',
    p_location_id := '{{ $json.location_id }}',
    p_follow_up_type := NULL  -- cancela todos os follow-ups ativos
) as cancelled_count;""",
        "options": {}
    },
    "id": str(uuid.uuid4()),
    "name": "FUU: Marcar Respondido (Webhook)",
    "type": "n8n-nodes-base.postgres",
    "typeVersion": 2.5,
    "position": [update_count_pos[0] + 250, update_count_pos[1] + 200],
    "credentials": {
        "postgres": {
            "id": "w2mBaRwhZ3tM4FUw",
            "name": "Postgres Marcos Daniels."
        }
    },
    "notes": "Cancela follow-ups quando lead responde (usar no webhook)",
    "notesInFlow": False
}

workflow['nodes'].append(fuu_mark_responded_node)
print("✅ Adicionado: FUU: Marcar Respondido (Webhook)")

# =============================================================================
# NOVO NODE: FUU Agendar Follow-up (para novos leads outbound)
# =============================================================================
fuu_schedule_node = {
    "parameters": {
        "operation": "executeQuery",
        "query": """-- V8: Agendar novo follow-up outbound
-- Use este node quando receber novo lead de Instagram
SELECT fuu_schedule_followup(
    p_contact_id := '{{ $json.contact_id }}',
    p_location_id := '{{ $json.location_id }}',
    p_follow_up_type := 'sdr_outbound_instagram',
    p_phone := '{{ $json.phone || '' }}',
    p_email := '{{ $json.email || '' }}',
    p_contact_name := '{{ $json.contact_name || $json.name || '' }}',
    p_context := '{{ JSON.stringify({
        source: "instagram_dm",
        username: $json.instagram_username || "",
        first_message: $json.first_message || ""
    }) }}'::jsonb
) as queue_id;""",
        "options": {}
    },
    "id": str(uuid.uuid4()),
    "name": "FUU: Agendar Outbound (Novo Lead)",
    "type": "n8n-nodes-base.postgres",
    "typeVersion": 2.5,
    "position": [update_count_pos[0] + 250, update_count_pos[1] + 400],
    "credentials": {
        "postgres": {
            "id": "w2mBaRwhZ3tM4FUw",
            "name": "Postgres Marcos Daniels."
        }
    },
    "notes": "Agenda novo lead outbound na fuu_queue",
    "notesInFlow": False
}

workflow['nodes'].append(fuu_schedule_node)
print("✅ Adicionado: FUU: Agendar Outbound (Novo Lead)")

# =============================================================================
# Atualizar notas do workflow
# =============================================================================
for node in workflow.get('nodes', []):
    if node.get('type') == 'n8n-nodes-base.stickyNote' and 'INSTRUCOES' in str(node.get('parameters', {}).get('content', '')):
        old_content = node['parameters'].get('content', '')
        new_header = f"""# Workflow Follow Up Eterno - V8 FUU OUTBOUND

## NOVIDADES V8 (FUU Outbound):
- ✅ Suporte a follow_up_type dinâmico (inbound vs outbound)
- ✅ Query "Sem Resposta" unifica n8n_schedule_tracking + fuu_queue
- ✅ Buscar Config Agente detecta automaticamente tipo
- ✅ Nodes FUU: Avançar Tentativa, Marcar Respondido, Agendar
- ✅ Cadências outbound Instagram: 15min, 5h, 13h, 5h
- ✅ Reativação: 7d, 14d, 28d

## Tipos de Follow-up:
| Tipo | Descrição |
|------|-----------|
| sdr_inbound | Leads que entraram em contato |
| sdr_outbound_instagram | Prospecção ativa Instagram (24h) |
| sdr_outbound_instagram_reactivation | Reativação após 24h |

## Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M')}

---

"""
        node['parameters']['content'] = new_header + old_content
        print("✅ Atualizado: Sticky Note com instruções V8")
        break

# =============================================================================
# Atualizar metadados do workflow
# =============================================================================
workflow['name'] = '[ GHL ] Follow Up Eterno - V8 FUU Outbound'

# =============================================================================
# Adicionar conexão do FUU Avançar Tentativa após Atualizar Follow-up Count
# =============================================================================
# Encontrar o ID do node "Atualizar Follow-up Count"
update_count_id = None
fuu_advance_id = None

for node in workflow.get('nodes', []):
    if node.get('name') == 'Atualizar Follow-up Count':
        update_count_id = node.get('id')
    if node.get('name') == 'FUU: Avançar Tentativa Outbound':
        fuu_advance_id = node.get('id')

if update_count_id and fuu_advance_id:
    # Adicionar conexão
    if 'Atualizar Follow-up Count' not in workflow.get('connections', {}):
        workflow['connections']['Atualizar Follow-up Count'] = {'main': [[]]}

    workflow['connections']['Atualizar Follow-up Count']['main'][0].append({
        'node': 'FUU: Avançar Tentativa Outbound',
        'type': 'main',
        'index': 0
    })
    print("✅ Conexão adicionada: Atualizar Follow-up Count → FUU: Avançar Tentativa")

# =============================================================================
# Salvar V8
# =============================================================================
with open(V8_PATH, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"✅ Workflow V8 salvo em: {V8_PATH}")
print(f"   Total nodes: {len(workflow.get('nodes', []))}")
print(f"   Nome: {workflow.get('name')}")
print(f"{'='*60}")

# Verificar
print("\n=== Nodes FUU adicionados ===")
for node in workflow.get('nodes', []):
    if 'FUU' in node.get('name', ''):
        print(f"  ✓ {node.get('name')}")
