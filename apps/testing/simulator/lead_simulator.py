"""
Lead Simulator - Simula comportamento de leads usando Gemini
"""

import os
import json
import httpx
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class LeadType(Enum):
    """Tipos de lead para simulação"""
    READY_TO_BUY = "ready_to_buy"           # Pronto pra comprar
    PRICE_SENSITIVE = "price_sensitive"      # Sensível a preço
    SKEPTICAL = "skeptical"                  # Cético
    BUSY = "busy"                            # Ocupado, respostas curtas
    EMOTIONAL = "emotional"                  # Emocional, conta história
    RESEARCHER = "researcher"                # Pesquisador, muitas perguntas
    INDECISIVE = "indecisive"               # Indeciso, precisa de empurrão


@dataclass
class LeadPersona:
    """Persona do lead para simulação"""
    name: str
    lead_type: LeadType
    symptom: str
    time_with_problem: str
    tried_before: str
    budget_concern: bool
    emotional_pain: str
    objections: List[str]

    def to_prompt(self) -> str:
        return f"""Você é {self.name}, uma pessoa real buscando ajuda médica.

PERFIL:
- Tipo: {self.lead_type.value}
- Sintoma principal: {self.symptom}
- Tempo com o problema: {self.time_with_problem}
- Já tentou antes: {self.tried_before}
- Preocupação com preço: {"Sim, orçamento apertado" if self.budget_concern else "Não é o principal fator"}
- Dor emocional: {self.emotional_pain}

OBJEÇÕES QUE VOCÊ VAI FAZER (use naturalmente durante a conversa):
{chr(10).join(f'- {obj}' for obj in self.objections)}

REGRAS DE COMPORTAMENTO:
1. Responda como uma pessoa REAL, não como IA
2. Use linguagem informal do WhatsApp
3. Pode usar abreviações: vc, tb, pq, etc
4. Respostas curtas (1-3 frases normalmente)
5. Às vezes demora pra responder ou manda "ok" só
6. Faça suas objeções de forma natural, não todas de uma vez
7. Se a vendedora for boa, você pode ser convencido
8. Se sentir pressão demais, desista
"""


# Personas pré-definidas para teste
LEAD_PERSONAS = {
    "maria_preco": LeadPersona(
        name="Maria",
        lead_type=LeadType.PRICE_SENSITIVE,
        symptom="insônia e fogachos",
        time_with_problem="2 anos",
        tried_before="Remédios naturais, sem sucesso",
        budget_concern=True,
        emotional_pain="Não consigo dormir, afeta meu trabalho",
        objections=[
            "Qual o valor da consulta?",
            "Tá muito caro pra mim",
            "Não tenho esse valor agora",
            "Vocês parcelam?"
        ]
    ),
    "joana_cetica": LeadPersona(
        name="Joana",
        lead_type=LeadType.SKEPTICAL,
        symptom="ganho de peso abdominal",
        time_with_problem="3 anos",
        tried_before="Vários médicos, dietas, academia",
        budget_concern=False,
        emotional_pain="Já gastei muito dinheiro e nada funcionou",
        objections=[
            "Por que seria diferente dos outros?",
            "Como vocês tratam?",
            "Quero ver resultados antes",
            "Tem garantia?"
        ]
    ),
    "ana_ocupada": LeadPersona(
        name="Ana",
        lead_type=LeadType.BUSY,
        symptom="cansaço extremo",
        time_with_problem="1 ano",
        tried_before="Não",
        budget_concern=False,
        emotional_pain="Não tenho energia pra nada",
        objections=[
            "Tô sem tempo agora",
            "Me manda um resumo por favor",
            "Quanto custa e quando tem vaga?"
        ]
    ),
    "claudia_emocional": LeadPersona(
        name="Claudia",
        lead_type=LeadType.EMOTIONAL,
        symptom="menopausa com vários sintomas",
        time_with_problem="5 anos",
        tried_before="Ginecologista do SUS disse ser normal",
        budget_concern=True,
        emotional_pain="Me sinto velha, meu casamento está sofrendo, não me reconheço mais",
        objections=[
            "Preciso conversar com meu marido",
            "Será que funciona mesmo?",
            "Tenho medo de hormônios"
        ]
    ),
    "patricia_pronta": LeadPersona(
        name="Patricia",
        lead_type=LeadType.READY_TO_BUY,
        symptom="queda de libido",
        time_with_problem="2 anos",
        tried_before="Psicólogo",
        budget_concern=False,
        emotional_pain="Meu relacionamento está em crise por isso",
        objections=[
            "Quando tem o horário mais próximo?",
            "Aceita cartão?"
        ]
    )
}


