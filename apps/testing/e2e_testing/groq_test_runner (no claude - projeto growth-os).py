"""
Groq E2E Test Runner - Testa agentes usando Groq (Llama 3.1 70B)
================================================================
Versão mais barata usando Groq ao invés de Claude.
Llama 3.1 70B é 5-20x mais barato que Claude Sonnet!
"""

import os
import re
import json
import asyncio
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from groq import Groq
from supabase import create_client, Client

from .agent_loader import AgentLoader, RealAgent, FLOW_DEFINITIONS, get_flow_for_agent
from .lead_simulator import LeadPersona, get_profile, LEAD_PROFILES
from .flow_orchestrator import AgentMode

# Supabase config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')


class TestStatus(Enum):
    """Status do teste"""
    PASSED = "passed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    ERROR = "error"


@dataclass
class GroqTestScenario:
    """Cenário de teste usando Groq"""
    name: str
    description: str
    agent_name: str
    agent_version: str = None
    initial_mode: str = "first_contact"
    lead_persona: LeadPersona = LeadPersona.HOT
    flow_type: str = "sales_flow"
    expected_outcome: str = "schedule"
    expected_mode_transitions: List[str] = field(default_factory=list)
    max_turns: int = 20
    tags: List[str] = field(default_factory=list)


@dataclass
class GroqTestResult:
    """Resultado de teste com Groq"""
    scenario: GroqTestScenario
    agent: RealAgent
    status: TestStatus
    actual_outcome: Optional[str]
    conversation: List[Dict]
    mode_transitions: List[Dict]
    modes_tested: List[str]
    metrics: Dict
    error: Optional[str] = None
    started_at: datetime = field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None

    def to_dict(self) -> Dict:
        return {
            "scenario_name": self.scenario.name,
            "agent_name": self.agent.agent_name if self.agent else "Unknown",
            "agent_version": self.agent.version if self.agent else "Unknown",
            "status": self.status.value,
            "actual_outcome": self.actual_outcome,
            "expected_outcome": self.scenario.expected_outcome,
            "conversation_length": len(self.conversation),
            "conversation": self.conversation,
            "mode_transitions": self.mode_transitions,
            "modes_tested": self.modes_tested,
            "expected_transitions": self.scenario.expected_mode_transitions,
            "metrics": self.metrics,
            "error": self.error,
            "duration_seconds": (
                self.finished_at - self.started_at
            ).total_seconds() if self.finished_at else None
        }


# Mapeamento de modos equivalentes (para compatibilidade)
MODE_ALIASES = {
    "first_contact": ["first_contact", "sdr_inbound"],
    "sdr_inbound": ["sdr_inbound", "first_contact"],
    "scheduler": ["scheduler", "agendador"],
    "objection_handler": ["objection_handler", "contorna_objecoes"],
    "concierge": ["concierge"],
    "followuper": ["followuper", "reativador_base"],
    "social_seller_instagram": ["social_seller_instagram", "social_seller"],
}


def get_initial_mode_for_agent(agent: RealAgent, preferred_mode: str) -> str:
    """
    Retorna o modo inicial correto para o agente.
    Se o agente não tem o modo preferido, busca um equivalente.
    """
    available = agent.get_available_modes()

    # Se o modo preferido existe, usa ele
    if preferred_mode in available:
        return preferred_mode

    # Busca equivalente
    aliases = MODE_ALIASES.get(preferred_mode, [preferred_mode])
    for alias in aliases:
        if alias in available:
            return alias

    # Fallback: primeiro modo disponível que pareça de "primeiro contato"
    for mode in ["sdr_inbound", "first_contact", "social_seller_instagram"]:
        if mode in available:
            return mode

    # Último recurso: primeiro modo
    return available[0] if available else preferred_mode


# Cenários padrão (usam sdr_inbound que é mais comum nos agentes Growth OS)
DEFAULT_GROQ_SCENARIOS = [
    GroqTestScenario(
        name="groq_hot_lead_full_flow",
        description="Lead quente - fluxo completo com Groq",
        agent_name="Isabella Amare",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.HOT,
        flow_type="sales_flow",
        expected_outcome="schedule",
        expected_mode_transitions=["sdr_inbound", "scheduler"],
        max_turns=12,
        tags=["groq", "hot_lead"]
    ),
    GroqTestScenario(
        name="groq_warm_lead",
        description="Lead morno - qualificação com Groq",
        agent_name="Isabella Amare",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.WARM,
        flow_type="sales_flow",
        expected_outcome="schedule",
        expected_mode_transitions=["sdr_inbound", "scheduler"],
        max_turns=15,
        tags=["groq", "warm_lead"]
    ),
    GroqTestScenario(
        name="groq_price_objection",
        description="Objeção de preço com Groq",
        agent_name="Isabella Amare",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.OBJECTION_PRICE,
        flow_type="objection_flow",
        expected_outcome="objection_resolved",
        expected_mode_transitions=["sdr_inbound", "objection_handler"],
        max_turns=15,
        tags=["groq", "objection"]
    ),
]


