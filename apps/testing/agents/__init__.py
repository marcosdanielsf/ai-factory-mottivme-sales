"""
AI Factory Agents
=================
Agentes Claude que replicam os workflows do AI Factory (n8n).

Arquitetura:
- Agentes 01-04: Pipeline principal (Extrator → Analisador → Gerador → Validador)
- Agentes 05-10: Sistema de Debate (Crítico, Defensor, Juiz, Especialistas)
- Agente 11: Script Writer (Roteirista de Conteudo para Growth OS)
- Agente 12: Prompt Factory (Gerador modular de prompts)
- Agentes 13-16: Pipeline de QA e Reflection (Coletor → QA Analyzer → Reflection → Prompt Improver)

Nota: Agentes 01-12 estao em arquivos com nomes legados.
      Agentes 13-16 sao os novos agentes de QA.
"""

# Base Agent
from .base_agent import BaseAgent, AgentConfig, AgentResult

# Pipeline QA e Reflection (13-16) - Novos agentes
from .agent_13_conversation_collector import ConversationCollectorAgent
from .agent_14_qa_analyzer import QAAnalyzerAgent
from .agent_15_reflection_aggregator import ReflectionAggregatorAgent
from .agent_16_prompt_improver import PromptImproverAgent

# Orquestrador Mestre - Conecta os dois pipelines
from .agent_factory_orchestrator import (
    AgentFactoryOrchestrator,
    PipelineMode,
    PipelineResult,
    create_agent,
    improve_agent,
    analyze_agent
)

__all__ = [
    # Base
    'BaseAgent',
    'AgentConfig',
    'AgentResult',

    # Pipeline QA e Reflection (13-16)
    'ConversationCollectorAgent',
    'QAAnalyzerAgent',
    'ReflectionAggregatorAgent',
    'PromptImproverAgent',

    # Orquestrador Mestre
    'AgentFactoryOrchestrator',
    'PipelineMode',
    'PipelineResult',
    'create_agent',
    'improve_agent',
    'analyze_agent',
]


# Pipeline factory para execucao simplificada
def create_qa_pipeline(supabase_client=None):
    """
    Cria instancias do pipeline de QA pronto para uso.

    Returns:
        Dict com os 4 agentes do pipeline QA
    """
    return {
        'collector': ConversationCollectorAgent(),
        'analyzer': QAAnalyzerAgent(),
        'aggregator': ReflectionAggregatorAgent(),
        'improver': PromptImproverAgent()
    }


async def run_qa_analysis(
    location_id: str = None,
    agent_version_id: str = None,
    hours_back: int = 48,
    min_messages: int = 4,
    limit: int = 50,
    improvement_mode: str = 'moderate'
):
    """
    Executa pipeline completo de QA: Coleta → Analise → Reflection → Melhoria.

    Args:
        location_id: Filtrar por location
        agent_version_id: Filtrar por agente especifico
        hours_back: Horas atras para buscar conversas
        min_messages: Minimo de mensagens por conversa
        limit: Maximo de conversas
        improvement_mode: 'conservative' | 'moderate' | 'aggressive'

    Returns:
        Dict com resultados de cada etapa
    """
    pipeline = create_qa_pipeline()
    results = {}

    # 1. Coletar conversas
    collector_result = await pipeline['collector'].execute({
        'location_id': location_id,
        'agent_version_id': agent_version_id,
        'hours_back': hours_back,
        'min_messages': min_messages,
        'limit': limit,
        'only_unanalyzed': True
    })

    results['collection'] = collector_result
    if not collector_result.success:
        return results

    conversations = collector_result.output.get('conversations', [])
    if not conversations:
        results['message'] = 'Nenhuma conversa encontrada para analise'
        return results

    # 2. Analisar conversas
    qa_analyses = []
    for conv in conversations:
        analysis_result = await pipeline['analyzer'].execute({
            'conversation': conv
        })
        if analysis_result.success:
            qa_analyses.append(analysis_result.output)

    results['analyses'] = {
        'total': len(qa_analyses),
        'samples': qa_analyses[:3]  # Apenas amostras no resultado
    }

    if not qa_analyses:
        results['message'] = 'Nenhuma analise concluida com sucesso'
        return results

    # 3. Agregar em reflection
    # Pegar agent_info da primeira conversa
    agent_info = {
        'agent_name': conversations[0].get('agent_name'),
        'id': conversations[0].get('agent_version_id')
    }

    reflection_result = await pipeline['aggregator'].execute({
        'qa_analyses': qa_analyses,
        'agent_info': agent_info,
        'period_days': hours_back // 24 or 1
    })

    results['reflection'] = reflection_result
    if not reflection_result.success:
        return results

    # 4. Gerar melhorias (se tiver prompt)
    # Nota: Para aplicar melhorias, precisa do prompt atual do agente
    results['improvement_ready'] = True
    results['next_step'] = 'Use PromptImproverAgent.apply_improvement() com o reflection'

    return results
