#!/usr/bin/env python3
"""
AI Quality Judge Agent
Executa testes de qualidade e gera scores 0-10 seguindo o contrato do Dashboard
"""

import os
import json
import time
from datetime import datetime
from typing import Dict, Any
from anthropic import Anthropic
from supabase import create_client, Client

# Configuração
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
claude = Anthropic(api_key=ANTHROPIC_API_KEY)

class AIJudge:
    """Agente responsável por avaliar qualidade de prompts e conversas"""

    def __init__(self):
        self.model = "claude-opus-4-5-20251101"
        self.test_scenarios = self._load_test_scenarios()

    def _load_test_scenarios(self) -> list:
        """Carrega cenários de teste do Supabase ou arquivo local"""
        # TODO: Buscar de factory_artifacts tipo='test_scenario'
        return [
            {
                "scenario": "Cliente com orçamento limitado",
                "user_message": "Quanto custa? Tá muito caro...",
                "expected_behavior": "Empatia + oferta de opções flexíveis"
            },
            {
                "scenario": "Cliente indeciso",
                "user_message": "Não sei se é para mim...",
                "expected_behavior": "Fazer perguntas qualificadoras + demonstrar valor"
            },
            {
                "scenario": "Cliente pronto para comprar",
                "user_message": "Ok, pode agendar a call!",
                "expected_behavior": "Confirmar disponibilidade + enviar link"
            }
        ]

    def evaluate_version(self, version_id: str) -> Dict[str, Any]:
        """
        Avalia uma versão de agente e retorna scores detalhados
        """
        start_time = time.time()

        # 1. Buscar a versão no Supabase
        version_data = supabase.table("agent_versions").select("*").eq("id", version_id).single().execute()
        version = version_data.data

        system_prompt = version["system_prompt"]

        # 2. Executar testes para cada cenário
        scenario_results = []
        for scenario in self.test_scenarios:
            result = self._test_scenario(system_prompt, scenario)
            scenario_results.append(result)

        # 3. Calcular scores agregados
        avg_scores = self._calculate_aggregate_scores(scenario_results)

        # 4. Preparar output no formato do contrato
        execution_time_ms = int((time.time() - start_time) * 1000)

        test_result = {
            "agent_version_id": version_id,
            "score_overall": avg_scores["overall"],
            "score_dimensions": {
                "tone": avg_scores["tone"],
                "engagement": avg_scores["engagement"],
                "compliance": avg_scores["compliance"],
                "accuracy": avg_scores["accuracy"],
                "empathy": avg_scores["empathy"],
                "efficiency": avg_scores["efficiency"]
            },
            "total_tests": len(self.test_scenarios),
            "passed_tests": sum(1 for r in scenario_results if r["passed"]),
            "failed_tests": sum(1 for r in scenario_results if not r["passed"]),
            "status": "completed",
            "execution_time_ms": execution_time_ms,
            "created_by": "system",
            "created_at": datetime.utcnow().isoformat()
        }

        # 5. Salvar no Supabase
        self._save_test_result(test_result)

        # 6. Atualizar métricas da versão
        self._update_version_metrics(version_id, avg_scores)

        return test_result

    def _test_scenario(self, system_prompt: str, scenario: Dict) -> Dict:
        """Testa um cenário específico usando Claude Opus 4.5"""

        # Simular conversa
        response = claude.messages.create(
            model=self.model,
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {"role": "user", "content": scenario["user_message"]}
            ]
        )

        agent_response = response.content[0].text

        # Avaliar a resposta com outro prompt Claude (AI Judge)
        judge_prompt = f"""
Você é um avaliador de qualidade de conversas de vendas.

**Cenário:** {scenario['scenario']}
**Mensagem do usuário:** {scenario['user_message']}
**Resposta do agente:** {agent_response}
**Comportamento esperado:** {scenario['expected_behavior']}

Avalie a resposta do agente em uma escala de 0 a 10 para cada dimensão:
- **tone**: Tom de voz (cordial, profissional, empático)
- **engagement**: Capacidade de engajar e manter interesse
- **compliance**: Aderência ao script e comportamento esperado
- **accuracy**: Precisão das informações fornecidas
- **empathy**: Demonstração de empatia
- **efficiency**: Objetividade e eficiência na comunicação

Retorne APENAS um JSON neste formato:
{{
  "tone": 8.5,
  "engagement": 9.0,
  "compliance": 7.5,
  "accuracy": 10.0,
  "empathy": 8.0,
  "efficiency": 7.0,
  "overall": 8.3,
  "passed": true,
  "feedback": "Breve feedback sobre a resposta"
}}
"""

        judge_response = claude.messages.create(
            model=self.model,
            max_tokens=512,
            messages=[
                {"role": "user", "content": judge_prompt}
            ]
        )

        # Parsear JSON da resposta
        scores = json.loads(judge_response.content[0].text)
        return scores

    def _calculate_aggregate_scores(self, results: list) -> Dict[str, float]:
        """Calcula médias dos scores de todos os cenários"""
        dimensions = ["tone", "engagement", "compliance", "accuracy", "empathy", "efficiency", "overall"]

        aggregated = {}
        for dim in dimensions:
            scores = [r[dim] for r in results if dim in r]
            aggregated[dim] = round(sum(scores) / len(scores), 2) if scores else 0.0

        return aggregated

    def _save_test_result(self, result: Dict):
        """Salva resultado em agenttest_runs"""
        supabase.table("agenttest_runs").insert(result).execute()
        print(f"✅ Test result saved: {result['score_overall']}/10")

    def _update_version_metrics(self, version_id: str, scores: Dict):
        """Atualiza métricas agregadas na agent_versions"""

        # Buscar testes existentes para calcular nova média
        existing_tests = supabase.table("agenttest_runs").select("score_overall, score_dimensions").eq("agent_version_id", version_id).execute()

        all_scores = [t["score_overall"] for t in existing_tests.data if t.get("score_overall")]
        all_scores.append(scores["overall"])

        new_avg_overall = round(sum(all_scores) / len(all_scores), 2)

        # Calcular médias por dimensão
        dimension_keys = ["tone", "engagement", "compliance", "accuracy", "empathy", "efficiency"]
        new_avg_dimensions = {}

        for dim in dimension_keys:
            dim_scores = []
            for test in existing_tests.data:
                if test.get("score_dimensions") and test["score_dimensions"].get(dim):
                    dim_scores.append(test["score_dimensions"][dim])
            dim_scores.append(scores[dim])
            new_avg_dimensions[dim] = round(sum(dim_scores) / len(dim_scores), 2)

        # Atualizar agent_versions
        supabase.table("agent_versions").update({
            "avg_score_overall": new_avg_overall,
            "avg_score_dimensions": new_avg_dimensions,
            "total_test_runs": len(all_scores),
            "last_test_at": datetime.utcnow().isoformat()
        }).eq("id", version_id).execute()

        print(f"📊 Version metrics updated: avg={new_avg_overall}/10, total_tests={len(all_scores)}")

def monitor_pending_approvals():
    """Loop infinito que monitora versões pendentes e executa testes automaticamente"""
    judge = AIJudge()

    print("🤖 AI Judge Agent running... Monitoring pending approvals")

    while True:
        try:
            # Buscar versões com status 'pending_approval'
            pending = supabase.table("agent_versions").select("id, version_number, agent_id").eq("status", "pending_approval").execute()

            if pending.data:
                print(f"🔍 Found {len(pending.data)} versions pending approval")

                for version in pending.data:
                    print(f"⚙️ Testing version {version['version_number']}...")
                    judge.evaluate_version(version["id"])

                    # Atualizar status para 'ready_for_human_approval'
                    supabase.table("agent_versions").update({
                        "status": "ready_for_human_approval"
                    }).eq("id", version["id"]).execute()

                    print(f"✅ Version {version['version_number']} ready for approval!")

            # Aguardar 30 segundos antes de verificar novamente
            time.sleep(30)

        except Exception as e:
            print(f"❌ Error in monitoring loop: {e}")
            time.sleep(60)

if __name__ == "__main__":
    monitor_pending_approvals()