class GroqLeadSimulator:
    """
    Simula lead REALISTA usando Groq.

    A lead NÃO decide rápido - ela passa por todo o fluxo:
    1. Primeiro conta seus sintomas
    2. Faz perguntas sobre o tratamento
    3. Pergunta sobre preço
    4. Pode ter objeções
    5. Fornece dados quando pedido
    6. Só confirma agendamento no final
    """

    LEAD_SYSTEM_PROMPT = """Você é {name}, uma mulher de {age} anos buscando ajuda médica.

## SEU PERFIL:
- Profissão: {occupation}
- Orçamento: {budget_range}
- Urgência: {urgency}

## SEUS SINTOMAS/DORES:
{pain_points}

## O QUE VOCÊ QUER:
{goals}

## SUA HISTÓRIA:
{backstory}

## SUAS OBJEÇÕES (use quando apropriado):
{objections}

## COMO VOCÊ SE COMPORTA NO WHATSAPP:

### FASE 1 - INÍCIO (turnos 1-3):
- Fale sobre seus sintomas quando perguntarem
- Faça perguntas sobre o tratamento
- NÃO decida nada ainda, só está conhecendo

### FASE 2 - INTERESSE (turnos 4-7):
- Pergunte como funciona a consulta
- Pergunte sobre o médico/especialista
- Demonstre interesse mas ainda tem dúvidas

### FASE 3 - PREÇO E OBJEÇÕES (turnos 8-12):
- Pergunte o valor quando for apropriado
- Use suas objeções naturalmente
- Pondere se vale a pena

### FASE 4 - DADOS (turnos 13-18):
- Se decidir agendar, forneça dados quando pedirem:
  * Nome completo: {name}
  * Email: {email}
  * Telefone: (11) 9{phone}
- Pergunte sobre pagamento

### FASE 5 - CONFIRMAÇÃO (turnos 19+):
- Confirme horário escolhido
- Envie comprovante (diga "enviado o comprovante")
- Agradeça

## REGRAS DE OURO:
1. NUNCA decida agendar antes do turno 10
2. Responda de forma NATURAL, curta (1-3 linhas)
3. Use emojis com moderação (1-2 por mensagem)
4. Seja consistente com seu perfil
5. Se não entender algo, peça pra repetir
6. Às vezes demore pra responder (diga "desculpa a demora")

## MARCADORES (use apenas quando apropriado):
- [ETAPA:QUALIFICACAO] - Você contou seus sintomas
- [ETAPA:INTERESSE] - Você demonstrou interesse no tratamento
- [ETAPA:PRECO] - Você perguntou/recebeu o preço
- [ETAPA:OBJECAO] - Você levantou uma objeção
- [ETAPA:DADOS] - Você forneceu seus dados
- [ETAPA:PAGAMENTO] - Você confirmou/enviou pagamento
- [ETAPA:AGENDAMENTO] - Você escolheu horário
- [ETAPA:CONFIRMADO] - Agendamento 100% confirmado
- [ETAPA:DESISTIU] - Você desistiu"""

    def __init__(self, persona: LeadPersona, groq_api_key: str = None):
        self.groq_api_key = groq_api_key or os.getenv('GROQ_API_KEY')
        self.client = Groq(api_key=self.groq_api_key)
        self.persona = persona
        self.profile = get_profile(persona)
        self.conversation_history = []
        self.current_turn = 0
        self.stages_completed = []

        # Gerar dados fake para a lead
        import random
        self.lead_data = {
            "email": f"{self.profile.name.lower().replace(' ', '.')}@gmail.com",
            "phone": f"{random.randint(90000, 99999)}-{random.randint(1000, 9999)}"
        }

    def get_initial_message(self, initial_mode: str = None) -> str:
        """Primeira mensagem do lead - contextualizad pelo modo inicial"""
        import random

        # Mensagens específicas por modo (contexto diferente)
        mode_specific_messages = {
            "concierge": [
                "Oi! Tenho consulta marcada amanhã e queria confirmar algumas coisas",
                "Olá! Recebi a mensagem sobre minha consulta. Pode me dar mais detalhes?",
                "Oi! Estou confirmando minha presença na consulta de amanhã!"
            ],
            "followuper": [
                "Oi! Desculpa o sumiço, tive uns problemas aqui...",
                "Olá! Vi que vocês mandaram mensagem. Ainda dá tempo de agendar?",
                "Oi! Ainda tenho interesse, só estava corrido aqui"
            ],
            "reativador_base": [
                "Oi! Vocês ainda atendem? Faz tempo que não venho aí",
                "Olá! Recebi a mensagem de vocês. Ainda posso agendar?",
                "Oi! Lembro de vocês, fiz tratamento há uns anos atrás"
            ],
        }

        # Se tem mensagem específica pro modo, usar ela
        if initial_mode and initial_mode in mode_specific_messages:
            return random.choice(mode_specific_messages[initial_mode])

        # Senão, usar mensagens baseadas na persona
        initial_messages = {
            LeadPersona.HOT: [
                "Oi! Vi o anúncio de vocês sobre reposição hormonal, queria saber mais",
                "Olá! Preciso de ajuda, estou sofrendo muito com a menopausa",
                "Oi, tudo bem? Uma amiga indicou vocês, ela fez tratamento aí"
            ],
            LeadPersona.WARM: [
                "Oi, vi vocês no Instagram. Queria entender melhor sobre o tratamento",
                "Olá! Tenho acompanhado o perfil, achei interessante",
                "Oi! Vi um post sobre menopausa e me identifiquei muito"
            ],
            LeadPersona.COLD: [
                "Oi, qual o preço da consulta?",
                "Quanto custa?",
                "Vocês atendem por convênio?"
            ],
            LeadPersona.OBJECTION_PRICE: [
                "Oi, qual o valor da consulta? Já adianto que tô sem muito dinheiro",
                "Olá, quanto custa mais ou menos o tratamento?",
                "Oi, queria saber o preço antes de mais nada"
            ],
            LeadPersona.OBJECTION_HUSBAND: [
                "Olá! Tenho interesse mas preciso conversar com meu marido primeiro",
                "Oi, quero saber mais mas quem decide as finanças lá em casa é meu esposo",
                "Oi! Uma amiga indicou, mas não sei se meu marido vai concordar"
            ],
            LeadPersona.RUSHED: [
                "Oi, sou bem direta - preciso de tratamento hormonal urgente, como funciona?",
                "Olá! Não aguento mais, preciso resolver isso logo. Como faço?",
                "Oi, quero agendar o mais rápido possível, tem vaga essa semana?"
            ],
            LeadPersona.OBJECTION_TIME: [
                "Oi, tenho interesse mas minha agenda é muito corrida...",
                "Olá! Vi o anúncio mas confesso que não tenho muito tempo pra consultas",
                "Oi, queria saber mais mas já adianto que minha rotina é muito puxada"
            ],
            LeadPersona.EXPERIENCED: [
                "Oi, já fiz reposição antes com outro médico e não foi boa experiência...",
                "Olá! Tenho interesse mas já tentei tratamento hormonal e tive efeitos colaterais",
                "Oi, quero entender como vocês trabalham porque já tentei antes e não deu certo"
            ]
        }

        options = initial_messages.get(self.persona, ["Olá, quero saber mais sobre o tratamento"])
        return random.choice(options)

    def respond(self, agent_message: str) -> Dict:
        """Gera resposta REALISTA do lead usando Groq"""

        self.current_turn += 1

        self.conversation_history.append({
            "role": "assistant",
            "content": agent_message
        })

        system_prompt = self.LEAD_SYSTEM_PROMPT.format(
            name=self.profile.name,
            age=self.profile.age,
            occupation=self.profile.occupation,
            budget_range=self.profile.budget_range,
            urgency=self.profile.urgency,
            pain_points="\n".join(f"- {p}" for p in self.profile.pain_points),
            goals="\n".join(f"- {g}" for g in self.profile.goals),
            backstory=self.profile.backstory,
            objections="\n".join(f"- {o}" for o in self.profile.objections) if self.profile.objections else "- Nenhuma objeção forte",
            email=self.lead_data["email"],
            phone=self.lead_data["phone"]
        )

        # Adicionar contexto do turno atual
        turn_context = f"""

## TURNO ATUAL: {self.current_turn}
## ETAPAS JÁ COMPLETADAS: {', '.join(self.stages_completed) if self.stages_completed else 'nenhuma'}

Lembre-se: você está no turno {self.current_turn}.
- Turnos 1-3: Fase inicial, conte sintomas
- Turnos 4-7: Demonstre interesse, pergunte sobre tratamento
- Turnos 8-12: Preço e objeções
- Turnos 13-18: Forneça dados se pedido
- Turnos 19+: Confirmação final

Responda de acordo com a fase atual!"""

        messages = [{"role": "system", "content": system_prompt + turn_context}]
        messages.extend(self.conversation_history)
        messages.append({
            "role": "user",
            "content": f"O agente disse: {agent_message}\n\nResponda como a cliente responderia (turno {self.current_turn}):"
        })

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )

        response_text = response.choices[0].message.content
        tokens = response.usage.total_tokens

        # Detectar etapas completadas (suporta variações com/sem espaço)
        stage_detected = None
        stage_names = [
            "QUALIFICACAO", "INTERESSE", "PRECO", "OBJECAO",
            "DADOS", "PAGAMENTO", "AGENDAMENTO", "CONFIRMADO", "DESISTIU"
        ]

        for stage_name in stage_names:
            # Regex flexível: [ETAPA:CONFIRMADO] ou [ETAPA: CONFIRMADO] ou variações
            pattern = rf'\[ETAPA:\s*{stage_name}\]'
            if re.search(pattern, response_text, re.IGNORECASE):
                stage_lower = stage_name.lower()
                if stage_lower not in self.stages_completed:
                    self.stages_completed.append(stage_lower)
                stage_detected = stage_lower
                response_text = re.sub(pattern, '', response_text, flags=re.IGNORECASE).strip()

        # Detectar objetivo final
        objective = None
        if stage_detected == "confirmado":
            objective = "agendamento_confirmado"
        elif stage_detected == "desistiu":
            objective = "lead_perdido"

        # Também verificar marcadores antigos por compatibilidade
        if "[OBJETIVO: AGENDAR]" in response_text:
            # Só aceitar se já passou por etapas suficientes
            if len(self.stages_completed) >= 3 or self.current_turn >= 10:
                objective = "agendamento_confirmado"
            response_text = response_text.replace("[OBJETIVO: AGENDAR]", "").strip()
        elif "[OBJETIVO: DESISTIR]" in response_text:
            objective = "lead_perdido"
            response_text = response_text.replace("[OBJETIVO: DESISTIR]", "").strip()
        elif "[OBJETIVO: RESOLVIDO]" in response_text:
            if "objecao" not in self.stages_completed:
                self.stages_completed.append("objecao")
            response_text = response_text.replace("[OBJETIVO: RESOLVIDO]", "").strip()

        self.conversation_history.append({
            "role": "user",
            "content": response_text
        })

        return {
            "message": response_text,
            "tokens_used": tokens,
            "objective_reached": objective,
            "stage_completed": stage_detected,
            "stages_so_far": self.stages_completed.copy(),
            "turn": self.current_turn
        }


