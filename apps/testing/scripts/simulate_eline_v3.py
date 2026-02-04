#!/usr/bin/env python3
"""
Simulador de Conversas - Dra. Eline Lobo v3.0.0
Testa o prompt com 5 personas de médicos diferentes.
"""

import os
import json
import httpx
from datetime import datetime
from typing import List, Dict, Any

# Config
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')
LOCATION_ID = "pFHwENFUxjtiON94jn2k"

# Personas de médicos
PERSONAS = {
    "joao_curioso": {
        "name": "Dr. João",
        "specialty": "Clínico Geral",
        "description": "Médico curioso querendo entrar na área de hormônios",
        "style": "Faz muitas perguntas, quer entender tudo antes de decidir",
        "objections": ["Quanto custa?", "Como funciona?", "Precisa de certificação?"],
        "budget": "disponível",
        "email": "joao.medico@gmail.com",
        "phone": "11999887766"
    },
    "carla_cetica": {
        "name": "Dra. Carla",
        "specialty": "Endocrinologista",
        "description": "Já fez outros cursos de hormônios e ficou decepcionada",
        "style": "Cética, questiona tudo, compara com outros cursos",
        "objections": ["Já fiz curso e não aprendi nada", "Qual o diferencial?", "É só mais do mesmo?"],
        "budget": "restrito",
        "email": "carla.endo@hotmail.com",
        "phone": "21988776655"
    },
    "pedro_ocupado": {
        "name": "Dr. Pedro",
        "specialty": "Ginecologista",
        "description": "Muito ocupado, sem tempo, responde rápido",
        "style": "Respostas curtas (sim, não, ok), impaciente",
        "objections": ["Não tenho tempo", "Manda por email", "Quanto tempo dura?"],
        "budget": "disponível",
        "email": "pedro.gineco@uol.com.br",
        "phone": "31977665544"
    },
    "fernanda_medo": {
        "name": "Dra. Fernanda",
        "specialty": "Clínica Geral",
        "description": "Tem medo de prescrever hormônios por causa dos riscos cardíacos",
        "style": "Insegura, faz perguntas sobre riscos, precisa de segurança",
        "objections": ["E se der problema cardíaco?", "Tenho medo de prescrever", "E se o paciente processar?"],
        "budget": "disponível",
        "email": "fernanda.med@gmail.com",
        "phone": "41966554433"
    },
    "lucas_pronto": {
        "name": "Dr. Lucas",
        "specialty": "Nutrólogo",
        "description": "Já decidiu que quer fazer, só quer agendar",
        "style": "Direto ao ponto, quer agendar logo",
        "objections": [],
        "budget": "disponível",
        "email": "lucas.nutro@yahoo.com",
        "phone": "51955443322"
    }
}

def get_active_prompt() -> str:
    """Busca o prompt ativo da Eline no Supabase"""
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
                print(f"   Prompt carregado: {data[0]['version']} ({len(data[0]['system_prompt'])} chars)")
                return data[0]['system_prompt']

    raise Exception("Prompt não encontrado!")


def call_groq(messages: List[Dict], system: str = None, temperature: float = 0.7) -> str:
    """Chama a API do Groq"""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 500
    }

    if system:
        payload["messages"] = [{"role": "system", "content": system}] + messages

    with httpx.Client(timeout=60) as client:
        response = client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        else:
            print(f"Erro Groq: {response.status_code} - {response.text}")
            return "Erro na API"


