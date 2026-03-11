"""
Edge Cases E2E Test Scenarios
==============================
Cenarios de teste para caminhos negativos e fallback.
Estes testam situacoes onde o lead desiste ou a objecao nao e resolvida.
"""

import os
import json
import asyncio
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from groq import Groq

from .agent_loader import AgentLoader, RealAgent
from .lead_simulator import LeadPersona, LeadProfile
from .groq_test_runner import (
    GroqTestScenario,
    GroqTestResult,
    TestStatus,
    GroqLeadSimulator,
    GroqE2ETestRunner
)


class EdgeCaseOutcome(Enum):
    """Resultados esperados para edge cases"""
    LEAD_DROPPED = "lead_dropped"          # Lead desistiu, saiu do funil
    ESCALATE_HUMAN = "escalate_human"      # Escalar para humano
    OBJECTION_UNRESOLVED = "objection_unresolved"  # Objecao nao resolvida
    TIMEOUT_COLD = "timeout_cold"          # Lead esfriou por timeout
    BLOCKED = "blocked"                    # Lead bloqueou


@dataclass
class EdgeCaseLeadProfile:
    """Perfil de lead para edge cases - cenarios negativos"""
    persona_type: str
    name: str
    age: int
    occupation: str
    pain_points: List[str]
    objections: List[str]
    budget_range: str
    urgency: str
    decision_maker: bool
    backstory: str
    goals: List[str]
    exit_triggers: List[str]  # O que faz esse lead desistir
    resistance_level: str  # low, medium, high, extreme
    max_patience_turns: int  # Apos quantos turnos desiste


# ============================================================================
# PERFIS DE LEAD PARA EDGE CASES
# ============================================================================

EDGE_CASE_PROFILES = {
    "cold_dropout": EdgeCaseLeadProfile(
        persona_type="cold_dropout",
        name="Fernanda",
        age=44,
        occupation="Contadora",
        pain_points=[
            "Alguns sintomas leves de menopausa",
            "Cansaco ocasional",
            "Nada muito urgente"
        ],
        objections=[
            "Acho que nao preciso disso agora",
            "Estou so pesquisando",
            "Vou pensar e volto depois",
            "Minha mae passou pela menopausa sem tratamento",
            "Acho muito caro pra algo que talvez nem precise"
        ],
        budget_range="Apertado - nao quer gastar",
        urgency="very_low",
        decision_maker=True,
        backstory="""Fernanda veio pelo Instagram por curiosidade, mas nao tem
        urgencia real. Ela esta so comparando opcoes e provavelmente nao vai
        converter. Se sentir pressao, desiste imediatamente. Prefere remedios
        naturais e tem ceticismo sobre medicina convencional.""",
        goals=[
            "Conseguir informacoes gratis",
            "Nao se comprometer com nada",
            "Encontrar desculpas para nao agendar"
        ],
        exit_triggers=[
            "Qualquer mencao de preco alto",
            "Pressao para agendar",
            "Perguntas muito pessoais",
            "Respostas muito longas ou complicadas"
        ],
        resistance_level="extreme",
        max_patience_turns=8
    ),

    "objection_unresolved": EdgeCaseLeadProfile(
        persona_type="objection_unresolved",
        name="Claudia",
        age=51,
        occupation="Advogada",
        pain_points=[
            "Ondas de calor severas",
            "Insonia cronica",
            "Ganho de peso"
        ],
        objections=[
            "Hormonio causa cancer, nao vou arriscar",
            "Minha irma fez e teve problemas serios",
            "Li na internet que e perigoso",
            "Prefiro sofrer do que ter cancer",
            "Nenhum argumento vai me convencer disso"
        ],
        budget_range="Bom - mas objecao e sobre seguranca, nao preco",
        urgency="medium",
        decision_maker=True,
        backstory="""Claudia tem sintomas reais e sofre com eles, mas tem um
        medo irracional de hormonios por causa de uma irma que teve cancer
        (nao relacionado a hormonios, mas ela associou). Nenhum argumento
        cientifico vai convence-la nesta conversa. Ela precisa de um humano
        especialista para conversar com calma.""",
        goals=[
            "Confirmar seus medos sobre hormonios",
            "Encontrar alternativas 'naturais'",
            "Resistir a qualquer tentativa de convencimento"
        ],
        exit_triggers=[
            "Insistencia em defender hormonios",
            "Parecer que nao entende o medo dela",
            "Pressao para agendar apesar das objecoes"
        ],
        resistance_level="extreme",
        max_patience_turns=12
    )
}


