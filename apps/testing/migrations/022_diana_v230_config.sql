-- =====================================================
-- DIANA v2.3.0 - SCHEMA COM DADOS REAIS
-- Flavia Leal Beauty School
-- Gerado em: 03/02/2026
-- Fonte: Flyers, imagens e documentos oficiais
-- =====================================================

-- =====================================================
-- 1. TABELA PRINCIPAL: CONFIGURAÇÃO DO AGENTE
-- =====================================================
DROP TABLE IF EXISTS agent_config_diana CASCADE;
CREATE TABLE agent_config_diana (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação
    agent_name VARCHAR(100) DEFAULT 'Diana',
    agent_version VARCHAR(20) DEFAULT '2.3.0',
    business_name VARCHAR(255) DEFAULT 'Flavia Leal Beauty School',
    business_type VARCHAR(100) DEFAULT 'beauty_school',

    -- Contatos oficiais
    contacts JSONB DEFAULT '{
        "phone_main": "(857) 303-1199",
        "phone_whatsapp": "(781) 995-4009",
        "phone_zelle": "(857) 366-0120",
        "email": "contact@flavialeal.com",
        "website": "www.flavialeal.com",
        "zelle_business_name": "Flavia Leal Zelle"
    }'::jsonb,

    -- Configurações de tom e personalidade
    personality JSONB DEFAULT '{
        "age_apparent": "28-32",
        "background": "Brasileira que imigrou para os EUA",
        "tone": "acolhedor, empático, profissional mas caloroso",
        "forbidden_nicknames": ["minha linda", "meu amor", "princesa"],
        "allowed_nicknames": ["querida"],
        "max_nickname_per_conversation": 1
    }'::jsonb,

    -- Configurações de formatação
    formatting_rules JSONB DEFAULT '{
        "max_lines_per_message": 4,
        "max_emoji_per_message": 1,
        "allowed_abbreviations": ["pra", "ta", "ne", "voce"],
        "forbidden_abbreviations": ["vc", "tb", "oq", "mto", "msg"],
        "break_tag": "[QUEBRA]",
        "max_breaks_per_response": 3
    }'::jsonb,

    -- Horário de funcionamento
    business_hours JSONB DEFAULT '{
        "timezone": "America/New_York",
        "monday": {"open": "09:00", "close": "18:00"},
        "tuesday": {"open": "09:00", "close": "18:00"},
        "wednesday": {"open": "09:00", "close": "18:00"},
        "thursday": {"open": "09:00", "close": "18:00"},
        "friday": {"open": "09:00", "close": "18:00"},
        "saturday": {"open": "09:00", "close": "18:00"},
        "sunday": null,
        "holiday_break": {
            "start": "2025-12-23",
            "end": "2026-01-05",
            "return": "2026-01-06"
        }
    }'::jsonb,

    -- Tempo de resposta (crítico baseado em análise)
    response_time_config JSONB DEFAULT '{
        "target_seconds": 300,
        "warning_seconds": 600,
        "critical_seconds": 3600,
        "lost_lead_threshold_hours": 24,
        "analysis_note": "31% das leads foram perdidas por demora de 24-38h"
    }'::jsonb,

    -- Idiomas suportados
    supported_languages TEXT[] DEFAULT ARRAY['pt', 'en', 'es'],
    default_language VARCHAR(10) DEFAULT 'pt',

    -- Fundadora (para micro-histórias)
    founder_name VARCHAR(255) DEFAULT 'Flavia Leal',
    founder_story TEXT DEFAULT 'A Flavia Leal veio do Brasil com um sonho. Começou trabalhando sozinha, investiu na formação, e hoje tem 4 escolas nos EUA. Ela criou a escola pensando em ajudar outras brasileiras a trilhar esse mesmo caminho.',

    -- Métricas de mercado (disclaimers obrigatórios)
    market_data JSONB DEFAULT '{
        "salary_range": "$45-60 por hora",
        "salary_disclaimer": "muitas profissionais ganham em média",
        "market_growth": "um dos que mais cresce nos EUA",
        "forbidden_claims": ["você vai ganhar", "garantido", "certeza"]
    }'::jsonb,

    -- Configurações de qualificação BANT
    bant_config JSONB DEFAULT '{
        "min_criteria_to_qualify": 3,
        "budget_question": "A escola tem diferentes formas de pagamento. Você prefere pagar à vista com desconto ou parcelado pra caber no orçamento?",
        "authority_question": "Essa decisão é só sua ou você precisa conversar com alguém?",
        "timeline_question": "Você tem ideia de quando gostaria de começar o curso?"
    }'::jsonb,

    -- YES SET (mínimo antes do preço)
    yes_set_config JSONB DEFAULT '{
        "min_agreements_before_price": 2,
        "questions": [
            "Você concorda que ter uma profissão valorizada nos EUA muda tudo, né?",
            "Imagino que ter um diploma reconhecido pelo estado seria importante pra você, certo?",
            "Poder trabalhar legalmente e com carteira na área que você ama... isso faz sentido pra você?",
            "Se existisse uma escola brasileira que te ajudasse com tudo, inclusive o visto, seria o ideal, né?"
        ]
    }'::jsonb,

    -- Cadência de follow-up
    followup_cadence JSONB DEFAULT '{
        "day_3": {"type": "leve", "tone": "casual, sem pressão"},
        "day_5": {"type": "valor", "tone": "educativo", "send_material": true},
        "day_7": {"type": "ultima", "tone": "direto, urgência leve"},
        "optimal_times": ["10:00", "15:00"],
        "timezone": "America/New_York"
    }'::jsonb,

    -- Cadência de reativação
    reactivation_cadence JSONB DEFAULT '{
        "day_30": {"approach": "novidade"},
        "day_60": {"approach": "conteudo_relevante"},
        "day_90": {"approach": "oferta_exclusiva"},
        "day_120": {"approach": "pesquisa"}
    }'::jsonb,

    -- Tecnologia de tradução (novo v2.3.0)
    translation_tech JSONB DEFAULT '{
        "has_live_translation": true,
        "device": "earbuds",
        "description": "earbuds com app de tradução ao vivo",
        "invite_to_try": "Se quiser, pode passar na escola pra testar antes de se matricular."
    }'::jsonb,

    -- Sistema online
    online_system JSONB DEFAULT '{
        "platform": "miladycima.com",
        "min_online_percent": 15,
        "max_online_percent": 49,
        "manicure_online_included": false,
        "min_test_score": 75
    }'::jsonb,

    -- Metadados
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir config padrão
INSERT INTO agent_config_diana DEFAULT VALUES;

