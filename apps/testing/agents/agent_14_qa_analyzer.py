"""
Agent 14 - QA Analyzer
======================
Analisa conversas em 4 dimensoes de qualidade.
Equivalente ao workflow 08-QA-Analyst do n8n.

Dimensoes de Avaliacao:
1. Clareza de Conducao (0-10)
2. Tratamento de Objecoes (0-10)
3. Loop/Repeticao/Compliance (0-10)
4. Avanco para Objetivo (0-10)

Outputs:
- Notas por dimensao com justificativas
- Red flags identificados
- Oportunidades de melhoria
- Sugestoes de ajuste no prompt
"""

import logging
import json
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class QAAnalyzerAgent(BaseAgent):
    """
    Agente QA Analyst - avalia performance de conversas de agentes SDR.

    Inputs:
    - conversation: Dict com session_id, messages, agent_name, etc.
    - agent_context: (opcional) system_prompt, compliance_rules, etc.

    Outputs:
    - dimensoes: Notas e justificativas por dimensao
    - nota_final: Score medio e classificacao
    - red_flags: Problemas criticos identificados
    - oportunidades_melhoria: Sugestoes de melhoria
    - sugestao_prompt: Ajustes recomendados no prompt
    """

    _SYSTEM_PROMPT = """# QA ANALYST IA - Avaliador de Conversas de Agentes SDR

Voce e um avaliador imparcial de conversas de agentes de IA SDR.
Sua funcao e OBSERVAR e JULGAR a performance do agente, SEM intervir na conversa.

## AS 4 DIMENSOES DE AVALIACAO

### 1. CLAREZA DE CONDUCAO (0-10)

O que avaliar:
- Lead entende onde esta no processo?
- Proximos passos sao claros?
- Linguagem e direta sem confusao?
- Fluxo logico e natural?

Criterios:
- 9-10: Lead sempre sabe exatamente o que fazer
- 7-8: Claro na maior parte, pequenas ambiguidades
- 5-6: As vezes confuso, precisa repetir
- 3-4: Frequentemente confuso
- 0-2: Lead completamente perdido

### 2. TRATAMENTO DE OBJECOES (0-10)

O que avaliar:
- Identificou objecoes corretamente?
- Respondeu de forma empatica mas firme?
- Superou ou escalou apropriadamente?
- Usou tecnicas certas (reframe, urgencia, exclusividade)?

Criterios:
- 9-10: Objecoes viram oportunidade de fechamento
- 7-8: Trata bem, poderia ser mais persuasivo
- 5-6: Responde mas nao convence
- 3-4: Responde mal ou ignora parcialmente
- 0-2: Ignora objecoes completamente

### 3. LOOP/REPETICAO/COMPLIANCE (0-10)

O que avaliar:
- Evitou loops infinitos? (perguntar mesma coisa varias vezes)
- Nao repetiu informacoes desnecessariamente?
- Respeitou compliance (valores, diagnosticos, promessas)?
- Escalou quando deveria?
- Tom de voz consistente?

Criterios:
- 9-10: Zero loops, 100% compliance, tom perfeito
- 7-8: Pequenas repeticoes, compliance ok
- 5-6: Alguns loops ou pequenos erros compliance
- 3-4: Loops frequentes ou violacoes moderadas
- 0-2: Loops graves ou violacoes criticas

### 4. AVANCO PARA OBJETIVO (0-10)

O que avaliar:
- Moveu lead no funil?
- Cada mensagem tem proposito claro?
- Criou urgencia sem pressao excessiva?
- Resultado alinhado com potencial do lead?

Scoring por resultado:
- Lead quente + agendou = 10
- Lead morno + agendou = 9
- Lead morno + aqueceu bem = 8
- Lead frio + rejeitou gentil (corretamente) = 9
- Lead quente + perdeu = 3
- Lead frio + forcou agenda = 2

## RED FLAGS (ALERTAS CRITICOS)

Identifique se houve:
- Violacao de compliance (deu diagnostico, revelou valor proibido, etc)
- Loop grave (perguntou mesma coisa 3+ vezes)
- Tom inadequado (agressivo, passivo demais, robotico)
- Falha em escalar caso urgente
- Informacao inventada/incorreta
- Perda de lead quente por erro do agente
- Multiplas mensagens seguidas sem aguardar resposta

## CLASSIFICACAO FINAL

Baseado na media das 4 dimensoes (0-10):
- EXCELENTE (9.0-10): Performance excepcional
- BOM (7.5-8.9): Boa performance, pequenos ajustes
- ADEQUADO (6.0-7.4): Aceitavel, precisa melhorar
- PRECISA_ATENCAO (4.0-5.9): Problemas significativos
- CRITICO (0-3.9): Problemas graves, requer acao imediata

## OUTPUT OBRIGATORIO (JSON)

Retorne APENAS o JSON valido, sem markdown ou texto adicional:

{
  "conversa": {
    "session_id": "id da conversa",
    "agent_name": "nome do agente",
    "resultado_inferido": "agendado|aquecido|perdido|em_andamento"
  },
  "dimensoes": {
    "clareza_conducao": {
      "nota": 0-10,
      "justificativa": "explicacao breve",
      "exemplos_positivos": ["citacoes boas"],
      "exemplos_negativos": ["citacoes ruins"]
    },
    "tratamento_objecoes": {
      "nota": 0-10,
      "justificativa": "explicacao breve",
      "objecoes_identificadas": ["lista de objecoes"],
      "como_tratou": "bem|mal|nao_houve"
    },
    "loop_compliance": {
      "nota": 0-10,
      "justificativa": "explicacao breve",
      "loops_detectados": 0,
      "violacoes_compliance": ["lista se houver"],
      "tom_consistente": true/false
    },
    "avanco_objetivo": {
      "nota": 0-10,
      "justificativa": "explicacao breve",
      "moveu_funil": true/false,
      "resultado_apropriado": true/false
    }
  },
  "nota_final": {
    "valor": 0-10,
    "classificacao": "EXCELENTE|BOM|ADEQUADO|PRECISA_ATENCAO|CRITICO"
  },
  "red_flags": [
    {
      "tipo": "tipo do problema",
      "descricao": "o que aconteceu",
      "gravidade": "CRITICA|ALTA|MEDIA|BAIXA",
      "citacao": "trecho da conversa"
    }
  ],
  "destaques_positivos": [
    "lista do que o agente fez muito bem"
  ],
  "oportunidades_melhoria": [
    {
      "area": "area de melhoria",
      "sugestao": "o que fazer diferente",
      "impacto": "ALTO|MEDIO|BAIXO"
    }
  ],
  "sugestao_prompt": {
    "tem_sugestao": true/false,
    "tipo": "ADICIONAR|MODIFICAR|REMOVER",
    "secao": "qual secao do prompt ajustar",
    "descricao": "sugestao especifica para melhorar o prompt"
  },
  "resumo_executivo": "2-3 frases resumindo a performance"
}

## REGRAS

1. Seja OBJETIVO - baseie notas em evidencias da conversa
2. Seja JUSTO - considere o contexto e dificuldade da situacao
3. Seja CONSTRUTIVO - sugestoes devem ser acionaveis
4. NAO invente - se nao ha evidencia, nao pontue negativamente
5. Considere o RESULTADO - agendou? aqueceu? perdeu?
6. Red flags CRITICAS devem sempre ser reportadas
7. Retorne APENAS o JSON valido
"""

    @property
    def system_prompt(self) -> str:
        return self._SYSTEM_PROMPT

    def __init__(self, config: AgentConfig = None):
        if config is None:
            config = AgentConfig(
                name="QAAnalyzer",
                description="Analisa conversas de agentes em 4 dimensoes de qualidade",
                model="claude-sonnet-4-20250514",
                temperature=0.3,  # Mais analitico
                max_tokens=4000
            )
        super().__init__(config)

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Analisa uma conversa.

        Args:
            input_data: {
                "conversation": Dict com session_id, messages, agent_name, etc.
                "agent_context": Dict opcional com system_prompt, compliance_rules
            }
        """
        start_time = datetime.utcnow()

        try:
            conversation = input_data.get('conversation', {})
            agent_context = input_data.get('agent_context', {})

            if not conversation or not conversation.get('messages'):
                raise ValueError("Conversa vazia ou sem mensagens")

            # Montar prompt de analise
            user_message = self._build_analysis_prompt(conversation, agent_context)

            # Chamar Claude
            response_text, tokens_used = await self.call_claude(user_message)

            # Parsear resposta
            analysis = self._parse_response(response_text)

            # Adicionar metadados
            analysis['metadata'] = {
                'session_id': conversation.get('session_id'),
                'analyzed_at': datetime.utcnow().isoformat(),
                'total_messages': conversation.get('total_messages', len(conversation.get('messages', []))),
                'agent_name': conversation.get('agent_name')
            }

            # Salvar na memoria compartilhada
            self.set_in_memory('last_qa_analysis', analysis)

            result = AgentResult(
                agent_name=self.config.name,
                success=True,
                output=analysis,
                execution_time_ms=self._measure_time(start_time),
                tokens_used=tokens_used,
                model=self.config.model,
                metadata={
                    'nota_final': analysis.get('nota_final', {}).get('valor'),
                    'classificacao': analysis.get('nota_final', {}).get('classificacao'),
                    'red_flags_count': len(analysis.get('red_flags', []))
                }
            )

            self.log_execution(result)
            return result

        except Exception as e:
            logger.error(f"QAAnalyzer failed: {e}", exc_info=True)
            return AgentResult(
                agent_name=self.config.name,
                success=False,
                output={},
                execution_time_ms=self._measure_time(start_time),
                tokens_used=0,
                model=self.config.model,
                error=str(e)
            )

    def _build_analysis_prompt(self, conversation: Dict, agent_context: Dict) -> str:
        """Monta prompt para analise da conversa"""

        # Formatar historico da conversa
        messages = conversation.get('messages', [])
        historico = []

        for msg in messages:
            msg_type = msg.get('type', 'unknown').upper()
            content = msg.get('content', '')
            timestamp = msg.get('created_at', '')

            if timestamp:
                try:
                    ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    time_str = ts.strftime('%H:%M')
                except:
                    time_str = ''
            else:
                time_str = ''

            sender = 'LEAD' if msg_type == 'HUMAN' else 'AGENTE'
            historico.append(f"[{time_str}] {sender}: {content}")

        historico_formatado = '\n'.join(historico)

        # Inferir resultado
        texto_completo = ' '.join(m.get('content', '').lower() for m in messages)
        resultado = 'em_andamento'
        if any(word in texto_completo for word in ['agendado', 'confirmado', 'marcado', 'perfeito, fica']):
            resultado = 'agendado'
        elif any(word in texto_completo for word in ['nao tenho interesse', 'nao quero', 'sem interesse', 'deixa quieto']):
            resultado = 'perdido'
        elif any(word in texto_completo for word in ['depois', 'mais tarde', 'vou pensar', 'me manda']):
            resultado = 'aquecido'

        # Estatisticas
        total = len(messages)
        human = sum(1 for m in messages if m.get('type') == 'human')
        ai = total - human
        last_type = messages[-1].get('type', 'unknown') if messages else 'unknown'

        # Contexto do agente
        context_str = ""
        if agent_context:
            if agent_context.get('compliance_rules'):
                rules = agent_context['compliance_rules']
                if isinstance(rules, str):
                    try:
                        rules = json.loads(rules)
                    except:
                        pass
                proibicoes = rules.get('proibicoes', []) if isinstance(rules, dict) else []
                context_str += f"\n**Proibicoes do Agente:** {proibicoes}"

            if agent_context.get('personality_config'):
                personality = agent_context['personality_config']
                if isinstance(personality, str):
                    try:
                        personality = json.loads(personality)
                    except:
                        pass
                tom = personality.get('tom', 'N/A') if isinstance(personality, dict) else 'N/A'
                context_str += f"\n**Tom Esperado:** {tom}"

        prompt = f"""## CONVERSA A SER ANALISADA

