"""
Cenarios E2E para FOLLOWUP e REATIVACAO
========================================
Testa fluxos de leads que sumiram no funil ou leads de lista antiga.

Fluxos:
1. Followuper (sumiu no funil) -> followuper(3 etapas) -> scheduler(5 etapas) -> concierge(2 etapas)
2. Reativador Base (lista antiga) -> reativador_base -> scheduler -> concierge
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum
from datetime import datetime


class FollowupLeadPersona(Enum):
    """Personas especificas para cenarios de followup/reativacao"""

    # Lead que sumiu depois de mostrar interesse
    GHOSTED_INTERESTED = "ghosted_interested"

    # Lead que sumiu depois de receber preco
    GHOSTED_AFTER_PRICE = "ghosted_after_price"

    # Lead que sumiu depois de quase agendar
    GHOSTED_ALMOST_SCHEDULED = "ghosted_almost_scheduled"

    # Lead de lista antiga - nunca interagiu direito
    OLD_LIST_COLD = "old_list_cold"

    # Lead de lista antiga - interagiu ha meses
    OLD_LIST_DORMANT = "old_list_dormant"

    # Lead que ja agendou e nao compareceu
    NO_SHOW = "no_show"

    # Lead que cancelou consulta
    CANCELLED = "cancelled"

    # Lead que pediu para retornar depois
    ASKED_CALLBACK = "asked_callback"


@dataclass
class FollowupLeadProfile:
    """Perfil detalhado de lead para followup/reativacao"""
    persona: FollowupLeadPersona
    name: str
    age: int
    occupation: str
    pain_points: List[str]
    objections: List[str]
    last_interaction_days_ago: int
    last_stage_reached: str  # onde parou no funil
    reason_went_cold: str
    budget_range: str
    urgency: str
    backstory: str
    reactivation_triggers: List[str]  # o que pode fazer ela voltar
    goals: List[str]

    def to_prompt(self) -> str:
        """Converte perfil em prompt para o simulador"""
        return f"""
## PERFIL DO LEAD PARA REATIVACAO

**Nome:** {self.name}
**Idade:** {self.age} anos
**Profissao:** {self.occupation}
**Tipo:** {self.persona.value}

**Ultima Interacao:** Ha {self.last_interaction_days_ago} dias atras
**Onde Parou:** {self.last_stage_reached}
**Motivo que Esfriou:** {self.reason_went_cold}

**Dores/Problemas (ainda tem):**
{chr(10).join(f"- {p}" for p in self.pain_points)}

**Objecoes que pode levantar:**
{chr(10).join(f"- {o}" for o in self.objections)}

**Orcamento:** {self.budget_range}
**Urgencia Atual:** {self.urgency}

**Backstory:**
{self.backstory}

**O que pode fazer ela voltar:**
{chr(10).join(f"- {t}" for t in self.reactivation_triggers)}