-- =====================================================
-- 2. TABELA: UNIDADES/LOCALIZAÇÕES (DADOS REAIS)
-- =====================================================
DROP TABLE IF EXISTS diana_units CASCADE;
CREATE TABLE diana_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação
    unit_code VARCHAR(50) NOT NULL UNIQUE,
    unit_name VARCHAR(255) NOT NULL,

    -- Localização
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address_full TEXT NOT NULL,
    zip_code VARCHAR(20),

    -- Coordenadas (para cálculo de proximidade)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Contato
    phone VARCHAR(50) DEFAULT '(781) 995-4009',
    email VARCHAR(255) DEFAULT 'contact@flavialeal.com',

    -- Avaliações Google
    google_rating DECIMAL(2, 1),
    google_reviews INTEGER,

    -- Configurações
    is_active BOOLEAN DEFAULT true,
    accepts_visits BOOLEAN DEFAULT true,
    has_parking BOOLEAN DEFAULT true,

    -- Horários específicos (se diferente do padrão)
    custom_hours JSONB,

    -- Cursos disponíveis nesta unidade
    available_courses TEXT[],

    -- Instrutores por unidade
    instructors JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir unidades REAIS da Flavia Leal
INSERT INTO diana_units (unit_code, unit_name, state, city, address_full, zip_code, google_rating, google_reviews, available_courses, instructors) VALUES
(
    'MA_1',
    'Woburn',
    'Massachusetts',
    'Woburn',
    '36 Cummings Park Dr, Woburn, MA 01801',
    '01801',
    4.9,
    358,
    ARRAY['nail_design', 'cosmetology', 'esthetics', 'massage', 'electrolysis', 'barber'],
    '[
        {"name": "Carol", "courses": ["nail_design"]},
        {"name": "Kaká", "courses": ["nail_design"]},
        {"name": "Ana Paula", "courses": ["esthetics"]},
        {"name": "Roberta", "courses": ["esthetics"]}
    ]'::jsonb
),
(
    'MA_2',
    'Framingham',
    'Massachusetts',
    'Framingham',
    '63 Fountain St #501, Framingham, MA 01702',
    '01702',
    5.0,
    51,
    ARRAY['nail_design', 'esthetics'],
    '[
        {"name": "Patrícia", "courses": ["nail_design"]},
        {"name": "Amanda", "courses": ["nail_design"]}
    ]'::jsonb
),
(
    'MA_3',
    'Revere',
    'Massachusetts',
    'Revere',
    '268 Broadway, Revere, MA 02150',
    '02150',
    4.9,
    357,
    ARRAY['nail_design', 'esthetics', 'cosmetology'],
    '[
        {"name": "Kaká", "courses": ["nail_design"]}
    ]'::jsonb
),
(
    'FL_1',
    'Orlando',
    'Florida',
    'Orlando',
    '7600 Southland Blvd Suite 102, Orlando, FL 32809',
    '32809',
    4.8,
    18,
    ARRAY['nail_design', 'esthetics', 'cosmetology'],
    '{"hours_note": "Abre às 6PM"}'::jsonb
);

-- =====================================================
-- 3. TABELA: CURSOS PRINCIPAIS (DADOS REAIS)
-- =====================================================
DROP TABLE IF EXISTS diana_courses CASCADE;
CREATE TABLE diana_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação
    course_code VARCHAR(50) NOT NULL UNIQUE,
    course_name_pt VARCHAR(255) NOT NULL,
    course_name_en VARCHAR(255),
    course_name_es VARCHAR(255),
    course_type VARCHAR(50) NOT NULL, -- 'licenciamento' ou 'capacitacao'

    -- Detalhes do curso
    duration_hours INTEGER NOT NULL,
    duration_weeks INTEGER,
    duration_months INTEGER,
    description_pt TEXT,
    description_en TEXT,
    description_es TEXT,

    -- Preços REAIS
    price_full DECIMAL(10, 2) NOT NULL,
    price_currency VARCHAR(10) DEFAULT 'USD',
    discount_cash DECIMAL(10, 2), -- desconto à vista
    price_cash DECIMAL(10, 2), -- preço final à vista

    -- Taxa administrativa
    admin_fee DECIMAL(10, 2) DEFAULT 100.00,
    admin_fee_refundable BOOLEAN DEFAULT false,

    -- Entrada mínima
    min_down_payment DECIMAL(10, 2),

    -- Licenciamento
    license_state VARCHAR(100) DEFAULT 'Massachusetts',
    license_type VARCHAR(255),

    -- Requisitos
    min_age INTEGER DEFAULT 16,
    requires_tutor_if_minor BOOLEAN DEFAULT true,
    tutor_min_age INTEGER DEFAULT 21,

    -- Sistema online
    online_included BOOLEAN DEFAULT true,
    online_min_percent INTEGER DEFAULT 15,
    online_max_percent INTEGER DEFAULT 49,

    -- Disponibilidade
    is_active BOOLEAN DEFAULT true,
    units_available TEXT[],

    -- Flyer/Material URLs
    flyer_url_pt TEXT,
    flyer_url_en TEXT,
    flyer_url_es TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir CURSOS DE LICENCIAMENTO (valores reais dos flyers)
INSERT INTO diana_courses (
    course_code, course_name_pt, course_name_en, course_name_es, course_type,
    duration_hours, duration_weeks, duration_months,
    price_full, discount_cash, price_cash, min_down_payment,
    units_available, online_included
) VALUES
(
    'electrolysis',
    'Eletrólise',
    'Electrolysis',
    'Electrólisis',
    'licenciamento',
    1100, NULL, NULL,
    15500.00, 1450.00, 14050.00, 1200.00,
    ARRAY['MA_1'],
    true
),
(
    'barber',
    'Barbeiro',
    'Barber',
    'Barbero',
    'licenciamento',
    1000, NULL, NULL,
    15500.00, 1450.00, 14050.00, 1150.00,
    ARRAY['MA_1'],
    true
),
(
    'cosmetology',
    'Cosmetologia (Cabeleireiro)',
    'Cosmetology',
    'Cosmetología',
    'licenciamento',
    1000, NULL, NULL,
    15500.00, 1450.00, 14050.00, 1150.00,
    ARRAY['MA_1', 'MA_3', 'FL_1'],
    true
),
(
    'esthetics',
    'Estética',
    'Esthetics',
    'Estética',
    'licenciamento',
    600, 60, 15,
    10880.00, 1000.00, 9880.00, 840.00,
    ARRAY['MA_1', 'MA_2', 'MA_3', 'FL_1'],
    true
),
(
    'nail_design',
    'Manicure (Nail Design)',
    'Nail Design',
    'Diseño de Uñas',
    'licenciamento',
    130, 12, 3,
    2370.63, 200.00, 2170.63, 700.00,
    ARRAY['MA_1', 'MA_2', 'MA_3', 'FL_1'],
    false -- Online NÃO incluso no manicure
);

