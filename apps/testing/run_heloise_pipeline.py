"""
🚀 AI Factory - Pipeline para Dra. Heloise Silvestre
========================================================

Dados extraídos da call de kickoff em 23/12/2025
Localização: Santa Rosa, RS
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
# 📝 DADOS DA DRA. HELOISE SILVESTRE
# ============================================================

HELOISE_DATA = {
    # IDs (preencher após criação no GHL)
    "client_id": None,  # UUID do cliente no Supabase
    "location_id": "",  # Location ID do GHL da Heloise (diferente do Thauan)

    # Informações do Negócio
    "business_info": {
        "name": "Dra. Heloise Silvestre",
        "segment": "Saúde",
        "subsegment": "Emagrecimento e Hormonologia",
        "city": "Santa Rosa",
        "state": "RS",
        "target_audience": "80% mulheres 35-60 anos buscando emagrecimento e equilíbrio hormonal, 25% homens empresários querendo mais energia e disposição",
        "main_services": [
            "Consulta de Emagrecimento",
            "Terapia Hormonal (implantes e injetáveis)",
            "Terapia Injetável (vitaminas e suplementos)",
            "Acompanhamento de Composição Corporal"
        ],
        "pricing_range": "R$ 2.500-15.000/mês de tratamento",
        "differentials": [
            "Tratamento personalizado 360°",
            "Emagrecer não é sofrer - abordagem prazerosa",
            "Foco em saúde, não só estética",
            "Acompanhamento contínuo com bioimpedância",
            "Atendimento presencial e online (até internacional)",
            "Todas as pessoas merecem brilhar"
        ]
    },

    # Configuração do Agente
    "agent_config": {
        "agent_name": "Ana",
        "tone": "Acolhedor, empático, inspirador, profissional mas próximo",
        "communication_style": "Usa conceito de 'brilho' - todas merecem brilhar, quando brilhamos iluminamos os outros. Emoji: ✨. Abreviações: VC, TB. Nunca usa senhor/senhora (exceto 60+). Comunicação calorosa mas menos gírias que Thauan.",
        "goals": [
            "Qualificar interesse (emagrecimento vs hormônios)",
            "Identificar sintomas e dores da paciente",
            "Educar sobre abordagem holística",
            "Agendar consulta de avaliação (R$ 800)"
        ]
    },

    # Exemplo de conversa típica
    "raw_contact": {
        "id": "sample-contact-heloise",
        "firstName": "Patricia",
        "lastName": "Oliveira",
        "phone": "+5555999999999",
        "email": "patricia@email.com",
        "source": "Instagram",
        "tags": ["LEAD", "HORMONIOS"]
    },
    "raw_conversation": [
        {"direction": "inbound", "body": "Oi, vi o post sobre hormônios e me interessei", "dateAdded": "2024-01-15T10:00:00Z"},
        {"direction": "outbound", "body": "Oi Patricia! Que bom receber sua mensagem ✨ Como vc está? Me conta, o que te chamou atenção no post?", "dateAdded": "2024-01-15T10:02:00Z"},
        {"direction": "inbound", "body": "Estou sentindo muito cansaço, não durmo bem e meu humor está péssimo. Tenho 52 anos e acho que pode ser menopausa", "dateAdded": "2024-01-15T10:05:00Z"},
        {"direction": "outbound", "body": "Entendo completamente, Patricia. Esses sintomas são muito comuns nessa fase e vc não precisa passar por isso sozinha. A reposição hormonal bem feita pode transformar como vc se sente - vc merece voltar a brilhar! ✨ Vamos marcar uma consulta para eu entender seu contexto e montar um plano personalizado pra vc?", "dateAdded": "2024-01-15T10:08:00Z"},
        {"direction": "inbound", "body": "Qual o valor da consulta?", "dateAdded": "2024-01-15T10:10:00Z"},
        {"direction": "outbound", "body": "A consulta de avaliação é R$ 800. É uma consulta completa de 1 hora onde vou entender todo seu histórico, seus sintomas, pedir exames se necessário e montar um plano só seu. Cada pessoa é única e merece um tratamento único tb! Qual dia fica melhor pra vc? ✨", "dateAdded": "2024-01-15T10:12:00Z"}
    ],

    # Detalhes do negócio
    "business_details": {
        "address": "Santa Rosa, RS",
        "hours": "Segunda a Sexta, 8h às 12h e 14h às 18h (AI responde 24h)",
        "phone": "(55) 99999-9999",
        "consultation_price": "R$ 800",
        "minimum_investment": "R$ 4.000 (2 meses) ou R$ 2.500/mês mínimo",
        "payment_methods": "30% sinal via PIX, restante via Asaas (cartão/boleto)",
        "calendar_link": ""  # Preencher depois
    },

    # Perfil NÃO ideal (desqualificar)
    "non_ideal_profile": """
