"""
AI Factory - Persistência no Supabase
=====================================
Salva resultados de execução dos agentes no Supabase.
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional
from supabase import create_client, Client

# Credenciais do Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')


def get_client() -> Client:
    """Retorna cliente Supabase"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def save_agent_execution(
    agent_name: str,
    pipeline_name: str,
    input_data: Dict,
    output_data: Dict,
    success: bool,
    tokens_used: int,
    execution_time_ms: int,
    model: str = 'claude-opus-4-20250514',
    contact_id: str = None,
    location_id: str = None,
    metadata: Dict = None
) -> str:
    """
    Salva execução de um agente no Supabase.

    Returns:
        ID do registro criado
    """
    client = get_client()

    record = {
        'agent_name': agent_name,
        'pipeline_name': pipeline_name,
        'input_data': input_data,
        'output_data': output_data,
        'success': success,
        'tokens_used': tokens_used,
        'execution_time_ms': execution_time_ms,
        'model': model,
        'contact_id': contact_id,
        'location_id': location_id,
        'metadata': metadata or {},
        'created_at': datetime.utcnow().isoformat()
    }

    result = client.table('agent_executions').insert(record).execute()

    if result.data:
        return result.data[0].get('id')
    return None


def save_pipeline_result(
    pipeline_name: str,
    success: bool,
    total_time_ms: int,
    total_tokens: int,
    agent_results: List[Dict],
    final_output: Dict,
    errors: List[str] = None,
    contact_id: str = None,
    location_id: str = None
) -> str:
    """
    Salva resultado completo de um pipeline.

    Returns:
        ID do registro criado
    """
    client = get_client()

    record = {
        'pipeline_name': pipeline_name,
        'success': success,
        'total_time_ms': total_time_ms,
        'total_tokens': total_tokens,
        'agent_results': agent_results,
        'final_output': final_output,
        'errors': errors or [],
        'contact_id': contact_id,
        'location_id': location_id,
        'created_at': datetime.utcnow().isoformat()
    }

    result = client.table('pipeline_executions').insert(record).execute()

    if result.data:
        return result.data[0].get('id')
    return None


def save_comparison_result(
    contact_id: str,
    workflow_id: str,
    n8n_result: Dict,
    claude_result: Dict,
    metrics: Dict,
    classification_match: bool,
    score_difference: float,
    time_ratio: float,
    cost_estimate: float
) -> str:
    """
    Salva resultado de comparação n8n vs Claude.

    Returns:
        ID do registro criado
    """
    client = get_client()

    record = {
        'contact_id': contact_id,
        'workflow_id': workflow_id,
        'n8n_result': n8n_result,
        'claude_result': claude_result,
        'metrics': metrics,
        'classification_match': classification_match,
        'score_difference': score_difference,
        'time_ratio': time_ratio,
        'cost_estimate_usd': cost_estimate,
        'created_at': datetime.utcnow().isoformat()
    }

    result = client.table('comparison_results').insert(record).execute()

    if result.data:
        return result.data[0].get('id')
    return None


def get_recent_executions(
    pipeline_name: str = None,
    agent_name: str = None,
    limit: int = 10
) -> List[Dict]:
    """Busca execuções recentes"""
    client = get_client()

    query = client.table('agent_executions').select('*')

    if pipeline_name:
        query = query.eq('pipeline_name', pipeline_name)
    if agent_name:
        query = query.eq('agent_name', agent_name)

    result = query.order('created_at', desc=True).limit(limit).execute()

    return result.data or []


def get_agent_by_name(agent_name: str) -> Optional[Dict]:
    """
    Busca agente pelo nome.
    Retorna a versão mais recente.
    """
    client = get_client()

    result = client.table('agent_versions').select('*').eq('agent_name', agent_name).order('created_at', desc=True).limit(1).execute()

    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def get_latest_version_number(agent_name: str) -> str:
    """
    Retorna o número da versão mais recente de um agente.
    Ex: "1.0", "2.0", "3.1"
    """
    agent = get_agent_by_name(agent_name)
    if agent and agent.get('version'):
        return agent['version']
    return "0.0"


def increment_version(version: str) -> str:
    """
    Incrementa versão: 1.0 -> 2.0, v4.0 -> 5.0, 2.5 -> 3.0
    Remove prefixo 'v' se existir
    """
    try:
        # Remover prefixo 'v' se existir
        clean_version = version.lstrip('v')
        parts = clean_version.split('.')
        major = int(parts[0])
        return f"{major + 1}.0"
    except:
        return "1.0"


