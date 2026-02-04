#!/usr/bin/env python3
"""
Script para aplicar patches nos agentes via REST API do Supabase.
Data: 2026-02-03
"""

import json
import requests
from datetime import datetime

# Configuração Supabase
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# IDs dos agentes
ELINE_ID = "361a9fbc-f22c-4b87-addc-c47f8e9acf8f"
GABI_ID = "acf5a485-8df3-4c91-9d29-6c380afec033"


def patch_eline():
    """Aplica patch na Dra. Eline Lobo"""
    print("\n🔧 Aplicando patch na Dra. Eline Lobo...")
    
    # Tools config completo
    tools_config = {
        "available_tools": [
            {
                "name": "Busca_disponibilidade",
                "description": "Consulta horários disponíveis na agenda",
                "params": {
                    "calendar_id": {"type": "string", "default": "yYjQWSpdlGorTcy3sLGj"},
                    "date_range": {"type": "string"},
                    "time_preference": {"type": "string", "enum": ["manha", "tarde", "noite", "qualquer"]}
                },
                "max_calls_per_session": 2,
                "retry_logic": {
                    "max_retries": 2,
                    "fallback_message": "Deixa eu verificar direto com a equipe e te retorno, ok?"
                }
            },
            {
                "name": "Agendar_reuniao",
                "description": "Agenda call com Jean Pierre",
                "max_calls_per_session": 1,
                "pre_requisites": ["email_coletado", "telefone_coletado", "interesse_confirmado"]
            },
            {
                "name": "Escalar_humano",
                "triggers": ["frustração_detectada", "reclamação", "pedido_explicito", "3+_insistencias_preco"]
            },
            {
                "name": "Agendar_followup_futuro"
            }
        ],
        "error_handling": {
            "falha_1x": "Deixa eu verificar aqui...",
            "falha_2x": "Sistema um pouco instável, mas já anoto seus dados",
            "falha_3x": "AUTO_ESCALAR_HUMANO"
        }
    }
    
    # Qualification config (BANT)
    qualification_config = {
        "framework": "BANT_ADAPTADO",
        "bant": {
            "budget": {
                "peso": 0.2,
                "perguntas_indiretas": [
                    "Você já investiu em capacitação hormonal antes?",
                    "Costuma investir quanto por ano em educação médica?"
                ]
            },
            "authority": {"peso": 0.2},
            "need": {"peso": 0.35},
            "timeline": {"peso": 0.25}
        },
        "score_minimo_agendar": 60
    }
    
    # Compliance rules expandido
    compliance_rules = {
        "version": "v3.3.1",
        "proibicoes_absolutas": [
            "NUNCA revelar preço exato no chat",
            "NUNCA usar colega mais de 1x por conversa",
            "NUNCA fazer 2 perguntas na mesma mensagem",
            "NUNCA usar palavra protocolo",
            "NUNCA prometer resultados específicos"
        ],
        "anti_patterns": [
            {"pattern": "Usar colega repetidamente", "limite": 1},
            {"pattern": "SPIN sequencial rígido", "correcao": "Adaptar ao contexto"}
        ]
    }
    
    payload = {
        "version": "v3.3.1-critics-patch",
        "tools_config": tools_config,
        "qualification_config": qualification_config,
        "compliance_rules": compliance_rules,
        "validation_score": 185
    }
    
    url = f"{SUPABASE_URL}/rest/v1/agent_versions?id=eq.{ELINE_ID}"
    response = requests.patch(url, headers=HEADERS, json=payload)
    
    if response.status_code == 200:
        print("✅ Patch Eline aplicado com sucesso!")
        return True
    else:
        print(f"❌ Erro: {response.status_code} - {response.text}")
        return False


def patch_gabi():
    """Aplica patch na Dra. Gabriella Rossmann"""
    print("\n🔧 Aplicando patch na Dra. Gabriella Rossmann...")
    
    # Tools config com XML blocks
    tools_config = {
        "available_tools": [
            {"name": "Escalar_humano", "enabled": True, "max_calls": 1},
            {"name": "Refletir", "enabled": True},
            {"name": "Busca_disponibilidade", "enabled": True, "max_calls": 2},
            {"name": "Agendar_reuniao", "enabled": True, "max_calls": 1},
            {"name": "Agendar_followup_futuro", "enabled": True}
        ],
        "xml_blocks": {
            "tools_available": {
                "descricao": "Lista de ferramentas disponíveis na sessão"
            },
            "business_hours": {
                "descricao": "Horário de funcionamento",
                "valor": "seg-sex: 08:00-18:00 | sab: 08:00-12:00 | timezone: America/Cuiaba"
            }
        }
    }
    
    # Hyperpersonalization com matriz de transição
    hyperpersonalization = {
        "matriz_transicao": {
            "fase1_acolhimento": {"criterio_saida": "Lead respondeu primeira pergunta"},
            "fase2_discovery": {"criterio_saida": "discovery_score >= 3/4", "checkpoint": "BLOQUEANTE"},
            "fase3_conexao": {"criterio_saida": "Lead demonstrou conexão emocional"},
            "fase4_valor": {"criterio_saida": "Lead entendeu acompanhamento"},
            "fase6_investimento": {"pre_requisito": "YES_SET executado"},
            "fase8_coleta": {"checkpoint": "BLOQUEANTE - nome + telefone obrigatórios"}
        }
    }
    
    payload = {
        "version": "3.1.1-critics-patch",
        "tools_config": tools_config,
        "hyperpersonalization": hyperpersonalization,
        "validation_score": 185
    }
    
    url = f"{SUPABASE_URL}/rest/v1/agent_versions?id=eq.{GABI_ID}"
    response = requests.patch(url, headers=HEADERS, json=payload)
    
    if response.status_code == 200:
        print("✅ Patch Gabi aplicado com sucesso!")
        return True
    else:
        print(f"❌ Erro: {response.status_code} - {response.text}")
        return False


def verify_patches():
    """Verifica se os patches foram aplicados"""
    print("\n🔍 Verificando patches...")
    
    for agent_id, name in [(ELINE_ID, "Eline"), (GABI_ID, "Gabi")]:
        url = f"{SUPABASE_URL}/rest/v1/agent_versions?id=eq.{agent_id}&select=agent_name,version,validation_score"
        response = requests.get(url, headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            if data:
                agent = data[0]
                print(f"  {name}: {agent.get('version')} | Score: {agent.get('validation_score')}")
        else:
            print(f"  ❌ Erro ao verificar {name}")


def main():
    print("=" * 50)
    print("🚀 APLICADOR DE PATCHES - CRITICS FRAMEWORK")
    print(f"📅 Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Aplicar patches
    eline_ok = patch_eline()
    gabi_ok = patch_gabi()
    
    # Verificar
    verify_patches()
    
    print("\n" + "=" * 50)
    if eline_ok and gabi_ok:
        print("✅ TODOS OS PATCHES APLICADOS COM SUCESSO!")
    else:
        print("⚠️ ALGUNS PATCHES FALHARAM - VERIFICAR LOGS")
    print("=" * 50)


if __name__ == "__main__":
    main()
