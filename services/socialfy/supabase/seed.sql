-- ============================================================================
-- SOCIALFY - SEED DATA
-- Dados de exemplo para desenvolvimento e testes
-- Execute APÓS o schema.sql
-- ============================================================================

-- Limpar dados existentes (em ordem reversa de dependências)
DELETE FROM socialfy_analytics_daily;
DELETE FROM socialfy_icp_config;
DELETE FROM socialfy_ai_agents;
DELETE FROM socialfy_pipeline_deals;
DELETE FROM socialfy_connected_accounts;
DELETE FROM socialfy_messages;
DELETE FROM socialfy_activities;
DELETE FROM socialfy_lead_cadences;
DELETE FROM socialfy_cadences;
DELETE FROM socialfy_campaigns;
DELETE FROM socialfy_leads;
-- Não deletar users pois depende de auth.users
DELETE FROM socialfy_organizations;

-- ============================================================================
-- 1. ORGANIZATION (UUID válido)
-- ============================================================================

INSERT INTO socialfy_organizations (id, name, slug, plan, settings) VALUES
('11111111-1111-1111-1111-111111111111'::uuid, 'Mottivme', 'mottivme', 'pro', '{
  "timezone": "America/Sao_Paulo",
  "language": "pt-BR",
  "features": {
    "ai_agents": true,
    "multi_channel": true,
    "advanced_analytics": true
  }
}'::jsonb);

-- ============================================================================
-- 2. LEADS (20 leads com UUIDs válidos)
-- ============================================================================

INSERT INTO socialfy_leads (id, organization_id, name, title, company, email, phone, linkedin_url, instagram_handle, whatsapp, status, icp_score, channels, source, tags) VALUES

-- High ICP Leads (80-100)
('a0000001-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Ricardo Mendes', 'CEO', 'TechVentures Brasil', 'ricardo@techventures.com.br', '+55 11 99999-0001',
 'https://linkedin.com/in/ricardomendes', '@ricardomendes', '+5511999990001',
 'available', 95, ARRAY['linkedin', 'email', 'whatsapp'], 'linkedin_search', ARRAY['tech', 'decision-maker', 'startup']),

('a0000001-0001-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Fernanda Costa', 'CMO', 'GrowthLab', 'fernanda@growthlab.io', '+55 11 99999-0002',
 'https://linkedin.com/in/fernandacosta', '@fercosta_mkt', '+5511999990002',
 'in_cadence', 92, ARRAY['linkedin', 'instagram', 'email'], 'instagram_search', ARRAY['marketing', 'saas', 'growth']),

('a0000001-0001-0001-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Carlos Eduardo Silva', 'Diretor Comercial', 'Industrias Unidas SA', 'carlos.silva@industriasunidas.com.br', '+55 11 99999-0003',
 'https://linkedin.com/in/carloseduardosilva', NULL, '+5511999990003',
 'responding', 88, ARRAY['linkedin', 'email', 'phone'], 'cnpj_search', ARRAY['industria', 'b2b', 'enterprise']),

('a0000001-0001-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Ana Paula Rodrigues', 'Head of Sales', 'SalesForce Brasil', 'ana.rodrigues@salesforce.com.br', '+55 11 99999-0004',
 'https://linkedin.com/in/anapaularodrigues', '@anapaula.sales', '+5511999990004',
 'scheduled', 85, ARRAY['linkedin', 'instagram', 'whatsapp'], 'linkedin_search', ARRAY['sales', 'tech', 'enterprise']),

('a0000001-0001-0001-0001-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Marcos Oliveira', 'CTO', 'DevSquad', 'marcos@devsquad.tech', '+55 11 99999-0005',
 'https://linkedin.com/in/marcosoliveira', '@marcos.dev', '+5511999990005',
 'converted', 82, ARRAY['linkedin', 'email'], 'linkedin_search', ARRAY['tech', 'startup', 'desenvolvimento']),

-- Medium ICP Leads (60-79)
('a0000001-0001-0001-0001-000000000006'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Juliana Santos', 'Gerente de Marketing', 'Agencia Digital XYZ', 'juliana@agenciaxyz.com.br', '+55 21 99999-0006',
 'https://linkedin.com/in/julianasantos', '@ju.marketing', '+5521999990006',
 'available', 75, ARRAY['linkedin', 'instagram'], 'instagram_search', ARRAY['agencia', 'marketing-digital']),