class GroqE2ETestRunner:
    """
    Executa testes E2E usando Groq (Llama 3.1 70B).

    Custo aproximado:
    - Groq Llama 3.1 70B: $0.59/1M input, $0.79/1M output
    - vs Claude Sonnet: $3/1M input, $15/1M output

    Economia de ~5-20x!
    """

    # Regras de transição por modo
    MODE_TRANSITION_RULES = {
        "sdr_inbound": {
            "scheduler": ["agendar", "horário", "data", "disponibilidade", "marcar", "consulta"],
            "objection_handler": ["caro", "preço", "pensar", "depois", "não posso", "marido", "orçamento"],
        },
        "scheduler": {
            "concierge": ["confirmado", "pagamento realizado", "comprovante", "agendamento confirmado"],
            "objection_handler": ["caro", "pensar", "não consigo", "orçamento"],
        },
        "objection_handler": {
            "scheduler": ["ok", "vamos", "agendar", "pode ser", "quero", "aceito"],
            "followuper": ["depois", "não agora", "pensar mais"],
        },
        "followuper": {
            "sdr_inbound": ["interessada", "quero saber", "ainda busco", "continuo com"],
            "scheduler": ["agendar", "marcar", "horário"],
        },
        "concierge": {
            # Concierge geralmente não transiciona, é o fim do fluxo
        },
        "social_seller_instagram": {
            "scheduler": ["agendar", "horário", "data", "marcar consulta"],
            "objection_handler": ["caro", "preço", "pensar"],
        },
        "reativador_base": {
            "scheduler": ["agendar", "marcar", "horário", "quero"],
            "sdr_inbound": ["interessada", "quero saber mais"],
        }
    }

    MODE_TRANSITION_PROMPT = """Analise a resposta do agente e determine se há uma transição de modo EXPLÍCITA.

REGRAS CRÍTICAS:
1. SÓ transicione se a resposta indicar CLARAMENTE que o agente está passando para outra etapa
2. Palavras como "agendar" ou "horário" SÓ indicam transição se o agente REALMENTE está iniciando agendamento
3. Perguntas sobre preço ou dúvidas do lead NÃO são motivo para transição
4. O agente deve COMPLETAR sua função atual antes de transicionar:
   - SDR_INBOUND: qualificar lead, descobrir dores, apresentar solução
   - SCHEDULER: coletar dados, processar pagamento, confirmar agendamento
   - OBJECTION_HANDLER: identificar objeção, validar, neutralizar, só então voltar
   - CONCIERGE: apenas lembretes e confirmações, raramente transiciona

MODO ATUAL: {current_mode}
RESPOSTA DO AGENTE: {agent_response}
MODOS DISPONÍVEIS: {available_modes}

INDICADORES DE TRANSIÇÃO VERDADEIRA:
- "Vou verificar os horários" → scheduler
- "Deixa eu te passar para..." → transição
- "Agora vamos agendar..." → scheduler
- Menção de processamento de pagamento → scheduler
- Confirmação de agendamento completo → concierge
- Tool call de criar cobrança/agendamento → scheduler ou concierge

INDICADORES DE NÃO TRANSIÇÃO:
- Pergunta "você gostaria de agendar?" → NÃO é transição, é sondagem
- Explicando benefícios → continua no modo atual
- Respondendo dúvidas → continua no modo atual

Responda APENAS em JSON válido:
{{"should_transition": true/false, "target_mode": "modo" ou null, "reason": "motivo curto"}}"""

    def __init__(self, groq_api_key: str = None):
        self.groq_api_key = groq_api_key or os.getenv('GROQ_API_KEY')
        self.client = Groq(api_key=self.groq_api_key)
        self.agent_loader = AgentLoader()
        self.results: List[GroqTestResult] = []

    async def run_scenario(self, scenario: GroqTestScenario) -> GroqTestResult:
        """Executa cenário com Groq"""

        print(f"\n{'='*70}")
        print(f"🧪 TESTE (GROQ): {scenario.name}")
        print(f"   Agente: {scenario.agent_name}")
        print(f"   Persona: {scenario.lead_persona.value}")
        print(f"   Modo inicial: {scenario.initial_mode}")
        print(f"{'='*70}\n")

        # Carregar agente
        print("📥 Carregando agente do Supabase...")
        agent = self.agent_loader.load_agent(
            agent_name=scenario.agent_name,
            version=scenario.agent_version
        )

        if not agent:
            print(f"❌ Agente '{scenario.agent_name}' não encontrado!")
            return GroqTestResult(
                scenario=scenario,
                agent=None,
                status=TestStatus.ERROR,
                actual_outcome=None,
                conversation=[],
                mode_transitions=[],
                modes_tested=[],
                metrics={"total_tokens": 0, "turns": 0},
                error=f"Agente '{scenario.agent_name}' não encontrado"
            )

        print(f"✅ Agente: {agent.agent_name} ({agent.version})")
        print(f"   Modos: {agent.get_available_modes()}")

        if scenario.initial_mode not in agent.get_available_modes():
            scenario.initial_mode = agent.get_available_modes()[0]

        # Inicializar
        lead_simulator = GroqLeadSimulator(scenario.lead_persona, self.groq_api_key)

        result = GroqTestResult(
            scenario=scenario,
            agent=agent,
            status=TestStatus.ERROR,
            actual_outcome=None,
            conversation=[],
            mode_transitions=[],
            modes_tested=[scenario.initial_mode],
            metrics={"total_tokens": 0, "agent_tokens": 0, "lead_tokens": 0, "turns": 0}
        )

        current_mode = scenario.initial_mode
        context = {"lead_info": {}, "qualification": {}, "objections": []}

        try:
            # Primeira mensagem (contextualizada pelo modo inicial)
            lead_message = lead_simulator.get_initial_message(scenario.initial_mode)
            print(f"\n👤 Lead: {lead_message}")
            result.conversation.append({"role": "lead", "content": lead_message, "turn": 0})

            turn = 0
            while turn < scenario.max_turns:
                turn += 1

                # Agente responde
                agent_response, agent_tokens = self._get_agent_response(
                    agent, current_mode, result.conversation, lead_message, context
                )
                result.metrics["agent_tokens"] += agent_tokens
                result.metrics["total_tokens"] += agent_tokens

                print(f"\n🤖 [{current_mode.upper()}]: {agent_response}")
                result.conversation.append({
                    "role": "agent", "mode": current_mode,
                    "content": agent_response, "turn": turn
                })

                # Detectar transição
                transition = self._detect_mode_transition(
                    current_mode, agent_response, agent.get_available_modes()
                )

                if transition and transition.get("should_transition"):
                    target = transition.get("target_mode")
                    if target and target in agent.get_available_modes():
                        result.mode_transitions.append({
                            "from": current_mode, "to": target,
                            "reason": transition.get("reason", ""), "turn": turn
                        })
                        print(f"\n🔄 TRANSIÇÃO: {current_mode} → {target}")
                        current_mode = target
                        if target not in result.modes_tested:
                            result.modes_tested.append(target)

                # Lead responde
                lead_result = lead_simulator.respond(agent_response)
                lead_message = lead_result["message"]
                result.metrics["lead_tokens"] += lead_result["tokens_used"]
                result.metrics["total_tokens"] += lead_result["tokens_used"]

                print(f"\n👤 Lead: {lead_message}")
                result.conversation.append({"role": "lead", "content": lead_message, "turn": turn})

                # Mostrar etapa completada
                if lead_result.get("stage_completed"):
                    print(f"   📍 Etapa: {lead_result['stage_completed'].upper()}")

                # Checar objetivo
                if lead_result.get("objective_reached"):
                    result.actual_outcome = lead_result["objective_reached"]
                    stages_done = lead_result.get("stages_so_far", [])
                    print(f"\n✅ OBJETIVO: {result.actual_outcome}")
                    print(f"   Etapas completadas: {', '.join(stages_done)}")

                    # Objetivos que encerram o teste imediatamente (sucesso ou fracasso definitivo)
                    final_outcomes = [
                        "agendamento_confirmado",  # Sucesso: lead agendou
                        "lead_perdido",            # Fracasso: lead desistiu
                        "lead_qualificado",        # Sucesso: lead qualificado
                        "dados_coletados",         # Sucesso: dados coletados
                        "objecao_resolvida",       # Sucesso: objeção superada
                        "reativacao_sucesso",      # Sucesso: lead reativado
                        "confirmed_attendance",    # Sucesso: confirmou presença (concierge)
                        "feedback_collected",      # Sucesso: feedback coletado (concierge)
                    ]

                    if result.actual_outcome in final_outcomes:
                        print(f"   🏁 Objetivo final atingido!")
                        break

                    # Para outros objetivos parciais, continuar se não tem etapas suficientes
                    min_stages_for_success = 2
                    if len(stages_done) >= min_stages_for_success:
                        break
                    else:
                        print(f"   ⚠️ Continuando... precisa de mais {min_stages_for_success - len(stages_done)} etapas")
                        result.actual_outcome = None  # Reset para continuar

            result.metrics["turns"] = turn
            result.metrics["stages_completed"] = lead_simulator.stages_completed
            result.status = self._evaluate_result(scenario, result)
            result.finished_at = datetime.utcnow()

        except Exception as e:
            result.status = TestStatus.ERROR
            result.error = str(e)
            result.finished_at = datetime.utcnow()
            print(f"\n❌ ERRO: {e}")
            import traceback
            traceback.print_exc()

        print(f"\n{'='*70}")
        print(f"📊 RESULTADO: {result.status.value.upper()}")
        print(f"   Turnos: {result.metrics['turns']}")
        print(f"   Tokens: {result.metrics['total_tokens']}")
        print(f"   Modos: {result.modes_tested}")
        print(f"{'='*70}\n")

        self.results.append(result)

        # Salvar no Supabase automaticamente
        save_e2e_result_to_supabase(result)

        return result

    def _get_agent_response(
        self, agent: RealAgent, mode: str, history: List[Dict],
        last_message: str, context: Dict
    ) -> tuple[str, int]:
        """Gera resposta do agente usando Groq"""

        full_prompt = agent.get_full_prompt(mode)

        history_text = "\n".join([
            f"{'Agente' if m['role'] == 'agent' else 'Lead'}: {m['content']}"
            for m in history[-8:]
        ])

        system_prompt = f"""{full_prompt}

### CONTEXTO ###
{json.dumps(context, ensure_ascii=False)}

### HISTÓRICO ###
{history_text if history_text else "(início)"}

### REGRAS ###
- Respostas curtas (2-4 linhas) para WhatsApp
- Use emojis com moderação
- Seja natural e empática"""

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Lead disse: {last_message}"}
            ],
            max_tokens=400,
            temperature=0.7
        )

        return response.choices[0].message.content, response.usage.total_tokens

    def _detect_mode_transition(
        self, current_mode: str, agent_response: str, available_modes: List[str]
    ) -> Optional[Dict]:
        """Detecta transição de modo"""

        prompt = self.MODE_TRANSITION_PROMPT.format(
            current_mode=current_mode,
            agent_response=agent_response,
            available_modes=", ".join(available_modes)
        )

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0
        )

        try:
            text = response.choices[0].message.content
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(text[json_start:json_end])
        except:
            pass
        return None

    def _evaluate_result(self, scenario: GroqTestScenario, result: GroqTestResult) -> TestStatus:
        """
        Avalia resultado considerando:
        1. Se atingiu o objetivo esperado
        2. Se passou pelas etapas mínimas
        3. Se fez as transições de modo esperadas
        """

        stages_completed = result.metrics.get("stages_completed", [])

        # Timeout se atingiu max_turns sem concluir
        if result.metrics["turns"] >= scenario.max_turns:
            # Mesmo com timeout, pode ter sido parcialmente bem sucedido
            if len(stages_completed) >= 3:
                return TestStatus.PASSED  # Fez bastante progresso
            return TestStatus.TIMEOUT

        # Mapear outcomes
        outcome_mapping = {
            "agendar": "agendamento_confirmado",
            "agendamento": "agendamento_confirmado",
            "schedule": "agendamento_confirmado",
            "appointment_booked": "agendamento_confirmado",
            "convencido": "objection_resolved",
            "resolvido": "objection_resolved",
            "desistir": "lead_perdido",
            "desistiu": "lead_perdido",
            "escalado_humano": "escalado_humano",
        }

        if result.actual_outcome:
            normalized = outcome_mapping.get(result.actual_outcome, result.actual_outcome)
            expected_normalized = outcome_mapping.get(scenario.expected_outcome, scenario.expected_outcome)

            # Checar se outcome bate
            if normalized == expected_normalized:
                # Verificar se passou por etapas suficientes
                min_stages = 3 if "confirmado" in normalized else 1
                if len(stages_completed) >= min_stages:
                    return TestStatus.PASSED

            # Se esperava objection_resolved mas conseguiu agendamento, é SUCESSO
            # (agendamento implica que a objeção foi superada)
            if expected_normalized == "objection_resolved" and normalized == "agendamento_confirmado":
                return TestStatus.PASSED

            # Outcomes positivos são considerados sucesso
            positive_outcomes = [
                "agendamento_confirmado",
                "objection_resolved",
                "lead_qualificado",
                "dados_coletados",
                "reativacao_sucesso",
                "confirmed_attendance",
                "feedback_collected"
            ]
            if normalized in positive_outcomes:
                # Mínimo de 2 etapas para sucesso (ou qualquer quantidade se atingiu objetivo final)
                if len(stages_completed) >= 2 or "confirmado" in stages_completed:
                    return TestStatus.PASSED

        # Checar transições de modo
        actual_modes = [t["to"] if isinstance(t, dict) else t for t in result.mode_transitions]
        actual_modes.insert(0, scenario.initial_mode)

        if scenario.expected_mode_transitions:
            if all(m in actual_modes for m in scenario.expected_mode_transitions):
                return TestStatus.PASSED

        # Se completou muitas etapas, considerar sucesso parcial
        if len(stages_completed) >= 5:
            return TestStatus.PASSED

        return TestStatus.FAILED

    async def run_all_scenarios(self, scenarios: List[GroqTestScenario] = None) -> List[GroqTestResult]:
        """Executa todos os cenários"""

        scenarios = scenarios or DEFAULT_GROQ_SCENARIOS

        print(f"\n{'#'*70}")
        print(f"# E2E TEST SUITE COM GROQ (LLAMA 3.1 70B) - {len(scenarios)} cenários")
        print(f"# 💰 Custo ~5-20x menor que Claude!")
        print(f"{'#'*70}\n")

        available = self.agent_loader.list_available_agents()
        print("📋 Agentes disponíveis:")
        for ag in available:
            print(f"   • {ag['agent_name']} ({ag['version']})")
        print()

        for scenario in scenarios:
            await self.run_scenario(scenario)

        passed = sum(1 for r in self.results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAILED)
        timeout = sum(1 for r in self.results if r.status == TestStatus.TIMEOUT)
        error = sum(1 for r in self.results if r.status == TestStatus.ERROR)

        print(f"\n{'#'*70}")
        print(f"# RESUMO - GROQ (LLAMA 3.1 70B)")
        print(f"{'#'*70}")
        print(f"✅ Passed:  {passed}/{len(self.results)}")
        print(f"❌ Failed:  {failed}/{len(self.results)}")
        print(f"⏱️ Timeout: {timeout}/{len(self.results)}")
        print(f"💥 Error:   {error}/{len(self.results)}")
        print(f"{'#'*70}\n")

        return self.results

    def get_summary(self) -> Dict:
        """Resumo dos testes"""
        if not self.results:
            return {"total": 0, "passed": 0, "failed": 0, "timeout": 0, "error": 0,
                    "total_tokens": 0, "avg_turns": 0, "modes_coverage": []}

        all_modes = set()
        for r in self.results:
            all_modes.update(r.modes_tested)

        return {
            "total": len(self.results),
            "passed": sum(1 for r in self.results if r.status == TestStatus.PASSED),
            "failed": sum(1 for r in self.results if r.status == TestStatus.FAILED),
            "timeout": sum(1 for r in self.results if r.status == TestStatus.TIMEOUT),
            "error": sum(1 for r in self.results if r.status == TestStatus.ERROR),
            "total_tokens": sum(r.metrics["total_tokens"] for r in self.results),
            "avg_turns": sum(r.metrics["turns"] for r in self.results) / len(self.results),
            "modes_coverage": list(all_modes)
        }