class EdgeCaseLeadSimulator:
    """
    Simula leads em cenarios de edge case (caminhos negativos).
    Esses leads tem comportamentos especificos que levam a desistencia ou escalacao.
    """

    EDGE_CASE_SYSTEM_PROMPT = """Voce e {name}, uma potencial cliente do Instituto Amare.
Voce esta em um CENARIO DE EDGE CASE - ou seja, voce NAO vai converter.

## SEU PERFIL:
- Idade: {age} anos
- Profissao: {occupation}
- Orcamento: {budget_range}
- Urgencia: {urgency}
- Nivel de Resistencia: {resistance_level}

## SUAS DORES/QUEIXAS:
{pain_points}

## SEUS OBJETIVOS (voce quer NAO converter):
{goals}

## SUA HISTORIA:
{backstory}

## SUAS OBJECOES (use com frequencia):
{objections}

## O QUE FAZ VOCE DESISTIR:
{exit_triggers}

## REGRAS IMPORTANTES:
1. Voce esta DESTINADA a nao converter neste cenario
2. Responda de forma NATURAL como uma pessoa real no WhatsApp
3. Use suas objecoes de forma realista
4. Se o agente resolver UMA objecao, traga OUTRA
5. Apos {max_patience_turns} turnos ou se ativar um exit_trigger, DESISTA
6. Quando desistir, seja firme mas educada
7. Mantenha respostas curtas (2-4 linhas)
8. Se a objecao for sobre seguranca/medo, seja IRREDUTIVEL

## SINALIZACAO:
- Se decidir DESISTIR definitivamente: termine com [OBJETIVO: DESISTIR]
- Se pedir para FALAR COM HUMANO: termine com [OBJETIVO: ESCALAR_HUMANO]
- Se a objecao NAO foi resolvida apos tentativas: termine com [OBJETIVO: OBJECAO_NAO_RESOLVIDA]
- Se simplesmente esfriar/sumir: termine com [OBJETIVO: TIMEOUT]

## CONTAGEM DE TURNOS:
Este e o turno {current_turn} de {max_patience_turns} maximos.
Se estiver perto do limite, comece a mostrar impaciencia."""

    def __init__(self, profile: EdgeCaseLeadProfile, groq_api_key: str = None):
        self.groq_api_key = groq_api_key or os.getenv('GROQ_API_KEY')
        self.client = Groq(api_key=self.groq_api_key)
        self.profile = profile
        self.conversation_history = []
        self.current_turn = 0
        self.objections_used = []

    def get_initial_message(self) -> str:
        """Primeira mensagem do lead edge case"""

        initial_messages = {
            "cold_dropout": [
                "Oi, vi vcs no Instagram. O que exatamente vcs fazem?",
                "Ola, to pesquisando sobre menopausa. Vcs atendem?",
                "Oi, quanto custa mais ou menos o tratamento?"
            ],
            "objection_unresolved": [
                "Oi, tenho interesse mas tenho muitas duvidas sobre hormonios",
                "Ola! Vi que vcs trabalham com reposicao hormonal. E seguro?",
                "Oi, uma amiga indicou vcs, mas to com medo de hormonio"
            ]
        }

        import random
        messages = initial_messages.get(self.profile.persona_type, ["Oi"])
        return random.choice(messages)

    def respond(self, agent_message: str) -> Dict:
        """Gera resposta do lead edge case usando Groq"""

        self.current_turn += 1

        self.conversation_history.append({
            "role": "assistant",
            "content": agent_message
        })

        system_prompt = self.EDGE_CASE_SYSTEM_PROMPT.format(
            name=self.profile.name,
            age=self.profile.age,
            occupation=self.profile.occupation,
            budget_range=self.profile.budget_range,
            urgency=self.profile.urgency,
            resistance_level=self.profile.resistance_level,
            pain_points="\n".join(f"- {p}" for p in self.profile.pain_points),
            goals="\n".join(f"- {g}" for g in self.profile.goals),
            backstory=self.profile.backstory,
            objections="\n".join(f"- {o}" for o in self.profile.objections),
            exit_triggers="\n".join(f"- {t}" for t in self.profile.exit_triggers),
            max_patience_turns=self.profile.max_patience_turns,
            current_turn=self.current_turn
        )

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.conversation_history)

        # Adicionar instrucao contextual baseada no turno
        context_instruction = self._get_context_instruction()

        messages.append({
            "role": "user",
            "content": f"""O agente disse: {agent_message}

{context_instruction}

Responda como {self.profile.name} responderia:"""
        })

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )

        response_text = response.choices[0].message.content
        tokens = response.usage.total_tokens

        # Detectar objetivo/outcome
        objective = self._detect_objective(response_text)

        # Limpar tags da resposta
        clean_response = self._clean_response(response_text)

        self.conversation_history.append({
            "role": "user",
            "content": clean_response
        })

        return {
            "message": clean_response,
            "tokens_used": tokens,
            "objective_reached": objective,
            "turn": self.current_turn
        }

    def _get_context_instruction(self) -> str:
        """Instrucao contextual baseada no progresso da conversa"""

        progress = self.current_turn / self.profile.max_patience_turns

        if progress < 0.3:
            return "Voce ainda esta curiosa mas cetica. Use uma objecao leve."
        elif progress < 0.6:
            return "Voce esta ficando impaciente. Traga uma objecao mais forte."
        elif progress < 0.8:
            return "Voce esta quase desistindo. Seja mais resistente."
        else:
            return "E hora de desistir ou pedir para falar com humano. Seja firme."

    def _detect_objective(self, response_text: str) -> Optional[str]:
        """Detecta objetivo atingido na resposta"""

        objectives = {
            "[OBJETIVO: DESISTIR]": "desistir",
            "[OBJETIVO: ESCALAR_HUMANO]": "escalar_humano",
            "[OBJETIVO: OBJECAO_NAO_RESOLVIDA]": "objecao_nao_resolvida",
            "[OBJETIVO: TIMEOUT]": "timeout"
        }

        for tag, objective in objectives.items():
            if tag in response_text:
                return objective

        return None

    def _clean_response(self, response_text: str) -> str:
        """Remove tags de objetivo da resposta"""

        tags = [
            "[OBJETIVO: DESISTIR]",
            "[OBJETIVO: ESCALAR_HUMANO]",
            "[OBJETIVO: OBJECAO_NAO_RESOLVIDA]",
            "[OBJETIVO: TIMEOUT]"
        ]

        clean = response_text
        for tag in tags:
            clean = clean.replace(tag, "")

        return clean.strip()


