#!/usr/bin/env python3
"""
AI Factory - Pipeline Completo de Otimização de Agentes
========================================================
Executa o ciclo completo com 9 CENÁRIOS E2E:
  1. SIMULATION (E2E) - Testa o agente com 9 cenários completos
     - INBOUND: hot, objeção, frio
     - SOCIAL: novo seguidor, visita sincera, gatilho
     - FOLLOWUP: sumiu, reativação base
     - OBJEÇÃO: escala humano
  2. DEBATE - Crítico, Defensor, Especialistas, Juiz
  3. IMPROVEMENT - Gera prompt melhorado baseado nos feedbacks

Cada cenário percorre TODAS as etapas de cada modo:
  - SDR: Ativação → Qualificação → Pitch → Transição
  - Scheduler: Coleta dados → Pagamento → Confirmação → Agendamento
  - Concierge: Pré-consulta → Pós-consulta
  - Objection Handler: Identificar → Validar → Neutralizar → Retomar
  - Social Seller: Conexão → Ativação → Qualificação → Transição

Uso:
    python run_full_pipeline.py --agent "Julia Amare"
    python run_full_pipeline.py --agent "Julia Amare" --quick  # 3 cenários
    python run_full_pipeline.py --agent "Julia Amare" --skip-e2e
    python run_full_pipeline.py --agent "Julia Amare" --scenarios inbound_hot_completo social_novo_seguidor
    python run_full_pipeline.py --list-agents
    python run_full_pipeline.py --list-scenarios
"""

import os
import sys
import asyncio
import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field

# Adicionar path do projeto
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

import anthropic
from supabase import create_client, Client

# Imports locais - DB para salvar versões
try:
    from db import save_evolved_prompt, get_agent_by_name, create_new_agent_version
except ImportError:
    save_evolved_prompt = None
    get_agent_by_name = None
    create_new_agent_version = None

# Imports locais
try:
    from e2e_testing import AgentLoader, LeadPersona, MetricsCollector
    from e2e_testing.groq_test_runner import (
        GroqE2ETestRunner,
        GroqTestScenario,
        TestStatus
    )
    from e2e_testing.full_scenarios import (
        FULL_SCENARIOS,
        FullScenario,
        FlowType,
        get_scenario_by_name
    )
except ImportError:
    print("⚠️ Módulos e2e_testing não encontrados. Rodando sem E2E.")
    AgentLoader = None
    FULL_SCENARIOS = None


# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

CLAUDE_MODEL_DEBATE = "claude-sonnet-4-20250514"  # Para debate (mais barato)
CLAUDE_MODEL_IMPROVER = "claude-opus-4-20250514"  # Para melhoria final (melhor qualidade)


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class PipelineResult:
    """Resultado completo do pipeline"""
    agent_name: str
    agent_version: str

    # E2E Results
    e2e_results: List[Dict] = field(default_factory=list)
    e2e_pass_rate: float = 0.0
    e2e_total_scenarios: int = 0

    # Debate Results
    debate_criticism: str = ""
    debate_defense: str = ""
    debate_verdict: str = ""
    debate_score: float = 0.0
    expert_emotions: str = ""
    expert_objections: str = ""
    expert_rapport: str = ""

    # Improvement
    original_prompt: str = ""
    improved_prompt: str = ""
    improvement_summary: str = ""

    # Metrics
    total_tokens: int = 0
    total_cost: float = 0.0
    duration_seconds: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


# ============================================================================
# PROMPTS DO SISTEMA
# ============================================================================