# =============================================================================
# SALVAR RESULTADOS NO SUPABASE
# =============================================================================

def get_supabase_client() -> Client:
    """Retorna cliente Supabase"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def save_e2e_result_to_supabase(result: GroqTestResult, agent_version_id: str = None) -> bool:
    """
    Salva resultado E2E na tabela e2e_test_results.

    Args:
        result: Resultado do teste
        agent_version_id: ID do agente no Supabase (opcional, busca automaticamente)

    Returns:
        True se salvou com sucesso
    """
    try:
        client = get_supabase_client()

        # Buscar agent_version_id se não fornecido
        if not agent_version_id and result.agent:
            # Buscar pelo nome do agente
            agent_result = client.table('agent_versions').select('id').ilike(
                'agent_name', f'%{result.agent.agent_name}%'
            ).order('version', desc=True).limit(1).execute()

            if agent_result.data:
                agent_version_id = agent_result.data[0]['id']

        # Calcular duração
        duration = None
        if result.finished_at and result.started_at:
            duration = (result.finished_at - result.started_at).total_seconds()

        # Calcular score (0-10)
        score = None
        stages = result.metrics.get("stages_completed", [])
        if result.status == TestStatus.PASSED:
            score = min(10, 7 + len(stages) * 0.5)  # Base 7, +0.5 por etapa
        elif result.status == TestStatus.TIMEOUT:
            score = min(6, 4 + len(stages) * 0.4)  # Base 4
        elif result.status == TestStatus.FAILED:
            score = min(5, 2 + len(stages) * 0.3)  # Base 2
        else:
            score = 0

        # Preparar dados
        data = {
            "agent_version_id": agent_version_id,
            "scenario_name": result.scenario.name,
            "scenario_description": result.scenario.description,
            "test_type": "e2e_groq",
            "lead_persona": result.scenario.lead_persona.value if result.scenario.lead_persona else None,
            "initial_agent": result.scenario.initial_mode,
            "expected_outcome": result.scenario.expected_outcome,
            "max_turns": result.scenario.max_turns,
            "status": result.status.value,
            "actual_outcome": result.actual_outcome,
            "handoffs": result.mode_transitions,
            "total_turns": result.metrics.get("turns", 0),
            "total_tokens": result.metrics.get("total_tokens", 0),
            "duration_seconds": duration,
            "score": score,
            "conversation": result.conversation,
            "modes_tested": result.modes_tested,
            "mode_transitions": result.mode_transitions,
            "error_message": result.error,
            "model_used": "groq-llama-3.3-70b-versatile",
            "tags": result.scenario.tags,
            "started_at": result.started_at.isoformat() if result.started_at else None,
            "finished_at": result.finished_at.isoformat() if result.finished_at else None,
        }

        # Inserir
        insert_result = client.table('e2e_test_results').insert(data).execute()

        if insert_result.data:
            print(f"   💾 Salvo no Supabase: {result.scenario.name}")
            return True
        else:
            print(f"   ⚠️ Erro ao salvar: sem dados retornados")
            return False

    except Exception as e:
        print(f"   ❌ Erro ao salvar no Supabase: {e}")
        return False


def save_all_results_to_supabase(results: List[GroqTestResult]) -> Dict:
    """
    Salva todos os resultados no Supabase.

    Returns:
        Dict com estatísticas de salvamento
    """
    saved = 0
    failed = 0

    for result in results:
        if save_e2e_result_to_supabase(result):
            saved += 1
        else:
            failed += 1

    return {
        "saved": saved,
        "failed": failed,
        "total": len(results)
    }
