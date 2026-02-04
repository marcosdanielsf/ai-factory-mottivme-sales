"""
Cenários E2E específicos para Isabella Amare v6.3
=================================================
Cobertura dos 7 modos:
1. sdr_inbound - Atendimento inbound de leads
2. scheduler - Agendamento e pagamento
3. concierge - Pré e pós consulta
4. objection_handler - Contorno de objeções
5. followuper - Reativação de leads
6. reativador_base - Reativação de base fria
7. social_seller_instagram - Vendas via Instagram DM
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum

from .groq_test_runner import GroqTestScenario
from .lead_simulator import LeadPersona


class IsabellaMode(Enum):
    """Modos disponíveis na Isabella v6.3"""
    SDR_INBOUND = "sdr_inbound"
    SCHEDULER = "scheduler"
    CONCIERGE = "concierge"
    OBJECTION_HANDLER = "objection_handler"
    FOLLOWUPER = "followuper"
    REATIVADOR_BASE = "reativador_base"
    SOCIAL_SELLER_INSTAGRAM = "social_seller_instagram"


@dataclass
class IsabellaTestSuite:
    """Suite de testes para Isabella v6.3"""
    name: str = "Isabella Amare v6.3 - Full Coverage"
    agent_name: str = "Isabella Amare"
    agent_version: str = "v6.3"

    def get_all_scenarios(self) -> List[GroqTestScenario]:
        """Retorna todos os cenários para teste completo"""
        return (
            self.get_sdr_inbound_scenarios() +
            self.get_scheduler_scenarios() +
            self.get_objection_handler_scenarios() +
            self.get_concierge_scenarios() +
            self.get_followuper_scenarios() +
            self.get_reativador_base_scenarios() +
            self.get_social_seller_scenarios()
        )

    def get_sdr_inbound_scenarios(self) -> List[GroqTestScenario]:
        """Cenários para modo SDR Inbound"""
        return [
            # 1. Lead quente - interesse alto
            GroqTestScenario(
                name="isabella_sdr_lead_quente",
                description="Lead quente do tráfego pago, alta urgência",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="sdr_inbound",
                lead_persona=LeadPersona.HOT,
                flow_type="sales_flow",
                expected_outcome="schedule",
                expected_mode_transitions=["sdr_inbound", "scheduler"],
                max_turns=20,
                tags=["isabella", "sdr", "hot_lead", "priority"]
            ),
            # 2. Lead morno - precisa qualificação
            GroqTestScenario(
                name="isabella_sdr_lead_morno",
                description="Lead morno, precisa descoberta de dor",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="sdr_inbound",
                lead_persona=LeadPersona.WARM,
                flow_type="sales_flow",
                expected_outcome="schedule",
                expected_mode_transitions=["sdr_inbound", "scheduler"],
                max_turns=20,
                tags=["isabella", "sdr", "warm_lead", "qualification"]
            ),
            # 3. Lead perguntando preço direto
            GroqTestScenario(
                name="isabella_sdr_pergunta_preco",
                description="Lead pergunta preço logo de cara",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="sdr_inbound",
                lead_persona=LeadPersona.OBJECTION_PRICE,
                flow_type="sales_flow",
                expected_outcome="schedule",
                expected_mode_transitions=["sdr_inbound", "scheduler"],
                max_turns=20,
                tags=["isabella", "sdr", "price_first"]
            ),
        ]

    def get_scheduler_scenarios(self) -> List[GroqTestScenario]:
        """Cenários para modo Scheduler"""
        return [
            # 1. Agendamento direto - lead já qualificado
            GroqTestScenario(
                name="isabella_scheduler_direto",
                description="Lead já qualificado, quer agendar",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="scheduler",
                lead_persona=LeadPersona.HOT,
                flow_type="sales_flow",
                expected_outcome="appointment_booked",
                expected_mode_transitions=["scheduler", "concierge"],
                max_turns=20,
                tags=["isabella", "scheduler", "direct"]
            ),
            # 2. Agendamento com dúvidas sobre pagamento
            GroqTestScenario(
                name="isabella_scheduler_duvidas_pagamento",
                description="Lead quer agendar mas tem dúvidas de pagamento",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="scheduler",
                lead_persona=LeadPersona.WARM,
                flow_type="sales_flow",
                expected_outcome="appointment_booked",
                expected_mode_transitions=["scheduler", "concierge"],
                max_turns=20,
                tags=["isabella", "scheduler", "payment_questions"]
            ),
        ]

    def get_objection_handler_scenarios(self) -> List[GroqTestScenario]:
        """Cenários para modo Objection Handler"""
        return [
            # 1. Objeção de preço
            GroqTestScenario(
                name="isabella_objection_preco",
                description="Lead acha caro, precisa contornar",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="sdr_inbound",
                lead_persona=LeadPersona.OBJECTION_PRICE,
                flow_type="objection_flow",
                expected_outcome="objection_resolved",
                expected_mode_transitions=["sdr_inbound", "objection_handler", "scheduler"],
                max_turns=20,
                tags=["isabella", "objection", "price"]
            ),
            # 2. Objeção de marido/parceiro
            GroqTestScenario(
                name="isabella_objection_marido",
                description="Lead precisa consultar marido",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="sdr_inbound",
                lead_persona=LeadPersona.OBJECTION_HUSBAND,
                flow_type="objection_flow",
                expected_outcome="objection_resolved",
                expected_mode_transitions=["sdr_inbound", "objection_handler"],
                max_turns=20,
                tags=["isabella", "objection", "spouse"]
            ),
            # 3. Objeção de tempo
            GroqTestScenario(
                name="isabella_objection_tempo",
                description="Lead diz não ter tempo agora",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="sdr_inbound",
                lead_persona=LeadPersona.OBJECTION_TIME,
                flow_type="objection_flow",
                expected_outcome="objection_resolved",
                expected_mode_transitions=["sdr_inbound", "objection_handler", "scheduler"],
                max_turns=20,
                tags=["isabella", "objection", "time"]
            ),
        ]

    def get_concierge_scenarios(self) -> List[GroqTestScenario]:
        """Cenários para modo Concierge"""
        return [
            # 1. Lembrete pré-consulta
            GroqTestScenario(
                name="isabella_concierge_pre_consulta",
                description="Lembrete 24h antes da consulta",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="concierge",
                lead_persona=LeadPersona.HOT,  # Já é paciente
                flow_type="concierge_flow",
                expected_outcome="confirmed_attendance",
                expected_mode_transitions=["concierge"],
                max_turns=20,
                tags=["isabella", "concierge", "reminder"]
            ),
            # 2. Pós-consulta - NPS
            GroqTestScenario(
                name="isabella_concierge_pos_consulta",
                description="Follow-up pós consulta, NPS",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="concierge",
                lead_persona=LeadPersona.HOT,
                flow_type="concierge_flow",
                expected_outcome="feedback_collected",
                expected_mode_transitions=["concierge"],
                max_turns=20,
                tags=["isabella", "concierge", "nps"]
            ),
        ]

    def get_followuper_scenarios(self) -> List[GroqTestScenario]:
        """Cenários para modo Followuper"""
        return [
            # 1. Lead sumiu no meio do funil
            GroqTestScenario(
                name="isabella_followuper_sumiu",
                description="Lead parou de responder, reativação",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="followuper",
                lead_persona=LeadPersona.COLD,
                flow_type="reactivation_flow",
                expected_outcome="reengaged",
                expected_mode_transitions=["followuper", "sdr_inbound"],
                max_turns=20,
                tags=["isabella", "followuper", "ghosted"]
            ),
            # 2. Lead pediu pra ligar depois
            GroqTestScenario(
                name="isabella_followuper_callback",
                description="Lead pediu pra retornar depois",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="followuper",
                lead_persona=LeadPersona.WARM,
                flow_type="reactivation_flow",
                expected_outcome="schedule",
                expected_mode_transitions=["followuper", "scheduler"],
                max_turns=20,
                tags=["isabella", "followuper", "callback"]
            ),
        ]

    def get_reativador_base_scenarios(self) -> List[GroqTestScenario]:
        """Cenários para modo Reativador Base"""
        return [
            # 1. Base antiga - nunca converteu
            GroqTestScenario(
                name="isabella_reativador_base_antiga",
                description="Lead de lista antiga, nunca converteu",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="reativador_base",
                lead_persona=LeadPersona.COLD,
                flow_type="reactivation_flow",
                expected_outcome="reengaged",
                expected_mode_transitions=["reativador_base", "sdr_inbound"],
                max_turns=20,
                tags=["isabella", "reativador", "old_base"]
            ),
            # 2. Ex-paciente - reativação
            GroqTestScenario(
                name="isabella_reativador_ex_paciente",
                description="Ex-paciente, trazer de volta",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="reativador_base",
                lead_persona=LeadPersona.WARM,
                flow_type="reactivation_flow",
                expected_outcome="schedule",
                expected_mode_transitions=["reativador_base", "scheduler"],
                max_turns=20,
                tags=["isabella", "reativador", "ex_patient"]
            ),
        ]

    def get_social_seller_scenarios(self) -> List[GroqTestScenario]:
        """Cenários para modo Social Seller Instagram"""
        return [
            # 1. Novo seguidor - DM proativo
            GroqTestScenario(
                name="isabella_social_novo_seguidor",
                description="Novo seguidor no Instagram, DM de boas-vindas",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="social_seller_instagram",
                lead_persona=LeadPersona.WARM,
                flow_type="social_flow",
                expected_outcome="schedule",
                expected_mode_transitions=["social_seller_instagram", "scheduler"],
                max_turns=20,
                tags=["isabella", "social", "new_follower"]
            ),
            # 2. Interação em post - DM aproveitando
            GroqTestScenario(
                name="isabella_social_interacao_post",
                description="Lead curtiu/comentou post, DM follow-up",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="social_seller_instagram",
                lead_persona=LeadPersona.HOT,
                flow_type="social_flow",
                expected_outcome="schedule",
                expected_mode_transitions=["social_seller_instagram", "scheduler"],
                max_turns=20,
                tags=["isabella", "social", "post_engagement"]
            ),
            # 3. Story reply - lead veio pelo stories
            GroqTestScenario(
                name="isabella_social_story_reply",
                description="Lead respondeu story, interesse demonstrado",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="social_seller_instagram",
                lead_persona=LeadPersona.HOT,
                flow_type="social_flow",
                expected_outcome="schedule",
                expected_mode_transitions=["social_seller_instagram", "scheduler"],
                max_turns=20,
                tags=["isabella", "social", "story_reply"]
            ),
        ]

    def get_quick_scenarios(self) -> List[GroqTestScenario]:
        """Cenários rápidos para smoke test"""
        return [
            GroqTestScenario(
                name="isabella_quick_hot",
                description="Quick test - Lead quente",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="sdr_inbound",
                lead_persona=LeadPersona.HOT,
                expected_outcome="schedule",
                expected_mode_transitions=["sdr_inbound", "scheduler"],
                max_turns=20,
                tags=["isabella", "quick", "smoke"]
            ),
            GroqTestScenario(
                name="isabella_quick_objection",
                description="Quick test - Objeção preço",
                agent_name=self.agent_name,
                agent_version=self.agent_version,
                initial_mode="sdr_inbound",
                lead_persona=LeadPersona.OBJECTION_PRICE,
                expected_outcome="objection_resolved",
                expected_mode_transitions=["sdr_inbound", "objection_handler"],
                max_turns=20,
                tags=["isabella", "quick", "smoke", "objection"]
            ),
        ]

    def get_priority_scenarios(self) -> List[GroqTestScenario]:
        """Cenários prioritários (principais fluxos)"""
        return [
            # SDR Hot Lead
            self.get_sdr_inbound_scenarios()[0],
            # Scheduler direto
            self.get_scheduler_scenarios()[0],
            # Objeção de preço
            self.get_objection_handler_scenarios()[0],
            # Followuper
            self.get_followuper_scenarios()[0],
            # Social seller
            self.get_social_seller_scenarios()[0],
        ]


# Mapeamento de personas por cenário
ISABELLA_LEAD_PERSONAS = {
    "hot_menopausa": {
        "name": "Maria",
        "age": 52,
        "occupation": "empresária",
        "symptoms": ["ondas de calor intensas", "insônia", "irritabilidade"],
        "urgency": "alta",
        "budget": "alto"
    },
    "warm_prevencao": {
        "name": "Ana",
        "age": 45,
        "occupation": "advogada",
        "symptoms": ["cansaço", "libido baixa", "dificuldade concentração"],
        "urgency": "média",
        "budget": "médio"
    },
    "cold_curiosa": {
        "name": "Carla",
        "age": 48,
        "occupation": "professora",
        "symptoms": ["ganho de peso", "humor oscilante"],
        "urgency": "baixa",
        "budget": "baixo"
    },
    "objection_price": {
        "name": "Sandra",
        "age": 50,
        "occupation": "contadora",
        "symptoms": ["fogachos", "ansiedade"],
        "objection": "acha caro",
        "budget": "limitado"
    },
    "objection_spouse": {
        "name": "Julia",
        "age": 47,
        "occupation": "dona de casa",
        "symptoms": ["depressão leve", "baixa autoestima"],
        "objection": "precisa consultar marido",
        "budget": "dependente"
    }
}


def get_isabella_suite() -> IsabellaTestSuite:
    """Retorna a suite de testes da Isabella"""
    return IsabellaTestSuite()


def get_isabella_scenarios(mode: str = "all") -> List[GroqTestScenario]:
    """
    Retorna cenários por modo ou todos

    Args:
        mode: "all", "quick", "priority", ou nome do modo específico
    """
    suite = get_isabella_suite()

    if mode == "all":
        return suite.get_all_scenarios()
    elif mode == "quick":
        return suite.get_quick_scenarios()
    elif mode == "priority":
        return suite.get_priority_scenarios()
    elif mode == "sdr_inbound":
        return suite.get_sdr_inbound_scenarios()
    elif mode == "scheduler":
        return suite.get_scheduler_scenarios()
    elif mode == "objection_handler":
        return suite.get_objection_handler_scenarios()
    elif mode == "concierge":
        return suite.get_concierge_scenarios()
    elif mode == "followuper":
        return suite.get_followuper_scenarios()
    elif mode == "reativador_base":
        return suite.get_reativador_base_scenarios()
    elif mode == "social_seller_instagram":
        return suite.get_social_seller_scenarios()
    else:
        return suite.get_all_scenarios()


# Exportar cenários
ISABELLA_ALL_SCENARIOS = get_isabella_scenarios("all")
ISABELLA_QUICK_SCENARIOS = get_isabella_scenarios("quick")
ISABELLA_PRIORITY_SCENARIOS = get_isabella_scenarios("priority")
