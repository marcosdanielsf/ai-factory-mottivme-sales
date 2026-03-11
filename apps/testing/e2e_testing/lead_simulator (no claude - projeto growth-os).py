"""
Lead Simulator - Claude fazendo papel de cliente
================================================
Simula diferentes personas de lead para testar os agentes.
"""

import os
import json
from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass, field
import anthropic


class LeadPersona(Enum):
    """Personas de lead para simulação"""

    # Lead pronto pra comprar
    HOT = "hot"

    # Lead curioso, precisa convencer
    WARM = "warm"

    # Lead cético, muitas objeções
    COLD = "cold"

    # Lead com objeção específica (marido, preço, tempo)
    OBJECTION_HUSBAND = "objection_husband"
    OBJECTION_PRICE = "objection_price"
    OBJECTION_TIME = "objection_time"

    # Lead que quer resolver rápido
    RUSHED = "rushed"

    # Lead que já tentou outras soluções
    EXPERIENCED = "experienced"


@dataclass
class LeadProfile:
    """Perfil detalhado do lead simulado"""
    persona: LeadPersona
    name: str
    age: int
    occupation: str
    pain_points: List[str]
    objections: List[str]
    budget_range: str
    urgency: str  # low, medium, high
    decision_maker: bool
    backstory: str
    goals: List[str]  # O que o lead quer alcançar na conversa

    def to_prompt(self) -> str:
        """Converte perfil em prompt para o simulador"""
        return f"""
## PERFIL DO LEAD QUE VOCÊ ESTÁ SIMULANDO

**Nome:** {self.name}
**Idade:** {self.age} anos
**Profissão:** {self.occupation}
**Persona:** {self.persona.value}

**Dores/Problemas:**
{chr(10).join(f"- {p}" for p in self.pain_points)}

**Objeções que você pode levantar:**
{chr(10).join(f"- {o}" for o in self.objections)}

**Orçamento:** {self.budget_range}
**Urgência:** {self.urgency}
**É decisor:** {"Sim" if self.decision_maker else "Não - precisa consultar alguém"}

**Backstory:**
{self.backstory}

**Seus objetivos nessa conversa:**
{chr(10).join(f"- {g}" for g in self.goals)}
"""