class LeadSimulator:
    """Simula comportamento de lead usando Groq/Llama"""

    def __init__(self, persona: LeadPersona):
        self.persona = persona
        self.conversation_history: List[Dict] = []
        self.model = "llama-3.3-70b-versatile"  # Groq

    def _build_messages(self) -> List[Dict]:
        """Constrói mensagens para a API"""
        messages = [
            {"role": "system", "content": self.persona.to_prompt()}
        ]

        for msg in self.conversation_history:
            messages.append(msg)

        return messages

    async def respond(self, sdr_message: str) -> str:
        """Gera resposta do lead para mensagem da SDR"""

        # Adiciona mensagem da SDR ao histórico
        self.conversation_history.append({
            "role": "user",
            "content": f"[VENDEDORA]: {sdr_message}"
        })

        messages = self._build_messages()

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.8,
                    "max_tokens": 200
                }
            )

            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.text}")

            data = response.json()
            lead_response = data["choices"][0]["message"]["content"]

            # Adiciona resposta ao histórico
            self.conversation_history.append({
                "role": "assistant",
                "content": lead_response
            })

            return lead_response

    def get_first_message(self) -> str:
        """Mensagem inicial do lead"""
        first_messages = {
            LeadType.READY_TO_BUY: "Oi, vim pelo anúncio. Quero agendar uma consulta",
            LeadType.PRICE_SENSITIVE: "Olá, acabei de preencher o formulário com interesse na consulta com o Dr. Luiz",
            LeadType.SKEPTICAL: "Boa tarde, quero saber mais sobre o tratamento de vocês",
            LeadType.BUSY: "Oi",
            LeadType.EMOTIONAL: "Olá, acabei de preencher o formulário com interesse na consulta com o Dr. Luiz",
            LeadType.RESEARCHER: "Oi, vi o anúncio de vocês. Podem me explicar como funciona?",
            LeadType.INDECISIVE: "Oi, tô pesquisando sobre tratamento hormonal..."
        }
        return first_messages.get(self.persona.lead_type, "Olá")

    def get_conversation_transcript(self) -> str:
        """Retorna transcrição formatada da conversa"""
        transcript = []
        for msg in self.conversation_history:
            if "[VENDEDORA]:" in msg["content"]:
                transcript.append(f"SDR: {msg['content'].replace('[VENDEDORA]: ', '')}")
            else:
                transcript.append(f"LEAD: {msg['content']}")
        return "\n".join(transcript)


# Teste rápido
if __name__ == "__main__":
    import asyncio

    async def test():
        persona = LEAD_PERSONAS["maria_preco"]
        lead = LeadSimulator(persona)

        print(f"=== Simulando: {persona.name} ({persona.lead_type.value}) ===\n")

        # Simular algumas trocas
        first = lead.get_first_message()
        print(f"LEAD: {first}")

        # Simular resposta da SDR (hardcoded pra teste)
        sdr_msg = "Boa tarde, Maria! Sou a Isabella do Instituto Amare. Vi que você preencheu nosso formulário. Me conta, há quanto tempo você está com esses sintomas?"
        print(f"\nSDR: {sdr_msg}")

        response = await lead.respond(sdr_msg)
        print(f"\nLEAD: {response}")

    asyncio.run(test())
