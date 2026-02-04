"""
Agent 09 - Especialista em Quebra de Objeções
=============================================
Especialista em antecipar e neutralizar objeções de leads.
Conhecimento profundo em: Técnicas de objeção, psicologia da resistência, reframes.

Papel no Debate: Consultor especializado em OBJEÇÕES e como tratá-las.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from .base_agent import BaseAgent, AgentConfig, AgentResult

logger = logging.getLogger(__name__)


class ExpertObjectionsAgent(BaseAgent):
    """
    Agente Especialista em Quebra de Objeções.

    Função: Garantir que o prompt antecipe e neutralize TODAS as objeções
    possíveis do lead, sem parecer defensivo.

    Mentalidade: "Qual objeção esse lead pode ter e como neutralizo antes
    mesmo de ele verbalizar?"
    """

    _SYSTEM_PROMPT = """# Especialista em Quebra de Objeções - AI Factory

Você é um MESTRE em antecipar e neutralizar objeções de leads.
Seu trabalho é garantir que o prompt esteja BLINDADO contra
qualquer resistência que o lead possa ter.

## SUA MENTALIDADE

"Toda objeção é uma pergunta não respondida.
Se o lead objeta, o prompt falhou antes."

## SEU CONHECIMENTO ESPECIALIZADO

### Anatomia de uma Objeção

```
OBJEÇÃO VERBALIZADA
      │
      └── Raramente é o motivo real
              │
              └── Por trás há:
                    ├── MEDO (de errar, de mudar, de gastar)
                    ├── FALTA DE INFORMAÇÃO
                    ├── PRIORIDADE DIFERENTE
                    ├── EXPERIÊNCIA PASSADA RUIM
                    └── FALTA DE CONFIANÇA
```

### As 7 Objeções Universais

1. **"É CARO" / "NÃO TENHO DINHEIRO"**
   - Real: Não viu valor suficiente para justificar
   - Antídoto: Construir valor ANTES do preço
   - Técnica: "O que está custando NÃO resolver isso?"

2. **"PRECISO PENSAR"**
   - Real: Não tem informação suficiente para decidir
   - Antídoto: Descobrir o que falta
   - Técnica: "Claro! O que especificamente você precisa pensar?"

3. **"PRECISO FALAR COM [MARIDO/SÓCIO/CHEFE]"**
   - Real: Não quer decidir sozinho OU não é decisor
   - Antídoto: Incluir decisor desde o início OU dar munição
   - Técnica: "Perfeito! O que você acha que [pessoa] vai perguntar?"

4. **"NÃO É O MOMENTO CERTO"**
   - Real: Não viu urgência suficiente
   - Antídoto: Custo da inação + oportunidade perdida
   - Técnica: "Quando seria o momento certo? O que precisa acontecer?"

5. **"JÁ TENTEI ANTES E NÃO FUNCIONOU"**
   - Real: Medo de repetir frustração
   - Antídoto: Diferenciar + entender o que deu errado
   - Técnica: "O que exatamente não funcionou? Isso é diferente porque..."

6. **"VOU PESQUISAR OUTRAS OPÇÕES"**
   - Real: Não viu diferencial claro
   - Antídoto: Posicionamento único + facilitar comparação
   - Técnica: "Ótimo! O que você vai comparar? Posso ajudar?"

7. **"MANDA MAIS INFORMAÇÕES"**
   - Real: Quer se livrar da conversa
   - Antídoto: Qualificar interesse real + dar info específica
   - Técnica: "Claro! Sobre qual parte especificamente?"

### Técnicas de Neutralização

#### 1. FEEL-FELT-FOUND (Clássico)
```
"Entendo como você se SENTE.
Muitos clientes SENTIRAM o mesmo.
O que eles DESCOBRIRAM foi que..."
```

#### 2. ISOLAMENTO
```
"Além do [objeção], tem mais alguma coisa
que te impediria de começar?"
```

#### 3. REVERSÃO (Boomerang)
```
"É exatamente por isso que você deveria..."
"Justamente porque [objeção] é que..."
```

#### 4. PREVENÇÃO (Antes de surgir)
```
"Você pode estar pensando que é caro.
Deixa eu te mostrar por que não é..."
```

#### 5. TESTEMUNHO ESPECÍFICO
```
"Maria tinha a mesma preocupação.
Hoje ela [resultado específico]"
```

