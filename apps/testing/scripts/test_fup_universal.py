#!/usr/bin/env python3
"""
Testes para o sistema Follow Up Universal (FUU)
Valida: configs, fallbacks, prompt, tipos de follow-up
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

# Configurações
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

# Location de teste (Instituto Amar)
TEST_LOCATION_ID = "cd1uyzpJox6XPt4Vct8Y"
TEST_CONTACT_ID = "ghyElapa6ElGUXWOdBo7"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_test(name: str, passed: bool, details: str = ""):
    status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if passed else f"{Colors.RED}✗ FAIL{Colors.RESET}"
    print(f"  {status} {name}")
    if details and not passed:
        print(f"         {Colors.YELLOW}{details}{Colors.RESET}")

def print_section(title: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {title}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")

def supabase_query(table: str, select: str = "*", filters: Dict = None, single: bool = False) -> Optional[Any]:
    """Executa query no Supabase"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}"

    if filters:
        for key, value in filters.items():
            url += f"&{key}=eq.{value}"

    if single:
        headers["Accept"] = "application/vnd.pgrst.object+json"

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 406 and single:
            return None
        else:
            return None
    except Exception as e:
        return None

def supabase_rpc(function: str, params: Dict = None) -> Optional[Any]:
    """Executa RPC no Supabase"""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    url = f"{SUPABASE_URL}/rest/v1/rpc/{function}"

    try:
        response = requests.post(url, headers=headers, json=params or {})
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except Exception as e:
        return None


# ============================================================
# TESTE 1: Tabelas FUU existem
# ============================================================
def test_tables_exist():
    print_section("TESTE 1: Verificar tabelas FUU")

    results = []

    # Tabela fuu_follow_up_types (usa 'code' como chave)
    data = supabase_query("fuu_follow_up_types", "code,name", {}, False)
    passed = data is not None and len(data) > 0
    print_test("fuu_follow_up_types existe", passed, f"Encontrados: {len(data) if data else 0} tipos")
    results.append(passed)

    # Tabela fuu_agent_configs
    data = supabase_query("fuu_agent_configs", "location_id,agent_name", {}, False)
    passed = data is not None and len(data) > 0
    print_test("fuu_agent_configs existe", passed, f"Encontrados: {len(data) if data else 0} configs")
    results.append(passed)

    return all(results)


# ============================================================
# TESTE 2: Config do Instituto Amar
# ============================================================
def test_instituto_amar_config():
    print_section("TESTE 2: Config Instituto Amar")

    results = []

    # Buscar config
    data = supabase_query(
        "fuu_agent_configs",
        "*",
        {"location_id": TEST_LOCATION_ID, "is_active": "true"},
        single=True
    )

    passed = data is not None
    print_test("Config existe para location", passed)
    results.append(passed)

    if data:
        # Validar campos
        checks = [
            ("agent_name", "Isabella", data.get("agent_name")),
            ("company_name", "Instituto Amar", data.get("company_name")),
            ("tone", "friendly", data.get("tone")),
            ("use_emoji", True, data.get("use_emoji")),
            ("max_message_lines", 3, data.get("max_message_lines")),
        ]

        for field, expected, actual in checks:
            passed = actual == expected
            print_test(f"{field} = {expected}", passed, f"Atual: {actual}")
            results.append(passed)

    return all(results)


# ============================================================
# TESTE 3: Tipos de Follow-up (usa 'code' não 'type_key')
# ============================================================
def test_follow_up_types():
    print_section("TESTE 3: Tipos de Follow-up")

    results = []

    data = supabase_query("fuu_follow_up_types", "*", {}, False)

    expected_types = [
        "sdr_inbound",
        "closer",
        "concierge",
        "clinic_reminder",
        "clinic_reschedule",
        "reactivation"
    ]

    if data:
        # Usa 'code' como campo chave
        actual_types = [row.get("code") for row in data]
        print(f"    Tipos encontrados: {actual_types}")

        for type_code in expected_types:
            passed = type_code in actual_types
            print_test(f"Tipo '{type_code}' existe", passed)
            results.append(passed)

        # Verificar se tem descrição
        for row in data:
            if row.get("code") == "sdr_inbound":
                has_desc = bool(row.get("description"))
                print_test("sdr_inbound tem descrição", has_desc)
                results.append(has_desc)
                break
    else:
        print_test("Tabela tem dados", False, "Nenhum tipo encontrado")
        return False

    return all(results)


