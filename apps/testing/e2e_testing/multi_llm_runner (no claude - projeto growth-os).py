"""
Multi-LLM E2E Test Runner - Compara Groq, Claude e Gemini
=========================================================
Roda o MESMO teste com 3 LLMs diferentes e compara:
- Qualidade das respostas
- Custo por teste
- Tokens consumidos
- Taxa de sucesso

Salva custos na tabela llm_costs do Supabase.
"""

import os
import json
import asyncio
from typing import Dict, List, Optional, Literal
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from abc import ABC, abstractmethod

# SDKs
from groq import Groq
import anthropic
try:
    from google import genai as google_genai
    from google.genai import types as genai_types
    GENAI_NEW_SDK = True
except ImportError:
    try:
        import google.generativeai as genai
        GENAI_NEW_SDK = False
    except ImportError:
        GENAI_NEW_SDK = None
from supabase import create_client, Client

from .agent_loader import AgentLoader, RealAgent
from .lead_simulator import LeadPersona, get_profile, LEAD_PROFILES


# Preços por 1M tokens (Janeiro 2025)
LLM_PRICING = {
    "groq-llama-3.1-70b": {"input": 0.59, "output": 0.79},
    "groq-llama-3.3-70b": {"input": 0.59, "output": 0.79},
    "claude-sonnet-4": {"input": 3.00, "output": 15.00},
    "claude-haiku-3.5": {"input": 0.80, "output": 4.00},
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    "gemini-2.5-pro": {"input": 1.25, "output": 5.00},
}


class LLMProvider(Enum):
    GROQ = "groq"
    CLAUDE = "claude"
    GEMINI = "gemini"


class TestStatus(Enum):
    PASSED = "passed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    ERROR = "error"


@dataclass
class LLMConfig:
    """Configuração de um LLM"""
    provider: LLMProvider
    model: str
    api_key: str
    price_input: float  # USD per 1M tokens
    price_output: float


@dataclass
class MultiLLMScenario:
    """Cenário de teste multi-LLM"""
    name: str
    description: str
    agent_name: str
    agent_version: str = None
    initial_mode: str = "first_contact"
    lead_persona: LeadPersona = LeadPersona.HOT
    expected_outcome: str = "schedule"
    expected_mode_transitions: List[str] = field(default_factory=list)
    max_turns: int = 15
    tags: List[str] = field(default_factory=list)


@dataclass
class LLMTestResult:
    """Resultado de teste com um LLM específico"""
    llm_provider: LLMProvider
    llm_model: str
    scenario: MultiLLMScenario
    status: TestStatus
    actual_outcome: Optional[str]
    conversation: List[Dict]
    mode_transitions: List[Dict]
    modes_tested: List[str]
    tokens_input: int
    tokens_output: int
    cost_usd: float
    duration_seconds: float
    error: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "llm_provider": self.llm_provider.value,
            "llm_model": self.llm_model,
            "scenario_name": self.scenario.name,
            "status": self.status.value,
            "actual_outcome": self.actual_outcome,
            "tokens_input": self.tokens_input,
            "tokens_output": self.tokens_output,
            "cost_usd": self.cost_usd,
            "duration_seconds": self.duration_seconds,
            "conversation_length": len(self.conversation),
            "mode_transitions": len(self.mode_transitions),
            "error": self.error
        }


@dataclass
class MultiLLMComparison:
    """Comparação entre resultados de diferentes LLMs"""
    scenario: MultiLLMScenario
    results: Dict[str, LLMTestResult]  # llm_model -> result
    winner_quality: str  # Qual LLM teve melhor resultado
    winner_cost: str  # Qual LLM foi mais barato
    total_cost: float


class BaseLLMClient(ABC):
    """Cliente base para LLMs"""

    @abstractmethod
    def chat(self, system: str, messages: List[Dict], max_tokens: int = 400) -> tuple[str, int, int]:
        """Retorna (resposta, tokens_input, tokens_output)"""
        pass