-- Inserir CURSOS DE CAPACITAÇÃO (valores reais dos flyers)
INSERT INTO diana_courses (
    course_code, course_name_pt, course_name_en, course_type,
    duration_hours, duration_weeks, duration_months,
    price_full, discount_cash, price_cash, admin_fee,
    units_available, online_included
) VALUES
(
    'depilacao',
    'Depilação',
    'Waxing',
    'capacitacao',
    16, NULL, NULL, -- 2 dias
    320.00, 32.00, 288.00, 25.00,
    ARRAY['MA_1', 'MA_2'],
    false
),
(
    'sobrancelhas',
    'Design de Sobrancelhas',
    'Eyebrow Design',
    'capacitacao',
    16, NULL, NULL, -- 2 dias
    570.00, 57.00, 513.00, 25.00,
    ARRAY['MA_1', 'MA_2'],
    false
),
(
    'cilios',
    'Extensão de Cílios',
    'Eyelash Extensions',
    'capacitacao',
    16, NULL, NULL, -- 2 dias
    998.00, 99.80, 898.20, 25.00,
    ARRAY['MA_1', 'MA_2'],
    false
),
(
    'maquiagem',
    'Maquiagem',
    'Makeup',
    'capacitacao',
    80, 20, NULL, -- 20 dias
    1975.00, 197.50, 1777.50, 25.00,
    ARRAY['MA_1', 'MA_2'],
    false
);

-- =====================================================
-- 4. TABELA: PRÓXIMAS TURMAS (DADOS REAIS)
-- =====================================================
DROP TABLE IF EXISTS diana_upcoming_classes CASCADE;
CREATE TABLE diana_upcoming_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_code VARCHAR(50) NOT NULL,
    unit_code VARCHAR(50) NOT NULL,

    -- Datas
    start_date DATE NOT NULL,
    end_date DATE,

    -- Horário
    days_of_week TEXT[], -- ['monday'], ['tuesday', 'thursday'], ['saturday']
    time_start TIME,
    time_end TIME,

    -- Detalhes
    duration_display VARCHAR(100), -- "3 meses/12 semanas"
    instructor_name VARCHAR(255),

    -- Vagas
    total_slots INTEGER,
    available_slots INTEGER,
    is_full BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_confirmed BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir TURMAS MANICURE (dados reais das imagens)
INSERT INTO diana_upcoming_classes (course_code, unit_code, start_date, days_of_week, time_start, time_end, duration_display, instructor_name) VALUES
('nail_design', 'MA_1', '2025-10-20', ARRAY['monday'], '09:00', '17:00', '3 meses/12 semanas', 'Carol'),
('nail_design', 'MA_2', '2025-11-08', ARRAY['saturday'], '09:00', '17:00', '3 meses/12 semanas', 'Patrícia'),
('nail_design', 'MA_3', '2026-01-17', ARRAY['saturday'], '09:00', '17:00', '3 meses/12 semanas', 'Kaká'),
('nail_design', 'MA_2', '2026-01-26', ARRAY['monday'], '09:00', '17:00', '3 meses/12 semanas', 'Amanda'),
('nail_design', 'MA_1', '2026-02-02', ARRAY['monday'], '09:00', '17:00', '3 meses/12 semanas', 'Kaká');

-- Inserir TURMAS ESTÉTICA (dados reais das imagens)
INSERT INTO diana_upcoming_classes (course_code, unit_code, start_date, days_of_week, time_start, time_end, duration_display, instructor_name) VALUES
('esthetics', 'MA_1', '2026-01-20', ARRAY['tuesday'], '09:00', '17:00', '15 meses/60 semanas', 'Ana Paula'),
('esthetics', 'MA_1', '2026-02-24', ARRAY['tuesday', 'thursday'], '09:00', '17:00', '7.5 meses/30 semanas', NULL),
('esthetics', 'MA_1', '2026-02-28', ARRAY['saturday'], '09:00', '17:00', '15 meses/60 semanas', 'Roberta');

-- Inserir TURMAS CAPACITAÇÃO (dados reais)
INSERT INTO diana_upcoming_classes (course_code, unit_code, start_date, days_of_week, time_start, time_end, duration_display, instructor_name, is_confirmed) VALUES
('depilacao', 'MA_1', '2025-08-01', NULL, NULL, NULL, '2 dias (16h)', NULL, true),
('sobrancelhas', 'MA_1', '2025-08-22', NULL, NULL, NULL, '2 dias (16h)', NULL, true),
('cilios', 'MA_1', '2025-09-12', NULL, NULL, NULL, '2 dias (16h)', NULL, true);

-- =====================================================
-- 5. TABELA: OPÇÕES DE PAGAMENTO (DADOS REAIS)
-- =====================================================
DROP TABLE IF EXISTS diana_payment_options CASCADE;
CREATE TABLE diana_payment_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_code VARCHAR(50) NOT NULL,

    option_name VARCHAR(255) NOT NULL,
    option_type VARCHAR(50) NOT NULL, -- full, weekly, monthly, custom

    -- Detalhes do parcelamento
    installments INTEGER,
    installment_value DECIMAL(10, 2),

    -- Desconto (se aplicável)
    discount_percent DECIMAL(5, 2),
    discount_value DECIMAL(10, 2),

    -- Descrição para o lead
    description_pt TEXT,
    description_en TEXT,

    -- Ordenação
    display_order INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir opções de pagamento REAIS
-- NAIL DESIGN
INSERT INTO diana_payment_options (course_code, option_name, option_type, installments, installment_value, discount_value, description_pt, display_order) VALUES
('nail_design', 'À vista com desconto', 'full', 1, 2170.63, 200.00, 'Pagamento integral com $200 de desconto', 1),
('nail_design', 'Semanal (12x)', 'weekly', 12, 197.55, NULL, 'Parcelamento em 12x semanais de $197.55', 2),
('nail_design', 'Mensal (3x)', 'monthly', 3, 790.21, NULL, 'Parcelamento em 3x mensais de $790.21', 3);

-- ESTÉTICA
INSERT INTO diana_payment_options (course_code, option_name, option_type, installments, installment_value, discount_value, description_pt, display_order) VALUES
('esthetics', 'À vista com desconto', 'full', 1, 9880.00, 1000.00, 'Pagamento integral com $1,000 de desconto', 1),
('esthetics', 'Semanal (60x)', 'weekly', 60, 181.33, NULL, 'Parcelamento em 60x semanais de $181.33', 2),
('esthetics', 'Mensal (15x)', 'monthly', 15, 725.33, NULL, 'Parcelamento em 15x mensais de $725.33', 3);