('a0000001-0001-0001-0001-000000000007'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Roberto Almeida', 'Diretor Financeiro', 'Construtora Alpha', 'roberto@construtoraalpha.com.br', '+55 11 99999-0007',
 'https://linkedin.com/in/robertoalmeida', NULL, '+5511999990007',
 'in_cadence', 72, ARRAY['linkedin', 'email', 'phone'], 'cnpj_search', ARRAY['construcao', 'b2b']),

('a0000001-0001-0001-0001-000000000008'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Patricia Lima', 'Fundadora', 'EcoSolutions', 'patricia@ecosolutions.com.br', '+55 11 99999-0008',
 'https://linkedin.com/in/patricialima', '@patricia.eco', '+5511999990008',
 'available', 70, ARRAY['linkedin', 'instagram', 'whatsapp'], 'linkedin_search', ARRAY['sustentabilidade', 'startup']),

('a0000001-0001-0001-0001-000000000009'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Lucas Ferreira', 'Head of Product', 'FinTech Plus', 'lucas@fintechplus.com.br', '+55 11 99999-0009',
 'https://linkedin.com/in/lucasferreira', '@lucas.product', '+5511999990009',
 'responding', 68, ARRAY['linkedin', 'email'], 'linkedin_search', ARRAY['fintech', 'produto', 'tech']),

('a0000001-0001-0001-0001-000000000010'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Beatriz Nunes', 'Gerente Geral', 'Rede Hoteleira Sol', 'beatriz@redesol.com.br', '+55 21 99999-0010',
 'https://linkedin.com/in/beatriznunes', '@bea.hoteis', '+5521999990010',
 'available', 65, ARRAY['linkedin', 'instagram', 'email'], 'cnpj_search', ARRAY['hotelaria', 'turismo']),

-- Lower ICP Leads (40-59)
('a0000001-0001-0001-0001-000000000011'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Diego Martins', 'Analista de Vendas', 'Distribuidora Beta', 'diego@distribuidorabeta.com.br', '+55 11 99999-0011',
 'https://linkedin.com/in/diegomartins', NULL, '+5511999990011',
 'available', 55, ARRAY['linkedin', 'email'], 'linkedin_search', ARRAY['vendas', 'distribuicao']),

('a0000001-0001-0001-0001-000000000012'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Camila Souza', 'Coordenadora', 'Clinica Vida', 'camila@clinicavida.com.br', '+55 11 99999-0012',
 'https://linkedin.com/in/camilasouza', '@cami.saude', '+5511999990012',
 'in_cadence', 52, ARRAY['linkedin', 'instagram', 'whatsapp'], 'instagram_search', ARRAY['saude', 'clinica']),

('a0000001-0001-0001-0001-000000000013'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Bruno Carvalho', 'Proprietario', 'Auto Center Premium', 'bruno@autocenterpremium.com.br', '+55 11 99999-0013',
 'https://linkedin.com/in/brunocarvalho', '@brunoautos', '+5511999990013',
 'available', 48, ARRAY['instagram', 'whatsapp', 'phone'], 'instagram_search', ARRAY['automotivo', 'varejo']),

('a0000001-0001-0001-0001-000000000014'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Amanda Ribeiro', 'Supervisora', 'Loja Moda Fashion', 'amanda@modafashion.com.br', '+55 11 99999-0014',
 NULL, '@amanda.fashion', '+5511999990014',
 'available', 45, ARRAY['instagram', 'whatsapp'], 'instagram_search', ARRAY['moda', 'varejo']),

('a0000001-0001-0001-0001-000000000015'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Rafael Costa', 'Empreendedor', 'Delivery Express', 'rafael@deliveryexpress.com.br', '+55 11 99999-0015',
 'https://linkedin.com/in/rafaelcosta', '@rafa.delivery', '+5511999990015',
 'lost', 42, ARRAY['linkedin', 'instagram', 'whatsapp'], 'linkedin_search', ARRAY['delivery', 'logistica']),

-- Additional Leads
('a0000001-0001-0001-0001-000000000016'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Isabela Moreira', 'VP de Operacoes', 'LogTech Solutions', 'isabela@logtech.com.br', '+55 11 99999-0016',
 'https://linkedin.com/in/isabelamoreira', '@isa.logtech', '+5511999990016',
 'available', 90, ARRAY['linkedin', 'email', 'whatsapp'], 'linkedin_search', ARRAY['logistica', 'tech', 'enterprise']),