class GroqClient(BaseLLMClient):
    def __init__(self, api_key: str, model: str = "llama-3.1-70b-versatile"):
        self.client = Groq(api_key=api_key)
        self.model = model

    def chat(self, system: str, messages: List[Dict], max_tokens: int = 400) -> tuple[str, int, int]:
        msgs = [{"role": "system", "content": system}] + messages
        response = self.client.chat.completions.create(
            model=self.model,
            messages=msgs,
            max_tokens=max_tokens,
            temperature=0.7
        )
        return (
            response.choices[0].message.content,
            response.usage.prompt_tokens,
            response.usage.completion_tokens
        )


class ClaudeClient(BaseLLMClient):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def chat(self, system: str, messages: List[Dict], max_tokens: int = 400) -> tuple[str, int, int]:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=0.7,
            system=system,
            messages=messages
        )
        return (
            response.content[0].text,
            response.usage.input_tokens,
            response.usage.output_tokens
        )


class GeminiClient(BaseLLMClient):
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model_name = model

        if GENAI_NEW_SDK:
            # Nova SDK (google-genai)
            self.client = google_genai.Client(api_key=api_key)
            self.use_new_sdk = True
        elif GENAI_NEW_SDK is False:
            # SDK antiga (google-generativeai)
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(model)
            self.use_new_sdk = False
        else:
            raise ImportError("Nenhum SDK do Gemini encontrado. Instale: pip install google-genai")

    def chat(self, system: str, messages: List[Dict], max_tokens: int = 400) -> tuple[str, int, int]:
        # Gemini usa formato diferente
        full_prompt = f"{system}\n\n"
        for msg in messages:
            role = "User" if msg["role"] == "user" else "Assistant"
            full_prompt += f"{role}: {msg['content']}\n"
        full_prompt += "Assistant:"

        if self.use_new_sdk:
            # Nova SDK
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=full_prompt,
                config=genai_types.GenerateContentConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.7
                )
            )
            text = response.text
            # Nova SDK retorna usage
            tokens_in = getattr(response.usage_metadata, 'prompt_token_count', len(full_prompt.split()) * 1.3)
            tokens_out = getattr(response.usage_metadata, 'candidates_token_count', len(text.split()) * 1.3)
        else:
            # SDK antiga
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.7
                )
            )
            text = response.text
            # Estimamos tokens
            tokens_in = len(full_prompt.split()) * 1.3
            tokens_out = len(text.split()) * 1.3

        return text, int(tokens_in), int(tokens_out)


class CostTracker:
    """Registra custos na tabela llm_costs do Supabase"""

    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        self.supabase_url = supabase_url or os.getenv(
            'SUPABASE_URL',
            'https://bfumywvwubvernvhjehk.supabase.co'
        )
        self.supabase_key = supabase_key or os.getenv(
            'SUPABASE_KEY',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE'
        )
        self.client = create_client(self.supabase_url, self.supabase_key)

    def log_cost(
        self,
        modelo_ia: str,
        tokens_input: int,
        tokens_output: int,
        custo_usd: float,
        workflow_name: str = "E2E Test Runner",
        tipo_acao: str = "e2e_test",
        location_id: str = "e2e-testing",
        location_name: str = "E2E Testing",
        execution_id: str = None,
        extra_data: Dict = None
    ) -> str:
        """Registra custo na tabela llm_costs"""

        record = {
            "workflow_id": "e2e_multi_llm_runner",
            "workflow_name": workflow_name,
            "execution_id": execution_id or datetime.utcnow().strftime("%Y%m%d%H%M%S"),
            "location_id": location_id,
            "location_name": location_name,
            "modelo_ia": modelo_ia,
            "tokens_input": tokens_input,
            "tokens_output": tokens_output,
            "custo_usd": custo_usd,
            "canal": "e2e_test",
            "tipo_acao": tipo_acao,
            "consolidado": False
        }

        if extra_data:
            record["mensagem_entrada"] = json.dumps(extra_data.get("input", {}), ensure_ascii=False)[:1000]
            record["mensagem_saida"] = json.dumps(extra_data.get("output", {}), ensure_ascii=False)[:1000]

        try:
            response = self.client.table('llm_costs').insert(record).execute()
            return response.data[0].get('id') if response.data else None
        except Exception as e:
            print(f"⚠️ Erro ao salvar custo: {e}")
            return None

    def log_comparison(
        self,
        scenario_name: str,
        results: Dict[str, LLMTestResult],
        winner_quality: str,
        winner_cost: str
    ) -> str:
        """Registra comparação multi-LLM"""

        total_tokens_in = sum(r.tokens_input for r in results.values())
        total_tokens_out = sum(r.tokens_output for r in results.values())
        total_cost = sum(r.cost_usd for r in results.values())

        record = {
            "workflow_id": "e2e_multi_llm_comparison",
            "workflow_name": f"Multi-LLM Comparison: {scenario_name}",
            "execution_id": datetime.utcnow().strftime("%Y%m%d%H%M%S"),
            "location_id": "e2e-testing",
            "location_name": "E2E Testing",
            "modelo_ia": f"comparison:{','.join(results.keys())}",
            "tokens_input": total_tokens_in,
            "tokens_output": total_tokens_out,
            "custo_usd": total_cost,
            "canal": "e2e_comparison",
            "tipo_acao": "multi_llm_test",
            "mensagem_entrada": json.dumps({
                "scenario": scenario_name,
                "llms_tested": list(results.keys()),
                "winner_quality": winner_quality,
                "winner_cost": winner_cost
            }, ensure_ascii=False),
            "mensagem_saida": json.dumps({
                r.llm_model: {
                    "status": r.status.value,
                    "cost": r.cost_usd,
                    "tokens": r.tokens_input + r.tokens_output
                }
                for r in results.values()
            }, ensure_ascii=False),
            "consolidado": False
        }

        try:
            response = self.client.table('llm_costs').insert(record).execute()
            return response.data[0].get('id') if response.data else None
        except Exception as e:
            print(f"⚠️ Erro ao salvar comparação: {e}")
            return None


