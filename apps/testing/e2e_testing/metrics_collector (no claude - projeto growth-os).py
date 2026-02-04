"""
Metrics Collector - Coleta e salva métricas no Supabase
=======================================================

IMPORTANTE: Resultados E2E são salvos na tabela `e2e_test_results`,
NÃO na tabela `agent_versions`. Cada agente é UM registro,
E2E tests são resultados de validação armazenados separadamente.

Arquitetura correta:
- agent_versions: Apenas agentes reais (Julia Amare, etc)
- e2e_test_results: Resultados de testes E2E (com FK para agent_versions)
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional
from supabase import create_client, Client

from .test_runner import TestResult, TestStatus


class MetricsCollector:
    """
    Coleta métricas dos testes E2E e salva no Supabase.

    ARQUITETURA:
    - Resultados E2E vão para `e2e_test_results` (tabela dedicada)
    - `agent_versions` só contém agentes reais
    - E2E results têm FK para agent_version_id (o agente testado)
    """

    def __init__(
        self,
        supabase_url: str = None,
        supabase_key: str = None
    ):
        self.supabase_url = supabase_url or os.getenv(
            'SUPABASE_URL',
            'https://bfumywvwubvernvhjehk.supabase.co'
        )
        self.supabase_key = supabase_key or os.getenv(
            'SUPABASE_KEY',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE'
        )
        self.client = create_client(self.supabase_url, self.supabase_key)

    def _get_agent_version_id(self, agent_name: str) -> Optional[str]:
        """
        Busca o ID do agente real pelo nome.
        Retorna o ID da versão mais recente.
        """
        try:
            result = self.client.table('agent_versions').select('id').eq(
                'agent_name', agent_name
            ).order('version', desc=True).limit(1).execute()

            if result.data:
                return result.data[0].get('id')
        except Exception as e:
            print(f"⚠️ Erro ao buscar agent_version_id: {e}")

        return None

    def save_test_result(
        self,
        result: TestResult,
        agent_name: str = "Julia",
        version: str = "e2e-test",
        location_id: str = "instituto-amare"
    ) -> str:
        """
        Salva resultado de um teste E2E na tabela e2e_test_results.

        IMPORTANTE: NÃO cria novo agent_versions.
        Usa FK para referenciar o agente real.

        Returns:
            ID do registro criado em e2e_test_results
        """
        # Buscar ID do agente real
        agent_version_id = self._get_agent_version_id(agent_name)

        # Calcular duração
        duration = None
        if result.finished_at and result.started_at:
            duration = (result.finished_at - result.started_at).total_seconds()

        record = {
            # FK para o agente real
            "agent_version_id": agent_version_id,

            # Identificação do teste
            "scenario_name": result.scenario.name,
            "scenario_description": result.scenario.description,
            "test_type": "e2e",

            # Configuração do cenário
            "lead_persona": result.scenario.lead_persona.value if hasattr(result.scenario, 'lead_persona') else None,
            "initial_agent": result.scenario.initial_agent.value if hasattr(result.scenario, 'initial_agent') else None,
            "expected_outcome": result.scenario.expected_outcome,
            "expected_handoffs": [h.value for h in result.scenario.expected_handoffs] if hasattr(result.scenario, 'expected_handoffs') else [],
            "max_turns": getattr(result.scenario, 'max_turns', 10),

            # Resultados
            "status": result.status.value,
            "actual_outcome": result.actual_outcome,
            "handoffs": result.handoffs,
            "handoff_accuracy": self._calculate_handoff_accuracy(result),

            # Métricas
            "total_turns": result.metrics.get("turns", 0),
            "total_tokens": result.metrics.get("total_tokens", 0),
            "duration_seconds": duration,
            "score": self._calculate_score(result),

            # Conversa
            "conversation": result.conversation,
            "modes_tested": getattr(result, 'modes_tested', []),
            "mode_transitions": getattr(result, 'mode_transitions', []),

            # Erro
            "error_message": result.error,

            # Metadata
            "location_id": location_id,
            "tags": getattr(result.scenario, 'tags', []),

            # Timestamps
            "started_at": result.started_at.isoformat() if result.started_at else None,
            "finished_at": result.finished_at.isoformat() if result.finished_at else None
        }

        try:
            response = self.client.table('e2e_test_results').insert(record).execute()
            if response.data:
                return response.data[0].get('id')
        except Exception as e:
            print(f"❌ Erro ao salvar em e2e_test_results: {e}")

        return None

    def save_batch_results(
        self,
        results: List[TestResult],
        agent_name: str = "Julia",
        version: str = "e2e-test",
        location_id: str = "instituto-amare"
    ) -> Dict:
        """
        Salva múltiplos resultados de teste na tabela e2e_test_results.

        IMPORTANTE: Não cria registros em agent_versions.
        Cada teste E2E vai para e2e_test_results com FK para o agente real.

        Returns:
            Dict com estatísticas do batch
        """
        saved_ids = []
        errors = []

        for result in results:
            record_id = self.save_test_result(
                result,
                agent_name,
                version,
                location_id
            )
            if record_id:
                saved_ids.append(record_id)
            else:
                errors.append(result.scenario.name)

        # Calcular estatísticas (sem salvar em agent_versions)
        summary = {
            "total_tests": len(results),
            "passed": sum(1 for r in results if r.status == TestStatus.PASSED),
            "failed": sum(1 for r in results if r.status == TestStatus.FAILED),
            "timeout": sum(1 for r in results if r.status == TestStatus.TIMEOUT),
            "error": sum(1 for r in results if r.status == TestStatus.ERROR),
            "pass_rate": sum(1 for r in results if r.status == TestStatus.PASSED) / len(results) * 100 if results else 0,
            "total_tokens": sum(r.metrics.get("total_tokens", 0) for r in results),
            "avg_turns": sum(r.metrics.get("turns", 0) for r in results) / len(results) if results else 0,
            "avg_score": self._calculate_suite_score(results)
        }

        return {
            "saved_count": len(saved_ids),
            "error_count": len(errors),
            "saved_ids": saved_ids,
            "errors": errors,
            "summary": summary
        }

    def _calculate_score(self, result: TestResult) -> float:
        """Calcula score de 0-10 para um teste"""
        score = 0.0

        # Status base (0-5 pontos)
        if result.status == TestStatus.PASSED:
            score += 5.0
        elif result.status == TestStatus.TIMEOUT:
            score += 2.0
        elif result.status == TestStatus.FAILED:
            score += 1.0

        # Handoff accuracy (0-2 pontos)
        handoff_accuracy = self._calculate_handoff_accuracy(result)
        score += handoff_accuracy * 2

        # Eficiência (turnos) (0-2 pontos)
        if result.metrics["turns"] > 0:
            expected_turns = result.scenario.max_turns / 2
            efficiency = max(0, 1 - (result.metrics["turns"] - expected_turns) / expected_turns)
            score += efficiency * 2

        # Outcome correto (0-1 ponto)
        if result.actual_outcome and result.actual_outcome == result.scenario.expected_outcome:
            score += 1.0

        return round(min(10.0, score), 1)

    def _calculate_handoff_accuracy(self, result: TestResult) -> float:
        """Calcula precisão dos handoffs (0-1)"""
        if not result.scenario.expected_handoffs:
            return 1.0

        expected = set(h.value for h in result.scenario.expected_handoffs)
        actual = set(h["to"] for h in result.handoffs)

        if not expected:
            return 1.0

        correct = len(expected.intersection(actual))
        return correct / len(expected)

    def _calculate_suite_score(self, results: List[TestResult]) -> float:
        """Calcula score médio da suite"""
        if not results:
            return 0.0

        scores = [self._calculate_score(r) for r in results]
        return round(sum(scores) / len(scores), 1)

    def get_test_history(
        self,
        location_id: str = "instituto-amare",
        limit: int = 20,
        agent_name: str = None
    ) -> List[Dict]:
        """
        Busca histórico de testes E2E da tabela e2e_test_results.

        Args:
            location_id: Filtrar por location
            limit: Número máximo de resultados
            agent_name: Filtrar por nome do agente (opcional)
        """
        try:
            query = self.client.table('e2e_test_results') \
                .select('*') \
                .eq('location_id', location_id) \
                .order('created_at', desc=True) \
                .limit(limit)

            # Filtrar por agente se especificado
            if agent_name:
                agent_id = self._get_agent_version_id(agent_name)
                if agent_id:
                    query = query.eq('agent_version_id', agent_id)

            response = query.execute()
            return response.data or []
        except Exception as e:
            print(f"❌ Erro ao buscar histórico E2E: {e}")
            return []

    def get_agent_test_summary(self, agent_name: str) -> Dict:
        """
        Retorna resumo dos testes E2E de um agente específico.
        """
        agent_id = self._get_agent_version_id(agent_name)
        if not agent_id:
            return {"error": f"Agente '{agent_name}' não encontrado"}

        try:
            response = self.client.table('e2e_test_results') \
                .select('status, score, total_tokens, duration_seconds') \
                .eq('agent_version_id', agent_id) \
                .execute()

            if not response.data:
                return {"total_tests": 0, "message": "Nenhum teste encontrado"}

            results = response.data
            passed = sum(1 for r in results if r['status'] == 'passed')
            failed = sum(1 for r in results if r['status'] == 'failed')

            return {
                "agent_name": agent_name,
                "total_tests": len(results),
                "passed": passed,
                "failed": failed,
                "pass_rate": (passed / len(results) * 100) if results else 0,
                "avg_score": sum(r['score'] or 0 for r in results) / len(results) if results else 0,
                "total_tokens": sum(r['total_tokens'] or 0 for r in results),
                "avg_duration": sum(r['duration_seconds'] or 0 for r in results) / len(results) if results else 0
            }
        except Exception as e:
            return {"error": str(e)}

    def save_conversation_to_messages(
        self,
        conversation: List[Dict],
        scenario_name: str,
        agent_name: str = "Julia",
        location_name: str = "E2E Testing",
        lead_persona: str = "hot"
    ) -> List[str]:
        """
        Salva a conversa simulada na tabela messages.
        Cada mensagem vira um registro separado.

        Returns:
            Lista de IDs das mensagens salvas
        """
        saved_ids = []
        contact_id = f"e2e-{scenario_name}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        for msg in conversation:
            is_agent = msg.get("role") == "agent"

            record = {
                "contact_id": contact_id,
                "source": "e2e_simulation",
                "sender_name": agent_name if is_agent else f"Lead Simulado ({lead_persona})",
                "sender_type": "agent" if is_agent else "lead",
                "message_type": "text",
                "message_body": msg.get("content", ""),
                "workflow_name": f"E2E Test: {scenario_name}",
                "location_name": location_name,
                "category": "e2e_test",
                "sentiment": "neutral"
            }

            # Adicionar metadata do modo se for agente
            if is_agent and msg.get("mode"):
                record["sender_tags"] = [msg.get("mode"), "e2e_test"]

            try:
                response = self.client.table('messages').insert(record).execute()
                if response.data:
                    saved_ids.append(response.data[0].get('id'))
            except Exception as e:
                print(f"⚠️ Erro ao salvar mensagem: {e}")

        return saved_ids

    def save_test_with_conversation(
        self,
        result: TestResult,
        agent_name: str = "Julia",
        version: str = "e2e-test",
        location_id: str = "instituto-amare",
        save_to_messages: bool = True
    ) -> Dict:
        """
        Salva resultado do teste E salva a conversa na tabela messages.

        Returns:
            Dict com IDs do resultado e das mensagens
        """
        # Salvar resultado normal
        result_id = self.save_test_result(result, agent_name, version, location_id)

        # Salvar conversa na tabela messages
        message_ids = []
        if save_to_messages and result.conversation:
            message_ids = self.save_conversation_to_messages(
                conversation=result.conversation,
                scenario_name=result.scenario.name,
                agent_name=agent_name,
                location_name=location_id,
                lead_persona=result.scenario.lead_persona.value if hasattr(result.scenario, 'lead_persona') else "unknown"
            )

        return {
            "result_id": result_id,
            "message_ids": message_ids,
            "messages_saved": len(message_ids)
        }

    def save_e2e_result_dashboard_format(
        self,
        result,  # RealTestResult ou GroqTestResult
        agent_name: str,
        version: str,
        location_id: str = "instituto-amare"
    ) -> str:
        """
        Salva resultado E2E na tabela e2e_test_results com validation_result
        no formato compatível com o Dashboard.

        IMPORTANTE: NÃO cria novo agent_versions!
        Salva em e2e_test_results com FK para o agente real.

        FORMATO DO validation_result (compatível com Dashboard):
        - validator.test_results[] com: name, input, score, passed, feedback, simulated_response
        - totals com: total_tokens, total_time_ms
        - sales_analysis com: classification, score
        """
        conversation = getattr(result, 'conversation', [])
        scenario = getattr(result, 'scenario', None)
        metrics = getattr(result, 'metrics', {})
        status = getattr(result, 'status', None)

        # Buscar ID do agente real
        agent_version_id = self._get_agent_version_id(agent_name)

        # Extrair info do cenário
        scenario_name = getattr(scenario, 'name', 'unknown') if scenario else 'unknown'
        scenario_desc = getattr(scenario, 'description', '') if scenario else ''
        lead_persona = getattr(scenario, 'lead_persona', None)
        lead_persona_value = lead_persona.value.upper() if lead_persona else 'UNKNOWN'
        expected_outcome = getattr(scenario, 'expected_outcome', '') if scenario else ''

        # Construir test_results a partir da conversa
        test_results = []
        test_num = 1

        for i in range(0, len(conversation) - 1, 2):
            lead_msg = conversation[i] if i < len(conversation) else None
            agent_msg = conversation[i + 1] if i + 1 < len(conversation) else None

            if lead_msg and agent_msg:
                lead_role = lead_msg.get('role', '')
                agent_role = agent_msg.get('role', '')

                if lead_role == 'lead' and agent_role == 'agent':
                    base_score = 8.0 if status and status.value == 'passed' else 6.0
                    score = min(10.0, base_score + (0.5 if test_num <= 2 else 0))

                    mode = agent_msg.get('mode', 'unknown')
                    turn = lead_msg.get('turn', test_num)

                    test_results.append({
                        "name": f"Teste {test_num}: {mode.replace('_', ' ').title()}",
                        "input": lead_msg.get('content', '')[:500],
                        "score": round(score, 1),
                        "passed": status and status.value == 'passed',
                        "feedback": f"Resposta no modo '{mode}'. Turno {turn} do fluxo E2E.",
                        "simulated_response": agent_msg.get('content', '')[:1000]
                    })
                    test_num += 1

        if not test_results:
            test_results.append({
                "name": "Teste 1: Fluxo E2E",
                "input": "Início da conversa",
                "score": 5.0 if status and status.value != 'passed' else 8.0,
                "passed": status and status.value == 'passed',
                "feedback": f"Resultado: {status.value if status else 'unknown'}",
                "simulated_response": "Conversa processada"
            })

        # Calcular métricas
        total_tokens = metrics.get('total_tokens', 0)
        turns = metrics.get('turns', len(test_results))
        duration = 0
        if hasattr(result, 'finished_at') and hasattr(result, 'started_at') and result.finished_at and result.started_at:
            duration = (result.finished_at - result.started_at).total_seconds()

        avg_score = sum(t['score'] for t in test_results) / len(test_results) if test_results else 0
        is_passed = status and status.value == 'passed'

        # Construir validation_result no formato do dashboard
        validation_result = {
            "totals": {
                "total_tokens": total_tokens,
                "total_time_ms": int(duration * 1000)
            },
            "validator": {
                "score": round(avg_score, 1),
                "status": "approved" if is_passed else "failed",
                "tokens": total_tokens,
                "time_ms": int(duration * 1000),
                "test_results": test_results
            },
            "sales_analysis": {
                "bant": None,
                "score": 70 if is_passed else 40,
                "tokens": total_tokens // 3,
                "time_ms": int(duration * 300),
                "classification": lead_persona_value
            },
            "e2e_metadata": {
                "scenario_name": scenario_name,
                "expected_outcome": expected_outcome,
                "actual_outcome": getattr(result, 'actual_outcome', None),
                "turns": turns,
                "modes_tested": getattr(result, 'modes_tested', []),
                "mode_transitions": getattr(result, 'mode_transitions', [])
            }
        }

        # Criar registro na tabela CORRETA: e2e_test_results
        record = {
            # FK para o agente real
            "agent_version_id": agent_version_id,

            # Identificação do teste
            "scenario_name": scenario_name,
            "scenario_description": scenario_desc,
            "test_type": "e2e_dashboard",

            # Configuração
            "lead_persona": lead_persona.value if lead_persona else None,
            "expected_outcome": expected_outcome,
            "max_turns": getattr(scenario, 'max_turns', 10) if scenario else 10,

            # Resultados
            "status": status.value if status else 'unknown',
            "actual_outcome": getattr(result, 'actual_outcome', None),
            "handoffs": getattr(result, 'handoffs', []),

            # Métricas
            "total_turns": turns,
            "total_tokens": total_tokens,
            "duration_seconds": duration,
            "score": round(avg_score, 1),

            # Conversa e modos
            "conversation": conversation,
            "modes_tested": getattr(result, 'modes_tested', []),
            "mode_transitions": getattr(result, 'mode_transitions', []),

            # validation_result no formato dashboard
            "validation_result": validation_result,

            # Metadata
            "model_used": getattr(result, 'model_used', None),
            "location_id": location_id,
            "tags": getattr(scenario, 'tags', []) if scenario else [],

            # Timestamps
            "started_at": result.started_at.isoformat() if hasattr(result, 'started_at') and result.started_at else None,
            "finished_at": result.finished_at.isoformat() if hasattr(result, 'finished_at') and result.finished_at else None
        }

        try:
            response = self.client.table('e2e_test_results').insert(record).execute()
            if response.data:
                return response.data[0].get('id')
        except Exception as e:
            print(f"❌ Erro ao salvar em e2e_test_results: {e}")

        return None

    def save_e2e_suite_dashboard_format(
        self,
        results: List,  # Lista de RealTestResult ou GroqTestResult
        agent_name: str,
        version: str,
        location_id: str = "instituto-amare"
    ) -> Dict:
        """
        Salva múltiplos resultados E2E na tabela e2e_test_results.

        IMPORTANTE: NÃO cria registros em agent_versions.
        Cada teste vai para e2e_test_results com FK para o agente real.

        Returns:
            Dict com estatísticas e IDs salvos
        """
        saved_ids = []
        errors = []

        for result in results:
            scenario = getattr(result, 'scenario', None)
            scenario_name = getattr(scenario, 'name', 'unknown') if scenario else 'unknown'

            record_id = self.save_e2e_result_dashboard_format(
                result=result,
                agent_name=agent_name,
                version=version,
                location_id=location_id
            )

            if record_id:
                saved_ids.append(record_id)
                print(f"   ✅ Salvo em e2e_test_results: {scenario_name} ({record_id[:8]}...)")
            else:
                errors.append(scenario_name)
                print(f"   ❌ Erro: {scenario_name}")

        # Calcular estatísticas
        passed = sum(1 for r in results if hasattr(r, 'status') and r.status and r.status.value == 'passed')
        total = len(results)

        return {
            "saved_count": len(saved_ids),
            "error_count": len(errors),
            "saved_ids": saved_ids,
            "errors": errors,
            "summary": {
                "total_tests": total,
                "passed": passed,
                "failed": total - passed,
                "pass_rate": (passed / total * 100) if total > 0 else 0
            }
        }
