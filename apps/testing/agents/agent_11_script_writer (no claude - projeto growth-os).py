"""
Agent 11 - Script Writer (Roteirista de Conteudo)
=================================================
Especialista em criar roteiros de audio, video e texto para follow-up de vendas.
Conhecimento profundo em: Copywriting, storytelling, gatilhos emocionais, VSL, Reels.

Papel no Growth OS: Gerar conteudo personalizado para cada etapa do funil.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class ScriptType(Enum):
    """Tipos de script que o agente pode gerar."""
    AUDIO_FOLLOWUP = "audio_followup"      # Audio 15-30s para WhatsApp
    VSL_MINI = "vsl_mini"                   # Video curto 30-60s
    STORY_REELS = "story_reels"             # Texto para Stories/Reels
    CASE_SOCIAL_PROOF = "case_social_proof" # Roteiro de cases/provas sociais


class FunnelStage(Enum):
    """Etapas do funil de vendas."""
    ATIVACAO = "ativacao"
    QUALIFICACAO = "qualificacao"
    PITCH = "pitch"
    OBJECAO = "objecao"
    FECHAMENTO = "fechamento"
    RECUPERACAO = "recuperacao"
    POS_VENDA = "pos_venda"


class ScriptWriterAgent(BaseAgent):
    """
    Agente Roteirista de Conteudo para Growth OS.

    Funcao: Gerar roteiros personalizados para diferentes formatos
    e etapas do funil de vendas.

    Mentalidade: "Qual conteudo vai mover esse lead para a proxima etapa?"
    """

    _SYSTEM_PROMPT = """# Script Writer - Growth OS / AI Factory

Voce e um ROTEIRISTA ESPECIALISTA em criar conteudo de vendas que CONVERTE.
Seu trabalho e gerar roteiros de audio, video e texto para cada etapa do funil.

## SUA MENTALIDADE

"Cada palavra deve mover o lead para a acao. Nenhuma palavra desperdicada."

## SEU CONHECIMENTO ESPECIALIZADO

### Principios de Copywriting que Voce Domina

#### 1. AIDA (Atencao, Interesse, Desejo, Acao)
- Primeiros 3 segundos: PRENDER atencao
- Proximo bloco: GERAR interesse com beneficio claro
- Desenvolvimento: CRIAR desejo com transformacao
- Final: CTA claro e irresistivel

#### 2. PAS (Problema, Agitacao, Solucao)
- Identificar a DOR do lead
- AMPLIFICAR as consequencias de nao agir
- Apresentar a SOLUCAO como unica saida

#### 3. STORYTELLING de Vendas
- ANTES: Situacao do lead antes da solucao
- CONFLITO: O problema/obstáculo
- TRANSFORMACAO: A jornada de mudanca
- DEPOIS: A vida transformada

### Gatilhos Emocionais por Etapa

| Etapa | Gatilhos Principais |
|-------|---------------------|
| Ativacao | Curiosidade, Novidade, FOMO |
| Qualificacao | Empatia, Validacao, Conexao |
| Pitch | Transformacao, Prova Social, Autoridade |
| Objecao | Seguranca, Garantia, Especificidade |
| Fechamento | Urgencia, Escassez, Medo de Perder |
| Recuperacao | Segunda Chance, Exclusividade, Empatia |
| Pos-Venda | Pertencimento, Reconhecimento, Reciprocidade |

### Formatos que Voce Domina

#### AUDIO FOLLOW-UP (15-30 segundos)
Estrutura:
```
[0-3s] GANCHO - Nome + frase que prende
[3-15s] CORPO - Motivo do contato + valor
[15-25s] CONEXAO - Personalizacao + empatia
[25-30s] CTA - Proximo passo claro
```

Regras:
- Tom conversacional, como se estivesse falando com amigo
- Usar nome do lead no inicio
- Mencionar contexto especifico (reuniao, conversa anterior, etc)
- Finalizar com pergunta ou acao clara
- Evitar jargoes corporativos

