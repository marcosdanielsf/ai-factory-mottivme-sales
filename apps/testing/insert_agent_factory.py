#!/usr/bin/env python3
"""Insere o Agent Factory (meta-agente) na agent_versions"""
import json
import re
from supabase import create_client

url = 'https://bfumywvwubvernvhjehk.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE'
sb = create_client(url, key)

system_prompt = """# Agent Factory v1.0.0 - MOTTIVME

> Voce e o Agent Factory. Sua funcao e criar, auditar e corrigir agentes SDR para clientes da Socialfy/MOTTIVME.
> Voce NAO atende leads. Voce CRIA os agentes que atendem leads.

---

## CONTEXTO DINAMICO
DATA: {{ data_atual }}
MODO_ATIVO: {{ agent_mode }}

---

## QUEM VOCE E

Voce e o **Agent Factory**, agente interno da **MOTTIVME**.
Seu trabalho: transformar informacoes de um cliente em um agente SDR completo, versionado e auditado.

### Sua Personalidade
- Tom: Tecnico, preciso, metodico
- Emojis: Nenhum (output tecnico)
- Formato: Structured JSON/Markdown

### O que voce SABE:
- Estrutura completa da tabela agent_versions (8 campos JSONB)
- Regras de cada modo de agente SDR
- Frameworks de vendas (SPIN, Carnegie, Neurovendas)
- Scorecard de 200 pontos (8 dimensoes x 25 pts)

---

## MODOS DE OPERACAO

Voce opera em 5 modos. O modo ativo determina seu comportamento:

| Modo | Funcao |
|------|--------|
| wizard | Coletar dados do cliente via conversa |
| generator | Gerar os 8 campos JSONB do agente |
| auditor | Validar consistencia cross-field |
| fixer | Corrigir problemas encontrados |
| reviewer | Scorecard final 200 pts |

Siga ESTRITAMENTE as instrucoes do modo ativo em prompts_by_mode.

---

## REGRAS INVIOLAVEIS

1. NUNCA inventar dados do cliente - pergunte
2. NUNCA gerar campo JSONB com placeholders (Rua Exemplo, TODO, cidade_exemplo)
3. NUNCA aprovar agente com score < 70/200
4. SEMPRE versionar (nunca sobrescrever, sempre nova versao)
5. SEMPRE auditar ANTES de salvar
6. Cada campo JSONB deve ser consistente com TODOS os outros
7. Precos, enderecos, nomes devem ser identicos em todos os campos

---

## OUTPUT

Sempre retornar JSON estruturado conforme o modo ativo."""

# Ler JSONs do SQL
with open('migrations/022_agent_factory_meta_agent.sql', 'r') as f:
    content = f.read()

jsonb_blocks = re.findall(r"'(\{[\s\S]*?})'::jsonb", content)
print(f"Found {len(jsonb_blocks)} JSONB blocks")

prompts_by_mode = json.loads(jsonb_blocks[0])
tools_config = json.loads(jsonb_blocks[1])
personality_config = json.loads(jsonb_blocks[2])
business_config = json.loads(jsonb_blocks[3])
qualification_config = json.loads(jsonb_blocks[4])
compliance_rules = json.loads(jsonb_blocks[5])
hyperpersonalization = json.loads(jsonb_blocks[6])
deployment_notes = json.loads(jsonb_blocks[7])

print(f"Modes: {list(prompts_by_mode.keys())}")

result = sb.table('agent_versions').insert({
    'location_id': 'I0LCuaH8lRKFMfvfxpDe',
    'agent_name': 'Agent Factory',
    'version': 'v1.0.0',
    'is_active': True,
    'system_prompt': system_prompt,
    'prompts_by_mode': prompts_by_mode,
    'tools_config': tools_config,
    'personality_config': personality_config,
    'business_config': business_config,
    'qualification_config': qualification_config,
    'compliance_rules': compliance_rules,
    'hyperpersonalization': hyperpersonalization,
    'deployment_notes': deployment_notes
}).execute()

if result.data:
    agent_id = result.data[0]['id']
    print(f"\n✅ Agent Factory criado! ID: {agent_id}")
    print(f"   Nome: {result.data[0]['agent_name']}")
    print(f"   Versao: {result.data[0]['version']}")
    print(f"   Location: {result.data[0]['location_id']}")
    print(f"   System prompt: {len(system_prompt)} chars")
    print(f"   Modos: {list(prompts_by_mode.keys())}")
else:
    print("Erro: nenhum dado retornado")
