#!/usr/bin/env python3
"""
Adiciona webhooks aos nodes FUU soltos no V8
"""
import json
import uuid

V8_PATH = '../workflows/1. core/0.3 Fluxo de Follow Up Eterno - V8 FUU Outbound.json'

# Ler V8
with open(V8_PATH, 'r') as f:
    workflow = json.load(f)

print(f"✅ Lido V8 com {len(workflow.get('nodes', []))} nodes")

# Encontrar posições dos nodes FUU
fuu_agendar_pos = None
fuu_marcar_pos = None

for node in workflow.get('nodes', []):
    if node.get('name') == 'FUU: Agendar Outbound (Novo Lead)':
        fuu_agendar_pos = node.get('position', [0, 0])
        fuu_agendar_id = node.get('id')
    if node.get('name') == 'FUU: Marcar Respondido (Webhook)':
        fuu_marcar_pos = node.get('position', [0, 0])
        fuu_marcar_id = node.get('id')

print(f"   FUU Agendar pos: {fuu_agendar_pos}")
print(f"   FUU Marcar pos: {fuu_marcar_pos}")

# =============================================================================
# WEBHOOK 1: Novo Lead Instagram
# =============================================================================
webhook_novo_lead = {
    "parameters": {
        "httpMethod": "POST",
        "path": "fuu-novo-lead-instagram",
        "options": {
            "responseMode": "lastNode"
        }
    },
    "id": str(uuid.uuid4()),
    "name": "Webhook: Novo Lead Instagram",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 2,
    "position": [fuu_agendar_pos[0] - 300, fuu_agendar_pos[1]],
    "webhookId": str(uuid.uuid4()),
    "notes": """Recebe novos leads de Instagram para agendar follow-up.

Payload esperado:
{
  "contact_id": "ghl_contact_id",
  "location_id": "ve9EPM428h8vShlRW1KT",
  "contact_name": "Nome do Lead",
  "phone": "+5511999999999",
  "email": "lead@email.com",
  "instagram_username": "@username",
  "first_message": "Mensagem inicial enviada"
}""",
    "notesInFlow": True
}

workflow['nodes'].append(webhook_novo_lead)
print("✅ Adicionado: Webhook: Novo Lead Instagram")

# Node de resposta para o webhook de novo lead
response_novo_lead = {
    "parameters": {
        "options": {}
    },
    "id": str(uuid.uuid4()),
    "name": "Resposta: Lead Agendado",
    "type": "n8n-nodes-base.respondToWebhook",
    "typeVersion": 1.1,
    "position": [fuu_agendar_pos[0] + 300, fuu_agendar_pos[1]]
}

workflow['nodes'].append(response_novo_lead)
print("✅ Adicionado: Resposta: Lead Agendado")

# =============================================================================
# WEBHOOK 2: Lead Respondeu
# =============================================================================
webhook_respondeu = {
    "parameters": {
        "httpMethod": "POST",
        "path": "fuu-lead-respondeu",
        "options": {
            "responseMode": "lastNode"
        }
    },
    "id": str(uuid.uuid4()),
    "name": "Webhook: Lead Respondeu",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 2,
    "position": [fuu_marcar_pos[0] - 300, fuu_marcar_pos[1]],
    "webhookId": str(uuid.uuid4()),
    "notes": """Recebe notificação quando lead responde (cancela follow-ups).

Payload esperado:
{
  "contact_id": "ghl_contact_id",
  "location_id": "ve9EPM428h8vShlRW1KT"
}

Pode ser chamado pelo:
- Webhook do GHL (nova mensagem inbound)
- Fluxo principal de conversação""",
    "notesInFlow": True
}

workflow['nodes'].append(webhook_respondeu)
print("✅ Adicionado: Webhook: Lead Respondeu")

# Node de resposta para o webhook de lead respondeu
response_respondeu = {
    "parameters": {
        "options": {}
    },
    "id": str(uuid.uuid4()),
    "name": "Resposta: Follow-ups Cancelados",
    "type": "n8n-nodes-base.respondToWebhook",
    "typeVersion": 1.1,
    "position": [fuu_marcar_pos[0] + 300, fuu_marcar_pos[1]]
}

