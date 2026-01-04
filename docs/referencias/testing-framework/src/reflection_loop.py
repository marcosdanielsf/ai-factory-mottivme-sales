"""
AI Factory Testing Framework - Reflection Loop
===============================================
Auto-melhoria de agentes que não atingem threshold de qualidade.
"""

import json
import logging
import os
from typing import Dict, List, Optional
from datetime import datetime

import anthropic

from .supabase_client import SupabaseClient

logger = logging.getLogger(__name__)


IMPROVEMENT_PROMPT_TEMPLATE = """# TAREFA: MELHORAR PROMPT DE AGENTE IA

Você é um especialista em engenharia de prompts para agentes de vendas/SDR.
Seu objetivo é melhorar o system prompt do agente abaixo com base no feedback da avaliação.

## AGENTE ATUAL

**Nome:** {agent_name}
**Versão:** {current_version}
**Score Atual:** {current_score}/10

### System Prompt Atual:
```
{current_prompt}
```

## RESULTADOS DA AVALIAÇÃO

### Scores por Dimensão:
{scores_breakdown}

### Pontos Fracos Identificados:
{weaknesses}

### Falhas Críticas:
{failures}

### Recomendações do Avaliador:
{recommendations}

## CASOS DE TESTE COM PROBLEMAS

{problematic_cases}

## INSTRUÇÕES PARA MELHORIA

1. **MANTENHA** o que está funcionando bem (pontos fortes)
2. **CORRIJA** os pontos fracos identificados
3. **ADICIONE** instruções específicas para evitar as falhas
4. **NÃO MUDE** informações factuais (preços, endereços, etc)
5. **PRESERVE** o tom e personalidade do agente

### Foco nas melhorias:
- Se "completeness" está baixo: Adicione instruções de qualificação BANT
- Se "tone" está baixo: Refine instruções de tom e empatia
- Se "engagement" está baixo: Adicione técnicas de perguntas abertas
- Se "compliance" está baixo: Reforce guardrails e regras
- Se "conversion" está baixo: Melhore CTAs e direcionamento

## FORMATO DE SAÍDA

Retorne APENAS o novo system prompt completo, pronto para uso.
Não inclua explicações ou comentários - apenas o prompt melhorado.

---
NOVO SYSTEM PROMPT:
"""