def simulate_lead(persona: Dict, conversation: List[Dict], turn: int) -> str:
    """Simula resposta do lead (médico)"""

    system = f"""Você é {persona['name']}, {persona['specialty']}.
{persona['description']}

ESTILO: {persona['style']}

OBJEÇÕES TÍPICAS: {', '.join(persona['objections']) if persona['objections'] else 'Nenhuma, quer agendar'}

ORÇAMENTO: {persona['budget']}

SEUS DADOS (use quando pedirem):
- Email: {persona['email']}
- Telefone: {persona['phone']}

REGRAS:
1. Responda de forma natural como médico brasileiro
2. Se pedirem email/telefone, forneça os dados acima
3. Se for persona ocupada, responda curto (sim, não, ok)
4. Se for cética, questione e compare
5. Se estiver pronto, aceite agendar
6. NUNCA quebre o personagem

TURNO ATUAL: {turn}/12
- Turnos 1-4: Fase de discovery, faça perguntas
- Turnos 5-8: Considere avançar se fizer sentido
- Turnos 9-12: Decida (agendar ou desistir)

Responda APENAS como o médico, sem explicações."""

    messages = []
    for msg in conversation[-6:]:  # Últimas 6 mensagens
        role = "assistant" if msg["role"] == "lead" else "user"
        messages.append({"role": role, "content": msg["content"]})

    if not messages:
        # Primeira mensagem do lead
        if persona['name'] == "Dr. Lucas":
            return "Oi! Vi sobre a mentoria HormoSafe. Quero agendar uma call."
        elif persona['name'] == "Dra. Carla":
            return "Boa tarde. Vi sobre o HormoSafe. Já fiz outros cursos de hormônios, o que vocês têm de diferente?"
        elif persona['name'] == "Dr. Pedro":
            return "Oi, quero saber sobre a mentoria"
        elif persona['name'] == "Dra. Fernanda":
            return "Olá! Tenho interesse na mentoria mas tenho algumas dúvidas sobre segurança..."
        else:
            return "Oi! Quero saber mais sobre a mentoria HormoSafe"

    return call_groq(messages, system, temperature=0.8)


def simulate_sdr(prompt: str, conversation: List[Dict], persona: Dict) -> str:
    """Simula resposta da Dra. Eline (SDR)"""

    # Monta histórico
    history = "\n".join([
        f"{'Lead' if m['role'] == 'lead' else 'Eline'}: {m['content']}"
        for m in conversation[-8:]
    ])

    system = f"""{prompt}

<contact_info>
Nome: {persona['name']}
Especialidade: {persona['specialty']}
Email: {persona.get('email', 'não informado')}
Telefone: {persona.get('phone', 'não informado')}
</contact_info>

<conversation_history>
{history}
</conversation_history>

<mode>sdr_inbound</mode>

IMPORTANTE:
- Responda APENAS a mensagem da Eline
- NÃO inclua "Eline:" no início
- Máximo 4 linhas
- Use o NOME do lead, não "colega" repetido"""

    last_message = conversation[-1]["content"] if conversation else ""

    messages = [{"role": "user", "content": f"<current_message>{last_message}</current_message>"}]

    return call_groq(messages, system, temperature=0.3)