# ============================================================
# TESTE 4: Fallback para location sem config
# ============================================================
def test_fallback_no_config():
    print_section("TESTE 4: Fallback (location sem config)")

    results = []

    # Location fictícia
    fake_location = "LOCATION_QUE_NAO_EXISTE_12345"

    data = supabase_query(
        "fuu_agent_configs",
        "*",
        {"location_id": fake_location},
        single=True
    )

    # Deve retornar None (não encontrou)
    passed = data is None
    print_test("Query retorna vazio para location inexistente", passed)
    results.append(passed)

    # Simular fallback (como o n8n faria)
    fallback_config = {
        "agent_name": data.get("agent_name") if data else None or "Assistente",
        "company_name": data.get("company_name") if data else None or "Empresa",
        "tone": data.get("tone") if data else None or "casual",
        "use_emoji": True if data is None else data.get("use_emoji", True),
    }

    print_test("Fallback agent_name = 'Assistente'", fallback_config["agent_name"] == "Assistente")
    print_test("Fallback company_name = 'Empresa'", fallback_config["company_name"] == "Empresa")
    print_test("Fallback tone = 'casual'", fallback_config["tone"] == "casual")

    results.extend([
        fallback_config["agent_name"] == "Assistente",
        fallback_config["company_name"] == "Empresa",
        fallback_config["tone"] == "casual"
    ])

    return all(results)


# ============================================================
# TESTE 5: Lead de teste no tracking (usa unique_id)
# ============================================================
def test_lead_tracking():
    print_section("TESTE 5: Lead de teste no tracking")

    results = []

    # n8n_schedule_tracking usa 'unique_id' não 'contact_id'
    data = supabase_query(
        "n8n_schedule_tracking",
        "*",
        {"unique_id": TEST_CONTACT_ID},
        single=True
    )

    passed = data is not None
    print_test(f"Lead {TEST_CONTACT_ID} existe", passed)
    results.append(passed)

    if data:
        # Verificar campos
        print_test(f"location_id = {TEST_LOCATION_ID}", data.get("location_id") == TEST_LOCATION_ID)
        print_test("ativo definido", data.get("ativo") is not None, f"ativo: {data.get('ativo')}")
        print_test("source definido", data.get("source") is not None, f"source: {data.get('source')}")

        results.extend([
            data.get("location_id") == TEST_LOCATION_ID,
            data.get("ativo") is not None,
            data.get("source") is not None
        ])
    else:
        # Se não existe, criar para o teste
        print(f"    {Colors.YELLOW}Lead não encontrado. Pode ser necessário criar.{Colors.RESET}")

    return all(results)


# ============================================================
# TESTE 6: Histórico de mensagens (usa session_id)
# ============================================================
def test_message_history():
    print_section("TESTE 6: Histórico de mensagens")

    results = []

    # n8n_historico_mensagens usa 'session_id' não 'contact_id'
    # Vamos buscar qualquer mensagem recente para validar a estrutura
    data = supabase_query(
        "n8n_historico_mensagens",
        "id,session_id,message,created_at,location_id",
        {"location_id": TEST_LOCATION_ID},
        single=False
    )

    if data is None:
        # Tentar sem filtro de location
        data = supabase_query(
            "n8n_historico_mensagens",
            "id,session_id,message,created_at",
            {},
            single=False
        )

    passed = data is not None and len(data) > 0
    print_test(f"Histórico tem mensagens", passed, f"Encontradas: {len(data) if data else 0}")
    results.append(passed)

    if data and len(data) > 0:
        # Verificar estrutura da mensagem
        first_msg = data[0]
        has_session = "session_id" in first_msg
        has_message = "message" in first_msg
        print_test("Tem session_id", has_session)
        print_test("Tem message object", has_message)
        results.extend([has_session, has_message])

        # Verificar se message tem content
        msg_obj = first_msg.get("message", {})
        if isinstance(msg_obj, dict):
            has_content = "content" in msg_obj
            print_test("Message tem content", has_content)
            results.append(has_content)

    return all(results)