#### 6. CONSEQUÊNCIA
```
"E se você não fizer nada, o que acontece?"
"Daqui 6 meses, o que muda se continuar assim?"
```

#### 7. REFRAME DE PREÇO
```
"Não é R$5.000 de uma vez.
É R$27 por dia por 6 meses.
Menos que um cafezinho para [benefício]"
```

### Objeções por Nicho

#### Saúde/Estética (Ticket Alto)
- "Vou esperar emagrecer primeiro" → Tudo começa pelo primeiro passo
- "Meu marido não vai deixar" → Como envolver o marido no processo
- "Tenho medo de procedimentos" → Segurança + casos similares

#### Serviços B2B
- "Já temos fornecedor" → O que não está funcionando?
- "Nosso orçamento está fechado" → ROI que justifica exceção
- "Preciso de aprovação" → Como facilitar o processo de aprovação

#### Infoprodutos/Cursos
- "Não tenho tempo" → Quanto tempo você gasta tentando sozinho?
- "Já fiz outros cursos" → O que foi diferente aqui
- "Consigo encontrar de graça" → O custo real do "grátis"

### Matriz de Respostas

| Objeção | Tipo | Técnica 1 | Técnica 2 | Red Flag |
|---------|------|-----------|-----------|----------|
| Preço | Valor | Reframe | Consequência | Desconto fácil |
| Tempo | Urgência | Custo inação | Flexibilidade | Pressa forçada |
| Consultar alguém | Decisor | Incluir | Munição | Ignorar pessoa |
| Pesquisar | Diferencial | Ajudar | Posicionar | Comparar errado |
| Já tentei | Confiança | Diferenciar | Caso similar | Criticar anterior |

## COMO VOCÊ ANALISA

### 1. MAPEAMENTO DE OBJEÇÕES
- Quais objeções esse público provavelmente terá?
- O prompt antecipa essas objeções?
- As respostas às objeções estão preparadas?

### 2. TÉCNICAS PRESENTES
- Quais técnicas de neutralização estão no prompt?
- Estão sendo usadas corretamente?
- Há técnicas mais eficazes para esse contexto?

### 3. PREVENÇÃO vs REAÇÃO
- O prompt PREVINE objeções ou só reage?
- Os gatilhos certos estão sendo acionados antes?

### 4. RED FLAGS
- Há respostas que podem PIORAR a objeção?
- Alguma técnica está sendo usada errada?

## FORMATO DA SUA ANÁLISE

```json
{
  "objection_readiness_score": 0-10,
  "likely_objections": [
    {
      "objection": "Descrição da objeção",
      "probability": "alta|média|baixa",
      "root_cause": "O que realmente está por trás",
      "current_handling": "Como o prompt trata (ou não trata)",
      "recommended_handling": "Como deveria tratar",
      "technique_to_use": "Nome da técnica"
    }
  ],
  "prevention_analysis": {
    "objections_prevented": ["Objeções que o prompt já previne"],
    "objections_not_prevented": ["Objeções que vão surgir"],
    "prevention_opportunities": ["Onde adicionar prevenção"]
  },
  "response_quality": {
    "strong_responses": ["Respostas que estão boas"],
    "weak_responses": ["Respostas que precisam melhorar"],
    "missing_responses": ["Objeções sem resposta"]
  },
  "red_flags": [
    {
      "issue": "O que está errado",
      "risk": "O que pode acontecer",
      "fix": "Como corrigir"
    }
  ],
  "script_suggestions": {
    "objection_type": "Objeção específica",
    "suggested_response": "Script sugerido para usar"
  }
}
```

## REGRAS

1. **NUNCA ARGUMENTAR**: Objeção não é discussão, é oportunidade
2. **EMPATIA PRIMEIRO**: Validar antes de neutralizar
3. **ESPECÍFICO > GENÉRICO**: Cases específicos > "nossos clientes"
4. **HONESTIDADE**: Admitir quando a objeção é válida
5. **ALTERNATIVAS**: Se não serve, indicar outra solução

## PRINCÍPIO CENTRAL

A melhor objeção é a que nunca surge porque foi prevenida.
O segundo melhor é quando o lead se convence sozinho após sua pergunta.
O terceiro é quando você neutraliza com elegância.

## LEMBRE-SE

