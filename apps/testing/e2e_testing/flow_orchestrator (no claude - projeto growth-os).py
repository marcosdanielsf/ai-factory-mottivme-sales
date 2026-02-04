"""
Flow Orchestrator - Controla fluxo e handoffs entre agentes
===========================================================
Gerencia a troca de contexto entre diferentes modos/agentes.
"""

import os
import json
from enum import Enum
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
import anthropic


class AgentMode(Enum):
    """Modos de operação do agente (avatares)"""

    # Primeiro contato - qualificação inicial
    FIRST_CONTACT = "first_contact"

    # Social Seller - vendas via Instagram/redes sociais
    SOCIAL_SELLER = "social_seller"

    # SDR Inbound - leads que vieram por conta própria
    SDR_INBOUND = "sdr_inbound"

    # SDR Outbound - prospecção ativa
    SDR_OUTBOUND = "sdr_outbound"

    # Scheduler - agendamento de consultas
    SCHEDULER = "scheduler"

    # Rescheduler - reagendamento
    RESCHEDULER = "rescheduler"

    # Concierge - pré-consulta e show rate
    CONCIERGE = "concierge"

    # Objection Handler - tratamento de objeções
    OBJECTION_HANDLER = "objection_handler"

    # Closer - fechamento pós-consulta
    CLOSER = "closer"

    # Customer Success - pós-venda
    CUSTOMER_SUCCESS = "customer_success"

    # Followuper - follow-up de leads frios
    FOLLOWUPER = "followuper"

    # Referral Generator - geração de indicações
    REFERRAL_GENERATOR = "referral_generator"


@dataclass
class HandoffResult:
    """Resultado de um handoff entre agentes"""
    from_agent: AgentMode
    to_agent: AgentMode
    reason: str
    context_passed: Dict
    timestamp: datetime = field(default_factory=datetime.utcnow)
    success: bool = True


@dataclass
class FlowState:
    """Estado atual do fluxo de conversação"""
    current_agent: AgentMode
    conversation_history: List[Dict] = field(default_factory=list)
    context: Dict = field(default_factory=dict)
    handoffs: List[HandoffResult] = field(default_factory=list)
    started_at: datetime = field(default_factory=datetime.utcnow)
    message_count: int = 0
    objective_reached: Optional[str] = None


# Definição dos fluxos e transições permitidas
FLOW_TRANSITIONS = {
    AgentMode.FIRST_CONTACT: {
        "objectives": ["qualify", "schedule"],
        "can_handoff_to": [AgentMode.SCHEDULER, AgentMode.OBJECTION_HANDLER, AgentMode.FOLLOWUPER],
        "success_handoff": AgentMode.SCHEDULER,
        "max_messages": 10
    },
    AgentMode.SOCIAL_SELLER: {
        "objectives": ["qualify", "schedule"],
        "can_handoff_to": [AgentMode.SCHEDULER, AgentMode.OBJECTION_HANDLER, AgentMode.FOLLOWUPER],
        "success_handoff": AgentMode.SCHEDULER,
        "max_messages": 12
    },
    AgentMode.SDR_INBOUND: {
        "objectives": ["qualify", "schedule"],
        "can_handoff_to": [AgentMode.SCHEDULER, AgentMode.OBJECTION_HANDLER, AgentMode.FOLLOWUPER],
        "success_handoff": AgentMode.SCHEDULER,
        "max_messages": 10
    },
    AgentMode.SDR_OUTBOUND: {
        "objectives": ["create_interest", "qualify", "schedule"],
        "can_handoff_to": [AgentMode.SCHEDULER, AgentMode.OBJECTION_HANDLER, AgentMode.FOLLOWUPER],
        "success_handoff": AgentMode.SCHEDULER,
        "max_messages": 15
    },
    AgentMode.SCHEDULER: {
        "objectives": ["schedule_appointment"],
        "can_handoff_to": [AgentMode.CONCIERGE, AgentMode.OBJECTION_HANDLER],
        "success_handoff": AgentMode.CONCIERGE,
        "max_messages": 6
    },
    AgentMode.RESCHEDULER: {
        "objectives": ["reschedule_appointment"],
        "can_handoff_to": [AgentMode.CONCIERGE, AgentMode.FOLLOWUPER],
        "success_handoff": AgentMode.CONCIERGE,
        "max_messages": 6
    },
    AgentMode.CONCIERGE: {
        "objectives": ["ensure_show_rate"],
        "can_handoff_to": [AgentMode.CLOSER, AgentMode.RESCHEDULER],
        "success_handoff": AgentMode.CLOSER,
        "max_messages": 8
    },
    AgentMode.OBJECTION_HANDLER: {
        "objectives": ["resolve_objection"],
        "can_handoff_to": [],  # Volta pro agente que chamou
        "success_handoff": None,  # Dinâmico
        "max_messages": 8
    },
    AgentMode.CLOSER: {
        "objectives": ["close_sale"],
        "can_handoff_to": [AgentMode.OBJECTION_HANDLER, AgentMode.REFERRAL_GENERATOR, AgentMode.FOLLOWUPER],
        "success_handoff": AgentMode.REFERRAL_GENERATOR,
        "max_messages": 10
    },
    AgentMode.CUSTOMER_SUCCESS: {
        "objectives": ["ensure_satisfaction", "upsell"],
        "can_handoff_to": [AgentMode.REFERRAL_GENERATOR, AgentMode.SCHEDULER],
        "success_handoff": AgentMode.REFERRAL_GENERATOR,
        "max_messages": 8
    },
    AgentMode.FOLLOWUPER: {
        "objectives": ["re_engage"],
        "can_handoff_to": [AgentMode.SCHEDULER, AgentMode.OBJECTION_HANDLER],
        "success_handoff": AgentMode.SCHEDULER,
        "max_messages": 6
    },
    AgentMode.REFERRAL_GENERATOR: {
        "objectives": ["get_referral"],
        "can_handoff_to": [],  # Fim do fluxo
        "success_handoff": None,
        "max_messages": 5
    }
}


