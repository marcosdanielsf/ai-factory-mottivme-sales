-- Migration 079: Onboarding Templates — onboarding_templates + seed data
-- Creates: onboarding_templates, seeds clinica / imobiliaria / servicos
-- Author: supabase-dba agent
-- Date: 2026-03-12
--
-- ROLLBACK PLAN:
-- BEGIN;
--   DROP TABLE IF EXISTS onboarding_templates;
-- COMMIT;

-- ---------------------------------------------------------------------------
-- 1. Tabela: onboarding_templates
--    Templates de steps por vertical (um template por vertical).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onboarding_templates (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical       TEXT        NOT NULL UNIQUE,
  template_name  TEXT        NOT NULL,
  steps          JSONB       NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_onboarding_templates"
  ON public.onboarding_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- 2. Seed: Template clinica
--    Inclui compliance CODAME/CFM e configuracao do bot medico.
-- ---------------------------------------------------------------------------
INSERT INTO public.onboarding_templates (vertical, template_name, steps)
VALUES (
  'clinica',
  'Onboarding Clinica Medica',
  '[
    {
      "step_number": 1,
      "step_key": "contrato_assinado",
      "step_label": "Contrato Assinado",
      "description": "Contrato de prestacao de servico assinado e arquivado.",
      "default_checklist": [
        "Contrato enviado ao cliente",
        "Contrato assinado digitalmente",
        "Copia arquivada no sistema",
        "NF-e emitida ou agendada"
      ]
    },
    {
      "step_number": 2,
      "step_key": "dados_coletados",
      "step_label": "Dados Coletados",
      "description": "Dados do negocio, especialidade medica, equipe e compliance coletados.",
      "default_checklist": [
        "Nome do medico responsavel (CRM)",
        "Especialidade e procedimentos ofertados",
        "Horario de atendimento",
        "Verificacao CODAME: bot nao diagnostica",
        "Verificacao CFM: bot nao substitui consulta",
        "Dados de contato da clinica (WhatsApp, endereco)",
        "Planos de saude aceitos",
        "Valores de consulta e procedimentos"
      ]
    },
    {
      "step_number": 3,
      "step_key": "location_ghl",
      "step_label": "Location GHL Criada",
      "description": "Sub-account criada no GoHighLevel com dados da clinica.",
      "default_checklist": [
        "Sub-account criada no GHL",
        "Numero de WhatsApp conectado",
        "Pipeline de agendamento configurado",
        "Tags de lead configuradas",
        "Calendario sincronizado"
      ]
    },
    {
      "step_number": 4,
      "step_key": "agent_version_criado",
      "step_label": "Agent Version Criado",
      "description": "Agent version criado no AI Factory com compliance medica.",
      "default_checklist": [
        "system_prompt com header # NOME v1.0.0 - CLINICA",
        "compliance_rules com proibicoes CODAME/CFM",
        "Modo SDR inbound configurado",
        "Modo scheduler configurado",
        "Modo concierge configurado",
        "business_config com dados da clinica",
        "qualification_config com criterios de agendamento"
      ]
    },
    {
      "step_number": 5,
      "step_key": "workflow_n8n_ativo",
      "step_label": "Workflow n8n Ativo",
      "description": "Workflow n8n conectado ao GHL e ao agent_version.",
      "default_checklist": [
        "Workflow de inbound ativo",
        "Webhook GHL configurado",
        "Roteamento por agent_mode funcionando",
        "Teste de ponta a ponta realizado",
        "Custos LLM mapeados no workflow de controle"
      ]
    },
    {
      "step_number": 6,
      "step_key": "primeiro_lead",
      "step_label": "Primeiro Lead Recebido",
      "description": "Primeiro lead real processado com sucesso pelo bot.",
      "default_checklist": [
        "Lead entrou pelo canal configurado",
        "Bot respondeu dentro do SLA",
        "Agendamento realizado ou lead qualificado",
        "Registro criado no GHL"
      ]
    },
    {
      "step_number": 7,
      "step_key": "review_48h",
      "step_label": "Review 48h",
      "description": "Revisao de qualidade 48h apos o primeiro lead.",
      "default_checklist": [
        "Taxa de resposta do bot > 90%",
        "Nenhuma violacao CODAME/CFM identificada",
        "NPS inicial coletado do cliente",
        "Ajustes de tom/compliance aplicados se necessario",
        "Cliente aprovado no onboarding"
      ]
    }
  ]'::jsonb
)
ON CONFLICT (vertical) DO UPDATE
  SET template_name = EXCLUDED.template_name,
      steps         = EXCLUDED.steps;

