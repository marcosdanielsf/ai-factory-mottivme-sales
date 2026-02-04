#!/usr/bin/env python3
"""
Gera V7 do Follow Up Eterno com integração FUU Outbound Instagram
"""
import json
import copy
from datetime import datetime

# Paths
V6_PATH = '../[ GHL ] Follow Up Eterno - V6 Multi-Channel - CORRIGIDO.json'
V7_PATH = '../[ GHL ] Follow Up Eterno - V7 FUU Outbound.json'

# Ler V6
with open(V6_PATH, 'r') as f:
    workflow = json.load(f)

print(f"Lido V6 com {len(workflow.get('nodes', []))} nodes")

# =============================================================================
# MODIFICAÇÃO 1: Query "Buscar Config Agente" - follow_up_type dinâmico
# =============================================================================
for node in workflow.get('nodes', []):
    if node.get('name') == 'Buscar Config Agente':
        old_query = node.get('parameters', {}).get('query', '')

        # Nova query com follow_up_type dinâmico
        new_query = """SELECT
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
WHERE (location_id = '{{ $('Informacoes Relevantes - FUP').first().json.location_id }}' OR location_id = 'default' OR location_id = 'DEFAULT_CONFIG')
  AND follow_up_type = COALESCE(
      NULLIF('{{ $('Sem Resposta').first().json.follow_up_type }}', ''),
      CASE
          WHEN LOWER(COALESCE('{{ $('Sem Resposta').first().json.source }}', '')) IN ('instagram', 'instagram_dm') THEN 'sdr_outbound_instagram'
          ELSE 'sdr_inbound'
      END
  )
  AND is_active = true
ORDER BY CASE WHEN location_id = 'default' OR location_id = 'DEFAULT_CONFIG' THEN 1 ELSE 0 END
LIMIT 1;"""

        node['parameters']['query'] = new_query
        print("✅ Modificado: Buscar Config Agente")

# =============================================================================
# MODIFICAÇÃO 2: Query "Buscar Cadência Action Type" - adicionar follow_up_type
# =============================================================================
for node in workflow.get('nodes', []):
    if node.get('name') == 'Buscar Cadência Action Type':

        new_query = """SELECT
  id,
  action_type,
  fallback_action,
  is_enabled,
  requires_qualification,
  min_engagement_score,
  allowed_stages,
  qualification_tags,
  tag_to_add,
  webhook_url
FROM fuu_cadences
WHERE (location_id = '{{ $('Formatacao').first().json.data?.location_id || $('Sem Resposta').first().json.location_id }}' OR location_id = 'default' OR location_id = 'DEFAULT_CONFIG')
  AND channel = LOWER('{{ $('Sem Resposta').first().json.source || 'whatsapp' }}')
  AND follow_up_type = COALESCE(
      NULLIF('{{ $('Sem Resposta').first().json.follow_up_type }}', ''),
      CASE
          WHEN LOWER(COALESCE('{{ $('Sem Resposta').first().json.source }}', '')) IN ('instagram', 'instagram_dm') THEN 'sdr_outbound_instagram'
          ELSE 'sdr_inbound'
      END
  )
  AND attempt_number = {{ ($('Sem Resposta').first().json.follow_up_count || 0) + 1 }}
  AND is_active = true
ORDER BY CASE WHEN location_id = 'default' OR location_id = 'DEFAULT_CONFIG' THEN 1 ELSE 0 END
LIMIT 1;"""

        node['parameters']['query'] = new_query
        print("✅ Modificado: Buscar Cadência Action Type")

# =============================================================================
# NOVO NODE: Buscar Pendentes FUU Outbound
# =============================================================================
# Encontrar posição do node "Sem Resposta" para colocar depois
sem_resposta_pos = None
for node in workflow.get('nodes', []):
    if node.get('name') == 'Sem Resposta':
        sem_resposta_pos = node.get('position', [0, 0])
        break

# Criar novo node
fuu_get_pending_node = {
    "parameters": {
        "operation": "executeQuery",
        "query": """-- Buscar follow-ups pendentes do FUU (outbound Instagram)
SELECT
    id as queue_id,
    contact_id,
    location_id,
    follow_up_type,
    phone,
    email,
    contact_name,
    context,
    current_attempt,
    max_attempts,
    scheduled_at,
    'instagram_dm' as source
FROM fuu_queue
WHERE status IN ('pending', 'in_progress')
  AND scheduled_at <= NOW()
  AND follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation')
ORDER BY scheduled_at ASC
LIMIT 20;""",
        "options": {}
    },
    "id": "fuu-get-pending-outbound",
    "name": "FUU: Buscar Pendentes Outbound",
    "type": "n8n-nodes-base.postgres",
    "typeVersion": 2.5,
    "position": [sem_resposta_pos[0] + 200 if sem_resposta_pos else 500, sem_resposta_pos[1] + 150 if sem_resposta_pos else 300],
    "credentials": {
        "postgres": {
            "id": "supabase_postgres",
            "name": "Supabase Postgres"
        }
    },
    "notes": "Busca follow-ups de outbound Instagram pendentes na fila FUU"
}

workflow['nodes'].append(fuu_get_pending_node)
print("✅ Adicionado: FUU: Buscar Pendentes Outbound")

