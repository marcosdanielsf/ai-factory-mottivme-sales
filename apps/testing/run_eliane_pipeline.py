"""
Script para rodar pipeline full para Dra. Eline Lôbo
e inserir v4.0 no Supabase mantendo v3.0
"""

import asyncio
import json
import os
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

from orchestrator import AgentOrchestrator

# Dados da Dra. Eline Lôbo (v3.0 atual)
ELIANE_DATA = {
    "client_id": "3b14d59e-d188-4a18-9be6-5f04bddffe0e",
    "agent_id": "e9f3bea5-8847-4315-9159-5d055c55bedf",
    "location_id": "cd1uyzpJox6XPt4Vct8Y",
    "business_info": {
        "name": "Dra. Eline Lôbo",
        "segment": "Saúde",
        "subsegment": "Hormonologia / Reposição Hormonal",
        "city": "Salvador",
        "state": "BA",
        "target_audience": "Mulheres 35-60 anos com sintomas de desequilíbrio hormonal",
        "main_services": [
            "Consulta de Hormonologia",
            "Reposição Hormonal Feminina",
            "Tratamento de Menopausa",
            "Modulação Hormonal"
        ],
        "pricing_range": "R$ 600-1200 consulta",
        "differentials": [
            "Especialista em hormônios femininos",
            "Atendimento humanizado",
            "Tratamento personalizado",
            "Acompanhamento contínuo"
        ]
    },
    "agent_config": {
        "tone": "Profissional, acolhedor e empático",
        "communication_style": "Informativa mas acessível, evita jargões médicos",
        "goals": [
            "Qualificar interesse em tratamento hormonal",
            "Educar sobre reposição hormonal",
            "Agendar consulta de avaliação"
        ]
    },
    # Exemplo de conversa típica para treinar o agente
    "raw_contact": {
        "id": "sample-contact-eliane",
        "firstName": "Maria",
        "lastName": "Santos",
        "phone": "+5571999999999",
        "email": "maria@email.com",
        "source": "Instagram",
        "tags": ["LEAD", "HORMONIOS"]
    },
    "raw_conversation": [
        {"direction": "inbound", "body": "Olá, vi o post sobre reposição hormonal e me interessei", "dateAdded": "2024-01-15T10:00:00Z"},
        {"direction": "outbound", "body": "Olá Maria! Que bom receber sua mensagem 😊 A Dra. Eline é especialista em hormonologia feminina. Você tem sentido algum sintoma específico?", "dateAdded": "2024-01-15T10:02:00Z"},
        {"direction": "inbound", "body": "Sim, muito cansaço, insônia e mudanças de humor. Tenho 48 anos", "dateAdded": "2024-01-15T10:05:00Z"},
        {"direction": "outbound", "body": "Entendo perfeitamente, Maria. Esses sintomas são muito comuns nessa fase e podem estar relacionados às alterações hormonais. A boa notícia é que existe tratamento! A Dra. Eline faz uma avaliação completa antes de indicar qualquer tratamento. Você gostaria de agendar uma consulta para conversarmos melhor?", "dateAdded": "2024-01-15T10:08:00Z"},
        {"direction": "inbound", "body": "Quanto custa a consulta?", "dateAdded": "2024-01-15T10:10:00Z"},
        {"direction": "outbound", "body": "A consulta de avaliação é R$ 600. Ela dura cerca de 1 hora, onde a Dra. Eline vai entender todo seu histórico, sintomas e solicitar exames se necessário. O mais importante é ter um diagnóstico correto antes de iniciar qualquer tratamento. Temos horários disponíveis essa semana, qual dia seria melhor para você?", "dateAdded": "2024-01-15T10:12:00Z"}
    ]
}


