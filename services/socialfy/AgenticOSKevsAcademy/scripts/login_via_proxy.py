#!/usr/bin/env python3
"""
🔐 LOGIN VIA PROXY - Extrai Session ID com IP do Proxy
=======================================================

Uso:
    python3 login_via_proxy.py --username dr.albertocorreia --proxy-pass SUA_SENHA

O script:
1. Abre Chrome com proxy Decodo (BR)
2. Você faz login manual no Instagram
3. Extrai session_id associado ao IP do proxy
4. Salva no banco Supabase

Contas para configurar:
- dr.albertocorreia
- drthauansantos
- dra.gabrielarossmam
- draelinelobo
"""

import asyncio
import argparse
import json
import os
import sys
from datetime import datetime

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("❌ Playwright não instalado. Execute: pip install playwright && playwright install chromium")
    sys.exit(1)

# Proxy Decodo config
PROXY_HOST = "gate.decodo.com"
PROXY_PORT = 10001
PROXY_USER = "spmqvj96vr"

# Tenant mapping
TENANT_MAP = {
    "dr.albertocorreia": "dr_alberto",
    "drthauansantos": "dr_thauan",
    "dra.gabrielarossmam": "dra_gabriela",
    "draelinelobo": "dra_eline",
    "marcosdanielsf": "mottivme",
    "hallennaiane": "hallen",
}


async def login_with_proxy(username: str, proxy_password: str, tenant_id: str = None):
    """
    Abre Chrome com proxy e permite login manual.
    Extrai session_id após login.
    """

    if not tenant_id:
        tenant_id = TENANT_MAP.get(username, username.replace(".", "_"))

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║  🔐 LOGIN VIA PROXY - {username:<30}      ║
╠══════════════════════════════════════════════════════════════╣
║  Proxy: {PROXY_HOST}:{PROXY_PORT} (BR Residencial)           ║
║  Tenant: {tenant_id:<45}   ║
╚══════════════════════════════════════════════════════════════╝
""")

    async with async_playwright() as p:
        # Launch browser with proxy
        browser = await p.chromium.launch(
            headless=False,  # Visível para login manual
            proxy={
                "server": f"http://{PROXY_HOST}:{PROXY_PORT}",
                "username": PROXY_USER,
                "password": proxy_password
            },
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
            ]
        )

        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        page = await context.new_page()

        # Verificar IP do proxy
        print("🌐 Verificando IP do proxy...")
        try:
            await page.goto("https://api.ipify.org?format=json", timeout=15000)
            ip_text = await page.inner_text("body")
            ip_data = json.loads(ip_text)
            print(f"✅ IP do Proxy: {ip_data.get('ip', 'unknown')}")
        except Exception as e:
            print(f"⚠️  Não foi possível verificar IP: {e}")

        # Ir para Instagram
        print("\n📱 Abrindo Instagram...")
        await page.goto("https://www.instagram.com/accounts/login/", timeout=30000)

        print("""
╔══════════════════════════════════════════════════════════════╗
║  👆 FAÇA LOGIN MANUALMENTE NO NAVEGADOR                      ║
║                                                              ║
║  1. Digite usuário e senha da conta                          ║
║  2. Complete verificação se solicitado                       ║
║  3. Aguarde carregar a página inicial                        ║
║                                                              ║
║  Quando terminar, pressione ENTER aqui no terminal...        ║
╚══════════════════════════════════════════════════════════════╝
""")

        input("Pressione ENTER após fazer login...")

        # Aguardar um pouco para cookies serem salvos
        await asyncio.sleep(2)

        # Extrair cookies
        cookies = await context.cookies()

        # Buscar session_id
        session_id = None
        for cookie in cookies:
            if cookie["name"] == "sessionid":
                session_id = cookie["value"]
                break

        if not session_id:
            print("❌ Session ID não encontrado. Login não foi completado.")
            await browser.close()
            return None

        print(f"\n✅ Session ID extraído: {session_id[:30]}...")

        # Preparar dados para salvar
        session_data = {
            "cookies": cookies,
            "origins": []
        }

        # Gerar SQL de insert/update
        sql = f"""
-- Adicionar/Atualizar conta @{username}
INSERT INTO instagram_accounts (
    tenant_id, username, session_id, session_data,
    is_active, outreach_enabled, outreach_min_icp_score,
    outreach_daily_limit, daily_limit, hourly_limit,
    created_at, updated_at
) VALUES (
    '{tenant_id}',
    '{username}',
    '{session_id}',
    '{json.dumps(session_data).replace("'", "''")}',
    true, true, 50,
    30, 30, 5,
    NOW(), NOW()
)
ON CONFLICT (username) DO UPDATE SET
    session_id = EXCLUDED.session_id,
    session_data = EXCLUDED.session_data,
    is_active = true,
    outreach_enabled = true,
    updated_at = NOW();
"""

        # Salvar SQL em arquivo
        sql_file = f"/tmp/add_{username.replace('.', '_')}.sql"
        with open(sql_file, "w") as f:
            f.write(sql)

        print(f"""
╔══════════════════════════════════════════════════════════════╗
║  ✅ SESSÃO EXTRAÍDA COM SUCESSO!                             ║
╠══════════════════════════════════════════════════════════════╣
║  Username: @{username:<42} ║
║  Tenant: {tenant_id:<47} ║
║  Session: {session_id[:40]}...  ║
║                                                              ║
║  SQL salvo em: {sql_file:<36} ║
╚══════════════════════════════════════════════════════════════╝

Execute no Supabase SQL Editor:

{sql}
""")

        await browser.close()

        return {
            "username": username,
            "tenant_id": tenant_id,
            "session_id": session_id,
            "sql_file": sql_file
        }


async def main():
    parser = argparse.ArgumentParser(description="Login no Instagram via Proxy")
    parser.add_argument("--username", "-u", required=True, help="Username do Instagram")
    parser.add_argument("--proxy-pass", "-p", required=True, help="Senha do proxy Decodo")
    parser.add_argument("--tenant", "-t", help="Tenant ID (opcional)")

    args = parser.parse_args()

    result = await login_with_proxy(
        username=args.username,
        proxy_password=args.proxy_pass,
        tenant_id=args.tenant
    )

    if result:
        print("\n🎉 Pronto! Execute o SQL no Supabase para ativar a conta.")
    else:
        print("\n❌ Falha ao extrair sessão. Tente novamente.")


if __name__ == "__main__":
    asyncio.run(main())
