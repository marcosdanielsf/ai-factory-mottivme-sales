#!/usr/bin/env python3
"""
Testes para o sistema de Cadências FUU
Valida: cadências por canal, regras de limite, tags para áudio
"""

import json
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# Configurações
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

TEST_LOCATION_ID = "cd1uyzpJox6XPt4Vct8Y"

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
    if details:
        color = Colors.YELLOW if not passed else Colors.BLUE
        print(f"         {color}{details}{Colors.RESET}")

def print_section(title: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {title}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")

def supabase_query(table: str, select: str = "*", filters: Dict = None) -> Optional[Any]:
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}"
    if filters:
        for key, value in filters.items():
            url += f"&{key}=eq.{value}"
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

def supabase_rpc(function: str, params: Dict = None) -> Optional[Any]:
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
        return None
    except:
        return None


# ============================================================
# TESTE 1: Tabelas de Cadência existem
# ============================================================
def test_tables_exist():
    print_section("TESTE 1: Tabelas de Cadência")
    results = []

    # fuu_cadences
    data = supabase_query("fuu_cadences", "id", {})
    passed = data is not None and len(data) > 0
    print_test("fuu_cadences existe", passed, f"Registros: {len(data) if data else 0}")
    results.append(passed)

    # fuu_channel_rules
    data = supabase_query("fuu_channel_rules", "channel", {})
    passed = data is not None and len(data) > 0
    print_test("fuu_channel_rules existe", passed, f"Canais: {len(data) if data else 0}")
    results.append(passed)

    return all(results)


# ============================================================
# TESTE 2: Regras de Canal
# ============================================================
def test_channel_rules():
    print_section("TESTE 2: Regras de Canal")
    results = []

    data = supabase_query("fuu_channel_rules", "*", {})

    expected_channels = ['instagram', 'whatsapp', 'sms', 'email']

    if data:
        channels = [r.get('channel') for r in data]

        for ch in expected_channels:
            passed = ch in channels
            print_test(f"Canal '{ch}' configurado", passed)
            results.append(passed)

        # Verificar Instagram tem limite 24h
        ig_rule = next((r for r in data if r.get('channel') == 'instagram'), None)
        if ig_rule:
            passed = ig_rule.get('max_hours_after_last_interaction') == 24
            print_test("Instagram limite = 24h", passed, f"Atual: {ig_rule.get('max_hours_after_last_interaction')}")
            results.append(passed)

        # WhatsApp sem limite
        wa_rule = next((r for r in data if r.get('channel') == 'whatsapp'), None)
        if wa_rule:
            passed = wa_rule.get('max_hours_after_last_interaction') is None
            print_test("WhatsApp sem limite de tempo", passed)
            results.append(passed)

    return all(results)


# ============================================================
# TESTE 3: Cadências WhatsApp
# ============================================================
def test_cadences_whatsapp():
    print_section("TESTE 3: Cadências WhatsApp (Instituto Amar)")
    results = []

    data = supabase_query(
        "fuu_cadences",
        "*",
        {"location_id": TEST_LOCATION_ID, "channel": "whatsapp"}
    )

    if data:
        # Ordenar por attempt
        data = sorted(data, key=lambda x: x.get('attempt_number', 0))

        print(f"    Cadências encontradas: {len(data)}")

        for cadence in data:
            attempt = cadence.get('attempt_number')
            msg_type = cadence.get('message_type')
            interval = cadence.get('interval_minutes')
            tag = cadence.get('tag_to_add')

            info = f"Intervalo: {interval}min, Tipo: {msg_type}"
            if tag:
                info += f", Tag: {tag}"

            passed = msg_type in ['ai_text', 'tag', 'template']
            print_test(f"Tentativa {attempt}", passed, info)
            results.append(passed)

        # Verificar se tem tag na tentativa 3
        attempt_3 = next((c for c in data if c.get('attempt_number') == 3), None)
        if attempt_3:
            passed = attempt_3.get('message_type') == 'tag'
            print_test("Tentativa 3 = tag (áudio)", passed, f"tag: {attempt_3.get('tag_to_add')}")
            results.append(passed)

    return all(results)


# ============================================================
# TESTE 4: Cadências Instagram
# ============================================================
def test_cadences_instagram():
    print_section("TESTE 4: Cadências Instagram (Instituto Amar)")
    results = []

    data = supabase_query(
        "fuu_cadences",
        "*",
        {"location_id": TEST_LOCATION_ID, "channel": "instagram"}
    )

    if data:
        data = sorted(data, key=lambda x: x.get('attempt_number', 0))

        print(f"    Cadências encontradas: {len(data)}")

        for cadence in data:
            attempt = cadence.get('attempt_number')
            msg_type = cadence.get('message_type')
            interval = cadence.get('interval_minutes')
            channel_max = cadence.get('channel_max_hours')

            info = f"Intervalo: {interval}min, Limite: {channel_max}h"
            print_test(f"Tentativa {attempt}", True, info)

        # Verificar limite 24h em todas
        all_have_limit = all(c.get('channel_max_hours') == 24 for c in data)
        print_test("Todas têm limite 24h", all_have_limit)
        results.append(all_have_limit)

    return all(results) if results else True


