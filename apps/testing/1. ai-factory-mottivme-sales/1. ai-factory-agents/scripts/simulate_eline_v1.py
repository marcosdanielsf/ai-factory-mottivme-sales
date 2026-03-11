#!/usr/bin/env python3
"""
Simulador de Conversas - Dra. Eline Lobo v3.2.0
Testa fluxos de Social Selling e Inbound
"""

import os
import json
import httpx
from datetime import datetime

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')
GROQ_MODEL = "llama-3.1-70b-versatile"

LOCATION_ID = "Cl5gfyVMEjpP6Z8vINex"

# Personas de teste - mistura de Social Selling e Inbound
PERSONAS = [
    {
        "id": "social_selling_gestora",
        "nome": "Fernanda Oliveira",
        "mode": "social_seller_instagram",
        "contexto": "Gestora de clínica, foi abordada no Instagram, NÃO sabe o que é HormoSafe",
        "perfil": "Gestora experiente, precisa de previsibilidade financeira, não entra em call sem saber valor",
        "mensagens": [
            "Oi, tudo bem?",
            "Sou gestora de uma clínica aqui em SP",
            "Sim, temos médicos que trabalham com hormônios",
            "Interessante. Qual o investimento?",
            "Entendo, mas como gestora preciso ter noção do valor antes de comprometer a agenda",
            "Uma faixa de valor já me ajudaria"
        ]
    },
    {
        "id": "social_selling_medica",
        "nome": "Dra. Carolina Mendes",
        "mode": "social_seller_instagram",
        "contexto": "Dermatologista, foi abordada no Instagram, não trabalha com hormônios ainda",
        "perfil": "Curiosa sobre nova área, mas cautelosa, faz muitas perguntas antes de decidir",
        "mensagens": [
            "Oi! Prazer",
            "Sou dermato, não trabalho com hormônios ainda",
            "Já pensei sim, mas tenho medo de prescrever errado",
            "Como assim ensina a pensar?",
            "Faz sentido. Como funciona essa mentoria?",
            "Topa sim, vamos marcar"
        ]
    },
    {
        "id": "inbound_interessado",
        "nome": "Dr. Ricardo Almeida",
        "mode": "sdr_inbound",
        "contexto": "Clínico geral, veio por interesse próprio, já pesquisou sobre HormoSafe",
        "perfil": "Já sabe o que quer, objetivo, vai direto ao ponto",
        "mensagens": [
            "Oi Dra. Eline! Vi sobre o HormoSafe e tenho interesse",
            "Já trabalho com hormônios há 2 anos, mas sinto que prescrevo no escuro",
            "Exatamente! Quero aprender a pensar, não decorar protocolo",
            "Quero sim, vamos agendar",
            "ricardo@clinica.com",
            "11988776655"
        ]
    },
    {
        "id": "social_selling_resistente",
        "nome": "Dra. Amanda Costa",
        "mode": "social_seller_instagram",
        "contexto": "Endocrinologista, foi abordada, já fez vários cursos",
        "perfil": "Cética, já gastou dinheiro em cursos ruins, precisa de prova de valor",
        "mensagens": [
            "Oi",
            "Já fiz vários cursos de hormônios, não preciso de mais um",
            "Eram protocolos prontos sim, mas funcionavam",
            "E qual a diferença do seu?",
            "Hmm, interessante. Mas quanto custa?",
            "Vou pensar"
        ]
    },
    {
        "id": "inbound_apressado",
        "nome": "Dr. Felipe Souza",
        "mode": "sdr_inbound",
        "contexto": "Veio por indicação, quer fechar rápido",
        "perfil": "Impaciente, quer resolver logo, não gosta de muita conversa",
        "mensagens": [
            "Oi, um colega me indicou. Quero saber sobre a mentoria",
            "Já sei que é sobre prescrição segura. Quanto custa?",
            "Ok, mas preciso saber pelo menos uma faixa",
            "Tá, agenda a call então",
            "felipe@email.com e 21999887766",
            "Qualquer horário essa semana"
        ]
    }
]

def get_agent_prompt():
    """Busca o prompt ativo da Eline"""
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
                return data[0]['system_prompt'], data[0]['version']

    return None, None

def simulate_eline(system_prompt: str, mode: str, contact_name: str, conversation_history: list, current_message: str) -> str:
    """Simula resposta da Eline usando Groq"""

    # Monta o contexto como a IA receberia
    context = f"""<contact_info>
nome: {contact_name}
telefone: não informado
email: não informado
</contact_info>

<mode>{mode}</mode>

<conversation_history>
{json.dumps(conversation_history, ensure_ascii=False, indent=2)}
</conversation_history>

<current_message>
{current_message}
</current_message>"""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": context}
        ],
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
            return f"[ERRO API: {response.status_code}]"