- Busca "hormônio bioidêntico" ou "medicina integrativa" (termos específicos)
- Quer só ficar "bombado" sem foco em saúde
- Primeira pergunta é "quanto custa o tratamento" (foco só em preço)
- Questiona muito, tem muito medo, pesquisa tudo no Google
- Quer barganhar preço (palavra "desconto" é abolida)
- Quer fazer só parte do tratamento, não aceita protocolo completo
- Idade abaixo de 30 anos (exceto filhos de pacientes ou empreendedores)
""",

    # Objeções comuns
    "common_objections": """
- "Está caro": A consulta inclui avaliação completa de 1h, análise de composição corporal, solicitação de exames e plano 100% personalizado. É um investimento na sua saúde, que é seu maior patrimônio.

- "Preciso pensar": Entendo! Posso te ajudar com mais alguma informação? Me conta qual sua maior dúvida.

- "Já tentei de tudo e nada funciona": Justamente por isso a abordagem é diferente! A gente olha o 360° - metabolismo, hormônios, rotina, sono. Não é dieta restritiva, é tratamento médico personalizado. Emagrecer não é sofrer!

- "Meu outro médico disse que hormônio faz mal": Se ele disse isso, está desatualizado. Todos os estudos científicos mostram o contrário quando feito corretamente. Mas respeito sua preocupação - na consulta explico tudo com base em ciência.

- "Quero fazer só uma parte do tratamento": Se fizer só parte, o resultado vai ser parcial. E aí vc vai achar que não funciona, quando na verdade é pq não seguiu o protocolo completo. Prefiro que faça direito para ter o resultado que vc merece.

- "Tenho medo de hormônio": Entendo seu receio. Na consulta vou te explicar tudo com calma, baseado em ciência. A reposição hormonal bem indicada e acompanhada é segura e pode transformar sua qualidade de vida.
""",

    # Dores do paciente
    "patient_pain_points": """
MULHERES (emagrecimento):
- Baixa autoestima, não gosta do próprio corpo
- Roupa não cabe, não consegue comprar o que quer
- Vergonha de tirar foto, ir à praia
- Já tentou de tudo e nada funciona
- Cansaço extremo, sem energia

MULHERES (hormônios/menopausa):
- "Não me sinto mais eu mesma"
- Insônia, irritabilidade, oscilação de humor
- Ondas de calor, suor noturno
- Perda de libido, ressecamento vaginal
- Ganho de peso inexplicável
- Perda de brilho, não se reconhece mais