class MultiLLMLeadSimulator:
    """Simula lead usando qualquer LLM"""

    LEAD_PROMPT = """Você é {name}, potencial cliente do Instituto Amare.

PERFIL:
- Idade: {age}, Profissão: {occupation}
- Dores/Problemas: {pain_points}
- Objeções típicas: {objections}

REGRAS:
1. Responda naturalmente como no WhatsApp (2-4 linhas)
2. Use emojis moderados
3. Se quiser AGENDAR: termine com [OBJETIVO: AGENDAR]
4. Se DESISTIR: termine com [OBJETIVO: DESISTIR]
5. Se objeção RESOLVIDA: termine com [OBJETIVO: RESOLVIDO]"""

    def __init__(self, persona: LeadPersona, llm_client: BaseLLMClient):
        self.persona = persona
        self.profile = get_profile(persona)
        self.client = llm_client
        self.history = []

    def get_initial_message(self) -> str:
        msgs = {
            LeadPersona.HOT: "Olá! Preciso de ajuda com reposição hormonal",
            LeadPersona.WARM: "Oi, vi vocês no Instagram. Queria saber mais",
            LeadPersona.COLD: "Oi, qual o preço da consulta?",
            LeadPersona.OBJECTION_PRICE: "Oi, qual o valor da consulta?",
            LeadPersona.OBJECTION_HUSBAND: "Olá! Tenho interesse mas preciso ver com meu marido",
            LeadPersona.RUSHED: "Oi, sou direta - preciso de tratamento hormonal, como funciona?"
        }
        return msgs.get(self.persona, "Olá, quero saber mais")

    def respond(self, agent_message: str) -> Dict:
        self.history.append({"role": "assistant", "content": agent_message})

        system = self.LEAD_PROMPT.format(
            name=self.profile.name,
            age=self.profile.age,
            occupation=self.profile.occupation,
            pain_points=", ".join(self.profile.pain_points[:3]),
            objections=", ".join(self.profile.objections[:2])
        )

        messages = self.history + [{"role": "user", "content": f"Agente disse: {agent_message}\n\nResponda:"}]

        text, tok_in, tok_out = self.client.chat(system, messages, max_tokens=250)

        # Detectar objetivo
        objective = None
        for tag in ["[OBJETIVO: AGENDAR]", "[OBJETIVO: DESISTIR]", "[OBJETIVO: RESOLVIDO]"]:
            if tag in text:
                objective = tag.replace("[OBJETIVO: ", "").replace("]", "").lower()
                text = text.replace(tag, "").strip()
                break

        self.history.append({"role": "user", "content": text})

        return {
            "message": text,
            "tokens_input": tok_in,
            "tokens_output": tok_out,
            "objective_reached": objective
        }