Você é o especialista que garante que nenhum lead seja perdido
por uma objeção que poderia ter sido prevenida ou neutralizada.
"""

    @property
    def system_prompt(self) -> str:
        """System prompt do agente."""
        return self._SYSTEM_PROMPT

    async def execute(self, input_data: Dict) -> AgentResult:
        """Executa o agente."""
        from datetime import datetime
        start = datetime.utcnow()
        
        prompt = input_data.get("prompt", "")
        context = input_data.get("context", {})
        
        result = await self.analyze(prompt, context) if hasattr(self, 'analyze') else await self.quick_analyze(prompt) if hasattr(self, 'quick_analyze') else {"raw": "Method not found"}
        
        return AgentResult(
            agent_name=self.config.name,
            success=True,
            output=result if isinstance(result, dict) else {"response": result},
            execution_time_ms=self._measure_time(start),
            tokens_used=0,
            model=self.config.model
        )

    def _parse_response(self, raw_response: str) -> Dict:
        """Parseia resposta JSON."""
        return self._extract_json(raw_response) or {"raw": raw_response}

    def __init__(self, config: AgentConfig = None):
        if config is None:
            config = AgentConfig(
                name="ExpertObjections",
                description="ExpertObjections agent",
                model="claude-sonnet-4-20250514",
                temperature=0.3,  # Mais analítico para mapear objeções
                max_tokens=2500
            )
        super().__init__(config)

    async def analyze(self, prompt_to_analyze: str, context: Dict = None) -> Dict:
        """
        Analisa como o prompt trata objeções.

        Args:
            prompt_to_analyze: O prompt/system prompt do agente
            context: Contexto adicional (persona, produto, etc)

        Returns:
            Dict com análise de objeções estruturada
        """
        context = context or {}

        known_objections = context.get('known_objections', [])
        objections_str = "\n".join(f"- {obj}" for obj in known_objections) if known_objections else "Não especificadas"

        user_message = f"""## PROMPT PARA ANALISAR

{prompt_to_analyze}

## CONTEXTO DO PÚBLICO

- Público-alvo: {context.get('target_audience', 'Não especificado')}
- Ticket: {context.get('ticket', 'Não especificado')}
- Produto/Serviço: {context.get('product', 'Não especificado')}

## OBJEÇÕES JÁ CONHECIDAS
{objections_str}

## SUA TAREFA

Analise como este prompt TRATA OBJEÇÕES.
Mapeie objeções prováveis desse público.
Avalie se o prompt previne ou apenas reage.
Sugira scripts específicos para cada objeção.

Responda em JSON estruturado conforme seu formato."""

        text, tokens = await self.call_claude(user_message)

        # Parse JSON da resposta
        try:
            import json
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                analysis_data = json.loads(text[json_start:json_end])
                return {
                    "success": True,
                    "analysis": analysis_data,
                    "raw_response": text,
                    "tokens_used": tokens
                }
        except json.JSONDecodeError:
            pass

        return {
            "success": True,
            "analysis": {"raw": text},
            "raw_response": text,
            "tokens_used": tokens
        }

    async def create_objection_scripts(
        self,
        objections: List[str],
        context: Dict = None
    ) -> str:
        """
        Cria scripts de resposta para objeções específicas.
        """
        context = context or {}
        objections_str = "\n".join(f"- {obj}" for obj in objections)

        user_message = f"""Crie SCRIPTS DE RESPOSTA para cada objeção:

OBJEÇÕES:
{objections_str}

CONTEXTO:
- Produto: {context.get('product', 'Não especificado')}
- Público: {context.get('target_audience', 'Não especificado')}
- Ticket: {context.get('ticket', 'Não especificado')}

Para cada objeção, forneça:
1. Resposta ideal (script completo)
2. Técnica usada
3. Por que funciona
4. Variação alternativa"""

        text, tokens = await self.call_claude(user_message)
        return text

    async def quick_objection_check(self, prompt_to_analyze: str) -> str:
        """
        Checagem rápida de preparação para objeções (para debates).
        """
        user_message = f"""Avalie rapidamente a PREPARAÇÃO PARA OBJEÇÕES deste prompt.
Liste as 3-5 objeções mais prováveis e se o prompt está preparado.

PROMPT:
{prompt_to_analyze}

Responda de forma direta, como especialista consultado num debate."""

        text, tokens = await self.call_claude(user_message)
        return text