# ============================================================
# TESTE 7: Função RPC get_fuu_agent_config
# ============================================================
def test_rpc_function():
    print_section("TESTE 7: Função RPC get_fuu_agent_config")

    results = []

    # Testar RPC
    data = supabase_rpc("get_fuu_agent_config", {
        "p_location_id": TEST_LOCATION_ID,
        "p_follow_up_type": "sdr_inbound"
    })

    # RPC pode retornar lista ou objeto
    if isinstance(data, list) and len(data) > 0:
        data = data[0]

    passed = data is not None
    print_test("Função RPC existe e funciona", passed)
    results.append(passed)

    if data and isinstance(data, dict):
        print_test("Retorna agent_name", "agent_name" in data, f"agent_name: {data.get('agent_name')}")
        print_test("Retorna company_name", "company_name" in data)
        results.extend([
            "agent_name" in data,
            "company_name" in data
        ])
    elif data is None:
        print(f"    {Colors.YELLOW}RPC pode não existir ainda{Colors.RESET}")

    return all(results) if results else True  # Não falha se RPC não existe


# ============================================================
# TESTE 8: Workflow JSON válido
# ============================================================
def test_workflow_json():
    print_section("TESTE 8: Workflow JSON válido")

    results = []

    workflow_path = "[ GHL ] Follow Up Eterno - UNIVERSAL v3.0.json"

    try:
        with open(workflow_path, "r") as f:
            flow = json.load(f)
        print_test("JSON válido", True)
        results.append(True)
    except Exception as e:
        print_test("JSON válido", False, str(e))
        return False

    # Verificar nós essenciais
    node_names = [n.get("name") for n in flow.get("nodes", [])]

    essential_nodes = [
        "Buscar Config Agente",
        "Config Agente",
        "Assistente de follow up eterno1",
        "Informacoes Relevantes - FUP1"
    ]

    for node in essential_nodes:
        passed = node in node_names
        print_test(f"Nó '{node}' existe", passed)
        results.append(passed)

    # Verificar conexões
    connections = flow.get("connections", {})

    passed = "Buscar Config Agente" in connections
    print_test("Buscar Config Agente tem conexão de saída", passed)
    results.append(passed)

    # Verificar prompt usa Config Agente
    for node in flow.get("nodes", []):
        if node.get("name") == "Assistente de follow up eterno1":
            prompt = node.get("parameters", {}).get("options", {}).get("systemMessage", "")
            has_config = "$('Config Agente')" in prompt
            print_test("Prompt usa $('Config Agente')", has_config)
            results.append(has_config)

            # Verificar variáveis dinâmicas
            has_agent_name = "agent_name" in prompt
            has_company = "company_name" in prompt
            print_test("Prompt usa agent_name dinâmico", has_agent_name)
            print_test("Prompt usa company_name dinâmico", has_company)
            results.extend([has_agent_name, has_company])
            break

    return all(results)