# =============================================================================
# NOVO NODE: Avançar Tentativa FUU
# =============================================================================
# Encontrar posição do último node para colocar no final
max_x = max(n.get('position', [0, 0])[0] for n in workflow.get('nodes', []))

fuu_advance_node = {
    "parameters": {
        "operation": "executeQuery",
        "query": """-- Avançar tentativa após envio de mensagem
SELECT fuu_advance_attempt(
    p_queue_id := '{{ $json.queue_id }}'::uuid,
    p_result := 'sent'
) as result;""",
        "options": {}
    },
    "id": "fuu-advance-attempt",
    "name": "FUU: Avançar Tentativa",
    "type": "n8n-nodes-base.postgres",
    "typeVersion": 2.5,
    "position": [max_x + 200, 500],
    "credentials": {
        "postgres": {
            "id": "supabase_postgres",
            "name": "Supabase Postgres"
        }
    },
    "notes": "Avança para próxima tentativa ou completa o follow-up"
}

workflow['nodes'].append(fuu_advance_node)
print("✅ Adicionado: FUU: Avançar Tentativa")

# =============================================================================
# NOVO NODE: Marcar Respondido FUU (para webhook de resposta)
# =============================================================================
fuu_mark_responded_node = {
    "parameters": {
        "operation": "executeQuery",
        "query": """-- Marcar como respondido quando lead responder
SELECT fuu_mark_responded(
    p_contact_id := '{{ $json.contact_id }}',
    p_location_id := '{{ $json.location_id }}',
    p_follow_up_type := NULL  -- cancela todos os follow-ups ativos
) as cancelled_count;""",
        "options": {}
    },
    "id": "fuu-mark-responded",
    "name": "FUU: Marcar Respondido",
    "type": "n8n-nodes-base.postgres",
    "typeVersion": 2.5,
    "position": [max_x + 200, 700],
    "credentials": {
        "postgres": {
            "id": "supabase_postgres",
            "name": "Supabase Postgres"
        }
    },
    "notes": "Cancela follow-ups quando lead responde"
}

workflow['nodes'].append(fuu_mark_responded_node)
print("✅ Adicionado: FUU: Marcar Respondido")

# =============================================================================
# NOVO NODE: Agendar Follow-up FUU
# =============================================================================
fuu_schedule_node = {
    "parameters": {
        "operation": "executeQuery",
        "query": """-- Agendar novo follow-up na fila FUU
SELECT fuu_schedule_followup(
    p_contact_id := '{{ $json.contact_id }}',
    p_location_id := '{{ $json.location_id }}',
    p_follow_up_type := CASE
        WHEN '{{ $json.hours_since_contact }}' > 24 THEN 'sdr_outbound_instagram_reactivation'
        ELSE 'sdr_outbound_instagram'
    END,
    p_phone := '{{ $json.phone }}',
    p_email := '{{ $json.email }}',
    p_contact_name := '{{ $json.contact_name }}',
    p_context := '{{ JSON.stringify($json.context || {}) }}'::jsonb
) as queue_id;""",
        "options": {}
    },
    "id": "fuu-schedule-followup",
    "name": "FUU: Agendar Follow-up",
    "type": "n8n-nodes-base.postgres",
    "typeVersion": 2.5,
    "position": [max_x + 200, 300],
    "credentials": {
        "postgres": {
            "id": "supabase_postgres",
            "name": "Supabase Postgres"
        }
    },
    "notes": "Agenda novo follow-up para lead de outbound Instagram"
}

workflow['nodes'].append(fuu_schedule_node)
print("✅ Adicionado: FUU: Agendar Follow-up")

# =============================================================================
# Atualizar metadados do workflow
# =============================================================================
workflow['name'] = '[ GHL ] Follow Up Eterno - V7 FUU Outbound'
if 'meta' not in workflow:
    workflow['meta'] = {}
workflow['meta']['instanceId'] = workflow.get('meta', {}).get('instanceId', '')

# Adicionar notas no primeiro node
for node in workflow.get('nodes', []):
    if 'INSTRUCOES' in node.get('name', ''):
        node['parameters'] = node.get('parameters', {})
        node['parameters']['notice'] = """=== V7 FUU OUTBOUND ===

NOVIDADES DESTA VERSÃO:
1. Suporte a follow_up_type dinâmico (inbound + outbound)
2. Integração com fuu_queue para outbound Instagram
3. Nodes FUU: Buscar Pendentes, Agendar, Avançar, Marcar Respondido

TIPOS DE FOLLOW-UP:
- sdr_inbound: leads que entraram em contato
- sdr_outbound_instagram: prospecção ativa Instagram
- sdr_outbound_instagram_reactivation: reativação após 24h

CADÊNCIAS OUTBOUND:
T1: 15min | T2: 5h | T3: 13h | T4: 5h
Reativação: 7d | 14d | 28d

Gerado em: """ + datetime.now().strftime('%Y-%m-%d %H:%M')
        break

# =============================================================================
# Salvar V7
# =============================================================================
with open(V7_PATH, 'w') as f:
    json.dump(workflow, f, indent=2, ensure_ascii=False)

print(f"\n✅ Workflow V7 salvo em: {V7_PATH}")
print(f"   Total nodes: {len(workflow.get('nodes', []))}")