-- COSMETOLOGIA
INSERT INTO diana_payment_options (course_code, option_name, option_type, installments, installment_value, discount_value, description_pt, display_order) VALUES
('cosmetology', 'À vista com desconto', 'full', 1, 14050.00, 1450.00, 'Pagamento integral com $1,450 de desconto', 1),
('cosmetology', 'Parcelado', 'custom', NULL, NULL, NULL, 'Parcelamento personalizado - consultar', 2);

-- ELETRÓLISE
INSERT INTO diana_payment_options (course_code, option_name, option_type, installments, installment_value, discount_value, description_pt, display_order) VALUES
('electrolysis', 'À vista com desconto', 'full', 1, 14050.00, 1450.00, 'Pagamento integral com $1,450 de desconto', 1),
('electrolysis', 'Parcelado', 'custom', NULL, NULL, NULL, 'Parcelamento personalizado - consultar', 2);

-- BARBER
INSERT INTO diana_payment_options (course_code, option_name, option_type, installments, installment_value, discount_value, description_pt, display_order) VALUES
('barber', 'À vista com desconto', 'full', 1, 14050.00, 1450.00, 'Pagamento integral com $1,450 de desconto', 1),
('barber', 'Parcelado', 'custom', NULL, NULL, NULL, 'Parcelamento personalizado - consultar', 2);

-- CAPACITAÇÕES
INSERT INTO diana_payment_options (course_code, option_name, option_type, installments, installment_value, discount_value, description_pt, display_order) VALUES
('depilacao', 'À vista com 10% desconto', 'full', 1, 288.00, 32.00, 'Pagamento integral com 10% de desconto', 1),
('sobrancelhas', 'À vista com 10% desconto', 'full', 1, 513.00, 57.00, 'Pagamento integral com 10% de desconto', 1),
('cilios', 'À vista com 10% desconto', 'full', 1, 898.20, 99.80, 'Pagamento integral com 10% de desconto', 1),
('maquiagem', 'À vista com 10% desconto', 'full', 1, 1777.50, 197.50, 'Pagamento integral com 10% de desconto', 1);

-- =====================================================
-- 6. TABELA: DEPOIMENTOS (placeholder para dados reais)
-- =====================================================
DROP TABLE IF EXISTS diana_testimonials CASCADE;
CREATE TABLE diana_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação
    testimonial_code VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,

    -- Contexto de uso
    context_tags TEXT[] NOT NULL,
    course_area VARCHAR(100),

    -- História
    situation_before TEXT,
    challenge TEXT,
    solution TEXT,
    result TEXT NOT NULL,
    time_to_result VARCHAR(100),

    -- Versões
    story_short TEXT,
    story_medium TEXT,
    story_full TEXT,

    -- Dados demográficos
    origin_country VARCHAR(100) DEFAULT 'Brasil',
    origin_city VARCHAR(100),
    destination_state VARCHAR(100),
    had_experience_before BOOLEAN DEFAULT false,
    spoke_english_before BOOLEAN DEFAULT false,
    needed_visa BOOLEAN DEFAULT false,

    -- Metadados
    is_verified BOOLEAN DEFAULT true,
    consent_given BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir depoimentos PLACEHOLDER (substituir por reais quando disponíveis)
INSERT INTO diana_testimonials (
    testimonial_code, display_name, context_tags, course_area,
    situation_before, challenge, result, time_to_result,
    story_short, story_medium,
    origin_city, destination_state, had_experience_before, spoke_english_before, needed_visa
) VALUES
(
    'PLACEHOLDER_001',
    'Ana',
    ARRAY['idioma', 'educacao', 'superacao'],
    'nail_design',
    'Trabalhava em outra área',
    'Não falava inglês, medo de começar',
    'Trabalha como nail tech em Massachusetts',
    '6 meses',
    'A Ana veio do Brasil sem falar inglês. Hoje ela trabalha como nail tech em Massachusetts.',
    'A Ana não falava uma palavra de inglês quando chegou. Tinha medo de não conseguir. Hoje, 6 meses depois, ela trabalha como nail tech e atende clientes americanas com confiança.',
    NULL,
    'Massachusetts',
    false,
    false,
    true
),
(
    'PLACEHOLDER_002',
    'Carla',
    ARRAY['financeiro', 'objecao', 'fechamento'],
    'esthetics',
    'Preocupada com o investimento',
    'Dificuldade financeira inicial',
    'Recuperou o investimento trabalhando na área',
    '4 meses',
    'A Carla achou que não ia conseguir pagar. Em 4 meses trabalhando já tinha recuperado todo o investimento.',
    'A Carla tinha medo de investir porque a situação financeira estava apertada. Usou o plano de parcelamento e, em apenas 4 meses trabalhando na área, já tinha recuperado todo o investimento do curso.',
    NULL,
    'Massachusetts',
    true,
    false,
    false
),
(
    'PLACEHOLDER_003',
    'Maria',
    ARRAY['visto', 'educacao', 'i20'],
    'cosmetology',
    'Precisava do I-20 para estudar legalmente',
    'Processo de visto parecia complicado',
    'Conseguiu o I-20 e está estudando legalmente',
    NULL,
    'A Maria precisava do I-20 e não sabia por onde começar. A escola cuidou de todo o processo.',
    'A Maria precisava do I-20 e achava que seria impossível conseguir. A escola preparou toda a documentação e orientou cada passo. Ela conseguiu o visto e hoje estuda legalmente enquanto constrói sua carreira.',
    NULL,
    'Florida',
    false,
    true,
    true
);

-- =====================================================
-- 7. TABELA: OBJEÇÕES E SCRIPTS (13 objeções v2.3.0)
-- =====================================================
DROP TABLE IF EXISTS diana_objections CASCADE;
CREATE TABLE diana_objections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    objection_code VARCHAR(50) NOT NULL UNIQUE,
    objection_number INTEGER NOT NULL,

    -- Identificação
    name_pt VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),

    -- Gatilhos
    trigger_phrases_pt TEXT[],
    trigger_phrases_en TEXT[],
    trigger_phrases_es TEXT[],

    -- Script de tratamento
    script_steps JSONB NOT NULL,

    -- Configurações
    requires_escalation BOOLEAN DEFAULT false,
    escalation_condition TEXT,
    max_attempts INTEGER DEFAULT 3,

    -- Métricas
    frequency_percent DECIMAL(5, 2),
    resolution_rate DECIMAL(5, 2),
    source_analysis TEXT,

    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '2.3.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir todas as 13 objeções mapeadas
