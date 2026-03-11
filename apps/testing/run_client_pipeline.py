"""
🚀 AI Factory - Pipeline para Gerar Prompts de Clientes
========================================================

USO:
    python3 run_client_pipeline.py

CONFIGURAÇÃO:
    1. Edite CLIENT_DATA abaixo com os dados do novo cliente
    2. Execute o script
    3. O prompt será gerado e salvo no Supabase como draft
    4. Revise e ative manualmente

"""

import asyncio
import json
import os
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

from orchestrator import AgentOrchestrator

# ============================================================
# 📝 CONFIGURE OS DADOS DO CLIENTE AQUI
# ============================================================

CLIENT_DATA = {
    # IDs (deixe None para novos clientes)
    "client_id": None,  # UUID do cliente no Supabase, ou None
    "location_id": "",  # Location ID do GHL

    # Informações do Negócio
    "business_info": {
        "name": "Nome do Profissional/Clínica",
        "segment": "Saúde",  # Saúde, Estética, Educação, etc
        "subsegment": "Especialidade",
        "city": "Cidade",
        "state": "UF",
        "target_audience": "Descreva o público-alvo ideal",
        "main_services": [
            "Serviço 1",
            "Serviço 2",
            "Serviço 3"
        ],
        "pricing_range": "R$ XXX - R$ XXX",
        "differentials": [
            "Diferencial 1",
            "Diferencial 2",
            "Diferencial 3"
        ]
    },

    # Configuração do Agente
    "agent_config": {
        "agent_name": "Nome do Assistente",  # Ex: "Ana", "Julia", "Carol"
        "tone": "Profissional, acolhedor e empático",
        "goals": [
            "Qualificar interesse",
            "Educar sobre o serviço",
            "Agendar consulta/reunião"
        ]
    },

    # Dados para Treinamento (opcional, mas recomendado)
    # Adicione uma conversa real de exemplo
    "sample_contact": {
        "firstName": "Maria",
        "lastName": "Silva",
        "phone": "+5511999999999",
        "email": "maria@email.com",
        "source": "Instagram"
    },
    "sample_conversation": [
        {"direction": "inbound", "body": "Olá, vi o anúncio e me interessei", "dateAdded": "2024-01-15T10:00:00Z"},
        {"direction": "outbound", "body": "Olá! Que bom receber sua mensagem. Como posso ajudar?", "dateAdded": "2024-01-15T10:02:00Z"},
        # Adicione mais mensagens de exemplo...
    ],

    # Informações Específicas para o Prompt
    "business_details": {
        "address": "Endereço completo",
        "hours": "Segunda a Sexta, 8h às 18h",
        "phone": "(XX) XXXXX-XXXX",
        "consultation_price": "R$ XXX",
        "payment_methods": "Cartão, PIX, Boleto",
        "calendar_link": "https://calendly.com/...",
    },

    # Objeções Comuns (adicione as mais frequentes)
    "common_objections": """
- "Está caro": [resposta sugerida]
- "Preciso pensar": [resposta sugerida]
- "Vou marcar depois": [resposta sugerida]
"""
}

# ============================================================
# 🔧 NÃO EDITE ABAIXO DESTA LINHA
# ============================================================

