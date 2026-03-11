#!/usr/bin/env python3
"""
Remove webhooks redundantes do V8
(o fluxo principal já tem FUU integrado)
"""
import json

V8_PATH = '../workflows/1. core/0.3 Fluxo de Follow Up Eterno - V8 FUU Outbound.json'

# Ler V8
with open(V8_PATH, 'r') as f:
    workflow = json.load(f)

print(f"Antes: {len(workflow.get('nodes', []))} nodes")

# Nodes para remover (redundantes com fluxo principal)
nodes_to_remove = [
    'Webhook: Novo Lead Instagram',
    'Resposta: Lead Agendado',
    'Webhook: Lead Respondeu',
    'Resposta: Follow-ups Cancelados',
    'FUU: Agendar Outbound (Novo Lead)',
    'FUU: Marcar Respondido (Webhook)'
]

# Remover nodes
workflow['nodes'] = [n for n in workflow.get('nodes', []) if n.get('name') not in nodes_to_remove]

# Remover conexões
for node_name in nodes_to_remove:
    if node_name in workflow.get('connections', {}):
        del workflow['connections'][node_name]

print(f"Depois: {len(workflow.get('nodes', []))} nodes")
print(f"Removidos: {len(nodes_to_remove)} nodes redundantes")

# Verificar o que sobrou de FUU
print("\n=== Nodes FUU restantes ===")
for n in workflow.get('nodes', []):
    if 'FUU' in n.get('name', ''):
        print(f"  ✓ {n.get('name')}")

# Salvar
with open(V8_PATH, 'w', encoding='utf-8') as f:
    json.dump(workflow, f, indent=2, ensure_ascii=False)

print(f"\n✅ V8 limpo salvo!")
