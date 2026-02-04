#!/usr/bin/env python3
"""
Simulador de Conversas - Dr. Alberto Correia v5.3
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
LOCATION_ID = "GT77iGk2WDneoHwtuq6D"

# Personas de médicos interessados em tricologia
PERSONAS = {
    "ricardo_dermato": {
        "name": "Dr. Ricardo",
        "specialty": "Dermatologista",
        "bio": "Dermatologista em SP, faz muito tratamento de pele mas quer expandir para capilar",
        "description": "Já atende casos capilares mas quer se especializar",
        "style": "Interessado, faz perguntas técnicas sobre o método",
        "objections": ["Como funciona o teste genético?", "Qual a taxa de sucesso?"],
        "region": "São Paulo",
        "email": "ricardo.dermato@gmail.com",
        "phone": "11988776655"
    },
    "marina_clinica": {
        "name": "Dra. Marina",
        "specialty": "Clínica Geral",
        "bio": "Médica generalista querendo se especializar em algo",
        "description": "Curiosa sobre tricologia, quer sair do plantão",
        "style": "Exploratória, quer entender se é pra ela",
        "objections": ["Precisa de especialização prévia?", "Dá pra começar do zero?"],
        "region": "Minas Gerais",
        "email": "marina.med@hotmail.com",
        "phone": "31977665544"
    },
    "felipe_plantonista": {
        "name": "Dr. Felipe",
        "specialty": "Plantonista",
        "bio": "Médico plantonista cansado da rotina de hospital",
        "description": "Quer montar consultório próprio, busca área lucrativa",
        "style": "Direto, focado em resultados financeiros",
        "objections": ["Quanto tempo pra ter retorno?", "Dá pra conciliar com plantão?"],
        "region": "Rio de Janeiro",
        "email": "felipe.plan@uol.com.br",
        "phone": "21966554433"
    },
    "lucia_cetica": {
        "name": "Dra. Lucia",
        "specialty": "Dermatologista",
        "bio": "Dermato experiente, já fez outros cursos de tricologia",
        "description": "Cética, já gastou dinheiro com cursos que não funcionaram",
        "style": "Questionadora, compara com outros cursos",
        "objections": ["Já fiz vários cursos", "O que tem de diferente?", "Mais do mesmo?"],
        "region": "Bahia",
        "email": "lucia.dra@gmail.com",
        "phone": "71955443322"
    },
    "bruno_pronto": {
        "name": "Dr. Bruno",
        "specialty": "Cirurgião Plástico",
        "bio": "Cirurgião plástico que já conhece o trabalho do Alberto",
        "description": "Já decidiu que quer fazer, só quer agendar",
        "style": "Direto ao ponto, quer agendar logo",
        "objections": [],
        "region": "Paraná",
        "email": "bruno.plastica@yahoo.com",
        "phone": "41944332211"
    }
}

def get_active_prompt() -> str:
    """Busca o prompt ativo do Alberto no Supabase"""
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

BIO: {persona['bio']}
REGIÃO: {persona['region']}

ESTILO: {persona['style']}

OBJEÇÕES TÍPICAS: {', '.join(persona['objections']) if persona['objections'] else 'Nenhuma, quer agendar'}

SEUS DADOS (use quando pedirem):
- Email: {persona['email']}
- Telefone: {persona['phone']}

REGRAS:
1. Responda de forma natural como médico brasileiro
2. Se pedirem email/telefone, forneça os dados acima
3. Se for persona cética, questione e compare
4. Se estiver pronto, aceite agendar
5. NUNCA quebre o personagem
6. Use linguagem casual de WhatsApp

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
        # Primeira mensagem do lead (respondendo à prospecção do Alberto)
        if persona['name'] == "Dr. Bruno":
            return "Opa! Vi seu conteúdo, muito bom. Quero saber mais sobre a mentoria."
        elif persona['name'] == "Dra. Lucia":
            return "Oi! Já fiz outros cursos de tricologia... o que tem de diferente no seu?"
        elif persona['name'] == "Dr. Felipe":
            return "E aí! Tô querendo sair do plantão, tricologia dá dinheiro mesmo?"
        elif persona['name'] == "Dra. Marina":
            return "Olá! Sou clínica geral, dá pra entrar na área de capilar sem ser dermato?"
        else:
            return "Oi! Vi seu perfil, interessante. Me conta mais sobre esse método."

    return call_groq(messages, system, temperature=0.8)


def simulate_sdr(prompt: str, conversation: List[Dict], persona: Dict) -> str:
    """Simula resposta do Dr. Alberto (SDR)"""

    # Monta histórico
    history = ""
    if conversation:
        history = "\n".join([
            f"{'LEAD' if m['role'] == 'lead' else 'ASSISTENTE'}: {m['content']}"
            for m in conversation[-8:]
        ])

    # Simula o contexto que o n8n enviaria
    context = f"""<contexto_conversa>