def score_conversation(conversation: List[Dict], persona: Dict, outcome: str) -> Dict:
    """Avalia a conversa baseado nos critérios específicos da v3.0.0"""

    scores = {
        "colega_usage": 100,      # Penaliza uso excessivo de "colega"
        "single_question": 100,   # Penaliza perguntas duplas
        "data_collection": 100,   # Verifica coleta de dados
        "flow_respect": 100,      # Respeita fluxo (não pula etapas)
        "name_usage": 100,        # Usa nome do lead
        "outcome_bonus": 0        # Bônus por resultado
    }

    eline_messages = [m["content"] for m in conversation if m["role"] == "sdr"]
    all_text = " ".join(eline_messages).lower()

    # 1. Contagem de "colega"
    colega_count = all_text.count("colega")
    if colega_count > 1:
        scores["colega_usage"] = max(0, 100 - (colega_count - 1) * 20)

    # 2. Perguntas duplas (duas ? na mesma mensagem)
    double_questions = 0
    for msg in eline_messages:
        if msg.count("?") > 1:
            double_questions += 1
    scores["single_question"] = max(0, 100 - double_questions * 25)

    # 3. Coleta de dados (email/telefone)
    asked_email = "email" in all_text or "e-mail" in all_text
    asked_phone = "telefone" in all_text or "whatsapp" in all_text or "celular" in all_text
    if outcome == "scheduled":
        if not asked_email:
            scores["data_collection"] -= 40
        if not asked_phone:
            scores["data_collection"] -= 30

    # 4. Uso do nome
    name_lower = persona["name"].lower().replace("dr. ", "").replace("dra. ", "")
    name_count = all_text.count(name_lower)
    if name_count >= 3:
        scores["name_usage"] = 100
    elif name_count >= 1:
        scores["name_usage"] = 80
    else:
        scores["name_usage"] = 50

    # 5. Bônus por outcome
    if outcome == "scheduled":
        scores["outcome_bonus"] = 20
    elif outcome == "interested":
        scores["outcome_bonus"] = 10
    elif outcome == "lost":
        scores["outcome_bonus"] = -10

    # Score final
    base_score = (
        scores["colega_usage"] * 0.25 +
        scores["single_question"] * 0.25 +
        scores["data_collection"] * 0.20 +
        scores["name_usage"] * 0.15 +
        scores["flow_respect"] * 0.15
    )

    final_score = min(100, base_score + scores["outcome_bonus"])

    return {
        "final_score": round(final_score, 2),
        "breakdown": scores,
        "colega_count": colega_count,
        "double_questions": double_questions,
        "asked_email": asked_email,
        "asked_phone": asked_phone,
        "name_mentions": name_count
    }


def determine_outcome(conversation: List[Dict]) -> str:
    """Determina o resultado da conversa"""
    all_text = " ".join([m["content"].lower() for m in conversation])

    # Indicadores de agendamento
    scheduled_indicators = [
        "agendado", "confirmado", "marcado", "até lá", "até amanhã",
        "convite enviado", "mandei o convite"
    ]

    # Indicadores de interesse
    interest_indicators = [
        "vou pensar", "me manda", "vou ver", "depois te falo",
        "semana que vem"
    ]

    # Indicadores de perda
    lost_indicators = [
        "não tenho interesse", "não quero", "obrigado mas",
        "vou procurar outro", "não é pra mim"
    ]

    for indicator in scheduled_indicators:
        if indicator in all_text:
            return "scheduled"

    for indicator in lost_indicators:
        if indicator in all_text:
            return "lost"

    for indicator in interest_indicators:
        if indicator in all_text:
            return "interested"

    return "pending"


def run_simulation(persona_key: str, persona: Dict, prompt: str, max_turns: int = 12) -> Dict:
    """Executa uma simulação completa"""

    print(f"\n{'='*60}")
    print(f"SIMULAÇÃO: {persona['name']} ({persona['specialty']})")
    print(f"Estilo: {persona['style']}")
    print(f"{'='*60}")

    conversation = []

    for turn in range(1, max_turns + 1):
        # Lead fala
        lead_msg = simulate_lead(persona, conversation, turn)
        conversation.append({"role": "lead", "content": lead_msg})
        print(f"\n[Turn {turn}] {persona['name']}: {lead_msg}")

        # SDR responde
        sdr_msg = simulate_sdr(prompt, conversation, persona)
        conversation.append({"role": "sdr", "content": sdr_msg})
        print(f"[Turn {turn}] Eline: {sdr_msg}")

        # Verifica se conversa terminou
        outcome = determine_outcome(conversation)
        if outcome in ["scheduled", "lost"]:
            print(f"\n>>> Conversa finalizada: {outcome.upper()}")
            break

    # Score final
    final_outcome = determine_outcome(conversation)
    scores = score_conversation(conversation, persona, final_outcome)

    print(f"\n--- RESULTADO ---")
    print(f"Outcome: {final_outcome}")
    print(f"Score: {scores['final_score']}")
    print(f"'Colega' usado: {scores['colega_count']}x")
    print(f"Perguntas duplas: {scores['double_questions']}")
    print(f"Pediu email: {'Sim' if scores['asked_email'] else 'Não'}")
    print(f"Pediu telefone: {'Sim' if scores['asked_phone'] else 'Não'}")
    print(f"Usou nome: {scores['name_mentions']}x")

    return {
        "persona": persona_key,
        "persona_name": persona["name"],
        "outcome": final_outcome,
        "turn_count": len(conversation) // 2,
        "score": scores["final_score"],
        "metrics": scores,
        "conversation": conversation
    }


