"""
SDR Simulator - Simula a Isabella usando Groq/Llama com prompt real
"""

import os
import httpx
from typing import List, Dict, Optional
from dataclasses import dataclass

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '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')
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Supabase para buscar prompt
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')


@dataclass
class SimulationContext:
    """Contexto para simulação"""
    lead_name: str
    lead_symptom: str
    lead_ddd: str = "11"
    period: str = "tarde"


class SDRSimulator:
    """Simula a SDR Isabella usando Groq/Llama com prompt real do Supabase"""

    def __init__(self, location_id: str = "sNwLyynZWP6jEtBy1ubf"):
        self.location_id = location_id
        self.system_prompt: Optional[str] = None
        self.conversation_history: List[Dict] = []
        self.model = "llama-3.3-70b-versatile"
        self.version: Optional[str] = None

    async def load_prompt(self) -> str:
        """Carrega prompt ativo do Supabase"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/agent_versions",
                params={
                    "select": "system_prompt,version",
                    "location_id": f"eq.{self.location_id}",
                    "is_active": "eq.true",
                    "limit": "1"
                },
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}"
                }
            )

            if response.status_code != 200:
                raise Exception(f"Supabase error: {response.text}")

            data = response.json()
            if not data:
                raise Exception("Nenhum agente ativo encontrado")

            self.system_prompt = data[0]["system_prompt"]
            self.version = data[0]["version"]

            return self.version

    def _build_user_message(self, lead_message: str, context: SimulationContext) -> str:
        """Constrói user_prompt no formato que o workflow envia"""

        # Monta contexto como o n8n faria
        user_prompt = f"""<contexto_conversa>
LEAD: {context.lead_name}
CANAL: whatsapp
DDD: {context.lead_ddd}
DATA/HORA: segunda-feira, 27 de janeiro de 2026 às 14:30
ETIQUETAS: simulacao_qa
STATUS PAGAMENTO: nenhum
MODO ATIVO: sdr_inbound
</contexto_conversa>

<respostas_formulario_trafego>
VEIO POR CAMPANHA: menopausa_janeiro
PROCUROU AJUDA ANTES: sim, mas sem sucesso
SINTOMAS ATUAIS: {context.lead_symptom}
MUDANCA NO CORPO: cansaço e irritabilidade
PREFERENCIA CONSULTA: presencial
PRONTO PRA INVESTIR: sim
</respostas_formulario_trafego>

<hiperpersonalizacao>
[REGIAO {context.lead_ddd}] São Paulo capital
Unidade mais proxima: São Paulo (Indianópolis)
Saudação recomendada: "Boa {context.period}"
</hiperpersonalizacao>

<calendarios_disponiveis>
- Consultório São Paulo (Moema): ID wMuTRRn8duz58kETKTWE
- Unidade Presidente Prudente: ID NwM2y9lck8uBAlIqr0Qi
- Consulta Online (Telemedicina): ID ZXlOuF79r6rDb0ZRi5zw

Horarios: Segunda a Sexta, 9h-18h | Sabado 8h-12h
Duracao consulta: 1h30
Antecedencia minima: 15-20 dias (tempo para exames)
</calendarios_disponiveis>
"""

        # Adiciona histórico se houver
        if self.conversation_history:
            user_prompt += "\n<historico_conversa>\n"
            for msg in self.conversation_history:
                if msg["role"] == "user":
                    user_prompt += f"LEAD: {msg['content']}\n"
                else:
                    user_prompt += f"ISABELLA: {msg['content']}\n"
            user_prompt += "</historico_conversa>\n"

        user_prompt += f"""
<mensagem_atual>
LEAD: {lead_message}
</mensagem_atual>
"""
        return user_prompt

    async def respond(self, lead_message: str, context: SimulationContext) -> str:
        """Gera resposta da SDR para mensagem do lead"""

        if not self.system_prompt:
            await self.load_prompt()

        # Adiciona mensagem do lead ao histórico
        self.conversation_history.append({
            "role": "user",
            "content": lead_message
        })

        user_message = self._build_user_message(lead_message, context)

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                }
            )

            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.text}")

            data = response.json()
            sdr_response = data["choices"][0]["message"]["content"]

            # Adiciona resposta ao histórico
            self.conversation_history.append({
                "role": "assistant",
                "content": sdr_response
            })

            return sdr_response

    def get_conversation_transcript(self) -> str:
        """Retorna transcrição formatada da conversa"""
        transcript = []
        for msg in self.conversation_history:
            if msg["role"] == "user":
                transcript.append(f"LEAD: {msg['content']}")
            else:
                transcript.append(f"ISABELLA: {msg['content']}")
        return "\n\n".join(transcript)

    def reset(self):
        """Reseta histórico para nova conversa"""
        self.conversation_history = []


# Teste rápido
if __name__ == "__main__":
    import asyncio

    async def test():
        sdr = SDRSimulator()

        print("Carregando prompt...")
        version = await sdr.load_prompt()
        print(f"Prompt carregado: {version}")

        context = SimulationContext(
            lead_name="Maria",
            lead_symptom="insônia e fogachos"
        )

        # Primeira mensagem
        lead_msg = "Olá, acabei de preencher o formulário com interesse na consulta com o Dr. Luiz"
        print(f"\nLEAD: {lead_msg}")

        response = await sdr.respond(lead_msg, context)
        print(f"\nIASBELLA: {response}")

    asyncio.run(test())