LEAD: {persona['name']}
CANAL: whatsapp
DDD: {persona['phone'][:2]}
DATA/HORA: {datetime.now().strftime('%d/%m/%Y %H:%M')}
ETIQUETAS: lead_novo
STATUS PAGAMENTO: nenhum
MODO ATIVO: social_seller_instagram
</contexto_conversa>

<hiperpersonalizacao>
ESPECIALIDADE: {persona['specialty']}
BIO: {persona['bio']}
CONTEUDO: posts sobre {persona['specialty'].lower()}
REGIAO: {persona['region']}
</hiperpersonalizacao>

<calendarios_disponiveis>
calendar_id: Nwc3Wp6nSGMJTcXT2K3a
</calendarios_disponiveis>"""

    if history:
        context += f"""

<historico_conversa>
{history}
</historico_conversa>"""

    last_message = conversation[-1]["content"] if conversation else ""
    context += f"""

<mensagem_atual>
LEAD: {last_message}
</mensagem_atual>"""

    system = prompt

    messages = [{"role": "user", "content": context}]

    return call_groq(messages, system, temperature=0.3)


def score_conversation(conversation: List[Dict], persona: Dict, outcome: str) -> Dict:
    """Avalia a conversa baseado nos critérios do Alberto"""

    scores = {
        "first_person": 100,      # Fala em primeira pessoa
        "no_presentation": 100,   # Não se apresenta
        "ou_ou_closing": 100,     # Usa fechamento OU/OU
        "single_message": 100,    # Uma mensagem por vez
        "casual_tone": 100,       # Tom casual
        "data_collection": 100,   # Coleta dados para agendamento
        "outcome_bonus": 0
    }

    alberto_messages = [m["content"] for m in conversation if m["role"] == "sdr"]
    all_text = " ".join(alberto_messages).lower()

    # 1. Verifica primeira pessoa (não pode ter "o dr. alberto", "ele", "a ele")
    third_person_errors = 0
    for msg in alberto_messages:
        msg_lower = msg.lower()
        if "o dr. alberto" in msg_lower or "o alberto" in msg_lower:
            third_person_errors += 1
        if "a ele" in msg_lower or "dele" in msg_lower:
            third_person_errors += 1
    scores["first_person"] = max(0, 100 - third_person_errors * 25)

    # 2. Verifica se se apresentou (não pode ter "alberto por aqui", "sou o alberto")
    presentation_errors = 0
    for msg in alberto_messages:
        msg_lower = msg.lower()
        if "alberto por aqui" in msg_lower or "sou o alberto" in msg_lower:
            presentation_errors += 1
        if "me chamo alberto" in msg_lower:
            presentation_errors += 1
    scores["no_presentation"] = max(0, 100 - presentation_errors * 50)

    # 3. Verifica fechamento OU/OU (deve ter opções no fechamento)
    has_ou_ou = False
    ou_ou_patterns = [
        "terça ou quarta", "quarta ou quinta", "segunda ou terça",
        "manhã ou tarde", "de manhã ou de tarde",
        "qual funciona melhor", "qual fica melhor"
    ]
    for pattern in ou_ou_patterns:
        if pattern in all_text:
            has_ou_ou = True
            break

    # Verifica fechamentos fracos
    weak_closings = ["o que me diz", "tem interesse", "quer saber mais", "gostaria de"]
    has_weak = any(weak in all_text for weak in weak_closings)

    if has_ou_ou:
        scores["ou_ou_closing"] = 100
    elif has_weak:
        scores["ou_ou_closing"] = 50
    else:
        scores["ou_ou_closing"] = 70  # Neutro

    # 4. Tom casual (deve ter expressões como "e aí", "valeu", "show")
    casual_expressions = ["e aí", "valeu", "show", "de boa", "faz sentido", "e o seguinte"]
    casual_count = sum(1 for expr in casual_expressions if expr in all_text)
    scores["casual_tone"] = min(100, 50 + casual_count * 10)

    # 5. Coleta de dados
    asked_email = "email" in all_text or "e-mail" in all_text
    asked_phone = "telefone" in all_text or "whatsapp" in all_text or "celular" in all_text
    if outcome == "scheduled":
        if not asked_email and not asked_phone:
            scores["data_collection"] = 60
        elif asked_email or asked_phone:
            scores["data_collection"] = 80
        else:
            scores["data_collection"] = 100

    # 6. Bônus por outcome
    if outcome == "scheduled":
        scores["outcome_bonus"] = 20
    elif outcome == "interested":
        scores["outcome_bonus"] = 10
    elif outcome == "lost":
        scores["outcome_bonus"] = -10

    # Score final
    base_score = (
        scores["first_person"] * 0.25 +
        scores["no_presentation"] * 0.15 +
        scores["ou_ou_closing"] * 0.20 +
        scores["casual_tone"] * 0.15 +
        scores["data_collection"] * 0.15 +
        scores["single_message"] * 0.10
    )

    final_score = min(100, base_score + scores["outcome_bonus"])

    return {
        "final_score": round(final_score, 2),
        "breakdown": scores,
        "third_person_errors": third_person_errors,
        "presentation_errors": presentation_errors,
        "has_ou_ou_closing": has_ou_ou,
        "has_weak_closing": has_weak
    }


def determine_outcome(conversation: List[Dict]) -> str:
    """Determina o resultado da conversa"""
    all_text = " ".join([m["content"].lower() for m in conversation])

    # Indicadores de agendamento
    scheduled_indicators = [
        "agendado", "confirmado", "marcado", "até lá", "até terça",
        "até quarta", "até quinta", "até sexta", "até segunda"
    ]

    # Indicadores de interesse
    interest_indicators = [
        "vou pensar", "me manda", "vou ver", "depois te falo",
        "semana que vem", "interessante"
    ]

    # Indicadores de perda
    lost_indicators = [
        "não tenho interesse", "não quero", "obrigado mas",
        "não é pra mim", "mais do mesmo"
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
        print(f"[Turn {turn}] Alberto: {sdr_msg}")

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
    print(f"Erros 3ª pessoa: {scores['third_person_errors']}")
    print(f"Erros apresentação: {scores['presentation_errors']}")
    print(f"Fechamento OU/OU: {'Sim' if scores['has_ou_ou_closing'] else 'Não'}")
    print(f"Fechamento fraco: {'Sim' if scores['has_weak_closing'] else 'Não'}")

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
    print("  SIMULADOR DR. ALBERTO CORREIA v5.3")
    print("  Testando primeira pessoa, fechamento OU/OU, tom casual")
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
        print(f"   3ª pessoa: {r['metrics']['third_person_errors']}x | OU/OU: {'✓' if r['metrics']['has_ou_ou_closing'] else '✗'} | Fraco: {'✗' if r['metrics']['has_weak_closing'] else '✓'}")

    # Métricas agregadas
    print("\nMÉTRICAS AGREGADAS:")
    print("-" * 50)

    total_3rd_person = sum(r["metrics"]["third_person_errors"] for r in results)
    total_presentation = sum(r["metrics"]["presentation_errors"] for r in results)
    ou_ou_count = len([r for r in results if r["metrics"]["has_ou_ou_closing"]])
    weak_count = len([r for r in results if r["metrics"]["has_weak_closing"]])

    print(f"Erros 3ª pessoa: {total_3rd_person}x (ideal: 0)")
    print(f"Erros apresentação: {total_presentation}x (ideal: 0)")
    print(f"Fechamento OU/OU: {ou_ou_count}/5 conversas")
    print(f"Fechamento fraco: {weak_count}/5 conversas (ideal: 0)")

    # Salvar relatório
    report = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "prompt_version": "v5.3",
        "location": "Dr. Alberto Correia - Tricomind",
        "overall_score": round(total_score, 2),
        "outcomes": outcomes,
        "simulations": results,
        "aggregate_metrics": {
            "total_3rd_person_errors": total_3rd_person,
            "total_presentation_errors": total_presentation,
            "ou_ou_closing_count": ou_ou_count,
            "weak_closing_count": weak_count
        }
    }

    report_path = f"/Users/marcosdaniels/Projects/mottivme/ai-factory-mottivme-sales/1. ai-factory-agents/simulation_alberto_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\nRelatório salvo: {report_path}")

    return report


if __name__ == "__main__":
    main()
