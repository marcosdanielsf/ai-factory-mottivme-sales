-- ============================================================
-- Migration 009: Corrigir instrução de link de cobrança no prompt
-- ============================================================
--
-- PROBLEMA: A IA estava dizendo "Enviei o link" sem incluir o link
-- SOLUÇÃO: Atualizar o prompt para instruir a IA a INCLUIR o link na resposta
--
-- ============================================================

-- Atualizar o system_prompt de todos os agentes SDR ativos
-- que usam a ferramenta de cobrança
UPDATE socialfy_ai_agents
SET system_prompt = REPLACE(
  system_prompt,
  'Informar: "Prontinho! Acabei de enviar o link de pagamento pro seu WhatsApp',
  'INCLUIR O LINK NA RESPOSTA: "Prontinho! Segue o link de pagamento: [LINK] 💜"

⚠️ REGRA CRÍTICA: Quando a ferramenta Criar_ou_buscar_cobranca retornar, você DEVE copiar o campo "link" do resultado e incluí-lo na sua mensagem. NUNCA diga "enviei o link" sem incluir o link real na mensagem'
),
updated_at = NOW()
WHERE agent_type IN ('sdr', 'sdr_inbound', 'closer')
  AND is_active = true
  AND system_prompt LIKE '%Criar_ou_buscar_cobranca%'
  AND system_prompt LIKE '%Acabei de enviar o link%';

-- Verificar quantos registros foram afetados
-- (executar separadamente para ver resultado)
-- SELECT COUNT(*) as agentes_atualizados
-- FROM socialfy_ai_agents
-- WHERE updated_at > NOW() - INTERVAL '1 minute';

-- ============================================================
-- ALTERNATIVA: Se o texto não bater exatamente, usar regex
-- ============================================================

-- UPDATE socialfy_ai_agents
-- SET system_prompt = regexp_replace(
--   system_prompt,
--   'Prontinho.*enviar.*link.*pagamento',
--   'Prontinho! Segue o link de pagamento: [INCLUIR_LINK_AQUI]',
--   'gi'
-- ),
-- updated_at = NOW()
-- WHERE agent_type IN ('sdr', 'sdr_inbound', 'closer')
--   AND is_active = true;

-- ============================================================
-- INSTRUÇÃO ADICIONAL PARA O PROMPT
-- ============================================================
--
-- Adicionar no final do system_prompt de agentes SDR:
--
-- ## REGRA CRÍTICA PARA FERRAMENTAS
--
-- Quando uma ferramenta retornar dados, você DEVE incluí-los na resposta:
--
-- ❌ ERRADO: "Acabei de enviar o link" (sem mostrar o link)
-- ✅ CORRETO: "Segue o link: https://www.asaas.com/i/xxx"
--
-- ============================================================

COMMENT ON TABLE socialfy_ai_agents IS 'Agentes de IA configurados por location. IMPORTANTE: Sempre incluir links retornados por ferramentas na resposta.';