# Personas pré-definidas para Instituto Amare
LEAD_PROFILES = {
    LeadPersona.HOT: LeadProfile(
        persona=LeadPersona.HOT,
        name="Carla",
        age=48,
        occupation="Empresária",
        pain_points=[
            "Ondas de calor intensas há 2 anos",
            "Insônia crônica",
            "Ganho de peso inexplicável",
            "Já tentou chás e suplementos sem sucesso"
        ],
        objections=[],  # Lead quente não tem muitas objeções
        budget_range="Sem restrição - quer resolver",
        urgency="high",
        decision_maker=True,
        backstory="Empresária bem-sucedida que valoriza qualidade de vida. Já pesquisou sobre reposição hormonal e está convencida que precisa. Veio pelo Instagram.",
        goals=[
            "Agendar consulta rapidamente",
            "Entender como funciona o tratamento",
            "Confirmar que a Dra. é especialista"
        ]
    ),

    LeadPersona.WARM: LeadProfile(
        persona=LeadPersona.WARM,
        name="Maria",
        age=45,
        occupation="Advogada",
        pain_points=[
            "Cansaço constante",
            "Alterações de humor",
            "Pele ressecada",
            "Suspeita que é menopausa mas não tem certeza"
        ],
        objections=[
            "Preciso saber mais antes de decidir",
            "Qual a diferença de vocês pro ginecologista comum?"
        ],
        budget_range="Médio - avalia custo-benefício",
        urgency="medium",
        decision_maker=True,
        backstory="Profissional ocupada que está começando a sentir os sintomas. Curiosa mas cautelosa. Precisa entender o valor antes de investir.",
        goals=[
            "Entender se realmente precisa do tratamento",
            "Comparar com outras opções",
            "Avaliar se vale o investimento"
        ]
    ),

    LeadPersona.COLD: LeadProfile(
        persona=LeadPersona.COLD,
        name="Sandra",
        age=52,
        occupation="Professora",
        pain_points=[
            "Alguns sintomas leves",
            "Não está certa se é menopausa"
        ],
        objections=[
            "Acho que é muito caro",
            "Minha amiga fez e não funcionou",
            "Hormônio não dá câncer?",
            "Prefiro tratamento natural"
        ],
        budget_range="Limitado - preocupada com preço",
        urgency="low",
        decision_maker=True,
        backstory="Cética com medicina em geral. Teve experiência ruim com médicos no passado. Precisa de muita confiança para investir.",
        goals=[
            "Testar se o atendimento é bom",
            "Ver se convencem ela",
            "Encontrar motivos para não fazer"
        ]
    ),

    LeadPersona.OBJECTION_HUSBAND: LeadProfile(
        persona=LeadPersona.OBJECTION_HUSBAND,
        name="Ana",
        age=47,
        occupation="Designer",
        pain_points=[
            "Ondas de calor fortes",
            "Insônia há 6 meses",
            "Baixa libido afetando casamento"
        ],
        objections=[
            "Preciso falar com meu marido",
            "Ele acha que é frescura",
            "Ele vai achar caro demais"
        ],
        budget_range="Bom - mas marido controla finanças",
        urgency="high",
        decision_maker=False,
        backstory="Quer muito fazer o tratamento mas o marido é resistente. Precisa de argumentos para convencer ele.",
        goals=[
            "Conseguir argumentos para convencer o marido",
            "Entender o valor do tratamento",
            "Saber se tem como parcelar"
        ]
    ),

    LeadPersona.OBJECTION_PRICE: LeadProfile(
        persona=LeadPersona.OBJECTION_PRICE,
        name="Lucia",
        age=50,
        occupation="Funcionária pública",
        pain_points=[
            "Sintomas moderados",
            "Já gasta muito com suplementos"
        ],
        objections=[
            "R$971 é muito caro pra uma consulta",
            "No plano de saúde é de graça",
            "Não tenho esse dinheiro agora"
        ],
        budget_range="Apertado - precisa parcelar",
        urgency="medium",
        decision_maker=True,
        backstory="Interessada mas o preço é barreira real. Precisa entender o ROI e opções de pagamento.",
        goals=[
            "Negociar preço ou parcelamento",
            "Entender por que é mais caro que o convênio",
            "Avaliar se vale o investimento"
        ]
    ),

    LeadPersona.RUSHED: LeadProfile(
        persona=LeadPersona.RUSHED,
        name="Patricia",
        age=46,
        occupation="Executiva",
        pain_points=[
            "Ondas de calor em reuniões",
            "Não consegue dormir",
            "Está afetando o trabalho"
        ],
        objections=[
            "Não tenho tempo para enrolação",
            "Preciso resolver isso logo"
        ],
        budget_range="Sem restrição - quer resolver rápido",
        urgency="very_high",
        decision_maker=True,
        backstory="Super ocupada, odeia perder tempo. Quer ir direto ao ponto. Se demorar muito, desiste.",
        goals=[
            "Agendar o mais rápido possível",
            "Respostas diretas e objetivas",
            "Não quer conversa fiada"
        ]
    ),

    LeadPersona.OBJECTION_TIME: LeadProfile(
        persona=LeadPersona.OBJECTION_TIME,
        name="Regina",
        age=49,
        occupation="Médica",
        pain_points=[
            "Ondas de calor moderadas",
            "Cansaço frequente",
            "Dificuldade de concentração"
        ],
        objections=[
            "Minha agenda é muito apertada",
            "Não tenho tempo para ir em consultas",
            "Trabalho demais, não consigo encaixar",
            "Só consigo daqui a 2-3 meses"
        ],
        budget_range="Alto - dinheiro não é problema",
        urgency="baixa por falta de tempo",
        decision_maker=True,
        backstory="Profissional de saúde muito ocupada. Sabe que precisa cuidar de si mas sempre adia. Agenda lotada é a desculpa principal.",
        goals=[
            "Entender se realmente vale o tempo investido",
            "Ver se consegue encaixar na agenda",
            "Adiar para quando tiver mais tempo"
        ]
    ),

    LeadPersona.EXPERIENCED: LeadProfile(
        persona=LeadPersona.EXPERIENCED,
        name="Fernanda",
        age=53,
        occupation="Arquiteta",
        pain_points=[
            "Já fez reposição antes e parou",
            "Teve efeitos colaterais com outro médico",
            "Sintomas voltaram mais fortes"
        ],
        objections=[
            "Já tentei e não funcionou",
            "Tive efeitos colaterais terríveis",
            "Por que seria diferente com vocês?",
            "Outro médico me receitou e foi ruim"
        ],
        budget_range="Médio-alto - investe se convencer",
        urgency="medium",
        decision_maker=True,
        backstory="Já teve experiência negativa com reposição hormonal mal prescrita. Está cética mas os sintomas estão insuportáveis.",
        goals=[
            "Entender a diferença do protocolo",
            "Garantir que não vai ter os mesmos efeitos",
            "Ser convencida de que vale tentar novamente"
        ]
    )
}