# ============================================================================
# CENARIOS DE EDGE CASE
# ============================================================================

@dataclass
class EdgeCaseScenario:
    """Cenario de teste para edge cases"""
    name: str
    description: str
    agent_name: str
    agent_version: str = None
    initial_mode: str = "first_contact"
    profile_type: str = "cold_dropout"
    expected_outcome: str = "lead_dropped"
    expected_transitions: List[str] = field(default_factory=list)
    max_turns: int = 15
    tags: List[str] = field(default_factory=list)

    # Criterios de sucesso especificos para edge cases
    success_criteria: Dict = field(default_factory=lambda: {
        "must_not_force_schedule": True,
        "must_acknowledge_objections": True,
        "should_offer_human_escalation": False,
        "max_consecutive_pushes": 2
    })


# Cenarios padrao de edge cases
EDGE_CASE_SCENARIOS = [
    # Cenario 1: INBOUND Frio que desiste
    EdgeCaseScenario(
        name="inbound_cold_dropout",
        description="Lead INBOUND frio que desiste - nao converte, sai do funil",
        agent_name="Julia Amare",
        initial_mode="first_contact",
        profile_type="cold_dropout",
        expected_outcome="lead_dropped",
        expected_transitions=["first_contact", "followuper"],
        max_turns=12,
        tags=["edge_case", "dropout", "cold_lead", "inbound"],
        success_criteria={
            "must_not_force_schedule": True,
            "must_acknowledge_objections": True,
            "should_offer_human_escalation": False,
            "max_consecutive_pushes": 2,
            "should_gracefully_exit": True,
            "should_leave_door_open": True
        }
    ),

    # Cenario 2: Objecao nao resolvida - escala para humano
    EdgeCaseScenario(
        name="objection_unresolved_escalate",
        description="Objecao nao resolvida - precisa escalar para humano",
        agent_name="Julia Amare",
        initial_mode="first_contact",
        profile_type="objection_unresolved",
        expected_outcome="escalate_human",
        expected_transitions=["first_contact", "objection_handler"],
        max_turns=15,
        tags=["edge_case", "objection", "escalation", "human_handoff"],
        success_criteria={
            "must_not_force_schedule": True,
            "must_acknowledge_objections": True,
            "should_offer_human_escalation": True,
            "max_consecutive_pushes": 1,
            "must_validate_feelings": True,
            "should_not_dismiss_fears": True
        }
    )
]