#### VSL MINI (30-60 segundos)
Estrutura:
```
[0-5s] HOOK - Frase impactante que para o scroll
[5-20s] PROBLEMA - Dor do publico amplificada
[20-40s] SOLUCAO - Apresentacao com prova social
[40-55s] BENEFICIOS - 3 resultados claros
[55-60s] CTA - Acao urgente
```

Regras:
- Primeiro frame/fala e TUDO (hook)
- Usar numeros e especificidade
- Mostrar transformacao visual (antes/depois)
- Ritmo rapido, sem enrolacao
- CTA com urgencia real

#### STORY/REELS (Texto para legenda ou fala)
Estrutura:
```
LINHA 1: Hook que gera curiosidade
LINHA 2-3: Contexto rapido
LINHA 4-5: Insight/Valor
LINHA 6: CTA ou pergunta
```

Regras:
- Maximo 150 caracteres por "slide" de story
- Usar emojis estrategicamente
- Linguagem do publico-alvo
- Cada story deve ter micro-CTA

#### CASE/PROVA SOCIAL (30-90 segundos)
Estrutura:
```
[0-10s] APRESENTACAO - Quem e o cliente (similaridade com lead)
[10-30s] ANTES - Situacao/problema antes
[30-50s] PROCESSO - O que fez/como funcionou
[50-80s] DEPOIS - Resultados especificos (numeros!)
[80-90s] PONTE - Conexao com o lead atual
```

Regras:
- Cliente deve ser SIMILAR ao lead (identificacao)
- Resultados devem ser ESPECIFICOS e verificaveis
- Incluir objecao que o cliente tinha (e superou)
- Finalizar com ponte para o lead

### Mapeamento Agente de Origem → Tom

| Agente Origem | Tom do Script |
|---------------|---------------|
| SDR | Curioso, Exploratorio, Leve |
| Scheduler | Pratico, Objetivo, Facilitador |
| Social Seller | Amigavel, Relacionamento, Valor |
| Closer | Assertivo, Confiante, Resolutivo |
| CS/Sucesso | Acolhedor, Prestativo, Celebratorio |

### Mapeamento Perfil de Lead → Linguagem

| Perfil | Linguagem |
|--------|-----------|
| Empresario/CEO | Direta, resultados, ROI |
| Profissional Liberal | Autonomia, tempo, qualidade de vida |
| Gestor/Gerente | Processos, equipe, metas |
| Empreendedor Iniciante | Oportunidade, aprendizado, comunidade |
| Dona de Casa/Influencer | Flexibilidade, autenticidade, proposito |

## COMO VOCE GERA SCRIPTS

### 1. ANALISE O CONTEXTO
- Qual etapa do funil?
- Qual agente esta pedindo?
- Qual a dor/objecao atual do lead?
- Qual o tom de voz do cliente?
- Qual o produto/servico?

### 2. ESCOLHA A ESTRUTURA
- Tipo de script solicitado
- Duracao adequada
- Gatilhos emocionais da etapa

### 3. ESCREVA O ROTEIRO
- Fala EXATA (entre aspas)
- Indicacoes de tom [entre colchetes]
- Pausas estrategicas (...)
- Enfases em MAIUSCULO

### 4. VALIDE
- Tempo de leitura/fala
- Fluxo emocional
- Clareza do CTA
- Adequacao ao tom

## FORMATO DE OUTPUT

```json
{
  "script_type": "audio_followup|vsl_mini|story_reels|case_social_proof",
  "target_stage": "etapa do funil",
  "duration_seconds": 25,
  "duration_range": "15-30s",

  "script": {
    "hook": "Frase inicial que prende atencao",
    "body": [
      "[tom] Fala exata 1",
      "[tom] Fala exata 2",
      "..."
    ],
    "cta": "Chamada para acao clara"
  },

  "full_script": "Roteiro completo em texto unico para copiar",

  "emotional_triggers_used": [
    {
      "trigger": "Nome do gatilho",
      "where": "Onde aparece no script",
      "why": "Por que foi usado"
    }
  ],

  "personalization_slots": [
    {
      "placeholder": "{{nome}}",
      "description": "Nome do lead",
      "example": "Maria"
    }
  ],

  "delivery_notes": {
    "tone": "Descricao do tom de voz",
    "pace": "Ritmo da fala",
    "emphasis": ["palavras para enfatizar"],
    "pauses": ["momentos para pausar"]
  },

  "variations": [
    {
      "scenario": "Se lead nao responder",
      "script": "Versao alternativa"
    }
  ]
}
```

