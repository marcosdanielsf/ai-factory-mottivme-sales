#!/usr/bin/env python3
"""
Script para aplicar patch FUU no workflow SDR Julia Amare
Adiciona nós de cancelamento e agendamento de follow-up
"""

import json
import os
from datetime import datetime

# Paths
BASE_DIR = "/Users/marcosdaniels/Projects/mottivme/ai-factory-agents"
ORIGINAL_FILE = f"{BASE_DIR}/SDR Julia Amare - Corrigido.json"
OUTPUT_FILE = f"{BASE_DIR}/SDR Julia Amare - FUU.json"

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, filepath):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    print("=" * 50)
    print("Aplicando patch FUU no SDR Julia Amare")
    print("=" * 50)

    # Carregar workflow original
    print("\n1. Carregando workflow original...")
    workflow = load_json(ORIGINAL_FILE)
    print(f"   Nós encontrados: {len(workflow['nodes'])}")

    # Nós FUU a adicionar
    fuu_cancel_node = {
        "parameters": {
            "operation": "executeQuery",
            "query": "-- Cancela follow-ups pendentes quando lead responde\nSELECT fuu_mark_responded(\n  '{{ $json.contact.id }}',\n  '{{ $json.contact.locationId }}'\n) as cancelled_count;",
            "options": {}
        },
        "type": "n8n-nodes-base.postgres",
        "typeVersion": 2.6,
        "position": [32350, 26496],
        "id": "fuu-cancel-followups-001",
        "name": "FUU - Cancelar Follow-ups",
        "credentials": {
            "postgres": {
                "id": "w2mBaRwhZ3tM4FUw",
                "name": "Postgres Marcos Daniels."
            }
        },
        "onError": "continueRegularOutput",
        "retryOnFail": False,
        "alwaysOutputData": True
    }

    fuu_schedule_node = {
        "parameters": {
            "operation": "executeQuery",
            "query": """-- Agenda follow-up para caso lead não responda
SELECT fuu_schedule_followup(
  $1::varchar,
  $2::varchar,
  'sdr_inbound'::varchar,
  $3::varchar,
  $4::varchar,
  $5::varchar,
  $6::jsonb,
  NOW()
) as queue_id;""",
            "options": {
                "queryReplacement": "={{ [$json.contact?.id || $('Mensagem recebida').first().json.contact.id, $json.contact?.locationId || $('Mensagem recebida').first().json.contact.locationId, $json.contact?.phone || null, $json.contact?.email || null, $json.contact?.name || $json.contact?.firstName || null, JSON.stringify({ultimo_assunto: '', etapa: 'qualificacao', source: 'whatsapp'})] }}"
            }
        },
        "type": "n8n-nodes-base.postgres",
        "typeVersion": 2.6,
        "position": [45300, 26480],
        "id": "fuu-schedule-followup-001",
        "name": "FUU - Agendar Follow-up",
        "credentials": {
            "postgres": {
                "id": "w2mBaRwhZ3tM4FUw",
                "name": "Postgres Marcos Daniels."
            }
        },
        "onError": "continueRegularOutput",
        "retryOnFail": False,
        "alwaysOutputData": True
    }

    # Adicionar nós
    print("\n2. Adicionando nós FUU...")
    workflow['nodes'].append(fuu_cancel_node)
    workflow['nodes'].append(fuu_schedule_node)
    print("   ✅ FUU - Cancelar Follow-ups")
    print("   ✅ FUU - Agendar Follow-up")

    # Modificar conexões
    print("\n3. Modificando conexões...")

    # 3.1 Pegar conexão atual de "Mensagem recebida" -> "Contexto UTM"
    if "Mensagem recebida" in workflow['connections']:
        original_target = workflow['connections']['Mensagem recebida']
        # Mudar para: "Mensagem recebida" -> "FUU - Cancelar Follow-ups"
        workflow['connections']['Mensagem recebida'] = {
            "main": [[{"node": "FUU - Cancelar Follow-ups", "type": "main", "index": 0}]]
        }
        # Adicionar: "FUU - Cancelar Follow-ups" -> "Contexto UTM"
        workflow['connections']['FUU - Cancelar Follow-ups'] = original_target
        print("   ✅ Mensagem recebida → FUU - Cancelar Follow-ups → Contexto UTM")

    # 3.2 Adicionar conexão após "no.op" (final do loop de envio)
    if "no.op" in workflow['connections']:
        # Adicionar mais uma conexão
        existing = workflow['connections']['no.op']['main'][0] if workflow['connections']['no.op']['main'] else []
        existing.append({"node": "FUU - Agendar Follow-up", "type": "main", "index": 0})
        workflow['connections']['no.op']['main'] = [existing]
    else:
        workflow['connections']['no.op'] = {
            "main": [[{"node": "FUU - Agendar Follow-up", "type": "main", "index": 0}]]
        }
    print("   ✅ no.op → FUU - Agendar Follow-up")

    # Atualizar nome do workflow
    workflow['name'] = "SDR Julia Amare - FUU"

    # Adicionar nota sticky explicando as mudanças
    sticky_note = {
        "parameters": {
            "content": f"""# Integração FUU (Follow Up Universal)

## Nós adicionados:
1. **FUU - Cancelar Follow-ups**: No início, cancela follow-ups pendentes quando lead responde
2. **FUU - Agendar Follow-up**: No final, agenda novo follow-up para caso lead não responda

## Como funciona:
- Lead manda mensagem → Cancela follow-ups pendentes
- IA responde → Agenda novo follow-up (tipo: sdr_inbound)
- Se lead não responder em 35min → CRON do Follow Up Eterno envia mensagem

## Tabelas FUU:
- fuu_queue: Fila de follow-ups
- fuu_cadences: Intervalos por location
- fuu_execution_log: Histórico

Patch aplicado em: {datetime.now().strftime('%Y-%m-%d %H:%M')}""",
            "height": 400,
            "width": 400,
            "color": 4
        },
        "type": "n8n-nodes-base.stickyNote",
        "typeVersion": 1,
        "position": [32100, 26100],
        "id": "fuu-info-sticky",
        "name": "FUU Info"
    }
    workflow['nodes'].append(sticky_note)

    # Salvar
    print(f"\n4. Salvando em {OUTPUT_FILE}...")
    save_json(workflow, OUTPUT_FILE)
    print(f"   ✅ Arquivo salvo!")

    print("\n" + "=" * 50)
    print("Patch aplicado com sucesso!")
    print("=" * 50)
    print(f"\nNós totais: {len(workflow['nodes'])}")
    print(f"\nPróximos passos:")
    print("1. Importar o arquivo no n8n")
    print("2. Verificar as conexões visualmente")
    print("3. Testar o fluxo")

if __name__ == "__main__":
    main()