-- ---------------------------------------------------------------------------
-- 3. Seed: Template imobiliaria
-- ---------------------------------------------------------------------------
INSERT INTO public.onboarding_templates (vertical, template_name, steps)
VALUES (
  'imobiliaria',
  'Onboarding Imobiliaria',
  '[
    {
      "step_number": 1,
      "step_key": "contrato_assinado",
      "step_label": "Contrato Assinado",
      "description": "Contrato de prestacao de servico assinado e arquivado.",
      "default_checklist": [
        "Contrato enviado ao cliente",
        "Contrato assinado digitalmente",
        "Copia arquivada no sistema",
        "NF-e emitida ou agendada"
      ]
    },
    {
      "step_number": 2,
      "step_key": "dados_coletados",
      "step_label": "Dados Coletados",
      "description": "Dados do corretor/imobiliaria, empreendimentos, CRECI e publico-alvo coletados.",
      "default_checklist": [
        "Nome do corretor responsavel (CRECI)",
        "Empreendimentos ativos (nome, cidade, preco medio, tipologia)",
        "Publico-alvo (perfil do comprador ideal)",
        "Regiao de atuacao",
        "Canais de captacao de leads (Instagram, portal, indicacao)",
        "Condicoes de pagamento e financiamento",
        "Contato WhatsApp da equipe de vendas"
      ]
    },
    {
      "step_number": 3,
      "step_key": "location_ghl",
      "step_label": "Location GHL Criada",
      "description": "Sub-account criada no GHL com pipeline imobiliario.",
      "default_checklist": [
        "Sub-account criada no GHL",
        "Numero de WhatsApp conectado",
        "Pipeline imobiliario configurado (Novo Lead, Qualificado, Visita, Proposta, Fechado)",
        "Tags de perfil de comprador criadas",
        "Calendario de visitas integrado"
      ]
    },
    {
      "step_number": 4,
      "step_key": "agent_version_criado",
      "step_label": "Agent Version Criado",
      "description": "Agent version criado com conhecimento dos empreendimentos e BANT imobiliario.",
      "default_checklist": [
        "system_prompt com header # NOME v1.0.0 - IMOBILIARIA",
        "business_config com dados dos empreendimentos",
        "qualification_config com BANT imobiliario (budget, interesse em planta, prazo)",
        "Modo SDR inbound configurado",
        "Modo social_seller_instagram configurado",
        "Modo followuper configurado",
        "hyperpersonalization com regiao/estado configurado"
      ]
    },
    {
      "step_number": 5,
      "step_key": "workflow_n8n_ativo",
      "step_label": "Workflow n8n Ativo",
      "description": "Workflow n8n com integracao GHL e roteamento por modo ativo.",
      "default_checklist": [
        "Workflow de inbound ativo",
        "Webhook GHL configurado",
        "Roteamento por agent_mode funcionando",
        "Teste com lead simulado realizado",
        "Custos LLM mapeados no workflow de controle"
      ]
    },
    {
      "step_number": 6,
      "step_key": "primeiro_lead",
      "step_label": "Primeiro Lead Recebido",
      "description": "Primeiro lead real qualificado ou agendamento de visita realizado.",
      "default_checklist": [
        "Lead entrou pelo canal configurado",
        "Bot realizou qualificacao BANT",
        "Lead movido no pipeline do GHL",
        "Agendamento de visita ou follow-up programado"
      ]
    },
    {
      "step_number": 7,
      "step_key": "review_48h",
      "step_label": "Review 48h",
      "description": "Revisao de qualidade e ajuste fino do agente.",
      "default_checklist": [
        "Taxa de qualificacao de leads > 30%",
        "Nenhuma informacao errada sobre empreendimentos",
        "NPS inicial coletado do cliente",
        "Ajustes de tom ou business_config aplicados se necessario",
        "Cliente aprovado no onboarding"
      ]
    }
  ]'::jsonb
)
ON CONFLICT (vertical) DO UPDATE
  SET template_name = EXCLUDED.template_name,
      steps         = EXCLUDED.steps;