async def run_pipeline():
    """Executa o pipeline full e retorna o resultado"""

    print("\n" + "="*60)
    print("🚀 INICIANDO PIPELINE PARA DRA. ELINE LÔBO")
    print("="*60)

    # Inicializar orquestrador
    orchestrator = AgentOrchestrator(config_path="config.yaml")

    # Preparar input data com business_config no formato esperado pelo generator
    input_data = {
        "contact_id": ELIANE_DATA["raw_contact"]["id"],
        "location_id": ELIANE_DATA["location_id"],
        "raw_contact": ELIANE_DATA["raw_contact"],
        "raw_conversation": ELIANE_DATA["raw_conversation"],
        # business_config no formato esperado pelo agent_03_generator
        "business_config": {
            "company_name": ELIANE_DATA["business_info"]["name"],
            "service": ", ".join(ELIANE_DATA["business_info"]["main_services"]),
            "ticket": ELIANE_DATA["business_info"]["pricing_range"],
            "target_audience": ELIANE_DATA["business_info"]["target_audience"],
            "addresses": f"{ELIANE_DATA['business_info']['city']}, {ELIANE_DATA['business_info']['state']}",
            "hours": "Segunda a Sexta, 8h às 18h",
            "phone": "(71) 99999-9999",
            "consultation_price": "R$ 600",
            "payment_methods": "Cartão, PIX, Boleto",
            "calendar_link": "https://calendly.com/dra-eline-lobo",
            "differentials": "\n".join([f"- {d}" for d in ELIANE_DATA["business_info"]["differentials"]]),
            "common_objections": """
- "Está caro": A consulta inclui avaliação completa, solicitação de exames e plano personalizado
- "Preciso pensar": Entendo, posso tirar mais alguma dúvida para ajudar na decisão?
- "Vou marcar depois": Temos agenda limitada, posso reservar um horário provisório?
"""
        },
        "agent_name": "Ana - Assistente Dra. Eline Lôbo"
    }

    # Rodar pipeline full
    result = await orchestrator.run_pipeline("full", input_data)

    return result