workflow['nodes'].append(response_respondeu)
print("✅ Adicionado: Resposta: Follow-ups Cancelados")

# =============================================================================
# CONEXÕES
# =============================================================================
if 'connections' not in workflow:
    workflow['connections'] = {}

# Conexão 1: Webhook Novo Lead → FUU Agendar
workflow['connections']['Webhook: Novo Lead Instagram'] = {
    'main': [[{
        'node': 'FUU: Agendar Outbound (Novo Lead)',
        'type': 'main',
        'index': 0
    }]]
}
print("✅ Conexão: Webhook Novo Lead → FUU Agendar")

# Conexão 2: FUU Agendar → Resposta
workflow['connections']['FUU: Agendar Outbound (Novo Lead)'] = {
    'main': [[{
        'node': 'Resposta: Lead Agendado',
        'type': 'main',
        'index': 0
    }]]
}
print("✅ Conexão: FUU Agendar → Resposta")

# Conexão 3: Webhook Lead Respondeu → FUU Marcar
workflow['connections']['Webhook: Lead Respondeu'] = {
    'main': [[{
        'node': 'FUU: Marcar Respondido (Webhook)',
        'type': 'main',
        'index': 0
    }]]
}
print("✅ Conexão: Webhook Lead Respondeu → FUU Marcar")

# Conexão 4: FUU Marcar → Resposta
workflow['connections']['FUU: Marcar Respondido (Webhook)'] = {
    'main': [[{
        'node': 'Resposta: Follow-ups Cancelados',
        'type': 'main',
        'index': 0
    }]]
}
print("✅ Conexão: FUU Marcar → Resposta")

# =============================================================================
# Atualizar query do FUU Agendar para usar dados do webhook
# =============================================================================
for node in workflow.get('nodes', []):
    if node.get('name') == 'FUU: Agendar Outbound (Novo Lead)':
        node['parameters']['query'] = """-- V8: Agendar novo follow-up outbound via webhook
SELECT fuu_schedule_followup(
    p_contact_id := '{{ $json.contact_id }}',
    p_location_id := '{{ $json.location_id }}',
    p_follow_up_type := 'sdr_outbound_instagram',
    p_phone := '{{ $json.phone || "" }}',
    p_email := '{{ $json.email || "" }}',
    p_contact_name := '{{ $json.contact_name || $json.name || "" }}',
    p_context := '{
        "source": "instagram_dm",
        "username": "{{ $json.instagram_username || "" }}",
        "first_message": "{{ $json.first_message || "" }}"
    }'::jsonb
) as queue_id;"""
        print("✅ Atualizado: Query FUU Agendar (usa $json do webhook)")

# Atualizar query do FUU Marcar
for node in workflow.get('nodes', []):
    if node.get('name') == 'FUU: Marcar Respondido (Webhook)':
        node['parameters']['query'] = """-- V8: Marcar como respondido via webhook
SELECT fuu_mark_responded(
    p_contact_id := '{{ $json.contact_id }}',
    p_location_id := '{{ $json.location_id }}',
    p_follow_up_type := NULL
) as cancelled_count;"""
        print("✅ Atualizado: Query FUU Marcar (usa $json do webhook)")

# =============================================================================
# Salvar
# =============================================================================
with open(V8_PATH, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"✅ V8 atualizado com webhooks!")
print(f"   Total nodes: {len(workflow.get('nodes', []))}")
print(f"{'='*60}")

print("""
=== ENDPOINTS CRIADOS ===

1. POST /webhook/fuu-novo-lead-instagram
   Payload: {
     "contact_id": "xxx",
     "location_id": "xxx",
     "contact_name": "Nome",
     "phone": "+55...",
     "instagram_username": "@user"
   }

2. POST /webhook/fuu-lead-respondeu
   Payload: {
     "contact_id": "xxx",
     "location_id": "xxx"
   }
""")
