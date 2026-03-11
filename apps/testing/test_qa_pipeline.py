"""
Teste do Pipeline de QA
=======================
Testa os agentes 13-16 em sequencia.
"""

import asyncio
import os
import json
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configurar variaveis de ambiente
os.environ.setdefault('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
os.environ.setdefault('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')

# Imports dos agentes
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.agent_13_conversation_collector import ConversationCollectorAgent
from agents.agent_14_qa_analyzer import QAAnalyzerAgent
from agents.agent_15_reflection_aggregator import ReflectionAggregatorAgent
from agents.agent_16_prompt_improver import PromptImproverAgent


async def test_step_1_collector():
    """Testa o Conversation Collector"""
    print("\n" + "="*60)
    print("STEP 1: ConversationCollectorAgent")
    print("="*60)

    collector = ConversationCollectorAgent()

    result = await collector.execute({
        'hours_back': 72,  # Ultimas 72 horas
        'min_messages': 4,
        'limit': 10,  # Limitar a 10 para teste
        'only_unanalyzed': False  # Pegar todas para teste
    })

    print(f"Success: {result.success}")
    print(f"Execution time: {result.execution_time_ms}ms")

    if result.success:
        output = result.output
        print(f"Conversas encontradas: {output.get('total_found', 0)}")
        print(f"Summary: {json.dumps(output.get('summary', {}), indent=2, ensure_ascii=False)}")

        # Mostrar amostra
        conversations = output.get('conversations', [])
        if conversations:
            print(f"\nAmostra da primeira conversa:")
            conv = conversations[0]
            print(f"  - Session ID: {conv.get('session_id')}")
            print(f"  - Agent: {conv.get('agent_name')}")
            print(f"  - Total msgs: {conv.get('total_messages')}")
            print(f"  - Human msgs: {conv.get('human_messages')}")
            print(f"  - AI msgs: {conv.get('ai_messages')}")
    else:
        print(f"Error: {result.error}")

    return result


async def test_step_2_analyzer(conversations):
    """Testa o QA Analyzer com uma conversa"""
    print("\n" + "="*60)
    print("STEP 2: QAAnalyzerAgent")
    print("="*60)

    if not conversations:
        print("Sem conversas para analisar")
        return None

    # Verificar se ANTHROPIC_API_KEY esta configurada
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("ERRO: ANTHROPIC_API_KEY nao configurada")
        print("Pulando teste do QA Analyzer...")
        return None

    analyzer = QAAnalyzerAgent()

    # Analisar primeira conversa como teste
    conv = conversations[0]
    print(f"Analisando conversa: {conv.get('session_id')}")
    print(f"  - {conv.get('total_messages')} mensagens")

    result = await analyzer.execute({
        'conversation': conv
    })

    print(f"\nSuccess: {result.success}")
    print(f"Execution time: {result.execution_time_ms}ms")
    print(f"Tokens used: {result.tokens_used}")

    if result.success:
        output = result.output
        nota = output.get('nota_final', {})
        print(f"\nNota Final: {nota.get('valor', 'N/A')}/10 ({nota.get('classificacao', 'N/A')})")

        dimensoes = output.get('dimensoes', {})
        print("\nDimensoes:")
        for dim, data in dimensoes.items():
            if isinstance(data, dict):
                print(f"  - {dim}: {data.get('nota', 'N/A')}/10")

        red_flags = output.get('red_flags', [])
        print(f"\nRed Flags: {len(red_flags)}")
        for rf in red_flags[:3]:
            print(f"  - [{rf.get('gravidade', 'N/A')}] {rf.get('tipo', 'N/A')}")

        print(f"\nResumo: {output.get('resumo_executivo', 'N/A')[:200]}...")
    else:
        print(f"Error: {result.error}")

    return result


async def test_step_3_reflection(qa_analyses):
    """Testa o Reflection Aggregator"""
    print("\n" + "="*60)
    print("STEP 3: ReflectionAggregatorAgent")
    print("="*60)

    if not qa_analyses:
        print("Sem analises para agregar")
        return None

    if not os.getenv('ANTHROPIC_API_KEY'):
        print("ERRO: ANTHROPIC_API_KEY nao configurada")
        return None

    aggregator = ReflectionAggregatorAgent()

    print(f"Agregando {len(qa_analyses)} analises...")

    result = await aggregator.execute({
        'qa_analyses': qa_analyses,
        'agent_info': {
            'agent_name': 'Test Agent',
            'version': '1.0.0'
        },
        'period_days': 3
    })

    print(f"\nSuccess: {result.success}")
    print(f"Execution time: {result.execution_time_ms}ms")
    print(f"Tokens used: {result.tokens_used}")

    if result.success:
        output = result.output
        metricas = output.get('metricas', {})
        print(f"\nMetricas Agregadas:")
        print(f"  - Score medio: {metricas.get('score_medio', 'N/A')}")
        print(f"  - Taxa conversao: {metricas.get('taxa_conversao', 'N/A')}")

        recs = output.get('recomendacoes_priorizadas', [])
        print(f"\nRecomendacoes ({len(recs)}):")
        for i, rec in enumerate(recs[:3], 1):
            print(f"  {i}. [{rec.get('area', 'N/A')}] {rec.get('problema', 'N/A')[:50]}...")

        print(f"\nResumo: {output.get('resumo_executivo', 'N/A')[:200]}...")
    else:
        print(f"Error: {result.error}")

    return result


async def test_step_4_improver(reflection, sample_prompt):
    """Testa o Prompt Improver"""
    print("\n" + "="*60)
    print("STEP 4: PromptImproverAgent")
    print("="*60)

    if not reflection:
        print("Sem reflection para melhorar prompt")
        return None

    if not os.getenv('ANTHROPIC_API_KEY'):
        print("ERRO: ANTHROPIC_API_KEY nao configurada")
        return None

    improver = PromptImproverAgent()

    print(f"Gerando melhorias para prompt ({len(sample_prompt)} chars)...")

    result = await improver.execute({
        'reflection': reflection,
        'current_prompt': sample_prompt,
        'agent_info': {
            'agent_name': 'Test Agent',
            'version': '1.0.0'
        },
        'improvement_mode': 'moderate'
    })

    print(f"\nSuccess: {result.success}")
    print(f"Execution time: {result.execution_time_ms}ms")
    print(f"Tokens used: {result.tokens_used}")

    if result.success:
        output = result.output
        summary = output.get('change_summary', {})
        print(f"\nAlteracoes:")
        print(f"  - Total: {summary.get('total_changes', 0)}")
        print(f"  - Adicoes: {summary.get('additions', 0)}")
        print(f"  - Modificacoes: {summary.get('modifications', 0)}")
        print(f"  - Remocoes: {summary.get('removals', 0)}")

        validation = output.get('validation', {})
        print(f"\nValidacao:")
        print(f"  - Melhoria estimada: {validation.get('estimated_improvement', 'N/A')}")
        print(f"  - Risco: {validation.get('risk_level', 'N/A')}")

        improved = output.get('improved_prompt', '')
        print(f"\nPrompt melhorado: {len(improved)} chars (original: {len(sample_prompt)})")
    else:
        print(f"Error: {result.error}")

    return result


# Prompt de exemplo para teste
SAMPLE_PROMPT = """# SDR IA - Agente de Pre-Vendas

Voce e um SDR (Sales Development Representative) da empresa ACME.
Seu objetivo e qualificar leads e agendar reunioes com o time comercial.

## REGRAS
1. Seja cordial e profissional
2. Faca perguntas de qualificacao (BANT)
3. Agende reunioes quando o lead estiver qualificado
4. Nunca fale de precos

## COMPLIANCE
- Nao prometa resultados especificos
- Nao faca diagnosticos
- Encaminhe casos urgentes para humano

## TOM DE VOZ
- Amigavel mas profissional
- Direto ao ponto
- Empatico com objecoes
"""


async def run_full_pipeline():
    """Executa pipeline completo de teste"""
    print("\n" + "#"*60)
    print("# TESTE DO PIPELINE DE QA - AI Factory")
    print("#"*60)
    print(f"Inicio: {datetime.now().isoformat()}")

    # Step 1: Coletar conversas
    collector_result = await test_step_1_collector()

    if not collector_result or not collector_result.success:
        print("\n[ERRO] Falha na coleta de conversas")
        return

    conversations = collector_result.output.get('conversations', [])

    if not conversations:
        print("\n[INFO] Nenhuma conversa encontrada. Criando dados de teste...")
        # Criar conversa fake para teste
        conversations = [{
            'session_id': 'test-session-001',
            'agent_name': 'SDR Test',
            'total_messages': 6,
            'human_messages': 3,
            'ai_messages': 3,
            'messages': [
                {'type': 'ai', 'content': 'Ola! Sou a Julia da ACME. Como posso ajudar?', 'created_at': '2024-01-01T10:00:00Z'},
                {'type': 'human', 'content': 'Oi, vi o anuncio de voces. Quanto custa?', 'created_at': '2024-01-01T10:01:00Z'},
                {'type': 'ai', 'content': 'Que legal seu interesse! Antes de falar de valores, me conta: qual o tamanho da sua empresa?', 'created_at': '2024-01-01T10:02:00Z'},
                {'type': 'human', 'content': 'Somos uma empresa pequena, 10 funcionarios', 'created_at': '2024-01-01T10:03:00Z'},
                {'type': 'ai', 'content': 'Otimo! E qual o principal desafio que voces enfrentam hoje?', 'created_at': '2024-01-01T10:04:00Z'},
                {'type': 'human', 'content': 'Queremos automatizar o atendimento', 'created_at': '2024-01-01T10:05:00Z'},
            ]
        }]

    # Step 2: Analisar conversas
    qa_analyses = []
    analyzer_result = await test_step_2_analyzer(conversations)

    if analyzer_result and analyzer_result.success:
        qa_analyses.append(analyzer_result.output)
    else:
        print("\n[INFO] Usando analise mock para continuar teste...")
        qa_analyses = [{
            'nota_final': {'valor': 7.5, 'classificacao': 'BOM'},
            'dimensoes': {
                'clareza_conducao': {'nota': 8},
                'tratamento_objecoes': {'nota': 7},
                'loop_compliance': {'nota': 8},
                'avanco_objetivo': {'nota': 7}
            },
            'red_flags': [],
            'oportunidades_melhoria': [
                {'area': 'objecoes', 'sugestao': 'Melhorar tratamento de objecao de preco', 'impacto': 'ALTO'}
            ],
            'resumo_executivo': 'Conversa conduzida de forma adequada com boa qualificacao BANT.'
        }]

    # Step 3: Agregar em reflection
    reflection_result = await test_step_3_reflection(qa_analyses)

    reflection_data = None
    if reflection_result and reflection_result.success:
        reflection_data = reflection_result.output
    else:
        print("\n[INFO] Usando reflection mock para continuar teste...")
        reflection_data = {
            'metricas': {'score_medio': 7.5, 'taxa_conversao': '30%'},
            'recomendacoes_priorizadas': [
                {'prioridade': 1, 'area': 'objecoes', 'problema': 'Tratamento de preco insuficiente', 'solucao': 'Adicionar scripts de reframe'}
            ],
            'prompt_improvements': {
                'secoes_adicionar': [{'secao': 'OBJECAO_PRECO', 'motivo': 'Falta tratamento especifico'}],
                'secoes_modificar': [],
                'few_shot_adicionar': []
            }
        }

    # Step 4: Melhorar prompt
    improver_result = await test_step_4_improver(reflection_data, SAMPLE_PROMPT)

    # Resumo final
    print("\n" + "#"*60)
    print("# RESUMO DO TESTE")
    print("#"*60)
    print(f"1. Collector: {'OK' if collector_result and collector_result.success else 'FALHA/MOCK'}")
    print(f"2. Analyzer: {'OK' if analyzer_result and analyzer_result.success else 'FALHA/MOCK'}")
    print(f"3. Reflection: {'OK' if reflection_result and reflection_result.success else 'FALHA/MOCK'}")
    print(f"4. Improver: {'OK' if improver_result and improver_result.success else 'FALHA/MOCK'}")
    print(f"\nFim: {datetime.now().isoformat()}")


if __name__ == '__main__':
    asyncio.run(run_full_pipeline())