INSERT INTO diana_objections (objection_code, objection_number, name_pt, name_en, trigger_phrases_pt, trigger_phrases_en, script_steps, frequency_percent, source_analysis) VALUES
-- #1 PREÇO
('price_high', 1, 'É muito caro / Não tenho dinheiro', 'Too expensive',
ARRAY['caro', 'não tenho dinheiro', 'muito caro', 'fora do orçamento', 'não consigo pagar'],
ARRAY['expensive', 'cant afford', 'too much', 'no money'],
'{
    "steps": [
        {"step": 1, "action": "acolher", "script": "Entendo, [LEAD]. Investir na formação é uma decisão importante."},
        {"step": 2, "action": "roi", "script": "Muitas profissionais de beleza formadas aqui nos EUA ganham em média $45-60 por hora. O retorno costuma vir em poucos meses."},
        {"step": 3, "action": "projecao", "script": "Imagina como seria ter uma profissão que você ama E que te dá independência financeira aqui nos EUA..."},
        {"step": 4, "action": "prova_social", "tool": "Busca_depoimentos", "context": "financeiro"},
        {"step": 5, "action": "opcoes", "script": "Temos opções de pagamento: à vista com desconto ou parcelado semanal/mensal. Qual fica melhor pra você?"},
        {"step": 6, "action": "flexibilidade", "script": "E sobre a data de pagamento, a gente consegue ser flexível. Você pode pagar no dia que começar o curso."},
        {"step": 7, "action": "entrada", "script": "A entrada mínima é [VALOR_ENTRADA]. Assim você já garante sua vaga."},
        {"step": 8, "action": "fallback", "script": "Posso te enviar nosso guia gratuito. Posso entrar em contato quando você estiver pronta?"}
    ]
}'::jsonb, 23.0, 'Análise 13 conversas Kommo - 02/2026'),

-- #2 PRECISO PENSAR
('need_to_think', 2, 'Preciso pensar / Vou conversar com família', 'Need to think',
ARRAY['preciso pensar', 'vou pensar', 'vou conversar', 'falar com meu marido', 'falar com minha família'],
ARRAY['need to think', 'talk to my husband', 'talk to family'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "Claro, [LEAD], é uma decisão importante!"},
        {"step": 2, "action": "descobrir", "script": "Me conta: o que especificamente você quer avaliar? Assim consigo te ajudar a ter clareza."},
        {"step": 3, "action": "escassez", "script": "A próxima turma começa em [DATA]. As vagas são limitadas."},
        {"step": 4, "action": "facilitar", "script": "Quer que eu prepare um resumo pra você mostrar pro seu [familiar]?"},
        {"step": 5, "action": "reserva", "script": "Posso reservar sua vaga sem compromisso. Se até [DATA] você decidir não ir, cancelamos. Faz sentido?"}
    ]
}'::jsonb, NULL, 'Diana v2.3.0'),

-- #3 IDIOMA
('language_barrier', 3, 'Não falo inglês / Medo do idioma', 'Language barrier',
ARRAY['não falo inglês', 'não falo ingles', 'só falo português', 'medo do idioma'],
ARRAY['dont speak portuguese', 'only speak english', 'only speak spanish', 'language'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "Entendo totalmente, [LEAD]. Essa é uma preocupação super comum."},
        {"step": 2, "action": "resolver", "script": "A Flavia Leal tem aulas em português, inglês e espanhol. Você vai aprender no seu idioma!"},
        {"step": 3, "action": "tecnologia", "script": "E temos earbuds com app de tradução ao vivo. Se quiser, pode passar na escola pra testar antes de se matricular."},
        {"step": 4, "action": "prova_social", "tool": "Busca_depoimentos", "context": "idioma"},
        {"step": 5, "action": "bonus", "script": "Durante o curso, você ainda vai aprender o vocabulário técnico em inglês naturalmente."}
    ]
}'::jsonb, 23.0, 'Análise 13 conversas Kommo - 02/2026'),

-- #4 VISTO
('visa_fear', 4, 'O visto é complicado / Medo do processo', 'Visa fear',
ARRAY['visto', 'i-20', 'i20', 'imigração', 'complicado'],
ARRAY['visa', 'immigration', 'complicated', 'i-20'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "Entendo sua preocupação, [LEAD]. O processo pode parecer complicado quando você não conhece."},
        {"step": 2, "action": "diferenciar", "script": "Um dos maiores diferenciais da Flavia Leal é que a escola te ajuda com TODO o processo do visto I-20."},
        {"step": 3, "action": "explicar", "script": "A escola prepara toda a documentação e te orienta em cada passo. O I-20 permite você estudar legalmente nos EUA."},
        {"step": 4, "action": "prova_social", "tool": "Busca_depoimentos", "context": "visto"},
        {"step": 5, "action": "proximo_passo", "script": "Quer que eu te explique como funciona passo a passo?"}
    ],
    "critical_rule": "NUNCA prometa aprovação de visto. Diga que a escola AJUDA com o processo."
}'::jsonb, NULL, 'Diana v2.3.0'),

-- #5 JÁ TENTEI ANTES
('tried_before', 5, 'Já tentei estudar antes e não deu certo', 'Tried before',
ARRAY['já tentei', 'não deu certo', 'tentei antes', 'desisti'],
ARRAY['tried before', 'didnt work', 'gave up'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "Entendo sua frustração, [LEAD]. Posso perguntar o que você tentou?"},
        {"step": 2, "action": "sensorial", "script": "Imagine se dessa vez fosse diferente... apoio em português, professoras que entendem sua jornada..."},
        {"step": 3, "action": "diferenciar", "script": "A Flavia Leal foi criada POR uma brasileira PARA brasileiras. A Flavia entende exatamente os desafios que você enfrenta."},
        {"step": 4, "action": "prova_social", "tool": "Busca_depoimentos", "context": "superacao"}
    ]
}'::jsonb, NULL, 'Diana v2.3.0'),

-- #6 NÃO SEI SE É A ÁREA
('unsure_career', 6, 'Não sei se é a área certa pra mim', 'Unsure about career',
ARRAY['não sei se é', 'área certa', 'será que é pra mim', 'dúvida'],
ARRAY['not sure', 'right career', 'dont know if'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "É normal ter essa dúvida, [LEAD]. Escolher uma profissão é algo sério."},
        {"step": 2, "action": "discovery", "script": "Me conta: o que te atraiu na área de beleza inicialmente?"},
        {"step": 3, "action": "educacao", "script": "O mercado de beleza nos EUA é um dos que mais cresce. Profissionais ganham em média $45-60/hora."},
        {"step": 4, "action": "convite", "script": "Que tal agendar uma visita pra conhecer a escola pessoalmente? Assim você sente o ambiente."}
    ]
}'::jsonb, NULL, 'Diana v2.3.0'),

