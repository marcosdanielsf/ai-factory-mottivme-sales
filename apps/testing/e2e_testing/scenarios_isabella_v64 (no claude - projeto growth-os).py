"""
Cenários de Teste E2E - Isabella Amare v6.4
============================================
Testes específicos para validar o novo fluxo de vendas consultivo:
1. Discovery obrigatório antes de oferecer horários
2. Geração de valor antes do preço
3. Pagamento ANTES do agendamento
4. Ancoragem de preço (R$ 1.200 → R$ 971)
"""

from dataclasses import dataclass, field
from typing import List
from .groq_test_runner import GroqTestScenario
from .lead_simulator import LeadPersona


# =============================================================================
# CENÁRIOS V6.4 - FLUXO CONSULTIVO
# =============================================================================

ISABELLA_V64_SCENARIOS = [
    # ---------------------------------------------------------------------
    # TESTE 1: FLUXO COMPLETO - HOT LEAD
    # Valida: Discovery → Valor → Preço → Pagamento → Agendamento
    # ---------------------------------------------------------------------
    GroqTestScenario(
        name="v64_fluxo_consultivo_completo",
        description="Lead quente - fluxo consultivo completo (Discovery → Valor → Preço → Pagar → Agendar)",
        agent_name="Isabella Amare",
        agent_version="v6.4",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.HOT,
        flow_type="consultive_sales_flow",
        expected_outcome="agendamento_confirmado",
        expected_mode_transitions=["sdr_inbound", "scheduler"],
        max_turns=25,
        tags=["v6.4", "fluxo_consultivo", "hot_lead", "pagamento_primeiro"]
    ),

    # ---------------------------------------------------------------------
    # TESTE 2: VALIDAR DISCOVERY OBRIGATÓRIO
    # A IA deve fazer perguntas ANTES de oferecer horários
    # ---------------------------------------------------------------------
    GroqTestScenario(
        name="v64_discovery_obrigatorio",
        description="Validar que IA faz Discovery antes de oferecer horários",
        agent_name="Isabella Amare",
        agent_version="v6.4",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.WARM,
        flow_type="discovery_validation",
        expected_outcome="discovery_completo",
        expected_mode_transitions=["sdr_inbound"],
        max_turns=10,
        tags=["v6.4", "discovery", "validacao"]
    ),

    # ---------------------------------------------------------------------
    # TESTE 3: VALIDAR GERAÇÃO DE VALOR
    # A IA deve explicar diferenciais ANTES de falar preço
    # ---------------------------------------------------------------------
    GroqTestScenario(
        name="v64_geracao_valor_antes_preco",
        description="Validar que IA gera valor antes de revelar preço",
        agent_name="Isabella Amare",
        agent_version="v6.4",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.OBJECTION_PRICE,
        flow_type="value_generation_validation",
        expected_outcome="valor_gerado",
        expected_mode_transitions=["sdr_inbound"],
        max_turns=12,
        tags=["v6.4", "geracao_valor", "preco"]
    ),

    # ---------------------------------------------------------------------
    # TESTE 4: PAGAMENTO ANTES DE AGENDAR
    # A IA NÃO PODE agendar sem pagamento confirmado
    # ---------------------------------------------------------------------
    GroqTestScenario(
        name="v64_pagamento_antes_agendamento",
        description="Validar que IA cobra pagamento ANTES de agendar",
        agent_name="Isabella Amare",
        agent_version="v6.4",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.HOT,
        flow_type="payment_first_validation",
        expected_outcome="pagamento_solicitado",
        expected_mode_transitions=["sdr_inbound", "scheduler"],
        max_turns=20,
        tags=["v6.4", "pagamento_primeiro", "agendamento"]
    ),

    # ---------------------------------------------------------------------
    # TESTE 5: OBJEÇÃO DE PREÇO COM ANCORAGEM
    # A IA deve usar âncora (R$ 1.200 → R$ 971)
    # ---------------------------------------------------------------------
    GroqTestScenario(
        name="v64_objecao_preco_ancoragem",
        description="Lead com objeção de preço - validar uso de ancoragem",
        agent_name="Isabella Amare",
        agent_version="v6.4",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.OBJECTION_PRICE,
        flow_type="objection_flow",
        expected_outcome="objection_resolved",
        expected_mode_transitions=["sdr_inbound", "objection_handler"],
        max_turns=18,
        tags=["v6.4", "objecao", "preco", "ancoragem"]
    ),

    # ---------------------------------------------------------------------
    # TESTE 6: LEAD APRESSADA (RUSHED)
    # Mesmo com pressa, IA deve manter o fluxo consultivo
    # ---------------------------------------------------------------------
    GroqTestScenario(
        name="v64_lead_apressada_fluxo_consultivo",
        description="Lead com pressa - validar que IA mantém fluxo consultivo",
        agent_name="Isabella Amare",
        agent_version="v6.4",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.RUSHED,
        flow_type="rushed_lead_validation",
        expected_outcome="agendamento_confirmado",
        expected_mode_transitions=["sdr_inbound", "scheduler"],
        max_turns=20,
        tags=["v6.4", "rushed", "fluxo_consultivo"]
    ),

    # ---------------------------------------------------------------------
    # TESTE 7: OBJEÇÃO MARIDO
    # Tratar objeção e só depois pedir pagamento
    # ---------------------------------------------------------------------
    GroqTestScenario(
        name="v64_objecao_marido",
        description="Lead precisa falar com marido - tratar objeção corretamente",
        agent_name="Isabella Amare",
        agent_version="v6.4",
        initial_mode="sdr_inbound",
        lead_persona=LeadPersona.OBJECTION_HUSBAND,
        flow_type="objection_flow",
        expected_outcome="objection_resolved",
        expected_mode_transitions=["sdr_inbound", "objection_handler"],
        max_turns=18,
        tags=["v6.4", "objecao", "marido"]
    ),
]


