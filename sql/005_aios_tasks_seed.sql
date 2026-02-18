-- =====================================================
-- AIOS Tasks — Seed Data (30 tasks realistas)
-- Executar DEPOIS de 002_aios_seed_data.sql
-- Distribuidas nos ultimos 7 dias para timeline interessante
-- =====================================================

-- 10 tasks tipo 'agent' (gerar copy, responder lead, qualificar, agendar)
-- 8  tasks tipo 'worker' (normalizar nome, mover pipeline, enviar tag, calcular custo)
-- 7  tasks tipo 'clone'  (revisar copy, aplicar framework, gerar headline)
-- 5  tasks tipo 'human'  (aprovar conteudo, revisar contrato, decidir preco)
-- executor_type fica armazenado em aios_agents.config->>'executor_type'
-- Usamos agent_ids do seed 002 e configs diferentes por tipo

-- ------------------------------------------------------------
-- Garantir que os agentes com config de executor_type existem
-- (atualiza config dos agentes seed sem criar novos)
-- ------------------------------------------------------------
UPDATE aios_agents SET config = config || '{"executor_type": "agent"}'
  WHERE id IN (
    'b0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000005'
  );

UPDATE aios_agents SET config = config || '{"executor_type": "worker"}'
  WHERE id IN (
    'b0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000011',
    'b0000000-0000-0000-0000-000000000012'
  );

UPDATE aios_agents SET config = config || '{"executor_type": "clone"}'
  WHERE id IN (
    'b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000007',
    'b0000000-0000-0000-0000-000000000010'
  );

UPDATE aios_agents SET config = config || '{"executor_type": "human"}'
  WHERE id IN (
    'b0000000-0000-0000-0000-000000000008',
    'b0000000-0000-0000-0000-000000000009'
  );

-- ------------------------------------------------------------
-- TASKS — 30 tasks distribuidas nos ultimos 7 dias
-- ------------------------------------------------------------
INSERT INTO aios_tasks (
  id, title, description, status, cost, created_at, completed_at,
  story_id, phase_id, assigned_agent_id
) VALUES

-- ========== AGENT TASKS (10) ==========

-- Dia 7 atras
(
  gen_random_uuid(),
  'Gerar copy para campanha SDR Instagram',
  'Criar copy persuasiva seguindo framework AIDA para campanha de prospecao no Instagram',
  'completed', 0.00342,
  NOW() - INTERVAL '7 days' + INTERVAL '9 hours',
  NOW() - INTERVAL '7 days' + INTERVAL '9 hours 4 minutes 18 seconds',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001'
),

-- Dia 7 atras
(
  gen_random_uuid(),
  'Qualificar lead: Ana Costa - Clinica Estetica',
  'Analisar historico de conversa e classificar lead segundo criterios BANT. Lead veio via Instagram.',
  'completed', 0.00218,
  NOW() - INTERVAL '7 days' + INTERVAL '14 hours',
  NOW() - INTERVAL '7 days' + INTERVAL '14 hours 2 minutes 45 seconds',
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000002'
),

-- Dia 6 atras
(
  gen_random_uuid(),
  'Responder objecao: "Preciso pensar melhor"',
  'Gerar resposta personalizada para objecao de tempo. Lead qualificado com budget aprovado.',
  'completed', 0.00289,
  NOW() - INTERVAL '6 days' + INTERVAL '10 hours 30 minutes',
  NOW() - INTERVAL '6 days' + INTERVAL '10 hours 33 minutes 12 seconds',
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000001'
),

-- Dia 6 atras
(
  gen_random_uuid(),
  'Agendar reuniao de apresentacao - Pedro Alves',
  'Verificar disponibilidade no calendario e propor 3 opcoes de horario para reuniao de 30min',
  'completed', 0.00156,
  NOW() - INTERVAL '6 days' + INTERVAL '15 hours',
  NOW() - INTERVAL '6 days' + INTERVAL '15 hours 1 minute 42 seconds',
  'c0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000007',
  'b0000000-0000-0000-0000-000000000003'
),