class LeadSimulator:
    """
    Simula um lead em conversa com o agente.
    Usa Claude para gerar respostas realistas baseadas na persona.
    """

    SYSTEM_PROMPT = """Você é um simulador de lead para testes de chatbot de vendas.

Seu trabalho é ATUAR como um lead real, respondendo de forma natural e coerente com o perfil fornecido.

## REGRAS:

1. **Seja consistente** com a persona - se é lead frio, seja resistente; se é lead quente, seja receptivo

2. **Não seja previsível** - varie suas respostas, às vezes seja mais curto, às vezes mais detalhado

3. **Reaja às respostas do agente** - se ele for convincente, abra um pouco; se for ruim, feche mais

4. **Use linguagem natural** - erros de digitação ocasionais, abreviações, emojis quando apropriado

5. **Siga seus objetivos** - você tem metas na conversa, trabalhe em direção a elas

6. **Sinalize quando atingir objetivo** - quando decidir agendar/comprar/desistir, inclua [OBJETIVO: AGENDAR] ou [OBJETIVO: DESISTIR] na resposta

7. **Não ultrapasse 2-3 linhas** geralmente - leads reais são concisos em chat

{profile}

## HISTÓRICO DA CONVERSA:
{history}

## ÚLTIMA MENSAGEM DO AGENTE:
{agent_message}

Responda como o lead responderia. Seja natural e realista.
Se atingiu um objetivo (agendar, desistir, etc), inclua no formato [OBJETIVO: X]"""

    def __init__(self, profile: LeadProfile, api_key: str = None):
        self.profile = profile
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.conversation_history: List[Dict[str, str]] = []
        self.objectives_reached: List[str] = []
        self.message_count = 0

    def respond(self, agent_message: str) -> Dict:
        """
        Gera resposta do lead para a mensagem do agente.

        Returns:
            Dict com:
            - message: texto da resposta
            - objective_reached: objetivo atingido (se houver)
            - tokens_used: tokens consumidos
        """
        # Adicionar mensagem do agente ao histórico
        self.conversation_history.append({
            "role": "agent",
            "content": agent_message
        })

        # Montar histórico formatado
        history_text = "\n".join([
            f"{'Agente' if m['role'] == 'agent' else 'Lead'}: {m['content']}"
            for m in self.conversation_history
        ])

        # Gerar resposta
        prompt = self.SYSTEM_PROMPT.format(
            profile=self.profile.to_prompt(),
            history=history_text,
            agent_message=agent_message
        )

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            temperature=0.8,  # Mais variação para parecer humano
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = response.content[0].text
        tokens_used = response.usage.input_tokens + response.usage.output_tokens

        # Checar se atingiu objetivo
        objective_reached = None
        if "[OBJETIVO:" in response_text:
            import re
            match = re.search(r'\[OBJETIVO:\s*(\w+)\]', response_text)
            if match:
                objective_reached = match.group(1)
                self.objectives_reached.append(objective_reached)
                # Remover tag da mensagem
                response_text = re.sub(r'\[OBJETIVO:\s*\w+\]', '', response_text).strip()

        # Adicionar resposta do lead ao histórico
        self.conversation_history.append({
            "role": "lead",
            "content": response_text
        })

        self.message_count += 1

        return {
            "message": response_text,
            "objective_reached": objective_reached,
            "tokens_used": tokens_used,
            "message_number": self.message_count
        }

    def get_initial_message(self) -> str:
        """Gera primeira mensagem do lead (início da conversa)"""

        initial_prompts = {
            LeadPersona.HOT: [
                "Oi! Vi o post de vocês sobre menopausa, quero saber mais",
                "Olá! Preciso de ajuda com reposição hormonal",
                "Oi, vim pelo Instagram. Quero agendar uma consulta"
            ],
            LeadPersona.WARM: [
                "Oi, vi o perfil de vocês. O que exatamente vocês fazem?",
                "Olá! Estou pesquisando sobre menopausa, podem me ajudar?",
                "Oi, uma amiga indicou. O que vocês oferecem?"
            ],
            LeadPersona.COLD: [
                "Oi",
                "Oq vcs fazem?",
                "Olá"
            ],
            LeadPersona.OBJECTION_HUSBAND: [
                "Oi! Vi o post sobre hormônios. Quanto custa a consulta?",
                "Olá, tenho interesse mas preciso saber valores",
                "Oi! Minha amiga fez tratamento com vcs e indicou"
            ],
            LeadPersona.OBJECTION_PRICE: [
                "Oi, qual o valor da consulta?",
                "Olá, vocês atendem por plano de saúde?",
                "Oi, quanto custa o tratamento?"
            ],
            LeadPersona.RUSHED: [
                "Oi, preciso agendar consulta pra essa semana. Tem vaga?",
                "Olá, vocês atendem amanhã?",
                "Oi, quero marcar consulta urgente"
            ]
        }

        import random
        messages = initial_prompts.get(self.profile.persona, ["Oi"])
        return random.choice(messages)

    def reset(self):
        """Reseta estado do simulador"""
        self.conversation_history = []
        self.objectives_reached = []
        self.message_count = 0


def get_profile(persona: LeadPersona) -> LeadProfile:
    """Retorna perfil pré-definido para uma persona"""
    return LEAD_PROFILES.get(persona)