# ============================================================
# TESTE 9: Simular fluxo completo
# ============================================================
def test_simulate_flow():
    print_section("TESTE 9: Simulação do Fluxo")

    results = []

    # 1. Buscar config (como n8n faria)
    config = supabase_query(
        "fuu_agent_configs",
        "*",
        {"location_id": TEST_LOCATION_ID, "follow_up_type": "sdr_inbound"},
        single=True
    )

    # 2. Aplicar fallback se necessário
    final_config = {
        "agent_name": config.get("agent_name") if config else "Assistente",
        "company_name": config.get("company_name") if config else "Empresa",
        "company_description": config.get("company_description") if config else "",
        "agent_role": config.get("agent_role") if config else "Atendente",
        "tone": config.get("tone") if config else "casual",
        "use_slang": config.get("use_slang") if config else True,
        "use_emoji": config.get("use_emoji") if config else True,
        "max_emoji": config.get("max_emoji_per_message") if config else 1,
        "max_lines": config.get("max_message_lines") if config else 3,
        "offer_value_attempt": config.get("offer_value_attempt") if config else 3,
        "breakup_attempt": config.get("breakup_attempt") if config else 5,
    }

    print_test("Config carregada", config is not None)
    results.append(config is not None)

    # 3. Validar config final
    print(f"\n    Config Final:")
    print(f"    - Agent: {final_config['agent_name']}")
    print(f"    - Company: {final_config['company_name']}")
    print(f"    - Tone: {final_config['tone']}")
    print(f"    - Max lines: {final_config['max_lines']}")

    # 4. Simular substituição no prompt
    prompt_template = "Voce e {{ agent_name }}, {{ agent_role }} da {{ company_name }}."
    prompt_filled = prompt_template.replace("{{ agent_name }}", final_config["agent_name"])
    prompt_filled = prompt_filled.replace("{{ agent_role }}", final_config["agent_role"])
    prompt_filled = prompt_filled.replace("{{ company_name }}", final_config["company_name"])

    expected = "Voce e Isabella, Atendente da Instituto Amar."
    passed = prompt_filled == expected
    print_test(f"Prompt preenchido corretamente", passed, f"Resultado: {prompt_filled}")
    results.append(passed)

    return all(results)


# ============================================================
# MAIN
# ============================================================
def main():
    print(f"\n{Colors.BOLD}{'#'*60}{Colors.RESET}")
    print(f"{Colors.BOLD}  TESTES - FOLLOW UP UNIVERSAL (FUU){Colors.RESET}")
    print(f"{Colors.BOLD}  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}")
    print(f"{Colors.BOLD}{'#'*60}{Colors.RESET}")

    tests = [
        ("Tabelas FUU", test_tables_exist),
        ("Config Instituto Amar", test_instituto_amar_config),
        ("Tipos de Follow-up", test_follow_up_types),
        ("Fallback", test_fallback_no_config),
        ("Lead Tracking", test_lead_tracking),
        ("Histórico Mensagens", test_message_history),
        ("RPC Function", test_rpc_function),
        ("Workflow JSON", test_workflow_json),
        ("Simulação Fluxo", test_simulate_flow),
    ]

    results = []

    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"\n  {Colors.RED}ERRO: {e}{Colors.RESET}")
            import traceback
            traceback.print_exc()
            results.append((name, False))

    # Resumo
    print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}  RESUMO{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")

    passed_count = sum(1 for _, p in results if p)
    total = len(results)

    for name, passed in results:
        status = f"{Colors.GREEN}✓{Colors.RESET}" if passed else f"{Colors.RED}✗{Colors.RESET}"
        print(f"  {status} {name}")

    print(f"\n{Colors.BOLD}  Total: {passed_count}/{total} testes passaram{Colors.RESET}")

    if passed_count == total:
        print(f"\n  {Colors.GREEN}{Colors.BOLD}🎉 TODOS OS TESTES PASSARAM!{Colors.RESET}\n")
        return 0
    else:
        print(f"\n  {Colors.YELLOW}{Colors.BOLD}⚠️  {total - passed_count} teste(s) com falhas{Colors.RESET}\n")
        return 1


if __name__ == "__main__":
    exit(main())
