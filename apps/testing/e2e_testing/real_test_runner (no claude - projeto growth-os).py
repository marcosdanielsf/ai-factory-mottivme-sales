"""
Real E2E Test Runner - Testa agentes REAIS do Supabase
======================================================
Carrega prompts reais de cada modo e testa fluxos completos.
"""

import os
import json
import asyncio
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import anthropic

from .agent_loader import AgentLoader, RealAgent, FLOW_DEFINITIONS, get_flow_for_agent
from .lead_simulator import LeadSimulator, LeadPersona, get_profile
from .flow_orchestrator import AgentMode


class TestStatus(Enum):
    """Status do teste"""
    PASSED = "passed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    ERROR = "error"


@dataclass
class RealTestScenario:
    """Cenário de teste usando agente real"""
    name: str
    description: str
    agent_name: str  # Nome do agente no Supabase (ex: "Julia")
    agent_version: str = None  # Versão específica ou None para última ativa
    initial_mode: str = "first_contact"  # Modo inicial
    lead_persona: LeadPersona = LeadPersona.HOT
    flow_type: str = "sales_flow"  # Tipo de fluxo
    expected_outcome: str = "schedule"
    expected_mode_transitions: List[str] = field(default_factory=list)
    max_turns: int = 20
    tags: List[str] = field(default_factory=list)


