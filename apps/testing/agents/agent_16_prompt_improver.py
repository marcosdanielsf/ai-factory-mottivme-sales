"""
Agent 16 - Prompt Improver
==========================
Aplica melhorias no prompt do agente baseado nas recomendacoes do ReflectionAggregator.
Equivalente ao workflow 11-Prompt-Updater do n8n.

Responsabilidades:
- Receber reflection com recomendacoes
- Analisar prompt atual do agente
- Gerar versao melhorada do prompt
- Documentar todas as alteracoes feitas
- Manter compatibilidade com estrutura existente
"""

import logging
import json
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class PromptImproverAgent(BaseAgent):
    """
    Agente que aplica melhorias no prompt baseado em analises de QA.

    Inputs:
    - reflection: Output do ReflectionAggregator (recomendacoes, padroes, etc)
    - current_prompt: System prompt atual do agente
    - agent_info: Informacoes do agente (nome, version, etc)
    - improvement_mode: 'conservative' | 'moderate' | 'aggressive'

    Outputs:
    - improved_prompt: Novo system prompt otimizado
    - changes_made: Lista de alteracoes aplicadas
    - change_summary: Resumo das mudancas
    - validation: Checklist de validacao do novo prompt
    - rollback_info: Informacoes para reverter se necessario
    """

    _SYSTEM_PROMPT = """# Prompt Improver - Especialista em Otimizacao de Prompts de Agentes SDR

Voce e um especialista em otimizacao de prompts para agentes de IA SDR.
Sua missao e aplicar melhorias baseadas em dados reais de performance.

## SUA MISSAO

1. Analisar o prompt atual do agente
2. Processar as recomendacoes do reflection
3. Aplicar melhorias de forma estruturada
4. Documentar todas as alteracoes
5. Garantir que o prompt continua funcional

## PRINCIPIOS DE OTIMIZACAO

### Conservar o que funciona
- Nao altere secoes que estao gerando bons resultados
- Mantenha a estrutura geral do prompt
- Preserve exemplos que funcionam

### Priorizar melhorias de alto impacto
- Foque em problemas recorrentes primeiro
- Enderece red flags criticos
- Melhore areas com notas baixas

### Ser especifico e acionavel
- Adicione exemplos concretos
- Use linguagem clara e direta
- Evite instrucoes ambiguas

## TIPOS DE ALTERACAO

### ADICIONAR
- Novas secoes para cobrir gaps
- Exemplos (few-shot) para situacoes problematicas
- Regras de compliance faltantes
- Tratamento para objecoes nao cobertas

### MODIFICAR
- Reescrever secoes confusas
- Melhorar exemplos existentes
- Ajustar tom de voz
- Refinar regras de escalacao

### REMOVER
- Instrucoes conflitantes
- Exemplos que causam problemas
- Regras muito rigidas que travam conversas
- Redundancias

## ESTRUTURA ESPERADA DO PROMPT

Um bom prompt de agente SDR deve ter:

1. **IDENTIDADE** - Quem o agente e
2. **OBJETIVO** - O que ele deve fazer
3. **CONTEXTO** - Produto/servico que vende
4. **REGRAS** - O que pode e nao pode fazer
5. **COMPLIANCE** - Limites estritos
6. **EXEMPLOS** - Few-shot de boas respostas
7. **TRATAMENTO DE OBJECOES** - Como lidar
8. **ESCALACAO** - Quando passar para humano
9. **TOM DE VOZ** - Como se comunicar

## OUTPUT OBRIGATORIO (JSON)

{
  "improved_prompt": "O PROMPT COMPLETO REESCRITO",
  "changes_made": [
    {
      "type": "ADICIONAR|MODIFICAR|REMOVER",
      "section": "nome da secao",
      "description": "o que foi alterado",
      "reason": "motivo baseado no reflection",
      "impact": "ALTO|MEDIO|BAIXO",
      "before": "texto anterior (se modificar/remover)",
      "after": "texto novo (se adicionar/modificar)"
    }
  ],
  "change_summary": {
    "total_changes": 5,
    "additions": 2,
    "modifications": 2,
    "removals": 1,
    "high_impact_changes": 3,
    "main_improvements": ["lista das principais melhorias"]
  },
  "validation": {
    "has_identity": true,
    "has_objective": true,
    "has_context": true,
    "has_rules": true,
    "has_compliance": true,
    "has_examples": true,
    "has_objection_handling": true,
    "has_escalation": true,
    "has_tone": true,
    "estimated_improvement": "5-15%",
    "risk_level": "BAIXO|MEDIO|ALTO",
    "validation_notes": ["notas sobre o novo prompt"]
  },
  "rollback_info": {
    "original_hash": "hash do prompt original",
    "change_date": "ISO date",
    "reversible": true,
    "rollback_instructions": "como reverter se necessario"
  },
  "next_recommendations": [
    "proximas melhorias a considerar apos ver resultados"
  ]
}

## REGRAS

1. O improved_prompt deve ser o PROMPT COMPLETO, nao apenas as alteracoes
2. Documente TODAS as alteracoes, por menores que sejam
3. Mantenha compatibilidade com a estrutura existente
4. Nao altere mais de 30% do prompt de uma vez (exceto se mode=aggressive)
5. Priorize clareza sobre quantidade de mudancas
6. Valide que o prompt continua funcional
7. Retorne APENAS o JSON valido
"""

    @property
    def system_prompt(self) -> str:
        return self._SYSTEM_PROMPT

    def __init__(self, config: AgentConfig = None):
        if config is None:
            config = AgentConfig(
                name="PromptImprover",
                description="Aplica melhorias em prompts baseado em analises de QA",
                model="claude-sonnet-4-20250514",
                temperature=0.5,  # Balanco entre criatividade e consistencia
                max_tokens=8000  # Prompts podem ser longos
            )
        super().__init__(config)

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Aplica melhorias no prompt do agente.

        Args:
            input_data: {
                "reflection": Dict do ReflectionAggregator,
                "current_prompt": str do prompt atual,
                "agent_info": {name, version, id},
                "improvement_mode": 'conservative' | 'moderate' | 'aggressive'
            }
        """
        start_time = datetime.utcnow()

        try:
            reflection = input_data.get('reflection', {})
            current_prompt = input_data.get('current_prompt', '')
            agent_info = input_data.get('agent_info', {})
            mode = input_data.get('improvement_mode', 'moderate')

            if not current_prompt:
                raise ValueError("Prompt atual nao fornecido")

            if not reflection:
                raise ValueError("Reflection nao fornecido")

            # Preparar contexto de melhorias
            improvements_context = self._prepare_improvements_context(reflection, mode)

            # Montar prompt
            user_message = self._build_improvement_prompt(
                current_prompt,
                reflection,
                agent_info,
                improvements_context,
                mode
            )

            # Chamar Claude
            response_text, tokens_used = await self.call_claude(user_message)

            # Parsear resposta
            result_data = self._parse_response(response_text)

            # Adicionar hash do prompt original
            import hashlib
            original_hash = hashlib.md5(current_prompt.encode()).hexdigest()[:12]
            result_data['rollback_info'] = result_data.get('rollback_info', {})
            result_data['rollback_info']['original_hash'] = original_hash
            result_data['rollback_info']['change_date'] = datetime.utcnow().isoformat()

            # Adicionar metadados
            result_data['metadata'] = {
                'agent_name': agent_info.get('agent_name'),
                'agent_version_id': agent_info.get('id'),
                'improvement_mode': mode,
                'generated_at': datetime.utcnow().isoformat(),
                'original_prompt_length': len(current_prompt),
                'improved_prompt_length': len(result_data.get('improved_prompt', ''))
            }

            # Salvar na memoria compartilhada
            self.set_in_memory('last_prompt_improvement', result_data)
            self.set_in_memory('improved_prompt', result_data.get('improved_prompt'))

            result = AgentResult(
                agent_name=self.config.name,
                success=True,
                output=result_data,
                execution_time_ms=self._measure_time(start_time),
                tokens_used=tokens_used,
                model=self.config.model,
                metadata={
                    'total_changes': result_data.get('change_summary', {}).get('total_changes', 0),
                    'high_impact_changes': result_data.get('change_summary', {}).get('high_impact_changes', 0),
                    'mode': mode
                }
            )

            self.log_execution(result)
            return result

        except Exception as e:
            logger.error(f"PromptImprover failed: {e}", exc_info=True)
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                output={},
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,
                model=self.config.model,
                error=str(e)
            )

    def _prepare_improvements_context(self, reflection: Dict, mode: str) -> Dict:
        """Prepara contexto de melhorias baseado no modo"""

        # Extrair dados relevantes do reflection
        recomendacoes = reflection.get('recomendacoes_priorizadas', [])
        prompt_improvements = reflection.get('prompt_improvements', {})
        padroes_negativos = reflection.get('padroes_negativos', [])
        violacoes = reflection.get('violacoes_criticas', [])
        metricas = reflection.get('metricas', {})

        # Filtrar por prioridade baseado no modo
        if mode == 'conservative':
            # Apenas mudancas de baixo esforco e alto impacto
            max_changes = 3
            focus = ['compliance', 'red_flags']
            risk_tolerance = 'baixo'
        elif mode == 'aggressive':
            # Todas as mudancas recomendadas
            max_changes = 10
            focus = ['all']
            risk_tolerance = 'alto'
        else:  # moderate
            # Balanco entre impacto e seguranca
            max_changes = 5
            focus = ['high_impact', 'compliance']
            risk_tolerance = 'medio'

        # Filtrar recomendacoes
        filtered_recomendacoes = []
        for rec in recomendacoes[:max_changes]:
            if mode == 'conservative' and rec.get('esforco') == 'ALTO':
                continue
            filtered_recomendacoes.append(rec)

        return {
            'mode': mode,
            'max_changes': max_changes,
            'focus_areas': focus,
            'risk_tolerance': risk_tolerance,
            'recomendacoes_filtradas': filtered_recomendacoes,
            'prompt_improvements': prompt_improvements,
            'padroes_negativos': padroes_negativos[:5],  # Top 5
            'violacoes_criticas': violacoes,
            'score_atual': metricas.get('score_medio', 0)
        }

    def _build_improvement_prompt(
        self,
        current_prompt: str,
        reflection: Dict,
        agent_info: Dict,
        improvements_context: Dict,
        mode: str
    ) -> str:
        """Monta prompt para geracao de melhorias"""

        # Formatar recomendacoes
        recs_formatted = []
        for i, rec in enumerate(improvements_context.get('recomendacoes_filtradas', []), 1):
            recs_formatted.append(
                f"{i}. [{rec.get('area', 'N/A')}] {rec.get('problema', 'N/A')}\n"
                f"   Solucao: {rec.get('solucao', 'N/A')}\n"
                f"   Impacto: {rec.get('impacto_esperado', 'N/A')}"
            )

        # Formatar sugestoes de prompt
        prompt_suggestions = improvements_context.get('prompt_improvements', {})
        secoes_adicionar = prompt_suggestions.get('secoes_adicionar', [])
        secoes_modificar = prompt_suggestions.get('secoes_modificar', [])
        few_shots = prompt_suggestions.get('few_shot_adicionar', [])

        additions = "\n".join([
            f"- {s.get('secao', 'N/A')}: {s.get('motivo', 'N/A')}"
            for s in secoes_adicionar
        ]) or "Nenhuma"

        modifications = "\n".join([
            f"- {s.get('secao', 'N/A')}: {s.get('alteracao', 'N/A')}"
            for s in secoes_modificar
        ]) or "Nenhuma"

        few_shot_suggestions = "\n".join([
            f"- {f.get('situacao', 'N/A')}"
            for f in few_shots
        ]) or "Nenhum"

        # Formatar padroes negativos
        padroes_neg = "\n".join([
            f"- {p.get('padrao', 'N/A')} (Frequencia: {p.get('frequencia', 'N/A')})"
            for p in improvements_context.get('padroes_negativos', [])
        ]) or "Nenhum identificado"

        # Formatar violacoes
        violacoes = "\n".join([
            f"- {v.get('tipo', 'N/A')}: {v.get('acao_necessaria', 'N/A')} (Gravidade: {v.get('gravidade', 'N/A')})"
            for v in improvements_context.get('violacoes_criticas', [])
        ]) or "Nenhuma"

        prompt = f"""## TAREFA: MELHORAR PROMPT DO AGENTE

