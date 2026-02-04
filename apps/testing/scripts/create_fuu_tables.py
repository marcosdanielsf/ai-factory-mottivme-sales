#!/usr/bin/env python3
"""
Script para criar tabelas FUU no Supabase
Executa SQL via psycopg2
"""

import os
import sys

# Tenta importar psycopg2, senão usa requests com a API de SQL do Supabase
try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    print("supabase-py não instalado, usando requests...")

import requests
import json

# Configuração
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

# Headers para API
headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def execute_sql_via_management_api(sql: str) -> dict:
    """Executa SQL via Supabase Management API"""
    # A Management API requer project ref e access token diferente
    # Vamos usar uma abordagem diferente: criar via REST API
    print("Tentando executar SQL...")
    return {"error": "Management API requer autenticação diferente"}

def create_table_via_rest(table_name: str, check_only: bool = False):
    """Verifica se tabela existe via REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?limit=0"
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return {"exists": True, "table": table_name}
    elif resp.status_code == 404 or "relation" in resp.text.lower():
        return {"exists": False, "table": table_name}
    else:
        return {"exists": None, "error": resp.text, "table": table_name}

def insert_follow_up_types():
    """Insere os tipos de follow-up pré-cadastrados"""
    url = f"{SUPABASE_URL}/rest/v1/fuu_follow_up_types"

    types_data = [
        # SDR
        {"code": "sdr_inbound", "name": "Follow-up Inbound", "category": "sdr", "description": "Lead que veio por trafego/organico e parou de responder", "default_max_attempts": 7, "default_interval_hours": 24},
        {"code": "sdr_proposal", "name": "Follow-up Proposta", "category": "sdr", "description": "Proposta enviada aguardando retorno", "default_max_attempts": 5, "default_interval_hours": 48},
        {"code": "sdr_demo", "name": "Follow-up Demo", "category": "sdr", "description": "Apos demonstracao, aguardando decisao", "default_max_attempts": 5, "default_interval_hours": 24},
        {"code": "sdr_cold", "name": "Follow-up Cold", "category": "sdr", "description": "Prospeccao ativa sem resposta", "default_max_attempts": 4, "default_interval_hours": 72},
        {"code": "sdr_reactivation", "name": "Reativacao de Base", "category": "sdr", "description": "Lead antigo para reativacao", "default_max_attempts": 3, "default_interval_hours": 168},

        # Clinic
        {"code": "clinic_welcome", "name": "Boas-vindas Clinica", "category": "clinic", "description": "Primeiro contato pos-cadastro", "default_max_attempts": 1, "default_interval_hours": 1},
        {"code": "clinic_reminder_24h", "name": "Lembrete 24h", "category": "clinic", "description": "Lembrete 24h antes da consulta", "default_max_attempts": 1, "default_interval_hours": 0},
        {"code": "clinic_reminder_2h", "name": "Lembrete 2h", "category": "clinic", "description": "Lembrete 2h antes da consulta", "default_max_attempts": 1, "default_interval_hours": 0},
        {"code": "clinic_noshow", "name": "No-show Consulta", "category": "clinic", "description": "Paciente nao compareceu", "default_max_attempts": 3, "default_interval_hours": 24},
        {"code": "clinic_post_procedure", "name": "Pos-procedimento", "category": "clinic", "description": "Acompanhamento apos procedimento", "default_max_attempts": 3, "default_interval_hours": 24},
        {"code": "clinic_return", "name": "Retorno Consulta", "category": "clinic", "description": "Agendar retorno", "default_max_attempts": 3, "default_interval_hours": 168},

        # Finance
        {"code": "finance_reminder_3d", "name": "Lembrete 3 dias", "category": "finance", "description": "Lembrete 3 dias antes do vencimento", "default_max_attempts": 1, "default_interval_hours": 0},
        {"code": "finance_overdue", "name": "Cobranca Atrasado", "category": "finance", "description": "Pagamento em atraso", "default_max_attempts": 5, "default_interval_hours": 72},
        {"code": "finance_thanks", "name": "Agradecimento", "category": "finance", "description": "Agradecimento apos pagamento", "default_max_attempts": 1, "default_interval_hours": 1},

        # Experience
        {"code": "exp_birthday", "name": "Aniversario", "category": "experience", "description": "Parabens de aniversario", "default_max_attempts": 1, "default_interval_hours": 0},
        {"code": "exp_holidays", "name": "Datas Comemorativas", "category": "experience", "description": "Natal, Ano Novo, etc", "default_max_attempts": 1, "default_interval_hours": 0},

        # Success
        {"code": "success_onboarding_1", "name": "Onboarding Dia 1", "category": "success", "description": "Primeiro dia do onboarding", "default_max_attempts": 1, "default_interval_hours": 24},
        {"code": "success_nps", "name": "NPS", "category": "success", "description": "Pesquisa de satisfacao", "default_max_attempts": 2, "default_interval_hours": 168},
        {"code": "success_review", "name": "Review", "category": "success", "description": "Pedir avaliacao Google/Instagram", "default_max_attempts": 2, "default_interval_hours": 72},

        # Ops
        {"code": "ops_document", "name": "Documento Pendente", "category": "ops", "description": "Solicitar documento faltante", "default_max_attempts": 3, "default_interval_hours": 48},
        {"code": "ops_contract", "name": "Contrato Pendente", "category": "ops", "description": "Aguardando assinatura", "default_max_attempts": 3, "default_interval_hours": 48},
    ]

    headers_upsert = headers.copy()
    headers_upsert["Prefer"] = "resolution=merge-duplicates,return=representation"

    results = []
    for type_data in types_data:
        resp = requests.post(url, headers=headers_upsert, json=type_data)
        if resp.status_code in [200, 201]:
            results.append({"success": True, "code": type_data["code"]})
        else:
            # Tenta com upsert
            results.append({"success": False, "code": type_data["code"], "error": resp.text[:100]})

    return results

def main():
    print("=" * 50)
    print("FUU - Follow Up Universal - Setup de Tabelas")
    print("=" * 50)

    # Verificar quais tabelas existem
    tables = [
        "fuu_follow_up_types",
        "fuu_cadences",
        "fuu_templates",
        "fuu_queue",
        "fuu_contact_dates",
        "fuu_execution_log"
    ]

    print("\n1. Verificando tabelas existentes...")
    for table in tables:
        result = create_table_via_rest(table)
        status = "✅ Existe" if result.get("exists") else "❌ Não existe"
        print(f"   {table}: {status}")

    print("\n2. As tabelas precisam ser criadas via Supabase Dashboard.")
    print("   Arquivo SQL: migrations/fuu_schema_v1.sql")
    print("\n   Passos:")
    print("   1. Acesse: https://supabase.com/dashboard/project/bfumywvwubvernvhjehk/sql")
    print("   2. Cole o conteúdo do arquivo fuu_schema_v1.sql")
    print("   3. Execute")

    # Se as tabelas já existem, tenta inserir os tipos
    types_check = create_table_via_rest("fuu_follow_up_types")
    if types_check.get("exists"):
        print("\n3. Tabela fuu_follow_up_types existe! Inserindo tipos...")
        results = insert_follow_up_types()
        success = sum(1 for r in results if r.get("success"))
        print(f"   Inseridos: {success}/{len(results)} tipos")

        # Mostrar erros se houver
        errors = [r for r in results if not r.get("success")]
        if errors:
            print("   Erros:")
            for e in errors[:5]:
                print(f"   - {e['code']}: {e.get('error', 'unknown')[:50]}")

    print("\n" + "=" * 50)
    print("Script finalizado!")

if __name__ == "__main__":
    main()