DEBATE_PROMPTS = {
    "critic": """Você é um CRÍTICO DE VENDAS especializado em encontrar falhas em prompts de bots SDR.

Seu conhecimento inclui:
- SPIN Selling (Situação, Problema, Implicação, Necessidade)
- Challenger Sale (Ensinar, Personalizar, Assumir Controle)
- Sandler Selling System
- Benchmarks de conversão por indústria

TAREFA: Analise o prompt abaixo e encontre TODAS as falhas.

RESULTADOS DOS TESTES E2E (se disponível):
{e2e_summary}

PROMPT DO BOT:
{prompt}

CONTEXTO DO NEGÓCIO:
{context}

Forneça sua crítica em formato estruturado:
1. FALHAS CRÍTICAS (que comprometem conversão)
2. FALHAS MODERADAS (que reduzem eficácia)
3. OPORTUNIDADES PERDIDAS (técnicas não utilizadas)
4. ANÁLISE DOS TESTES E2E (se disponível)
5. SCORE DE RISCO (0-100, quanto maior = mais problemático)

Seja IMPIEDOSO. Seu papel é encontrar problemas, não elogiar.""",

    "advocate": """Você é um DEFENSOR DE PERSUASÃO especializado em técnicas de influência e vendas.

Seu conhecimento inclui:
- 6 Princípios de Cialdini
- NEPQ (Neuro-Emotional Persuasion Questions)
- No-Go Sales
- Dale Carnegie

TAREFA: Defenda os pontos FORTES do prompt e contra-argumente a crítica.

PROMPT DO BOT:
{prompt}

CONTEXTO DO NEGÓCIO:
{context}

CRÍTICA RECEBIDA:
{criticism}

RESULTADOS E2E:
{e2e_summary}

Forneça sua defesa:
1. PONTOS FORTES DO PROMPT
2. CONTRA-ARGUMENTOS À CRÍTICA
3. TÉCNICAS DE PERSUASÃO BEM APLICADAS
4. DEFESA DOS RESULTADOS E2E
5. SCORE DE EFICÁCIA (0-100)""",

    "judge": """Você é um JUIZ DE CONVERSÃO especializado em métricas e benchmarks de vendas.

TAREFA: Dê o VEREDITO FINAL sobre o prompt.

PROMPT DO BOT:
{prompt}

CONTEXTO DO NEGÓCIO:
{context}

CRÍTICA:
{criticism}

DEFESA:
{defense}

RESULTADOS E2E:
{e2e_summary}

Forneça seu veredito:
1. ANÁLISE DA CRÍTICA (válida ou não)
2. ANÁLISE DA DEFESA (válida ou não)
3. ANÁLISE DOS TESTES E2E
4. MELHORIAS OBRIGATÓRIAS
5. SCORE FINAL (0-100)
6. VEREDITO: APROVA / REVISÃO / REPROVA""",

    "expert_emotions": """Você é um ESPECIALISTA EM GATILHOS EMOCIONAIS.

Analise o uso de gatilhos emocionais no prompt:

PROMPT:
{prompt}

CONTEXTO:
{context}

Forneça:
1. GATILHOS PRESENTES
2. GATILHOS AUSENTES (que deveriam estar)
3. GATILHOS MAL APLICADOS
4. SUGESTÕES DE COPY com gatilhos corretos
5. SCORE DE IMPACTO EMOCIONAL (0-100)""",

    "expert_objections": """Você é um ESPECIALISTA EM QUEBRA DE OBJEÇÕES.

Analise o tratamento de objeções:

PROMPT:
{prompt}

CONTEXTO:
{context}

Forneça:
1. OBJEÇÕES TRATADAS (e qualidade)
2. OBJEÇÕES NÃO TRATADAS (gaps)
3. SCRIPTS SUGERIDOS para cada objeção
4. SCORE DE COBERTURA (0-100)""",

    "expert_rapport": """Você é um ESPECIALISTA EM RAPPORT E CONEXÃO HUMANA.

Analise a capacidade de criar conexão:

PROMPT:
{prompt}

CONTEXTO:
{context}

Forneça:
1. ELEMENTOS DE RAPPORT PRESENTES
2. ELEMENTOS AUSENTES
3. PONTOS ROBÓTICOS
4. SUGESTÕES DE HUMANIZAÇÃO
5. SCORE DE CONEXÃO (0-100)""",

    "improver": """Você é um EXPERT EM OTIMIZAÇÃO DE PROMPTS DE VENDAS.

Com base em toda a análise do debate, gere uma versão MELHORADA do prompt.

PROMPT ORIGINAL:
{prompt}

CONTEXTO DO NEGÓCIO:
{context}

CRÍTICA:
{criticism}

DEFESA:
{defense}

VEREDITO DO JUIZ:
{verdict}

ANÁLISE DE EMOÇÕES:
{emotions}

ANÁLISE DE OBJEÇÕES:
{objections}

ANÁLISE DE RAPPORT:
{rapport}

RESULTADOS E2E:
{e2e_summary}

TAREFA: Gere uma versão MELHORADA do prompt que:
1. Corrija todas as falhas críticas identificadas
2. Mantenha os pontos fortes
3. Incorpore as sugestões dos especialistas
4. Melhore o tratamento de objeções
5. Aumente os gatilhos emocionais
6. Humanize a comunicação

Retorne APENAS o novo prompt, sem explicações."""
}


# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def get_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_agent_from_supabase(agent_name: str) -> Optional[Dict]:
    """Busca agente no Supabase."""
    client = get_supabase_client()
    result = client.table('agent_versions').select(
        'id, agent_name, version, system_prompt, tools_config'
    ).ilike('agent_name', f'%{agent_name}%').order(
        'version', desc=True
    ).limit(1).execute()

    if result.data:
        return result.data[0]
    return None


def list_agents():
    """Lista agentes disponíveis."""
    client = get_supabase_client()
    result = client.table('agent_versions').select(
        'agent_name, version, location_id'
    ).order('agent_name').execute()

    print("\n📋 AGENTES DISPONÍVEIS:")
    print("-" * 60)
    for row in result.data:
        print(f"  • {row['agent_name']:<35} v{row['version']}")
    print("-" * 60)
    print(f"Total: {len(result.data)} agentes\n")


def extract_prompt_from_agent(agent_data: Dict) -> str:
    """Extrai prompt do agente."""
    prompt = agent_data.get('system_prompt', '')
    tools_config = agent_data.get('tools_config', {})

    if not prompt and tools_config:
        prompt = tools_config.get('system_prompt_master', '')
        if not prompt:
            prompts_por_modo = tools_config.get('prompts_por_modo', {})
            if prompts_por_modo:
                prompt = "\n\n".join([
                    f"### MODO: {mode} ###\n{p}"
                    for mode, p in prompts_por_modo.items()
                ])

    return prompt