**Seus objetivos na conversa:**
{chr(10).join(f"- {g}" for g in self.goals)}
"""


# Perfis pre-definidos para followup/reativacao
FOLLOWUP_LEAD_PROFILES = {
    FollowupLeadPersona.GHOSTED_INTERESTED: FollowupLeadProfile(
        persona=FollowupLeadPersona.GHOSTED_INTERESTED,
        name="Fernanda",
        age=49,
        occupation="Contadora",
        pain_points=[
            "Ondas de calor intensas",
            "Insonia que piorou",
            "Irritabilidade afetando trabalho"
        ],
        objections=[
            "Estava ocupada, esqueci de responder",
            "Preciso ver se ainda tenho interesse",
            "Talvez o timing nao seja agora"
        ],
        last_interaction_days_ago=5,
        last_stage_reached="first_contact - mostrou interesse",
        reason_went_cold="Ficou ocupada com trabalho e esqueceu",
        budget_range="Medio - nao era barreira",
        urgency="medium",
        backstory="Mostrou interesse genuino, perguntou sobre tratamento, mas sumiu depois. Os sintomas continuam e ela sabe que precisa resolver.",
        reactivation_triggers=[
            "Lembrar que os sintomas continuam",
            "Oferecer horario conveniente",
            "Mostrar urgencia com limite de vagas"
        ],
        goals=[
            "Ver se ainda vale a pena",
            "Conseguir mais informacoes antes de decidir",
            "Talvez agendar se for facil"
        ]
    ),

    FollowupLeadPersona.GHOSTED_AFTER_PRICE: FollowupLeadProfile(
        persona=FollowupLeadPersona.GHOSTED_AFTER_PRICE,
        name="Claudia",
        age=52,
        occupation="Professora",
        pain_points=[
            "Sintomas moderados de menopausa",
            "Cansaco constante",
            "Dificuldade de concentracao"
        ],
        objections=[
            "O preco me assustou um pouco",
            "Preciso pensar melhor",
            "Vou ver se consigo pelo convenio primeiro"
        ],
        last_interaction_days_ago=7,
        last_stage_reached="first_contact - recebeu preco",
        reason_went_cold="Preco foi acima do esperado",
        budget_range="Limitado - preco e barreira real",
        urgency="low_to_medium",
        backstory="Gostou do atendimento mas quando soube o preco ficou assustada. Foi pesquisar alternativas mas nao encontrou.",
        reactivation_triggers=[
            "Facilidade de parcelamento",
            "Comparar custo-beneficio vs convenio",
            "Mostrar valor do investimento",
            "Oferecer condicao especial"
        ],
        goals=[
            "Entender se vale o investimento",
            "Negociar condicoes melhores",
            "Talvez agendar se parcelar bastante"
        ]
    ),

    FollowupLeadPersona.GHOSTED_ALMOST_SCHEDULED: FollowupLeadProfile(
        persona=FollowupLeadPersona.GHOSTED_ALMOST_SCHEDULED,
        name="Regina",
        age=47,
        occupation="Gerente Comercial",
        pain_points=[
            "Ondas de calor em reunioes",
            "Ansiedade aumentando",
            "Queda de cabelo"
        ],
        objections=[
            "Estava verificando agenda e esqueci",
            "Surgiu um imprevisto",
            "Nao sei se os horarios ainda servem"
        ],
        last_interaction_days_ago=3,
        last_stage_reached="scheduler - ia escolher horario",
        reason_went_cold="Estava no trabalho, ia responder depois e esqueceu",
        budget_range="Bom - ja tinha aceitado o preco",
        urgency="high",
        backstory="Ja estava convencida, ia agendar, mas distraiu. Sabe que precisa e quer resolver, so precisa de um empurraozinho.",
        reactivation_triggers=[
            "Oferecer os horarios novamente",
            "Criar urgencia (vagas limitadas)",
            "Lembrar dos sintomas"
        ],
        goals=[
            "Finalmente agendar a consulta",
            "Resolver isso logo",
            "Nao perder mais tempo"
        ]
    ),

    FollowupLeadPersona.OLD_LIST_COLD: FollowupLeadProfile(
        persona=FollowupLeadPersona.OLD_LIST_COLD,
        name="Marcia",
        age=54,
        occupation="Aposentada",
        pain_points=[
            "Sintomas de menopausa ha anos",
            "Ja tentou varias coisas",
            "Resignada a viver assim"
        ],
        objections=[
            "Quem e voce?",
            "De onde pegaram meu numero?",
            "Ja tentei tratamento e nao funcionou",
            "Nao acredito mais nisso"
        ],
        last_interaction_days_ago=180,
        last_stage_reached="captura - so deixou contato",
        reason_went_cold="Nunca teve contato real, so cadastro em landing page",
        budget_range="Incerto - precisa convencer primeiro",
        urgency="low",
        backstory="Cadastrou ha muito tempo num material gratuito, esqueceu. Esta cansada de vendedores. Precisa de abordagem muito diferente.",
        reactivation_triggers=[
            "Abordagem nao-vendedora",
            "Conteudo de valor primeiro",
            "Empatia e paciencia",
            "Caso de sucesso similar a ela"
        ],
        goals=[
            "Entender quem esta entrando em contato",
            "Ver se e serio ou so vendedor",
            "Nao perder tempo"
        ]
    ),

    FollowupLeadPersona.OLD_LIST_DORMANT: FollowupLeadProfile(
        persona=FollowupLeadPersona.OLD_LIST_DORMANT,
        name="Sonia",
        age=51,
        occupation="Enfermeira",
        pain_points=[
            "Ondas de calor no trabalho",
            "Insonia afetando plantoes",
            "Irritabilidade"
        ],
        objections=[
            "Ah lembro de voces, mas na epoca nao deu",
            "Sera que agora e um bom momento?",
            "Mudou alguma coisa desde entao?"
        ],
        last_interaction_days_ago=90,
        last_stage_reached="first_contact - conversou mas nao agendou",
        reason_went_cold="Nao era o momento certo na epoca",
        budget_range="Medio - pode investir agora",
        urgency="medium",
        backstory="Conversou ha 3 meses, gostou, mas na epoca tinha outras prioridades. Agora os sintomas pioraram.",
        reactivation_triggers=[
            "Lembrar da conversa anterior",
            "Perguntar se os sintomas continuam",
            "Mostrar novidades no tratamento",
            "Facilitar o processo"
        ],
        goals=[
            "Retomar de onde parou",
            "Ver o que mudou",
            "Avaliar se agora e a hora"
        ]
    ),

    FollowupLeadPersona.NO_SHOW: FollowupLeadProfile(
        persona=FollowupLeadPersona.NO_SHOW,
        name="Patricia",
        age=48,
        occupation="Advogada",
        pain_points=[
            "Sintomas intensos",
            "Agenda muito apertada",
            "Stress constante"
        ],
        objections=[
            "Desculpa, tive uma emergencia",
            "Esqueci completamente",
            "Nao recebi lembrete"
        ],
        last_interaction_days_ago=2,
        last_stage_reached="concierge - tinha consulta agendada",
        reason_went_cold="Nao compareceu a consulta",
        budget_range="Bom - ja tinha pago",
        urgency="high",
        backstory="Fez todo o processo, pagou, mas nao compareceu. Pode ter sido emergencia real ou esquecimento.",
        reactivation_triggers=[
            "Abordagem sem julgamento",
            "Oferecer reagendamento facil",
            "Mostrar que entende a correria"
        ],
        goals=[
            "Reagendar sem constrangimento",
            "Resolver isso logo",
            "Nao perder o dinheiro ja investido"
        ]
    ),

    FollowupLeadPersona.CANCELLED: FollowupLeadProfile(
        persona=FollowupLeadPersona.CANCELLED,
        name="Lucia",
        age=50,
        occupation="Empresaria",
        pain_points=[
            "Sintomas que estao piorando",
            "Falta de tempo",
            "Muitas responsabilidades"
        ],
        objections=[
            "Tive que cancelar por motivo X",
            "Ainda nao sei quando vou poder",
            "Tenho medo de cancelar de novo"
        ],
        last_interaction_days_ago=4,
        last_stage_reached="scheduler - tinha agendado",
        reason_went_cold="Cancelou a consulta por imprevisto",
        budget_range="Bom - preco nao era problema",
        urgency="medium",
        backstory="Queria muito fazer mas teve que cancelar. Sente-se mal por isso. Quer reagendar mas tem medo de dar errado de novo.",
        reactivation_triggers=[
            "Mostrar flexibilidade de horarios",
            "Tranquilizar sobre cancelamentos",
            "Oferecer horario que funcione melhor"
        ],
        goals=[
            "Encontrar horario que realmente funcione",
            "Garantir que vai conseguir ir",
            "Resolver de uma vez"
        ]
    ),

    FollowupLeadPersona.ASKED_CALLBACK: FollowupLeadProfile(
        persona=FollowupLeadPersona.ASKED_CALLBACK,
        name="Eliane",
        age=46,
        occupation="Bancaria",
        pain_points=[
            "Sintomas moderados",
            "Preocupada com saude",
            "Quer prevencao"
        ],
        objections=[
            "Agora sim posso conversar",
            "O que tinha disponivel mesmo?",
            "Ainda vale aquela condicao?"
        ],
        last_interaction_days_ago=7,
        last_stage_reached="first_contact - pediu para retornar",
        reason_went_cold="Estava em reuniao/ocupada e pediu retorno",
        budget_range="Bom - so precisava de tempo",
        urgency="medium_to_high",
        backstory="Tinha interesse mas estava genuinamente ocupada. Pediu para retornar e esta esperando o contato.",
        reactivation_triggers=[
            "Retorno conforme combinado",
            "Manter as condicoes prometidas",
            "Ir direto ao ponto"
        ],
        goals=[
            "Retomar conversa",
            "Agendar consulta",
            "Resolver isso finalmente"
        ]
    )
}


class FollowupStage(Enum):
    """Etapas do followuper"""
    REACTIVATION = "reativacao"  # Reativar interesse
    REQUALIFICATION = "requalificacao"  # Requalificar necessidade
    TRANSITION = "transicao"  # Transicao para scheduler


class ReactivatorStage(Enum):
    """Etapas do reativador de base"""
    WARMUP = "aquecimento"  # Aquecer lead frio
    DISCOVERY = "descoberta"  # Descobrir situacao atual
    REENGAGEMENT = "reengajamento"  # Reengajar interesse
    TRANSITION = "transicao"  # Transicao para scheduler


@dataclass
class FollowupTestScenario:
    """Cenario de teste para fluxos de followup/reativacao"""
    name: str
    description: str
    agent_name: str
    agent_version: str = None

    # Fluxo
    initial_mode: str = "followuper"
    flow_sequence: List[str] = field(default_factory=list)  # ex: ["followuper", "scheduler", "concierge"]

    # Persona
    lead_persona: FollowupLeadPersona = FollowupLeadPersona.GHOSTED_INTERESTED

    # Contexto do lead (de onde veio)
    lead_context: Dict = field(default_factory=dict)  # historico anterior, ultimo contato, etc

    # Expectativas
    expected_outcome: str = "schedule"  # schedule, requalified, lost, callback
    expected_mode_transitions: List[str] = field(default_factory=list)
    expected_stages_passed: List[str] = field(default_factory=list)  # etapas dentro do modo

    # Limites
    max_turns: int = 18
    max_turns_per_mode: Dict[str, int] = field(default_factory=dict)  # limite por modo

    # Tags
    tags: List[str] = field(default_factory=list)


@dataclass
class FollowupTestResult:
    """Resultado de teste de followup"""
    scenario: FollowupTestScenario
    agent: any  # RealAgent
    status: str  # passed, failed, timeout, error
    actual_outcome: Optional[str]
    conversation: List[Dict]
    mode_transitions: List[Dict]
    stages_passed: List[Dict]  # etapas dentro de cada modo
    modes_tested: List[str]
    metrics: Dict
    error: Optional[str] = None
    started_at: datetime = field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None

    def to_dict(self) -> Dict:
        return {
            "scenario_name": self.scenario.name,
            "agent_name": self.agent.agent_name if self.agent else "Unknown",
            "status": self.status,
            "actual_outcome": self.actual_outcome,
            "expected_outcome": self.scenario.expected_outcome,
            "conversation_length": len(self.conversation),
            "conversation": self.conversation,
            "mode_transitions": self.mode_transitions,
            "stages_passed": self.stages_passed,
            "modes_tested": self.modes_tested,
            "expected_transitions": self.scenario.expected_mode_transitions,
            "expected_stages": self.scenario.expected_stages_passed,
            "metrics": self.metrics,
            "error": self.error,
            "duration_seconds": (
                self.finished_at - self.started_at
            ).total_seconds() if self.finished_at else None
        }


# =============================================================================
# CENARIOS DE FOLLOWUP (Lead que sumiu no funil)
# =============================================================================

FOLLOWUP_SCENARIOS = [
    # Cenario 1: Lead que sumiu depois de mostrar interesse
    FollowupTestScenario(
        name="followup_ghosted_interested_full_flow",
        description="Lead sumiu apos mostrar interesse - fluxo completo followuper->scheduler->concierge",
        agent_name="Julia Amare",
        initial_mode="followuper",
        flow_sequence=["followuper", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.GHOSTED_INTERESTED,
        lead_context={
            "last_interaction": "5 dias atras",
            "last_message": "Ah que legal, quero saber mais sobre o tratamento!",
            "stage_reached": "first_contact",
            "interest_level": "high",
            "qualified": True
        },
        expected_outcome="schedule",
        expected_mode_transitions=["followuper", "scheduler", "concierge"],
        expected_stages_passed=[
            "followuper:reativacao",
            "followuper:requalificacao",
            "followuper:transicao",
            "scheduler:qualificacao",
            "scheduler:apresentacao",
            "scheduler:agendamento",
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=18,
        max_turns_per_mode={"followuper": 5, "scheduler": 8, "concierge": 5},
        tags=["followup", "ghosted", "full_flow", "hot"]
    ),

    # Cenario 2: Lead que sumiu depois de receber preco
    FollowupTestScenario(
        name="followup_ghosted_after_price",
        description="Lead sumiu apos receber preco - precisa retrabalhar valor",
        agent_name="Julia Amare",
        initial_mode="followuper",
        flow_sequence=["followuper", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.GHOSTED_AFTER_PRICE,
        lead_context={
            "last_interaction": "7 dias atras",
            "last_message": "Ah... R$971 a consulta? Vou pensar...",
            "stage_reached": "first_contact",
            "interest_level": "medium",
            "objection": "price",
            "price_mentioned": True
        },
        expected_outcome="schedule",
        expected_mode_transitions=["followuper", "scheduler", "concierge"],
        expected_stages_passed=[
            "followuper:reativacao",
            "followuper:requalificacao",
            "followuper:transicao",
            "scheduler:qualificacao",
            "scheduler:apresentacao",
            "scheduler:agendamento",
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=18,
        max_turns_per_mode={"followuper": 6, "scheduler": 8, "concierge": 4},
        tags=["followup", "ghosted", "price_objection", "warm"]
    ),

    # Cenario 3: Lead que quase agendou
    FollowupTestScenario(
        name="followup_almost_scheduled",
        description="Lead estava quase agendando e sumiu - retomada rapida",
        agent_name="Julia Amare",
        initial_mode="followuper",
        flow_sequence=["followuper", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.GHOSTED_ALMOST_SCHEDULED,
        lead_context={
            "last_interaction": "3 dias atras",
            "last_message": "Deixa eu ver minha agenda aqui...",
            "stage_reached": "scheduler",
            "interest_level": "very_high",
            "price_accepted": True,
            "ready_to_schedule": True
        },
        expected_outcome="schedule",
        expected_mode_transitions=["followuper", "scheduler", "concierge"],
        expected_stages_passed=[
            "followuper:reativacao",
            "followuper:transicao",  # pula requalificacao pq ja estava quente
            "scheduler:agendamento",  # pula qualificacao pq ja passou
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=14,
        max_turns_per_mode={"followuper": 3, "scheduler": 6, "concierge": 5},
        tags=["followup", "almost_scheduled", "hot", "quick_close"]
    ),

    # Cenario 4: No-show (nao compareceu)
    FollowupTestScenario(
        name="followup_no_show",
        description="Lead nao compareceu a consulta - reagendamento",
        agent_name="Julia Amare",
        initial_mode="followuper",
        flow_sequence=["followuper", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.NO_SHOW,
        lead_context={
            "last_interaction": "2 dias atras (dia da consulta)",
            "appointment_date": "2 dias atras",
            "appointment_time": "14:00",
            "payment_status": "paid",
            "stage_reached": "concierge",
            "no_show": True
        },
        expected_outcome="schedule",  # reagendamento
        expected_mode_transitions=["followuper", "scheduler", "concierge"],
        expected_stages_passed=[
            "followuper:reativacao",  # abordagem cuidadosa
            "followuper:transicao",
            "scheduler:agendamento",  # direto reagendamento
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=15,
        max_turns_per_mode={"followuper": 4, "scheduler": 6, "concierge": 5},
        tags=["followup", "no_show", "reschedule", "paid"]
    ),

    # Cenario 5: Cancelamento
    FollowupTestScenario(
        name="followup_cancelled",
        description="Lead cancelou consulta - reagendamento",
        agent_name="Julia Amare",
        initial_mode="followuper",
        flow_sequence=["followuper", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.CANCELLED,
        lead_context={
            "last_interaction": "4 dias atras",
            "appointment_date": "ontem",
            "cancellation_reason": "imprevisto no trabalho",
            "stage_reached": "scheduler",
            "cancelled": True
        },
        expected_outcome="schedule",
        expected_mode_transitions=["followuper", "scheduler", "concierge"],
        expected_stages_passed=[
            "followuper:reativacao",
            "followuper:transicao",
            "scheduler:agendamento",
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=15,
        max_turns_per_mode={"followuper": 4, "scheduler": 6, "concierge": 5},
        tags=["followup", "cancelled", "reschedule"]
    ),

    # Cenario 6: Callback (pediu para retornar)
    FollowupTestScenario(
        name="followup_callback_requested",
        description="Lead pediu para retornar depois - retorno conforme combinado",
        agent_name="Julia Amare",
        initial_mode="followuper",
        flow_sequence=["followuper", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.ASKED_CALLBACK,
        lead_context={
            "last_interaction": "7 dias atras",
            "last_message": "Estou em reuniao, pode me retornar semana que vem?",
            "stage_reached": "first_contact",
            "callback_requested": True,
            "callback_date": "hoje"
        },
        expected_outcome="schedule",
        expected_mode_transitions=["followuper", "scheduler", "concierge"],
        expected_stages_passed=[
            "followuper:reativacao",  # retorno conforme combinado
            "followuper:requalificacao",
            "followuper:transicao",
            "scheduler:qualificacao",
            "scheduler:agendamento",
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=16,
        max_turns_per_mode={"followuper": 5, "scheduler": 7, "concierge": 4},
        tags=["followup", "callback", "warm"]
    ),
]


# =============================================================================
# CENARIOS DE REATIVACAO BASE (Lista antiga)
# =============================================================================

REACTIVATION_SCENARIOS = [
    # Cenario 1: Lista antiga - lead muito frio
    FollowupTestScenario(
        name="reactivation_old_list_cold",
        description="Lead de lista antiga que nunca interagiu direito - abordagem muito cuidadosa",
        agent_name="Julia Amare",
        initial_mode="reativador_base",  # ou followuper com config diferente
        flow_sequence=["reativador_base", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.OLD_LIST_COLD,
        lead_context={
            "last_interaction": "180 dias atras",
            "source": "landing_page_material",
            "stage_reached": "captura",
            "interest_level": "unknown",
            "never_engaged": True
        },
        expected_outcome="schedule",
        expected_mode_transitions=["reativador_base", "scheduler", "concierge"],
        expected_stages_passed=[
            "reativador_base:aquecimento",  # apresentacao cuidadosa
            "reativador_base:descoberta",  # descobrir situacao atual
            "reativador_base:reengajamento",  # gerar interesse
            "reativador_base:transicao",
            "scheduler:qualificacao",
            "scheduler:apresentacao",
            "scheduler:agendamento",
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=18,
        max_turns_per_mode={"reativador_base": 8, "scheduler": 6, "concierge": 4},
        tags=["reactivation", "old_list", "cold", "careful_approach"]
    ),

    # Cenario 2: Lista antiga - lead dormante
    FollowupTestScenario(
        name="reactivation_old_list_dormant",
        description="Lead que conversou ha meses mas nao agendou - retomar de onde parou",
        agent_name="Julia Amare",
        initial_mode="reativador_base",
        flow_sequence=["reativador_base", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.OLD_LIST_DORMANT,
        lead_context={
            "last_interaction": "90 dias atras",
            "last_message": "Interessante, vou pensar e retorno",
            "stage_reached": "first_contact",
            "interest_level": "medium",
            "had_conversation": True,
            "notes": "Gostou do atendimento, sintomas moderados, nao era prioridade na epoca"
        },
        expected_outcome="schedule",
        expected_mode_transitions=["reativador_base", "scheduler", "concierge"],
        expected_stages_passed=[
            "reativador_base:aquecimento",  # lembrar quem somos
            "reativador_base:descoberta",  # como estao os sintomas
            "reativador_base:reengajamento",
            "reativador_base:transicao",
            "scheduler:qualificacao",
            "scheduler:agendamento",
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=16,
        max_turns_per_mode={"reativador_base": 6, "scheduler": 6, "concierge": 4},
        tags=["reactivation", "dormant", "had_conversation", "warm"]
    ),

    # Cenario 3: Reativacao com resistencia inicial
    FollowupTestScenario(
        name="reactivation_resistant",
        description="Lead de lista antiga que fica resistente no inicio",
        agent_name="Julia Amare",
        initial_mode="reativador_base",
        flow_sequence=["reativador_base", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.OLD_LIST_COLD,
        lead_context={
            "last_interaction": "120 dias atras",
            "source": "evento_presencial",
            "stage_reached": "captura",
            "interest_level": "low",
            "notes": "Coletou contato em evento, nao lembra bem"
        },
        expected_outcome="schedule",
        expected_mode_transitions=["reativador_base", "scheduler", "concierge"],
        expected_stages_passed=[
            "reativador_base:aquecimento",
            "reativador_base:descoberta",
            "reativador_base:reengajamento",
            "reativador_base:transicao",
            "scheduler:qualificacao",
            "scheduler:apresentacao",
            "scheduler:agendamento",
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=18,
        max_turns_per_mode={"reativador_base": 8, "scheduler": 6, "concierge": 4},
        tags=["reactivation", "resistant", "cold", "event_lead"]
    ),

    # Cenario 4: Reativacao rapida (lead que lembra)
    FollowupTestScenario(
        name="reactivation_quick_reengagement",
        description="Lead de lista antiga que lembra e quer continuar",
        agent_name="Julia Amare",
        initial_mode="reativador_base",
        flow_sequence=["reativador_base", "scheduler", "concierge"],
        lead_persona=FollowupLeadPersona.OLD_LIST_DORMANT,
        lead_context={
            "last_interaction": "60 dias atras",
            "last_message": "Vou resolver umas coisas primeiro e volto",
            "stage_reached": "first_contact",
            "interest_level": "high",
            "had_conversation": True,
            "reason_delayed": "Viagem programada"
        },
        expected_outcome="schedule",
        expected_mode_transitions=["reativador_base", "scheduler", "concierge"],
        expected_stages_passed=[
            "reativador_base:aquecimento",
            "reativador_base:transicao",  # pula descoberta e reengajamento
            "scheduler:agendamento",  # vai direto
            "scheduler:confirmacao",
            "scheduler:handoff",
            "concierge:boas_vindas",
            "concierge:preparo"
        ],
        max_turns=12,
        max_turns_per_mode={"reativador_base": 3, "scheduler": 5, "concierge": 4},
        tags=["reactivation", "quick", "warm", "remembers"]
    ),
]


# =============================================================================
# TODOS OS CENARIOS DE FOLLOWUP E REATIVACAO
# =============================================================================

ALL_FOLLOWUP_REACTIVATION_SCENARIOS = FOLLOWUP_SCENARIOS + REACTIVATION_SCENARIOS


def get_followup_profile(persona: FollowupLeadPersona) -> FollowupLeadProfile:
    """Retorna perfil de lead para followup/reativacao"""
    return FOLLOWUP_LEAD_PROFILES.get(persona)


def get_scenarios_by_tag(tag: str) -> List[FollowupTestScenario]:
    """Filtra cenarios por tag"""
    return [s for s in ALL_FOLLOWUP_REACTIVATION_SCENARIOS if tag in s.tags]


def get_followup_scenarios() -> List[FollowupTestScenario]:
    """Retorna apenas cenarios de followup"""
    return FOLLOWUP_SCENARIOS


def get_reactivation_scenarios() -> List[FollowupTestScenario]:
    """Retorna apenas cenarios de reativacao"""
    return REACTIVATION_SCENARIOS


# =============================================================================
# PROMPTS PARA SIMULACAO DE LEAD
# =============================================================================

FOLLOWUP_LEAD_SYSTEM_PROMPT = """Voce e um simulador de lead para testes de chatbot de FOLLOWUP/REATIVACAO.

