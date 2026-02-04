"""
E2E Test Runner - Executa cenários de teste completos
=====================================================
Orquestra simulador de lead + agente + flow orchestrator.
"""

import os
import json
import asyncio
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import anthropic

from .lead_simulator import LeadSimulator, LeadPersona, LeadProfile, get_profile, LEAD_PROFILES
from .flow_orchestrator import FlowOrchestrator, AgentMode, FLOW_TRANSITIONS


class TestStatus(Enum):
    """Status do teste"""
    PASSED = "passed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    ERROR = "error"


@dataclass
class TestScenario:
    """Define um cenário de teste E2E"""
    name: str
    description: str
    initial_agent: AgentMode
    lead_persona: LeadPersona
    expected_outcome: str  # "schedule", "objection_resolved", "sale_closed", etc.
    expected_handoffs: List[AgentMode]
    max_turns: int = 20
    success_criteria: Dict = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)


@dataclass
class TestResult:
    """Resultado de um teste E2E"""
    scenario: TestScenario
    status: TestStatus
    actual_outcome: Optional[str]
    conversation: List[Dict]
    handoffs: List[Dict]
    metrics: Dict
    error: Optional[str] = None
    started_at: datetime = field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None

    def to_dict(self) -> Dict:
        return {
            "scenario_name": self.scenario.name,
            "status": self.status.value,
            "actual_outcome": self.actual_outcome,
            "expected_outcome": self.scenario.expected_outcome,
            "conversation_length": len(self.conversation),
            "conversation": self.conversation,
            "handoffs": self.handoffs,
            "expected_handoffs": [h.value for h in self.scenario.expected_handoffs],
            "metrics": self.metrics,
            "error": self.error,
            "duration_seconds": (self.finished_at - self.started_at).total_seconds() if self.finished_at else None
        }


# Cenários de teste pré-definidos
DEFAULT_TEST_SCENARIOS = [
    # FLUXO 1: Social Seller Instagram - Lead Quente
    TestScenario(
        name="social_seller_hot_lead",
        description="Lead quente via Instagram que quer agendar",
        initial_agent=AgentMode.SOCIAL_SELLER,
        lead_persona=LeadPersona.HOT,
        expected_outcome="schedule",
        expected_handoffs=[AgentMode.SCHEDULER],
        max_turns=8,
        success_criteria={
            "max_messages_to_handoff": 6,
            "handoff_with_context": True
        },
        tags=["social_seller", "hot_lead", "happy_path"]
    ),

    # FLUXO 2: Social Seller - Lead Morno
    TestScenario(
        name="social_seller_warm_lead",
        description="Lead morno que precisa ser convencido",
        initial_agent=AgentMode.SOCIAL_SELLER,
        lead_persona=LeadPersona.WARM,
        expected_outcome="schedule",
        expected_handoffs=[AgentMode.SCHEDULER],
        max_turns=12,
        success_criteria={
            "qualification_done": True,
            "value_presented": True
        },
        tags=["social_seller", "warm_lead", "qualification"]
    ),

    # FLUXO 3: Social Seller - Lead com objeção marido
    TestScenario(
        name="social_seller_objection_husband",
        description="Lead que precisa falar com marido",
        initial_agent=AgentMode.SOCIAL_SELLER,
        lead_persona=LeadPersona.OBJECTION_HUSBAND,
        expected_outcome="objection_resolved",
        expected_handoffs=[AgentMode.OBJECTION_HANDLER, AgentMode.SCHEDULER],
        max_turns=15,
        success_criteria={
            "objection_handled": True,
            "arguments_provided": True
        },
        tags=["social_seller", "objection", "husband"]
    ),

    # FLUXO 4: Social Seller - Lead frio
    TestScenario(
        name="social_seller_cold_lead",
        description="Lead cético com muitas objeções",
        initial_agent=AgentMode.SOCIAL_SELLER,
        lead_persona=LeadPersona.COLD,
        expected_outcome="followup",
        expected_handoffs=[AgentMode.OBJECTION_HANDLER, AgentMode.FOLLOWUPER],
        max_turns=15,
        success_criteria={
            "not_pushy": True,
            "follow_up_scheduled": True
        },
        tags=["social_seller", "cold_lead", "objection"]
    ),

    # FLUXO 5: Scheduler - Agendamento direto
    TestScenario(
        name="scheduler_direct",
        description="Lead já qualificado pronto para agendar",
        initial_agent=AgentMode.SCHEDULER,
        lead_persona=LeadPersona.HOT,
        expected_outcome="appointment_booked",
        expected_handoffs=[AgentMode.CONCIERGE],
        max_turns=6,
        success_criteria={
            "binary_options_offered": True,
            "confirmation_received": True
        },
        tags=["scheduler", "happy_path"]
    ),

    # FLUXO 6: Lead apressado
    TestScenario(
        name="social_seller_rushed_lead",
        description="Lead executiva sem tempo para enrolação",
        initial_agent=AgentMode.SOCIAL_SELLER,
        lead_persona=LeadPersona.RUSHED,
        expected_outcome="schedule",
        expected_handoffs=[AgentMode.SCHEDULER],
        max_turns=6,
        success_criteria={
            "quick_responses": True,
            "no_fluff": True
        },
        tags=["social_seller", "rushed", "quick"]
    ),

    # FLUXO 7: Objeção de preço
    TestScenario(
        name="objection_price",
        description="Lead com objeção de preço",
        initial_agent=AgentMode.SOCIAL_SELLER,
        lead_persona=LeadPersona.OBJECTION_PRICE,
        expected_outcome="objection_resolved",
        expected_handoffs=[AgentMode.OBJECTION_HANDLER],
        max_turns=12,
        success_criteria={
            "value_reframe": True,
            "payment_options_mentioned": True
        },
        tags=["objection", "price", "value"]
    ),
]