def analyze_response(response: str, mode: str, msg_index: int) -> dict:
    """Analisa a resposta para problemas"""
    issues = []
    score = 100

    # Conta interrogações
    question_marks = response.count("?")
    if question_marks > 1:
        issues.append(f"PERGUNTAS DUPLAS: {question_marks} interrogações")
        score -= 15 * (question_marks - 1)

    # Verifica se menciona HormoSafe cedo demais no Social Selling
    if mode.startswith("social_seller") and msg_index < 2:
        if "hormosafe" in response.lower() or "mentoria" in response.lower():
            issues.append("SOCIAL SELLING: Mencionou produto cedo demais")
            score -= 20

    # Verifica se assume interesse no Social Selling
    if mode.startswith("social_seller") and msg_index < 3:
        if "seu interesse" in response.lower() or "vi que você quer" in response.lower():
            issues.append("SOCIAL SELLING: Assumiu interesse que não existe")
            score -= 25

    # Verifica colega repetido (simplificado - só detecta na msg)
    if response.lower().count("colega") > 1:
        issues.append("COLEGA: Usado múltiplas vezes")
        score -= 10

    # Verifica tamanho
    lines = [l for l in response.split('\n') if l.strip()]
    if len(lines) > 4:
        issues.append(f"TAMANHO: {len(lines)} linhas (máx 4)")
        score -= 5

    # Verifica emojis proibidos
    forbidden_emojis = ['⭐', '🔥', '🌟', '✨✨']  # múltiplos
    for emoji in forbidden_emojis:
        if emoji in response:
            issues.append(f"EMOJI: {emoji} não permitido")
            score -= 5

    # Verifica se deu preço
    price_patterns = ['R$', 'reais', 'mil reais', 'investimento de']
    for pattern in price_patterns:
        if pattern.lower() in response.lower():
            # Verifica se é contexto de "na call explicamos"
            if "call" not in response.lower() and "jean" not in response.lower():
                issues.append("PREÇO: Mencionou valor sem redirecionar para call")
                score -= 20

    return {
        "score": max(0, score),
        "issues": issues
    }

def run_simulation(persona: dict, system_prompt: str) -> dict:
    """Executa simulação completa para uma persona"""
    print(f"\n{'='*60}")
    print(f"PERSONA: {persona['nome']}")
    print(f"MODE: {persona['mode']}")
    print(f"CONTEXTO: {persona['contexto']}")
    print(f"{'='*60}")

    conversation_history = []
    results = {
        "persona_id": persona["id"],
        "nome": persona["nome"],
        "mode": persona["mode"],
        "exchanges": [],
        "total_score": 0,
        "issues_count": 0,
        "agendamento": False
    }

    for i, msg in enumerate(persona["mensagens"]):
        print(f"\n👤 {persona['nome']}: {msg}")

        # Simula resposta da Eline
        response = simulate_eline(
            system_prompt=system_prompt,
            mode=persona["mode"],
            contact_name=persona["nome"],
            conversation_history=conversation_history,
            current_message=msg
        )

        print(f"🤖 Eline: {response}")

        # Analisa resposta
        analysis = analyze_response(response, persona["mode"], i)

        if analysis["issues"]:
            print(f"   ⚠️ Issues: {', '.join(analysis['issues'])}")

        # Atualiza histórico
        conversation_history.append({"role": "user", "content": msg})
        conversation_history.append({"role": "assistant", "content": response})

        # Registra exchange
        results["exchanges"].append({
            "user": msg,
            "assistant": response,
            "score": analysis["score"],
            "issues": analysis["issues"]
        })

        results["total_score"] += analysis["score"]
        results["issues_count"] += len(analysis["issues"])

        # Verifica se houve agendamento
        if "agend" in response.lower() and ("confirm" in response.lower() or "pronto" in response.lower()):
            results["agendamento"] = True

    # Calcula média
    results["avg_score"] = results["total_score"] / len(persona["mensagens"])

    print(f"\n📊 Score médio: {results['avg_score']:.1f}")
    print(f"📊 Issues totais: {results['issues_count']}")
    print(f"📊 Agendamento: {'✅' if results['agendamento'] else '❌'}")

    return results

def main():
    print("="*60)
    print("SIMULADOR ELINE v3.2.0")
    print("="*60)

    # Busca prompt ativo
    system_prompt, version = get_agent_prompt()

    if not system_prompt:
        print("ERRO: Não encontrou prompt ativo")
        return 1

    print(f"Versão ativa: {version}")
    print(f"Prompt: {len(system_prompt)} chars")

    # Executa simulações
    all_results = []

    for persona in PERSONAS:
        result = run_simulation(persona, system_prompt)
        all_results.append(result)

    # Resumo final
    print("\n" + "="*60)
    print("RESUMO FINAL")
    print("="*60)

    total_avg = sum(r["avg_score"] for r in all_results) / len(all_results)
    total_issues = sum(r["issues_count"] for r in all_results)
    agendamentos = sum(1 for r in all_results if r["agendamento"])

    print(f"\n📊 Score geral: {total_avg:.1f}/100")
    print(f"📊 Issues totais: {total_issues}")
    print(f"📊 Agendamentos: {agendamentos}/{len(PERSONAS)}")

    print("\n📋 Por persona:")
    for r in all_results:
        status = "✅" if r["agendamento"] else "❌"
        mode_label = "SS" if r["mode"].startswith("social") else "IN"
        print(f"   [{mode_label}] {r['nome']}: {r['avg_score']:.1f} pts, {r['issues_count']} issues {status}")

    # Análise de problemas mais comuns
    all_issues = []
    for r in all_results:
        for ex in r["exchanges"]:
            all_issues.extend(ex["issues"])

    if all_issues:
        print("\n⚠️ Problemas mais frequentes:")
        issue_counts = {}
        for issue in all_issues:
            key = issue.split(":")[0]
            issue_counts[key] = issue_counts.get(key, 0) + 1

        for issue, count in sorted(issue_counts.items(), key=lambda x: -x[1]):
            print(f"   {issue}: {count}x")

    # Salva resultados
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"simulation_eline_{timestamp}.json"

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "version": version,
            "timestamp": timestamp,
            "summary": {
                "avg_score": total_avg,
                "total_issues": total_issues,
                "agendamentos": f"{agendamentos}/{len(PERSONAS)}"
            },
            "results": all_results
        }, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Resultados salvos em: {output_file}")

    return 0

if __name__ == "__main__":
    exit(main())