def main():
    print("\n" + "="*60)
    print("  SIMULADOR DRA. ELINE LOBO v3.0.0")
    print("  Testando correções de colega, perguntas duplas, coleta de dados")
    print("="*60)

    # Carrega prompt
    print("\n1. Carregando prompt ativo...")
    prompt = get_active_prompt()

    # Executa simulações
    print("\n2. Iniciando simulações com 5 personas...")

    results = []
    for persona_key, persona in PERSONAS.items():
        result = run_simulation(persona_key, persona, prompt)
        results.append(result)

    # Relatório final
    print("\n" + "="*60)
    print("  RELATÓRIO FINAL")
    print("="*60)

    total_score = sum(r["score"] for r in results) / len(results)
    outcomes = {
        "scheduled": len([r for r in results if r["outcome"] == "scheduled"]),
        "interested": len([r for r in results if r["outcome"] == "interested"]),
        "pending": len([r for r in results if r["outcome"] == "pending"]),
        "lost": len([r for r in results if r["outcome"] == "lost"])
    }

    print(f"\nScore Médio: {total_score:.1f}/100")
    print(f"Agendamentos: {outcomes['scheduled']}/5")
    print(f"Interessados: {outcomes['interested']}/5")
    print(f"Pendentes: {outcomes['pending']}/5")
    print(f"Perdidos: {outcomes['lost']}/5")

    print("\nPor Persona:")
    print("-" * 50)
    for r in results:
        status = "✅" if r["outcome"] == "scheduled" else "⏳" if r["outcome"] in ["interested", "pending"] else "❌"
        print(f"{status} {r['persona_name']}: {r['score']:.1f} pts | {r['outcome']} | {r['turn_count']}t")
        print(f"   'colega': {r['metrics']['colega_count']}x | perguntas duplas: {r['metrics']['double_questions']} | nome: {r['metrics']['name_mentions']}x")

    # Métricas agregadas dos problemas corrigidos
    print("\nMÉTRICAS DOS PROBLEMAS CORRIGIDOS:")
    print("-" * 50)

    total_colega = sum(r["metrics"]["colega_count"] for r in results)
    total_double = sum(r["metrics"]["double_questions"] for r in results)
    asked_email = len([r for r in results if r["metrics"]["asked_email"]])
    asked_phone = len([r for r in results if r["metrics"]["asked_phone"]])

    print(f"Total 'colega' usado: {total_colega}x (ideal: max 5 = 1 por conversa)")
    print(f"Perguntas duplas: {total_double}x (ideal: 0)")
    print(f"Pediu email: {asked_email}/5 conversas")
    print(f"Pediu telefone: {asked_phone}/5 conversas")

    # Salvar relatório
    report = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "prompt_version": "v3.0.0",
        "location": "Dra. Eline Lobo - HormoSafe",
        "overall_score": round(total_score, 2),
        "outcomes": outcomes,
        "simulations": results,
        "aggregate_metrics": {
            "total_colega_usage": total_colega,
            "total_double_questions": total_double,
            "asked_email_count": asked_email,
            "asked_phone_count": asked_phone
        }
    }

    report_path = f"/Users/marcosdaniels/Projects/mottivme/ai-factory-mottivme-sales/1. ai-factory-agents/simulation_eline_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\nRelatório salvo: {report_path}")

    return report


if __name__ == "__main__":
    main()