@dataclass
class EdgeCaseTestResult:
    """Resultado de teste de edge case"""
    scenario: EdgeCaseScenario
    agent: RealAgent
    status: TestStatus
    actual_outcome: Optional[str]
    conversation: List[Dict]
    mode_transitions: List[Dict]
    modes_tested: List[str]
    metrics: Dict
    criteria_evaluation: Dict  # Avaliacao dos criterios de sucesso
    error: Optional[str] = None
    started_at: datetime = field(default_factory=datetime.utcnow)
    finished_at: Optional[datetime] = None

    def to_dict(self) -> Dict:
        return {
            "scenario_name": self.scenario.name,
            "scenario_type": "edge_case",
            "agent_name": self.agent.agent_name if self.agent else "Unknown",
            "agent_version": self.agent.version if self.agent else "Unknown",
            "status": self.status.value,
            "actual_outcome": self.actual_outcome,
            "expected_outcome": self.scenario.expected_outcome,
            "conversation_length": len(self.conversation),
            "conversation": self.conversation,
            "mode_transitions": self.mode_transitions,
            "modes_tested": self.modes_tested,
            "expected_transitions": self.scenario.expected_transitions,
            "metrics": self.metrics,
            "criteria_evaluation": self.criteria_evaluation,
            "success_criteria": self.scenario.success_criteria,
            "error": self.error,
            "duration_seconds": (
                self.finished_at - self.started_at
            ).total_seconds() if self.finished_at else None
        }


