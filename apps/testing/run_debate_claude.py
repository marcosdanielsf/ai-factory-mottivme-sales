#!/usr/bin/env python3
"""
Run Debate with Claude - Executa debate completo usando Claude API
===================================================================
Fluxo: Agente 01 (Extrator) → 02 (Analisador) → 03 (Gerador) → 04 (Validador)
       → 05 (Crítico) → 06 (Defensor) → 07 (Juiz) → [08-10 Especialistas]

Uso:
    python run_debate_claude.py --agent "Julia Amare"
    python run_debate_claude.py --agent "Julia Amare" --quick
    python run_debate_claude.py --list-agents
"""

import os
import sys
import asyncio
import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

# Adicionar path do projeto
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

import anthropic
from supabase import create_client, Client


# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

# Modelo Claude para usar
CLAUDE_MODEL = "claude-opus-4-5-20251101"


# ============================================================================
# PROMPTS DOS AGENTES DE DEBATE
# ============================================================================

AGENT_PROMPTS = {
    "critic": """Você é um CRÍTICO DE VENDAS especializado em encontrar falhas em prompts de bots SDR.

Seu conhecimento inclui:
- SPIN Selling (Situação, Problema, Implicação, Necessidade)
- Challenger Sale (Ensinar, Personalizar, Assumir Controle)
- Sandler Selling System
- Benchmarks de conversão por indústria

TAREFA: Analise o prompt abaixo e encontre TODAS as falhas:

PROMPT DO BOT:
{prompt}

CONTEXTO DO NEGÓCIO:
{context}

Forneça sua crítica em formato estruturado:
1. FALHAS CRÍTICAS (que comprometem conversão)
2. FALHAS MODERADAS (que reduzem eficácia)
3. OPORTUNIDADES PERDIDAS (técnicas não utilizadas)
4. SCORE DE RISCO (0-100, quanto maior = mais problemático)

Seja IMPIEDOSO. Seu papel é encontrar problemas, não elogiar.""",

    "advocate": """Você é um DEFENSOR DE PERSUASÃO especializado em técnicas de influência e vendas.

Seu conhecimento inclui:
- 6 Princípios de Cialdini (Reciprocidade, Escassez, Autoridade, Consistência, Afeição, Consenso)
- NEPQ (Neuro-Emotional Persuasion Questions)
- No-Go Sales (remover pressão para aumentar conversão)
- Dale Carnegie (Como Fazer Amigos e Influenciar Pessoas)

TAREFA: Defenda os pontos FORTES do prompt e contra-argumente a crítica:

PROMPT DO BOT:
{prompt}

CONTEXTO DO NEGÓCIO:
{context}

CRÍTICA RECEBIDA:
{criticism}

Forneça sua defesa em formato estruturado:
1. PONTOS FORTES DO PROMPT
2. CONTRA-ARGUMENTOS À CRÍTICA
3. TÉCNICAS DE PERSUASÃO BEM APLICADAS
4. OPORTUNIDADES DE MELHORIA (construtivas)
5. SCORE DE EFICÁCIA (0-100)""",

    "judge": """Você é um JUIZ DE CONVERSÃO especializado em métricas e benchmarks de vendas.

Seu conhecimento inclui:
- Benchmarks de conversão por indústria (SaaS, Saúde, Serviços, etc)
- Métricas de funil (Open Rate, Reply Rate, Qualification Rate, Meeting Booked)
- ROI de bots SDR vs humanos
- Análise de cohorts e A/B testing

TAREFA: Dê o VEREDITO FINAL sobre o prompt:

PROMPT DO BOT:
{prompt}

CONTEXTO DO NEGÓCIO:
{context}

CRÍTICA:
{criticism}

DEFESA:
{defense}

Forneça seu veredito em formato estruturado:
1. ANÁLISE DA CRÍTICA (válida ou não)
2. ANÁLISE DA DEFESA (válida ou não)
3. PONTOS DE CONCORDÂNCIA
4. PONTOS DE DISCORDÂNCIA
5. MELHORIAS OBRIGATÓRIAS (se houver)
6. SCORE FINAL (0-100)
7. VEREDITO: APROVA / REVISÃO / REPROVA""",

    "expert_emotions": """Você é um ESPECIALISTA EM GATILHOS EMOCIONAIS para vendas.

Seu conhecimento inclui os 16 gatilhos emocionais:
1. Medo de perder
2. Desejo de ganhar
3. Pertencimento
4. Exclusividade
5. Urgência
6. Escassez
7. Autoridade
8. Prova social
9. Reciprocidade
10. Curiosidade
11. Antecipação
12. Surpresa
13. Confiança
14. Segurança
15. Status
16. Transformação

TAREFA: Analise o uso de gatilhos emocionais no prompt:

PROMPT DO BOT:
{prompt}

CONTEXTO (público-alvo, dores, desejos):
{context}

Forneça sua análise:
1. GATILHOS PRESENTES (quais e como usados)
2. GATILHOS AUSENTES (que deveriam estar)
3. GATILHOS MAL APLICADOS (que podem ter efeito reverso)
4. SUGESTÕES DE COPY com gatilhos corretos
5. SCORE DE IMPACTO EMOCIONAL (0-100)""",

    "expert_objections": """Você é um ESPECIALISTA EM QUEBRA DE OBJEÇÕES.

Seu conhecimento inclui as 7 objeções universais:
1. "É muito caro" (Preço)
2. "Preciso pensar" (Tempo)
3. "Preciso falar com X" (Autoridade)
4. "Não é o momento" (Timing)
5. "Já tenho algo similar" (Concorrência)
6. "Não confio" (Credibilidade)
7. "Não preciso" (Necessidade)

TAREFA: Analise o tratamento de objeções no prompt:

PROMPT DO BOT:
{prompt}

CONTEXTO DO NEGÓCIO:
{context}

Forneça sua análise:
1. OBJEÇÕES TRATADAS (e qualidade do tratamento)
2. OBJEÇÕES NÃO TRATADAS (gaps críticos)
3. TRATAMENTOS FRACOS (que precisam melhorar)
4. SCRIPTS SUGERIDOS para cada objeção
5. SCORE DE COBERTURA DE OBJEÇÕES (0-100)""",

    "expert_rapport": """Você é um ESPECIALISTA EM RAPPORT E CONEXÃO HUMANA.

Seu conhecimento inclui:
- PNL (Programação Neurolinguística)
- Técnicas de Espelhamento
- CNV (Comunicação Não-Violenta)
- Escuta Ativa
- Empatia Tática (Chris Voss)

TAREFA: Analise a capacidade de criar conexão humana:

PROMPT DO BOT:
{prompt}

CONTEXTO DO NEGÓCIO:
{context}

Forneça sua análise:
1. ELEMENTOS DE RAPPORT PRESENTES
2. ELEMENTOS AUSENTES
3. PONTOS QUE PARECEM ROBÓTICOS
4. SUGESTÕES DE HUMANIZAÇÃO
5. SCORE DE CONEXÃO HUMANA (0-100)"""
}


# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def get_supabase_client() -> Client:
    """Cria cliente Supabase."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_agent_from_supabase(agent_name: str) -> Optional[Dict]:
    """Busca agente no Supabase."""
    client = get_supabase_client()

    result = client.table('agent_versions').select(
        'id, agent_name, version, system_prompt, tools_config'
    ).eq('agent_name', agent_name).order('version', desc=True).limit(1).execute()

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


def extract_context_from_tools_config(tools_config: Dict) -> Dict:
    """Extrai contexto do tools_config para o debate."""
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
# CLASSE PRINCIPAL DO DEBATE
# ============================================================================

class ClaudeDebate:
    """Executa debate completo usando Claude API."""

    def __init__(self, verbose: bool = True):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.verbose = verbose
        self.total_tokens = 0
        self.results = {}

    def _call_claude(self, system_prompt: str, user_message: str) -> str:
        """Chama Claude API."""
        response = self.client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            messages=[
                {"role": "user", "content": user_message}
            ],
            system=system_prompt
        )

        # Contabilizar tokens
        self.total_tokens += response.usage.input_tokens + response.usage.output_tokens

        return response.content[0].text

    def run_critic(self, prompt: str, context: Dict) -> str:
        """Executa agente crítico."""
        if self.verbose:
            print("\n🔴 AGENTE 05 - CRÍTICO DE VENDAS")
            print("-" * 50)

        user_msg = AGENT_PROMPTS["critic"].format(
            prompt=prompt,
            context=json.dumps(context, indent=2, ensure_ascii=False)
        )

        result = self._call_claude(
            "Você é um crítico impiedoso de prompts de vendas.",
            user_msg
        )

        if self.verbose:
            print(result[:1500] + "..." if len(result) > 1500 else result)

        self.results["criticism"] = result
        return result

    def run_advocate(self, prompt: str, context: Dict, criticism: str) -> str:
        """Executa agente defensor."""
        if self.verbose:
            print("\n🟢 AGENTE 06 - DEFENSOR DE PERSUASÃO")
            print("-" * 50)

        user_msg = AGENT_PROMPTS["advocate"].format(
            prompt=prompt,
            context=json.dumps(context, indent=2, ensure_ascii=False),
            criticism=criticism
        )

        result = self._call_claude(
            "Você é um defensor especialista em técnicas de persuasão.",
            user_msg
        )

        if self.verbose:
            print(result[:1500] + "..." if len(result) > 1500 else result)

        self.results["defense"] = result
        return result

    def run_judge(self, prompt: str, context: Dict, criticism: str, defense: str) -> str:
        """Executa agente juiz."""
        if self.verbose:
            print("\n⚖️ AGENTE 07 - JUIZ DE CONVERSÃO")
            print("-" * 50)

        user_msg = AGENT_PROMPTS["judge"].format(
            prompt=prompt,
            context=json.dumps(context, indent=2, ensure_ascii=False),
            criticism=criticism,
            defense=defense
        )

        result = self._call_claude(
            "Você é um juiz imparcial especialista em métricas de conversão.",
            user_msg
        )

        if self.verbose:
            print(result)

        self.results["verdict"] = result
        return result

    def run_expert(self, expert_type: str, prompt: str, context: Dict) -> str:
        """Executa um especialista."""
        expert_names = {
            "emotions": ("🧠 AGENTE 08 - EXPERT EMOÇÕES", "expert_emotions"),
            "objections": ("🛡️ AGENTE 09 - EXPERT OBJEÇÕES", "expert_objections"),
            "rapport": ("🤝 AGENTE 10 - EXPERT RAPPORT", "expert_rapport"),
        }

        title, prompt_key = expert_names[expert_type]

        if self.verbose:
            print(f"\n{title}")
            print("-" * 50)

        user_msg = AGENT_PROMPTS[prompt_key].format(
            prompt=prompt,
            context=json.dumps(context, indent=2, ensure_ascii=False)
        )

        result = self._call_claude(
            f"Você é um especialista em {expert_type}.",
            user_msg
        )

        if self.verbose:
            print(result[:1200] + "..." if len(result) > 1200 else result)

        self.results[f"expert_{expert_type}"] = result
        return result

    async def run_full_debate(
        self,
        prompt: str,
        context: Dict,
        include_experts: bool = True
    ) -> Dict:
        """
        Executa debate completo.

        Fluxo:
        1. Crítico analisa prompt
        2. Defensor defende e contra-argumenta
        3. [Opcional] Especialistas consultam
        4. Juiz dá veredito final
        """
        start_time = datetime.now()

        print("\n" + "=" * 60)
        print("🎭 DEBATE DE PROMPT COM CLAUDE")
        print("=" * 60)
        print(f"Modelo: {CLAUDE_MODEL}")
        print(f"Experts: {'Sim' if include_experts else 'Não'}")

        # 1. Crítico
        criticism = self.run_critic(prompt, context)

        # 2. Defensor
        defense = self.run_advocate(prompt, context, criticism)

        # 3. Especialistas (opcional)
        if include_experts:
            self.run_expert("emotions", prompt, context)
            self.run_expert("objections", prompt, context)
            self.run_expert("rapport", prompt, context)

        # 4. Juiz
        verdict = self.run_judge(prompt, context, criticism, defense)

        # Calcular duração
        duration = (datetime.now() - start_time).total_seconds()

        # Resumo final
        print("\n" + "=" * 60)
        print("📊 RESUMO DO DEBATE")
        print("=" * 60)
        print(f"Duração: {duration:.1f}s")
        print(f"Tokens usados: {self.total_tokens:,}")
        print(f"Custo estimado: ${self.total_tokens * 0.000003:.4f}")
        print("=" * 60)

        return {
            "results": self.results,
            "total_tokens": self.total_tokens,
            "duration_seconds": duration
        }

    async def run_quick_debate(self, prompt: str, context: Dict) -> Dict:
        """Debate rápido: só crítico + defensor + juiz."""
        return await self.run_full_debate(prompt, context, include_experts=False)


# ============================================================================
# MAIN
# ============================================================================

async def main():
    parser = argparse.ArgumentParser(
        description="Executa debate de prompt usando Claude API"
    )

    parser.add_argument(
        '--agent', '-a',
        type=str,
        help='Nome do agente no Supabase (ex: "Julia Amare")'
    )

    parser.add_argument(
        '--quick', '-q',
        action='store_true',
        help='Modo rápido (sem especialistas)'
    )

    parser.add_argument(
        '--list-agents', '-l',
        action='store_true',
        help='Lista agentes disponíveis'
    )

    parser.add_argument(
        '--save', '-s',
        action='store_true',
        help='Salvar resultado em arquivo JSON'
    )

    args = parser.parse_args()

    # Verificar API key
    if not ANTHROPIC_API_KEY:
        print("❌ ANTHROPIC_API_KEY não configurada!")
        print("   Configure no .env ou exporte a variável")
        sys.exit(1)

    # Listar agentes
    if args.list_agents:
        list_agents()
        return

    # Verificar se tem agente
    if not args.agent:
        print("❌ Especifique --agent ou --list-agents")
        parser.print_help()
        sys.exit(1)

    # Buscar agente
    print(f"\n📥 Buscando agente: {args.agent}")
    agent_data = get_agent_from_supabase(args.agent)

    if not agent_data:
        print(f"❌ Agente '{args.agent}' não encontrado!")
        list_agents()
        sys.exit(1)

    print(f"✅ Encontrado: {agent_data['agent_name']} v{agent_data['version']}")

    # Extrair prompt e contexto
    prompt = agent_data.get('system_prompt', '')
    tools_config = agent_data.get('tools_config', {})

    # Se não tem system_prompt, usar o master do tools_config
    if not prompt and tools_config:
        prompt = tools_config.get('system_prompt_master', '')
        if not prompt:
            # Concatenar prompts por modo
            prompts_por_modo = tools_config.get('prompts_por_modo', {})
            if prompts_por_modo:
                prompt = "\n\n".join([
                    f"### MODO: {mode} ###\n{p}"
                    for mode, p in prompts_por_modo.items()
                ])

    if not prompt:
        print("❌ Agente não tem prompt configurado!")
        sys.exit(1)

    context = extract_context_from_tools_config(tools_config)

    # Executar debate
    debate = ClaudeDebate(verbose=True)

    if args.quick:
        result = await debate.run_quick_debate(prompt, context)
    else:
        result = await debate.run_full_debate(prompt, context)

    # Salvar resultado
    if args.save:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"debate_{args.agent.replace(' ', '_')}_{timestamp}.json"

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                "agent_name": agent_data['agent_name'],
                "version": agent_data['version'],
                "timestamp": timestamp,
                **result
            }, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Resultado salvo em: {filename}")


if __name__ == "__main__":
    asyncio.run(main())
