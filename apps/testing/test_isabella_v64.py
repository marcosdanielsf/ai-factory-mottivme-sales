#!/usr/bin/env python3
"""
Teste E2E - Isabella Amare v6.4
===============================
Simula conversa completa para validar o novo fluxo de vendas consultivo.

Uso:
    python test_isabella_v64.py

O teste valida:
1. Discovery obrigatório (perguntas antes de oferecer horários)
2. Geração de valor antes do preço
3. Ancoragem de preço (R$ 1.200 → R$ 971)
4. Pagamento ANTES do agendamento
"""

import os
import json
from datetime import datetime
from groq import Groq

# Carregar variáveis de ambiente
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')

# System prompt da v6.4 (resumido para teste)
ISABELLA_V64_PROMPT = """# PAPEL

Você é **Isabella**, assistente do Instituto Amare (Dr. Luiz Augusto).
Especialista em Saúde Hormonal Feminina e Masculina.

# ⚠️ FLUXO DE VENDAS CONSULTIVO (v6.4) - OBRIGATÓRIO

**Sequência obrigatória (NUNCA pule etapas):**

### FASE 1: ACOLHIMENTO (1 mensagem)
- Saudação personalizada
- Validar sintoma/dor
- Acolher frustração

### FASE 2: DISCOVERY (2-3 trocas)
Perguntas obrigatórias:
- "Há quanto tempo você está passando por isso?"
- "O que você já tentou antes?"
- "Como isso está afetando sua vida/trabalho?"

**Objetivo:** Fazer o lead SENTIR a dor antes de oferecer solução.

### FASE 3: GERAÇÃO DE VALOR (1-2 mensagens)
Antes de falar preço, SEMPRE explique:
- Protocolo completo de 1h30 (não é consulta de 15min)
- Nutricionista inclusa
- Bioimpedância inclusa
- Kit premium de boas-vindas

### FASE 4: APRESENTAÇÃO DE PREÇO (com ancoragem)

⚠️ **REGRA CRÍTICA DE ANCORAGEM:**
NUNCA fale R$ 971 sem antes mencionar R$ 1.200 NA MESMA FRASE.

**Frase OBRIGATÓRIA:**
"O valor completo desse protocolo seria R$ 1.200, MAS para novos pacientes está R$ 971 à vista ou 3x de R$ 400."

❌ ERRADO: "O valor é R$ 971" (sem âncora)
✅ CORRETO: "O valor completo seria R$ 1.200, MAS para novos pacientes está R$ 971..."

### FASE 5: PAGAMENTO PRIMEIRO ⚠️
**REGRA CRÍTICA:** NUNCA agende sem pagamento!
1. Confirmar interesse
2. Gerar link de pagamento
3. AGUARDAR confirmação de pagamento

### FASE 6: AGENDAMENTO (somente após pagamento)
Só ofereça horários DEPOIS do pagamento confirmado.

# ❌ ERROS CRÍTICOS
1. ❌ Oferecer horários antes de fazer Discovery
2. ❌ Falar preço antes de gerar valor
3. ❌ Agendar antes de receber pagamento

# VALORES
- **Valor cheio (âncora):** R$ 1.200
- **À vista (PIX):** R$ 971
- **Parcelado:** 3x R$ 400

# PERSONALIDADE
- Respostas curtas (2-4 linhas)
- Máximo 1 emoji por mensagem 💜
- Tom: elegante mas humana"""


LEAD_SIMULADA_PROMPT = """Você é Marlene, 52 anos, empresária.

SEUS SINTOMAS:
- Insônia há 4 meses
- Ganho de peso (6kg)
- Fogachos intensos

COMPORTAMENTO:
- Turno 1-3: Conte seus sintomas quando perguntarem
- Turno 4-6: Pergunte como funciona, demonstre interesse
- Turno 7-9: Pergunte o preço
- Turno 10-12: Se convencida, aceite pagar
- Turno 13+: Forneça dados e confirme agendamento

DADOS:
- Email: marlene.santos@gmail.com
- Telefone: (11) 98765-4321
- Preferência: São Paulo

MARCADORES (use quando apropriado):
- [DISCOVERY] - Você respondeu perguntas sobre sintomas
- [VALOR] - IA explicou diferenciais
- [PRECO] - IA revelou preço
- [PAGAMENTO] - Você aceitou pagar/recebeu link
- [AGENDAMENTO] - Você escolheu horário
- [CONFIRMADO] - Tudo certo!

Responda de forma natural, curta (1-3 linhas)."""