### Informacoes do Agente
- **Nome:** {agent_info.get('agent_name', 'N/A')}
- **Versao atual:** {agent_info.get('version', 'N/A')}
- **Score medio atual:** {improvements_context.get('score_atual', 'N/A')}/10

### Modo de Melhoria: {mode.upper()}
- Maximo de alteracoes: {improvements_context.get('max_changes', 5)}
- Tolerancia a risco: {improvements_context.get('risk_tolerance', 'medio')}
- Areas de foco: {', '.join(improvements_context.get('focus_areas', ['all']))}

---

## PROMPT ATUAL (A SER MELHORADO)

```
{current_prompt}
```

---

## DADOS DO REFLECTION

### Recomendacoes Priorizadas

{chr(10).join(recs_formatted) if recs_formatted else "Nenhuma recomendacao"}

### Secoes a Adicionar
{additions}

### Secoes a Modificar
{modifications}

### Few-shots Sugeridos
{few_shot_suggestions}

### Padroes Negativos Identificados
{padroes_neg}

### Violacoes Criticas
{violacoes}

---

## INSTRUCOES

1. Analise o prompt atual identificando pontos fortes e fracos
2. Aplique as melhorias sugeridas respeitando o modo ({mode})
3. Mantenha a estrutura geral do prompt
4. Documente TODAS as alteracoes no formato especificado
5. Retorne o prompt COMPLETO melhorado, nao apenas as partes alteradas