-- Dia 5 atras
(
  gen_random_uuid(),
  'Gerar roteiro de video: Prova Social MOTTIVME',
  'Criar roteiro de 60 segundos com hook, desenvolvimento e CTA. Tom: autoridade + prova social',
  'completed', 0.00487,
  NOW() - INTERVAL '5 days' + INTERVAL '9 hours',
  NOW() - INTERVAL '5 days' + INTERVAL '9 hours 6 minutes 33 seconds',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000005'
),

-- Dia 4 atras
(
  gen_random_uuid(),
  'Follow-up automatico: leads frios 30 dias',
  'Gerar mensagem de reativacao personalizada para 45 leads sem interacao ha 30+ dias',
  'completed', 0.00634,
  NOW() - INTERVAL '4 days' + INTERVAL '8 hours',
  NOW() - INTERVAL '4 days' + INTERVAL '8 hours 8 minutes 15 seconds',
  'c0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000002'
),

-- Dia 3 atras
(
  gen_random_uuid(),
  'Analisar sentimento: conversas da semana',
  'Classificar sentimento (positivo/neutro/negativo) em 120 conversas e gerar relatorio',
  'completed', 0.00523,
  NOW() - INTERVAL '3 days' + INTERVAL '11 hours',
  NOW() - INTERVAL '3 days' + INTERVAL '11 hours 7 minutes 22 seconds',
  'c0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001'
),

-- Dia 2 atras
(
  gen_random_uuid(),
  'Criar proposta comercial - Clinica Dermato SP',
  'Gerar proposta personalizada com ROI estimado e plano de implementacao em 90 dias',
  'completed', 0.00412,
  NOW() - INTERVAL '2 days' + INTERVAL '13 hours',
  NOW() - INTERVAL '2 days' + INTERVAL '13 hours 5 minutes 8 seconds',
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000003'
),

-- Dia 1 atras
(
  gen_random_uuid(),
  'Responder lead qualificado: Carlos Mendes BPO',
  'Resposta tecnica para lead B2B sobre integracao com CRM existente (Salesforce)',
  'in_progress', 0.00178,
  NOW() - INTERVAL '1 day' + INTERVAL '10 hours',
  NULL,
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000001'
),

-- Hoje
(
  gen_random_uuid(),
  'Qualificar batch: 15 novos leads trafego pago',
  'Processar e qualificar 15 leads gerados pela campanha de trafego pago do dia',
  'pending', 0,
  NOW() - INTERVAL '2 hours',
  NULL,
  'c0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000002'
),

-- ========== WORKER TASKS (8) ==========

-- Dia 7 atras
(
  gen_random_uuid(),
  'Normalizar nome: 87 leads importados CSV',
  'Padronizar first_name e last_name de 87 leads importados via planilha. Regras: capitalizar, remover caracteres invalidos.',
  'completed', 0.00028,
  NOW() - INTERVAL '7 days' + INTERVAL '8 hours',
  NOW() - INTERVAL '7 days' + INTERVAL '8 hours' + INTERVAL '45 seconds',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000006'
),

-- Dia 6 atras
(
  gen_random_uuid(),
  'Mover pipeline: leads respondidos → negociacao',
  'Atualizar stage no GHL para 23 leads que responderam positivamente a campanha SDR',
  'completed', 0.00012,
  NOW() - INTERVAL '6 days' + INTERVAL '9 hours',
  NOW() - INTERVAL '6 days' + INTERVAL '9 hours' + INTERVAL '18 seconds',
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000011'
),

