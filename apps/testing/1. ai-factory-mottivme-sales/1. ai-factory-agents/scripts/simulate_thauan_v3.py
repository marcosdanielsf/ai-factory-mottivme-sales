#!/usr/bin/env python3
"""
Simulação Maya - Dr. Thauan Santos v3.0.0
Testa: emojis proibidos, menção das 2 clínicas, mensagens únicas, coleta de dados
"""

import os
import json
import httpx
from datetime import datetime
from typing import List, Dict

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')
LOCATION_ID = "Rre0WqSlmAPmIrURgiMf"

# Personas de leads para teste
LEAD_PERSONAS = [
    {
        "id": "carla_efeito_sanfona",
        "name": "Carla",
        "profile": "Mulher 42 anos, efeito sanfona há anos, já tentou várias dietas",
        "opening": "Oi! Vi o perfil do Dr. Thauan no Instagram. To cansada de emagrecer e engordar de novo...",
        "style": "Desabafa bastante, quer solução definitiva",
        "objections": ["Já tentei de tudo", "Será que funciona pra mim?"],
        "asks_location": True
    },
    {
        "id": "patricia_sem_energia",
        "name": "Patrícia",
        "profile": "Mulher 38 anos, exausta, sem energia, suspeita de problema hormonal",
        "opening": "Boa tarde! Acordo cansada e durmo cansada. Será que é hormônio?",
        "style": "Preocupada com saúde, quer entender a causa",
        "objections": ["Meu médico disse que é normal", "Exames deram normais"],
        "asks_location": True
    },
    {
        "id": "marcos_resistente",
        "name": "Marcos",
        "profile": "Homem 45 anos, resistente, quer saber preço logo",
        "opening": "E aí, quanto custa a consulta?",
        "style": "Direto, impaciente, foca em preço",
        "objections": ["Tá caro", "Vou pensar"],
        "asks_location": False
    },
    {
        "id": "fernanda_menopausa",
        "name": "Fernanda",
        "profile": "Mulher 52 anos, menopausa, ondas de calor, ganhou peso",
        "opening": "Oi! To na menopausa e engordei 15kg. Nada funciona mais...",
        "style": "Vulnerável, busca acolhimento, tem urgência",
        "objections": ["Minha gineco disse que é normal na menopausa"],
        "asks_location": True
    },
    {
        "id": "ricardo_curioso",
        "name": "Ricardo",
        "profile": "Homem 35 anos, curioso sobre bioimpedância, pesquisador",
        "opening": "Vi que vocês fazem bioimpedância. Como funciona isso?",
        "style": "Analítico, faz muitas perguntas técnicas",
        "objections": ["Preciso pesquisar mais", "Vou falar com minha esposa"],
        "asks_location": True
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
- Se perguntarem sobre localização e asks_location=True, pergunte "onde fica a clínica?"
- Se o atendimento for bom e você estiver convencido, forneça dados (email, CPF, telefone)
- Se pedirem CPF: forneça um fictício como 123.456.789-00
- Se pedirem email: forneça {persona['name'].lower()}@email.com
- Se pedirem telefone: forneça 51999887766
- Reaja naturalmente às respostas
- Após 6-8 trocas, tenda a agendar se o atendimento foi bom
- asks_location: {persona.get('asks_location', False)}"""

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
        print(f"\n🤖 MAYA: {sdr_response}")

        # Verifica se conversa deve terminar
        if any(end in sdr_response.lower() for end in ["agendado", "confirmado", "até logo", "até mais"]):
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
        if any(end in lead_response.lower() for end in ["obrigad", "valeu", "até", "tchau", "vou pensar"]):
            if "vou pensar" not in lead_response.lower():
                break

    # Determina outcome
    outcome = determine_outcome(conversation)

    return {
        "persona": persona["id"],
        "persona_name": persona["name"],
        "outcome": outcome,
        "turn_count": len([m for m in conversation if m["role"] == "sdr"]),
        "conversation": conversation
    }

def determine_outcome(conversation: List[Dict]) -> str:
    """Determina o resultado da conversa"""
    all_text = " ".join([m["content"].lower() for m in conversation])

    # Verifica agendamento
    if any(word in all_text for word in ["agendado", "confirmado", "marcado", "te espero"]):
        return "scheduled"

    # Verifica se forneceu dados
    if "cpf" in all_text and "@" in all_text:
        return "scheduled"

    # Verifica interesse
    if any(word in all_text for word in ["vou pensar", "falar com", "pesquisar"]):
        return "pending"

    # Verifica se mostrou interesse
    lead_msgs = [m["content"].lower() for m in conversation if m["role"] == "lead"]
    if any("interessad" in msg or "quero" in msg for msg in lead_msgs):
        return "interested"

    return "lost"

def score_conversation(conversation: List[Dict], persona: Dict, outcome: str) -> Dict:
    """Pontua a conversa baseado nos critérios do v3.0.0"""
    scores = {
        "forbidden_emoji": 100,      # Não usar ⭐ ou 🔥
        "both_clinics": 100,         # Mencionar Novo Hamburgo + Santa Rosa
        "single_message": 100,       # Uma mensagem por vez
        "data_collection": 100,      # Coleta CPF, email, preferência unidade
        "tone": 100,                 # Tom adequado (querido/a, tudo 200%)
        "outcome_bonus": 0
    }

    sdr_messages = [m["content"] for m in conversation if m["role"] == "sdr"]
    all_sdr_text = " ".join(sdr_messages).lower()

    # 1. Emojis proibidos (⭐ e 🔥)
    forbidden_count = 0
    for msg in sdr_messages:
        if "⭐" in msg or "🔥" in msg:
            forbidden_count += 1
    scores["forbidden_emoji"] = max(0, 100 - forbidden_count * 50)

    # 2. Menciona ambas clínicas quando perguntado sobre localização
    if persona.get("asks_location", False):
        location_mentioned = False
        for i, msg in enumerate(conversation):
            if msg["role"] == "lead" and any(loc in msg["content"].lower() for loc in ["onde", "local", "clínica", "clinica", "fica"]):
                # Verifica próximas respostas do SDR
                for j in range(i+1, min(i+3, len(conversation))):
                    if conversation[j]["role"] == "sdr":
                        sdr_resp = conversation[j]["content"].lower()
                        has_nh = "novo hamburgo" in sdr_resp
                        has_sr = "santa rosa" in sdr_resp
                        has_online = "online" in sdr_resp
                        if has_nh and has_sr:
                            location_mentioned = True
                            break
                        elif has_nh or has_sr:
                            # Só uma clínica = parcial
                            scores["both_clinics"] = 50
                            location_mentioned = True
                            break
        if not location_mentioned and persona.get("asks_location"):
            # Não mencionou localização quando deveria
            scores["both_clinics"] = 70  # Não penaliza muito se não perguntaram

    # 3. Mensagem única (não enviar múltiplas seguidas)
    # Na simulação isso é controlado, mas verificamos se há indicação de múltiplas
    multiple_indicators = ["também quero dizer", "ah, e outra coisa", "ps:", "p.s."]
    for indicator in multiple_indicators:
        if indicator in all_sdr_text:
            scores["single_message"] -= 20

    # 4. Coleta de dados
    data_points = 0
    if "cpf" in all_sdr_text:
        data_points += 1
    if any(word in all_sdr_text for word in ["email", "e-mail"]):
        data_points += 1
    if any(word in all_sdr_text for word in ["novo hamburgo", "santa rosa", "online", "qual unidade", "qual formato"]):
        data_points += 1

    if outcome == "scheduled":
        scores["data_collection"] = min(100, data_points * 35)
    else:
        scores["data_collection"] = 80  # Não penaliza se não fechou

    # 5. Tom adequado
    tone_words = ["querido", "querida", "200%", "meu povo"]
    tone_count = sum(1 for word in tone_words if word in all_sdr_text)
    scores["tone"] = min(100, 60 + tone_count * 15)

    # 6. Bonus por outcome
    outcome_bonus = {
        "scheduled": 20,
        "interested": 10,
        "pending": 0,
        "lost": -10
    }
    scores["outcome_bonus"] = outcome_bonus.get(outcome, 0)

    # Calcula score final
    weights = {
        "forbidden_emoji": 0.25,
        "both_clinics": 0.25,
        "single_message": 0.15,
        "data_collection": 0.15,
        "tone": 0.10,
        "outcome_bonus": 0.10
    }

    final_score = sum(scores[k] * weights[k] for k in weights)
    final_score = max(0, min(100, final_score))

    return {
        "final_score": round(final_score, 1),
        "breakdown": scores,
        "forbidden_emoji_count": forbidden_count,
        "mentioned_both_clinics": scores["both_clinics"] == 100
    }

def main():
    print("="*60)
    print("  SIMULAÇÃO MAYA - DR. THAUAN SANTOS")
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
            print(f"   Emoji proibido: {scores['breakdown']['forbidden_emoji']}")
            print(f"   Ambas clínicas: {scores['breakdown']['both_clinics']}")

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
        total_forbidden = sum(r["metrics"]["forbidden_emoji_count"] for r in valid_results)
        both_clinics_count = sum(1 for r in valid_results if r["metrics"]["mentioned_both_clinics"])

        print(f"\n📈 Score Médio: {avg_score:.1f}/100")
        print(f"\n📊 Resultados:")
        print(f"   Agendamentos: {outcomes['scheduled']}/{len(valid_results)}")
        print(f"   Interessados: {outcomes['interested']}/{len(valid_results)}")
        print(f"   Pendentes: {outcomes['pending']}/{len(valid_results)}")
        print(f"   Perdidos: {outcomes['lost']}/{len(valid_results)}")

        print(f"\n🔍 Métricas Específicas v3.0.0:")
        print(f"   Emojis proibidos (⭐🔥): {total_forbidden}x {'✅' if total_forbidden == 0 else '⚠️'}")
        print(f"   Mencionou ambas clínicas: {both_clinics_count}/{len([p for p in LEAD_PERSONAS if p.get('asks_location')])}")

        print(f"\n👤 Por Persona:")
        for r in valid_results:
            status = "✅" if r["outcome"] == "scheduled" else "⚠️" if r["outcome"] in ["interested", "pending"] else "❌"
            print(f"   {status} {r['persona_name']}: {r['score']:.0f} pts | {r['outcome']} | {r['turn_count']}t")

    # Salva resultado
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "prompt_version": "v3.0.0",
        "location": "Dr. Thauan Santos - Instituto Abadi Santos",
        "overall_score": round(avg_score, 1) if valid_results else 0,
        "outcomes": outcomes if valid_results else {},
        "simulations": results,
        "aggregate_metrics": {
            "total_forbidden_emoji": total_forbidden if valid_results else 0,
            "both_clinics_mentioned": both_clinics_count if valid_results else 0
        }
    }

    output_path = f"/Users/marcosdaniels/Projects/mottivme/ai-factory-mottivme-sales/1. ai-factory-agents/simulation_thauan_{timestamp}.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Resultado salvo: simulation_thauan_{timestamp}.json")

    return 0

if __name__ == "__main__":
    exit(main())
