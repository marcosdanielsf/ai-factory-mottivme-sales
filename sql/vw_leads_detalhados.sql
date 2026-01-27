-- ============================================
-- VIEW: vw_leads_detalhados
-- Retorna leads com detalhes para drill-down do SalesOps
-- ============================================

CREATE OR REPLACE VIEW vw_leads_detalhados AS
SELECT 
    fl.session_id,
    fl.contact_id,
    fl.contact_phone,
    fl.location_id,
    loc.name as location_name,
    -- Tenta buscar nome do contato de várias fontes
    COALESCE(
        c.first_name || ' ' || NULLIF(c.last_name, ''),
        c.first_name,
        fl.contact_phone
    ) as contact_name,
    fl.ultima_mensagem_lead as last_message,
    COALESCE(fl.follow_up_count, 0) as follow_up_count,
    fl.ultima_resposta as last_contact_at,
    COALESCE(fl.is_active, true) as is_active
FROM follow_up_leads fl
LEFT JOIN locations loc ON fl.location_id = loc.id
LEFT JOIN contacts c ON fl.contact_id = c.id
WHERE fl.session_id IS NOT NULL
ORDER BY fl.ultima_resposta DESC;

-- ============================================
-- VIEW: vw_leads_prontos_detalhados  
-- Leads prontos para próximo follow-up
-- ============================================

CREATE OR REPLACE VIEW vw_leads_prontos_detalhados AS
SELECT 
    fl.session_id,
    fl.contact_id,
    fl.contact_phone,
    fl.location_id,
    loc.name as location_name,
    COALESCE(
        c.first_name || ' ' || NULLIF(c.last_name, ''),
        c.first_name,
        fl.contact_phone
    ) as contact_name,
    fl.ultima_mensagem_lead as last_message,
    COALESCE(fl.follow_up_count, 0) as follow_up_count,
    fl.ultima_resposta as last_contact_at,
    true as is_active
FROM follow_up_leads fl
LEFT JOIN locations loc ON fl.location_id = loc.id
LEFT JOIN contacts c ON fl.contact_id = c.id
WHERE fl.is_active = true
  AND fl.session_id IS NOT NULL
  -- Prontos para follow-up: último contato foi há mais de 24h
  -- Ou nunca teve follow-up
  AND (
    fl.ultima_resposta IS NULL 
    OR fl.ultima_resposta < NOW() - INTERVAL '24 hours'
  )
ORDER BY fl.ultima_resposta DESC NULLS FIRST;

-- Comentários
COMMENT ON VIEW vw_leads_detalhados IS 'Lista detalhada de todos os leads para drill-down no SalesOps';
COMMENT ON VIEW vw_leads_prontos_detalhados IS 'Leads ativos prontos para o próximo follow-up';