-- ---------------------------------------------------------------------------
-- 4. Seed: Template servicos (generico)
-- ---------------------------------------------------------------------------
INSERT INTO public.onboarding_templates (vertical, template_name, steps)
VALUES (
  'servicos',
  'Onboarding Servicos',
  '[
    {
      "step_number": 1,
      "step_key": "contrato_assinado",
      "step_label": "Contrato Assinado",
      "description": "Contrato de prestacao de servico assinado e arquivado.",
      "default_checklist": [
        "Contrato enviado ao cliente",
        "Contrato assinado digitalmente",
        "Copia arquivada no sistema",
        "NF-e emitida ou agendada"
      ]
    },
    {
      "step_number": 2,
      "step_key": "dados_coletados",
      "step_label": "Dados Coletados",
      "description": "Dados do negocio, servicos ofertados e publico-alvo coletados.",
      "default_checklist": [
        "Nome e descricao da empresa",
        "Servicos ofertados com preco",
        "Publico-alvo (ICP)",
        "Principais objecoes do mercado",
        "Diferenciais competitivos",
        "Contato WhatsApp comercial",
        "Horario de atendimento"
      ]
    },
    {
      "step_number": 3,
      "step_key": "location_ghl",
      "step_label": "Location GHL Criada",
      "description": "Sub-account criada no GHL com pipeline de vendas.",
      "default_checklist": [
        "Sub-account criada no GHL",
        "Numero de WhatsApp conectado",
        "Pipeline de vendas configurado",
        "Tags de qualificacao criadas"
      ]
    },
    {
      "step_number": 4,
      "step_key": "agent_version_criado",
      "step_label": "Agent Version Criado",
      "description": "Agent version criado no AI Factory com dados do servico.",
      "default_checklist": [
        "system_prompt com header # NOME v1.0.0 - SERVICOS",
        "business_config com dados do negocio",
        "qualification_config com criterios BANT",
        "Modo SDR inbound configurado",
        "Modo followuper configurado",
        "compliance_rules com proibicoes do segmento"
      ]
    },
    {
      "step_number": 5,
      "step_key": "workflow_n8n_ativo",
      "step_label": "Workflow n8n Ativo",
      "description": "Workflow n8n conectado ao GHL e testado.",
      "default_checklist": [
        "Workflow de inbound ativo",
        "Webhook GHL configurado",
        "Teste de ponta a ponta realizado",
        "Custos LLM mapeados no workflow de controle"
      ]
    },
    {
      "step_number": 6,
      "step_key": "primeiro_lead",
      "step_label": "Primeiro Lead Recebido",
      "description": "Primeiro lead real processado com sucesso.",
      "default_checklist": [
        "Lead entrou pelo canal configurado",
        "Bot respondeu dentro do SLA",
        "Lead qualificado ou encaminhado para humano"
      ]
    },
    {
      "step_number": 7,
      "step_key": "review_48h",
      "step_label": "Review 48h",
      "description": "Revisao de qualidade 48h apos o primeiro lead.",
      "default_checklist": [
        "Taxa de resposta do bot > 90%",
        "NPS inicial coletado do cliente",
        "Ajustes aplicados se necessario",
        "Cliente aprovado no onboarding"
      ]
    }
  ]'::jsonb
)
ON CONFLICT (vertical) DO UPDATE
  SET template_name = EXCLUDED.template_name,
      steps         = EXCLUDED.steps;