async def run_pipeline():
    """Executa o pipeline completo"""

    print("\n" + "="*60)
    print(f"🚀 GERANDO PROMPT PARA: {CLIENT_DATA['business_info']['name']}")
    print("="*60)

    orchestrator = AgentOrchestrator(config_path="config.yaml")

    # Preparar input
    input_data = {
        "contact_id": "sample-contact",
        "location_id": CLIENT_DATA.get("location_id", ""),
        "raw_contact": CLIENT_DATA.get("sample_contact", {}),
        "raw_conversation": CLIENT_DATA.get("sample_conversation", []),
        "business_config": {
            "company_name": CLIENT_DATA["business_info"]["name"],
            "service": ", ".join(CLIENT_DATA["business_info"]["main_services"]),
            "ticket": CLIENT_DATA["business_info"]["pricing_range"],
            "target_audience": CLIENT_DATA["business_info"]["target_audience"],
            "addresses": f"{CLIENT_DATA['business_info']['city']}, {CLIENT_DATA['business_info']['state']}",
            "hours": CLIENT_DATA.get("business_details", {}).get("hours", ""),
            "phone": CLIENT_DATA.get("business_details", {}).get("phone", ""),
            "consultation_price": CLIENT_DATA.get("business_details", {}).get("consultation_price", ""),
            "payment_methods": CLIENT_DATA.get("business_details", {}).get("payment_methods", ""),
            "calendar_link": CLIENT_DATA.get("business_details", {}).get("calendar_link", ""),
            "differentials": "\n".join([f"- {d}" for d in CLIENT_DATA["business_info"]["differentials"]]),
            "common_objections": CLIENT_DATA.get("common_objections", "")
        },
        "agent_name": CLIENT_DATA["agent_config"]["agent_name"]
    }

    # Rodar pipeline
    result = await orchestrator.run_pipeline("full", input_data)

    return result


def save_to_supabase(pipeline_result):
    """Salva resultado no Supabase"""

    print("\n" + "="*60)
    print("💾 SALVANDO NO SUPABASE")
    print("="*60)

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Credenciais Supabase não encontradas")
        return None

    supabase = create_client(supabase_url, supabase_key)

    # Extrair dados
    generator_output = pipeline_result.final_output.get("PromptGenerator", {})
    validator_output = pipeline_result.final_output.get("Validator", {})
    validation_score = validator_output.get("overall_score", 0)

    # Preparar registro
    new_version = {
        "client_id": CLIENT_DATA.get("client_id"),
        "version": "1.0",
        "status": "draft",
        "location_id": CLIENT_DATA.get("location_id"),
        "agent_name": generator_output.get("agent_name", CLIENT_DATA["agent_config"]["agent_name"]),
        "system_prompt": generator_output.get("system_prompt", ""),
        "tools_config": generator_output.get("tools_config", {}),
        "business_config": CLIENT_DATA["business_info"],
        "personality_config": {
            "tone": generator_output.get("metadata", {}).get("tone", CLIENT_DATA["agent_config"]["tone"]),
            "target_audience": CLIENT_DATA["business_info"]["target_audience"]
        },
        "validation_score": validation_score,
        "validation_status": "approved" if validation_score >= 7.5 else "pending",
        "validation_result": validator_output,
        "validated_at": datetime.utcnow().isoformat(),
        "is_active": False,
        "deployment_notes": json.dumps({
            "pipeline": "full",
            "total_time_ms": pipeline_result.total_time_ms,
            "total_tokens": pipeline_result.total_tokens,
            "generated_at": datetime.utcnow().isoformat(),
            "source": "ai-factory-agents"
        })
    }

    try:
        response = supabase.table("agent_versions").insert(new_version).execute()

        print(f"✅ Versão criada!")
        print(f"   ID: {response.data[0]['id']}")
        print(f"   Score: {validation_score}")
        print(f"   Status: draft")

        return response.data[0]

    except Exception as e:
        print(f"❌ Erro: {e}")
        return None


def save_locally(pipeline_result):
    """Salva backup local"""
    os.makedirs("outputs", exist_ok=True)

    name = CLIENT_DATA["business_info"]["name"].replace(" ", "_").lower()
    filename = f"outputs/{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(pipeline_result.to_dict(), f, indent=2, ensure_ascii=False)

    print(f"📁 Backup: {filename}")
    return filename


async def main():
    # 1. Rodar pipeline
    result = await run_pipeline()

    # 2. Salvar backup local
    local_file = save_locally(result)

    # 3. Salvar no Supabase
    if result.success:
        save_to_supabase(result)

        # Mostrar o prompt gerado
        prompt = result.final_output.get("PromptGenerator", {}).get("system_prompt", "")
        print("\n" + "="*60)
        print("📄 PROMPT GERADO (primeiros 2000 chars):")
        print("="*60)
        print(prompt[:2000])
        print("...")
    else:
        print(f"\n❌ Pipeline falhou: {result.errors}")

    print("\n" + "="*60)
    print("✅ PROCESSO CONCLUÍDO")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