Voce esta simulando um LEAD QUE ESFRIOU - alguem que ja teve contato anterior mas sumiu/parou de responder.

## SEU PERFIL
{profile}

## CONTEXTO DO CONTATO ANTERIOR
{context}

## REGRAS ESPECIAIS PARA FOLLOWUP:

1. **Lembre do contexto anterior** - voce ja teve contato, use isso
2. **Seja realista sobre esfriamento** - explique naturalmente por que sumiu
3. **Reaja a abordagem** - se for boa, va abrindo; se for ruim/agressiva, feche mais
4. **Mantenha objecoes coerentes** - se sumiu por preco, preco ainda e problema
5. **De sinais de reaquecimento** - quando o agente acertar, demonstre interesse voltando

## SINALIZACAO:
- [OBJETIVO: REENGAJADO] - quando voltar a ter interesse
- [OBJETIVO: AGENDAR] - quando decidir agendar
- [OBJETIVO: CALLBACK] - quando pedir para retornar depois
- [OBJETIVO: DESISTIR] - quando desistir de vez

## COMPORTAMENTO:
- Primeiras mensagens mais frias/desconfiadas
- Ir aquecendo conforme agente conquista
- Respostas curtas no inicio, mais longas conforme engaja

## HISTORICO DA CONVERSA:
{history}

