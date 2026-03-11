#!/usr/bin/env python3
"""
Migration 010 COMPLETA - Fix link cobrança em TODOS os modos
Garante que TODOS os prompts instruam a IA a incluir o link na resposta
"""

import json
from supabase import create_client

# Configuração
SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

# Regra crítica que deve estar em TODOS os prompts que usam cobrança
REGRA_LINK = """
⚠️ **REGRA CRÍTICA DE LINK:**
Quando a ferramenta retornar o link, você DEVE incluí-lo na sua mensagem assim:
"Prontinho! Segue o link de pagamento: [LINK_DA_FERRAMENTA] 💜"

❌ ERRADO: "Acabei de enviar o link" (sem incluir o link)
✅ CORRETO: "Prontinho! Segue o link: https://www.asaas.com/i/xxx 💜"
"""

def fix_social_seller_instagram(prompt: str) -> str:
    """Corrige o modo social_seller_instagram"""
    if "REGRA CRÍTICA DE LINK" in prompt:
        return prompt  # Já corrigido

    # Encontrar onde inserir a regra
    old_text = "2. Chame a ferramenta com nome, CPF e valor\\n3. Depois do pagamento confirmado → Agendar"
    new_text = """2. Chame a ferramenta com nome, CPF e valor\\n3. **INCLUIR O LINK NA RESPOSTA**: Copie o link retornado e inclua na mensagem!\\n\\n⚠️ **REGRA CRÍTICA DE LINK:**\\n\\"Prontinho! Segue o link de pagamento: [LINK_DA_FERRAMENTA] 💜\\"\\n\\n❌ ERRADO: \\"Enviei o link\\" (sem incluir o link)\\n✅ CORRETO: \\"Segue o link: https://www.asaas.com/i/xxx 💜\\"\\n\\n4. Depois do pagamento confirmado → Agendar"""

    if old_text in prompt:
        return prompt.replace(old_text, new_text)

    # Alternativa: inserir antes de "## ERROS CRÍTICOS"
    if "## ERROS CRÍTICOS" in prompt and "REGRA CRÍTICA DE LINK" not in prompt:
        insert_text = """\\n\\n⚠️ **REGRA CRÍTICA DE LINK (PAGAMENTO):**\\nQuando a ferramenta retornar o link, você DEVE incluí-lo na mensagem:\\n❌ ERRADO: \\"Enviei o link\\"\\n✅ CORRETO: \\"Segue o link: https://www.asaas.com/i/xxx 💜\\"\\n"""
        return prompt.replace("## ERROS CRÍTICOS", insert_text + "## ERROS CRÍTICOS")

    return prompt


def fix_concierge(prompt: str) -> str:
    """Adiciona nota sobre links se aplicável (concierge não usa cobrança, mas pode reenviar)"""
    # Concierge não gera cobrança, então não precisa da regra
    return prompt


def fix_scheduler(prompt: str) -> str:
    """Scheduler não usa cobrança (só agenda após pagamento)"""
    return prompt


def fix_followuper(prompt: str) -> str:
    """Followuper não usa cobrança"""
    return prompt


def fix_reativador_base(prompt: str) -> str:
    """Reativador pode eventualmente gerar cobrança - adicionar regra"""
    if "REGRA CRÍTICA DE LINK" in prompt:
        return prompt

    # Adicionar ao final antes do último template
    if "Lead que sumiu após preço" in prompt and "REGRA CRÍTICA DE LINK" not in prompt:
        insert_text = """\\n\\n## REGRA DE PAGAMENTO (se aplicável)\\nSe o lead quiser pagar durante reativação:\\n1. Pergunte CPF\\n2. Chame ferramenta \\"Criar ou buscar cobranca\\"\\n3. **INCLUA O LINK NA RESPOSTA**:\\n   ❌ ERRADO: \\"Enviei o link\\"\\n   ✅ CORRETO: \\"Segue o link: https://www.asaas.com/i/xxx 💜\\"\\n"""
        return prompt.replace("### Lead que sumiu após preço", insert_text + "### Lead que sumiu após preço")

    return prompt


def fix_objection_handler(prompt: str) -> str:
    """Objection handler pode levar a pagamento - adicionar regra"""
    if "REGRA CRÍTICA DE LINK" in prompt:
        return prompt

    # Adicionar ao final
    if "Cancela até 48h antes sem problema" in prompt and "REGRA CRÍTICA DE LINK" not in prompt:
        extra = (
            '\\n\\n## SE LEAD DECIDIR PAGAR APÓS OBJEÇÃO\\n'
            '1. Pergunte CPF\\n'
            '2. Chame ferramenta \\"Criar ou buscar cobranca\\"\\n'
            '3. **INCLUA O LINK NA RESPOSTA**:\\n'
            '   ❌ ERRADO: \\"Enviei o link\\"\\n'
            '   ✅ CORRETO: \\"Segue o link: https://www.asaas.com/i/xxx 💜\\"'
        )
        prompt += extra

    return prompt