-- #7 VOU PESQUISAR
('will_research', 7, 'Vou pesquisar outras escolas', 'Will research other schools',
ARRAY['pesquisar', 'outras escolas', 'comparar', 'ver outras opções'],
ARRAY['research', 'other schools', 'compare', 'other options'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "Claro, [LEAD]! Pesquisar é super importante antes de decidir."},
        {"step": 2, "action": "diferenciais", "script": "Quando for comparar, presta atenção: aulas em português, ajuda com visto I-20, e histórico de alunas formadas."},
        {"step": 3, "action": "material", "script": "Quer que eu te mande um guia com os pontos que você deve avaliar em qualquer escola?"},
        {"step": 4, "action": "porta_aberta", "script": "Pesquisa com calma e quando quiser voltar a conversar, to aqui!"}
    ],
    "critical_rule": "NUNCA falar mal de concorrentes."
}'::jsonb, NULL, 'Diana v2.3.0'),

-- #8 HORÁRIO
('no_time', 8, 'Não tenho tempo / Horário não dá', 'No time / Schedule',
ARRAY['não tenho tempo', 'horário não dá', 'esse horário', 'sem ser de 9', 'só de noite'],
ARRAY['no time', 'schedule doesnt work', 'only at night'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "Imagino, [LEAD]! A rotina aqui nos EUA é puxada mesmo."},
        {"step": 2, "action": "explorar", "script": "Antes de dizer que não temos seu horário, deixa eu verificar todas as unidades. Qual seria o melhor horário pra você?"},
        {"step": 3, "action": "resolver", "script": "Temos turmas em Woburn, Framingham e Revere com horários diferentes. Segundas 9-17h, Sábados 9-17h, e noturnas terça/quinta 18-22h."},
        {"step": 4, "action": "reframe", "script": "Muitas alunas trabalham e estudam ao mesmo tempo. A escola é pensada pra isso."},
        {"step": 5, "action": "prova_social", "tool": "Busca_depoimentos", "context": "objecao"},
        {"step": 6, "action": "fallback", "script": "Se realmente não encaixa agora, posso te avisar quando abrir turma em horário diferente?"}
    ]
}'::jsonb, 23.0, 'Análise 13 conversas Kommo - 02/2026'),

-- #9 TIMING FUTURO (NOVA v2.3.0)
('timing_future', 9, 'Quero fazer depois / Timing futuro', 'Want to do later',
ARRAY['quero fazer depois', 'vou começar em', 'mais pra frente', 'próximo ano', 'setembro'],
ARRAY['maybe around', 'later this year', 'next year', 'in september'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "Claro, [LEAD]! [MÊS] funciona sim."},
        {"step": 2, "action": "explorar", "script": "Posso perguntar o que te faz preferir esperar? Assim consigo te ajudar melhor."},
        {"step": 3, "action": "compromisso", "script": "Se quiser, posso te avisar quando abrir a turma e te garantir uma vaga antecipada."},
        {"step": 4, "action": "capturar", "script": "Me passa seu email que te mando um lembrete mais perto da data, combinado?"},
        {"step": 5, "action": "fallback", "note": "Adicionar à lista de reativação com data futura. NÃO desistir."}
    ],
    "critical_rule": "NUNCA responda apenas Yes ou Pode ser. SEMPRE crie compromisso futuro."
}'::jsonb, 8.0, 'Análise 13 conversas Kommo - 02/2026 - NOVA'),

-- #10 MENOR DE IDADE (NOVA v2.3.0)
('minor_age', 10, 'Menor de idade (precisa tutor 21+)', 'Minor age',
ARRAY['tenho 16', 'tenho 17', 'menor de idade', '16 anos', '17 anos'],
ARRAY['im 16', 'im 17', 'minor', 'years old'],
'{
    "steps": [
        {"step": 1, "action": "acolher", "script": "Que legal seu interesse, [LEAD]! Com [IDADE] anos você já está pensando no seu futuro."},
        {"step": 2, "action": "explicar", "script": "Você pode sim fazer o curso! Só precisa de um responsável maior de 21 anos pra assinar o contrato."},
        {"step": 3, "action": "facilitar", "script": "Pode ser sua mãe, pai, tio, primo... Você tem alguém que poderia te acompanhar?"},
        {"step": 4, "action": "se_tiver", "script": "Ótimo! Quer que eu mande as informações pra você mostrar?"},
        {"step": 5, "action": "se_nao_souber", "script": "Conversa com sua família e me avisa! Posso tirar as dúvidas deles também."},
        {"step": 6, "action": "escalation", "tool": "Escalar_humano", "condition": "sem responsável"}
    ],
    "critical_rule": "NUNCA pressionar menor de idade. Sempre envolver responsável."
}'::jsonb, 8.0, 'Análise 13 conversas Kommo - 02/2026 - NOVA'),

-- #11 DIPLOMA BRASILEIRO (NOVA v2.3.0)
('brazilian_diploma', 11, 'Já tenho formação no Brasil', 'Has Brazilian diploma',
ARRAY['diploma brasileiro', 'formação no brasil', 'já tenho curso', 'meu diploma serve', 'validar diploma'],
ARRAY['brazilian diploma', 'course in brazil', 'validate diploma'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "Que legal que você já tem experiência, [LEAD]! Isso vai te ajudar muito."},
        {"step": 2, "action": "realidade", "script": "Infelizmente os diplomas brasileiros não são reconhecidos diretamente aqui. Você precisa fazer a formação pra obter a licença do estado."},
        {"step": 3, "action": "reframe", "script": "A boa notícia é que sua experiência vai acelerar seu aprendizado. Muitas alunas que já trabalhavam no Brasil se destacam."},
        {"step": 4, "action": "diferencial", "script": "E o diploma da Flavia Leal é reconhecido pelo estado. Você sai pronta pra trabalhar legalmente."},
        {"step": 5, "action": "proximo_passo", "script": "Quer que eu te explique como funciona o processo de licenciamento?"}
    ],
    "critical_rule": "NUNCA prometer validação de diploma brasileiro."
}'::jsonb, 8.0, 'Análise 13 conversas Kommo - 02/2026 - NOVA'),

-- #12 ITIN/DOCUMENTAÇÃO (NOVA v2.3.0)
('itin_documentation', 12, 'Preciso de ITIN / Documentação', 'ITIN / Documentation',
ARRAY['itin', 'documentação', 'documentos', 'número de identidade'],
ARRAY['itin number', 'documentation', 'papers', 'documents'],
'{
    "steps": [
        {"step": 1, "action": "validar", "script": "Boa pergunta, [LEAD]! Muitas alunas têm essa dúvida."},
        {"step": 2, "action": "orientar", "script": "O ITIN é um processo que varia caso a caso. Recomendo conversar com um contador ou advogado de imigração."},
        {"step": 3, "action": "tranquilizar", "script": "Muitas alunas nossas fizeram o curso enquanto resolviam a documentação. A escola te orienta sobre o que você vai precisar."},
        {"step": 4, "action": "foco", "script": "Quer que eu te mande as informações do curso enquanto isso?"}
    ],
    "critical_rule": "NUNCA dar conselho jurídico sobre ITIN ou imigração."
}'::jsonb, 8.0, 'Análise 13 conversas Kommo - 02/2026 - NOVA'),