('a0000001-0001-0001-0001-000000000017'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Thiago Nascimento', 'Diretor de TI', 'Banco Digital Neo', 'thiago@banconeo.com.br', '+55 11 99999-0017',
 'https://linkedin.com/in/thiagonascimento', NULL, '+5511999990017',
 'in_cadence', 87, ARRAY['linkedin', 'email'], 'linkedin_search', ARRAY['banco', 'fintech', 'tech']),

('a0000001-0001-0001-0001-000000000018'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Larissa Campos', 'CEO', 'EdTech Academy', 'larissa@edtechacademy.com.br', '+55 11 99999-0018',
 'https://linkedin.com/in/larissacampos', '@larissa.edtech', '+5511999990018',
 'responding', 84, ARRAY['linkedin', 'instagram', 'email'], 'linkedin_search', ARRAY['educacao', 'tech', 'startup']),

('a0000001-0001-0001-0001-000000000019'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Gabriel Pereira', 'COO', 'HealthTech Brasil', 'gabriel@healthtech.com.br', '+55 11 99999-0019',
 'https://linkedin.com/in/gabrielpereira', '@gab.health', '+5511999990019',
 'scheduled', 81, ARRAY['linkedin', 'whatsapp', 'email'], 'linkedin_search', ARRAY['saude', 'tech', 'startup']),

('a0000001-0001-0001-0001-000000000020'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Marina Duarte', 'Diretora de Vendas', 'Software House Pro', 'marina@softwarehousepro.com.br', '+55 11 99999-0020',
 'https://linkedin.com/in/marinaduarte', '@marina.tech', '+5511999990020',
 'available', 78, ARRAY['linkedin', 'email', 'phone'], 'linkedin_search', ARRAY['software', 'tech', 'vendas']);

-- ============================================================================
-- 3. CAMPAIGNS (4 campanhas)
-- ============================================================================

INSERT INTO socialfy_campaigns (id, organization_id, name, description, type, status, channels, cadence_name, leads_count, responses_count, meetings_count, conversion_rate, started_at) VALUES

('b0000001-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'LinkedIn Outbound Q1', 'Campanha de prospecção ativa no LinkedIn para decisores de tech',
 'connection', 'active', ARRAY['linkedin'], 'OUT-HT-14', 150, 42, 12, 8.0, NOW() - INTERVAL '30 days'),

('b0000001-0001-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Instagram DM - Startups', 'Abordagem via Instagram para founders de startups',
 'instagram_dm', 'active', ARRAY['instagram', 'whatsapp'], 'IG-MT-7', 80, 28, 8, 10.0, NOW() - INTERVAL '15 days'),

('b0000001-0001-0001-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Multi-channel Enterprise', 'Campanha multi-canal para grandes empresas',
 'multi_channel', 'active', ARRAY['linkedin', 'email', 'phone'], 'MULTI-HT-21', 45, 15, 6, 13.3, NOW() - INTERVAL '45 days'),

('b0000001-0001-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Warm-up Inbound', 'Nurturing de leads que vieram por indicação',
 'warm_up', 'paused', ARRAY['email', 'whatsapp'], 'IN-LT-7', 25, 12, 4, 16.0, NOW() - INTERVAL '60 days');

-- ============================================================================
-- 4. CADENCES (Templates de cadência)
-- ============================================================================

INSERT INTO socialfy_cadences (id, organization_id, name, code, description, channels, duration_days, touch_level, lead_source, steps, avg_response_rate, avg_meeting_rate, times_used, status, is_template) VALUES

('c0000001-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Outbound LinkedIn - High Touch', 'OUT-HT-14',
 'Cadência intensiva para prospecção via LinkedIn com follow-ups estratégicos',
 ARRAY['linkedin'], 14, 'high', 'outbound',
 '[
   {"day": 1, "channel": "linkedin", "action": "connection_request", "time": "09:00", "content": "Solicitação de conexão personalizada"},
   {"day": 2, "channel": "linkedin", "action": "view_profile", "time": "10:00", "content": "Visualizar perfil"},
   {"day": 3, "channel": "linkedin", "action": "message", "time": "09:00", "content": "Mensagem de agradecimento pela conexão"},
   {"day": 5, "channel": "linkedin", "action": "engage_post", "time": "14:00", "content": "Curtir e comentar em post recente"},
   {"day": 7, "channel": "linkedin", "action": "message", "time": "09:00", "content": "Mensagem de valor - compartilhar conteúdo relevante"},
   {"day": 10, "channel": "linkedin", "action": "message", "time": "09:00", "content": "Proposta de call rápida"},
   {"day": 14, "channel": "linkedin", "action": "message", "time": "09:00", "content": "Último follow-up"}
 ]'::jsonb,
 28.5, 8.2, 45, 'active', true),

