#!/usr/bin/env python3
"""
Script para atualizar Julia Amare com os 7 modes completos.
Executar quando a conexão com Supabase voltar.

Uso: python3 scripts/update_julia_modes.py
"""

import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"
LOCATION_ID = "c2LClBlpNDNX8SeWLvQp"

# personality_config COMPLETO com os 7 modes
PERSONALITY_CONFIG = {
    "modes": {
        "sdr_inbound": {
            "tom": "Acolhedor e curioso",
            "energia": "Média-alta",
            "formalidade": "Baixa",
            "emojis": "Moderado (1-2 por mensagem)",
            "tamanho_msg": "Curtas (2-4 linhas)",
            "etapas": ["ativacao", "qualificacao", "pitch_leve", "transicao"]
        },
        "scheduler": {
            "tom": "Prático e eficiente",
            "energia": "Média",
            "formalidade": "Baixa",
            "emojis": "Pouco (0-1 por mensagem)",
            "tamanho_msg": "Muito curtas (1-3 linhas)",
            "etapas": ["contexto", "oferta_horarios", "confirmacao", "reforco"]
        },
        "concierge": {
            "tom": "Premium e atencioso",
            "energia": "Média",
            "formalidade": "Média-baixa",
            "emojis": "Pouco (0-1 por mensagem)",
            "tamanho_msg": "Médias (3-5 linhas)",
            "etapas": ["acolhimento", "duvidas_finais", "fechamento", "onboarding"]
        },
        "followuper": {
            "tom": "Leve e sem pressão",
            "energia": "Baixa-média",
            "formalidade": "Baixa",
            "emojis": "Moderado (1-2 por mensagem)",
            "tamanho_msg": "Curtas (2-3 linhas)",
            "etapas": ["primeiro_followup", "segundo_followup", "terceiro_followup", "pausa"]
        },
        "objection_handler": {
            "tom": "Empático e confiante",
            "energia": "Média",
            "formalidade": "Baixa",
            "emojis": "Pouco (0-1 por mensagem)",
            "tamanho_msg": "Médias (3-5 linhas)",
            "etapas": ["validar", "explorar", "isolar", "resolver", "confirmar", "avancar"]
        },
        "reativador_base": {
            "tom": "Caloroso e nostálgico",
            "energia": "Média",
            "formalidade": "Baixa",
            "emojis": "Moderado (1-2 por mensagem)",
            "tamanho_msg": "Curtas (2-4 linhas)",
            "etapas": ["reconectar", "atualizar", "valor", "requalificar", "reativar"],
            "nota": "Para leads/clientes inativos há MESES/ANO+ (diferente do followuper que é dias/semanas)"
        },
        "social_seller_instagram": {
            "tom": "Casual e autêntico",
            "energia": "Alta",
            "formalidade": "Muito baixa",
            "emojis": "Alto (2-3 por mensagem)",
            "tamanho_msg": "Muito curtas (1-3 linhas)",
            "sub_fluxos": {
                "novo_seguidor": {
                    "trigger": "Pessoa seguiu o perfil",
                    "tempo_para_acao": "24-48h após follow",
                    "objetivo": "Iniciar relacionamento"
                },
                "visita_sincera": {
                    "trigger": "AgenticOS visita perfil",
                    "tempo_para_acao": "Logo após visita",
                    "objetivo": "Prospecção ativa qualificada"
                },
                "gatilho_social": {
                    "trigger": "Like, comentário, resposta story",
                    "tempo_para_acao": "Até 2h após interação",
                    "objetivo": "Aproveitar interesse demonstrado"
                }
            }
        }
    },
    "default_mode": "sdr_inbound",
    "version": "4.1"
}


def get_julia_agent():
    """Busca o agente Julia Amare ativo."""
    url = f"{SUPABASE_URL}/rest/v1/agent_prompts?location_id=eq.{LOCATION_ID}&is_active=eq.true&select=id,agent_name,personality_config"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            if data:
                return data[0]
            return None
    except urllib.error.URLError as e:
        print(f"Erro de conexão: {e}")
        return None


def update_personality_config(agent_id: str):
    """Atualiza personality_config da Julia."""
    url = f"{SUPABASE_URL}/rest/v1/agent_prompts?id=eq.{agent_id}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    data = json.dumps({
        "personality_config": PERSONALITY_CONFIG
    }).encode('utf-8')

    req = urllib.request.Request(url, data=data, headers=headers, method='PATCH')
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode())
            return result
    except urllib.error.URLError as e:
        print(f"Erro ao atualizar: {e}")
        return None


def main():
    print("=" * 60)
    print("ATUALIZANDO JULIA AMARE - 7 MODES COMPLETOS")
    print("=" * 60)

    # 1. Buscar Julia
    print("\n1. Buscando Julia Amare...")
    julia = get_julia_agent()

    if not julia:
        print("❌ Não foi possível encontrar Julia Amare. Verifique conexão.")
        return

    print(f"✅ Encontrada: {julia['agent_name']} (ID: {julia['id']})")

    # 2. Mostrar config atual
    print("\n2. Configuração atual:")
    current_modes = julia.get('personality_config', {}).get('modes', {})
    print(f"   Modes atuais: {list(current_modes.keys())}")

    # 3. Atualizar
    print("\n3. Atualizando para 7 modes...")
    result = update_personality_config(julia['id'])

    if result:
        new_modes = result[0].get('personality_config', {}).get('modes', {})
        print(f"✅ Atualizado! Modes agora: {list(new_modes.keys())}")
    else:
        print("❌ Falha ao atualizar.")

    print("\n" + "=" * 60)
    print("CONCLUÍDO")
    print("=" * 60)


if __name__ == "__main__":
    main()
