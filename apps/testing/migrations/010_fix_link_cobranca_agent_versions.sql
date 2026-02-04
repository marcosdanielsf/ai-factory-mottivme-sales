-- ============================================================
-- Migration 010: Corrigir instrução de link de cobrança em agent_versions
-- ============================================================
--
-- PROBLEMA: A IA chama a ferramenta Criar_ou_buscar_cobranca, recebe o link
--           no JSON de resposta, mas responde "Acabei de enviar o link"
--           SEM incluir o link na mensagem para o lead.
--
-- CAUSA: O prompt diz "Aguarde o link ser enviado automaticamente" e
--        "Acabei de enviar o link de pagamento! Confere aí"
--
-- SOLUÇÃO: Instruir a IA a COPIAR o link da resposta da ferramenta e
--          INCLUIR na mensagem enviada ao lead.
--
-- TABELA AFETADA: agent_versions (onde está Isabella Amare v6.6.1)
-- ============================================================

-- ============================================================
-- PASSO 1: Atualizar o system_prompt base
-- ============================================================

UPDATE agent_versions
SET
  system_prompt = REPLACE(
    system_prompt,
    '4. Aguarde o link ser enviado automaticamente

⚠️ **MÁXIMO 1 CHAMADA por conversa!**
Se já gerou → "Acabei de enviar o link de pagamento! Confere aí 💜"',

    '4. **INCLUIR O LINK NA RESPOSTA**: Quando a ferramenta retornar, copie o campo "link" do JSON e inclua na sua mensagem!

⚠️ **REGRA CRÍTICA DE LINK:**
Quando a ferramenta retornar o link, você DEVE incluí-lo na sua mensagem assim:
"Prontinho! Segue o link de pagamento: [LINK_DA_FERRAMENTA] 💜"

❌ ERRADO: "Acabei de enviar o link" (sem incluir o link)
✅ CORRETO: "Prontinho! Segue o link: https://www.asaas.com/i/xxx 💜"

⚠️ **MÁXIMO 1 CHAMADA por conversa!**
Se já gerou → Reenvie o mesmo link da resposta anterior'
  ),
  updated_at = NOW()
WHERE agent_name = 'Isabella Amare'
  AND is_active = true;

-- ============================================================
-- PASSO 2: Atualizar o prompts_by_mode (modo sdr_inbound)
-- ============================================================

UPDATE agent_versions
SET
  prompts_by_mode = jsonb_set(
    prompts_by_mode,
    '{sdr_inbound}',
    to_jsonb(REPLACE(
      prompts_by_mode->>'sdr_inbound',
      '3. Informar: "Vou gerar seu link de pagamento agora! 💜"

✅ Gerar link quando:',
      '3. **INCLUIR O LINK NA RESPOSTA**: A ferramenta retorna um JSON com o campo "link". Você DEVE copiar esse link e incluir na sua mensagem!

⚠️ **REGRA CRÍTICA DE LINK:**
"Prontinho! Segue o link de pagamento: [LINK_DA_FERRAMENTA] 💜"

❌ ERRADO: "Acabei de enviar o link" (sem incluir o link)
✅ CORRETO: "Prontinho! Segue o link: https://www.asaas.com/i/xxx 💜"

✅ Gerar link quando:'
    ))
  ),
  updated_at = NOW()
WHERE agent_name = 'Isabella Amare'
  AND is_active = true
  AND prompts_by_mode->>'sdr_inbound' IS NOT NULL;

-- ============================================================
-- PASSO 3: Atualizar o prompts_by_mode (modo social_seller_instagram)
-- ============================================================

UPDATE agent_versions
SET
  prompts_by_mode = jsonb_set(
    prompts_by_mode,
    '{social_seller_instagram}',
    to_jsonb(REPLACE(
      prompts_by_mode->>'social_seller_instagram',
      '2. Chame a ferramenta com nome, CPF e valor
3. Depois do pagamento confirmado → Agendar',
      '2. Chame a ferramenta com nome, CPF e valor
3. **INCLUIR O LINK NA RESPOSTA**: Copie o link retornado pela ferramenta e inclua na mensagem!
   ❌ ERRADO: "Enviei o link"
   ✅ CORRETO: "Segue o link: https://www.asaas.com/i/xxx 💜"
4. Depois do pagamento confirmado → Agendar'
    ))
  ),
  updated_at = NOW()
WHERE agent_name = 'Isabella Amare'
  AND is_active = true
  AND prompts_by_mode->>'social_seller_instagram' IS NOT NULL;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================

SELECT
  agent_name,
  version,
  updated_at,
  CASE
    WHEN system_prompt LIKE '%INCLUIR O LINK NA RESPOSTA%' THEN '✅ system_prompt atualizado'
    ELSE '❌ system_prompt NÃO atualizado'
  END as status_system_prompt,
  CASE
    WHEN prompts_by_mode->>'sdr_inbound' LIKE '%INCLUIR O LINK NA RESPOSTA%' THEN '✅ sdr_inbound atualizado'
    ELSE '❌ sdr_inbound NÃO atualizado'
  END as status_sdr_inbound
FROM agent_versions
WHERE agent_name = 'Isabella Amare'
  AND is_active = true;

-- ============================================================
-- ROLLBACK (se necessário)
-- ============================================================
-- Para reverter, restaurar do backup ou usar os arquivos SQL originais:
-- sql/isabella_v661_INSERT_ATIVAR.sql
-- ============================================================