('c0000001-0001-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Instagram DM - Medium Touch', 'IG-MT-7',
 'Abordagem via Instagram com transição para WhatsApp',
 ARRAY['instagram', 'whatsapp'], 7, 'medium', 'outbound',
 '[
   {"day": 1, "channel": "instagram", "action": "follow", "time": "10:00", "content": "Seguir perfil"},
   {"day": 1, "channel": "instagram", "action": "engage_stories", "time": "14:00", "content": "Reagir a stories"},
   {"day": 2, "channel": "instagram", "action": "dm", "time": "09:00", "content": "DM inicial personalizada"},
   {"day": 4, "channel": "instagram", "action": "dm", "time": "09:00", "content": "Follow-up com conteúdo de valor"},
   {"day": 6, "channel": "whatsapp", "action": "message", "time": "10:00", "content": "Transição para WhatsApp"},
   {"day": 7, "channel": "whatsapp", "action": "message", "time": "09:00", "content": "Proposta de reunião"}
 ]'::jsonb,
 32.0, 10.5, 28, 'active', true),

('c0000001-0001-0001-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Multi-channel Enterprise - High Touch', 'MULTI-HT-21',
 'Cadência completa multi-canal para grandes contas',
 ARRAY['linkedin', 'email', 'phone'], 21, 'high', 'outbound',
 '[
   {"day": 1, "channel": "linkedin", "action": "connection_request", "time": "09:00", "content": "Conexão LinkedIn"},
   {"day": 2, "channel": "email", "action": "send", "time": "08:00", "content": "Email de apresentação"},
   {"day": 4, "channel": "linkedin", "action": "message", "time": "09:00", "content": "Mensagem LinkedIn"},
   {"day": 6, "channel": "phone", "action": "call", "time": "10:00", "content": "Tentativa de ligação"},
   {"day": 8, "channel": "email", "action": "send", "time": "08:00", "content": "Email follow-up com case"},
   {"day": 11, "channel": "linkedin", "action": "message", "time": "09:00", "content": "Compartilhar artigo relevante"},
   {"day": 14, "channel": "phone", "action": "call", "time": "14:00", "content": "Segunda tentativa de ligação"},
   {"day": 17, "channel": "email", "action": "send", "time": "08:00", "content": "Email com proposta de valor"},
   {"day": 21, "channel": "linkedin", "action": "message", "time": "09:00", "content": "Último touchpoint"}
 ]'::jsonb,
 35.0, 14.2, 18, 'active', true),

('c0000001-0001-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Inbound - Low Touch', 'IN-LT-7',
 'Cadência leve para leads que vieram por inbound',
 ARRAY['email', 'whatsapp'], 7, 'low', 'inbound',
 '[
   {"day": 1, "channel": "email", "action": "send", "time": "09:00", "content": "Email de boas-vindas"},
   {"day": 3, "channel": "whatsapp", "action": "message", "time": "10:00", "content": "Mensagem WhatsApp amigável"},
   {"day": 5, "channel": "email", "action": "send", "time": "09:00", "content": "Conteúdo de valor + CTA"},
   {"day": 7, "channel": "whatsapp", "action": "message", "time": "09:00", "content": "Proposta de call"}
 ]'::jsonb,
 45.0, 18.5, 32, 'active', true);

-- ============================================================================
-- 5. MESSAGES (Inbox - 15 mensagens recentes)
-- ============================================================================

INSERT INTO socialfy_messages (id, organization_id, lead_id, channel, direction, content, status, is_read, sent_at) VALUES

-- LinkedIn messages
('d0000001-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000002'::uuid, 'linkedin', 'inbound',
 'Oi! Vi sua mensagem. Realmente estamos buscando melhorar nossa prospecção. Podemos conversar na quinta?',
 'delivered', false, NOW() - INTERVAL '2 hours'),