def extract_context_from_agent(agent_data: Dict) -> Dict:
    """Extrai contexto do negócio."""
    tools_config = agent_data.get('tools_config', {})
    if not tools_config:
        return {}

    business = tools_config.get('business_context', {})
    personality = tools_config.get('personality_config', {})

    return {
        "product": business.get('nome_negocio', 'Não especificado'),
        "target_audience": business.get('publico_alvo', 'Não especificado'),
        "services": business.get('servicos_produtos', []),
        "differentials": business.get('diferenciais', []),
        "price_range": business.get('faixa_precos', {}),
        "location": business.get('localizacao', 'Não especificado'),
        "tone": personality.get('tom', 'Não especificado'),
        "agent_name": personality.get('nome_agente', 'Bot'),
    }


# ============================================================================
# CLASSE PRINCIPAL DO PIPELINE
# ============================================================================

class FullPipeline:
    """Pipeline completo: E2E → Debate → Improvement"""

    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.total_tokens = 0
        self.results = PipelineResult(agent_name="", agent_version="")

    def _print(self, msg: str):
        if self.verbose:
            print(msg)

    def _call_claude(self, system: str, user: str, use_opus: bool = False) -> str:
        """Chama Claude API.

        Args:
            system: System prompt
            user: User message
            use_opus: Se True, usa Opus 4.5 (melhor qualidade). Se False, usa Sonnet (mais barato)
        """
        model = CLAUDE_MODEL_IMPROVER if use_opus else CLAUDE_MODEL_DEBATE
        response = self.claude.messages.create(
            model=model,
            max_tokens=8192 if use_opus else 4096,
            system=system,
            messages=[{"role": "user", "content": user}]
        )
        self.total_tokens += response.usage.input_tokens + response.usage.output_tokens
        return response.content[0].text

    # =========================================================================
    # FASE 1: E2E SIMULATION (9 Cenários Completos)
    # =========================================================================

    async def run_e2e_simulation(
        self,
        agent_name: str,
        scenario_names: List[str] = None,
        max_scenarios: int = 9
    ) -> Dict:
        """
        Executa simulação E2E com os 9 cenários completos.

        Cenários disponíveis:
        1. inbound_hot_completo - Lead quente que agenda e paga
        2. inbound_objecao_preco - Lead com objeção de preço
        3. social_novo_seguidor - DM para novo seguidor
        4. social_visita_sincera - Visita de perfil
        5. social_gatilho - Lead interagiu com post/story
        6. followup_sumiu - Lead sumiu no meio do funil
        7. reativacao_base - Lista antiga
        8. inbound_desiste - Lead frio que não converte
        9. objecao_escala_humano - Objeção que precisa de humano
        """

        self._print("\n" + "=" * 60)
        self._print("🧪 FASE 1: SIMULAÇÃO E2E COMPLETA (9 Cenários)")
        self._print("=" * 60)

        if not GROQ_API_KEY or not AgentLoader:
            self._print("⚠️ Groq API Key não configurada ou módulos ausentes")
            self._print("   Pulando fase E2E...")
            return {"skipped": True, "reason": "No GROQ_API_KEY or modules"}

        if not FULL_SCENARIOS:
            self._print("⚠️ Cenários E2E não carregados")
            return {"skipped": True, "reason": "FULL_SCENARIOS not loaded"}

        try:
            # Carregar agente
            loader = AgentLoader()
            agent = loader.load_agent(agent_name=agent_name)

            if not agent:
                self._print(f"❌ Agente '{agent_name}' não encontrado")
                return {"skipped": True, "reason": "Agent not found"}

            modes = agent.get_available_modes()
            self._print(f"✅ Agente carregado: {agent.agent_name} v{agent.version}")
            self._print(f"   Modos disponíveis: {', '.join(modes)}")

            # Selecionar cenários
            if scenario_names:
                scenarios_to_run = [
                    s for s in FULL_SCENARIOS
                    if s.name in scenario_names
                ][:max_scenarios]
            else:
                scenarios_to_run = FULL_SCENARIOS[:max_scenarios]

            self._print(f"\n📋 Cenários a executar ({len(scenarios_to_run)}):")
            for s in scenarios_to_run:
                mode_names = [m['mode'] for m in s.mode_flow]
                self._print(f"   • {s.name}: {' → '.join(mode_names)} ({s.max_turns} turnos)")

            # Converter FullScenario → GroqTestScenario e executar
            all_results = []

            for scenario in scenarios_to_run:
                self._print(f"\n{'='*50}")
                self._print(f"🎬 Executando: {scenario.name}")
                self._print(f"   {scenario.description}")
                self._print(f"   Lead: {scenario.lead_name}, {scenario.lead_age} anos, {scenario.lead_profile}")
                self._print(f"   Dor: {scenario.lead_pain}")
                self._print("=" * 50)

                # Mapear lead_profile para LeadPersona
                persona_map = {
                    "executiva": LeadPersona.HOT,
                    "empresária": LeadPersona.HOT,
                    "advogada": LeadPersona.HOT,
                    "médica": LeadPersona.HOT,
                    "professora": LeadPersona.WARM,
                    "contadora": LeadPersona.WARM,
                    "aposentada": LeadPersona.WARM,
                    "estudante": LeadPersona.COLD,
                    "dona de casa": LeadPersona.OBJECTION_PRICE,
                }
                lead_persona = persona_map.get(scenario.lead_profile, LeadPersona.WARM)

                # Determinar modo inicial
                initial_mode = scenario.mode_flow[0]['mode'] if scenario.mode_flow else "sdr_inbound"
                if initial_mode not in modes:
                    # Fallback para modo disponível
                    initial_mode = modes[0] if modes else "first_contact"

                # Criar GroqTestScenario
                test_scenario = GroqTestScenario(
                    name=scenario.name,
                    description=f"{scenario.description} | Lead: {scenario.lead_name}, {scenario.lead_age}a, {scenario.lead_profile} | Dor: {scenario.lead_pain}",
                    agent_name=agent_name,
                    initial_mode=initial_mode,
                    lead_persona=lead_persona,
                    expected_outcome=scenario.expected_outcome,
                    max_turns=scenario.max_turns,
                    tags=["pipeline", "full_e2e", scenario.flow_type.value]
                )

                # Executar cenário
                runner = GroqE2ETestRunner()
                result = await runner.run_scenario(test_scenario)
                all_results.append(result)

                # Log do resultado
                status_emoji = "✅" if result.status == TestStatus.PASSED else "❌"
                self._print(f"   Resultado: {status_emoji} {result.status.value}")
                self._print(f"   Turnos: {len(result.conversation)}/{scenario.max_turns}")

                # Mostrar transições de modo
                if hasattr(result, 'mode_transitions') and result.mode_transitions:
                    # mode_transitions pode ser lista de strings ou lista de dicts
                    transitions = result.mode_transitions
                    if transitions and isinstance(transitions[0], dict):
                        transition_strs = [t.get('to', t.get('mode', str(t))) for t in transitions]
                    else:
                        transition_strs = [str(t) for t in transitions]
                    self._print(f"   Transições: {' → '.join(transition_strs)}")

            # Processar resultados
            passed = sum(1 for r in all_results if r.status == TestStatus.PASSED)
            total = len(all_results)
            pass_rate = (passed / total * 100) if total > 0 else 0

            self.results.e2e_results = [r.to_dict() for r in all_results]
            self.results.e2e_pass_rate = pass_rate
            self.results.e2e_total_scenarios = total

            # Resumo detalhado
            self._print(f"\n{'='*60}")
            self._print(f"📊 RESULTADOS E2E COMPLETOS")
            self._print(f"{'='*60}")
            self._print(f"   ✅ Passou: {passed}/{total} ({pass_rate:.0f}%)")

            summary_lines = [f"## Resultados E2E - {total} cenários\n"]

            for r in all_results:
                status_emoji = "✅" if r.status == TestStatus.PASSED else "❌"
                scenario_info = next(
                    (s for s in scenarios_to_run if s.name == r.scenario.name),
                    None
                )

                summary_lines.append(f"\n### {status_emoji} {r.scenario.name}")
                summary_lines.append(f"- Status: {r.status.value}")
                summary_lines.append(f"- Turnos: {len(r.conversation)}")

                if scenario_info:
                    mode_names = [m['mode'] for m in scenario_info.mode_flow]
                    summary_lines.append(f"- Fluxo esperado: {' → '.join(mode_names)}")

                    # Validar etapas
                    stages_tested = []
                    for mode_info in scenario_info.mode_flow:
                        mode = mode_info['mode']
                        stages = mode_info['stages']
                        for stage in stages:
                            stages_tested.append(f"{mode}.{stage.name}")
                    summary_lines.append(f"- Etapas esperadas: {len(stages_tested)}")

                if r.error:
                    summary_lines.append(f"- Erro: {r.error}")

            summary_lines.append(f"\n## Taxa de Sucesso: {pass_rate:.0f}%")

            return {
                "passed": passed,
                "total": total,
                "pass_rate": pass_rate,
                "summary": "\n".join(summary_lines),
                "results": [r.to_dict() for r in all_results],
                "scenarios_tested": [s.name for s in scenarios_to_run]
            }

        except Exception as e:
            import traceback
            self._print(f"❌ Erro no E2E: {e}")
            self._print(traceback.format_exc())
            return {"skipped": True, "reason": str(e)}

    # =========================================================================
    # FASE 2: DEBATE ITERATIVO (até aprovação ou max_rounds)
    # =========================================================================

    async def run_debate(
        self,
        prompt: str,
        context: Dict,
        e2e_summary: str = "Não executado",
        include_experts: bool = True,
        max_rounds: int = 3,
        approval_threshold: int = 80
    ) -> Dict:
        """
        Executa debate ITERATIVO até aprovação.

        Fluxo por round:
        1. Crítico analisa prompt
        2. Defensor contra-argumenta
        3. Especialistas analisam (opcional)
        4. Juiz dá veredito
        5. Se APROVADO (score >= threshold): encerra
        6. Se REVISÃO/REPROVADO: Improver gera nova versão
        7. Volta pro round 1 com novo prompt

        Args:
            max_rounds: Máximo de iterações (default 3)
            approval_threshold: Score mínimo para aprovação (default 80)
        """

        self._print("\n" + "=" * 60)
        self._print(f"🎭 FASE 2: DEBATE ITERATIVO (até score >= {approval_threshold})")
        self._print("=" * 60)

        context_str = json.dumps(context, indent=2, ensure_ascii=False)
        current_prompt = prompt
        all_rounds = []

        for round_num in range(1, max_rounds + 1):
            self._print(f"\n{'#' * 60}")
            self._print(f"# ROUND {round_num}/{max_rounds}")
            self._print(f"{'#' * 60}")

            round_data = {"round": round_num, "prompt_version": current_prompt[:500] + "..."}

            # 1. CRÍTICO
            self._print("\n🔴 CRÍTICO DE VENDAS")
            self._print("-" * 40)

            criticism = self._call_claude(
                "Você é um crítico impiedoso de prompts de vendas.",
                DEBATE_PROMPTS["critic"].format(
                    prompt=current_prompt,
                    context=context_str,
                    e2e_summary=e2e_summary
                )
            )
            round_data["criticism"] = criticism
            self._print(criticism[:800] + "..." if len(criticism) > 800 else criticism)

            # 2. DEFENSOR
            self._print("\n🟢 DEFENSOR DE PERSUASÃO")
            self._print("-" * 40)

            defense = self._call_claude(
                "Você é um defensor especialista em técnicas de persuasão.",
                DEBATE_PROMPTS["advocate"].format(
                    prompt=current_prompt,
                    context=context_str,
                    criticism=criticism,
                    e2e_summary=e2e_summary
                )
            )
            round_data["defense"] = defense
            self._print(defense[:800] + "..." if len(defense) > 800 else defense)

            # 3. ESPECIALISTAS (apenas no primeiro round ou se pedido)
            emotions = ""
            objections = ""
            rapport = ""

            if include_experts and round_num == 1:
                self._print("\n🧠 EXPERT EMOÇÕES")
                self._print("-" * 40)
                emotions = self._call_claude(
                    "Você é um especialista em gatilhos emocionais.",
                    DEBATE_PROMPTS["expert_emotions"].format(
                        prompt=current_prompt,
                        context=context_str
                    )
                )
                self._print(emotions[:500] + "..." if len(emotions) > 500 else emotions)

                self._print("\n🛡️ EXPERT OBJEÇÕES")
                self._print("-" * 40)
                objections = self._call_claude(
                    "Você é um especialista em quebra de objeções.",
                    DEBATE_PROMPTS["expert_objections"].format(
                        prompt=current_prompt,
                        context=context_str
                    )
                )
                self._print(objections[:500] + "..." if len(objections) > 500 else objections)

                self._print("\n🤝 EXPERT RAPPORT")
                self._print("-" * 40)
                rapport = self._call_claude(
                    "Você é um especialista em rapport e conexão humana.",
                    DEBATE_PROMPTS["expert_rapport"].format(
                        prompt=current_prompt,
                        context=context_str
                    )
                )
                self._print(rapport[:500] + "..." if len(rapport) > 500 else rapport)

                round_data["emotions"] = emotions
                round_data["objections"] = objections
                round_data["rapport"] = rapport

            # 4. JUIZ
            self._print("\n⚖️ JUIZ DE CONVERSÃO")
            self._print("-" * 40)

            verdict = self._call_claude(
                "Você é um juiz imparcial especialista em métricas de conversão.",
                DEBATE_PROMPTS["judge"].format(
                    prompt=current_prompt,
                    context=context_str,
                    criticism=criticism,
                    defense=defense,
                    e2e_summary=e2e_summary
                )
            )
            round_data["verdict"] = verdict
            self._print(verdict)

            # Extrair score
            import re
            score = 0
            score_match = re.search(r'SCORE[:\s]*FINAL[:\s]*(\d+)', verdict, re.IGNORECASE)
            if not score_match:
                score_match = re.search(r'(\d+)/100', verdict)
            if not score_match:
                score_match = re.search(r'SCORE[:\s]+(\d+)', verdict, re.IGNORECASE)
            if score_match:
                score = int(score_match.group(1))

            round_data["score"] = score
            all_rounds.append(round_data)

            self._print(f"\n📊 SCORE DO ROUND {round_num}: {score}/100")

            # Verificar se APROVADO
            is_approved = "APROVA" in verdict.upper() and "REPROVA" not in verdict.upper()
            if score >= approval_threshold or is_approved:
                self._print(f"\n✅ APROVADO no round {round_num}! Score: {score}")
                break

            # Se não é o último round, gerar versão melhorada
            if round_num < max_rounds:
                self._print(f"\n🔄 Score {score} < {approval_threshold}. Gerando versão melhorada...")

                improved_prompt = self._call_claude(
                    "Você é um expert em otimização de prompts de vendas.",
                    DEBATE_PROMPTS["improver"].format(
                        prompt=current_prompt,
                        context=context_str,
                        criticism=criticism,
                        defense=defense,
                        verdict=verdict,
                        emotions=emotions or "Não analisado neste round",
                        objections=objections or "Não analisado neste round",
                        rapport=rapport or "Não analisado neste round",
                        e2e_summary=e2e_summary
                    ),
                    use_opus=False  # Usar Sonnet nas iterações intermediárias
                )

                current_prompt = improved_prompt
                self._print(f"   Novo prompt gerado ({len(improved_prompt)} chars)")
            else:
                self._print(f"\n⚠️ Máximo de rounds atingido. Score final: {score}")

        # Salvar resultados finais
        final_round = all_rounds[-1]
        self.results.debate_criticism = final_round["criticism"]
        self.results.debate_defense = final_round["defense"]
        self.results.debate_verdict = final_round["verdict"]
        self.results.debate_score = final_round["score"]

        if "emotions" in final_round:
            self.results.expert_emotions = final_round["emotions"]
            self.results.expert_objections = final_round["objections"]
            self.results.expert_rapport = final_round["rapport"]

        return {
            "total_rounds": len(all_rounds),
            "final_score": final_round["score"],
            "approved": final_round["score"] >= approval_threshold,
            "rounds": all_rounds,
            "final_prompt": current_prompt,
            "criticism": final_round["criticism"],
            "defense": final_round["defense"],
            "verdict": final_round["verdict"],
            "emotions": final_round.get("emotions", ""),
            "objections": final_round.get("objections", ""),
            "rapport": final_round.get("rapport", ""),
        }

    # =========================================================================
    # FASE 3: IMPROVEMENT FINAL (com Opus 4.5)
    # =========================================================================

    async def run_improvement(
        self,
        original_prompt: str,
        context: Dict,
        debate_results: Dict,
        e2e_summary: str = "Não executado"
    ) -> str:
        """
        Gera prompt FINAL melhorado usando Claude Opus 4.5.

        Se o debate já iterou e gerou versões melhoradas, usa a última versão
        como base e faz um refinamento final com Opus.
        """

        self._print("\n" + "=" * 60)
        self._print("✨ FASE 3: MELHORIA FINAL (Claude Opus 4.5)")
        self._print("=" * 60)

        context_str = json.dumps(context, indent=2, ensure_ascii=False)

        # Usar o prompt já melhorado pelo debate se disponível
        base_prompt = debate_results.get("final_prompt", original_prompt)
        was_improved_in_debate = base_prompt != original_prompt

        if was_improved_in_debate:
            self._print(f"📝 Usando prompt já iterado do debate ({debate_results.get('total_rounds', 1)} rounds)")
        else:
            self._print("📝 Usando prompt original")

        # Prompt especial para Opus fazer refinamento final
        opus_improver_prompt = f"""Você é um MASTER em criação de prompts de vendas de alta conversão.

Sua tarefa é criar a VERSÃO FINAL DEFINITIVA do prompt abaixo.

## PROMPT BASE (para refinar):
{base_prompt}

## CONTEXTO DO NEGÓCIO:
{context_str}

## ÚLTIMA CRÍTICA:
{debate_results.get("criticism", "")[:2000]}

## ÚLTIMA DEFESA:
{debate_results.get("defense", "")[:2000]}

## VEREDITO DO JUIZ:
{debate_results.get("verdict", "")[:2000]}

## RESULTADOS E2E:
{e2e_summary[:2000] if e2e_summary else "Não executado"}

## SUA TAREFA:
Crie a versão FINAL e DEFINITIVA do prompt que:

1. **ESTRUTURA DE VENDAS**: Implemente framework SPIN/NEPQ completo
2. **QUALIFICAÇÃO**: Inclua processo BANT sutil mas efetivo
3. **FECHAMENTO**: Use assumptive closing em toda comunicação
4. **OBJEÇÕES**: Scripts específicos para preço, tempo, marido
5. **HUMANIZAÇÃO**: Mantenha tom empático mas focado em conversão
6. **FLUXO**: Máximo 7 etapas claras até agendamento
7. **URGÊNCIA**: Crie senso de urgência sem ser agressivo

## FORMATO:
Retorne APENAS o prompt melhorado, completo e pronto para produção.
Não inclua explicações, apenas o prompt final."""

        self._print("\n🧠 Gerando versão final com Opus 4.5...")

        improved = self._call_claude(
            "Você é o melhor especialista do mundo em prompts de vendas.",
            opus_improver_prompt,
            use_opus=True  # USA OPUS 4.5!
        )

        self.results.improved_prompt = improved

        # Gerar resumo das mudanças (com Sonnet, mais barato)
        summary = self._call_claude(
            "Você é um assistente conciso.",
            f"""Compare os dois prompts e liste as 5-7 principais mudanças em bullet points:

ORIGINAL:
{original_prompt[:2000]}

MELHORADO:
{improved[:2000]}

Liste as mudanças mais importantes em formato de bullet points.
Foque em: estrutura de vendas, qualificação, fechamento, objeções.""",
            use_opus=False
        )

        self.results.improvement_summary = summary

        self._print("\n📝 RESUMO DAS MELHORIAS:")
        self._print("-" * 40)
        self._print(summary)

        # Stats
        self._print(f"\n📊 Prompt original: {len(original_prompt)} chars")
        self._print(f"📊 Prompt final: {len(improved)} chars")
        self._print(f"📊 Debate rounds: {debate_results.get('total_rounds', 1)}")
        self._print(f"📊 Score final debate: {debate_results.get('final_score', 'N/A')}/100")

        return improved

    # =========================================================================
    # PIPELINE COMPLETO
    # =========================================================================

    async def run(
        self,
        agent_name: str,
        skip_e2e: bool = False,
        quick_mode: bool = False,
        save_result: bool = True,
        max_rounds: int = 3,
        approval_threshold: int = 80
    ) -> PipelineResult:
        """
        Executa pipeline completo.

        Args:
            agent_name: Nome do agente no Supabase
            skip_e2e: Pular fase E2E
            quick_mode: Modo rápido (sem especialistas, menos cenários)
            save_result: Salvar resultado em arquivo
            max_rounds: Máximo de rounds do debate iterativo
            approval_threshold: Score mínimo para aprovação
        """
        start_time = datetime.now()

        print("\n" + "=" * 60)
        print("🚀 AI FACTORY - PIPELINE COMPLETO")
        print("=" * 60)
        print(f"Agente: {agent_name}")
        print(f"Modo: {'Rápido' if quick_mode else 'Completo'}")
        print(f"E2E: {'Pulando' if skip_e2e else 'Executando'}")
        print(f"Debate: Até {max_rounds} rounds (threshold: {approval_threshold})")
        print(f"Improver: Claude Opus 4.5")
        print("=" * 60)

        # Buscar agente
        self._print(f"\n📥 Buscando agente: {agent_name}")
        agent_data = get_agent_from_supabase(agent_name)

        if not agent_data:
            print(f"❌ Agente '{agent_name}' não encontrado!")
            list_agents()
            sys.exit(1)

        self.results.agent_name = agent_data['agent_name']
        self.results.agent_version = agent_data['version']
        self._print(f"✅ Encontrado: {agent_data['agent_name']} v{agent_data['version']}")

        # Extrair prompt e contexto
        prompt = extract_prompt_from_agent(agent_data)
        context = extract_context_from_agent(agent_data)
        self.results.original_prompt = prompt

        if not prompt:
            print("❌ Agente não tem prompt configurado!")
            sys.exit(1)

        # FASE 1: E2E (9 cenários completos)
        e2e_summary = "Não executado"
        if not skip_e2e:
            e2e_result = await self.run_e2e_simulation(
                agent_name,
                max_scenarios=3 if quick_mode else 9  # 3 cenários no modo rápido, 9 no completo
            )
            if e2e_result.get("skipped"):
                reason = e2e_result.get("reason", "Unknown")
                if reason == "Agent not found":
                    print(f"\n❌ ERRO FATAL: Agente '{agent_name}' não encontrado pelo E2E loader!")
                    print("   Possíveis causas:")
                    print("   1. Agente não existe na tabela agent_versions")
                    print("   2. Agente existe mas status não é 'active'")
                    print("   3. Nome do agente está incorreto")
                    print("\n   Use --skip-e2e para rodar sem a fase E2E")
                    sys.exit(1)
                else:
                    print(f"\n⚠️ E2E pulado: {reason}")
                    e2e_summary = f"E2E pulado: {reason}"
            else:
                e2e_summary = e2e_result.get("summary", "")

        # FASE 2: DEBATE ITERATIVO
        debate_results = await self.run_debate(
            prompt,
            context,
            e2e_summary,
            include_experts=not quick_mode,
            max_rounds=max_rounds,
            approval_threshold=approval_threshold
        )

        # FASE 3: IMPROVEMENT
        improved_prompt = await self.run_improvement(
            prompt,
            context,
            debate_results,
            e2e_summary
        )

        # Finalizar
        duration = (datetime.now() - start_time).total_seconds()
        self.results.total_tokens = self.total_tokens
        self.results.total_cost = self.total_tokens * 0.000003  # Estimativa
        self.results.duration_seconds = duration

        # Resumo final
        print("\n" + "=" * 60)
        print("📊 RESUMO FINAL DO PIPELINE")
        print("=" * 60)
        print(f"Agente: {self.results.agent_name} v{self.results.agent_version}")
        print(f"E2E Pass Rate: {self.results.e2e_pass_rate:.0f}%")
        print(f"Debate Score: {self.results.debate_score:.0f}/100")
        print(f"Tokens usados: {self.total_tokens:,}")
        print(f"Custo estimado: ${self.results.total_cost:.4f}")
        print(f"Duração: {duration:.1f}s")
        print("=" * 60)

        # Salvar resultado
        if save_result:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"pipeline_{agent_name.replace(' ', '_')}_{timestamp}.json"

            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    "agent_name": self.results.agent_name,
                    "agent_version": self.results.agent_version,
                    "e2e_pass_rate": self.results.e2e_pass_rate,
                    "debate_score": self.results.debate_score,
                    "improvement_summary": self.results.improvement_summary,
                    "improved_prompt": self.results.improved_prompt,
                    "total_tokens": self.results.total_tokens,
                    "duration_seconds": self.results.duration_seconds,
                    "timestamp": self.results.timestamp
                }, f, indent=2, ensure_ascii=False)

            print(f"\n💾 Resultado salvo em: {filename}")

        return self.results