# ============================================================
# TESTE 5: Função RPC get_fuu_cadence
# ============================================================
def test_rpc_get_cadence():
    print_section("TESTE 5: Função get_fuu_cadence")
    results = []

    # Testar WhatsApp tentativa 1
    data = supabase_rpc("get_fuu_cadence", {
        "p_location_id": TEST_LOCATION_ID,
        "p_follow_up_type": "sdr_inbound",
        "p_channel": "whatsapp",
        "p_attempt": 1
    })

    if isinstance(data, list) and len(data) > 0:
        data = data[0]

    passed = data is not None
    print_test("RPC funciona (WhatsApp T1)", passed)
    results.append(passed)

    if data:
        print_test("Retorna message_type", "message_type" in data, f"Tipo: {data.get('message_type')}")
        print_test("Retorna interval_minutes", "interval_minutes" in data, f"Intervalo: {data.get('interval_minutes')}")
        results.append("message_type" in data)
        results.append("interval_minutes" in data)

    # Testar WhatsApp tentativa 3 (deve ser tag)
    data = supabase_rpc("get_fuu_cadence", {
        "p_location_id": TEST_LOCATION_ID,
        "p_follow_up_type": "sdr_inbound",
        "p_channel": "whatsapp",
        "p_attempt": 3
    })

    if isinstance(data, list) and len(data) > 0:
        data = data[0]

    if data:
        passed = data.get('message_type') == 'tag'
        print_test("WhatsApp T3 = tag", passed, f"tag: {data.get('tag_to_add')}")
        results.append(passed)

    return all(results)


# ============================================================
# TESTE 6: Função check_channel_limit
# ============================================================
def test_rpc_check_limit():
    print_section("TESTE 6: Função check_channel_limit")
    results = []

    # Instagram há 10 horas = OK
    data = supabase_rpc("check_channel_limit", {
        "p_channel": "instagram",
        "p_last_lead_interaction": (datetime.now() - timedelta(hours=10)).isoformat()
    })

    passed = data == True
    print_test("Instagram 10h atrás = OK", passed, f"Resultado: {data}")
    results.append(passed)

    # Instagram há 30 horas = BLOQUEADO
    data = supabase_rpc("check_channel_limit", {
        "p_channel": "instagram",
        "p_last_lead_interaction": (datetime.now() - timedelta(hours=30)).isoformat()
    })

    passed = data == False
    print_test("Instagram 30h atrás = BLOQUEADO", passed, f"Resultado: {data}")
    results.append(passed)

    # WhatsApp qualquer hora = OK
    data = supabase_rpc("check_channel_limit", {
        "p_channel": "whatsapp",
        "p_last_lead_interaction": (datetime.now() - timedelta(hours=100)).isoformat()
    })

    passed = data == True
    print_test("WhatsApp 100h atrás = OK", passed, f"Resultado: {data}")
    results.append(passed)

    return all(results)


# ============================================================
# TESTE 7: Simulação de Fluxo
# ============================================================
def test_simulate_flow():
    print_section("TESTE 7: Simulação de Fluxo")
    results = []

    print("\n    Simulando lead WhatsApp, tentativa 3:")

    # 1. Buscar cadência
    cadence = supabase_rpc("get_fuu_cadence", {
        "p_location_id": TEST_LOCATION_ID,
        "p_follow_up_type": "sdr_inbound",
        "p_channel": "whatsapp",
        "p_attempt": 3
    })

    if isinstance(cadence, list) and len(cadence) > 0:
        cadence = cadence[0]

    if cadence:
        msg_type = cadence.get('message_type')
        tag = cadence.get('tag_to_add')

        print(f"    - message_type: {msg_type}")
        print(f"    - tag_to_add: {tag}")

        # Se tag, não precisa IA
        if msg_type == 'tag':
            print(f"\n    {Colors.GREEN}→ AÇÃO: Adicionar tag '{tag}' no GHL{Colors.RESET}")
            print(f"    {Colors.GREEN}→ GHL dispara áudio automaticamente{Colors.RESET}")
            passed = True
        else:
            print(f"\n    {Colors.BLUE}→ AÇÃO: Gerar mensagem com IA{Colors.RESET}")
            passed = msg_type == 'ai_text'

        print_test("Fluxo correto para T3", passed)
        results.append(passed)

    print("\n    Simulando lead Instagram, há 25h sem resposta:")

    # Verificar limite
    within_limit = supabase_rpc("check_channel_limit", {
        "p_channel": "instagram",
        "p_last_lead_interaction": (datetime.now() - timedelta(hours=25)).isoformat()
    })

    if within_limit == False:
        print(f"\n    {Colors.YELLOW}→ BLOQUEADO: Passou 24h do Instagram{Colors.RESET}")
        print(f"    {Colors.YELLOW}→ Não envia mensagem{Colors.RESET}")
        print_test("Instagram bloqueado após 24h", True)
        results.append(True)
    else:
        print_test("Instagram bloqueado após 24h", False, "Deveria bloquear")
        results.append(False)

    return all(results)


# ============================================================
# MAIN
# ============================================================
def main():
    print(f"\n{Colors.BOLD}{'#'*60}{Colors.RESET}")
    print(f"{Colors.BOLD}  TESTES - FUU CADÊNCIAS{Colors.RESET}")
    print(f"{Colors.BOLD}  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.RESET}")
    print(f"{Colors.BOLD}{'#'*60}{Colors.RESET}")

    tests = [
        ("Tabelas Cadência", test_tables_exist),
        ("Regras de Canal", test_channel_rules),
        ("Cadências WhatsApp", test_cadences_whatsapp),
        ("Cadências Instagram", test_cadences_instagram),
        ("RPC get_fuu_cadence", test_rpc_get_cadence),
        ("RPC check_channel_limit", test_rpc_check_limit),
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
        print(f"  {Colors.YELLOW}Rode a migration primeiro:{Colors.RESET}")
        print(f"  {Colors.BLUE}cat migrations/008_fuu_cadences.sql{Colors.RESET}\n")
        return 1


if __name__ == "__main__":
    exit(main())