('d0000001-0001-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000003'::uuid, 'linkedin', 'inbound',
 'Interessante sua abordagem. Manda mais informações por email que analiso com o time.',
 'delivered', false, NOW() - INTERVAL '5 hours'),

-- Instagram DMs
('d0000001-0001-0001-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000006'::uuid, 'instagram', 'inbound',
 'Adorei o conteúdo que você compartilhou! Como funciona esse serviço de vocês?',
 'delivered', false, NOW() - INTERVAL '1 hour'),

('d0000001-0001-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000008'::uuid, 'instagram', 'outbound',
 'Oi Patricia! Vi que você está fazendo um trabalho incrível com sustentabilidade. Posso te apresentar algo que pode ajudar?',
 'read', true, NOW() - INTERVAL '3 hours'),

-- WhatsApp messages
('d0000001-0001-0001-0001-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000004'::uuid, 'whatsapp', 'inbound',
 'Perfeito! Confirmado para quinta às 14h. Me manda o link da reunião.',
 'delivered', false, NOW() - INTERVAL '30 minutes'),

('d0000001-0001-0001-0001-000000000006'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000009'::uuid, 'whatsapp', 'inbound',
 'Opa, desculpa a demora. Essa semana está corrida mas tenho interesse sim. Próxima semana funciona?',
 'delivered', false, NOW() - INTERVAL '4 hours'),

-- Email messages
('d0000001-0001-0001-0001-000000000007'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000017'::uuid, 'email', 'inbound',
 'Recebi seu email. O assunto é relevante para nós. Vou encaminhar para nosso time de inovação avaliar.',
 'delivered', true, NOW() - INTERVAL '1 day'),

('d0000001-0001-0001-0001-000000000008'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000016'::uuid, 'email', 'outbound',
 'Bom dia Isabela! Gostaria de apresentar nossa solução de automação de vendas que tem ajudado empresas de logística como a LogTech a aumentar em 40% a eficiência do time comercial.',
 'sent', true, NOW() - INTERVAL '2 days'),

-- More recent messages
('d0000001-0001-0001-0001-000000000009'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000018'::uuid, 'linkedin', 'inbound',
 'Muito legal! Educação é nossa prioridade. Vamos agendar um papo?',
 'delivered', false, NOW() - INTERVAL '45 minutes'),

('d0000001-0001-0001-0001-000000000010'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000019'::uuid, 'whatsapp', 'inbound',
 'Confirmado para amanhã 10h. Até lá!',
 'delivered', true, NOW() - INTERVAL '6 hours'),

-- Outbound messages
('d0000001-0001-0001-0001-000000000011'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000001'::uuid, 'linkedin', 'outbound',
 'Oi Ricardo! Parabéns pelo trabalho na TechVentures. Vi que vocês estão expandindo. Posso te mostrar como outras empresas de tech estão escalando vendas com IA?',
 'sent', true, NOW() - INTERVAL '8 hours'),

('d0000001-0001-0001-0001-000000000012'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000020'::uuid, 'email', 'outbound',
 'Marina, tudo bem? Preparei um material exclusivo sobre como automatizar o processo de vendas B2B. Posso enviar?',
 'sent', true, NOW() - INTERVAL '1 day'),

-- Unread important messages
('d0000001-0001-0001-0001-000000000013'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000001'::uuid, 'linkedin', 'inbound',
 'Opa! Interessante. Pode ser na semana que vem? Segunda ou terça funcionam.',
 'delivered', false, NOW() - INTERVAL '15 minutes'),

('d0000001-0001-0001-0001-000000000014'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000016'::uuid, 'email', 'inbound',
 'Recebi o material. Muito bom! Vamos agendar uma demo para o time?',
 'delivered', false, NOW() - INTERVAL '3 hours'),

('d0000001-0001-0001-0001-000000000015'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000012'::uuid, 'instagram', 'inbound',
 'Gostei do que vi no perfil de vocês! Como funciona o preço?',
 'delivered', false, NOW() - INTERVAL '20 minutes');

-- ============================================================================
-- 6. PIPELINE DEALS (8 deals em diferentes estágios)
-- ============================================================================

INSERT INTO socialfy_pipeline_deals (id, organization_id, lead_id, campaign_id, title, value, stage, meeting_scheduled_at, meeting_type, show_rate_guard) VALUES

('e0000001-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000001'::uuid, 'b0000001-0001-0001-0001-000000000001'::uuid,
 'TechVentures - Enterprise', 45000.00, 'new', NULL, NULL, '{}'::jsonb),