def create_new_agent_version(
    agent_name: str,
    system_prompt: str,
    business_config: Dict = None,
    test_score: float = None,
    test_results: Dict = None,
    parent_version_id: str = None,
    status: str = 'draft',
    location_id: str = None,
    client_id: str = None
) -> Optional[Dict]:
    """
    Cria uma nova versão do agente no Supabase.
    Incrementa automaticamente a versão baseado na última existente.

    Args:
        agent_name: Nome do agente (ex: "Julia Amare")
        system_prompt: O prompt do sistema completo
        business_config: Config de negócio (JSON)
        test_score: Score do teste E2E (0-10)
        test_results: Resultados detalhados dos testes
        parent_version_id: ID da versão anterior (se for evolução)
        status: draft, active, archived
        location_id: ID da location no GHL
        client_id: ID do cliente

    Returns:
        Dict com os dados da nova versão criada, ou None se falhar
    """
    client = get_client()

    # Buscar versão atual e incrementar
    current_version = get_latest_version_number(agent_name)
    new_version = increment_version(current_version)

    # Buscar dados do agente existente para herdar configs
    existing_agent = get_agent_by_name(agent_name)

    record = {
        'agent_name': agent_name,
        'version': new_version,
        'system_prompt': system_prompt,
        'business_config': business_config or (existing_agent.get('business_config') if existing_agent else {}),
        'status': status,
        'location_id': location_id or (existing_agent.get('location_id') if existing_agent else None),
        'client_id': client_id or (existing_agent.get('client_id') if existing_agent else None),
        'last_test_score': test_score,
        'last_test_at': datetime.utcnow().isoformat() if test_score else None,
        'validation_result': test_results,
        'validation_score': test_score,
        'validated_at': datetime.utcnow().isoformat() if test_score else None,
        'validation_status': 'approved' if test_score and test_score >= 8 else ('rejected' if test_score else None),
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }

    try:
        result = client.table('agent_versions').insert(record).execute()

        if result.data and len(result.data) > 0:
            print(f"✅ Nova versão criada: {agent_name} v{new_version} (ID: {result.data[0]['id']})")
            return result.data[0]
        else:
            print(f"❌ Erro ao criar versão: nenhum dado retornado")
            return None
    except Exception as e:
        print(f"❌ Erro ao criar versão no Supabase: {e}")
        return None


def update_agent_version(
    version_id: str,
    updates: Dict
) -> bool:
    """
    Atualiza uma versão existente do agente.

    Args:
        version_id: ID da versão (UUID)
        updates: Dict com campos a atualizar

    Returns:
        True se sucesso, False se falha
    """
    client = get_client()

    updates['updated_at'] = datetime.utcnow().isoformat()

    try:
        result = client.table('agent_versions').update(updates).eq('id', version_id).execute()
        return result.data is not None and len(result.data) > 0
    except Exception as e:
        print(f"❌ Erro ao atualizar versão: {e}")
        return False


def save_evolved_prompt(
    agent_name: str,
    original_prompt: str,
    improved_prompt: str,
    test_results: Dict,
    test_score: float,
    improvement_reasoning: str = None
) -> Optional[Dict]:
    """
    Salva um prompt evoluído após testes E2E.
    Cria nova versão automaticamente.

    Args:
        agent_name: Nome do agente
        original_prompt: Prompt original (antes da melhoria)
        improved_prompt: Prompt melhorado
        test_results: Resultados dos testes E2E
        test_score: Score médio dos testes
        improvement_reasoning: Explicação das melhorias feitas

    Returns:
        Dict da nova versão criada
    """
    # Buscar versão anterior para referência
    existing = get_agent_by_name(agent_name)
    parent_id = existing['id'] if existing else None

    # Criar metadata com histórico de evolução
    business_config = existing.get('business_config', {}) if existing else {}
    business_config['evolution_history'] = business_config.get('evolution_history', [])
    business_config['evolution_history'].append({
        'timestamp': datetime.utcnow().isoformat(),
        'from_version': existing.get('version') if existing else None,
        'test_score': test_score,
        'reasoning': improvement_reasoning
    })

    return create_new_agent_version(
        agent_name=agent_name,
        system_prompt=improved_prompt,
        business_config=business_config,
        test_score=test_score,
        test_results=test_results,
        parent_version_id=parent_id,
        status='draft'  # Começa como draft, precisa aprovar manualmente
    )


def get_pipeline_stats(pipeline_name: str = None) -> Dict:
    """Retorna estatísticas de execução"""
    client = get_client()

    query = client.table('pipeline_executions').select('*')

    if pipeline_name:
        query = query.eq('pipeline_name', pipeline_name)

    result = query.execute()
    executions = result.data or []

    if not executions:
        return {'total': 0}

    total = len(executions)
    successful = sum(1 for e in executions if e.get('success'))
    avg_time = sum(e.get('total_time_ms', 0) for e in executions) / total
    avg_tokens = sum(e.get('total_tokens', 0) for e in executions) / total

    return {
        'total': total,
        'successful': successful,
        'failed': total - successful,
        'success_rate': (successful / total) * 100,
        'avg_time_ms': avg_time,
        'avg_tokens': avg_tokens
    }
