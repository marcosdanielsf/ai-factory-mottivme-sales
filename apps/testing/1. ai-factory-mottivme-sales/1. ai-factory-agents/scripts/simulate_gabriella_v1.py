#!/usr/bin/env python3
"""
Simulação Isabella - Atendimento Dra. Gabriella Rossmann v1.4.2
Testa: PNL, perguntas duplas, coleta de dados, objeções de preço
"""

import os
import json
import httpx
from datetime import datetime
from typing import List, Dict

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')
LOCATION_ID = "xliub5H5pQ4QcDeKHc6F"

# Personas de leads para teste
LEAD_PERSONAS = [
    {
        "id": "ana_emagrecimento",
        "name": "Ana",
        "profile": "Mulher 35 anos, quer emagrecer, já tentou várias dietas",
        "opening": "Oi! Vi o perfil da Dra. Gabriella no Instagram. Quero saber sobre o atendimento.",
        "style": "Curiosa, faz perguntas, quer entender antes de decidir",
        "objections": ["Quanto custa?", "É caro..."],
        "will_schedule": True
    },
    {
        "id": "carlos_preco",
        "name": "Carlos",
        "profile": "Homem 42 anos, foca em preço, quer saber valores logo",
        "opening": "Boa tarde, quanto custa a consulta?",
        "style": "Direto, impaciente, foca em preço",
        "objections": ["Tá caro", "Tem desconto?", "Divide em quantas vezes?"],
        "will_schedule": False
    },
    {
        "id": "maria_qualidade_vida",
        "name": "Maria",
        "profile": "Mulher 48 anos, cansada, sem energia, busca qualidade de vida",
        "opening": "Olá! Estou muito cansada ultimamente, sem energia pra nada. Será que a Dra. pode me ajudar?",
        "style": "Vulnerável, busca acolhimento, conta problemas",
        "objections": ["Já fui em vários médicos", "Nada funciona"],
        "will_schedule": True
    },
    {
        "id": "joao_indicacao",
        "name": "João",
        "profile": "Homem 38 anos, veio por indicação de amigo",
        "opening": "E aí! Meu amigo Pedro fez tratamento com a Dra. e recomendou muito. Quero saber mais.",
        "style": "Confiante pela indicação, quer confirmar que é bom",
        "objections": ["Quantas consultas precisa?"],
        "will_schedule": True
    },
    {
        "id": "lucia_resistente",
        "name": "Lúcia",
        "profile": "Mulher 52 anos, cética, já gastou muito com tratamentos",
        "opening": "Oi. Já gastei muito dinheiro com nutricionista e nada funcionou. O que tem de diferente?",
        "style": "Cética, desconfiada, precisa de prova",
        "objections": ["Por que seria diferente?", "Vou pensar"],
        "will_schedule": False
    }
]

def get_system_prompt() -> str:
    """Busca o prompt ativo do Supabase"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }

    with httpx.Client(timeout=30) as client:
        response = client.get(
            f"{SUPABASE_URL}/rest/v1/agent_versions",
            params={
                "select": "system_prompt,version",
                "location_id": f"eq.{LOCATION_ID}",
                "is_active": "eq.true"
            },
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            if data:
                print(f"Loaded prompt version: {data[0]['version']}")
                return data[0]['system_prompt']

    raise Exception("Could not load system prompt")

def call_groq(messages: List[Dict], system_prompt: str = None) -> str:
    """Chama a API do Groq"""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": full_messages,
        "temperature": 0.7,
        "max_tokens": 500
    }

    with httpx.Client(timeout=60) as client:
        response = client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        else:
            raise Exception(f"Groq API error: {response.status_code} - {response.text}")

def simulate_lead(persona: Dict, system_prompt: str) -> str:
    """Gera resposta do lead simulado"""
    lead_system = f"""Você é {persona['name']}, um lead simulado.
Perfil: {persona['profile']}
Estilo: {persona['style']}
Objeções típicas: {', '.join(persona['objections'])}