-- #13 CRISE FINANCEIRA GRAVE (NOVA v2.3.0)
('severe_financial', 13, 'Crise financeira grave (desemprego)', 'Severe financial crisis',
ARRAY['desemprego', 'desempregado', 'perdi o emprego', 'sem trabalho', 'crise', 'não consigo de jeito nenhum'],
ARRAY['unemployed', 'lost my job', 'crisis', 'cant afford at all'],
'{
    "steps": [
        {"step": 1, "action": "acolher", "script": "Entendo, [LEAD]. Essa fase é difícil mesmo, especialmente morando longe da família."},
        {"step": 2, "action": "nao_pressionar", "note": "NUNCA tente contornar quando a pessoa claramente NÃO pode."},
        {"step": 3, "action": "porta_aberta", "script": "A escola vai continuar aqui quando você estiver pronta. Imprevistos acontecem."},
        {"step": 4, "action": "valor", "script": "Enquanto isso, posso te mandar nosso guia gratuito sobre carreiras de beleza."},
        {"step": 5, "action": "compromisso", "script": "Posso entrar em contato daqui a alguns meses pra ver como você está?"}
    ],
    "critical_rule": "Na crise real, ACOLHER > VENDER. Baseado em Conversa 006 (recuperada)."
}'::jsonb, 8.0, 'Análise 13 conversas Kommo - 02/2026 - NOVA');

-- =====================================================
-- 8. TABELA: HIPERPERSONALIZAÇÃO
-- =====================================================
DROP TABLE IF EXISTS diana_hyperpersonalization CASCADE;
CREATE TABLE diana_hyperpersonalization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Saudação por período
    greeting_rules JSONB DEFAULT '{
        "morning": {"start": "05:00", "end": "11:59", "pt": "Bom dia", "en": "Good morning", "es": "Buenos días"},
        "afternoon": {"start": "12:00", "end": "17:59", "pt": "Boa tarde", "en": "Good afternoon", "es": "Buenas tardes"},
        "evening": {"start": "18:00", "end": "04:59", "pt": "Boa noite", "en": "Good evening", "es": "Buenas noches"}
    }'::jsonb,

    -- Detecção de idioma
    language_detection JSONB DEFAULT '{
        "pt_indicators": ["olá", "oi", "bom dia", "boa tarde", "gostaria", "quero", "quanto custa", "informações"],
        "en_indicators": ["hello", "hi", "good morning", "would like", "want to", "how much", "information"],
        "es_indicators": ["hola", "buenos", "quiero", "cuánto", "me gustaría", "información"]
    }'::jsonb,

    -- Unidade mais próxima por cidade
    nearest_unit_rules JSONB DEFAULT '{
        "massachusetts": {
            "default": "MA_1",
            "woburn": "MA_1",
            "boston": "MA_1",
            "lowell": "MA_1",
            "framingham": "MA_2",
            "nantucket": "MA_2",
            "revere": "MA_3",
            "lynn": "MA_3",
            "chelsea": "MA_3"
        },
        "florida": {
            "default": "FL_1",
            "orlando": "FL_1"
        },
        "brazil": {
            "default": null,
            "question": "Você está planejando vir pra Massachusetts ou Florida?"
        }
    }'::jsonb,

    -- Personalização por origem
    origin_personalization JSONB DEFAULT '{
        "brazil": {
            "empathy_phrases": [
                "Entendo sua jornada, muitas brasileiras passam por isso",
                "A saudade de casa é real, mas você está construindo algo lindo aqui"
            ],
            "reference_founder": true
        },
        "hispanic": {
            "empathy_phrases": [
                "Muchas latinas pasan por lo mismo",
                "Entiendo lo difícil que puede ser empezar en otro país"
            ]
        }
    }'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO diana_hyperpersonalization DEFAULT VALUES;

-- =====================================================
-- 9. TABELA: MATERIAIS E FLYERS
-- =====================================================
DROP TABLE IF EXISTS diana_materials CASCADE;
CREATE TABLE diana_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    material_code VARCHAR(50) NOT NULL UNIQUE,
    material_type VARCHAR(50) NOT NULL,

    name_pt VARCHAR(255),
    name_en VARCHAR(255),

    description TEXT,

    url_pt TEXT,
    url_en TEXT,

    use_context TEXT[],
    course_code VARCHAR(50),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir materiais (URLs a preencher)
INSERT INTO diana_materials (material_code, material_type, name_pt, name_en, use_context, course_code) VALUES
('guia_carreira', 'guide', 'Guia de Carreira de Beleza nos EUA', 'Beauty Career Guide USA', ARRAY['followup', 'reativacao', 'valor'], NULL),
('guia_visto', 'guide', 'Guia sobre Visto I-20 de Estudante', 'I-20 Student Visa Guide', ARRAY['objecao_visto', 'educacao'], NULL),
('portfolio_escola', 'pdf', 'Portfólio da Flavia Leal Beauty School', 'School Portfolio', ARRAY['fechamento', 'comparacao'], NULL),
('flyer_nail', 'flyer', 'Flyer Curso Manicure', 'Nail Design Flyer', ARRAY['curso_nail'], 'nail_design'),
('flyer_esthetics', 'flyer', 'Flyer Curso Estética', 'Esthetics Flyer', ARRAY['curso_esthetics'], 'esthetics'),
('flyer_cosmetology', 'flyer', 'Flyer Curso Cosmetologia', 'Cosmetology Flyer', ARRAY['curso_cosmetology'], 'cosmetology'),
('flyer_electrolysis', 'flyer', 'Flyer Curso Eletrólise', 'Electrolysis Flyer', ARRAY['curso_electrolysis'], 'electrolysis'),
('flyer_barber', 'flyer', 'Flyer Curso Barbeiro', 'Barber Flyer', ARRAY['curso_barber'], 'barber'),
('flyer_capacitacoes', 'flyer', 'Flyer Cursos de Capacitação', 'Training Courses Flyer', ARRAY['capacitacao'], NULL);

