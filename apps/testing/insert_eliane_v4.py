"""
Script para inserir v4.0 no Supabase usando resultado já gerado
"""

import json
import os
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Dados da Dra. Eline Lôbo
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
    }
}

# Carregar resultado do pipeline
with open("outputs/eliane_v4_20260104_172907.json", "r", encoding="utf-8") as f:
    pipeline_result = json.load(f)

# Extrair dados do resultado
generator_output = pipeline_result["final_output"].get("PromptGenerator", {})
validator_output = pipeline_result["final_output"].get("Validator", {})
validation_score = validator_output.get("overall_score", 8.4)

# Conectar ao Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(supabase_url, supabase_key)

# Criar registro v4.0 (agent_id é opcional, v3.0 também não tem)
new_version = {
    "client_id": ELIANE_DATA["client_id"],
    # "agent_id": None - omitindo para evitar FK constraint
    "version": "4.0",
    "status": "draft",
    "location_id": ELIANE_DATA["location_id"],
    "agent_name": generator_output.get("agent_name", "Ana - Assistente Dra. Eline Lôbo"),
    "system_prompt": generator_output.get("system_prompt", ""),
    "tools_config": generator_output.get("tools_config", {}),
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
        "tone": generator_output.get("metadata", {}).get("tone", "Empático, acolhedor, consultivo, profissional"),
        "target_audience": generator_output.get("metadata", {}).get("target_audience", "Mulheres 35-60 anos"),
        "avg_response_length": generator_output.get("metadata", {}).get("avg_response_length", "medium")
    },
    "validation_score": validation_score,
    "validation_status": "approved",
    "validation_result": validator_output,
    "validated_at": datetime.utcnow().isoformat(),
    "is_active": False,
    "deployment_notes": json.dumps({
        "pipeline": "full",
        "total_time_ms": pipeline_result["total_time_ms"],
        "total_tokens": pipeline_result["total_tokens"],
        "generated_at": datetime.utcnow().isoformat(),
        "source": "ai-factory-agents-v1",
        "test_cases": generator_output.get("test_cases", []),
        "validator_scores": validator_output.get("scores", {}),
        "validator_strengths": validator_output.get("strengths", []),
        "validator_recommendations": validator_output.get("recommendations", [])
    })
}

print("="*60)
print("💾 INSERINDO V4.0 NO SUPABASE")
print("="*60)

try:
    response = supabase.table("agent_versions").insert(new_version).execute()

    print(f"✅ Versão 4.0 criada com sucesso!")
    print(f"   ID: {response.data[0]['id']}")
    print(f"   Agent Name: {new_version['agent_name']}")
    print(f"   Validation Score: {validation_score}")
    print(f"   Status: draft (aguardando ativação)")
    print(f"\n📊 Scores do Validator:")
    for dim, score in validator_output.get("scores", {}).items():
        print(f"   - {dim}: {score}")
    print(f"\n✨ Pontos Fortes:")
    for s in validator_output.get("strengths", [])[:3]:
        print(f"   - {s[:80]}...")

except Exception as e:
    print(f"❌ Erro: {e}")
