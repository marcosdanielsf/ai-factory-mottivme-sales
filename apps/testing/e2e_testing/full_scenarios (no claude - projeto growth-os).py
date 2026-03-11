"""
Cenários E2E Completos - 9 fluxos de ponta a ponta
==================================================
"""
from dataclasses import dataclass, field
from typing import List, Dict
from enum import Enum

class FlowType(Enum):
    INBOUND_HOT = "inbound_hot"
    INBOUND_OBJECTION = "inbound_objection"
    SOCIAL_NOVO_SEGUIDOR = "social_novo_seguidor"
    SOCIAL_VISITA_SINCERA = "social_visita_sincera"
    SOCIAL_GATILHO = "social_gatilho"
    FOLLOWUP = "followup"
    REATIVACAO_BASE = "reativacao_base"
    INBOUND_DESISTE = "inbound_desiste"
    OBJECAO_NAO_RESOLVIDA = "objecao_nao_resolvida"

@dataclass
class ModeStage:
    """Etapa dentro de um modo"""
    name: str
    objective: str
    validation_keywords: List[str] = field(default_factory=list)

@dataclass
class FullScenario:
    """Cenário E2E completo com todas as etapas"""
    name: str
    flow_type: FlowType
    description: str
    initial_message: str

    # Fluxo de modos e etapas
    mode_flow: List[Dict] = field(default_factory=list)

    # Configuração
    max_turns: int = 25
    expected_outcome: str = "agendamento_confirmado"

    # Lead persona
    lead_name: str = "Mariana"
    lead_age: int = 48
    lead_profile: str = "empresária"
    lead_pain: str = "sintomas menopausa"
    lead_budget: str = "alto"
    lead_objections: List[str] = field(default_factory=list)

# ============================================================================
# DEFINIÇÃO DAS ETAPAS POR MODO
# ============================================================================

SDR_INBOUND_STAGES = [
    ModeStage("ativacao", "Quebrar gelo, gerar resposta", ["oi", "olá", "prazer"]),
    ModeStage("qualificacao", "BANT sutil", ["sintomas", "quanto tempo", "urgência"]),
    ModeStage("pitch", "Oferta diagnóstico", ["dr. luiz", "consulta", "especialista"]),
    ModeStage("transicao", "Passar pro Scheduler", ["agendar", "data", "horário"]),
]

SCHEDULER_STAGES = [
    ModeStage("coleta_dados", "Nome, telefone, email", ["nome completo", "telefone", "email"]),
    ModeStage("pagamento", "Criar cobrança + enviar link", ["pix", "cartão", "link"]),
    ModeStage("confirmacao_pgto", "Solicitar comprovante", ["comprovante", "pagamento"]),
    ModeStage("agendamento", "Escolher data/hora", ["dia", "horário", "disponível"]),
    ModeStage("confirmacao_final", "Enviar resumo", ["confirmado", "orientações"]),
]

CONCIERGE_STAGES = [
    ModeStage("pre_consulta", "Lembrete 24h/1h", ["lembrete", "amanhã", "preparação"]),
    ModeStage("pos_consulta", "NPS + próximos passos", ["como foi", "avaliação", "retorno"]),
]

OBJECTION_HANDLER_STAGES = [
    ModeStage("identificar", "Qual objeção", ["preço", "marido", "tempo"]),
    ModeStage("validar", "Empatia", ["entendo", "compreendo", "normal"]),
    ModeStage("neutralizar", "Técnica específica", ["investimento", "saúde", "vale"]),
    ModeStage("retomar", "Voltar pro fluxo", ["então", "vamos", "agendar"]),
]

SOCIAL_SELLER_STAGES = [
    ModeStage("conexao", "Curtir, comentar, seguir", ["vi seu perfil", "conteúdo"]),
    ModeStage("ativacao", "DM com gancho", ["oi", "tudo bem", "interesse"]),
    ModeStage("qualificacao", "Identificar dor", ["sintomas", "desafio", "busca"]),
    ModeStage("transicao", "Passar pro Scheduler", ["especialista", "consulta"]),
]

