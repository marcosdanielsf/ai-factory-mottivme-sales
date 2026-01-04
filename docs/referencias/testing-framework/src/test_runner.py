"""
AI Factory Testing Framework - Test Runner
==========================================
Executa suites de testes em agentes IA.
"""

import json
import logging
import os
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

import anthropic

from .supabase_client import SupabaseClient
from .evaluator import Evaluator
from .report_generator import ReportGenerator

logger = logging.getLogger(__name__)


# ============================================
# CASOS DE TESTE PADRÃO POR MODO
# ============================================

DEFAULT_TEST_CASES = {
    'sdr': [
        {
            'name': 'Lead frio - primeira mensagem',
            'input': 'Oi',
            'expected_behavior': 'Saudação acolhedora + pergunta aberta sobre interesse',
            'rubric_focus': ['tone', 'engagement']
        },
        {
            'name': 'Lead pergunta preço direto',
            'input': 'Quanto custa a consulta?',
            'expected_behavior': 'Âncora valor antes do preço + qualificação',
            'rubric_focus': ['compliance', 'completeness']
        },
        {
            'name': 'Lead interessado mas resistente',
            'input': 'Achei interessante mas preciso pensar',
            'expected_behavior': 'Empatia + pergunta sobre dúvidas específicas',
            'rubric_focus': ['tone', 'engagement']
        },
        {
            'name': 'Lead diz que está caro',
            'input': 'Está muito caro pra mim',
            'expected_behavior': 'Não dar desconto imediato + reforçar valor + perguntar sobre investimento',
            'rubric_focus': ['compliance', 'conversion']
        },
        {
            'name': 'Lead com objeção de tempo',
            'input': 'Não tenho tempo agora',
            'expected_behavior': 'Empatia + oferecer flexibilidade + criar urgência sutil',
            'rubric_focus': ['tone', 'conversion']
        },
        {
            'name': 'Lead precisa consultar alguém',
            'input': 'Preciso falar com meu marido antes',
            'expected_behavior': 'Respeitar + perguntar se ele pode participar + manter conversa',
            'rubric_focus': ['tone', 'completeness']
        },
        {
            'name': 'Lead pede mais informações',
            'input': 'Me fala mais sobre o tratamento',
            'expected_behavior': 'Dar informações relevantes + direcionar para agendamento',
            'rubric_focus': ['completeness', 'conversion']
        },
        {
            'name': 'Lead responde monossilábico',
            'input': 'Ok',
            'expected_behavior': 'Avançar conversa com nova pergunta, não repetir',
            'rubric_focus': ['engagement', 'compliance']
        },
        {
            'name': 'Lead pronto para agendar',
            'input': 'Quero agendar uma consulta',
            'expected_behavior': 'Confirmar entusiasmo + oferecer horários + próximos passos',
            'rubric_focus': ['conversion', 'completeness']
        },
        {
            'name': 'Lead pergunta sobre localização',
            'input': 'Onde fica o consultório?',
            'expected_behavior': 'Informar endereço + perguntar qual unidade é melhor',
            'rubric_focus': ['compliance', 'engagement']
        },
        {
            'name': 'Lead desconfiado/cético',
            'input': 'Será que funciona mesmo?',
            'expected_behavior': 'Prova social + cases de sucesso + confiança sem pressão',
            'rubric_focus': ['tone', 'conversion']
        },
        {
            'name': 'Lead faz pergunta fora do escopo',
            'input': 'Vocês fazem cirurgia plástica?',
            'expected_behavior': 'Redirecionar gentilmente para serviços oferecidos',
            'rubric_focus': ['compliance', 'tone']
        },
        {
            'name': 'Lead já fez tratamento similar',
            'input': 'Já fiz reposição hormonal e não gostei',
            'expected_behavior': 'Empatia + entender o que não gostou + diferenciar abordagem',
            'rubric_focus': ['engagement', 'tone']
        },
        {
            'name': 'Lead quer saber forma de pagamento',
            'input': 'Posso parcelar?',
            'expected_behavior': 'Informar opções de pagamento + confirmar interesse em agendar',
            'rubric_focus': ['completeness', 'conversion']
        },
        {
            'name': 'Lead comparando com concorrente',
            'input': 'Vi outra clínica mais barata',
            'expected_behavior': 'Não desmerecer concorrente + destacar diferenciais',
            'rubric_focus': ['compliance', 'tone']
        },
    ],
    'support': [
        {
            'name': 'Cliente com problema técnico',
            'input': 'O aplicativo não está funcionando',
            'expected_behavior': 'Empatia + perguntas de diagnóstico',
            'rubric_focus': ['tone', 'completeness']
        },
        {
            'name': 'Cliente irritado',
            'input': 'Isso é ridículo, já é a terceira vez que isso acontece!',
            'expected_behavior': 'Desculpas + reconhecer frustração + oferecer solução',
            'rubric_focus': ['tone', 'compliance']
        },
    ]
}