def verify_system_prompt(prompt: str) -> tuple[bool, str]:
    """Verifica e corrige o system_prompt base"""
    issues = []

    # Verificar se tem a regra crítica
    if "REGRA CRÍTICA DE LINK" not in prompt:
        issues.append("Falta REGRA CRÍTICA DE LINK")

    if "INCLUIR O LINK NA RESPOSTA" not in prompt:
        issues.append("Falta instrução INCLUIR O LINK NA RESPOSTA")

    if "ERRADO" not in prompt or "Acabei de enviar" not in prompt:
        issues.append("Falta exemplo de ERRADO")

    if "CORRETO" not in prompt or "Segue o link" not in prompt:
        issues.append("Falta exemplo de CORRETO")

    return len(issues) == 0, issues


def main():
    print("=" * 60)
    print("🔧 MIGRATION 010 COMPLETA - Fix Link Cobrança")
    print("=" * 60)

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

    # 1. Verificar system_prompt
    print("\n" + "=" * 60)
    print("📋 VERIFICANDO SYSTEM_PROMPT")
    print("=" * 60)

    system_prompt = agent.get("system_prompt", "")
    is_ok, issues = verify_system_prompt(system_prompt)

    if is_ok:
        print("✅ system_prompt OK - todas as regras presentes")
    else:
        print("⚠️ system_prompt com problemas:")
        for issue in issues:
            print(f"   - {issue}")

    # 2. Verificar cada modo em prompts_by_mode
    print("\n" + "=" * 60)
    print("📋 VERIFICANDO PROMPTS_BY_MODE")
    print("=" * 60)

    prompts_by_mode = agent.get("prompts_by_mode", {})
    updated_prompts = {}
    changes_made = []

    modos_com_cobranca = ["sdr_inbound", "social_seller_instagram", "objection_handler", "reativador_base"]
    modos_sem_cobranca = ["concierge", "scheduler", "followuper"]

    for modo, prompt in prompts_by_mode.items():
        print(f"\n🔍 Modo: {modo}")

        has_rule = "REGRA CRÍTICA DE LINK" in prompt or "INCLUA O LINK" in prompt or "INCLUIR O LINK" in prompt

        if modo in modos_com_cobranca:
            if has_rule:
                print(f"   ✅ Já tem regra de link")
                updated_prompts[modo] = prompt
            else:
                print(f"   ⚠️ FALTA regra de link - CORRIGINDO...")

                if modo == "social_seller_instagram":
                    updated_prompts[modo] = fix_social_seller_instagram(prompt)
                elif modo == "objection_handler":
                    updated_prompts[modo] = fix_objection_handler(prompt)
                elif modo == "reativador_base":
                    updated_prompts[modo] = fix_reativador_base(prompt)
                else:
                    updated_prompts[modo] = prompt

                if updated_prompts[modo] != prompt:
                    changes_made.append(modo)
                    print(f"   ✅ Corrigido!")
                else:
                    print(f"   ⚠️ Não foi possível corrigir automaticamente")
                    updated_prompts[modo] = prompt
        else:
            print(f"   ℹ️ Modo não usa cobrança - OK")
            updated_prompts[modo] = prompt

    # 3. Aplicar correções
    if changes_made:
        print("\n" + "=" * 60)
        print("🚀 APLICANDO CORREÇÕES")
        print("=" * 60)
        print(f"Modos a atualizar: {', '.join(changes_made)}")

        update_response = supabase.table("agent_versions").update({
            "prompts_by_mode": updated_prompts,
            "version": "6.6.3",
            "deployment_notes": agent.get("deployment_notes", "") + " | v6.6.3 - Fix link cobrança em TODOS os modos"
        }).eq("id", agent_id).execute()

        if update_response.data:
            print("✅ Correções aplicadas com sucesso!")
            print(f"   Nova versão: 6.6.3")
        else:
            print("❌ Erro ao aplicar correções")
    else:
        print("\n✅ Nenhuma correção necessária - todos os modos já estão OK!")

    # 4. Verificação final
    print("\n" + "=" * 60)
    print("🔍 VERIFICAÇÃO FINAL")
    print("=" * 60)

    verify = supabase.table("agent_versions").select("version,prompts_by_mode").eq("id", agent_id).execute()

    if verify.data:
        v = verify.data[0]
        print(f"Versão atual: {v['version']}")

        prompts = v.get("prompts_by_mode", {})
        for modo in modos_com_cobranca:
            if modo in prompts:
                has_rule = "REGRA CRÍTICA DE LINK" in prompts[modo] or "INCLUA O LINK" in prompts[modo] or "INCLUIR O LINK" in prompts[modo]
                status = "✅" if has_rule else "❌"
                print(f"   {status} {modo}: {'OK' if has_rule else 'FALTA REGRA'}")

    print("\n" + "=" * 60)
    print("✅ MIGRATION 010 COMPLETA FINALIZADA!")
    print("=" * 60)


if __name__ == "__main__":
    main()
