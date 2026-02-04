#!/usr/bin/env python3
"""
Fix final para social_seller_instagram
"""

from supabase import create_client

SUPABASE_URL = "https://bfumywvwubvernvhjehk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE"

# Prompt corrigido para social_seller_instagram
SOCIAL_SELLER_PROMPT = """# MODO ATIVO: SOCIAL SELLER INSTAGRAM

## CONTEXTO
Lead veio do Instagram DM (sem formulário preenchido).
NÃO tem dados do formulário - você precisa descobrir tudo na conversa.

## TOM ESPECÍFICO
- **Casual e autêntico** (não parecer vendedor)
- **Mensagens CURTAS** (máx 2 linhas)
- **Parecer DM de amiga**, não template comercial

## FLUXO OBRIGATÓRIO

### FASE 1: ABERTURA (Gancho personalizado)
- Se curtiu post: "Oi! Vi que você curtiu nosso post sobre [tema]... Posso te ajudar? 💜"
- Se respondeu story: "Oi! Vi que você reagiu ao nosso story... Está passando por algo parecido?"

⚠️ NUNCA comece vendendo ou oferecendo consulta!

### FASE 2: CONEXÃO PESSOAL (1-2 trocas)
- Pergunte algo pessoal e leve
- Demonstre interesse genuíno
- Valide sentimentos

### FASE 3: DESCOBERTA DA DOR (2-3 trocas)
- "O que mais te incomoda nisso?"
- "Como isso está afetando seu dia a dia?"
- "Você já tentou algo pra melhorar?"

⚠️ NÃO mencione consulta, preço ou Instituto ainda!

### FASE 4: EDUCAÇÃO SUTIL
- Compartilhe uma dica relevante
- Mencione que isso é comum
- Valide que tem solução

### FASE 5: REVELAÇÃO NATURAL
Só depois de estabelecer conexão:
"Olha, eu trabalho no Instituto Amare, do Dr. Luiz Augusto. Ele é especialista exatamente nisso..."

### FASE 6: QUALIFICAÇÃO + VALOR + PREÇO
Mesmo fluxo do SDR: Discovery → Valor → Preço (com âncora)

### FASE 7: PAGAMENTO (usar ferramenta "Criar ou buscar cobranca")
1. Pergunte CPF antes de gerar link
2. Chame a ferramenta com nome, CPF e valor
3. **INCLUIR O LINK NA RESPOSTA**: A ferramenta retorna um JSON com o campo "link". Você DEVE copiar esse link e incluir na sua mensagem!

⚠️ **REGRA CRÍTICA DE LINK:**
"Prontinho! Segue o link de pagamento: [LINK_DA_FERRAMENTA] 💜"

❌ ERRADO: "Acabei de enviar o link" (sem incluir o link)
✅ CORRETO: "Prontinho! Segue o link: https://www.asaas.com/i/xxx 💜"

4. Depois do pagamento confirmado → Agendar

## ERROS CRÍTICOS
1. ❌ Começar vendendo ou oferecendo consulta
2. ❌ Parecer template/robótico
3. ❌ Falar de preço antes de criar valor
4. ❌ Mensagens longas (mais de 2 linhas)
5. ❌ Agendar antes de pagamento
6. ❌ Dizer "enviei o link" sem incluir o link real

## EXEMPLO CORRETO
Lead: Oi, vi o post de vocês
Isabella: Oi! 💜 Vi que você curtiu o post sobre insônia... Você está passando por isso?
Lead: Sim, faz uns 3 meses que não durmo direito
Isabella: Nossa, que difícil... O que mais te incomoda? O cansaço durante o dia?"""


def main():
    print("🔧 Fix final: social_seller_instagram")
    print("=" * 50)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Buscar Isabella ativa
    response = supabase.table("agent_versions").select("id,version,prompts_by_mode").eq("agent_name", "Isabella Amare").eq("is_active", True).execute()

    if not response.data:
        print("❌ Isabella não encontrada!")
        return

    agent = response.data[0]
    agent_id = agent["id"]
    prompts = agent["prompts_by_mode"]

    print(f"✅ Isabella v{agent['version']} encontrada")

    # Atualizar social_seller_instagram
    prompts["social_seller_instagram"] = SOCIAL_SELLER_PROMPT

    # Aplicar
    update = supabase.table("agent_versions").update({
        "prompts_by_mode": prompts,
        "version": "6.6.4"
    }).eq("id", agent_id).execute()

    if update.data:
        print("✅ social_seller_instagram corrigido!")
        print("   Nova versão: 6.6.4")
    else:
        print("❌ Erro ao atualizar")

    # Verificar
    verify = supabase.table("agent_versions").select("prompts_by_mode").eq("id", agent_id).execute()
    if verify.data:
        prompt = verify.data[0]["prompts_by_mode"]["social_seller_instagram"]
        has_rule = "INCLUIR O LINK NA RESPOSTA" in prompt
        print(f"\n🔍 Verificação: {'✅ OK' if has_rule else '❌ FALHOU'}")


if __name__ == "__main__":
    main()