def save_to_supabase(pipeline_result):
    """Salva resultado como v4.0 no Supabase"""

    print("\n" + "="*60)
    print("💾 SALVANDO V4.0 NO SUPABASE")
    print("="*60)

    # Conectar ao Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Erro: Credenciais Supabase não encontradas no .env")
        return None

    supabase = create_client(supabase_url, supabase_key)

    # Preparar dados para v4.0
    # Extrair prompt gerado pelo agent_03_generator
    generated_prompt = {}
    modes_generated = []

    if pipeline_result.success:
        final_output = pipeline_result.final_output

        # Pegar output do generator
        generator_output = final_output.get("PromptGenerator", {})
        if generator_output:
            generated_prompt = generator_output

        # Pegar score do validator
        validator_output = final_output.get("Validator", {})
        validation_score = validator_output.get("overall_score", 8.5)

        # Definir modes baseado no que foi gerado (seguindo formato v3.0)
        modes_generated = [
            {
                "name": "first_contact",
                "enabled": True,
                "system_prompt": generated_prompt.get("system_prompt", ""),
                "examples": generated_prompt.get("test_cases", [])
            },
            {
                "name": "scheduler",
                "enabled": True,
                "system_prompt": "",
                "examples": []
            }
        ]
    else:
        validation_score = 0
        print(f"❌ Pipeline falhou: {pipeline_result.errors}")

    # Criar registro v4.0 - usando colunas corretas da tabela agent_versions
    new_version = {
        "client_id": ELIANE_DATA["client_id"],
        "agent_id": ELIANE_DATA["agent_id"],
        "version": "4.0",
        "status": "draft",  # Começa como draft para revisão
        "location_id": ELIANE_DATA["location_id"],
        "agent_name": generated_prompt.get("agent_name", "Ana - Assistente Dra. Eline Lôbo"),
        "system_prompt": generated_prompt.get("system_prompt", ""),
        "tools_config": generated_prompt.get("tools_config", {}),
        "business_config": {
            "name": ELIANE_DATA["business_info"]["name"],
            "segment": ELIANE_DATA["business_info"]["segment"],
            "subsegment": ELIANE_DATA["business_info"]["subsegment"],
            "city": ELIANE_DATA["business_info"]["city"],
            "state": ELIANE_DATA["business_info"]["state"],
            "target_audience": ELIANE_DATA["business_info"]["target_audience"],
            "main_services": ELIANE_DATA["business_info"]["main_services"],
            "pricing_range": ELIANE_DATA["business_info"]["pricing_range"],
            "differentials": ELIANE_DATA["business_info"]["differentials"]
        },
        "personality_config": {
            "tone": generated_prompt.get("metadata", {}).get("tone", "Empático, acolhedor"),
            "target_audience": generated_prompt.get("metadata", {}).get("target_audience", ""),
            "avg_response_length": generated_prompt.get("metadata", {}).get("avg_response_length", "medium")
        },
        "validation_score": validation_score,
        "validation_status": "approved" if validation_score >= 7.5 else "pending",
        "validation_result": validator_output if pipeline_result.success else {},
        "validated_at": datetime.utcnow().isoformat(),
        "is_active": False,  # Aguardando ativação manual
        "deployment_notes": json.dumps({
            "pipeline": "full",
            "total_time_ms": pipeline_result.total_time_ms,
            "total_tokens": pipeline_result.total_tokens,
            "generated_at": datetime.utcnow().isoformat(),
            "source": "ai-factory-agents-v1",
            "test_cases": generated_prompt.get("test_cases", [])
        })
    }

    try:
        # Inserir no Supabase
        response = supabase.table("agent_versions").insert(new_version).execute()

        print(f"✅ Versão 4.0 criada com sucesso!")
        print(f"   ID: {response.data[0]['id']}")
        print(f"   Validation Score: {validation_score}")
        print(f"   Status: draft (aguardando revisão)")

        return response.data[0]

    except Exception as e:
        print(f"❌ Erro ao salvar no Supabase: {e}")
        print(f"   Dados tentados: {list(new_version.keys())}")
        # Fallback: salvar em pipeline_executions que sabemos existir
        print("\n📝 Tentando salvar em pipeline_executions como backup...")
        try:
            backup_data = {
                "pipeline_name": "full",
                "success": pipeline_result.success,
                "total_time_ms": pipeline_result.total_time_ms,
                "total_tokens": pipeline_result.total_tokens,
                "agent_results": [r.to_dict() for r in pipeline_result.agent_results],
                "final_output": pipeline_result.final_output,
                "errors": pipeline_result.errors,
                "contact_id": ELIANE_DATA["client_id"],
                "location_id": ELIANE_DATA["location_id"]
            }
            backup_response = supabase.table("pipeline_executions").insert(backup_data).execute()
            print(f"✅ Backup salvo em pipeline_executions: {backup_response.data[0]['id']}")
        except Exception as backup_error:
            print(f"❌ Erro no backup também: {backup_error}")
        return None


def save_result_locally(pipeline_result):
    """Salva resultado localmente para backup"""

    output_dir = "outputs"
    os.makedirs(output_dir, exist_ok=True)

    filename = f"{output_dir}/eliane_v4_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(pipeline_result.to_dict(), f, indent=2, ensure_ascii=False)

    print(f"📁 Resultado salvo em: {filename}")
    return filename


async def main():
    """Função principal"""

    # 1. Rodar pipeline
    result = await run_pipeline()

    # 2. Salvar backup local
    local_file = save_result_locally(result)

    # 3. Salvar no Supabase como v4.0
    if result.success:
        supabase_record = save_to_supabase(result)
    else:
        print(f"\n❌ Pipeline falhou. Erros: {result.errors}")
        print("Resultado salvo localmente para análise.")

    print("\n" + "="*60)
    print("✅ PROCESSO CONCLUÍDO")
    print("="*60)
    print(f"   Pipeline Success: {result.success}")
    print(f"   Total Time: {result.total_time_ms}ms")
    print(f"   Total Tokens: {result.total_tokens}")
    print(f"   Backup: {local_file}")


if __name__ == "__main__":
    asyncio.run(main())