class FlowOrchestrator:
    """
    Orquestra o fluxo de conversação entre diferentes agentes.

    Responsabilidades:
    - Controlar qual agente está ativo
    - Detectar quando deve fazer handoff
    - Validar se handoff foi feito corretamente
    - Passar contexto entre agentes
    - Registrar métricas
    """

    HANDOFF_DETECTION_PROMPT = """Analise a última resposta do agente e determine se houve indicação de handoff.

## AGENTE ATUAL: {current_agent}

## ÚLTIMA RESPOSTA DO AGENTE:
{agent_response}

## CONTEXTO DA CONVERSA:
{context}

## HANDOFFS POSSÍVEIS:
{possible_handoffs}

## INSTRUÇÕES:
Analise se o agente indicou que deve passar a conversa para outro modo.
Sinais de handoff incluem:
- "Vou passar você para o agendamento"
- "Deixa eu verificar os horários"
- "Entendo sua preocupação, vou te ajudar com isso" (objeção)
- "Vou transferir para nossa equipe de suporte"
- Etc.

Responda em JSON:
```json
{{
    "should_handoff": true/false,
    "target_agent": "nome_do_agente" ou null,
    "reason": "motivo do handoff",
    "context_to_pass": {{}} // dados relevantes para o próximo agente
}}
```"""

    def __init__(self, initial_agent: AgentMode, api_key: str = None):
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        self.client = anthropic.Anthropic(api_key=self.api_key)

        self.state = FlowState(
            current_agent=initial_agent,
            context={
                "initial_agent": initial_agent.value,
                "lead_info": {},
                "qualification": {},
                "appointment": {},
                "objections": []
            }
        )

        # Agente que chamou o objection_handler (para retorno)
        self._caller_stack: List[AgentMode] = []

    def process_turn(
        self,
        agent_response: str,
        lead_response: str
    ) -> Dict:
        """
        Processa um turno de conversa.

        Args:
            agent_response: Resposta do agente
            lead_response: Resposta do lead

        Returns:
            Dict com:
            - handoff: HandoffResult se houve handoff
            - new_agent: novo agente ativo (ou None)
            - context: contexto atualizado
            - should_continue: se deve continuar a conversa
        """
        # Registrar no histórico
        self.state.conversation_history.append({
            "role": "agent",
            "content": agent_response,
            "agent": self.state.current_agent.value,
            "timestamp": datetime.utcnow().isoformat()
        })
        self.state.conversation_history.append({
            "role": "lead",
            "content": lead_response,
            "timestamp": datetime.utcnow().isoformat()
        })
        self.state.message_count += 2

        # Detectar handoff
        handoff_result = self._detect_handoff(agent_response)

        if handoff_result and handoff_result.get("should_handoff"):
            target = handoff_result.get("target_agent")
            if target:
                try:
                    target_agent = AgentMode(target)
                    handoff = self._execute_handoff(
                        target_agent,
                        handoff_result.get("reason", ""),
                        handoff_result.get("context_to_pass", {})
                    )
                    return {
                        "handoff": handoff,
                        "new_agent": target_agent,
                        "context": self.state.context,
                        "should_continue": True
                    }
                except ValueError:
                    pass  # Agente inválido, continua

        # Checar se atingiu limite de mensagens
        flow_config = FLOW_TRANSITIONS.get(self.state.current_agent, {})
        max_messages = flow_config.get("max_messages", 20)

        if self.state.message_count >= max_messages * 2:  # *2 porque conta agent + lead
            return {
                "handoff": None,
                "new_agent": None,
                "context": self.state.context,
                "should_continue": False,
                "reason": "max_messages_reached"
            }

        return {
            "handoff": None,
            "new_agent": None,
            "context": self.state.context,
            "should_continue": True
        }

    def _detect_handoff(self, agent_response: str) -> Optional[Dict]:
        """Detecta se deve fazer handoff baseado na resposta do agente"""

        flow_config = FLOW_TRANSITIONS.get(self.state.current_agent, {})
        possible_handoffs = flow_config.get("can_handoff_to", [])

        if not possible_handoffs:
            return None

        prompt = self.HANDOFF_DETECTION_PROMPT.format(
            current_agent=self.state.current_agent.value,
            agent_response=agent_response,
            context=json.dumps(self.state.context, ensure_ascii=False, indent=2),
            possible_handoffs=", ".join([h.value for h in possible_handoffs])
        )

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = response.content[0].text

        # Extrair JSON
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(response_text[json_start:json_end])
        except:
            pass

        return None

    def _execute_handoff(
        self,
        target_agent: AgentMode,
        reason: str,
        context_to_pass: Dict
    ) -> HandoffResult:
        """Executa handoff para outro agente"""

        # Se for objection_handler, guardar quem chamou
        if target_agent == AgentMode.OBJECTION_HANDLER:
            self._caller_stack.append(self.state.current_agent)

        # Se estiver saindo do objection_handler, voltar pro anterior
        if self.state.current_agent == AgentMode.OBJECTION_HANDLER:
            if self._caller_stack:
                target_agent = self._caller_stack.pop()

        handoff = HandoffResult(
            from_agent=self.state.current_agent,
            to_agent=target_agent,
            reason=reason,
            context_passed=context_to_pass
        )

        # Atualizar estado
        self.state.handoffs.append(handoff)
        self.state.current_agent = target_agent
        self.state.context.update(context_to_pass)

        return handoff

    def force_handoff(self, target_agent: AgentMode, reason: str = "") -> HandoffResult:
        """Força um handoff manualmente (para testes)"""
        return self._execute_handoff(target_agent, reason, {})

    def get_current_agent(self) -> AgentMode:
        """Retorna agente atual"""
        return self.state.current_agent

    def get_state_summary(self) -> Dict:
        """Retorna resumo do estado atual"""
        return {
            "current_agent": self.state.current_agent.value,
            "message_count": self.state.message_count,
            "handoff_count": len(self.state.handoffs),
            "handoffs": [
                {
                    "from": h.from_agent.value,
                    "to": h.to_agent.value,
                    "reason": h.reason
                }
                for h in self.state.handoffs
            ],
            "elapsed_time_seconds": (datetime.utcnow() - self.state.started_at).total_seconds(),
            "objective_reached": self.state.objective_reached
        }

    def set_objective_reached(self, objective: str):
        """Marca que um objetivo foi atingido"""
        self.state.objective_reached = objective

    def get_conversation_history(self) -> List[Dict]:
        """Retorna histórico de conversa"""
        return self.state.conversation_history