class ReflectionLoop:
    """
    Reflection Loop para auto-melhoria de agentes.

    Workflow:
    1. Detecta agent com score < threshold
    2. Analisa weaknesses e failures
    3. Gera prompt melhorado (v2)
    4. Cria nova agent_version
    5. Retorna para teste
    """

    def __init__(
        self,
        supabase_client: SupabaseClient,
        api_key: str = None,
        model: str = "claude-opus-4-20250514",
        min_score_threshold: float = 8.0,
        max_iterations: int = 3,
        improvement_threshold: float = 0.5
    ):
        self.supabase = supabase_client
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')

        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY must be set")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = model
        self.min_score_threshold = min_score_threshold
        self.max_iterations = max_iterations
        self.improvement_threshold = improvement_threshold

        logger.info(f"ReflectionLoop initialized: threshold={min_score_threshold}")

    async def should_improve(
        self,
        agent_id: str,
        test_result: Dict
    ) -> bool:
        """
        Determina se o agente deve passar pelo loop de melhoria.
        """
        score = test_result.get('overall_score', 0)

        # Não melhora se já está bom
        if score >= self.min_score_threshold:
            logger.info(f"Agent {agent_id} score {score} >= {self.min_score_threshold}, no improvement needed")
            return False

        # Não melhora se score muito baixo (provavelmente precisa revisão manual)
        if score < 5.0:
            logger.warning(f"Agent {agent_id} score {score} < 5.0, manual review recommended")
            return False

        # Verificar se já atingiu max iterations
        agent = self.supabase.get_agent_version(agent_id)
        if agent:
            iteration = agent.get('reflection_iteration', 0)
            if iteration >= self.max_iterations:
                logger.warning(f"Agent {agent_id} reached max iterations ({self.max_iterations})")
                return False

        return True

    async def improve_agent(
        self,
        agent_id: str,
        test_result: Dict
    ) -> Dict:
        """
        Tenta melhorar um agente automaticamente.

        Args:
            agent_id: UUID do agent_version atual
            test_result: Resultado do teste (scores, weaknesses, etc)

        Returns:
            {
                'success': bool,
                'new_agent_id': str or None,
                'old_score': float,
                'new_prompt': str,
                'iteration': int,
                'message': str
            }
        """
        logger.info(f"Starting improvement for agent {agent_id}")

        try:
            # 1. Carregar agent atual
            agent = self.supabase.get_agent_version(agent_id)
            if not agent:
                raise ValueError(f"Agent {agent_id} not found")

            current_prompt = agent.get('system_prompt', '')
            current_version = agent.get('version', '1.0')
            current_score = test_result.get('overall_score', 0)
            iteration = agent.get('reflection_iteration', 0) + 1

            logger.info(f"Current: v{current_version}, score={current_score}, iteration={iteration}")

            # 2. Gerar prompt melhorado
            improved_prompt = await self._generate_improved_prompt(
                agent=agent,
                test_result=test_result
            )

            # 3. Criar nova agent_version
            new_version = self._increment_version(current_version)
            new_agent_id = await self._create_new_version(
                base_agent=agent,
                new_prompt=improved_prompt,
                new_version=new_version,
                iteration=iteration,
                based_on=agent_id
            )

            logger.info(f"Created new version: {new_agent_id} (v{new_version})")

            return {
                'success': True,
                'new_agent_id': new_agent_id,
                'old_score': current_score,
                'new_prompt': improved_prompt,
                'new_version': new_version,
                'iteration': iteration,
                'message': f'Created v{new_version} based on v{current_version}'
            }

        except Exception as e:
            logger.error(f"Error improving agent: {e}", exc_info=True)
            return {
                'success': False,
                'new_agent_id': None,
                'old_score': test_result.get('overall_score', 0),
                'new_prompt': None,
                'iteration': 0,
                'message': f'Error: {str(e)}'
            }

    async def _generate_improved_prompt(
        self,
        agent: Dict,
        test_result: Dict
    ) -> str:
        """
        Usa Claude Opus para gerar um prompt melhorado.
        """
        # Preparar dados para o template
        scores = test_result.get('test_details', {}).get('scores', {})
        scores_breakdown = "\n".join([
            f"- {dim.capitalize()}: {score:.1f}/10"
            for dim, score in scores.items()
        ])

        weaknesses = test_result.get('test_details', {}).get('weaknesses', [])
        weaknesses_str = "\n".join([f"- {w}" for w in weaknesses]) or "Nenhum identificado"

        failures = test_result.get('test_details', {}).get('failures', [])
        failures_str = "\n".join([f"- {f}" for f in failures]) or "Nenhuma falha crítica"

        recommendations = test_result.get('test_details', {}).get('recommendations', [])
        recommendations_str = "\n".join([f"- {r}" for r in recommendations]) or "Nenhuma recomendação"

        # Casos problemáticos (score < 7)
        test_cases = test_result.get('test_details', {}).get('test_cases', [])
        problematic = [tc for tc in test_cases if tc.get('score', 10) < 7]
        problematic_str = ""
        for tc in problematic[:5]:  # Máximo 5 casos
            problematic_str += f"""
### {tc.get('name', 'Test')} (Score: {tc.get('score', 0):.1f})
**Input:** {tc.get('input', 'N/A')}
**Resposta do Agente:** {tc.get('agent_response', 'N/A')}
**Esperado:** {tc.get('expected_behavior', 'N/A')}
**Feedback:** {tc.get('feedback', 'N/A')}
---
"""
        if not problematic_str:
            problematic_str = "Nenhum caso com score abaixo de 7"

        # Montar prompt
        prompt = IMPROVEMENT_PROMPT_TEMPLATE.format(
            agent_name=agent.get('agent_name', 'Unknown'),
            current_version=agent.get('version', '1.0'),
            current_score=test_result.get('overall_score', 0),
            current_prompt=agent.get('system_prompt', ''),
            scores_breakdown=scores_breakdown,
            weaknesses=weaknesses_str,
            failures=failures_str,
            recommendations=recommendations_str,
            problematic_cases=problematic_str
        )

        # Chamar Claude Opus
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                temperature=0.3,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            improved_prompt = response.content[0].text.strip()

            # Limpar possíveis artefatos
            if improved_prompt.startswith("```"):
                lines = improved_prompt.split("\n")
                improved_prompt = "\n".join(lines[1:-1])

            logger.info(f"Generated improved prompt ({len(improved_prompt)} chars)")
            return improved_prompt

        except Exception as e:
            logger.error(f"Error generating improved prompt: {e}")
            raise

    def _increment_version(self, current_version: str) -> str:
        """Incrementa versão (ex: 3.0 -> 3.1)"""
        try:
            parts = current_version.split('.')
            if len(parts) >= 2:
                major = parts[0]
                minor = int(parts[1]) + 1
                return f"{major}.{minor}"
            else:
                return f"{current_version}.1"
        except:
            return f"{current_version}.1"

    async def _create_new_version(
        self,
        base_agent: Dict,
        new_prompt: str,
        new_version: str,
        iteration: int,
        based_on: str
    ) -> str:
        """
        Cria nova versão do agente no Supabase.
        """
        try:
            # Preparar dados da nova versão
            new_agent_data = {
                'client_id': base_agent.get('client_id'),
                'sub_account_id': base_agent.get('sub_account_id'),
                'agent_name': base_agent.get('agent_name'),
                'version': new_version,
                'system_prompt': new_prompt,
                'tools_config': base_agent.get('tools_config'),
                'business_config': base_agent.get('business_config'),
                'status': 'pending_test',  # Precisa passar por teste
                'reflection_iteration': iteration,
                'based_on_version_id': based_on,
                'created_at': datetime.utcnow().isoformat(),
                'created_by': 'reflection_loop'
            }

            response = self.supabase.client.table('agent_versions').insert(
                new_agent_data
            ).execute()

            new_agent_id = response.data[0]['id']
            logger.info(f"Created agent_version {new_agent_id}")

            return new_agent_id

        except Exception as e:
            logger.error(f"Error creating new version: {e}")
            raise

    async def compare_versions(
        self,
        old_agent_id: str,
        new_agent_id: str,
        old_score: float,
        new_score: float
    ) -> Dict:
        """
        Compara versões e decide qual manter.
        """
        improvement = new_score - old_score

        if improvement >= self.improvement_threshold:
            # Nova versão é melhor - aprovar
            await self._approve_version(new_agent_id)
            await self._archive_version(old_agent_id)

            logger.info(f"Approved v2: {old_score:.2f} -> {new_score:.2f} (+{improvement:.2f})")

            return {
                'decision': 'approved',
                'old_score': old_score,
                'new_score': new_score,
                'improvement': improvement,
                'active_version': new_agent_id
            }

        else:
            # Nova versão não é suficientemente melhor - rollback
            await self._archive_version(new_agent_id)

            logger.info(f"Rejected v2: improvement {improvement:.2f} < {self.improvement_threshold}")

            return {
                'decision': 'rejected',
                'old_score': old_score,
                'new_score': new_score,
                'improvement': improvement,
                'active_version': old_agent_id
            }

    async def _approve_version(self, agent_id: str):
        """Marca versão como aprovada/ativa"""
        self.supabase.client.table('agent_versions').update({
            'status': 'active',
            'framework_approved': True,
            'approved_at': datetime.utcnow().isoformat()
        }).eq('id', agent_id).execute()

    async def _archive_version(self, agent_id: str):
        """Marca versão como arquivada"""
        self.supabase.client.table('agent_versions').update({
            'status': 'archived',
            'archived_at': datetime.utcnow().isoformat()
        }).eq('id', agent_id).execute()

    async def run_full_loop(
        self,
        agent_id: str,
        test_runner,  # Importado dinamicamente para evitar circular
        max_attempts: int = None
    ) -> Dict:
        """
        Executa loop completo: teste -> melhoria -> teste -> comparação

        Args:
            agent_id: UUID do agente inicial
            test_runner: Instância do TestRunner
            max_attempts: Override de max_iterations
        """
        max_attempts = max_attempts or self.max_iterations
        current_agent_id = agent_id
        history = []

        for attempt in range(max_attempts):
            logger.info(f"Reflection loop attempt {attempt + 1}/{max_attempts}")

            # 1. Testar versão atual
            test_result = await test_runner.run_tests(current_agent_id)
            current_score = test_result.get('overall_score', 0)

            history.append({
                'attempt': attempt + 1,
                'agent_id': current_agent_id,
                'score': current_score
            })

            # 2. Verificar se precisa melhorar
            if not await self.should_improve(current_agent_id, test_result):
                logger.info(f"No improvement needed, final score: {current_score}")
                break

            # 3. Gerar versão melhorada
            improvement_result = await self.improve_agent(current_agent_id, test_result)

            if not improvement_result['success']:
                logger.error(f"Improvement failed: {improvement_result['message']}")
                break

            new_agent_id = improvement_result['new_agent_id']

            # 4. Testar nova versão
            new_test_result = await test_runner.run_tests(new_agent_id)
            new_score = new_test_result.get('overall_score', 0)

            # 5. Comparar e decidir
            comparison = await self.compare_versions(
                old_agent_id=current_agent_id,
                new_agent_id=new_agent_id,
                old_score=current_score,
                new_score=new_score
            )

            history.append({
                'attempt': attempt + 1,
                'agent_id': new_agent_id,
                'score': new_score,
                'improvement': comparison['improvement'],
                'decision': comparison['decision']
            })

            if comparison['decision'] == 'approved':
                current_agent_id = new_agent_id
            else:
                # Não melhorou, parar
                logger.info("New version not better, stopping loop")
                break

        # Retornar resultado final
        final_agent = self.supabase.get_agent_version(current_agent_id)
        return {
            'final_agent_id': current_agent_id,
            'final_version': final_agent.get('version') if final_agent else 'unknown',
            'final_score': history[-1]['score'] if history else 0,
            'attempts': len(history),
            'history': history
        }
