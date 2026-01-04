"""
AI Factory Testing Framework - Test Runner
==========================================
Executa suites de testes em agentes IA.
"""

import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

from .supabase_client import SupabaseClient
from .evaluator import Evaluator
from .report_generator import ReportGenerator

logger = logging.getLogger(__name__)


class TestRunner:
    """
    Executor de testes para agentes IA.
    
    Workflow:
    1. Carrega agent_version do Supabase
    2. Carrega skill (se existir)
    3. Carrega test cases
    4. Executa cada caso de teste
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
        config: Dict
    ):
        self.supabase = supabase_client
        self.evaluator = evaluator
        self.reporter = report_generator
        self.config = config
    
    async def run_tests(
        self, 
        agent_version_id: str,
        test_suite_path: str = None
    ) -> Dict:
        """
        Executa suite completa de testes.
        
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
            
            # 2. Carregar skill
            skill = self.supabase.get_skill(agent_version_id)
            
            # 3. Carregar test cases
            test_cases = self._load_test_cases(agent, skill, test_suite_path)
            
            # 4. Executar testes
            results = []
            for test_case in test_cases:
                result = await self._run_single_test(agent, skill, test_case)
                results.append(result)
            
            # 5. Avaliar com Claude Opus
            evaluation = await self.evaluator.evaluate(
                agent=agent,
                skill=skill,
                test_results=results
            )
            
            # 6. Gerar relatório
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
                    'failures': evaluation['failures'],
                    'warnings': evaluation['warnings'],
                    'strengths': evaluation['strengths'],
                    'weaknesses': evaluation['weaknesses']
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
        test_suite_path: str = None
    ) -> List[Dict]:
        """
        Carrega casos de teste.
        Prioridade: test_suite_path > skill.test_cases > default
        """
        # TODO: Implementar lógica de carregamento
        # Por ora, retorna casos de teste default
        return self._get_default_test_cases(agent)
    
    def _get_default_test_cases(self, agent: Dict) -> List[Dict]:
        """Casos de teste genéricos baseados no tipo de agente"""
        # TODO: Gerar casos baseados em agent_config.modos_identificados
        return [
            {
                'name': 'Lead frio - primeira mensagem',
                'input': 'Oi',
                'expected_behavior': 'Pergunta aberta sobre interesse',
                'rubric_focus': ['tone', 'engagement']
            },
            {
                'name': 'Lead pergunta preço',
                'input': 'Quanto custa?',
                'expected_behavior': 'Âncora valor + qualificação',
                'rubric_focus': ['compliance', 'completeness']
            }
            # ... mais 18 casos
        ]
    
    async def _run_single_test(
        self, 
        agent: Dict, 
        skill: Optional[Dict],
        test_case: Dict
    ) -> Dict:
        """
        Executa um caso de teste individual.
        Simula conversa com o agente.
        """
        # TODO: Implementar simulação de conversa
        # Por ora, retorna mock
        return {
            'name': test_case['name'],
            'input': test_case['input'],
            'agent_response': '[MOCK] Resposta simulada do agente',
            'passed': True,
            'score': 8.5,
            'feedback': 'Tom consultivo excelente'
        }