# ============================================================================
# MAIN
# ============================================================================

async def main():
    parser = argparse.ArgumentParser(
        description="AI Factory - Pipeline Completo de Otimização"
    )

    parser.add_argument(
        '--agent', '-a',
        type=str,
        help='Nome do agente no Supabase'
    )

    parser.add_argument(
        '--quick', '-q',
        action='store_true',
        help='Modo rápido (sem especialistas)'
    )

    parser.add_argument(
        '--skip-e2e',
        action='store_true',
        help='Pular fase E2E'
    )

    parser.add_argument(
        '--list-agents', '-l',
        action='store_true',
        help='Lista agentes disponíveis'
    )

    parser.add_argument(
        '--no-save',
        action='store_true',
        help='Não salvar resultado em arquivo'
    )

    parser.add_argument(
        '--scenarios', '-s',
        type=str,
        nargs='+',
        help='Cenários específicos para executar (ex: inbound_hot_completo social_novo_seguidor)'
    )

    parser.add_argument(
        '--list-scenarios',
        action='store_true',
        help='Lista cenários E2E disponíveis'
    )

    parser.add_argument(
        '--max-rounds', '-r',
        type=int,
        default=3,
        help='Máximo de rounds do debate iterativo (default: 3)'
    )

    parser.add_argument(
        '--save-to-supabase', '--db',
        action='store_true',
        help='Salvar prompt melhorado como nova versão no Supabase'
    )

    parser.add_argument(
        '--approval-threshold', '-t',
        type=int,
        default=80,
        help='Score mínimo para aprovação no debate (default: 80)'
    )

    args = parser.parse_args()

    # Listar cenários
    if args.list_scenarios:
        print("\n📋 CENÁRIOS E2E DISPONÍVEIS:")
        print("-" * 70)
        if FULL_SCENARIOS:
            for i, s in enumerate(FULL_SCENARIOS, 1):
                mode_names = [m['mode'] for m in s.mode_flow]
                outcome = "✅" if "confirmado" in s.expected_outcome else "❌" if "perdido" in s.expected_outcome else "🔄"
                print(f"  {i}. {s.name:<30} {outcome} {s.expected_outcome}")
                print(f"     └─ {' → '.join(mode_names)} ({s.max_turns} turnos)")
        else:
            print("  ⚠️ Cenários não carregados")
        print("-" * 70)
        return

    # Verificar API keys
    if not ANTHROPIC_API_KEY:
        print("❌ ANTHROPIC_API_KEY não configurada!")
        sys.exit(1)

    if args.list_agents:
        list_agents()
        return

    if not args.agent:
        print("❌ Especifique --agent ou --list-agents")
        parser.print_help()
        sys.exit(1)

    # Executar pipeline
    pipeline = FullPipeline(verbose=True)
    result = await pipeline.run(
        agent_name=args.agent,
        skip_e2e=args.skip_e2e,
        quick_mode=args.quick,
        save_result=not args.no_save,
        max_rounds=args.max_rounds,
        approval_threshold=args.approval_threshold
    )

    # Mostrar prompt melhorado
    print("\n" + "=" * 60)
    print("✨ PROMPT MELHORADO")
    print("=" * 60)
    print(result.improved_prompt)
    print("\n" + "=" * 60)
    print(f"📏 Total: {len(result.improved_prompt)} caracteres")

    # Salvar nova versão no Supabase se solicitado
    if args.save_to_supabase and save_evolved_prompt:
        print("\n" + "=" * 60)
        print("💾 SALVANDO NO SUPABASE...")
        print("=" * 60)

        # Calcular score médio dos E2E
        avg_score = 0.0
        if result.e2e_results:
            scores = [r.get('score', 0) for r in result.e2e_results if r.get('score')]
            avg_score = sum(scores) / len(scores) if scores else 0.0

        # Usar debate_score se não tiver E2E score
        final_score = avg_score if avg_score > 0 else (result.debate_score / 10)

        # Converter E2E results para formato que o frontend espera
        # Frontend espera: validator.test_results[] com {name, input, score, passed, feedback, simulated_response}
        test_details = []
        if result.e2e_results:
            for e2e in result.e2e_results:
                # Extrair conversa como input/output
                conversation = e2e.get('conversation', [])
                lead_msgs = [m.get('content', '') for m in conversation if m.get('role') in ['user', 'lead']]
                agent_msgs = [m.get('content', '') for m in conversation if m.get('role') == 'assistant']

                test_details.append({
                    'name': e2e.get('scenario_name', e2e.get('name', 'Cenário E2E')),
                    'input': lead_msgs[0] if lead_msgs else 'Lead iniciou conversa',
                    'score': e2e.get('score', 0),
                    'passed': e2e.get('status') == 'passed' or e2e.get('score', 0) >= 7,
                    'feedback': e2e.get('feedback', f"Cenário: {e2e.get('scenario_name', 'E2E')} | Status: {e2e.get('status', 'unknown')} | Turnos: {e2e.get('total_turns', 0)}"),
                    'simulated_response': agent_msgs[-1] if agent_msgs else 'Resposta do agente'
                })

        # Montar validation_result no formato que o frontend espera
        test_results = {
            'totals': {
                'total_tokens': result.total_tokens or 0,
                'total_time_ms': int((result.duration_seconds or 0) * 1000)
            },
            'validator': {
                'score': final_score,
                'status': 'approved' if final_score >= 8 else 'needs_improvement',
                'test_results': test_details
            },
            'debate': {
                'score': result.debate_score,
                'verdict': result.debate_verdict,
                'criticism': result.debate_criticism,
                'defense': result.debate_defense
            },
            'improvement_summary': result.improvement_summary,
            'e2e_pass_rate': result.e2e_pass_rate,
            'e2e_results_raw': result.e2e_results  # Manter original para debug
        }

        # Criar nova versão
        new_version = save_evolved_prompt(
            agent_name=args.agent,
            original_prompt=result.original_prompt,
            improved_prompt=result.improved_prompt,
            test_results=test_results,
            test_score=final_score,
            improvement_reasoning=result.improvement_summary
        )

        if new_version:
            print(f"✅ Nova versão criada: {new_version['agent_name']} v{new_version['version']}")
            print(f"   ID: {new_version['id']}")
            print(f"   Score: {final_score:.1f}/10")
            print(f"   Status: {new_version['status']}")
        else:
            print("❌ Erro ao salvar no Supabase")

    elif args.save_to_supabase and not save_evolved_prompt:
        print("\n⚠️ Módulo db.py não disponível. Não foi possível salvar no Supabase.")


if __name__ == "__main__":
    asyncio.run(main())