REGRAS:
- Responda como um paciente REAL responderia no WhatsApp
- Mensagens curtas e naturais (1-3 frases)
- Use suas objeções naturalmente durante a conversa
- Se o atendimento for bom e você estiver convencido ({persona['will_schedule']}), forneça dados
- Se pedirem CPF: forneça 123.456.789-00
- Se pedirem email: forneça {persona['name'].lower()}@email.com
- Se pedirem telefone: forneça 66999887766
- Reaja naturalmente às respostas
- will_schedule: {persona['will_schedule']} (se True, tenda a agendar após 5-7 trocas)
- Se will_schedule=False, mantenha objeções até o fim"""

    return lead_system

def run_simulation(persona: Dict, system_prompt: str, max_turns: int = 8) -> Dict:
    """Roda uma simulação completa"""
    print(f"\n{'='*60}")
    print(f"SIMULAÇÃO: {persona['name']} ({persona['id']})")
    print(f"{'='*60}")

    conversation = []
    lead_system = simulate_lead(persona, system_prompt)

    # Primeira mensagem do lead
    lead_msg = persona['opening']
    conversation.append({"role": "lead", "content": lead_msg})
    print(f"\n👤 LEAD: {lead_msg}")

    for turn in range(max_turns):
        # SDR responde
        sdr_messages = []
        for msg in conversation:
            role = "assistant" if msg["role"] == "sdr" else "user"
            sdr_messages.append({"role": role, "content": msg["content"]})

        sdr_response = call_groq(sdr_messages, system_prompt)
        conversation.append({"role": "sdr", "content": sdr_response})
        print(f"\n🤖 ISABELLA: {sdr_response}")

        # Verifica se conversa deve terminar
        if any(end in sdr_response.lower() for end in ["agendado", "confirmado", "aguardo seu pix", "chave pix"]):
            break

        # Lead responde
        lead_messages = []
        for msg in conversation:
            role = "assistant" if msg["role"] == "lead" else "user"
            lead_messages.append({"role": role, "content": msg["content"]})

        lead_response = call_groq(lead_messages, lead_system)
        conversation.append({"role": "lead", "content": lead_response})
        print(f"\n👤 LEAD: {lead_response}")

        # Verifica se lead encerrou
        if any(end in lead_response.lower() for end in ["obrigad", "valeu", "até", "tchau"]):
            if "vou pensar" not in lead_response.lower():
                break

    # Determina outcome
    outcome = determine_outcome(conversation, persona)

    return {
        "persona": persona["id"],
        "persona_name": persona["name"],
        "outcome": outcome,
        "turn_count": len([m for m in conversation if m["role"] == "sdr"]),
        "conversation": conversation
    }

def determine_outcome(conversation: List[Dict], persona: Dict) -> str:
    """Determina o resultado da conversa"""
    all_text = " ".join([m["content"].lower() for m in conversation])

    # Verifica agendamento
    if any(word in all_text for word in ["agendado", "confirmado", "pix", "cpf"]):
        if "cpf" in all_text and any(char.isdigit() for char in all_text):
            return "scheduled"

    # Verifica interesse
    if any(word in all_text for word in ["vou pensar", "vou falar", "depois"]):
        return "pending"

    # Verifica se mostrou interesse
    lead_msgs = [m["content"].lower() for m in conversation if m["role"] == "lead"]
    if any("interessad" in msg or "quero" in msg or "gostei" in msg for msg in lead_msgs):
        return "interested"

    return "lost"

def score_conversation(conversation: List[Dict], persona: Dict, outcome: str) -> Dict:
    """Pontua a conversa baseado nos critérios"""
    scores = {
        "double_questions": 100,     # Penaliza perguntas duplas
        "presuppositions": 100,      # Usa "quando" ao invés de "se"
        "max_3_lines": 100,          # Máximo 3 linhas por mensagem
        "price_handling": 100,       # Não divide preço, reframe elegante
        "data_collection": 100,      # Coleta dados antes de gerar link
        "pnl_techniques": 100,       # Usa Yes Set, comandos embutidos
        "outcome_bonus": 0
    }

    sdr_messages = [m["content"] for m in conversation if m["role"] == "sdr"]
    all_sdr_text = " ".join(sdr_messages).lower()

    # 1. Perguntas duplas (mais de 1 "?" por mensagem)
    double_question_count = 0
    for msg in sdr_messages:
        question_marks = msg.count("?")
        if question_marks > 1:
            double_question_count += 1
    scores["double_questions"] = max(0, 100 - double_question_count * 25)

    # 2. Pressuposições (usa "quando" ao invés de "se")
    se_count = all_sdr_text.count(" se você") + all_sdr_text.count(" se vc")
    quando_count = all_sdr_text.count("quando você") + all_sdr_text.count("quando vc")
    if se_count > quando_count:
        scores["presuppositions"] = max(0, 100 - (se_count - quando_count) * 20)

    # 3. Máximo 3 linhas por mensagem
    long_messages = 0
    for msg in sdr_messages:
        lines = msg.count("\n") + 1
        if lines > 4:
            long_messages += 1
    scores["max_3_lines"] = max(0, 100 - long_messages * 20)

    # 4. Tratamento de preço (não divide por dia/hora)
    bad_price_phrases = ["por dia", "por hora", "centavos", "r$ 5", "r$ 10"]
    for phrase in bad_price_phrases:
        if phrase in all_sdr_text:
            scores["price_handling"] -= 30

    # Verifica se oferece desconto (proibido)
    if "desconto" in all_sdr_text and "não" not in all_sdr_text:
        scores["price_handling"] -= 30

    scores["price_handling"] = max(0, scores["price_handling"])

    # 5. Coleta de dados
    data_points = 0
    if "cpf" in all_sdr_text:
        data_points += 1
    if "nome" in all_sdr_text and "completo" in all_sdr_text:
        data_points += 1
    if outcome == "scheduled":
        scores["data_collection"] = min(100, data_points * 50)
    else:
        scores["data_collection"] = 80  # Não penaliza se não fechou

    # 6. Técnicas PNL
    pnl_indicators = ["imagina", "visualiza", "sentir", "energia", "leveza"]
    pnl_count = sum(1 for word in pnl_indicators if word in all_sdr_text)
    scores["pnl_techniques"] = min(100, 50 + pnl_count * 15)

    # 7. Bonus por outcome
    outcome_bonus = {
        "scheduled": 20,
        "interested": 10,
        "pending": 0,
        "lost": -10
    }
    scores["outcome_bonus"] = outcome_bonus.get(outcome, 0)

    # Calcula score final
    weights = {
        "double_questions": 0.20,
        "presuppositions": 0.15,
        "max_3_lines": 0.15,
        "price_handling": 0.20,
        "data_collection": 0.15,
        "pnl_techniques": 0.05,
        "outcome_bonus": 0.10
    }

    final_score = sum(scores[k] * weights[k] for k in weights)
    final_score = max(0, min(100, final_score))

    return {
        "final_score": round(final_score, 1),
        "breakdown": scores,
        "double_question_count": double_question_count,
        "long_message_count": long_messages
    }

def main():
    print("="*60)
    print("  SIMULAÇÃO ISABELLA - DRA. GABRIELLA ROSSMANN")
    print("="*60)

    # Carrega prompt
    system_prompt = get_system_prompt()
    print(f"Prompt loaded: {len(system_prompt)} chars")

    results = []

    for persona in LEAD_PERSONAS:
        try:
            sim_result = run_simulation(persona, system_prompt)
            scores = score_conversation(
                sim_result["conversation"],
                persona,
                sim_result["outcome"]
            )
            sim_result["score"] = scores["final_score"]
            sim_result["metrics"] = scores
            results.append(sim_result)

            print(f"\n📊 SCORE: {scores['final_score']}/100")
            print(f"   Outcome: {sim_result['outcome']}")
            print(f"   Perguntas duplas: {scores['double_question_count']}x")
            print(f"   Msgs longas: {scores['long_message_count']}x")

        except Exception as e:
            print(f"\n❌ ERRO em {persona['name']}: {e}")
            results.append({
                "persona": persona["id"],
                "persona_name": persona["name"],
                "outcome": "error",
                "error": str(e)
            })

    # Sumário
    print("\n" + "="*60)
    print("  SUMÁRIO FINAL")
    print("="*60)

    valid_results = [r for r in results if "score" in r]

    if valid_results:
        avg_score = sum(r["score"] for r in valid_results) / len(valid_results)
        outcomes = {
            "scheduled": len([r for r in valid_results if r["outcome"] == "scheduled"]),
            "interested": len([r for r in valid_results if r["outcome"] == "interested"]),
            "pending": len([r for r in valid_results if r["outcome"] == "pending"]),
            "lost": len([r for r in valid_results if r["outcome"] == "lost"])
        }

        # Métricas agregadas
        total_double_questions = sum(r["metrics"]["double_question_count"] for r in valid_results)
        total_long_msgs = sum(r["metrics"]["long_message_count"] for r in valid_results)

        print(f"\n📈 Score Médio: {avg_score:.1f}/100")
        print(f"\n📊 Resultados:")
        print(f"   Agendamentos: {outcomes['scheduled']}/{len(valid_results)}")
        print(f"   Interessados: {outcomes['interested']}/{len(valid_results)}")
        print(f"   Pendentes: {outcomes['pending']}/{len(valid_results)}")
        print(f"   Perdidos: {outcomes['lost']}/{len(valid_results)}")

        print(f"\n🔍 Métricas de Qualidade:")
        print(f"   Perguntas duplas: {total_double_questions}x {'⚠️' if total_double_questions > 3 else '✅'}")
        print(f"   Mensagens longas (>3 linhas): {total_long_msgs}x {'⚠️' if total_long_msgs > 2 else '✅'}")

        print(f"\n👤 Por Persona:")
        for r in valid_results:
            status = "✅" if r["outcome"] == "scheduled" else "⚠️" if r["outcome"] in ["interested", "pending"] else "❌"
            print(f"   {status} {r['persona_name']}: {r['score']:.0f} pts | {r['outcome']} | {r['turn_count']}t")

    # Salva resultado
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "prompt_version": "v1.4.2",
        "location": "Dra. Gabriella Rossmann - Atendimento",
        "overall_score": round(avg_score, 1) if valid_results else 0,
        "outcomes": outcomes if valid_results else {},
        "simulations": results,
        "aggregate_metrics": {
            "total_double_questions": total_double_questions if valid_results else 0,
            "total_long_messages": total_long_msgs if valid_results else 0
        }
    }

    output_path = f"/Users/marcosdaniels/Projects/mottivme/ai-factory-mottivme-sales/1. ai-factory-agents/simulation_gabriella_{timestamp}.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Resultado salvo: simulation_gabriella_{timestamp}.json")

    return 0

if __name__ == "__main__":
    exit(main())