@dataclass
class RealTestResult:
    """Resultado de teste com agente real"""
    scenario: RealTestScenario
    agent: RealAgent  # Agente carregado do Supabase
    status: TestStatus
    actual_outcome: Optional[str]
    conversation: List[Dict]
    mode_transitions: List[Dict]  # Transições entre modos
    modes_tested: List[str]  # Modos que foram testados
    metrics: Dict
    error: Optional[str] = None
    started_at: datetime = field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None

    def to_dict(self) -> Dict:
        return {
            "scenario_name": self.scenario.name,
            "agent_name": self.agent.agent_name,
            "agent_version": self.agent.version,
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


# Cenários de teste com agentes reais
DEFAULT_REAL_SCENARIOS = [
    # Teste 1: Julia - Lead quente via first_contact
    RealTestScenario(
        name="julia_hot_lead_full_flow",
        description="Lead quente - fluxo completo first_contact → scheduler → concierge",
        agent_name="Julia",
        initial_mode="first_contact",
        lead_persona=LeadPersona.HOT,
        flow_type="sales_flow",
        expected_outcome="schedule",
        expected_mode_transitions=["first_contact", "scheduler", "concierge"],
        max_turns=15,
        tags=["julia", "hot_lead", "full_flow"]
    ),

    # Teste 2: Julia - Lead morno que precisa qualificação
    RealTestScenario(
        name="julia_warm_lead_qualification",
        description="Lead morno - qualificação completa antes de agendamento",
        agent_name="Julia",
        initial_mode="first_contact",
        lead_persona=LeadPersona.WARM,
        flow_type="sales_flow",
        expected_outcome="schedule",
        expected_mode_transitions=["first_contact", "scheduler"],
        max_turns=20,
        tags=["julia", "warm_lead", "qualification"]
    ),

    # Teste 3: Julia - Objeção de preço
    RealTestScenario(
        name="julia_price_objection",
        description="Lead com objeção de preço - testar objection_handler",
        agent_name="Julia",
        initial_mode="first_contact",
        lead_persona=LeadPersona.OBJECTION_PRICE,
        flow_type="objection_flow",
        expected_outcome="objection_resolved",
        expected_mode_transitions=["first_contact", "objection_handler", "scheduler"],
        max_turns=18,
        tags=["julia", "objection", "price"]
    ),

    # Teste 4: Julia - Objeção marido
    RealTestScenario(
        name="julia_husband_objection",
        description="Lead que precisa falar com marido",
        agent_name="Julia",
        initial_mode="first_contact",
        lead_persona=LeadPersona.OBJECTION_HUSBAND,
        flow_type="objection_flow",
        expected_outcome="objection_resolved",
        expected_mode_transitions=["first_contact", "objection_handler"],
        max_turns=18,
        tags=["julia", "objection", "husband"]
    ),

    # Teste 5: Julia - Lead frio/cético
    RealTestScenario(
        name="julia_cold_lead",
        description="Lead cético - testar retenção e followup",
        agent_name="Julia",
        initial_mode="first_contact",
        lead_persona=LeadPersona.COLD,
        flow_type="reactivation_flow",
        expected_outcome="followup",
        expected_mode_transitions=["first_contact", "followuper"],
        max_turns=15,
        tags=["julia", "cold_lead", "retention"]
    ),

    # Teste 6: Julia - Lead apressada
    RealTestScenario(
        name="julia_rushed_executive",
        description="Executiva sem tempo - respostas diretas",
        agent_name="Julia",
        initial_mode="first_contact",
        lead_persona=LeadPersona.RUSHED,
        flow_type="sales_flow",
        expected_outcome="schedule",
        expected_mode_transitions=["first_contact", "scheduler"],
        max_turns=8,
        tags=["julia", "rushed", "quick"]
    ),

    # Teste 7: Scheduler direto
    RealTestScenario(
        name="julia_scheduler_direct",
        description="Lead já qualificada - testar scheduler isolado",
        agent_name="Julia",
        initial_mode="scheduler",
        lead_persona=LeadPersona.HOT,
        flow_type="sales_flow",
        expected_outcome="appointment_booked",
        expected_mode_transitions=["scheduler", "concierge"],
        max_turns=6,
        tags=["julia", "scheduler", "direct"]
    ),
]


class RealE2ETestRunner:
    """
    Executa testes E2E com agentes REAIS do Supabase.

    Diferente do E2ETestRunner original:
    1. Carrega agente real do Supabase
    2. Usa os prompts reais de cada modo (system_prompt + prompt_do_modo)
    3. Valida transições entre modos reais
    4. Testa o fluxo completo conforme definido no agente
    """

    # Prompt de detecção de transição de modo
    MODE_TRANSITION_PROMPT = """Analise a resposta do agente e determine se deve haver transição de modo.

## MODO ATUAL: {current_mode}

## RESPOSTA DO AGENTE:
{agent_response}

## CONTEXTO DA CONVERSA:
{context}

## MODOS DISPONÍVEIS:
{available_modes}

## INSTRUÇÕES:
Analise se o agente indicou que deve mudar de modo.
Sinais de transição incluem:
- "Vou passar você para o agendamento" → scheduler
- "Deixa eu verificar os horários" → scheduler
- "Entendo sua preocupação" + objeção forte → objection_handler
- "Vou te mandar os detalhes" → concierge
- "Vou fazer um follow-up" → followuper
- Etc.

Responda em JSON:
```json
{{
    "should_transition": true/false,
    "target_mode": "nome_do_modo" ou null,
    "reason": "motivo da transição",
    "context_to_pass": {{}}
}}
```"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.agent_loader = AgentLoader()
        self.results: List[RealTestResult] = []

    async def run_scenario(self, scenario: RealTestScenario) -> RealTestResult:
        """Executa um cenário de teste com agente real"""

        print(f"\n{'='*70}")
        print(f"🧪 TESTE: {scenario.name}")
        print(f"   Agente: {scenario.agent_name}")
        print(f"   Persona: {scenario.lead_persona.value}")
        print(f"   Modo inicial: {scenario.initial_mode}")
        print(f"   Fluxo: {scenario.flow_type}")
        print(f"{'='*70}\n")

        # 1. Carregar agente real do Supabase
        print("📥 Carregando agente do Supabase...")
        agent = self.agent_loader.load_agent(
            agent_name=scenario.agent_name,
            version=scenario.agent_version
        )

        if not agent:
            print(f"❌ Agente '{scenario.agent_name}' não encontrado!")
            return RealTestResult(
                scenario=scenario,
                agent=None,
                status=TestStatus.ERROR,
                actual_outcome=None,
                conversation=[],
                mode_transitions=[],
                modes_tested=[],
                metrics={"total_tokens": 0, "turns": 0},
                error=f"Agente '{scenario.agent_name}' não encontrado no Supabase"
            )

        print(f"✅ Agente carregado: {agent.agent_name} ({agent.version})")
        print(f"   Modos disponíveis: {agent.get_available_modes()}")

        # Verificar se modo inicial existe
        if scenario.initial_mode not in agent.get_available_modes():
            print(f"⚠️ Modo '{scenario.initial_mode}' não disponível, usando primeiro modo")
            scenario.initial_mode = agent.get_available_modes()[0]

        # 2. Inicializar componentes
        lead_profile = get_profile(scenario.lead_persona)
        lead_simulator = LeadSimulator(lead_profile, self.api_key)

        result = RealTestResult(
            scenario=scenario,
            agent=agent,
            status=TestStatus.ERROR,
            actual_outcome=None,
            conversation=[],
            mode_transitions=[],
            modes_tested=[scenario.initial_mode],
            metrics={
                "total_tokens": 0,
                "agent_tokens": 0,
                "lead_tokens": 0,
                "turns": 0
            }
        )

        current_mode = scenario.initial_mode
        context = {
            "lead_info": {},
            "qualification": {},
            "objections": []
        }

        try:
            # 3. Primeira mensagem do lead
            lead_message = lead_simulator.get_initial_message()
            print(f"\n👤 Lead: {lead_message}")

            result.conversation.append({
                "role": "lead",
                "content": lead_message,
                "turn": 0
            })

            turn = 0
            while turn < scenario.max_turns:
                turn += 1

                # 4. Agente responde usando prompt REAL
                agent_response, agent_tokens = await self._get_real_agent_response(
                    agent=agent,
                    mode=current_mode,
                    history=result.conversation,
                    last_message=lead_message,
                    context=context
                )
                result.metrics["agent_tokens"] += agent_tokens
                result.metrics["total_tokens"] += agent_tokens

                print(f"\n🤖 [{current_mode.upper()}]: {agent_response}")

                result.conversation.append({
                    "role": "agent",
                    "mode": current_mode,
                    "content": agent_response,
                    "turn": turn
                })

                # 5. Detectar transição de modo
                transition = await self._detect_mode_transition(
                    current_mode=current_mode,
                    agent_response=agent_response,
                    available_modes=agent.get_available_modes(),
                    context=context
                )

                if transition and transition.get("should_transition"):
                    target_mode = transition.get("target_mode")
                    if target_mode and target_mode in agent.get_available_modes():
                        result.mode_transitions.append({
                            "from": current_mode,
                            "to": target_mode,
                            "reason": transition.get("reason", ""),
                            "turn": turn
                        })
                        print(f"\n🔄 TRANSIÇÃO: {current_mode} → {target_mode}")
                        print(f"   Motivo: {transition.get('reason', '')}")

                        current_mode = target_mode
                        if target_mode not in result.modes_tested:
                            result.modes_tested.append(target_mode)

                        # Atualizar contexto
                        if transition.get("context_to_pass"):
                            context.update(transition["context_to_pass"])

                # 6. Lead responde
                lead_result = lead_simulator.respond(agent_response)
                lead_message = lead_result["message"]
                result.metrics["lead_tokens"] += lead_result["tokens_used"]
                result.metrics["total_tokens"] += lead_result["tokens_used"]

                print(f"\n👤 Lead: {lead_message}")

                result.conversation.append({
                    "role": "lead",
                    "content": lead_message,
                    "turn": turn
                })

                # 7. Checar se objetivo foi atingido
                if lead_result.get("objective_reached"):
                    result.actual_outcome = lead_result["objective_reached"].lower()
                    print(f"\n✅ OBJETIVO ATINGIDO: {result.actual_outcome}")
                    break

                # 8. Checar sinais de fim de conversa
                if self._is_conversation_ended(lead_message, agent_response):
                    result.actual_outcome = "conversation_ended"
                    break

            result.metrics["turns"] = turn

            # 9. Avaliar resultado
            result.status = self._evaluate_result(scenario, result)
            result.finished_at = datetime.utcnow()

        except Exception as e:
            result.status = TestStatus.ERROR
            result.error = str(e)
            result.finished_at = datetime.utcnow()
            print(f"\n❌ ERRO: {e}")
            import traceback
            traceback.print_exc()

        # Resumo
        print(f"\n{'='*70}")
        print(f"📊 RESULTADO: {result.status.value.upper()}")
        print(f"   Turnos: {result.metrics['turns']}")
        print(f"   Tokens: {result.metrics['total_tokens']}")
        print(f"   Modos testados: {result.modes_tested}")
        print(f"   Transições: {len(result.mode_transitions)}")
        print(f"   Outcome: {result.actual_outcome}")
        print(f"{'='*70}\n")

        self.results.append(result)
        return result

    async def _get_real_agent_response(
        self,
        agent: RealAgent,
        mode: str,
        history: List[Dict],
        last_message: str,
        context: Dict
    ) -> tuple[str, int]:
        """Gera resposta usando o prompt REAL do agente"""

        # Pegar prompt completo (system_prompt + prompt do modo)
        full_prompt = agent.get_full_prompt(mode)

        # Adicionar contexto dinâmico
        history_text = "\n".join([
            f"{'Agente' if m['role'] == 'agent' else 'Lead'}: {m['content']}"
            for m in history[-10:]
        ])

        system_with_context = f"""{full_prompt}

### CONTEXTO ATUAL ###
{json.dumps(context, ensure_ascii=False, indent=2)}

### HISTÓRICO RECENTE ###
{history_text if history_text else "(início da conversa)"}

### REGRAS ADICIONAIS ###
- Responda de forma natural e conversacional
- Mantenha respostas curtas (2-4 linhas) apropriadas para WhatsApp/Instagram
- Use emojis com moderação
- Quando identificar que deve passar para outro modo, indique naturalmente na conversa
"""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            temperature=0.7,
            system=system_with_context,
            messages=[{"role": "user", "content": f"Lead disse: {last_message}"}]
        )

        response_text = response.content[0].text
        tokens = response.usage.input_tokens + response.usage.output_tokens

        return response_text, tokens

    async def _detect_mode_transition(
        self,
        current_mode: str,
        agent_response: str,
        available_modes: List[str],
        context: Dict
    ) -> Optional[Dict]:
        """Detecta se deve haver transição de modo"""

        prompt = self.MODE_TRANSITION_PROMPT.format(
            current_mode=current_mode,
            agent_response=agent_response,
            context=json.dumps(context, ensure_ascii=False, indent=2),
            available_modes=", ".join(available_modes)
        )

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = response.content[0].text

        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                return json.loads(response_text[json_start:json_end])
        except:
            pass

        return None

    def _is_conversation_ended(self, lead_message: str, agent_response: str) -> bool:
        """Detecta sinais de fim de conversa"""
        end_signals = [
            "tchau", "obrigada", "até logo", "até mais",
            "vou pensar", "não tenho interesse", "não quero"
        ]
        lead_lower = lead_message.lower()
        return any(signal in lead_lower for signal in end_signals)

    def _evaluate_result(
        self,
        scenario: RealTestScenario,
        result: RealTestResult
    ) -> TestStatus:
        """Avalia se o teste passou ou falhou"""

        # Timeout
        if result.metrics["turns"] >= scenario.max_turns:
            return TestStatus.TIMEOUT

        # Verificar outcome
        if result.actual_outcome:
            outcome_mapping = {
                "agendar": "schedule",
                "agendamento": "schedule",
                "marcar": "schedule",
                "agendou": "schedule",
                "convencido": "objection_resolved",
                "resolvido": "objection_resolved",
                "satisfeito": "objection_resolved"
            }
            normalized = outcome_mapping.get(
                result.actual_outcome,
                result.actual_outcome
            )

            if normalized == scenario.expected_outcome:
                return TestStatus.PASSED

            # Outcomes aceitáveis
            acceptable = ["schedule", "objection_resolved", "appointment_booked"]
            if normalized in acceptable:
                return TestStatus.PASSED

        # Verificar transições de modo
        actual_transitions = [t["to"] for t in result.mode_transitions]
        actual_transitions.insert(0, scenario.initial_mode)

        expected = scenario.expected_mode_transitions
        if expected:
            # Verificar se passou pelos modos esperados (ordem não precisa ser exata)
            if all(mode in actual_transitions for mode in expected):
                return TestStatus.PASSED

        return TestStatus.FAILED

    async def run_all_scenarios(
        self,
        scenarios: List[RealTestScenario] = None
    ) -> List[RealTestResult]:
        """Executa todos os cenários de teste"""

        scenarios = scenarios or DEFAULT_REAL_SCENARIOS

        print(f"\n{'#'*70}")
        print(f"# E2E TEST SUITE COM AGENTES REAIS - {len(scenarios)} cenários")
        print(f"{'#'*70}\n")

        # Listar agentes disponíveis
        print("📋 Agentes disponíveis no Supabase:")
        available = self.agent_loader.list_available_agents()
        for ag in available:
            print(f"   • {ag['agent_name']} ({ag['version']}) - Modos: {ag['modes']}")
        print()

        for scenario in scenarios:
            await self.run_scenario(scenario)

        # Resumo final
        passed = sum(1 for r in self.results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAILED)
        timeout = sum(1 for r in self.results if r.status == TestStatus.TIMEOUT)
        error = sum(1 for r in self.results if r.status == TestStatus.ERROR)

        print(f"\n{'#'*70}")
        print(f"# RESUMO FINAL - TESTES COM AGENTES REAIS")
        print(f"{'#'*70}")
        print(f"✅ Passed:  {passed}/{len(self.results)}")
        print(f"❌ Failed:  {failed}/{len(self.results)}")
        print(f"⏱️ Timeout: {timeout}/{len(self.results)}")
        print(f"💥 Error:   {error}/{len(self.results)}")
        print(f"{'#'*70}\n")

        return self.results

    def get_summary(self) -> Dict:
        """Retorna resumo dos testes"""
        if not self.results:
            return {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "timeout": 0,
                "error": 0,
                "total_tokens": 0,
                "avg_turns": 0,
                "modes_coverage": []
            }

        # Cobertura de modos
        all_modes_tested = set()
        for r in self.results:
            all_modes_tested.update(r.modes_tested)

        return {
            "total": len(self.results),
            "passed": sum(1 for r in self.results if r.status == TestStatus.PASSED),
            "failed": sum(1 for r in self.results if r.status == TestStatus.FAILED),
            "timeout": sum(1 for r in self.results if r.status == TestStatus.TIMEOUT),
            "error": sum(1 for r in self.results if r.status == TestStatus.ERROR),
            "total_tokens": sum(r.metrics["total_tokens"] for r in self.results),
            "avg_turns": sum(r.metrics["turns"] for r in self.results) / len(self.results),
            "modes_coverage": list(all_modes_tested)
        }