**Agente:** {conversation.get('agent_name', 'N/A')}
**Session ID:** {conversation.get('session_id', 'N/A')}
**Resultado Inferido:** {resultado}

---

## HISTORICO DA CONVERSA

{historico_formatado}

---

## ESTATISTICAS

- Total de mensagens: {total}
- Mensagens do lead: {human}
- Mensagens do agente: {ai}
- Ultima mensagem de: {'LEAD' if last_type == 'human' else 'AGENTE'}
{context_str}

---

Analise esta conversa conforme as 4 dimensoes especificadas e retorne o JSON de avaliacao."""

        return prompt

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta JSON do Claude"""
        parsed = self._extract_json(raw_response)

        if parsed:
            # Validar campos obrigatorios
            if 'nota_final' not in parsed:
                # Calcular nota final se nao estiver presente
                dimensoes = parsed.get('dimensoes', {})
                notas = []
                for dim in ['clareza_conducao', 'tratamento_objecoes', 'loop_compliance', 'avanco_objetivo']:
                    if dim in dimensoes and 'nota' in dimensoes[dim]:
                        notas.append(dimensoes[dim]['nota'])

                if notas:
                    media = sum(notas) / len(notas)
                    parsed['nota_final'] = {
                        'valor': round(media, 1),
                        'classificacao': self._get_classificacao(media)
                    }

            return parsed

        # Fallback
        logger.warning("Could not parse QA analysis response")
        return {
            'conversa': {'resultado_inferido': 'desconhecido'},
            'dimensoes': {},
            'nota_final': {'valor': 0, 'classificacao': 'ERRO'},
            'red_flags': [],
            'oportunidades_melhoria': [],
            'sugestao_prompt': {'tem_sugestao': False},
            'resumo_executivo': 'Erro ao processar analise',
            'raw_response': raw_response[:1000]
        }

    def _get_classificacao(self, nota: float) -> str:
        """Retorna classificacao baseada na nota"""
        if nota >= 9.0:
            return 'EXCELENTE'
        elif nota >= 7.5:
            return 'BOM'
        elif nota >= 6.0:
            return 'ADEQUADO'
        elif nota >= 4.0:
            return 'PRECISA_ATENCAO'
        else:
            return 'CRITICO'

    async def analyze_batch(self, conversations: List[Dict], agent_context: Dict = None) -> List[Dict]:
        """
        Analisa multiplas conversas.

        Args:
            conversations: Lista de conversas
            agent_context: Contexto opcional do agente

        Returns:
            Lista de analises
        """
        results = []

        for conv in conversations:
            result = await self.execute({
                'conversation': conv,
                'agent_context': agent_context
            })

            if result.success:
                results.append(result.output)
            else:
                results.append({
                    'session_id': conv.get('session_id'),
                    'error': result.error,
                    'success': False
                })

        return results