-- Dia 5 atras
(
  gen_random_uuid(),
  'Aplicar tag: lead_qualificado em 31 contatos',
  'Adicionar tag de qualificacao via GHL API para 31 leads que passaram pelo filtro BANT',
  'completed', 0.00009,
  NOW() - INTERVAL '5 days' + INTERVAL '10 hours',
  NOW() - INTERVAL '5 days' + INTERVAL '10 hours' + INTERVAL '12 seconds',
  'c0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000012'
),

-- Dia 4 atras
(
  gen_random_uuid(),
  'Calcular custo LLM: workflow mes fev/2026',
  'Agregar tokens consumidos por modelo e calcular custo total do mes atual por cliente',
  'completed', 0.00034,
  NOW() - INTERVAL '4 days' + INTERVAL '7 hours',
  NOW() - INTERVAL '4 days' + INTERVAL '7 hours' + INTERVAL '52 seconds',
  'c0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000011'
),

-- Dia 3 atras
(
  gen_random_uuid(),
  'Sincronizar contatos GHL → Supabase',
  'Upsert de 512 contatos atualizados no GHL para tabela leads no Supabase (delta sync)',
  'completed', 0.00045,
  NOW() - INTERVAL '3 days' + INTERVAL '6 hours',
  NOW() - INTERVAL '3 days' + INTERVAL '6 hours' + INTERVAL '68 seconds',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000006'
),

-- Dia 2 atras
(
  gen_random_uuid(),
  'Remover duplicatas: base WhatsApp',
  'Identificar e deduplicar 14 contatos repetidos na base (mesmo numero, nomes diferentes)',
  'completed', 0.00018,
  NOW() - INTERVAL '2 days' + INTERVAL '8 hours 30 minutes',
  NOW() - INTERVAL '2 days' + INTERVAL '8 hours 30 minutes' + INTERVAL '27 seconds',
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000007',
  'b0000000-0000-0000-0000-000000000012'
),

-- Dia 1 atras
(
  gen_random_uuid(),
  'Enfileirar FUU: leads sem resposta 7 dias',
  'Identificar e adicionar a fila de follow-up eterno 67 leads sem interacao ha 7 dias',
  'completed', 0.00022,
  NOW() - INTERVAL '1 day' + INTERVAL '9 hours',
  NOW() - INTERVAL '1 day' + INTERVAL '9 hours' + INTERVAL '33 seconds',
  'c0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000011'
),

-- Hoje
(
  gen_random_uuid(),
  'Gerar relatorio diario de custos',
  'Agregar metricas de custo do dia anterior e enviar notificacao WhatsApp para gestores',
  'failed', 0.00008,
  NOW() - INTERVAL '1 hour 30 minutes',
  NOW() - INTERVAL '1 hour 28 minutes',
  'c0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000006'
),

-- ========== CLONE TASKS (7) ==========

-- Dia 7 atras
(
  gen_random_uuid(),
  'Revisar copy: email nurturing semana 1',
  'Revisar e ajustar copy do email de boas-vindas aplicando framework SexyCanvas + AIDA',
  'completed', 0.00198,
  NOW() - INTERVAL '7 days' + INTERVAL '11 hours',
  NOW() - INTERVAL '7 days' + INTERVAL '11 hours 2 minutes 31 seconds',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000004'
),

-- Dia 5 atras
(
  gen_random_uuid(),
  'Aplicar framework Hormozi: oferta BPO Financeiro',
  'Reescrever oferta do produto BPO Financeiro aplicando estrutura Grand Slam Offer',
  'completed', 0.00287,
  NOW() - INTERVAL '5 days' + INTERVAL '14 hours',
  NOW() - INTERVAL '5 days' + INTERVAL '14 hours 3 minutes 45 seconds',
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000007'
),

-- Dia 4 atras
(
  gen_random_uuid(),
  'Gerar 5 headlines: landing page Cold Call AI',
  'Criar 5 variações de headline testáveis para LP do produto Cold Call AI usando dados reais',
  'completed', 0.00234,
  NOW() - INTERVAL '4 days' + INTERVAL '16 hours',
  NOW() - INTERVAL '4 days' + INTERVAL '16 hours 3 minutes',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000004'
),