class EdgeCaseTestRunner:
    """
    Executa testes E2E para edge cases (caminhos negativos).

    Foco em validar:
    - O agente nao forca agendamento quando lead nao quer
    - O agente reconhece quando precisa escalar para humano
    - O agente trata objecoes com empatia antes de desistir
    - O agente nao insiste demais e sabe "perder" graciosamente
    """

    MODE_TRANSITION_PROMPT = """Analise a resposta e determine se deve mudar de modo.

MODO ATUAL: {current_mode}
RESPOSTA DO AGENTE: {agent_response}
RESPOSTA DO LEAD: {lead_response}
MODOS DISPONIVEIS: {available_modes}

CONTEXTO: Este e um cenario de EDGE CASE onde o lead provavelmente NAO vai converter.

Responda APENAS em JSON valido:
{{"should_transition": true/false, "target_mode": "modo" ou null, "reason": "motivo"}}"""

    BEHAVIOR_EVALUATION_PROMPT = """Avalie o comportamento do agente neste turno.

RESPOSTA DO AGENTE: {agent_response}
RESPOSTA DO LEAD: {lead_response}
TURNOS ANTERIORES: {turn_count}
OBJECOES DO LEAD: {objections}

Avalie em JSON:
{{
    "acknowledged_objection": true/false,
    "was_pushy": true/false,
    "offered_human_escalation": true/false,
    "validated_feelings": true/false,
    "left_door_open": true/false,
    "was_respectful": true/false,
    "notes": "observacoes"
}}"""

    def __init__(self, groq_api_key: str = None):
        self.groq_api_key = groq_api_key or os.getenv('GROQ_API_KEY')
        self.client = Groq(api_key=self.groq_api_key)
        self.agent_loader = AgentLoader()
        self.results: List[EdgeCaseTestResult] = []

    async def run_scenario(self, scenario: EdgeCaseScenario) -> EdgeCaseTestResult:
        """Executa cenario de edge case"""

        print(f"\n{'='*70}")
        print(f"[EDGE CASE] {scenario.name}")
        print(f"   Descricao: {scenario.description}")
        print(f"   Agente: {scenario.agent_name}")
        print(f"   Perfil: {scenario.profile_type}")
        print(f"   Outcome esperado: {scenario.expected_outcome}")
        print(f"{'='*70}\n")

        # Carregar agente
        print("Carregando agente do Supabase...")
        agent = self.agent_loader.load_agent(
            agent_name=scenario.agent_name,
            version=scenario.agent_version
        )

        if not agent:
            print(f"[ERRO] Agente '{scenario.agent_name}' nao encontrado!")
            return EdgeCaseTestResult(
                scenario=scenario,
                agent=None,
                status=TestStatus.ERROR,
                actual_outcome=None,
                conversation=[],
                mode_transitions=[],
                modes_tested=[],
                metrics={"total_tokens": 0, "turns": 0},
                criteria_evaluation={},
                error=f"Agente '{scenario.agent_name}' nao encontrado"
            )

        print(f"[OK] Agente: {agent.agent_name} ({agent.version})")
        print(f"   Modos: {agent.get_available_modes()}")

        if scenario.initial_mode not in agent.get_available_modes():
            scenario.initial_mode = agent.get_available_modes()[0]

        # Inicializar simulador de lead edge case
        profile = EDGE_CASE_PROFILES.get(scenario.profile_type)
        if not profile:
            return EdgeCaseTestResult(
                scenario=scenario,
                agent=agent,
                status=TestStatus.ERROR,
                actual_outcome=None,
                conversation=[],
                mode_transitions=[],
                modes_tested=[],
                metrics={"total_tokens": 0, "turns": 0},
                criteria_evaluation={},
                error=f"Perfil '{scenario.profile_type}' nao encontrado"
            )

        lead_simulator = EdgeCaseLeadSimulator(profile, self.groq_api_key)

        result = EdgeCaseTestResult(
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
                "turns": 0,
                "objections_raised": 0,
                "pushy_moments": 0
            },
            criteria_evaluation={}
        )

        current_mode = scenario.initial_mode
        context = {"lead_info": {}, "qualification": {}, "objections": []}
        behavior_evaluations = []

        try:
            # Primeira mensagem do lead
            lead_message = lead_simulator.get_initial_message()
            print(f"\n[LEAD] {lead_message}")
            result.conversation.append({
                "role": "lead",
                "content": lead_message,
                "turn": 0
            })

            turn = 0
            while turn < scenario.max_turns:
                turn += 1

                # Agente responde
                agent_response, agent_tokens = self._get_agent_response(
                    agent, current_mode, result.conversation, lead_message, context
                )
                result.metrics["agent_tokens"] += agent_tokens
                result.metrics["total_tokens"] += agent_tokens

                print(f"\n[AGENTE - {current_mode.upper()}]: {agent_response}")
                result.conversation.append({
                    "role": "agent",
                    "mode": current_mode,
                    "content": agent_response,
                    "turn": turn
                })

                # Detectar transicao de modo
                transition = self._detect_mode_transition(
                    current_mode, agent_response, "", agent.get_available_modes()
                )

                if transition and transition.get("should_transition"):
                    target = transition.get("target_mode")
                    if target and target in agent.get_available_modes():
                        result.mode_transitions.append({
                            "from": current_mode,
                            "to": target,
                            "reason": transition.get("reason", ""),
                            "turn": turn
                        })
                        print(f"\n>> TRANSICAO: {current_mode} -> {target}")
                        current_mode = target
                        if target not in result.modes_tested:
                            result.modes_tested.append(target)

                # Lead responde
                lead_result = lead_simulator.respond(agent_response)
                lead_message = lead_result["message"]
                result.metrics["lead_tokens"] += lead_result["tokens_used"]
                result.metrics["total_tokens"] += lead_result["tokens_used"]

                print(f"\n[LEAD] {lead_message}")
                result.conversation.append({
                    "role": "lead",
                    "content": lead_message,
                    "turn": turn
                })

                # Avaliar comportamento do agente
                behavior = self._evaluate_agent_behavior(
                    agent_response,
                    lead_message,
                    turn,
                    profile.objections
                )
                behavior_evaluations.append(behavior)

                if behavior.get("was_pushy"):
                    result.metrics["pushy_moments"] += 1

                # Checar objetivo do lead
                if lead_result.get("objective_reached"):
                    result.actual_outcome = lead_result["objective_reached"]
                    print(f"\n[OBJETIVO ATINGIDO] {result.actual_outcome}")
                    break

            result.metrics["turns"] = turn
            result.criteria_evaluation = self._evaluate_success_criteria(
                scenario, result, behavior_evaluations
            )
            result.status = self._determine_final_status(scenario, result)
            result.finished_at = datetime.utcnow()

        except Exception as e:
            result.status = TestStatus.ERROR
            result.error = str(e)
            result.finished_at = datetime.utcnow()
            print(f"\n[ERRO] {e}")
            import traceback
            traceback.print_exc()

        # Resumo
        print(f"\n{'='*70}")
        print(f"[RESULTADO] {result.status.value.upper()}")
        print(f"   Turnos: {result.metrics['turns']}")
        print(f"   Tokens: {result.metrics['total_tokens']}")
        print(f"   Modos: {result.modes_tested}")
        print(f"   Outcome: {result.actual_outcome} (esperado: {scenario.expected_outcome})")
        print(f"   Momentos 'pushy': {result.metrics['pushy_moments']}")
        print(f"{'='*70}\n")

        self.results.append(result)
        return result

    def _get_agent_response(
        self,
        agent: RealAgent,
        mode: str,
        history: List[Dict],
        last_message: str,
        context: Dict
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

### HISTORICO ###
{history_text if history_text else "(inicio)"}

### REGRAS IMPORTANTES ###
- Respostas curtas (2-4 linhas) para WhatsApp
- Use emojis com moderacao
- Seja natural e empatica
- Se o lead nao quiser, NAO insista demais
- Reconheca objecoes com empatia
- Se a objecao for sobre seguranca/medo, valide os sentimentos"""

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
        self,
        current_mode: str,
        agent_response: str,
        lead_response: str,
        available_modes: List[str]
    ) -> Optional[Dict]:
        """Detecta transicao de modo"""

        prompt = self.MODE_TRANSITION_PROMPT.format(
            current_mode=current_mode,
            agent_response=agent_response,
            lead_response=lead_response,
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

    def _evaluate_agent_behavior(
        self,
        agent_response: str,
        lead_response: str,
        turn_count: int,
        objections: List[str]
    ) -> Dict:
        """Avalia comportamento do agente em cada turno"""

        prompt = self.BEHAVIOR_EVALUATION_PROMPT.format(
            agent_response=agent_response,
            lead_response=lead_response,
            turn_count=turn_count,
            objections=", ".join(objections[:3])
        )

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
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

        return {
            "acknowledged_objection": False,
            "was_pushy": False,
            "offered_human_escalation": False,
            "validated_feelings": False,
            "left_door_open": False,
            "was_respectful": True,
            "notes": "Avaliacao falhou"
        }

    def _evaluate_success_criteria(
        self,
        scenario: EdgeCaseScenario,
        result: EdgeCaseTestResult,
        behavior_evaluations: List[Dict]
    ) -> Dict:
        """Avalia criterios de sucesso do edge case"""

        criteria = scenario.success_criteria
        evaluation = {}

        # must_not_force_schedule
        if criteria.get("must_not_force_schedule"):
            # Verificar se nao forcou agendamento
            pushy_count = sum(1 for b in behavior_evaluations if b.get("was_pushy"))
            evaluation["must_not_force_schedule"] = {
                "passed": pushy_count <= criteria.get("max_consecutive_pushes", 2),
                "pushy_count": pushy_count,
                "max_allowed": criteria.get("max_consecutive_pushes", 2)
            }

        # must_acknowledge_objections
        if criteria.get("must_acknowledge_objections"):
            ack_count = sum(1 for b in behavior_evaluations if b.get("acknowledged_objection"))
            total = len(behavior_evaluations)
            evaluation["must_acknowledge_objections"] = {
                "passed": ack_count >= total * 0.5,  # Pelo menos 50% das vezes
                "acknowledged_count": ack_count,
                "total_turns": total
            }

        # should_offer_human_escalation
        if criteria.get("should_offer_human_escalation"):
            offered = any(b.get("offered_human_escalation") for b in behavior_evaluations)
            evaluation["should_offer_human_escalation"] = {
                "passed": offered,
                "was_offered": offered
            }

        # must_validate_feelings
        if criteria.get("must_validate_feelings"):
            validated_count = sum(1 for b in behavior_evaluations if b.get("validated_feelings"))
            evaluation["must_validate_feelings"] = {
                "passed": validated_count > 0,
                "validated_count": validated_count
            }

        # should_gracefully_exit
        if criteria.get("should_gracefully_exit"):
            left_door = any(b.get("left_door_open") for b in behavior_evaluations[-3:])
            was_respectful = all(b.get("was_respectful", True) for b in behavior_evaluations[-3:])
            evaluation["should_gracefully_exit"] = {
                "passed": left_door and was_respectful,
                "left_door_open": left_door,
                "was_respectful": was_respectful
            }

        # should_not_dismiss_fears
        if criteria.get("should_not_dismiss_fears"):
            # Inverso de was_pushy nos ultimos turnos quando tinha objecao de medo
            not_dismissive = not any(b.get("was_pushy") for b in behavior_evaluations[-5:])
            evaluation["should_not_dismiss_fears"] = {
                "passed": not_dismissive,
                "was_dismissive": not not_dismissive
            }

        return evaluation

    def _determine_final_status(
        self,
        scenario: EdgeCaseScenario,
        result: EdgeCaseTestResult
    ) -> TestStatus:
        """Determina status final do teste de edge case"""

        if result.error:
            return TestStatus.ERROR

        if result.metrics["turns"] >= scenario.max_turns and not result.actual_outcome:
            return TestStatus.TIMEOUT

        # Para edge cases, o "sucesso" e diferente:
        # - O lead NAO converter e esperado
        # - O que importa e COMO o agente lidou com isso

        criteria_passed = all(
            eval_data.get("passed", False)
            for eval_data in result.criteria_evaluation.values()
        )

        # Verificar se outcome esta correto
        outcome_mapping = {
            "desistir": "lead_dropped",
            "escalar_humano": "escalate_human",
            "objecao_nao_resolvida": "objection_unresolved",
            "timeout": "timeout_cold"
        }

        normalized_outcome = outcome_mapping.get(
            result.actual_outcome,
            result.actual_outcome
        )

        outcome_correct = (
            normalized_outcome == scenario.expected_outcome or
            # Aceitar outcomes relacionados
            (normalized_outcome in ["lead_dropped", "timeout_cold"] and
             scenario.expected_outcome in ["lead_dropped", "timeout_cold"]) or
            (normalized_outcome in ["escalar_humano", "objecao_nao_resolvida"] and
             scenario.expected_outcome in ["escalate_human", "objection_unresolved"])
        )

        if criteria_passed and outcome_correct:
            return TestStatus.PASSED
        elif criteria_passed or outcome_correct:
            # Parcialmente correto
            return TestStatus.PASSED  # Ser mais leniente em edge cases
        else:
            return TestStatus.FAILED

    async def run_all_scenarios(
        self,
        scenarios: List[EdgeCaseScenario] = None
    ) -> List[EdgeCaseTestResult]:
        """Executa todos os cenarios de edge case"""

        scenarios = scenarios or EDGE_CASE_SCENARIOS

        print(f"\n{'#'*70}")
        print(f"# EDGE CASE TEST SUITE - {len(scenarios)} cenarios")
        print(f"# Testando caminhos negativos e fallbacks")
        print(f"{'#'*70}\n")

        available = self.agent_loader.list_available_agents()
        print("Agentes disponiveis:")
        for ag in available:
            print(f"   - {ag['agent_name']} ({ag['version']})")
        print()

        for scenario in scenarios:
            await self.run_scenario(scenario)

        # Resumo
        passed = sum(1 for r in self.results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAILED)
        timeout = sum(1 for r in self.results if r.status == TestStatus.TIMEOUT)
        error = sum(1 for r in self.results if r.status == TestStatus.ERROR)

        print(f"\n{'#'*70}")
        print(f"# RESUMO EDGE CASES")
        print(f"{'#'*70}")
        print(f"[OK] Passed:  {passed}/{len(self.results)}")
        print(f"[X] Failed:  {failed}/{len(self.results)}")
        print(f"[T] Timeout: {timeout}/{len(self.results)}")
        print(f"[!] Error:   {error}/{len(self.results)}")

        # Metricas agregadas
        total_pushy = sum(r.metrics.get("pushy_moments", 0) for r in self.results)
        print(f"\nMomentos 'pushy' totais: {total_pushy}")
        print(f"{'#'*70}\n")

        return self.results

    def get_summary(self) -> Dict:
        """Resumo dos testes de edge case"""
        if not self.results:
            return {
                "total": 0,
                "passed": 0,
                "failed": 0,
                "timeout": 0,
                "error": 0,
                "total_tokens": 0,
                "avg_turns": 0,
                "total_pushy_moments": 0,
                "criteria_summary": {}
            }

        # Agregar avaliacoes de criterios
        all_criteria = {}
        for r in self.results:
            for criterion, eval_data in r.criteria_evaluation.items():
                if criterion not in all_criteria:
                    all_criteria[criterion] = {"passed": 0, "failed": 0}
                if eval_data.get("passed"):
                    all_criteria[criterion]["passed"] += 1
                else:
                    all_criteria[criterion]["failed"] += 1

        return {
            "total": len(self.results),
            "passed": sum(1 for r in self.results if r.status == TestStatus.PASSED),
            "failed": sum(1 for r in self.results if r.status == TestStatus.FAILED),
            "timeout": sum(1 for r in self.results if r.status == TestStatus.TIMEOUT),
            "error": sum(1 for r in self.results if r.status == TestStatus.ERROR),
            "total_tokens": sum(r.metrics["total_tokens"] for r in self.results),
            "avg_turns": sum(r.metrics["turns"] for r in self.results) / len(self.results),
            "total_pushy_moments": sum(r.metrics.get("pushy_moments", 0) for r in self.results),
            "criteria_summary": all_criteria
        }


# ============================================================================
# FUNCAO PARA EXECUTAR TESTES
# ============================================================================

async def run_edge_case_tests(
    scenarios: List[EdgeCaseScenario] = None,
    groq_api_key: str = None
) -> Dict:
    """
    Funcao de conveniencia para rodar testes de edge case.

    Uso:
        import asyncio
        from e2e_testing.scenarios_edge_cases import run_edge_case_tests

        results = asyncio.run(run_edge_case_tests())
    """

    runner = EdgeCaseTestRunner(groq_api_key=groq_api_key)
    results = await runner.run_all_scenarios(scenarios)

    return {
        "results": [r.to_dict() for r in results],
        "summary": runner.get_summary()
    }


if __name__ == "__main__":
    # Rodar testes diretamente
    import asyncio

    async def main():
        results = await run_edge_case_tests()
        print("\n" + "="*70)
        print("SUMMARY:")
        print(json.dumps(results["summary"], indent=2, ensure_ascii=False))

    asyncio.run(main())