class E2ETestRunner:
    """
    Executa testes E2E completos simulando conversas reais.

    O runner:
    1. Cria um LeadSimulator com a persona do cenário
    2. Cria um FlowOrchestrator com o agente inicial
    3. Simula a conversa turno a turno
    4. Coleta métricas e valida resultado
    """

    # Prompt para o agente sendo testado
    AGENT_SYSTEM_PROMPT = """Você é {agent_name}, um agente de vendas do Instituto Amare.

## SEU MODO ATUAL: {agent_mode}

## DESCRIÇÃO DO MODO:
{mode_description}

## CONTEXTO DO NEGÓCIO:
- Clínica de medicina integrativa focada em saúde feminina
- Especialidade: Menopausa, hormônios bioidênticos, longevidade
- Ticket: Consulta R$971, tratamentos de R$5.000 a R$50.000
- Público: Mulheres 40+, alto poder aquisitivo

## SUAS RESPONSABILIDADES:
{responsibilities}

## REGRAS:
1. Seja empático e acolhedor
2. Qualifique usando BANT (Budget, Authority, Need, Timeline)
3. Nunca seja invasivo ou pushy
4. Quando identificar que deve passar para outro modo, indique claramente
5. Mantenha respostas curtas (2-4 linhas) para WhatsApp/Instagram

## CONTEXTO DA CONVERSA:
{context}

## HISTÓRICO:
{history}

Responda como o agente responderia. Se precisar fazer handoff, indique claramente para qual modo."""

    MODE_DESCRIPTIONS = {
        AgentMode.FIRST_CONTACT: {
            "description": "Primeiro contato com o lead. Foco em saudação e identificação.",
            "responsibilities": [
                "Acolher o lead de forma empática",
                "Identificar o canal de origem",
                "Fazer perguntas iniciais de qualificação",
                "Passar para SCHEDULER quando lead quiser agendar"
            ]
        },
        AgentMode.SOCIAL_SELLER: {
            "description": "Vendas via Instagram/redes sociais. Tom mais informal.",
            "responsibilities": [
                "Responder de forma informal e acolhedora",
                "Qualificar o lead sem ser invasivo",
                "Gerar interesse no tratamento",
                "Lidar com objeções básicas",
                "Passar para SCHEDULER quando lead quiser agendar",
                "Passar para OBJECTION_HANDLER quando objeção complexa"
            ]
        },
        AgentMode.SCHEDULER: {
            "description": "Responsável por encontrar horários e agendar reuniões.",
            "responsibilities": [
                "Oferecer opções binárias de horário",
                "Confirmar dados do lead",
                "Agendar a consulta",
                "Passar para CONCIERGE após agendamento"
            ]
        },
        AgentMode.OBJECTION_HANDLER: {
            "description": "Especialista em contornar objeções e negativas.",
            "responsibilities": [
                "Entender a objeção real",
                "Reframar o valor vs custo",
                "Fornecer argumentos e provas sociais",
                "Voltar para o agente anterior quando resolvido"
            ]
        },
        AgentMode.CONCIERGE: {
            "description": "Auxilia com dúvidas gerais e garante comparecimento.",
            "responsibilities": [
                "Confirmar agendamento",
                "Enviar lembretes",
                "Tirar dúvidas pré-consulta",
                "Garantir show rate"
            ]
        },
        AgentMode.CLOSER: {
            "description": "Fechamento pós-consulta.",
            "responsibilities": [
                "Fazer follow-up pós-consulta",
                "Entender objeções restantes",
                "Fechar a venda",
                "Passar para REFERRAL_GENERATOR após venda"
            ]
        },
        AgentMode.FOLLOWUPER: {
            "description": "Acompanhamento de leads que não responderam.",
            "responsibilities": [
                "Re-engajar leads frios",
                "Usar diferentes abordagens",
                "Identificar novo interesse",
                "Passar para SCHEDULER se houver interesse"
            ]
        }
    }

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.results: List[TestResult] = []

    async def run_scenario(self, scenario: TestScenario) -> TestResult:
        """Executa um cenário de teste"""

        print(f"\n{'='*60}")
        print(f"🧪 Executando: {scenario.name}")
        print(f"   Persona: {scenario.lead_persona.value}")
        print(f"   Agente inicial: {scenario.initial_agent.value}")
        print(f"{'='*60}\n")

        # Inicializar componentes
        lead_profile = get_profile(scenario.lead_persona)
        lead_simulator = LeadSimulator(lead_profile, self.api_key)
        orchestrator = FlowOrchestrator(scenario.initial_agent, self.api_key)

        result = TestResult(
            scenario=scenario,
            status=TestStatus.ERROR,
            actual_outcome=None,
            conversation=[],
            handoffs=[],
            metrics={
                "total_tokens": 0,
                "agent_tokens": 0,
                "lead_tokens": 0,
                "turns": 0
            }
        )

        try:
            # Primeira mensagem do lead
            lead_message = lead_simulator.get_initial_message()
            print(f"👤 Lead: {lead_message}")

            result.conversation.append({
                "role": "lead",
                "content": lead_message,
                "turn": 0
            })

            turn = 0
            while turn < scenario.max_turns:
                turn += 1

                # 1. Agente responde
                agent_response, agent_tokens = await self._get_agent_response(
                    orchestrator.get_current_agent(),
                    orchestrator.get_conversation_history(),
                    lead_message,
                    orchestrator.state.context
                )
                result.metrics["agent_tokens"] += agent_tokens
                result.metrics["total_tokens"] += agent_tokens

                print(f"🤖 {orchestrator.get_current_agent().value}: {agent_response}")

                result.conversation.append({
                    "role": "agent",
                    "agent": orchestrator.get_current_agent().value,
                    "content": agent_response,
                    "turn": turn
                })

                # 2. Lead responde
                lead_result = lead_simulator.respond(agent_response)
                lead_message = lead_result["message"]
                result.metrics["lead_tokens"] += lead_result["tokens_used"]
                result.metrics["total_tokens"] += lead_result["tokens_used"]

                print(f"👤 Lead: {lead_message}")

                result.conversation.append({
                    "role": "lead",
                    "content": lead_message,
                    "turn": turn
                })

                # 3. Checar se lead atingiu objetivo
                if lead_result.get("objective_reached"):
                    result.actual_outcome = lead_result["objective_reached"].lower()
                    print(f"\n✅ Objetivo atingido: {result.actual_outcome}")
                    break

                # 4. Processar turno no orquestrador
                turn_result = orchestrator.process_turn(agent_response, lead_message)

                if turn_result.get("handoff"):
                    handoff = turn_result["handoff"]
                    result.handoffs.append({
                        "from": handoff.from_agent.value,
                        "to": handoff.to_agent.value,
                        "reason": handoff.reason,
                        "turn": turn
                    })
                    print(f"\n🔄 Handoff: {handoff.from_agent.value} → {handoff.to_agent.value}")
                    print(f"   Motivo: {handoff.reason}")

                if not turn_result.get("should_continue"):
                    print(f"\n⏹️ Fluxo encerrado: {turn_result.get('reason', 'unknown')}")
                    break

            result.metrics["turns"] = turn

            # Avaliar resultado
            result.status = self._evaluate_result(scenario, result)
            result.finished_at = datetime.utcnow()

        except Exception as e:
            result.status = TestStatus.ERROR
            result.error = str(e)
            result.finished_at = datetime.utcnow()
            print(f"\n❌ Erro: {e}")

        # Resumo
        print(f"\n{'='*60}")
        print(f"📊 Resultado: {result.status.value.upper()}")
        print(f"   Turnos: {result.metrics['turns']}")
        print(f"   Tokens: {result.metrics['total_tokens']}")
        print(f"   Handoffs: {len(result.handoffs)}")
        print(f"   Outcome: {result.actual_outcome}")
        print(f"{'='*60}\n")

        self.results.append(result)
        return result

    async def _get_agent_response(
        self,
        agent_mode: AgentMode,
        history: List[Dict],
        last_message: str,
        context: Dict
    ) -> tuple[str, int]:
        """Gera resposta do agente"""

        mode_info = self.MODE_DESCRIPTIONS.get(agent_mode, {
            "description": "Agente de vendas",
            "responsibilities": ["Atender o lead"]
        })

        history_text = "\n".join([
            f"{'Agente' if m['role'] == 'agent' else 'Lead'}: {m['content']}"
            for m in history[-10:]  # Últimas 10 mensagens
        ])

        system_prompt = self.AGENT_SYSTEM_PROMPT.format(
            agent_name="Julia",
            agent_mode=agent_mode.value,
            mode_description=mode_info["description"],
            responsibilities="\n".join(f"- {r}" for r in mode_info["responsibilities"]),
            context=json.dumps(context, ensure_ascii=False, indent=2),
            history=history_text if history_text else "(início da conversa)"
        )

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            temperature=0.7,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Lead disse: {last_message}"}]
        )

        response_text = response.content[0].text
        tokens = response.usage.input_tokens + response.usage.output_tokens

        return response_text, tokens

    def _evaluate_result(self, scenario: TestScenario, result: TestResult) -> TestStatus:
        """Avalia se o teste passou ou falhou"""

        # Timeout
        if result.metrics["turns"] >= scenario.max_turns:
            return TestStatus.TIMEOUT

        # Verificar outcome
        if result.actual_outcome:
            # Mapear outcomes similares
            outcome_mapping = {
                "agendar": "schedule",
                "agendamento": "schedule",
                "marcar": "schedule",
                "desistir": "fail",
                "convencido": "objection_resolved"
            }
            normalized = outcome_mapping.get(result.actual_outcome, result.actual_outcome)

            if normalized == scenario.expected_outcome:
                return TestStatus.PASSED

            # Verificar se é outcome aceitável
            if normalized in ["schedule", "objection_resolved", "appointment_booked"]:
                return TestStatus.PASSED

        # Verificar handoffs esperados
        actual_handoffs = [h["to"] for h in result.handoffs]
        expected_handoffs = [h.value for h in scenario.expected_handoffs]

        # Se fez pelo menos os handoffs esperados
        if all(h in actual_handoffs for h in expected_handoffs):
            return TestStatus.PASSED

        return TestStatus.FAILED

    async def run_all_scenarios(self, scenarios: List[TestScenario] = None) -> List[TestResult]:
        """Executa todos os cenários de teste"""
        scenarios = scenarios or DEFAULT_TEST_SCENARIOS

        print(f"\n{'#'*60}")
        print(f"# E2E TEST SUITE - {len(scenarios)} cenários")
        print(f"{'#'*60}\n")

        for scenario in scenarios:
            await self.run_scenario(scenario)

        # Resumo final
        passed = sum(1 for r in self.results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAILED)
        timeout = sum(1 for r in self.results if r.status == TestStatus.TIMEOUT)
        error = sum(1 for r in self.results if r.status == TestStatus.ERROR)

        print(f"\n{'#'*60}")
        print(f"# RESUMO FINAL")
        print(f"{'#'*60}")
        print(f"✅ Passed:  {passed}/{len(self.results)}")
        print(f"❌ Failed:  {failed}/{len(self.results)}")
        print(f"⏱️ Timeout: {timeout}/{len(self.results)}")
        print(f"💥 Error:   {error}/{len(self.results)}")
        print(f"{'#'*60}\n")

        return self.results

    def get_summary(self) -> Dict:
        """Retorna resumo dos testes"""
        return {
            "total": len(self.results),
            "passed": sum(1 for r in self.results if r.status == TestStatus.PASSED),
            "failed": sum(1 for r in self.results if r.status == TestStatus.FAILED),
            "timeout": sum(1 for r in self.results if r.status == TestStatus.TIMEOUT),
            "error": sum(1 for r in self.results if r.status == TestStatus.ERROR),
            "total_tokens": sum(r.metrics["total_tokens"] for r in self.results),
            "avg_turns": sum(r.metrics["turns"] for r in self.results) / len(self.results) if self.results else 0
        }