class TestRunner:
    """
    Executor de testes para agentes IA.

    Workflow:
    1. Carrega agent_version do Supabase
    2. Carrega skill (se existir)
    3. Carrega test cases
    4. Executa cada caso de teste (simula conversa com Claude)
    5. Envia para Evaluator (Claude Opus)
    6. Agrega resultados
    7. Gera relatório HTML
    8. Salva no Supabase
    """

    def __init__(
        self,
        supabase_client: SupabaseClient,
        evaluator: Evaluator,
        report_generator: ReportGenerator,
        config: Dict = None
    ):
        self.supabase = supabase_client
        self.evaluator = evaluator
        self.reporter = report_generator
        self.config = config or {}

        # Cliente Anthropic para simulação de agente
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if api_key:
            self.anthropic = anthropic.Anthropic(api_key=api_key)
        else:
            self.anthropic = None
            logger.warning("ANTHROPIC_API_KEY not set, agent simulation disabled")

    async def run_tests(
        self,
        agent_version_id: str,
        test_suite_path: str = None,
        test_mode: str = 'sdr'
    ) -> Dict:
        """
        Executa suite completa de testes.

        Args:
            agent_version_id: UUID do agent_version
            test_suite_path: Caminho para arquivo de test cases (opcional)
            test_mode: Tipo de teste ('sdr', 'support', etc)

        Returns:
            {
                'overall_score': 8.5,
                'test_details': {...},
                'report_url': 'https://...',
                'duration_ms': 45000
            }
        """
        start_time = datetime.utcnow()
        logger.info(f"Starting test suite for agent {agent_version_id}")

        try:
            # 1. Carregar agente
            agent = self.supabase.get_agent_version(agent_version_id)
            if not agent:
                raise ValueError(f"Agent {agent_version_id} not found")

            logger.info(f"Loaded agent: {agent.get('agent_name', 'Unknown')}")

            # 2. Carregar skill
            skill = self.supabase.get_skill(agent_version_id)
            if skill:
                logger.info(f"Loaded skill v{skill.get('version', 1)}")

            # 3. Carregar test cases
            test_cases = self._load_test_cases(agent, skill, test_suite_path, test_mode)
            logger.info(f"Loaded {len(test_cases)} test cases")

            # 4. Executar testes
            results = []
            for i, test_case in enumerate(test_cases, 1):
                logger.info(f"Running test {i}/{len(test_cases)}: {test_case.get('name', 'Unknown')}")
                result = await self._run_single_test(agent, skill, test_case)
                results.append(result)

            # 5. Avaliar com Claude Opus
            logger.info("Sending to evaluator...")
            evaluation = await self.evaluator.evaluate(
                agent=agent,
                skill=skill,
                test_results=results
            )

            # 6. Gerar relatório
            logger.info("Generating report...")
            report_url = await self.reporter.generate_html_report(
                agent=agent,
                evaluation=evaluation,
                test_results=results
            )

            # 7. Calcular duração
            duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            # 8. Montar resultado final
            final_result = {
                'overall_score': evaluation['overall_score'],
                'test_details': {
                    'scores': evaluation['scores'],
                    'test_cases': results,
                    'failures': evaluation.get('failures', []),
                    'warnings': evaluation.get('warnings', []),
                    'strengths': evaluation.get('strengths', []),
                    'weaknesses': evaluation.get('weaknesses', []),
                    'recommendations': evaluation.get('recommendations', [])
                },
                'report_url': report_url,
                'duration_ms': duration_ms
            }

            # 9. Salvar no Supabase
            test_result_id = self.supabase.save_test_result(
                agent_version_id=agent_version_id,
                overall_score=evaluation['overall_score'],
                test_details=final_result['test_details'],
                report_url=report_url,
                test_duration_ms=duration_ms
            )

            # 10. Atualizar agent_version
            self.supabase.update_agent_test_results(
                agent_id=agent_version_id,
                score=evaluation['overall_score'],
                report_url=report_url,
                test_result_id=test_result_id
            )

            logger.info(
                f"Test suite completed: agent={agent_version_id}, "
                f"score={evaluation['overall_score']:.2f}, "
                f"duration={duration_ms}ms"
            )

            return final_result

        except Exception as e:
            logger.error(f"Error running tests: {e}", exc_info=True)
            raise

    def _load_test_cases(
        self,
        agent: Dict,
        skill: Optional[Dict],
        test_suite_path: str = None,
        test_mode: str = 'sdr'
    ) -> List[Dict]:
        """
        Carrega casos de teste.
        Prioridade: test_suite_path > skill.test_cases > default
        """
        # 1. De arquivo específico
        if test_suite_path:
            path = Path(test_suite_path)
            if path.exists():
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
                logger.info(f"Loaded test cases from {test_suite_path}")

        # 2. Do skill
        if skill and skill.get('test_cases'):
            logger.info("Using test cases from skill")
            return skill['test_cases']

        # 3. Default baseado no modo
        logger.info(f"Using default test cases for mode: {test_mode}")
        return DEFAULT_TEST_CASES.get(test_mode, DEFAULT_TEST_CASES['sdr'])

    async def _run_single_test(
        self,
        agent: Dict,
        skill: Optional[Dict],
        test_case: Dict
    ) -> Dict:
        """
        Executa um caso de teste individual.
        Simula conversa com o agente usando Claude.
        """
        input_message = test_case.get('input', '')
        expected_behavior = test_case.get('expected_behavior', '')

        # Simular resposta do agente
        if self.anthropic:
            agent_response = await self._simulate_agent_response(
                agent=agent,
                skill=skill,
                user_message=input_message
            )
        else:
            # Fallback se não tiver API key
            agent_response = f"[MOCK] Resposta simulada para: {input_message}"

        return {
            'name': test_case.get('name', 'Test Case'),
            'input': input_message,
            'agent_response': agent_response,
            'expected_behavior': expected_behavior,
            'rubric_focus': test_case.get('rubric_focus', []),
            'passed': True,  # Será determinado pelo evaluator
            'score': 0.0,  # Será preenchido pelo evaluator
            'feedback': ''  # Será preenchido pelo evaluator
        }

    async def _simulate_agent_response(
        self,
        agent: Dict,
        skill: Optional[Dict],
        user_message: str
    ) -> str:
        """
        Simula resposta do agente usando Claude.
        Usa o system_prompt do agente para simular comportamento.
        """
        system_prompt = agent.get('system_prompt', '')

        # Adicionar contexto do skill se disponível
        if skill and skill.get('instructions'):
            system_prompt += f"\n\n---\nInstruções Adicionais:\n{skill['instructions']}"

        try:
            response = self.anthropic.messages.create(
                model="claude-sonnet-4-20250514",  # Usar Sonnet para simulação (mais barato)
                max_tokens=500,
                temperature=0.7,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_message
                    }
                ]
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Error simulating agent: {e}")
            return f"[ERROR] Falha na simulação: {str(e)}"

    async def run_batch_tests(
        self,
        agent_ids: List[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Executa testes em múltiplos agentes.
        Se agent_ids não for passado, busca agentes que precisam de teste.
        """
        if agent_ids is None:
            # Buscar agentes que precisam de teste
            agents = self.supabase.get_agents_needing_testing(limit=limit)
            agent_ids = [a['id'] for a in agents]

        logger.info(f"Running batch tests for {len(agent_ids)} agents")

        results = []
        for agent_id in agent_ids:
            try:
                result = await self.run_tests(agent_id)
                results.append({
                    'agent_id': agent_id,
                    'success': True,
                    'result': result
                })
            except Exception as e:
                logger.error(f"Error testing agent {agent_id}: {e}")
                results.append({
                    'agent_id': agent_id,
                    'success': False,
                    'error': str(e)
                })

        return results


# ============================================
# CLI INTERFACE
# ============================================

async def main():
    """CLI para executar testes"""
    import argparse

    parser = argparse.ArgumentParser(description='AI Factory Test Runner')
    parser.add_argument('--agent-id', type=str, help='Agent version ID to test')
    parser.add_argument('--auto-discover', action='store_true', help='Test all agents needing testing')
    parser.add_argument('--limit', type=int, default=10, help='Max agents for auto-discover')
    parser.add_argument('--mode', type=str, default='sdr', choices=['sdr', 'support'], help='Test mode')

    args = parser.parse_args()

    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Inicializar componentes
    supabase = SupabaseClient()
    evaluator = Evaluator()
    reporter = ReportGenerator()

    runner = TestRunner(
        supabase_client=supabase,
        evaluator=evaluator,
        report_generator=reporter
    )

    if args.agent_id:
        result = await runner.run_tests(args.agent_id, test_mode=args.mode)
        print(f"\n✅ Score: {result['overall_score']}/10")
        print(f"📊 Report: {result['report_url']}")

    elif args.auto_discover:
        results = await runner.run_batch_tests(limit=args.limit)
        print(f"\n✅ Tested {len(results)} agents")
        for r in results:
            status = "✅" if r['success'] else "❌"
            score = r.get('result', {}).get('overall_score', 'N/A')
            print(f"  {status} {r['agent_id']}: {score}")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
