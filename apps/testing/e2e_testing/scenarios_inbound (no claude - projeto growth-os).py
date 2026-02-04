"""
Cenarios E2E para Fluxo INBOUND
===============================
Cenarios de teste para leads que vieram por conta propria (inbound).

Fluxos testados:
1. INBOUND Hot -> sdr_inbound(4 etapas) -> scheduler(5 etapas) -> concierge(2 etapas)
2. INBOUND com Objecao -> sdr_inbound -> objection_handler(4 etapas) -> scheduler -> concierge
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum

from .groq_test_runner import GroqTestScenario
from .lead_simulator import LeadPersona, LeadProfile


# =============================================================================
# ETAPAS ESPERADAS POR MODO
# =============================================================================

class InboundStage(Enum):
    """Etapas do fluxo INBOUND"""

    # SDR Inbound - 4 etapas
    SDR_GREETING = "sdr_greeting"              # Saudacao inicial
    SDR_QUALIFICATION = "sdr_qualification"    # Perguntas de qualificacao
    SDR_PAIN_DISCOVERY = "sdr_pain_discovery"  # Descoberta de dores
    SDR_TRANSITION = "sdr_transition"          # Transicao para scheduler

    # Scheduler - 5 etapas
    SCH_INTRO = "sch_intro"                    # Apresentacao do agendamento
    SCH_DATE_OPTIONS = "sch_date_options"      # Opcoes de data
    SCH_TIME_OPTIONS = "sch_time_options"      # Opcoes de horario
    SCH_CONFIRMATION = "sch_confirmation"      # Confirmacao dos dados
    SCH_FINALIZATION = "sch_finalization"      # Finalizacao e proximos passos

    # Concierge - 2 etapas
    CON_PRE_APPOINTMENT = "con_pre_appointment"  # Lembrete pre-consulta
    CON_SHOW_RATE = "con_show_rate"              # Garantia de comparecimento

    # Objection Handler - 4 etapas
    OBJ_ACKNOWLEDGE = "obj_acknowledge"        # Reconhecer objecao
    OBJ_CLARIFY = "obj_clarify"                # Clarificar preocupacao
    OBJ_REFRAME = "obj_reframe"                # Reenquadrar valor
    OBJ_RESOLVE = "obj_resolve"                # Resolver e voltar ao fluxo


@dataclass
class InboundStageValidation:
    """Validacao de etapa do fluxo"""
    stage: InboundStage
    keywords: List[str]  # Palavras-chave esperadas na resposta
    min_messages: int = 1
    max_messages: int = 3
    required: bool = True


# =============================================================================
# PERSONAS ESPECIFICAS PARA INBOUND
# =============================================================================

@dataclass
class InboundLeadPersona:
    """Persona de lead INBOUND com detalhes especificos"""
    base_persona: LeadPersona
    name: str
    entry_point: str  # Onde o lead entrou (Instagram, Site, Indicacao)
    initial_message: str
    pain_level: str  # low, medium, high, critical
    decision_timeline: str  # immediate, this_week, this_month, someday
    objection_type: Optional[str] = None  # price, husband, time, trust, none
    backstory: str = ""
    expected_turns_to_schedule: int = 15


# Personas de Lead INBOUND
INBOUND_PERSONAS = {
    "hot_instagram": InboundLeadPersona(
        base_persona=LeadPersona.HOT,
        name="Carla Mendes",
        entry_point="Instagram - Reels sobre menopausa",
        initial_message="Oi! Vi o video de voces sobre reposicao hormonal e me identifiquei muito. Preciso de ajuda urgente!",
        pain_level="critical",
        decision_timeline="immediate",
        objection_type=None,
        backstory="Empresaria de 48 anos, sofre ha 2 anos com ondas de calor intensas. Ja pesquisou muito e esta convencida que precisa de tratamento. Veio pelo Instagram apos ver um Reels sobre sintomas da menopausa.",
        expected_turns_to_schedule=12
    ),

    "hot_referral": InboundLeadPersona(
        base_persona=LeadPersona.HOT,
        name="Renata Alves",
        entry_point="Indicacao de amiga",
        initial_message="Ola! Minha amiga Ana fez tratamento com voces e indicou. Quero marcar consulta tambem!",
        pain_level="high",
        decision_timeline="immediate",
        objection_type=None,
        backstory="Designer de 45 anos, amiga fez tratamento e teve otimos resultados. Ja vem convencida e so quer agendar.",
        expected_turns_to_schedule=10
    ),

    "warm_curious": InboundLeadPersona(
        base_persona=LeadPersona.WARM,
        name="Patricia Costa",
        entry_point="Site - Pesquisa Google",
        initial_message="Oi, encontrei voces no Google. Estou pesquisando sobre tratamento hormonal. Podem me explicar como funciona?",
        pain_level="medium",
        decision_timeline="this_week",
        objection_type=None,
        backstory="Advogada de 46 anos, comecou a pesquisar apos sentir primeiros sintomas. Quer entender bem antes de decidir.",
        expected_turns_to_schedule=18
    ),

    "objection_price": InboundLeadPersona(
        base_persona=LeadPersona.OBJECTION_PRICE,
        name="Lucia Ferreira",
        entry_point="Instagram - Stories",
        initial_message="Oi, vi os stories de voces. Quanto custa a consulta? Porque no convenio e de graca...",
        pain_level="medium",
        decision_timeline="this_month",
        objection_type="price",
        backstory="Funcionaria publica de 50 anos, interessada mas preocupada com custos. Precisa entender o valor agregado.",
        expected_turns_to_schedule=20
    ),

    "objection_husband": InboundLeadPersona(
        base_persona=LeadPersona.OBJECTION_HUSBAND,
        name="Ana Paula Santos",
        entry_point="Instagram - Indicacao",
        initial_message="Ola! Tenho muito interesse no tratamento, mas preciso falar com meu marido antes. Ele que controla as financas.",
        pain_level="high",
        decision_timeline="this_week",
        objection_type="husband",
        backstory="Dona de casa de 47 anos, marido cético sobre medicina alternativa. Precisa de argumentos para convence-lo.",
        expected_turns_to_schedule=22
    ),

    "objection_time": InboundLeadPersona(
        base_persona=LeadPersona.RUSHED,
        name="Marina Rodrigues",
        entry_point="Site - Formulario",
        initial_message="Oi, sou muito ocupada. Quanto tempo demora o tratamento todo? Nao tenho tempo pra ficar indo em consulta toda semana.",
        pain_level="high",
        decision_timeline="immediate",
        objection_type="time",
        backstory="Executiva de 44 anos, agenda lotada. Quer resolver mas tem medo de compromisso de tempo.",
        expected_turns_to_schedule=18
    )
}


# =============================================================================
# CENARIO 1: INBOUND HOT - FLUXO COMPLETO
# =============================================================================

INBOUND_HOT_SCENARIO = GroqTestScenario(
    name="inbound_hot_full_flow",
    description="""
    Lead INBOUND quente - Fluxo completo sem objecoes.

    FLUXO ESPERADO:
    1. sdr_inbound (4 etapas):
       - Saudacao e acolhimento
       - Qualificacao inicial (sintomas, tempo, tentativas anteriores)
       - Descoberta de dores e urgencia
       - Transicao suave para agendamento

    2. scheduler (5 etapas):
       - Intro do agendamento
       - Apresentar opcoes de data
       - Confirmar horario
       - Confirmar dados do lead
       - Finalizar agendamento

    3. concierge (2 etapas):
       - Lembrete pre-consulta (o que trazer, como se preparar)
       - Garantir comparecimento (reforcar valor)

    TRANSICOES ESPERADAS:
    sdr_inbound -> scheduler -> concierge

    OBJETIVO FINAL: appointment_booked
    """,
    agent_name="Julia Amare",
    agent_version=None,
    initial_mode="sdr_inbound",
    lead_persona=LeadPersona.HOT,
    flow_type="inbound_sales",
    expected_outcome="appointment_booked",
    expected_mode_transitions=[
        "sdr_inbound",
        "scheduler",
        "concierge"
    ],
    max_turns=25,
    tags=["inbound", "hot", "full_flow", "no_objection"]
)


# Validacoes de etapas para INBOUND HOT
INBOUND_HOT_STAGE_VALIDATIONS = [
    # SDR Inbound - 4 etapas
    InboundStageValidation(
        stage=InboundStage.SDR_GREETING,
        keywords=["ola", "bem-vinda", "prazer", "instituto", "amare"],
        min_messages=1,
        max_messages=1
    ),
    InboundStageValidation(
        stage=InboundStage.SDR_QUALIFICATION,
        keywords=["sintoma", "quanto tempo", "ha quanto", "sente", "percebe"],
        min_messages=1,
        max_messages=2
    ),
    InboundStageValidation(
        stage=InboundStage.SDR_PAIN_DISCOVERY,
        keywords=["entendo", "compreendo", "imagino", "dificil", "impacta"],
        min_messages=1,
        max_messages=2
    ),
    InboundStageValidation(
        stage=InboundStage.SDR_TRANSITION,
        keywords=["agendar", "consulta", "dra", "especialista", "ajudar"],
        min_messages=1,
        max_messages=1
    ),

    # Scheduler - 5 etapas
    InboundStageValidation(
        stage=InboundStage.SCH_INTRO,
        keywords=["agendamento", "disponibilidade", "consulta", "horario"],
        min_messages=1,
        max_messages=1
    ),
    InboundStageValidation(
        stage=InboundStage.SCH_DATE_OPTIONS,
        keywords=["segunda", "terca", "quarta", "quinta", "sexta", "semana", "dia"],
        min_messages=1,
        max_messages=2
    ),
    InboundStageValidation(
        stage=InboundStage.SCH_TIME_OPTIONS,
        keywords=["hora", "manha", "tarde", "horario", "disponivel"],
        min_messages=1,
        max_messages=2
    ),
    InboundStageValidation(
        stage=InboundStage.SCH_CONFIRMATION,
        keywords=["confirmar", "correto", "nome", "telefone", "email"],
        min_messages=1,
        max_messages=1
    ),
    InboundStageValidation(
        stage=InboundStage.SCH_FINALIZATION,
        keywords=["agendado", "confirmado", "lembrete", "endereco", "preparar"],
        min_messages=1,
        max_messages=1
    ),

    # Concierge - 2 etapas
    InboundStageValidation(
        stage=InboundStage.CON_PRE_APPOINTMENT,
        keywords=["consulta", "amanha", "lembrar", "preparar", "trazer", "exame"],
        min_messages=1,
        max_messages=1
    ),
    InboundStageValidation(
        stage=InboundStage.CON_SHOW_RATE,
        keywords=["esperamos", "aguardamos", "confirmar", "presenca", "duvida"],
        min_messages=1,
        max_messages=1
    )
]


# =============================================================================
# CENARIO 2: INBOUND COM OBJECAO
# =============================================================================

INBOUND_OBJECTION_SCENARIO = GroqTestScenario(
    name="inbound_objection_flow",
    description="""
    Lead INBOUND com objecao - Fluxo com tratamento de objecao.

    FLUXO ESPERADO:
    1. sdr_inbound (4 etapas):
       - Saudacao e acolhimento
       - Qualificacao inicial
       - Descoberta de dores
       - Detecta objecao e transiciona

    2. objection_handler (4 etapas):
       - Reconhecer objecao com empatia
       - Clarificar a preocupacao real
       - Reenquadrar valor vs custo
       - Resolver e retornar ao fluxo

    3. scheduler (5 etapas):
       - Intro do agendamento
       - Apresentar opcoes de data
       - Confirmar horario
       - Confirmar dados
       - Finalizar

    4. concierge (2 etapas):
       - Lembrete pre-consulta
       - Garantir comparecimento

    TRANSICOES ESPERADAS:
    sdr_inbound -> objection_handler -> scheduler -> concierge

    OBJETIVO FINAL: appointment_booked (apos resolver objecao)
    """,
    agent_name="Julia Amare",
    agent_version=None,
    initial_mode="sdr_inbound",
    lead_persona=LeadPersona.OBJECTION_PRICE,
    flow_type="inbound_sales_objection",
    expected_outcome="appointment_booked",
    expected_mode_transitions=[
        "sdr_inbound",
        "objection_handler",
        "scheduler",
        "concierge"
    ],
    max_turns=25,
    tags=["inbound", "objection", "price", "full_flow"]
)


# Validacoes de etapas para INBOUND com OBJECAO
INBOUND_OBJECTION_STAGE_VALIDATIONS = [
    # SDR Inbound - 4 etapas (igual ao hot)
    InboundStageValidation(
        stage=InboundStage.SDR_GREETING,
        keywords=["ola", "bem-vinda", "prazer", "instituto"],
        min_messages=1,
        max_messages=1
    ),
    InboundStageValidation(
        stage=InboundStage.SDR_QUALIFICATION,
        keywords=["sintoma", "quanto tempo", "sente"],
        min_messages=1,
        max_messages=2
    ),
    InboundStageValidation(
        stage=InboundStage.SDR_PAIN_DISCOVERY,
        keywords=["entendo", "compreendo", "imagino"],
        min_messages=1,
        max_messages=2
    ),
    InboundStageValidation(
        stage=InboundStage.SDR_TRANSITION,
        keywords=["entendo", "preocupacao", "vou explicar"],
        min_messages=1,
        max_messages=1
    ),

    # Objection Handler - 4 etapas
    InboundStageValidation(
        stage=InboundStage.OBJ_ACKNOWLEDGE,
        keywords=["entendo", "compreendo", "faz sentido", "preocupacao", "normal"],
        min_messages=1,
        max_messages=1,
        required=True
    ),
    InboundStageValidation(
        stage=InboundStage.OBJ_CLARIFY,
        keywords=["me conta", "especificamente", "o que mais", "alem de"],
        min_messages=1,
        max_messages=2,
        required=True
    ),
    InboundStageValidation(
        stage=InboundStage.OBJ_REFRAME,
        keywords=["investimento", "valor", "diferenca", "resultado", "qualidade"],
        min_messages=1,
        max_messages=2,
        required=True
    ),
    InboundStageValidation(
        stage=InboundStage.OBJ_RESOLVE,
        keywords=["faz sentido", "entao", "vamos", "agendar", "posso ajudar"],
        min_messages=1,
        max_messages=1,
        required=True
    ),

    # Scheduler - 5 etapas
    InboundStageValidation(
        stage=InboundStage.SCH_INTRO,
        keywords=["agendamento", "disponibilidade", "consulta"],
        min_messages=1,
        max_messages=1
    ),
    InboundStageValidation(
        stage=InboundStage.SCH_DATE_OPTIONS,
        keywords=["segunda", "terca", "quarta", "quinta", "sexta", "semana"],
        min_messages=1,
        max_messages=2
    ),
    InboundStageValidation(
        stage=InboundStage.SCH_TIME_OPTIONS,
        keywords=["hora", "manha", "tarde", "horario"],
        min_messages=1,
        max_messages=2
    ),
    InboundStageValidation(
        stage=InboundStage.SCH_CONFIRMATION,
        keywords=["confirmar", "correto", "nome", "dados"],
        min_messages=1,
        max_messages=1
    ),
    InboundStageValidation(
        stage=InboundStage.SCH_FINALIZATION,
        keywords=["agendado", "confirmado", "lembrete"],
        min_messages=1,
        max_messages=1
    ),

    # Concierge - 2 etapas
    InboundStageValidation(
        stage=InboundStage.CON_PRE_APPOINTMENT,
        keywords=["consulta", "lembrar", "preparar", "trazer"],
        min_messages=1,
        max_messages=1
    ),
    InboundStageValidation(
        stage=InboundStage.CON_SHOW_RATE,
        keywords=["esperamos", "aguardamos", "confirmar"],
        min_messages=1,
        max_messages=1
    )
]


# =============================================================================
# CENARIOS ADICIONAIS PARA COBERTURA COMPLETA
# =============================================================================

INBOUND_REFERRAL_SCENARIO = GroqTestScenario(
    name="inbound_referral_fast_track",
    description="""
    Lead vindo por indicacao - Fast track para agendamento.
    Leads por indicacao geralmente convertem mais rapido.
    """,
    agent_name="Julia Amare",
    agent_version=None,
    initial_mode="sdr_inbound",
    lead_persona=LeadPersona.HOT,
    flow_type="inbound_referral",
    expected_outcome="appointment_booked",
    expected_mode_transitions=[
        "sdr_inbound",
        "scheduler",
        "concierge"
    ],
    max_turns=18,
    tags=["inbound", "referral", "fast_track"]
)


INBOUND_HUSBAND_OBJECTION_SCENARIO = GroqTestScenario(
    name="inbound_husband_objection",
    description="""
    Lead com objecao do marido - Precisa de argumentos para convencer.
    Fluxo mais longo pois precisa trabalhar a objecao emocional.
    """,
    agent_name="Julia Amare",
    agent_version=None,
    initial_mode="sdr_inbound",
    lead_persona=LeadPersona.OBJECTION_HUSBAND,
    flow_type="inbound_sales_objection",
    expected_outcome="appointment_booked",
    expected_mode_transitions=[
        "sdr_inbound",
        "objection_handler",
        "scheduler",
        "concierge"
    ],
    max_turns=25,
    tags=["inbound", "objection", "husband", "emotional"]
)


INBOUND_WARM_EDUCATION_SCENARIO = GroqTestScenario(
    name="inbound_warm_education_needed",
    description="""
    Lead morno que precisa de educacao antes de agendar.
    Fluxo mais consultivo, SDR precisa qualificar bem.
    """,
    agent_name="Julia Amare",
    agent_version=None,
    initial_mode="sdr_inbound",
    lead_persona=LeadPersona.WARM,
    flow_type="inbound_consultive",
    expected_outcome="appointment_booked",
    expected_mode_transitions=[
        "sdr_inbound",
        "scheduler",
        "concierge"
    ],
    max_turns=22,
    tags=["inbound", "warm", "education", "consultive"]
)


# =============================================================================
# LISTA COMPLETA DE CENARIOS INBOUND
# =============================================================================

INBOUND_SCENARIOS = [
    INBOUND_HOT_SCENARIO,
    INBOUND_OBJECTION_SCENARIO,
    INBOUND_REFERRAL_SCENARIO,
    INBOUND_HUSBAND_OBJECTION_SCENARIO,
    INBOUND_WARM_EDUCATION_SCENARIO
]


# =============================================================================
# FUNCOES AUXILIARES
# =============================================================================

def get_inbound_scenario(name: str) -> Optional[GroqTestScenario]:
    """Retorna cenario inbound por nome"""
    for scenario in INBOUND_SCENARIOS:
        if scenario.name == name:
            return scenario
    return None


def get_scenarios_by_tag(tag: str) -> List[GroqTestScenario]:
    """Retorna cenarios que contem a tag especificada"""
    return [s for s in INBOUND_SCENARIOS if tag in s.tags]


def get_persona_for_scenario(scenario: GroqTestScenario) -> Optional[InboundLeadPersona]:
    """Retorna persona inbound correspondente ao cenario"""
    persona_mapping = {
        "inbound_hot_full_flow": "hot_instagram",
        "inbound_referral_fast_track": "hot_referral",
        "inbound_objection_flow": "objection_price",
        "inbound_husband_objection": "objection_husband",
        "inbound_warm_education_needed": "warm_curious"
    }

    persona_key = persona_mapping.get(scenario.name)
    if persona_key:
        return INBOUND_PERSONAS.get(persona_key)
    return None


def get_stage_validations(scenario_name: str) -> List[InboundStageValidation]:
    """Retorna validacoes de etapa para o cenario"""
    if scenario_name == "inbound_hot_full_flow":
        return INBOUND_HOT_STAGE_VALIDATIONS
    elif scenario_name in ["inbound_objection_flow", "inbound_husband_objection"]:
        return INBOUND_OBJECTION_STAGE_VALIDATIONS
    else:
        # Retorna validacoes basicas (sem objection handler)
        return [v for v in INBOUND_HOT_STAGE_VALIDATIONS
                if v.stage not in [
                    InboundStage.OBJ_ACKNOWLEDGE,
                    InboundStage.OBJ_CLARIFY,
                    InboundStage.OBJ_REFRAME,
                    InboundStage.OBJ_RESOLVE
                ]]


def calculate_expected_turns(scenario: GroqTestScenario) -> Dict[str, int]:
    """Calcula turnos esperados por modo baseado no cenario"""

    # Turnos base por modo
    mode_turns = {
        "sdr_inbound": 4,
        "objection_handler": 4,
        "scheduler": 5,
        "concierge": 2
    }

    total_turns = 0
    breakdown = {}

    for mode in scenario.expected_mode_transitions:
        turns = mode_turns.get(mode, 3)
        breakdown[mode] = turns
        total_turns += turns

    breakdown["total"] = total_turns
    breakdown["with_buffer"] = int(total_turns * 1.3)  # 30% buffer

    return breakdown


def validate_conversation_flow(
    conversation: List[Dict],
    scenario: GroqTestScenario
) -> Dict:
    """
    Valida se a conversa seguiu o fluxo esperado.

    Returns:
        Dict com:
        - valid: bool
        - stages_completed: List[str]
        - stages_missing: List[str]
        - mode_transitions_valid: bool
        - errors: List[str]
    """
    validations = get_stage_validations(scenario.name)

    stages_completed = []
    stages_missing = []
    errors = []

    # Verificar cada validacao
    for validation in validations:
        stage_found = False

        for msg in conversation:
            if msg.get("role") == "agent":
                content = msg.get("content", "").lower()
                # Verificar se alguma keyword esta presente
                if any(kw in content for kw in validation.keywords):
                    stage_found = True
                    break

        if stage_found:
            stages_completed.append(validation.stage.value)
        elif validation.required:
            stages_missing.append(validation.stage.value)
            errors.append(f"Etapa obrigatoria ausente: {validation.stage.value}")

    # Verificar transicoes de modo
    mode_transitions = []
    for msg in conversation:
        if msg.get("role") == "agent":
            mode = msg.get("mode")
            if mode and (not mode_transitions or mode_transitions[-1] != mode):
                mode_transitions.append(mode)

    expected_transitions = scenario.expected_mode_transitions
    mode_transitions_valid = all(
        mode in mode_transitions
        for mode in expected_transitions
    )

    if not mode_transitions_valid:
        missing_modes = [m for m in expected_transitions if m not in mode_transitions]
        errors.append(f"Modos esperados ausentes: {missing_modes}")

    return {
        "valid": len(stages_missing) == 0 and mode_transitions_valid,
        "stages_completed": stages_completed,
        "stages_missing": stages_missing,
        "mode_transitions_actual": mode_transitions,
        "mode_transitions_expected": expected_transitions,
        "mode_transitions_valid": mode_transitions_valid,
        "errors": errors,
        "completion_rate": len(stages_completed) / len(validations) if validations else 0
    }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Enums
    "InboundStage",

    # Dataclasses
    "InboundStageValidation",
    "InboundLeadPersona",

    # Cenarios principais
    "INBOUND_HOT_SCENARIO",
    "INBOUND_OBJECTION_SCENARIO",

    # Cenarios adicionais
    "INBOUND_REFERRAL_SCENARIO",
    "INBOUND_HUSBAND_OBJECTION_SCENARIO",
    "INBOUND_WARM_EDUCATION_SCENARIO",

    # Lista completa
    "INBOUND_SCENARIOS",

    # Validacoes
    "INBOUND_HOT_STAGE_VALIDATIONS",
    "INBOUND_OBJECTION_STAGE_VALIDATIONS",

    # Personas
    "INBOUND_PERSONAS",

    # Funcoes auxiliares
    "get_inbound_scenario",
    "get_scenarios_by_tag",
    "get_persona_for_scenario",
    "get_stage_validations",
    "calculate_expected_turns",
    "validate_conversation_flow"
]