Gere o JSON com o prompt melhorado e documentacao das alteracoes."""

        return prompt

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta JSON"""
        parsed = self._extract_json(raw_response)

        if parsed and 'improved_prompt' in parsed:
            return parsed

        # Fallback
        logger.warning("Could not parse prompt improvement response")
        return {
            'improved_prompt': '',
            'changes_made': [],
            'change_summary': {
                'total_changes': 0,
                'error': 'Falha ao processar resposta'
            },
            'validation': {},
            'rollback_info': {},
            'raw_response': raw_response[:3000]
        }

    async def apply_improvement(
        self,
        reflection: Dict,
        agent_version_id: str,
        supabase_client,
        mode: str = 'moderate',
        auto_deploy: bool = False
    ) -> Dict:
        """
        Fluxo completo: busca prompt, melhora e opcionalmente salva.

        Args:
            reflection: Output do ReflectionAggregator
            agent_version_id: ID da versao do agente
            supabase_client: Cliente Supabase
            mode: Modo de melhoria
            auto_deploy: Se True, salva nova versao automaticamente

        Returns:
            Dict com resultado da melhoria e status de deploy
        """
        try:
            # Buscar prompt atual
            result = supabase_client.table('agent_versions') \
                .select('*') \
                .eq('id', agent_version_id) \
                .single() \
                .execute()

            if not result.data:
                raise ValueError(f"Agent version {agent_version_id} nao encontrado")

            agent_data = result.data
            current_prompt = agent_data.get('system_prompt', '')

            # Executar melhoria
            improvement_result = await self.execute({
                'reflection': reflection,
                'current_prompt': current_prompt,
                'agent_info': {
                    'agent_name': agent_data.get('agent_name'),
                    'version': agent_data.get('version'),
                    'id': agent_version_id
                },
                'improvement_mode': mode
            })

            if not improvement_result.success:
                return {
                    'success': False,
                    'error': improvement_result.error,
                    'deployed': False
                }

            output = improvement_result.output

            # Se auto_deploy, salvar nova versao
            deploy_result = None
            if auto_deploy and output.get('improved_prompt'):
                deploy_result = await self._deploy_new_version(
                    supabase_client,
                    agent_data,
                    output['improved_prompt'],
                    output['change_summary']
                )

            return {
                'success': True,
                'improvement': output,
                'deployed': bool(deploy_result),
                'deploy_result': deploy_result
            }

        except Exception as e:
            logger.error(f"apply_improvement failed: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'deployed': False
            }

    async def _deploy_new_version(
        self,
        supabase_client,
        agent_data: Dict,
        new_prompt: str,
        change_summary: Dict
    ) -> Dict:
        """Salva nova versao do agente no Supabase"""
        try:
            # Incrementar versao
            current_version = agent_data.get('version', '1.0.0')
            parts = current_version.split('.')
            parts[-1] = str(int(parts[-1]) + 1)
            new_version = '.'.join(parts)

            # Desativar versao atual
            supabase_client.table('agent_versions') \
                .update({'is_active': False}) \
                .eq('id', agent_data['id']) \
                .execute()

            # Criar nova versao
            new_agent = {
                'agent_name': agent_data.get('agent_name'),
                'location_id': agent_data.get('location_id'),
                'version': new_version,
                'system_prompt': new_prompt,
                'personality_config': agent_data.get('personality_config'),
                'compliance_rules': agent_data.get('compliance_rules'),
                'few_shot_examples': agent_data.get('few_shot_examples'),
                'is_active': True,
                'parent_version_id': agent_data['id'],
                'change_notes': json.dumps(change_summary, ensure_ascii=False),
                'created_at': datetime.utcnow().isoformat()
            }

            result = supabase_client.table('agent_versions') \
                .insert(new_agent) \
                .execute()

            if result.data:
                logger.info(f"Nova versao {new_version} criada: {result.data[0]['id']}")
                return {
                    'success': True,
                    'new_version_id': result.data[0]['id'],
                    'new_version': new_version,
                    'previous_version_id': agent_data['id']
                }

            return {'success': False, 'error': 'Falha ao inserir nova versao'}

        except Exception as e:
            logger.error(f"_deploy_new_version failed: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}