## ULTIMA MENSAGEM DO AGENTE:
{agent_message}

Responda como o lead responderia. Seja natural e realista para um cenario de FOLLOWUP."""


REACTIVATION_LEAD_SYSTEM_PROMPT = """Voce e um simulador de lead para testes de chatbot de REATIVACAO DE BASE.

Voce esta simulando um LEAD DE LISTA ANTIGA - alguem que deixou contato ha muito tempo e pode nem lembrar.

## SEU PERFIL
{profile}

## CONTEXTO DO CADASTRO
{context}

## REGRAS ESPECIAIS PARA REATIVACAO DE BASE:

1. **Pode nao lembrar quem e** - pergunte "quem e voce?" se for natural
2. **Desconfianca inicial** - ninguem gosta de mensagens de vendedor
3. **Precisa de contexto** - "de onde pegaram meu numero?" e valido
4. **Valor primeiro** - so engaja se ver valor real, nao pressao
5. **Mais lento para aquecer** - precisa de mais turnos que followup normal

## SINALIZACAO:
- [OBJETIVO: INTERESSADO] - quando despertar interesse
- [OBJETIVO: REENGAJADO] - quando voltar a considerar
- [OBJETIVO: AGENDAR] - quando decidir agendar
- [OBJETIVO: CALLBACK] - quando pedir para retornar depois
- [OBJETIVO: DESISTIR] - quando desistir/bloquear

## COMPORTAMENTO:
- Muito frio/desconfiado no inicio
- Pode ser monossilabico nas primeiras respostas
- Vai abrindo MUITO devagar
- Precisa de empatia genuina para engajar

## HISTORICO DA CONVERSA:
{history}

## ULTIMA MENSAGEM DO AGENTE:
{agent_message}

Responda como o lead responderia. Seja natural e realista para um cenario de REATIVACAO DE BASE FRIA."""