-- =====================================================
-- 10. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_diana_units_state ON diana_units(state);
CREATE INDEX IF NOT EXISTS idx_diana_units_active ON diana_units(is_active);
CREATE INDEX IF NOT EXISTS idx_diana_courses_active ON diana_courses(is_active);
CREATE INDEX IF NOT EXISTS idx_diana_courses_code ON diana_courses(course_code);
CREATE INDEX IF NOT EXISTS idx_diana_courses_type ON diana_courses(course_type);
CREATE INDEX IF NOT EXISTS idx_diana_upcoming_course ON diana_upcoming_classes(course_code);
CREATE INDEX IF NOT EXISTS idx_diana_upcoming_unit ON diana_upcoming_classes(unit_code);
CREATE INDEX IF NOT EXISTS idx_diana_upcoming_date ON diana_upcoming_classes(start_date);
CREATE INDEX IF NOT EXISTS idx_diana_testimonials_context ON diana_testimonials USING GIN(context_tags);
CREATE INDEX IF NOT EXISTS idx_diana_objections_code ON diana_objections(objection_code);

-- =====================================================
-- 11. FUNÇÕES ÚTEIS
-- =====================================================

-- Função para buscar próxima turma de um curso
CREATE OR REPLACE FUNCTION get_next_class(p_course_code VARCHAR, p_unit_code VARCHAR DEFAULT NULL)
RETURNS TABLE(
    start_date DATE,
    unit_name VARCHAR,
    days TEXT,
    time_display VARCHAR,
    instructor VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.start_date,
        u.unit_name,
        array_to_string(c.days_of_week, ', '),
        CONCAT(c.time_start::VARCHAR, ' - ', c.time_end::VARCHAR),
        c.instructor_name
    FROM diana_upcoming_classes c
    JOIN diana_units u ON u.unit_code = c.unit_code
    WHERE c.course_code = p_course_code
    AND c.is_active = true
    AND c.start_date >= CURRENT_DATE
    AND (p_unit_code IS NULL OR c.unit_code = p_unit_code)
    ORDER BY c.start_date
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- Função para formatar preço do curso
CREATE OR REPLACE FUNCTION get_course_pricing(p_course_code VARCHAR)
RETURNS TABLE(
    course_name VARCHAR,
    price_full DECIMAL,
    price_cash DECIMAL,
    discount DECIMAL,
    min_entry DECIMAL,
    payment_options JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.course_name_pt,
        c.price_full,
        c.price_cash,
        c.discount_cash,
        c.min_down_payment,
        (SELECT json_agg(row_to_json(p)) FROM diana_payment_options p WHERE p.course_code = c.course_code AND p.is_active = true)
    FROM diana_courses c
    WHERE c.course_code = p_course_code;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar texto de preço formatado
CREATE OR REPLACE FUNCTION format_course_price_text(p_course_code VARCHAR, p_language VARCHAR DEFAULT 'pt')
RETURNS TEXT AS $$
DECLARE
    v_course RECORD;
    v_result TEXT;
BEGIN
    SELECT * INTO v_course FROM diana_courses WHERE course_code = p_course_code;

    IF p_language = 'pt' THEN
        v_result := format(
            'O investimento no curso de %s é $%s. À vista com desconto: $%s (economia de $%s). Entrada mínima: $%s.',
            v_course.course_name_pt,
            v_course.price_full,
            v_course.price_cash,
            v_course.discount_cash,
            v_course.min_down_payment
        );
    ELSE
        v_result := format(
            'The investment for %s is $%s. Cash payment with discount: $%s (save $%s). Minimum down payment: $%s.',
            v_course.course_name_en,
            v_course.price_full,
            v_course.price_cash,
            v_course.discount_cash,
            v_course.min_down_payment
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. VIEW COMPLETA PARA O WORKFLOW N8N
-- =====================================================
CREATE OR REPLACE VIEW v_diana_full_config AS
SELECT
    c.agent_name,
    c.agent_version,
    c.business_name,
    c.contacts,
    c.personality,
    c.formatting_rules,
    c.business_hours,
    c.response_time_config,
    c.supported_languages,
    c.market_data,
    c.bant_config,
    c.yes_set_config,
    c.followup_cadence,
    c.reactivation_cadence,
    c.translation_tech,
    c.online_system,
    (SELECT json_agg(row_to_json(u)) FROM diana_units u WHERE u.is_active = true) as units,
    (SELECT json_agg(row_to_json(course)) FROM diana_courses course WHERE course.is_active = true) as courses,
    (SELECT json_agg(row_to_json(obj)) FROM diana_objections obj WHERE obj.is_active = true ORDER BY obj.objection_number) as objections,
    (SELECT json_agg(row_to_json(cls)) FROM diana_upcoming_classes cls WHERE cls.is_active = true AND cls.start_date >= CURRENT_DATE ORDER BY cls.start_date) as upcoming_classes,
    h.greeting_rules,
    h.language_detection,
    h.nearest_unit_rules
FROM agent_config_diana c
CROSS JOIN diana_hyperpersonalization h
WHERE c.is_active = true
LIMIT 1;

-- View para turmas disponíveis formatadas
CREATE OR REPLACE VIEW v_diana_upcoming_classes_formatted AS
SELECT
    c.course_code,
    co.course_name_pt,
    co.course_name_en,
    c.unit_code,
    u.unit_name,
    u.city,
    c.start_date,
    to_char(c.start_date, 'DD/MM/YYYY') as start_date_br,
    to_char(c.start_date, 'Mon DD, YYYY') as start_date_en,
    array_to_string(c.days_of_week, ', ') as days,
    CONCAT(c.time_start, ' - ', c.time_end) as schedule,
    c.duration_display,
    c.instructor_name,
    c.available_slots,
    c.is_full
FROM diana_upcoming_classes c
JOIN diana_courses co ON co.course_code = c.course_code
JOIN diana_units u ON u.unit_code = c.unit_code
WHERE c.is_active = true AND c.start_date >= CURRENT_DATE
ORDER BY c.start_date;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE agent_config_diana IS 'Configuração principal Diana v2.3.0 - Dados REAIS da Flavia Leal Beauty School';
COMMENT ON TABLE diana_units IS '4 unidades reais: Woburn, Framingham, Revere (MA) e Orlando (FL)';
COMMENT ON TABLE diana_courses IS '9 cursos: 5 licenciamento + 4 capacitação com preços REAIS';
COMMENT ON TABLE diana_upcoming_classes IS 'Turmas reais com datas, horários e instrutores';
COMMENT ON TABLE diana_payment_options IS 'Opções de pagamento por curso';
COMMENT ON TABLE diana_testimonials IS 'Depoimentos - PLACEHOLDERS a serem substituídos por reais';
COMMENT ON TABLE diana_objections IS '13 objeções mapeadas com scripts completos (v2.3.0)';

-- =====================================================
-- FIM DO SCHEMA COM DADOS REAIS
-- =====================================================