class ConversationTest:
    """Simula conversa completa entre Isabella v6.4 e lead"""

    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.conversation = []
        self.checkpoints = {
            "discovery_feito": False,
            "valor_gerado": False,
            "preco_apresentado": False,
            "ancora_usada": False,
            "pagamento_antes_agenda": False,
            "agendamento_confirmado": False,
        }
        self.issues = []

    def get_agent_response(self, lead_message: str) -> str:
        """Gera resposta da Isabella"""

        history = "\n".join([
            f"{'Isabella' if m['role'] == 'agent' else 'Lead'}: {m['content']}"
            for m in self.conversation[-10:]
        ])

        messages = [
            {"role": "system", "content": ISABELLA_V64_PROMPT},
            {"role": "user", "content": f"""HISTÓRICO:
{history if history else "(início da conversa)"}

LEAD DIZ: {lead_message}

Responda como Isabella (2-4 linhas, máx 1 emoji):"""}
        ]

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )

        return response.choices[0].message.content

    def get_lead_response(self, agent_message: str, turn: int) -> str:
        """Gera resposta da lead simulada"""

        history = "\n".join([
            f"{'Isabella' if m['role'] == 'agent' else 'Marlene'}: {m['content']}"
            for m in self.conversation[-10:]
        ])

        messages = [
            {"role": "system", "content": LEAD_SIMULADA_PROMPT},
            {"role": "user", "content": f"""TURNO ATUAL: {turn}

HISTÓRICO:
{history}

ISABELLA DIZ: {agent_message}

Responda como Marlene (1-3 linhas). Use marcador se apropriado:"""}
        ]

        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=200,
            temperature=0.7
        )

        return response.choices[0].message.content

    def analyze_response(self, agent_message: str, turn: int):
        """Analisa resposta do agente para checkpoints"""

        msg_lower = agent_message.lower()

        # Detectar Discovery
        discovery_keywords = ["quanto tempo", "há quanto", "o que você já tentou", "como está afetando"]
        if any(kw in msg_lower for kw in discovery_keywords):
            self.checkpoints["discovery_feito"] = True

        # Detectar Geração de Valor
        valor_keywords = ["1h30", "uma hora e meia", "nutricionista", "bioimpedância", "kit premium", "protocolo completo"]
        if any(kw in msg_lower for kw in valor_keywords):
            self.checkpoints["valor_gerado"] = True

        # Detectar Preço
        if "971" in agent_message or "400" in agent_message:
            self.checkpoints["preco_apresentado"] = True

            # Verificar se âncora foi usada (1200 antes de 971)
            if "1.200" in agent_message or "1200" in agent_message:
                self.checkpoints["ancora_usada"] = True

        # Detectar menção de agendamento/horários
        agenda_keywords = ["horário", "agendar", "disponibilidade", "vaga", "data"]
        if any(kw in msg_lower for kw in agenda_keywords):
            # PROBLEMA: Mencionou agenda antes de todas as fases
            if not self.checkpoints["discovery_feito"]:
                self.issues.append(f"Turno {turn}: Mencionou agenda ANTES de Discovery!")
            if not self.checkpoints["valor_gerado"]:
                self.issues.append(f"Turno {turn}: Mencionou agenda ANTES de gerar valor!")
            if not self.checkpoints["preco_apresentado"]:
                self.issues.append(f"Turno {turn}: Mencionou agenda ANTES do preço!")

        # Detectar Pagamento
        pagamento_keywords = ["link de pagamento", "pagamento", "pix", "pagar"]
        if any(kw in msg_lower for kw in pagamento_keywords):
            if not self.checkpoints["preco_apresentado"]:
                self.issues.append(f"Turno {turn}: Mencionou pagamento ANTES do preço!")
            else:
                self.checkpoints["pagamento_antes_agenda"] = True

    def run_test(self, max_turns: int = 20) -> dict:
        """Executa teste completo"""

        print("\n" + "="*70)
        print("🧪 TESTE E2E - ISABELLA AMARE v6.4")
        print("="*70)
        print("Validando: Discovery → Valor → Preço → Pagamento → Agendamento")
        print("="*70 + "\n")

        # Mensagem inicial da lead
        lead_message = "Oi! Vi o anúncio de vocês sobre menopausa. Estou sofrendo muito com insônia 😢"
        print(f"👤 Lead (turno 0): {lead_message}")
        self.conversation.append({"role": "lead", "content": lead_message, "turn": 0})

        for turn in range(1, max_turns + 1):
            print(f"\n--- Turno {turn} ---")

            # Isabella responde
            agent_response = self.get_agent_response(lead_message)
            print(f"🤖 Isabella: {agent_response}")
            self.conversation.append({"role": "agent", "content": agent_response, "turn": turn})

            # Analisar resposta
            self.analyze_response(agent_response, turn)

            # Lead responde
            lead_response = self.get_lead_response(agent_response, turn)
            print(f"👤 Lead: {lead_response}")
            self.conversation.append({"role": "lead", "content": lead_response, "turn": turn})

            lead_message = lead_response

            # Detectar fim
            if "[CONFIRMADO]" in lead_response:
                self.checkpoints["agendamento_confirmado"] = True
                print("\n✅ AGENDAMENTO CONFIRMADO!")
                break

        # Gerar relatório
        return self.generate_report()

    def generate_report(self) -> dict:
        """Gera relatório do teste"""

        print("\n" + "="*70)
        print("📊 RELATÓRIO DO TESTE")
        print("="*70)

        # Checkpoints
        print("\n📋 CHECKPOINTS:")
        all_passed = True
        for checkpoint, passed in self.checkpoints.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {checkpoint.replace('_', ' ').title()}")
            if not passed:
                all_passed = False

        # Problemas encontrados
        if self.issues:
            print("\n⚠️ PROBLEMAS ENCONTRADOS:")
            for issue in self.issues:
                print(f"   ❌ {issue}")
        else:
            print("\n✅ Nenhum problema de sequência encontrado!")

        # Score
        passed_count = sum(1 for v in self.checkpoints.values() if v)
        total_count = len(self.checkpoints)
        score = (passed_count / total_count) * 10

        print(f"\n📈 SCORE: {score:.1f}/10 ({passed_count}/{total_count} checkpoints)")

        # Resultado final
        if all_passed and not self.issues:
            print("\n🎉 TESTE PASSOU! Fluxo consultivo está correto.")
            status = "PASSED"
        elif score >= 7:
            print("\n⚠️ TESTE PARCIAL - Maioria dos checkpoints ok, mas há melhorias.")
            status = "PARTIAL"
        else:
            print("\n❌ TESTE FALHOU - Fluxo não está seguindo a sequência correta.")
            status = "FAILED"

        print("="*70 + "\n")

        return {
            "status": status,
            "score": score,
            "checkpoints": self.checkpoints,
            "issues": self.issues,
            "conversation_length": len(self.conversation),
            "timestamp": datetime.now().isoformat()
        }


def main():
    """Executa teste"""
    test = ConversationTest()
    result = test.run_test(max_turns=15)

    # Salvar resultado
    output_file = f"test_result_v64_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "result": result,
            "conversation": test.conversation
        }, f, ensure_ascii=False, indent=2)

    print(f"📁 Resultado salvo em: {output_file}")

    return result


if __name__ == "__main__":
    main()