('e0000001-0001-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000002'::uuid, 'b0000001-0001-0001-0001-000000000002'::uuid,
 'GrowthLab - Pro Plan', 12000.00, 'relationship', NULL, NULL, '{}'::jsonb),

('e0000001-0001-0001-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000004'::uuid, 'b0000001-0001-0001-0001-000000000001'::uuid,
 'SalesForce Brasil - Consultoria', 28000.00, 'scheduled', NOW() + INTERVAL '2 days', 'discovery_call',
 '{"email_24h": "scheduled", "whatsapp_12h": "pending", "whatsapp_2h": "pending", "sms_30m": "pending"}'::jsonb),

('e0000001-0001-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000019'::uuid, 'b0000001-0001-0001-0001-000000000003'::uuid,
 'HealthTech - Implementation', 35000.00, 'scheduled', NOW() + INTERVAL '1 day', 'demo',
 '{"email_24h": "sent", "whatsapp_12h": "confirmed", "whatsapp_2h": "pending", "sms_30m": "pending"}'::jsonb),

('e0000001-0001-0001-0001-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000016'::uuid, 'b0000001-0001-0001-0001-000000000003'::uuid,
 'LogTech - Full Suite', 52000.00, 'proposal', NULL, NULL, '{}'::jsonb),

('e0000001-0001-0001-0001-000000000006'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000003'::uuid, 'b0000001-0001-0001-0001-000000000003'::uuid,
 'Industrias Unidas - Piloto', 18000.00, 'negotiation', NULL, NULL, '{}'::jsonb),

('e0000001-0001-0001-0001-000000000007'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000005'::uuid, 'b0000001-0001-0001-0001-000000000001'::uuid,
 'DevSquad - Starter', 8500.00, 'won', NULL, NULL, '{}'::jsonb),

('e0000001-0001-0001-0001-000000000008'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'a0000001-0001-0001-0001-000000000015'::uuid, 'b0000001-0001-0001-0001-000000000002'::uuid,
 'Delivery Express - Básico', 4500.00, 'lost', NULL, NULL, '{}'::jsonb);

-- ============================================================================
-- 7. AI AGENTS (Agentes de IA configurados)
-- ============================================================================

INSERT INTO socialfy_ai_agents (id, organization_id, name, type, description, language, model, system_prompt, is_active, total_executions) VALUES

('f0000001-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Connection Crafter', 'connection',
 'Gera mensagens personalizadas para solicitações de conexão no LinkedIn baseadas no perfil do lead',
 'pt-BR', 'claude-sonnet',
 'Você é um especialista em vendas B2B. Seu objetivo é criar mensagens de conexão no LinkedIn que sejam pessoais, relevantes e que gerem curiosidade. Nunca seja genérico. Sempre mencione algo específico do perfil da pessoa.',
 true, 1250),

('f0000001-0001-0001-0001-000000000002'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Inbox Assistant', 'inbox',
 'Sugere respostas para mensagens recebidas, mantendo o tom da conversa e avançando para próximos passos',
 'pt-BR', 'claude-sonnet',
 'Você é um SDR experiente. Ao receber uma mensagem de um lead, analise o contexto e sugira uma resposta que: 1) Seja natural e pessoal, 2) Responda a pergunta se houver, 3) Avance a conversa para um próximo passo (call, demo, etc)',
 true, 890),

('f0000001-0001-0001-0001-000000000003'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Content Generator', 'content',
 'Cria posts, artigos e conteúdos para engajamento nas redes sociais',
 'pt-BR', 'claude-sonnet',
 'Você é um especialista em marketing de conteúdo B2B. Crie conteúdos que eduquem, engajem e posicionem a empresa como autoridade no mercado. Use storytelling e dados quando possível.',
 true, 320),

('f0000001-0001-0001-0001-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Lead Qualifier', 'qualifier',
 'Analisa leads e calcula ICP score baseado em critérios configurados',
 'pt-BR', 'claude-sonnet',
 'Você é um analista de qualificação de leads. Avalie cada lead com base nos critérios de ICP definidos e retorne um score de 0 a 100, junto com justificativas para cada critério.',
 true, 2100),