-- Dia 3 atras
(
  gen_random_uuid(),
  'Adaptar script SDR: nicho odontologia',
  'Clonar script SDR padrao e adaptar terminologia, dores e gatilhos para nicho odonto',
  'completed', 0.00312,
  NOW() - INTERVAL '3 days' + INTERVAL '9 hours 30 minutes',
  NOW() - INTERVAL '3 days' + INTERVAL '9 hours 34 minutes 12 seconds',
  'c0000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000010'
),

-- Dia 2 atras
(
  gen_random_uuid(),
  'Revisar objecoes mapeadas: sazonalidade',
  'Atualizar banco de objecoes com novos padroes detectados em conversas do mes',
  'completed', 0.00145,
  NOW() - INTERVAL '2 days' + INTERVAL '10 hours',
  NOW() - INTERVAL '2 days' + INTERVAL '10 hours 1 minute 52 seconds',
  'c0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000007'
),

-- Dia 1 atras
(
  gen_random_uuid(),
  'Gerar variacoes A/B: mensagem follow-up dia 3',
  'Criar 3 variacoes do follow-up de dia 3 para teste A/B com diferentes angulos de abordagem',
  'in_progress', 0.00178,
  NOW() - INTERVAL '1 day' + INTERVAL '16 hours',
  NULL,
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000004'
),

-- Hoje
(
  gen_random_uuid(),
  'Gerar Big Idea: lancamento Assembly Line',
  'Criar conceito de Big Idea para campanha de lancamento do Assembly Line SaaS',
  'pending', 0,
  NOW() - INTERVAL '45 minutes',
  NULL,
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000010'
),

-- ========== HUMAN TASKS (5) ==========

-- Dia 6 atras
(
  gen_random_uuid(),
  'Aprovar conteudo: campanha Otica Lumar fev/2026',
  'Revisao humana final de 8 pecas de conteudo (posts + stories) antes da publicacao',
  'completed', 0,
  NOW() - INTERVAL '6 days' + INTERVAL '11 hours',
  NOW() - INTERVAL '6 days' + INTERVAL '13 hours 22 minutes',
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000008'
),

-- Dia 5 atras
(
  gen_random_uuid(),
  'Revisar contrato: novo cliente BPO Financeiro',
  'Leitura e aprovacao do contrato de prestacao de servicos antes da assinatura',
  'completed', 0,
  NOW() - INTERVAL '5 days' + INTERVAL '9 hours',
  NOW() - INTERVAL '5 days' + INTERVAL '10 hours 45 minutes',
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000009'
),

-- Dia 3 atras
(
  gen_random_uuid(),
  'Decidir preco: plano Growth Cold Call AI',
  'Definicao estrategica do preco do plano Growth baseado em analise competitiva e custo',
  'completed', 0,
  NOW() - INTERVAL '3 days' + INTERVAL '14 hours',
  NOW() - INTERVAL '3 days' + INTERVAL '15 hours 30 minutes',
  'c0000000-0000-0000-0000-000000000004',
  'd0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000008'
),

-- Dia 1 atras
(
  gen_random_uuid(),
  'Aprovar proposta: Vertex Sales Solutions',
  'Aprovacao final da proposta comercial personalizada antes do envio ao cliente',
  'in_progress', 0,
  NOW() - INTERVAL '1 day' + INTERVAL '14 hours',
  NULL,
  'c0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000008',
  'b0000000-0000-0000-0000-000000000009'
),

-- Hoje
(
  gen_random_uuid(),
  'Validar DNA psicologico: avatar Assembly Line',
  'Revisao e validacao humana do avatar de cliente criado pelo agente Assembly Line',
  'pending', 0,
  NOW() - INTERVAL '3 hours',
  NULL,
  'c0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000008'
);