## REGRAS DE OURO

1. **MENOS E MAIS**: Scripts curtos, sem enrolacao
2. **ESPECIFICIDADE VENDE**: Numeros, nomes, detalhes concretos
3. **EMOCAO PRIMEIRO**: Conectar antes de vender
4. **CTA SEMPRE**: Todo script termina com acao clara
5. **VOZ DO CLIENTE**: Usar o tom de voz da marca/pessoa
6. **PERSONALIZACAO**: Sempre incluir slots para dados do lead
7. **NATURALIDADE**: Deve soar como conversa, nao como script

## REGRAS ETICAS

- Nunca criar urgencia FALSA
- Nunca prometer resultados irreais
- Nunca manipular emocionalmente de forma nociva
- Sempre manter autenticidade da marca
- Respeitar o momento do lead

## LEMBRE-SE

Voce e o roteirista que transforma dados frios em COMUNICACAO HUMANA.
Cada script seu pode ser a diferenca entre perder e ganhar um cliente.
Escreva como se cada palavra custasse dinheiro - porque custa.
"""

    @property
    def system_prompt(self) -> str:
        """System prompt do agente."""
        return self._SYSTEM_PROMPT

    def __init__(self, config: AgentConfig = None):
        if config is None:
            config = AgentConfig(
                name="ScriptWriter",
                description="Roteirista de conteudo para follow-up de vendas",
                model="claude-sonnet-4-20250514",
                temperature=0.7,  # Mais criativo para gerar conteudo
                max_tokens=3000
            )
        super().__init__(config)

    async def execute(self, input_data: Dict) -> AgentResult:
        """
        Executa geracao de script baseado no input.

        Args:
            input_data: Dict com:
                - script_type: Tipo do script (audio_followup, vsl_mini, etc)
                - stage: Etapa do funil
                - origin_agent: Agente que solicitou
                - lead_context: Contexto do lead (dor, objecao, perfil)
                - brand_voice: Tom de voz da marca
                - product: Produto/servico

        Returns:
            AgentResult com script gerado
        """
        start = datetime.utcnow()

        script_type = input_data.get("script_type", "audio_followup")
        stage = input_data.get("stage", "ativacao")
        origin_agent = input_data.get("origin_agent", "sdr")
        lead_context = input_data.get("lead_context", {})
        brand_voice = input_data.get("brand_voice", "amigavel e profissional")
        product = input_data.get("product", "")

        result = await self.generate_script(
            script_type=script_type,
            stage=stage,
            origin_agent=origin_agent,
            lead_context=lead_context,
            brand_voice=brand_voice,
            product=product
        )

        return AgentResult(
            agent_name=self.config.name,
            success=result.get("success", False),
            output=result.get("script", {}),
            execution_time_ms=self._measure_time(start),
            tokens_used=result.get("tokens_used", 0),
            model=self.config.model,
            metadata={
                "script_type": script_type,
                "stage": stage,
                "origin_agent": origin_agent
            }
        )

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta JSON."""
        return self._extract_json(raw_response) or {"raw": raw_response}

    async def generate_script(
        self,
        script_type: str,
        stage: str,
        origin_agent: str,
        lead_context: Dict,
        brand_voice: str,
        product: str
    ) -> Dict:
        """
        Gera um script completo baseado nos parametros.

        Args:
            script_type: Tipo do script (audio_followup, vsl_mini, story_reels, case_social_proof)
            stage: Etapa do funil (ativacao, qualificacao, pitch, objecao, fechamento, recuperacao, pos_venda)
            origin_agent: Agente de origem (sdr, scheduler, social_seller, closer, cs)
            lead_context: Dict com dor, objecao, perfil do lead
            brand_voice: Tom de voz da marca
            product: Produto ou servico sendo vendido

        Returns:
            Dict com script estruturado
        """
        # Mapeamento de tipos para descricao
        type_descriptions = {
            "audio_followup": "Audio de follow-up para WhatsApp (15-30 segundos)",
            "vsl_mini": "Video de vendas curto (30-60 segundos)",
            "story_reels": "Texto para Stories/Reels do Instagram",
            "case_social_proof": "Roteiro de case/prova social (30-90 segundos)"
        }

        type_desc = type_descriptions.get(script_type, script_type)

        user_message = f"""## SOLICITACAO DE SCRIPT

### TIPO DE SCRIPT
{type_desc}

### ETAPA DO FUNIL
{stage}

### AGENTE DE ORIGEM
{origin_agent}

### CONTEXTO DO LEAD
- Dor principal: {lead_context.get('pain', 'Nao especificada')}
- Objecao atual: {lead_context.get('objection', 'Nenhuma identificada')}
- Perfil: {lead_context.get('profile', 'Nao especificado')}
- Nome (para personalizacao): {lead_context.get('name', '{{nome}}')}
- Historico: {lead_context.get('history', 'Primeiro contato')}
- Engajamento: {lead_context.get('engagement', 'Nao especificado')}

### TOM DE VOZ DA MARCA
{brand_voice}

### PRODUTO/SERVICO
{product}

## SUA TAREFA

Gere um script COMPLETO e PRONTO PARA USO.
Use o formato JSON especificado.
Inclua:
1. Script com falas EXATAS
2. Gatilhos emocionais usados e onde
3. Slots de personalizacao
4. Notas de entrega (tom, ritmo, enfases)
5. Variacoes para cenarios diferentes

Responda em JSON estruturado conforme seu formato."""

        text, tokens = await self.call_claude(user_message)

        # Parse JSON da resposta
        try:
            import json
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                script_data = json.loads(text[json_start:json_end])
                return {
                    "success": True,
                    "script": script_data,
                    "raw_response": text,
                    "tokens_used": tokens
                }
        except json.JSONDecodeError:
            pass

        return {
            "success": True,
            "script": {"raw": text},
            "raw_response": text,
            "tokens_used": tokens
        }

    async def generate_audio_followup(
        self,
        lead_name: str,
        stage: str,
        context: str,
        brand_voice: str,
        product: str
    ) -> Dict:
        """
        Atalho para gerar audio de follow-up rapidamente.

        Args:
            lead_name: Nome do lead
            stage: Etapa do funil
            context: Contexto breve (ex: "lead nao respondeu ha 2 dias")
            brand_voice: Tom de voz
            product: Produto

        Returns:
            Dict com script de audio
        """
        return await self.generate_script(
            script_type="audio_followup",
            stage=stage,
            origin_agent="sdr",
            lead_context={
                "name": lead_name,
                "history": context,
                "profile": "a definir"
            },
            brand_voice=brand_voice,
            product=product
        )

    async def generate_vsl_mini(
        self,
        target_pain: str,
        product: str,
        social_proof: str,
        brand_voice: str
    ) -> Dict:
        """
        Atalho para gerar VSL mini rapidamente.

        Args:
            target_pain: Dor principal do publico
            product: Produto/servico
            social_proof: Prova social para usar
            brand_voice: Tom de voz

        Returns:
            Dict com script de VSL
        """
        return await self.generate_script(
            script_type="vsl_mini",
            stage="pitch",
            origin_agent="social_seller",
            lead_context={
                "pain": target_pain,
                "profile": "publico geral"
            },
            brand_voice=brand_voice,
            product=f"{product}. Prova social: {social_proof}"
        )

    async def generate_story_content(
        self,
        topic: str,
        objective: str,
        brand_voice: str,
        num_slides: int = 5
    ) -> Dict:
        """
        Gera conteudo para sequencia de stories.

        Args:
            topic: Tema do conteudo
            objective: Objetivo (engajar, vender, educar)
            brand_voice: Tom de voz
            num_slides: Numero de slides desejados

        Returns:
            Dict com scripts para cada slide
        """
        user_message = f"""Gere uma sequencia de {num_slides} STORIES para Instagram.

TEMA: {topic}
OBJETIVO: {objective}
TOM DE VOZ: {brand_voice}

Para cada story, forneca:
1. Texto exato (max 150 caracteres)
2. Sugestao visual
3. Sticker/elemento interativo sugerido

Formato JSON:
{{
  "stories": [
    {{
      "slide": 1,
      "text": "texto do story",
      "visual_suggestion": "descricao visual",
      "interactive_element": "enquete/pergunta/slider/etc",
      "hook_type": "curiosidade/choque/pergunta/etc"
    }}
  ],
  "full_caption": "Legenda para post no feed com resumo",
  "cta_final": "Chamada para acao do ultimo story"
}}"""

        text, tokens = await self.call_claude(user_message)

        try:
            import json
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                story_data = json.loads(text[json_start:json_end])
                return {
                    "success": True,
                    "stories": story_data,
                    "raw_response": text,
                    "tokens_used": tokens
                }
        except json.JSONDecodeError:
            pass

        return {
            "success": True,
            "stories": {"raw": text},
            "raw_response": text,
            "tokens_used": tokens
        }

    async def generate_case_script(
        self,
        client_name: str,
        client_profile: str,
        before_situation: str,
        after_results: str,
        objection_overcome: str,
        product: str,
        brand_voice: str
    ) -> Dict:
        """
        Gera roteiro de case/prova social.

        Args:
            client_name: Nome do cliente do case
            client_profile: Perfil do cliente (para identificacao)
            before_situation: Situacao antes
            after_results: Resultados depois
            objection_overcome: Objecao que o cliente tinha
            product: Produto/servico
            brand_voice: Tom de voz

        Returns:
            Dict com roteiro de case
        """
        return await self.generate_script(
            script_type="case_social_proof",
            stage="pitch",
            origin_agent="social_seller",
            lead_context={
                "profile": client_profile,
                "pain": before_situation,
                "objection": objection_overcome,
                "history": f"Case de {client_name}. Resultados: {after_results}"
            },
            brand_voice=brand_voice,
            product=product
        )

    async def quick_script(self, prompt: str) -> str:
        """
        Geracao rapida de script em texto livre.
        Util para pedidos simples ou iteracoes.

        Args:
            prompt: Descricao do que precisa

        Returns:
            Script em texto
        """
        user_message = f"""Gere um script rapido conforme solicitado:

{prompt}

Responda com:
1. O script pronto para uso (falas exatas)
2. Duracao estimada
3. Principal gatilho emocional usado
4. CTA sugerido

Seja direto e pratico."""

        text, tokens = await self.call_claude(user_message)
        return text

    async def adapt_script_for_channel(
        self,
        original_script: str,
        target_channel: str
    ) -> Dict:
        """
        Adapta um script existente para outro canal.

        Args:
            original_script: Script original
            target_channel: Canal de destino (whatsapp, instagram, email, ligacao)

        Returns:
            Dict com script adaptado
        """
        user_message = f"""Adapte este script para o canal: {target_channel}

SCRIPT ORIGINAL:
{original_script}

REGRAS DE ADAPTACAO:
- WhatsApp: Informal, emojis ok, mensagens curtas
- Instagram: Visual, hashtags, mentions
- Email: Mais formal, estruturado, assinatura
- Ligacao: Tom conversacional, pausas, confirmacoes

Forneca:
1. Script adaptado completo
2. Mudancas principais feitas
3. Elementos especificos do canal adicionados

Formato JSON."""

        text, tokens = await self.call_claude(user_message)

        try:
            import json
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                adapted = json.loads(text[json_start:json_end])
                return {
                    "success": True,
                    "adapted_script": adapted,
                    "raw_response": text,
                    "tokens_used": tokens
                }
        except json.JSONDecodeError:
            pass

        return {
            "success": True,
            "adapted_script": {"raw": text},
            "raw_response": text,
            "tokens_used": tokens
        }
