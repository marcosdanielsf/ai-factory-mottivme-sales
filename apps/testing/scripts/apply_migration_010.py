#!/usr/bin/env python3
"""
Script para aplicar a migration 010 - Fix link cobranca
Corrige o prompt da Isabella para incluir o link na resposta
"""

import os
from supabase import create_client

# Configuração
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

# Textos antigos e novos
OLD_SYSTEM_PROMPT_PART = '''4. Aguarde o link ser enviado automaticamente

⚠️ **MÁXIMO 1 CHAMADA por conversa!**
Se já gerou → "Acabei de enviar o link de pagamento! Confere aí 💜"'''

NEW_SYSTEM_PROMPT_PART = '''4. **INCLUIR O LINK NA RESPOSTA**: Quando a ferramenta retornar, copie o campo "link" do JSON e inclua na sua mensagem!

⚠️ **REGRA CRÍTICA DE LINK:**
Quando a ferramenta retornar o link, você DEVE incluí-lo na sua mensagem assim:
"Prontinho! Segue o link de pagamento: [LINK_DA_FERRAMENTA] 💜"

❌ ERRADO: "Acabei de enviar o link" (sem incluir o link)
✅ CORRETO: "Prontinho! Segue o link: https://www.asaas.com/i/xxx 💜"

⚠️ **MÁXIMO 1 CHAMADA por conversa!**
Se já gerou → Reenvie o mesmo link da resposta anterior'''

OLD_SDR_PART = '''3. Informar: "Vou gerar seu link de pagamento agora! 💜"

✅ Gerar link quando:'''

NEW_SDR_PART = '''3. **INCLUIR O LINK NA RESPOSTA**: A ferramenta retorna um JSON com o campo "link". Você DEVE copiar esse link e incluir na sua mensagem!

⚠️ **REGRA CRÍTICA DE LINK:**
"Prontinho! Segue o link de pagamento: [LINK_DA_FERRAMENTA] 💜"

❌ ERRADO: "Acabei de enviar o link" (sem incluir o link)
✅ CORRETO: "Prontinho! Segue o link: https://www.asaas.com/i/xxx 💜"

✅ Gerar link quando:'''


def main():
    print("🔧 Migration 010: Fix Link Cobrança")
    print("=" * 50)

    # Conectar ao Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Buscar Isabella ativa
    print("\n📥 Buscando Isabella Amare ativa...")
    response = supabase.table("agent_versions").select("*").eq("agent_name", "Isabella Amare").eq("is_active", True).execute()

    if not response.data:
        print("❌ Nenhuma Isabella Amare ativa encontrada!")
        return

    agent = response.data[0]
    agent_id = agent.get("id")
    print(f"✅ Encontrada: {agent['agent_name']} v{agent['version']}")
    print(f"   ID: {agent_id}")
    print(f"   Location: {agent.get('location_id')}")

    # Verificar se já foi atualizada
    system_prompt = agent.get("system_prompt", "")
    if "INCLUIR O LINK NA RESPOSTA" in system_prompt:
        print("\n⚠️ O prompt já contém a correção! Migration já aplicada.")
        return

    # Atualizar system_prompt
    print("\n📝 Atualizando system_prompt...")
    new_system_prompt = system_prompt.replace(OLD_SYSTEM_PROMPT_PART, NEW_SYSTEM_PROMPT_PART)

    if new_system_prompt == system_prompt:
        print("   ⚠️ Texto exato não encontrado no system_prompt, tentando versão simplificada...")
        # Tentar substituição mais genérica
        if "Aguarde o link ser enviado automaticamente" in system_prompt:
            new_system_prompt = system_prompt.replace(
                "Aguarde o link ser enviado automaticamente",
                "**INCLUIR O LINK NA RESPOSTA**: Quando a ferramenta retornar, copie o campo 'link' do JSON e inclua na sua mensagem!\n\n❌ ERRADO: 'Acabei de enviar o link' (sem incluir o link)\n✅ CORRETO: 'Segue o link: https://www.asaas.com/i/xxx 💜'"
            )

    # Atualizar prompts_by_mode
    print("📝 Atualizando prompts_by_mode...")
    prompts_by_mode = agent.get("prompts_by_mode", {})

    if prompts_by_mode and "sdr_inbound" in prompts_by_mode:
        sdr_prompt = prompts_by_mode["sdr_inbound"]
        new_sdr_prompt = sdr_prompt.replace(OLD_SDR_PART, NEW_SDR_PART)

        if new_sdr_prompt == sdr_prompt:
            # Tentar substituição mais genérica
            if "Informar:" in sdr_prompt and "Vou gerar seu link" in sdr_prompt:
                new_sdr_prompt = sdr_prompt.replace(
                    'Informar: "Vou gerar seu link de pagamento agora! 💜"',
                    '**INCLUIR O LINK NA RESPOSTA**: Copie o link retornado pela ferramenta e inclua na mensagem!\n   ❌ ERRADO: "Enviei o link"\n   ✅ CORRETO: "Segue o link: https://www.asaas.com/i/xxx 💜"'
                )

        prompts_by_mode["sdr_inbound"] = new_sdr_prompt

    # Aplicar update
    print("\n🚀 Aplicando update no Supabase...")
    update_response = supabase.table("agent_versions").update({
        "system_prompt": new_system_prompt,
        "prompts_by_mode": prompts_by_mode,
        "version": "6.6.2"  # Bump version
    }).eq("id", agent_id).execute()

    if update_response.data:
        print("✅ Update aplicado com sucesso!")
        print(f"   Nova versão: 6.6.2")
    else:
        print("❌ Erro ao aplicar update")
        return

    # Verificar
    print("\n🔍 Verificando aplicação...")
    verify = supabase.table("agent_versions").select("agent_name,version,system_prompt").eq("id", agent_id).execute()

    if verify.data:
        v = verify.data[0]
        if "INCLUIR O LINK NA RESPOSTA" in v.get("system_prompt", ""):
            print("✅ Verificação OK - system_prompt contém nova regra")
        else:
            print("⚠️ system_prompt pode não ter sido atualizado corretamente")

    print("\n" + "=" * 50)
    print("✅ Migration 010 concluída!")
    print("=" * 50)


if __name__ == "__main__":
    main()