HOMENS (empresários):
- "Morto, cansado, gordo" - quer produtividade
- Perda de libido, disfunção erétil
- Falta de energia para trabalhar
- Ganho de peso abdominal
- Quer longevidade e performance
""",

    # Expressões e estilo Heloise
    "personality_expressions": {
        "greetings": ["Oi!", "Olá!", "Que bom receber sua mensagem!", "Como vc está?"],
        "confirmations": ["Perfeito!", "Ótimo!", "Maravilha!", "Vamos lá!"],
        "signature_phrases": ["Todas as pessoas merecem brilhar ✨", "Quando brilhamos, iluminamos os outros", "Vc merece voltar a brilhar"],
        "emojis": ["✨", "💫", "⭐"],
        "avoid": ["senhor", "senhora (exceto 60+)", "muito formal", "gírias pesadas"],
        "abbreviations": ["vc", "tb", "pq", "q"]
    }
}


# ============================================================
# 🔧 EXECUÇÃO DO PIPELINE
# ============================================================

async def run_pipeline():
    """Executa o pipeline full e retorna o resultado"""

    print("\n" + "="*60)
    print("🚀 INICIANDO PIPELINE PARA DRA. HELOISE SILVESTRE")
    print("="*60)

    orchestrator = AgentOrchestrator(config_path="config.yaml")

    # Preparar input data
    input_data = {
        "contact_id": HELOISE_DATA["raw_contact"]["id"],
        "location_id": HELOISE_DATA["location_id"],
        "raw_contact": HELOISE_DATA["raw_contact"],
        "raw_conversation": HELOISE_DATA["raw_conversation"],
        "business_config": {
            "company_name": HELOISE_DATA["business_info"]["name"],
            "service": ", ".join(HELOISE_DATA["business_info"]["main_services"]),
            "ticket": HELOISE_DATA["business_info"]["pricing_range"],
            "target_audience": HELOISE_DATA["business_info"]["target_audience"],
            "addresses": f"{HELOISE_DATA['business_info']['city']}, {HELOISE_DATA['business_info']['state']}",
            "hours": HELOISE_DATA["business_details"]["hours"],
            "phone": HELOISE_DATA["business_details"]["phone"],
            "consultation_price": HELOISE_DATA["business_details"]["consultation_price"],
            "minimum_investment": HELOISE_DATA["business_details"]["minimum_investment"],
            "payment_methods": HELOISE_DATA["business_details"]["payment_methods"],
            "calendar_link": HELOISE_DATA["business_details"]["calendar_link"],
            "differentials": "\n".join([f"- {d}" for d in HELOISE_DATA["business_info"]["differentials"]]),
            "common_objections": HELOISE_DATA["common_objections"],
            "non_ideal_profile": HELOISE_DATA["non_ideal_profile"],
            "patient_pain_points": HELOISE_DATA["patient_pain_points"],
            "personality_expressions": json.dumps(HELOISE_DATA["personality_expressions"], ensure_ascii=False),
            "communication_style": HELOISE_DATA["agent_config"]["communication_style"]
        },
        "agent_name": HELOISE_DATA["agent_config"]["agent_name"]
    }

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

    generator_output = pipeline_result.final_output.get("PromptGenerator", {})
    validator_output = pipeline_result.final_output.get("Validator", {})
    validation_score = validator_output.get("overall_score", 0)

    new_version = {
        "client_id": HELOISE_DATA.get("client_id"),
        "version": "1.0",
        "status": "draft",
        "location_id": HELOISE_DATA["location_id"],
        "agent_name": generator_output.get("agent_name", HELOISE_DATA["agent_config"]["agent_name"]),
        "system_prompt": generator_output.get("system_prompt", ""),
        "tools_config": generator_output.get("tools_config", {}),
        "business_config": HELOISE_DATA["business_info"],
        "personality_config": {
            "tone": generator_output.get("metadata", {}).get("tone", HELOISE_DATA["agent_config"]["tone"]),
            "target_audience": HELOISE_DATA["business_info"]["target_audience"],
            "expressions": HELOISE_DATA["personality_expressions"]
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
            "source": "ai-factory-agents",
            "client": "Dra. Heloise Silvestre",
            "location": "Santa Rosa, RS"
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
    filename = f"outputs/heloise_v1_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

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

        prompt = result.final_output.get("PromptGenerator", {}).get("system_prompt", "")
        print("\n" + "="*60)
        print("📄 PROMPT GERADO (primeiros 2000 chars):")
        print("="*60)
        print(prompt[:2000])
        print("...")
    else:
        print(f"\n❌ Pipeline falhou: {result.errors}")

    print("\n" + "="*60)
    print("✅ PROCESSO CONCLUÍDO - DRA. HELOISE")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