# =============================================================================
# CENÁRIOS DE VALIDAÇÃO ESPECÍFICA (para checklist manual)
# =============================================================================

VALIDATION_CHECKPOINTS = {
    "discovery": {
        "descricao": "IA fez perguntas de Discovery antes de oferecer horários",
        "perguntas_esperadas": [
            "Há quanto tempo você está passando por isso?",
            "O que você já tentou antes?",
            "Como isso está afetando sua vida/trabalho?",
        ],
        "criterio_sucesso": "Pelo menos 2 perguntas de discovery feitas antes de mencionar horários",
    },
    "geracao_valor": {
        "descricao": "IA explicou diferenciais antes de revelar preço",
        "pontos_esperados": [
            "protocolo de 1h30",
            "nutricionista inclusa",
            "bioimpedância inclusa",
            "kit premium",
            "frase do Dr. Luiz",
        ],
        "criterio_sucesso": "Pelo menos 3 pontos de valor mencionados antes do preço",
    },
    "ancoragem_preco": {
        "descricao": "IA usou técnica de ancoragem ao apresentar preço",
        "sequencia_esperada": [
            "mencionar valor cheio (R$ 1.200)",
            "apresentar promocional (R$ 971)",
            "mencionar parcelamento (3x R$ 400)",
        ],
        "criterio_sucesso": "Mencionar valor cheio ANTES do promocional",
    },
    "pagamento_primeiro": {
        "descricao": "IA solicitou pagamento ANTES de agendar",
        "sequencia_esperada": [
            "confirmar interesse",
            "escalar para gerar link de pagamento",
            "aguardar confirmação de pagamento",
            "só então buscar horários",
        ],
        "criterio_sucesso": "Ferramenta de agendamento só chamada APÓS menção de pagamento",
    },
}


# =============================================================================
# PERSONAS ADICIONAIS PARA V6.4
# =============================================================================

# Adicionar novas personas ao lead_simulator se necessário
ADDITIONAL_PERSONAS_V64 = {
    "RUSHED_BUT_SKEPTICAL": {
        "name": "Claudia",
        "age": 48,
        "occupation": "Advogada",
        "budget_range": "R$ 500-1500",
        "urgency": "alta",
        "pain_points": [
            "Insônia severa há 6 meses",
            "Ganhou 8kg sem motivo",
            "Irritabilidade extrema afetando trabalho",
        ],
        "goals": [
            "Resolver insônia urgente",
            "Entender se é menopausa",
        ],
        "backstory": "Advogada bem sucedida, não tem tempo a perder. Já tentou 2 médicos antes e não resolveu. Está cética mas desesperada.",
        "objections": [
            "Preciso resolver logo, não posso esperar 15 dias",
            "Já gastei muito com outros médicos",
        ],
    },
    "PRICE_CONSCIOUS_BUT_INTERESTED": {
        "name": "Maria",
        "age": 52,
        "occupation": "Professora",
        "budget_range": "R$ 300-800",
        "urgency": "média",
        "pain_points": [
            "Fogachos intensos",
            "Baixa libido",
            "Cansaço constante",
        ],
        "goals": [
            "Melhorar qualidade de vida",
            "Entender se vale o investimento",
        ],
        "backstory": "Professora pública, orçamento limitado. Muito interessada mas precisa de justificativa clara para o investimento.",
        "objections": [
            "R$ 971 é muito pra mim",
            "Vocês aceitam convênio?",
            "Dá pra parcelar em mais vezes?",
        ],
    },
}


def get_v64_scenarios() -> List[GroqTestScenario]:
    """Retorna todos os cenários da v6.4"""
    return ISABELLA_V64_SCENARIOS


def get_validation_checkpoints() -> dict:
    """Retorna checkpoints de validação para acompanhamento manual"""
    return VALIDATION_CHECKPOINTS
