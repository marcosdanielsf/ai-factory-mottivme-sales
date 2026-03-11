"""
Flow Builder API - Simulation Service
Serviço para simular conversas com IA e capturar reasoning.
"""
from typing import Optional, List
from uuid import UUID, uuid4
import logging
from datetime import datetime
import json

from anthropic import Anthropic

from ..core.database import get_supabase
from ..core.config import settings
from ..models.flow import (
    Simulation, SimulationCreate, SimulationStep,
    SimulationMessage, Persona, Reasoning, ReasoningLog,
    Flow
)
from .flow_service import flow_service

logger = logging.getLogger(__name__)


class SimulationService:
    """Service para simulações de conversa"""

    def __init__(self):
        self.supabase = get_supabase()
        self.anthropic = Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None

    async def create_simulation(self, sim: SimulationCreate) -> Simulation:
        """Inicia uma nova simulação"""
        # Busca o flow para contexto
        flow = await flow_service.get_flow(sim.flow_id)
        if not flow:
            raise ValueError(f"Flow {sim.flow_id} not found")

        simulation_id = uuid4()

        data = {
            "id": str(simulation_id),
            "flow_id": str(sim.flow_id),
            "persona": sim.persona.model_dump(),
            "messages": [],
            "current_node_id": str(sim.start_node_id) if sim.start_node_id else None,
            "status": "running"
        }

        result = self.supabase.table("simulations")\
            .insert(data)\
            .execute()

        created = result.data[0]

        # Gera primeira mensagem do agent
        simulation = Simulation(
            id=UUID(created["id"]),
            flow_id=UUID(created["flow_id"]),
            persona=Persona(**created["persona"]),
            messages=[],
            current_node_id=UUID(created["current_node_id"]) if created.get("current_node_id") else None,
            status=created["status"],
            created_at=datetime.fromisoformat(created["created_at"])
        )

        # Gera abertura do agent
        opening_message = await self._generate_agent_message(
            simulation=simulation,
            flow=flow,
            context="abertura"
        )

        simulation.messages.append(opening_message)

        # Salva mensagem
        await self._update_simulation_messages(simulation)

        return simulation

    async def step_simulation(self, step: SimulationStep) -> Simulation:
        """Avança a simulação com mensagem do lead"""
        # Busca simulação
        result = self.supabase.table("simulations")\
            .select("*")\
            .eq("id", str(step.simulation_id))\
            .single()\
            .execute()

        if not result.data:
            raise ValueError(f"Simulation {step.simulation_id} not found")

        sim_data = result.data
        simulation = Simulation(
            id=UUID(sim_data["id"]),
            flow_id=UUID(sim_data["flow_id"]),
            persona=Persona(**sim_data["persona"]),
            messages=[SimulationMessage(**m) if isinstance(m, dict) else m for m in sim_data.get("messages", [])],
            current_node_id=UUID(sim_data["current_node_id"]) if sim_data.get("current_node_id") else None,
            status=sim_data["status"],
            created_at=datetime.fromisoformat(sim_data["created_at"])
        )

        # Busca flow
        flow = await flow_service.get_flow(simulation.flow_id)
        if not flow:
            raise ValueError(f"Flow {simulation.flow_id} not found")

        # Adiciona mensagem do lead
        lead_message = SimulationMessage(
            id=uuid4(),
            role="lead",
            content=step.lead_message,
            timestamp=datetime.utcnow()
        )
        simulation.messages.append(lead_message)

        # Gera resposta do agent
        agent_message = await self._generate_agent_message(
            simulation=simulation,
            flow=flow,
            context="resposta"
        )
        simulation.messages.append(agent_message)

        # Salva mensagens
        await self._update_simulation_messages(simulation)

        return simulation

    async def get_simulation(self, simulation_id: UUID) -> Optional[Simulation]:
        """Busca uma simulação"""
        result = self.supabase.table("simulations")\
            .select("*")\
            .eq("id", str(simulation_id))\
            .single()\
            .execute()

        if not result.data:
            return None

        sim_data = result.data
        return Simulation(
            id=UUID(sim_data["id"]),
            flow_id=UUID(sim_data["flow_id"]),
            persona=Persona(**sim_data["persona"]),
            messages=[SimulationMessage(**m) if isinstance(m, dict) else m for m in sim_data.get("messages", [])],
            current_node_id=UUID(sim_data["current_node_id"]) if sim_data.get("current_node_id") else None,
            status=sim_data["status"],
            created_at=datetime.fromisoformat(sim_data["created_at"])
        )

    async def get_reasoning(self, simulation_id: UUID) -> List[ReasoningLog]:
        """Busca logs de reasoning de uma simulação"""
        result = self.supabase.table("reasoning_logs")\
            .select("*")\
            .eq("simulation_id", str(simulation_id))\
            .order("message_index")\
            .execute()

        return [
            ReasoningLog(
                id=UUID(r["id"]),
                simulation_id=UUID(r["simulation_id"]),
                node_id=UUID(r["node_id"]) if r.get("node_id") else None,
                message_index=r["message_index"],
                criteria=Reasoning(**r["criteria"]),
                created_at=datetime.fromisoformat(r["created_at"])
            )
            for r in result.data
        ]

    async def _generate_agent_message(
        self,
        simulation: Simulation,
        flow: Flow,
        context: str
    ) -> SimulationMessage:
        """Gera mensagem do agent usando Claude"""

        if not self.anthropic:
            # Fallback se não tiver API key
            return SimulationMessage(
                id=uuid4(),
                role="agent",
                content="[Simulação] Olá! Como posso ajudar?",
                timestamp=datetime.utcnow(),
                reasoning=Reasoning(
                    applied_techniques=["Abertura cordial"],
                    detected_intents=["Início de conversa"],
                    decision_factors=["Lead novo"],
                    next_action="Aguardar resposta"
                )
            )

        # Monta contexto do flow
        mode_nodes = [n for n in flow.nodes if n.type == "mode"]
        etapa_nodes = [n for n in flow.nodes if n.type == "etapa"]

        # System prompt
        system_prompt = f"""Você é um agente de vendas simulando uma conversa.

PERSONA DO LEAD:
- Nome: {simulation.persona.name}
- Descrição: {simulation.persona.description}
- Características: {', '.join(simulation.persona.characteristics)}
- Dores: {', '.join(simulation.persona.pain_points)}
- Objeções comuns: {', '.join(simulation.persona.objections)}

FLOW ATUAL:
- Modes disponíveis: {[n.data.get('mode_name', n.data.get('label')) for n in mode_nodes]}
- Etapas: {[n.data.get('label') for n in etapa_nodes]}

CONTEXTO: {context}

HISTÓRICO DA CONVERSA:
{self._format_messages(simulation.messages)}

INSTRUÇÕES:
1. Responda de forma natural e humana
2. Aplique técnicas de vendas consultivas (NEPQ, validação emocional)
3. Seja empático e acolhedor
4. Faça perguntas abertas para qualificar

IMPORTANTE: Responda em JSON com o formato:
{{
    "message": "Sua resposta aqui",
    "reasoning": {{
        "applied_techniques": ["lista de técnicas aplicadas"],
        "detected_intents": ["intenções detectadas no lead"],
        "decision_factors": ["fatores que influenciaram a resposta"],
        "next_action": "próximo passo sugerido"
    }}
}}"""

        try:
            response = self.anthropic.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                messages=[{"role": "user", "content": system_prompt}]
            )

            # Parse response
            content = response.content[0].text
            try:
                parsed = json.loads(content)
                message_content = parsed.get("message", content)
                reasoning_data = parsed.get("reasoning", {})
            except json.JSONDecodeError:
                message_content = content
                reasoning_data = {}

            reasoning = Reasoning(
                applied_techniques=reasoning_data.get("applied_techniques", []),
                detected_intents=reasoning_data.get("detected_intents", []),
                decision_factors=reasoning_data.get("decision_factors", []),
                next_action=reasoning_data.get("next_action")
            )

            message = SimulationMessage(
                id=uuid4(),
                role="agent",
                content=message_content,
                timestamp=datetime.utcnow(),
                reasoning=reasoning
            )

            # Salva reasoning log
            await self._save_reasoning_log(simulation, message, len(simulation.messages))

            return message

        except Exception as e:
            logger.error(f"Error generating agent message: {e}")
            return SimulationMessage(
                id=uuid4(),
                role="agent",
                content="Desculpe, tive um problema. Pode repetir?",
                timestamp=datetime.utcnow(),
                reasoning=Reasoning(
                    applied_techniques=["Recuperação de erro"],
                    detected_intents=[],
                    decision_factors=["Erro de processamento"],
                    next_action="Tentar novamente"
                )
            )

    def _format_messages(self, messages: List[SimulationMessage]) -> str:
        """Formata mensagens para contexto"""
        if not messages:
            return "(Início da conversa)"

        formatted = []
        for msg in messages[-10:]:  # Últimas 10 mensagens
            role = "Agent" if msg.role == "agent" else "Lead"
            formatted.append(f"{role}: {msg.content}")

        return "\n".join(formatted)

    async def _update_simulation_messages(self, simulation: Simulation):
        """Atualiza mensagens da simulação no banco"""
        messages_data = [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "timestamp": m.timestamp.isoformat(),
                "reasoning": m.reasoning.model_dump() if m.reasoning else None
            }
            for m in simulation.messages
        ]

        self.supabase.table("simulations")\
            .update({"messages": messages_data})\
            .eq("id", str(simulation.id))\
            .execute()

    async def _save_reasoning_log(
        self,
        simulation: Simulation,
        message: SimulationMessage,
        message_index: int
    ):
        """Salva log de reasoning"""
        if not message.reasoning:
            return

        data = {
            "simulation_id": str(simulation.id),
            "node_id": str(simulation.current_node_id) if simulation.current_node_id else None,
            "message_index": message_index,
            "criteria": message.reasoning.model_dump()
        }

        self.supabase.table("reasoning_logs")\
            .insert(data)\
            .execute()


# Singleton
simulation_service = SimulationService()