FOLLOWUPER_STAGES = [
    ModeStage("reativacao", "Retomar contato", ["sumiu", "novidades", "lembrei"]),
    ModeStage("requalificacao", "Contexto mudou?", ["ainda", "interesse", "momento"]),
    ModeStage("transicao", "Voltar pro SDR/Scheduler", ["retomar", "agendar"]),
]

# ============================================================================
# 9 CENÁRIOS COMPLETOS
# ============================================================================

FULL_SCENARIOS = [
    # 1. INBOUND HOT
    FullScenario(
        name="inbound_hot_completo",
        flow_type=FlowType.INBOUND_HOT,
        description="Lead quente de tráfego que agenda e paga",
        initial_message="Oi! Vi o anúncio de vocês e preciso muito de ajuda com reposição hormonal",
        mode_flow=[
            {"mode": "sdr_inbound", "stages": SDR_INBOUND_STAGES},
            {"mode": "scheduler", "stages": SCHEDULER_STAGES},
            {"mode": "concierge", "stages": CONCIERGE_STAGES},
        ],
        max_turns=20,
        expected_outcome="agendamento_confirmado",
        lead_name="Fernanda",
        lead_age=52,
        lead_profile="executiva",
        lead_pain="ondas de calor intensas, insônia",
        lead_budget="alto",
    ),

    # 2. INBOUND COM OBJEÇÃO
    FullScenario(
        name="inbound_objecao_preco",
        flow_type=FlowType.INBOUND_OBJECTION,
        description="Lead com objeção de preço que é resolvida",
        initial_message="Oi, quanto custa a consulta?",
        mode_flow=[
            {"mode": "sdr_inbound", "stages": SDR_INBOUND_STAGES},
            {"mode": "objection_handler", "stages": OBJECTION_HANDLER_STAGES},
            {"mode": "scheduler", "stages": SCHEDULER_STAGES},
            {"mode": "concierge", "stages": CONCIERGE_STAGES},
        ],
        max_turns=25,
        expected_outcome="agendamento_confirmado",
        lead_name="Carla",
        lead_age=45,
        lead_profile="professora",
        lead_pain="ganho de peso, cansaço",
        lead_budget="médio",
        lead_objections=["preço alto", "preciso pensar"],
    ),

    # 3. SOCIAL SELLER - NOVO SEGUIDOR
    FullScenario(
        name="social_novo_seguidor",
        flow_type=FlowType.SOCIAL_NOVO_SEGUIDOR,
        description="Pessoa seguiu o perfil, DM de boas-vindas",
        initial_message="",  # Bot inicia
        mode_flow=[
            {"mode": "social_seller_instagram", "stages": SOCIAL_SELLER_STAGES},
            {"mode": "scheduler", "stages": SCHEDULER_STAGES},
            {"mode": "concierge", "stages": CONCIERGE_STAGES},
        ],
        max_turns=20,
        expected_outcome="agendamento_confirmado",
        lead_name="Patricia",
        lead_age=49,
        lead_profile="advogada",
        lead_pain="libido baixa, ressecamento",
        lead_budget="alto",
    ),

    # 4. SOCIAL SELLER - VISITA SINCERA
    FullScenario(
        name="social_visita_sincera",
        flow_type=FlowType.SOCIAL_VISITA_SINCERA,
        description="AgenticOS visitou perfil, curte, comenta, DM",
        initial_message="",  # Bot inicia
        mode_flow=[
            {"mode": "social_seller_instagram", "stages": SOCIAL_SELLER_STAGES},
            {"mode": "scheduler", "stages": SCHEDULER_STAGES},
            {"mode": "concierge", "stages": CONCIERGE_STAGES},
        ],
        max_turns=22,
        expected_outcome="agendamento_confirmado",
        lead_name="Luciana",
        lead_age=55,
        lead_profile="médica",
        lead_pain="dores articulares, neblina mental",
        lead_budget="alto",
    ),

    # 5. SOCIAL SELLER - GATILHO SOCIAL
    FullScenario(
        name="social_gatilho",
        flow_type=FlowType.SOCIAL_GATILHO,
        description="Lead interagiu com post/story, DM aproveitando",
        initial_message="",  # Bot inicia
        mode_flow=[
            {"mode": "social_seller_instagram", "stages": SOCIAL_SELLER_STAGES},
            {"mode": "scheduler", "stages": SCHEDULER_STAGES},
            {"mode": "concierge", "stages": CONCIERGE_STAGES},
        ],
        max_turns=18,
        expected_outcome="agendamento_confirmado",
        lead_name="Regina",
        lead_age=47,
        lead_profile="empresária",
        lead_pain="ansiedade, alterações de humor",
        lead_budget="alto",
    ),

    # 6. FOLLOWUP
    FullScenario(
        name="followup_sumiu",
        flow_type=FlowType.FOLLOWUP,
        description="Lead sumiu no meio do funil, reativação",
        initial_message="",  # Bot inicia
        mode_flow=[
            {"mode": "followuper", "stages": FOLLOWUPER_STAGES},
            {"mode": "scheduler", "stages": SCHEDULER_STAGES},
            {"mode": "concierge", "stages": CONCIERGE_STAGES},
        ],
        max_turns=18,
        expected_outcome="agendamento_confirmado",
        lead_name="Sandra",
        lead_age=51,
        lead_profile="contadora",
        lead_pain="insônia, irritabilidade",
        lead_budget="médio",
    ),

    # 7. REATIVAÇÃO DE BASE
    FullScenario(
        name="reativacao_base",
        flow_type=FlowType.REATIVACAO_BASE,
        description="Lista antiga, caixa rápido",
        initial_message="",  # Bot inicia
        mode_flow=[
            {"mode": "followuper", "stages": FOLLOWUPER_STAGES},  # Usa followuper adaptado
            {"mode": "scheduler", "stages": SCHEDULER_STAGES},
            {"mode": "concierge", "stages": CONCIERGE_STAGES},
        ],
        max_turns=15,
        expected_outcome="agendamento_confirmado",
        lead_name="Vera",
        lead_age=58,
        lead_profile="aposentada",
        lead_pain="osteoporose, fadiga",
        lead_budget="médio",
    ),

    # 8. INBOUND FRIO - DESISTE
    FullScenario(
        name="inbound_desiste",
        flow_type=FlowType.INBOUND_DESISTE,
        description="Lead frio que não converte",
        initial_message="Qual o preço?",
        mode_flow=[
            {"mode": "sdr_inbound", "stages": SDR_INBOUND_STAGES},
        ],
        max_turns=10,
        expected_outcome="lead_perdido",
        lead_name="Julia",
        lead_age=38,
        lead_profile="estudante",
        lead_pain="curiosidade apenas",
        lead_budget="baixo",
        lead_objections=["muito caro", "não é prioridade", "talvez depois"],
    ),

    # 9. OBJEÇÃO NÃO RESOLVIDA - ESCALA HUMANO
    FullScenario(
        name="objecao_escala_humano",
        flow_type=FlowType.OBJECAO_NAO_RESOLVIDA,
        description="Objeção complexa que precisa de humano",
        initial_message="Meu marido não deixa eu gastar dinheiro com isso",
        mode_flow=[
            {"mode": "sdr_inbound", "stages": SDR_INBOUND_STAGES[:2]},
            {"mode": "objection_handler", "stages": OBJECTION_HANDLER_STAGES},
        ],
        max_turns=12,
        expected_outcome="escalado_humano",
        lead_name="Maria",
        lead_age=44,
        lead_profile="dona de casa",
        lead_pain="depressão, baixa autoestima",
        lead_budget="dependente",
        lead_objections=["marido controla finanças", "não tenho autonomia"],
    ),
]

def get_scenario_by_name(name: str) -> FullScenario:
    """Busca cenário por nome"""
    for s in FULL_SCENARIOS:
        if s.name == name:
            return s
    return None

def get_scenarios_by_flow(flow_type: FlowType) -> List[FullScenario]:
    """Busca cenários por tipo de fluxo"""
    return [s for s in FULL_SCENARIOS if s.flow_type == flow_type]