class MultiLLMTestRunner:
    """
    Executa o MESMO teste com múltiplos LLMs e compara.
    Salva custos no Supabase automaticamente.
    """

    TRANSITION_PROMPT = """Analise se deve mudar de modo.
MODO ATUAL: {current_mode}
RESPOSTA: {agent_response}
MODOS: {available_modes}

JSON: {{"should_transition": true/false, "target_mode": "modo" ou null, "reason": "motivo"}}"""

    def __init__(
        self,
        groq_api_key: str = None,
        claude_api_key: str = None,
        gemini_api_key: str = None
    ):
        self.groq_key = groq_api_key or os.getenv('GROQ_API_KEY')
        self.claude_key = claude_api_key or os.getenv('ANTHROPIC_API_KEY')
        self.gemini_key = gemini_api_key or os.getenv('GEMINI_API_KEY')

        self.agent_loader = AgentLoader()
        self.cost_tracker = CostTracker()
        self.results: List[MultiLLMComparison] = []

        # Configurar LLMs disponíveis
        self.llm_configs = {}

        if self.groq_key:
            self.llm_configs["groq-llama-3.3-70b"] = LLMConfig(
                provider=LLMProvider.GROQ,
                model="llama-3.3-70b-versatile",
                api_key=self.groq_key,
                price_input=0.59,
                price_output=0.79
            )

        if self.claude_key:
            self.llm_configs["claude-sonnet-4"] = LLMConfig(
                provider=LLMProvider.CLAUDE,
                model="claude-sonnet-4-20250514",
                api_key=self.claude_key,
                price_input=3.00,
                price_output=15.00
            )

        if self.gemini_key:
            self.llm_configs["gemini-2.0-flash"] = LLMConfig(
                provider=LLMProvider.GEMINI,
                model="gemini-2.0-flash",
                api_key=self.gemini_key,
                price_input=0.10,
                price_output=0.40
            )

    def _get_client(self, config: LLMConfig) -> BaseLLMClient:
        if config.provider == LLMProvider.GROQ:
            return GroqClient(config.api_key, config.model)
        elif config.provider == LLMProvider.CLAUDE:
            return ClaudeClient(config.api_key, config.model)
        elif config.provider == LLMProvider.GEMINI:
            return GeminiClient(config.api_key, config.model)

    def _calculate_cost(self, config: LLMConfig, tokens_in: int, tokens_out: int) -> float:
        cost_in = (tokens_in / 1_000_000) * config.price_input
        cost_out = (tokens_out / 1_000_000) * config.price_output
        return round(cost_in + cost_out, 6)

    async def run_scenario_with_llm(
        self,
        scenario: MultiLLMScenario,
        llm_name: str,
        agent: RealAgent
    ) -> LLMTestResult:
        """Executa um cenário com um LLM específico"""

        config = self.llm_configs[llm_name]
        client = self._get_client(config)

        print(f"\n   🔄 Testando com {llm_name}...")

        start_time = datetime.utcnow()
        total_tokens_in = 0
        total_tokens_out = 0

        # Inicializar
        lead_sim = MultiLLMLeadSimulator(scenario.lead_persona, client)
        conversation = []
        mode_transitions = []
        modes_tested = [scenario.initial_mode]
        current_mode = scenario.initial_mode
        context = {}

        try:
            # Primeira mensagem
            lead_msg = lead_sim.get_initial_message()
            conversation.append({"role": "lead", "content": lead_msg, "turn": 0})

            turn = 0
            actual_outcome = None

            while turn < scenario.max_turns:
                turn += 1

                # Agente responde
                full_prompt = agent.get_full_prompt(current_mode)
                history_text = "\n".join([
                    f"{'Agente' if m['role'] == 'agent' else 'Lead'}: {m['content']}"
                    for m in conversation[-6:]
                ])

                system = f"{full_prompt}\n\nHISTÓRICO:\n{history_text}\n\nRespostas curtas (2-4 linhas)."
                messages = [{"role": "user", "content": f"Lead: {lead_msg}"}]

                agent_response, tok_in, tok_out = client.chat(system, messages)
                total_tokens_in += tok_in
                total_tokens_out += tok_out

                conversation.append({
                    "role": "agent", "mode": current_mode,
                    "content": agent_response, "turn": turn
                })

                # Detectar transição (usando mesmo LLM)
                trans_prompt = self.TRANSITION_PROMPT.format(
                    current_mode=current_mode,
                    agent_response=agent_response,
                    available_modes=", ".join(agent.get_available_modes())
                )
                trans_resp, t_in, t_out = client.chat("Responda só JSON", [{"role": "user", "content": trans_prompt}], 100)
                total_tokens_in += t_in
                total_tokens_out += t_out

                try:
                    json_start = trans_resp.find('{')
                    json_end = trans_resp.rfind('}') + 1
                    if json_start != -1:
                        trans = json.loads(trans_resp[json_start:json_end])
                        if trans.get("should_transition") and trans.get("target_mode") in agent.get_available_modes():
                            mode_transitions.append({
                                "from": current_mode,
                                "to": trans["target_mode"],
                                "turn": turn
                            })
                            current_mode = trans["target_mode"]
                            if current_mode not in modes_tested:
                                modes_tested.append(current_mode)
                except:
                    pass

                # Lead responde
                lead_result = lead_sim.respond(agent_response)
                lead_msg = lead_result["message"]
                total_tokens_in += lead_result["tokens_input"]
                total_tokens_out += lead_result["tokens_output"]

                conversation.append({"role": "lead", "content": lead_msg, "turn": turn})

                if lead_result.get("objective_reached"):
                    actual_outcome = lead_result["objective_reached"]
                    break

            duration = (datetime.utcnow() - start_time).total_seconds()
            cost = self._calculate_cost(config, total_tokens_in, total_tokens_out)

            # Avaliar
            status = TestStatus.TIMEOUT
            if actual_outcome:
                mapping = {"agendar": "schedule", "resolvido": "objection_resolved"}
                norm = mapping.get(actual_outcome, actual_outcome)
                if norm == scenario.expected_outcome or norm in ["schedule", "objection_resolved"]:
                    status = TestStatus.PASSED
                else:
                    status = TestStatus.FAILED

            # Registrar custo
            self.cost_tracker.log_cost(
                modelo_ia=llm_name,
                tokens_input=total_tokens_in,
                tokens_output=total_tokens_out,
                custo_usd=cost,
                workflow_name=f"E2E Test: {scenario.name}",
                tipo_acao="e2e_test",
                execution_id=f"{scenario.name}_{llm_name}_{start_time.strftime('%H%M%S')}"
            )

            print(f"      ✅ {status.value} | Tokens: {total_tokens_in + total_tokens_out} | Custo: ${cost:.4f}")

            return LLMTestResult(
                llm_provider=config.provider,
                llm_model=llm_name,
                scenario=scenario,
                status=status,
                actual_outcome=actual_outcome,
                conversation=conversation,
                mode_transitions=mode_transitions,
                modes_tested=modes_tested,
                tokens_input=total_tokens_in,
                tokens_output=total_tokens_out,
                cost_usd=cost,
                duration_seconds=duration
            )

        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            print(f"      ❌ ERRO: {e}")
            return LLMTestResult(
                llm_provider=config.provider,
                llm_model=llm_name,
                scenario=scenario,
                status=TestStatus.ERROR,
                actual_outcome=None,
                conversation=conversation,
                mode_transitions=mode_transitions,
                modes_tested=modes_tested,
                tokens_input=total_tokens_in,
                tokens_output=total_tokens_out,
                cost_usd=self._calculate_cost(config, total_tokens_in, total_tokens_out),
                duration_seconds=duration,
                error=str(e)
            )

    async def run_comparison(self, scenario: MultiLLMScenario) -> MultiLLMComparison:
        """Executa o mesmo cenário com todos os LLMs configurados"""

        print(f"\n{'='*70}")
        print(f"🧪 COMPARAÇÃO MULTI-LLM: {scenario.name}")
        print(f"   Agente: {scenario.agent_name}")
        print(f"   Persona: {scenario.lead_persona.value}")
        print(f"   LLMs: {', '.join(self.llm_configs.keys())}")
        print(f"{'='*70}")

        # Carregar agente
        agent = self.agent_loader.load_agent(agent_name=scenario.agent_name)
        if not agent:
            print(f"❌ Agente não encontrado!")
            return None

        results = {}

        for llm_name in self.llm_configs.keys():
            result = await self.run_scenario_with_llm(scenario, llm_name, agent)
            results[llm_name] = result

        # Determinar vencedores
        passed_results = {k: v for k, v in results.items() if v.status == TestStatus.PASSED}

        if passed_results:
            winner_quality = max(passed_results.keys(), key=lambda k: len(passed_results[k].modes_tested))
            winner_cost = min(passed_results.keys(), key=lambda k: passed_results[k].cost_usd)
        else:
            winner_quality = min(results.keys(), key=lambda k: results[k].tokens_input + results[k].tokens_output)
            winner_cost = min(results.keys(), key=lambda k: results[k].cost_usd)

        total_cost = sum(r.cost_usd for r in results.values())

        # Registrar comparação
        self.cost_tracker.log_comparison(scenario.name, results, winner_quality, winner_cost)

        comparison = MultiLLMComparison(
            scenario=scenario,
            results=results,
            winner_quality=winner_quality,
            winner_cost=winner_cost,
            total_cost=total_cost
        )

        # Resumo
        print(f"\n   📊 RESULTADOS:")
        for llm, r in results.items():
            emoji = "✅" if r.status == TestStatus.PASSED else "❌"
            print(f"      {emoji} {llm}: {r.status.value} | ${r.cost_usd:.4f} | {r.tokens_input + r.tokens_output} tokens")

        print(f"\n   🏆 Melhor qualidade: {winner_quality}")
        print(f"   💰 Mais barato: {winner_cost}")
        print(f"   💵 Custo total: ${total_cost:.4f}")

        self.results.append(comparison)
        return comparison

    async def run_all_comparisons(self, scenarios: List[MultiLLMScenario]) -> List[MultiLLMComparison]:
        """Executa comparações para todos os cenários"""

        print(f"\n{'#'*70}")
        print(f"# MULTI-LLM COMPARISON SUITE - {len(scenarios)} cenários")
        print(f"# LLMs: {', '.join(self.llm_configs.keys())}")
        print(f"{'#'*70}")

        for scenario in scenarios:
            await self.run_comparison(scenario)

        # Resumo final
        self._print_final_summary()

        return self.results

    def _print_final_summary(self):
        """Imprime resumo final"""

        if not self.results:
            return

        print(f"\n{'#'*70}")
        print(f"# RESUMO FINAL - COMPARAÇÃO MULTI-LLM")
        print(f"{'#'*70}")

        # Contagem de vitórias
        quality_wins = {}
        cost_wins = {}
        total_costs = {}
        total_tokens = {}

        for comp in self.results:
            quality_wins[comp.winner_quality] = quality_wins.get(comp.winner_quality, 0) + 1
            cost_wins[comp.winner_cost] = cost_wins.get(comp.winner_cost, 0) + 1

            for llm, result in comp.results.items():
                total_costs[llm] = total_costs.get(llm, 0) + result.cost_usd
                total_tokens[llm] = total_tokens.get(llm, 0) + result.tokens_input + result.tokens_output

        print(f"\n📊 VITÓRIAS POR QUALIDADE:")
        for llm, wins in sorted(quality_wins.items(), key=lambda x: -x[1]):
            print(f"   {llm}: {wins} vitórias")

        print(f"\n💰 VITÓRIAS POR CUSTO:")
        for llm, wins in sorted(cost_wins.items(), key=lambda x: -x[1]):
            print(f"   {llm}: {wins} vitórias")

        print(f"\n💵 CUSTO TOTAL POR LLM:")
        for llm, cost in sorted(total_costs.items(), key=lambda x: x[1]):
            tokens = total_tokens[llm]
            print(f"   {llm}: ${cost:.4f} ({tokens:,} tokens)")

        grand_total = sum(total_costs.values())
        print(f"\n   TOTAL GERAL: ${grand_total:.4f}")

        print(f"{'#'*70}\n")

    def get_available_llms(self) -> List[str]:
        """Retorna LLMs configurados"""
        return list(self.llm_configs.keys())