('f0000001-0001-0001-0001-000000000005'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 'Voice AI (Beta)', 'voice_ai',
 'Agente de voz para ligações automatizadas de qualificação',
 'pt-BR', 'claude-sonnet',
 'Você é um assistente de vendas por voz. Conduza conversas naturais e qualifique leads por telefone de forma amigável e profissional.',
 false, 45);

-- ============================================================================
-- 8. ICP CONFIG
-- ============================================================================

INSERT INTO socialfy_icp_config (id, organization_id, criteria, high_fit_threshold, medium_fit_threshold) VALUES

('10000001-0001-0001-0001-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
 '[
   {
     "name": "Cargo/Senioridade",
     "weight": 30,
     "rules": [
       {"value": "C-Level (CEO, CTO, CMO)", "score": 100},
       {"value": "VP/Diretor", "score": 80},
       {"value": "Head/Gerente", "score": 60},
       {"value": "Coordenador/Supervisor", "score": 40},
       {"value": "Analista", "score": 20}
     ]
   },
   {
     "name": "Tamanho da Empresa",
     "weight": 25,
     "rules": [
       {"value": "Enterprise (500+ funcionários)", "score": 100},
       {"value": "Mid-Market (100-499)", "score": 80},
       {"value": "SMB (20-99)", "score": 60},
       {"value": "Startup (< 20)", "score": 40}
     ]
   },
   {
     "name": "Segmento",
     "weight": 25,
     "rules": [
       {"value": "Tech/SaaS", "score": 100},
       {"value": "Fintech", "score": 90},
       {"value": "E-commerce", "score": 80},
       {"value": "Serviços B2B", "score": 70},
       {"value": "Indústria", "score": 60},
       {"value": "Varejo", "score": 40}
     ]
   },
   {
     "name": "Canais Disponíveis",
     "weight": 20,
     "rules": [
       {"value": "LinkedIn + Email + WhatsApp", "score": 100},
       {"value": "LinkedIn + Email", "score": 70},
       {"value": "Apenas LinkedIn", "score": 50},
       {"value": "Apenas Instagram", "score": 30}
     ]
   }
 ]'::jsonb,
 80, 60);

-- ============================================================================
-- 9. ANALYTICS (Últimos 30 dias)
-- ============================================================================

INSERT INTO socialfy_analytics_daily (organization_id, date, messages_sent, messages_received, response_rate, meetings_scheduled, meetings_completed, show_rate, leads_added, leads_converted, channel_metrics, deals_won, revenue)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  (CURRENT_DATE - (n || ' days')::interval)::date,
  FLOOR(RANDOM() * 50 + 30)::int,
  FLOOR(RANDOM() * 20 + 5)::int,
  (RANDOM() * 20 + 15)::decimal(5,2),
  FLOOR(RANDOM() * 5 + 1)::int,
  FLOOR(RANDOM() * 4)::int,
  (RANDOM() * 30 + 60)::decimal(5,2),
  FLOOR(RANDOM() * 10 + 5)::int,
  FLOOR(RANDOM() * 3)::int,
  jsonb_build_object(
    'linkedin', jsonb_build_object('sent', FLOOR(RANDOM() * 30 + 15)::int, 'received', FLOOR(RANDOM() * 10 + 3)::int),
    'instagram', jsonb_build_object('sent', FLOOR(RANDOM() * 15 + 5)::int, 'received', FLOOR(RANDOM() * 8 + 2)::int),
    'whatsapp', jsonb_build_object('sent', FLOOR(RANDOM() * 20 + 10)::int, 'received', FLOOR(RANDOM() * 12 + 4)::int),
    'email', jsonb_build_object('sent', FLOOR(RANDOM() * 25 + 10)::int, 'received', FLOOR(RANDOM() * 8 + 2)::int)
  ),
  FLOOR(RANDOM() * 2)::int,
  (RANDOM() * 15000 + 5000)::decimal(15,2)
FROM generate_series(0, 29) n;

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Seed data inserted successfully!' as status,
       (SELECT COUNT(*) FROM socialfy_leads) as leads_count,
       (SELECT COUNT(*) FROM socialfy_campaigns) as campaigns_count,
       (SELECT COUNT(*) FROM socialfy_cadences) as cadences_count,
       (SELECT COUNT(*) FROM socialfy_messages) as messages_count,
       (SELECT COUNT(*) FROM socialfy_pipeline_deals) as deals_count,
       (SELECT COUNT(*) FROM socialfy_ai_agents) as agents_count;
