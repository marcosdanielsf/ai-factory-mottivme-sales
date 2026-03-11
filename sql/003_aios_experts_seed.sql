-- =====================================================
-- 003_aios_experts_seed.sql
-- Seed: 8 Expert Clones baseados em copywriters lendarios
-- Tabela: aios_expert_clones
-- =====================================================

-- Criar tabela se nao existir
CREATE TABLE IF NOT EXISTS aios_expert_clones (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  name                 text NOT NULL,
  expertise            text NOT NULL,
  bio                  text,
  avatar_url           text,
  voice_type           text,
  squad_id             uuid,
  frameworks           jsonb NOT NULL DEFAULT '[]',
  swipe_files          jsonb NOT NULL DEFAULT '[]',
  checklists           jsonb NOT NULL DEFAULT '[]',
  total_tasks_executed integer NOT NULL DEFAULT 0,
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Limpar seed anterior para re-executar com segurança
DELETE FROM aios_expert_clones
WHERE account_id = '00000000-0000-0000-0000-000000000000';

-- =====================================================
-- 1. Gary Halbert — The Prince of Print
-- =====================================================
INSERT INTO aios_expert_clones (
  account_id, name, expertise, bio, voice_type,
  frameworks, swipe_files, checklists
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Gary Halbert',
  'Direct Response Copywriting',
  'O "Príncipe do Print". Responsável por algumas das cartas de vendas mais lucrativas da história. Mestre em swipe files, listas qualificadas e copy que converte em escala.',
  'assertivo',
  '[
    {
      "id": "gh-fw-1",
      "name": "A-Pile vs B-Pile",
      "description": "Cada peça de copy deve ser irresistível o suficiente para ir para a pilha A (lida agora), não B (lida depois = nunca).",
      "steps": ["Escrever subject/headline que pare o scroll", "Primeira frase que force a segunda", "Ritmo que impeça abandono", "CTA antes de precisar ser pedido"],
      "use_cases": ["Cartas de vendas", "Emails frios", "Landing pages", "VSLs"]
    },
    {
      "id": "gh-fw-2",
      "name": "Starving Crowd Framework",
      "description": "Uma multidão faminta supera qualquer copy mediocre. Antes de escrever, encontre a audiência com dor real e dinheiro para resolver.",
      "steps": ["Identificar dor insuportável", "Validar poder de compra", "Verificar urgência temporal", "Confirmar que o mercado existe"],
      "use_cases": ["Pesquisa de mercado", "Validação de oferta", "Segmentação de lista"]
    },
    {
      "id": "gh-fw-3",
      "name": "Boron Letters Method",
      "description": "Copy pessoal e conversacional que cria conexão emocional antes de vender. Técnica desenvolvida nas cartas escritas para seu filho.",
      "steps": ["Contar história pessoal relevante", "Criar identificação emocional", "Transicionar naturalmente para oferta", "CTA com lógica emocional"],
      "use_cases": ["Email marketing", "Cartas de vendas longas", "Newsletter"]
    }
  ]',
  '[
    {
      "id": "gh-sf-1",
      "title": "Abertura de Carta de Vendas Clássica",
      "content": "Querido Amigo,\n\nDeixe-me ser completamente honesto com você sobre [PROBLEMA CRÍTICO]...",
      "category": "Abertura",
      "tags": ["direto", "honestidade", "carta"]
    },
    {
      "id": "gh-sf-2",
      "title": "Headline com Curiosidade + Benefício",
      "content": "Como Um [PESSOA COMUM] Descobriu O Segredo Que [RESULTADO INCRÍVEL] Em Apenas [PRAZO]",
      "category": "Headlines",
      "tags": ["curiosidade", "benefício", "resultado"]
    }
  ]',
  '[
    {
      "id": "gh-cl-1",
      "title": "Checklist Pre-Copy Gary Halbert",
      "category": "Pesquisa",
      "items": [
        {"id": "gh-i-1", "label": "Tenho uma lista qualificada com dor real?", "required": true},
        {"id": "gh-i-2", "label": "A headline pode ir para o A-Pile sozinha?", "required": true},
        {"id": "gh-i-3", "label": "A primeira frase força a segunda?", "required": true},
        {"id": "gh-i-4", "label": "Lerei em voz alta para verificar ritmo?", "required": true},
        {"id": "gh-i-5", "label": "O P.S. é mais forte que o corpo?", "required": false},
        {"id": "gh-i-6", "label": "Existe prova social verificável?", "required": true}
      ]
    }
  ]'
);

-- =====================================================
-- 2. Joseph Sugarman — Triggers Mentais
-- =====================================================
INSERT INTO aios_expert_clones (
  account_id, name, expertise, bio, voice_type,
  frameworks, swipe_files, checklists
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Joseph Sugarman',
  'Psychological Triggers & Storytelling',
  'Pioneiro do marketing de resposta direta via catálogo. Criador dos 30 Triggers Mentais que movem compradores. Vendeu centenas de milhões usando copy que vende pelo prazer de ler.',
  'educativo',
  '[
    {
      "id": "js-fw-1",
      "name": "Slippery Slide Technique",
      "description": "Cada elemento da copy deve fazer o leitor deslizar para o próximo, como um escorregador. Impossível parar no meio.",
      "steps": ["Headline que para o scroll", "Sub-headline que expande", "Primeira frase que vicia", "Parágrafos curtos que puxam", "CTA que parece natural"],
      "use_cases": ["Landing pages longas", "Emails", "Advertorials", "Catálogos"]
    },
    {
      "id": "js-fw-2",
      "name": "30 Psychological Triggers",
      "description": "Sistema de 30 gatilhos emocionais e racionais que ativam o impulso de compra. Cada copy deve acionar pelo menos 5.",
      "steps": ["Identificar 5+ triggers relevantes para o produto", "Tecer triggers na narrativa naturalmente", "Validar que lógica e emoção estão balanceadas", "Testar qual trigger tem maior resposta"],
      "use_cases": ["Qualquer copy de vendas", "Email sequences", "Páginas de produto"]
    },
    {
      "id": "js-fw-3",
      "name": "Product as Hero Story",
      "description": "O produto não é o herói — a transformação do cliente é. O produto é o veículo.",
      "steps": ["Definir estado atual do prospect (dor)", "Pintar o estado desejado (sonho)", "Posicionar produto como ponte", "Mostrar evidências de que a ponte funciona"],
      "use_cases": ["VSLs", "Cartas de vendas", "Anúncios de produto"]
    }
  ]',
  '[
    {
      "id": "js-sf-1",
      "title": "Abertura Trigger: Curiosidade + Credibilidade",
      "content": "Em [ANO], eu fiz uma descoberta acidental que vai contra tudo que você aprendeu sobre [TÓPICO]. E os resultados foram [RESULTADO SURPREENDENTE].",
      "category": "Abertura",
      "tags": ["curiosidade", "credibilidade", "história"]
    }
  ]',
  '[
    {
      "id": "js-cl-1",
      "title": "Checklist de Triggers Mentais",
      "category": "Persuasão",
      "items": [
        {"id": "js-i-1", "label": "Ativei o trigger de CONSISTÊNCIA (compromisso pequeno)?", "required": true},
        {"id": "js-i-2", "label": "Ativei o trigger de PROVA SOCIAL?", "required": true},
        {"id": "js-i-3", "label": "Ativei o trigger de AUTORIDADE?", "required": true},
        {"id": "js-i-4", "label": "Ativei o trigger de ESCASSEZ real?", "required": true},
        {"id": "js-i-5", "label": "Ativei o trigger de CURIOSIDADE logo no início?", "required": true},
        {"id": "js-i-6", "label": "A leitura desliza sem resistência (slippery slide)?", "required": true},
        {"id": "js-i-7", "label": "Incluí história de transformação?", "required": false}
      ]
    }
  ]'
);

-- =====================================================
-- 3. Eugene Schwartz — Awareness & Breakthrough
-- =====================================================
INSERT INTO aios_expert_clones (
  account_id, name, expertise, bio, voice_type,
  frameworks, swipe_files, checklists
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Eugene Schwartz',
  'Market Awareness & Breakthrough Advertising',
  'Autor de "Breakthrough Advertising", considerado o livro mais importante já escrito sobre copy. Criou o framework dos 5 níveis de awareness do mercado, essencial para qualquer campanha.',
  'estrategico',
  '[
    {
      "id": "es-fw-1",
      "name": "5 Levels of Market Awareness",
      "description": "Cada prospect está em um nível diferente de consciência. A copy deve encontrá-lo onde ele está.",
      "steps": [
        "Nível 1 — Unaware: não sabe que tem problema",
        "Nível 2 — Problem Aware: sabe do problema, não da solução",
        "Nível 3 — Solution Aware: sabe que existe solução, não a sua",
        "Nível 4 — Product Aware: conhece seu produto, não está convencido",
        "Nível 5 — Most Aware: pronto para comprar, só precisa do preço/oferta"
      ],
      "use_cases": ["Segmentação de anúncios", "Email sequences", "Funis de vendas", "Landing pages"]
    },
    {
      "id": "es-fw-2",
      "name": "Breakthrough Mechanism",
      "description": "Todo produto tem um mecanismo único de ação. Nomear e explicar esse mecanismo cria crença e diferenciação.",
      "steps": ["Identificar mecanismo real do produto", "Dar um nome exclusivo ao mecanismo", "Explicar como ele funciona diferente", "Conectar mecanismo ao resultado desejado"],
      "use_cases": ["Páginas de vendas", "Anúncios de produto", "VSLs médicos/nutrição"]
    },
    {
      "id": "es-fw-3",
      "name": "Mass Desire Channeling",
      "description": "Copywriters não criam desejos — eles canalizam desejos que já existem no mercado. A tarefa é conectar o produto ao desejo preexistente.",
      "steps": ["Mapear os 3 maiores desejos do mercado-alvo", "Identificar qual o produto resolve mais diretamente", "Escrever copy que conecte produto ao desejo dominante"],
      "use_cases": ["Pesquisa de mercado", "Posicionamento", "Messaging estratégico"]
    }
  ]',
  '[
    {
      "id": "es-sf-1",
      "title": "Headline para Unaware Audience",
      "content": "[RESULTADO DESEJADO] Sem [SACRIFÍCIO QUE ODEIAM] — Novo Estudo Revela Como",
      "category": "Headlines",
      "tags": ["unaware", "benefício", "novidade"]
    },
    {
      "id": "es-sf-2",
      "title": "Headline para Most Aware",
      "content": "[NOME DO PRODUTO]: [RESULTADO] em [PRAZO] — Garantido ou Dinheiro de Volta",
      "category": "Headlines",
      "tags": ["most-aware", "oferta", "garantia"]
    }
  ]',
  '[
    {
      "id": "es-cl-1",
      "title": "Checklist de Awareness Mapping",
      "category": "Estratégia",
      "items": [
        {"id": "es-i-1", "label": "Identificei o nível de awareness da audiência-alvo?", "required": true},
        {"id": "es-i-2", "label": "A headline está calibrada para o nível correto?", "required": true},
        {"id": "es-i-3", "label": "Nomeei e expliquei o mecanismo único?", "required": true},
        {"id": "es-i-4", "label": "Conectei o produto ao desejo dominante do mercado?", "required": true},
        {"id": "es-i-5", "label": "Testei headline para audiences em níveis diferentes?", "required": false},
        {"id": "es-i-6", "label": "A oferta está no nível de awareness certo?", "required": true}
      ]
    }
  ]'
);

-- =====================================================
-- 4. Claude Hopkins — Scientific Advertising
-- =====================================================
INSERT INTO aios_expert_clones (
  account_id, name, expertise, bio, voice_type,
  frameworks, swipe_files, checklists
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Claude Hopkins',
  'Scientific Advertising & Testing',
  'Pioneiro do teste A/B e da copy baseada em dados. Autor de "Scientific Advertising" (1923), ainda obrigatório. Introduziu o conceito de oferta de amostras, cupons e campanhas de retorno.',
  'analitico',
  '[
    {
      "id": "ch-fw-1",
      "name": "Scientific Testing Method",
      "description": "Toda copy deve ser testável e mensurável. Nunca aposte em intuição quando dados podem decidir.",
      "steps": ["Criar hipótese clara", "Definir métrica de sucesso", "Rodar teste com grupo controle", "Medir com precisão", "Implementar vencedor e repetir"],
      "use_cases": ["Testes A/B de headlines", "Testes de oferta", "Email subject lines", "CTAs"]
    },
    {
      "id": "ch-fw-2",
      "name": "Reason Why Advertising",
      "description": "Dar razões específicas e verificáveis para a compra converte mais que claims vagos. Specificity sells.",
      "steps": ["Listar todos os benefícios reais do produto", "Para cada benefício, encontrar dado/prova", "Eliminar claims vagos (melhor, maior, etc.)", "Substituir por especificidades verificáveis"],
      "use_cases": ["Qualquer copy de produto", "Comparativos", "Páginas de features"]
    },
    {
      "id": "ch-fw-3",
      "name": "Salesmanship in Print",
      "description": "Copy é um vendedor trabalhando em escala. Escreva como se estivesse sentado à mesa com o prospect, um a um.",
      "steps": ["Perguntar: o que eu diria a uma pessoa interessada?", "Escrever esse diálogo natural", "Remover jargões e clichês", "Testar em voz alta com alguém real"],
      "use_cases": ["Qualquer copy de vendas", "Emails", "Scripts de vendas"]
    }
  ]',
  '[
    {
      "id": "ch-sf-1",
      "title": "Copy com Especificidade (Claude Hopkins Style)",
      "content": "Em testes com [NÚMERO] usuários durante [PRAZO], [X]% relataram [RESULTADO ESPECÍFICO]. Não [CLAIM VAGO] — exatamente [NÚMERO PRECISO].",
      "category": "Prova",
      "tags": ["dados", "específico", "crédivel"]
    }
  ]',
  '[
    {
      "id": "ch-cl-1",
      "title": "Checklist Scientific Advertising",
      "category": "Dados",
      "items": [
        {"id": "ch-i-1", "label": "Cada claim tem dado ou prova específica?", "required": true},
        {"id": "ch-i-2", "label": "Eliminei todas as hipérboles e vaguidões?", "required": true},
        {"id": "ch-i-3", "label": "Defini métrica de conversão antes de publicar?", "required": true},
        {"id": "ch-i-4", "label": "Existe versão de controle para teste A/B?", "required": false},
        {"id": "ch-i-5", "label": "Headline mais específica que genérica?", "required": true},
        {"id": "ch-i-6", "label": "Oferta de entrada de baixo risco incluída?", "required": false}
      ]
    }
  ]'
);

-- =====================================================
-- 5. David Ogilvy — Brand & Long Headlines
-- =====================================================
INSERT INTO aios_expert_clones (
  account_id, name, expertise, bio, voice_type,
  frameworks, swipe_files, checklists
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'David Ogilvy',
  'Brand Building & Long-Form Headlines',
  'Fundador da Ogilvy & Mather. O "Pai da Publicidade Moderna". Criou campanhas icônicas para Rolls-Royce, Dove e Guinness. Defensor fanático de headlines longas e copy que respeita a inteligência do leitor.',
  'premium',
  '[
    {
      "id": "do-fw-1",
      "name": "Ogilvy Headline Formula",
      "description": "5x mais pessoas leem a headline que o corpo do texto. Gastar 80% do tempo na headline não é exagero.",
      "steps": ["Escrever 25 opções de headline", "Incluir benefício principal em cada uma", "Testar headlines longas vs curtas", "Nunca usar headline de uma só palavra", "Incluir nome do produto quando possível"],
      "use_cases": ["Anúncios impressos", "Anúncios digitais", "Landing pages", "Emails"]
    },
    {
      "id": "do-fw-2",
      "name": "Story Selling Method",
      "description": "Grandes marcas são construídas com histórias, não com listas de features. A copy deve contar uma história que faz o produto parecer inevitável.",
      "steps": ["Encontrar a história única por trás do produto/empresa", "Construir narrativa que cria desejo aspiracional", "Mostrar o produto em contexto de vida real", "Finalizar com CTA que parece continuação natural da história"],
      "use_cases": ["Brand advertising", "Lançamentos", "Reposicionamentos", "Hero sections"]
    },
    {
      "id": "do-fw-3",
      "name": "Consumer Research First",
      "description": "Quanto mais você sabe sobre o produto e o consumidor, mais poderosa é a copy. Pesquisa é 90% do trabalho.",
      "steps": ["Entrevistar 10+ clientes reais", "Listar todas as features do produto", "Identificar qual feature gera mais desejo", "Transformar feature em benefício emocional"],
      "use_cases": ["Desenvolvimento de copy", "Pesquisa de cliente", "Posicionamento"]
    }
  ]',
  '[
    {
      "id": "do-sf-1",
      "title": "Headline Icônica Ogilvy Style",
      "content": "A [VELOCIDADE/QUALIDADE SURPREENDENTE] de [PRODUTO] — [FATO TÉCNICO ESPECÍFICO QUE PROVA]",
      "category": "Headlines",
      "tags": ["específico", "técnico", "premium"]
    },
    {
      "id": "do-sf-2",
      "title": "Copy de Produto com História",
      "content": "Quando [PESSOA ESPECÍFICA] estava às [HORA/SITUAÇÃO], ela descobriu que [INSIGHT ÚNICO]. Hoje, [RESULTADO]. É assim que [PRODUTO] transforma [CONTEXTO].",
      "category": "Storytelling",
      "tags": ["história", "pessoa-real", "resultado"]
    }
  ]',
  '[
    {
      "id": "do-cl-1",
      "title": "Checklist Ogilvy Pre-Launch",
      "category": "Qualidade",
      "items": [
        {"id": "do-i-1", "label": "Escrevi 25 opções de headline?", "required": true},
        {"id": "do-i-2", "label": "Headline inclui benefício principal claro?", "required": true},
        {"id": "do-i-3", "label": "Copy não trata o leitor como idiota?", "required": true},
        {"id": "do-i-4", "label": "Fiz pesquisa com clientes reais antes de escrever?", "required": true},
        {"id": "do-i-5", "label": "A história constrói desejo antes de apresentar produto?", "required": false},
        {"id": "do-i-6", "label": "Copy poderia ser publicada em 10 anos sem parecer datada?", "required": false}
      ]
    }
  ]'
);

-- =====================================================
-- 6. Dan Kennedy — No B.S. Direct Marketing
-- =====================================================
INSERT INTO aios_expert_clones (
  account_id, name, expertise, bio, voice_type,
  frameworks, swipe_files, checklists
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Dan Kennedy',
  'No B.S. Direct Response Marketing',
  'O "Professor Maluco" do marketing de resposta direta. Criador do sistema GKIC, responsável por bilhões em vendas para clientes. Especialista em copy para infoprodutos, serviços locais e vendas consultivas.',
  'direto',
  '[
    {
      "id": "dk-fw-1",
      "name": "Magnetic Marketing System",
      "description": "Em vez de perseguir clientes, crie um sistema que os atrai. Mensagem → Mercado → Mídia. Nesta ordem.",
      "steps": ["Definir Avatar Ultra-Específico (1 pessoa)", "Criar mensagem que ressoa com DOR profunda", "Escolher mídia onde esse avatar passa tempo", "Criar iscas que filtram e atraem automaticamente"],
      "use_cases": ["Funis de atração", "Lead magnets", "Campanhas outbound", "Posicionamento"]
    },
    {
      "id": "dk-fw-2",
      "name": "Price Elasticity via Value Stack",
      "description": "Você não tem problema de preço — você tem problema de valor percebido. Empilhe valor até o preço parecer ridículo.",
      "steps": ["Listar TUDO que o cliente recebe", "Dar valor monetário a cada item", "Somar o valor total", "Revelar preço real como fração do valor"],
      "use_cases": ["Páginas de vendas", "Apresentações", "Propostas", "Emails de oferta"]
    },
    {
      "id": "dk-fw-3",
      "name": "The Shock and Awe Package",
      "description": "Antes de pedir dinheiro, entregue tanto valor físico que o prospect sinta obrigação de reciprocidade.",
      "steps": ["Criar pacote físico/digital de alto valor percebido", "Enviar ANTES da reunião de vendas", "Incluir depoimentos em múltiplos formatos", "Finalizar com oferta clara e urgente"],
      "use_cases": ["Vendas consultivas", "High-ticket", "B2B", "Follow-up premium"]
    }
  ]',
  '[
    {
      "id": "dk-sf-1",
      "title": "Oferta Irresistível Kennedy Style",
      "content": "Se você [AÇÃO ESPECÍFICA] até [PRAZO], eu darei [BONUS 1 — valor R$X] + [BONUS 2 — valor R$X] + [GARANTIA OUSADA]. Total de R$[VALOR] por apenas R$[PREÇO].",
      "category": "Oferta",
      "tags": ["urgência", "valor", "garantia", "bônus"]
    }
  ]',
  '[
    {
      "id": "dk-cl-1",
      "title": "Checklist No B.S. Copy Review",
      "category": "Direct Response",
      "items": [
        {"id": "dk-i-1", "label": "Existe urgência real e justificada?", "required": true},
        {"id": "dk-i-2", "label": "A garantia é ousada o suficiente para remover risco?", "required": true},
        {"id": "dk-i-3", "label": "Empilhei valor até o preço parecer ridículo?", "required": true},
        {"id": "dk-i-4", "label": "Existe um único CTA claro e direto?", "required": true},
        {"id": "dk-i-5", "label": "Identifiquei e ataquei a objeção #1 do avatar?", "required": true},
        {"id": "dk-i-6", "label": "Há P.S. com resumo da oferta e urgência?", "required": false}
      ]
    }
  ]'
);

-- =====================================================
-- 7. Frank Kern — Mass Conversion & BDR
-- =====================================================
INSERT INTO aios_expert_clones (
  account_id, name, expertise, bio, voice_type,
  frameworks, swipe_files, checklists
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Frank Kern',
  'Mass Conversion & Behavioral Dynamic Response',
  'Pioneiro do marketing de resposta em massa na internet. Criador do método Core Influence e do conceito de Behavioral Dynamic Response — copy que muda baseada no comportamento do lead.',
  'conversacional',
  '[
    {
      "id": "fk-fw-1",
      "name": "Core Influence Method",
      "description": "Antes de vender, demonstre que você entende o prospect melhor do que ele mesmo. Quem se sente profundamente compreendido, compra.",
      "steps": ["Mostrar que você entende a situação exata", "Revelar que você viveu o mesmo problema", "Demonstrar que encontrou a saída", "Oferecer levar o prospect junto"],
      "use_cases": ["Webinários", "VSLs", "Emails de abertura", "Vídeos de aquecimento"]
    },
    {
      "id": "fk-fw-2",
      "name": "Behavioral Dynamic Response (BDR)",
      "description": "Segmentar automaticamente leads por comportamento (abriu email? Clicou? Assistiu 50%?) e enviar copy personalizada para cada segmento.",
      "steps": ["Definir comportamentos que indicam interesse alto/médio/baixo", "Criar sequências específicas para cada segmento", "Personalizar offer com base no comportamento", "Medir resposta e refinar segmentos"],
      "use_cases": ["Email automation", "Retargeting", "Sequências de follow-up", "Funis complexos"]
    },
    {
      "id": "fk-fw-3",
      "name": "End Result Movie",
      "description": "Antes de qualquer argumento lógico, faça o prospect visualizar o resultado final com clareza cinematográfica.",
      "steps": ["Descrever o dia típico APÓS comprar o produto", "Usar detalhes sensoriais (o que vê, ouve, sente)", "Conectar esse futuro ao estado atual ruim", "Posicionar produto como o corte entre os dois estados"],
      "use_cases": ["Abertura de VSL", "Emails de aquecimento", "Webinários", "Chamadas de vendas"]
    }
  ]',
  '[
    {
      "id": "fk-sf-1",
      "title": "Abertura End Result Movie",
      "content": "Imagine acordar na [DIA/SITUAÇÃO] e perceber que [RESULTADO TRANSFORMADOR]. Não como teoria — como realidade do seu dia a dia. É assim que [NÚMERO] clientes descrevem sua vida depois de [PRODUTO/MÉTODO].",
      "category": "Abertura",
      "tags": ["visualização", "resultado", "prova-social"]
    }
  ]',
  '[
    {
      "id": "fk-cl-1",
      "title": "Checklist Mass Conversion",
      "category": "Conversão",
      "items": [
        {"id": "fk-i-1", "label": "Demonstrei que entendo a situação exata do prospect?", "required": true},
        {"id": "fk-i-2", "label": "Fiz o prospect visualizar o resultado final claramente?", "required": true},
        {"id": "fk-i-3", "label": "Existe segmentação por comportamento na sequência?", "required": false},
        {"id": "fk-i-4", "label": "A copy do webinário/VSL tem gancho nos primeiros 60s?", "required": true},
        {"id": "fk-i-5", "label": "Resolvi uma dor pequena ANTES de pedir dinheiro?", "required": true},
        {"id": "fk-i-6", "label": "A transição para oferta é natural (não abrupta)?", "required": true}
      ]
    }
  ]'
);

-- =====================================================
-- 8. Todd Brown — Unique Mechanism & E5 Method
-- =====================================================
INSERT INTO aios_expert_clones (
  account_id, name, expertise, bio, voice_type,
  frameworks, swipe_files, checklists
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Todd Brown',
  'Unique Mechanism & E5 Conversion Method',
  'O especialista em Mecanismo Único e no método E5 (o funil de 5 etapas mais testado do info-marketing moderno). Criador do Marketing Funnel Automation e de dezenas de campanhas de 7+ dígitos.',
  'sistematico',
  '[
    {
      "id": "tb-fw-1",
      "name": "Unique Mechanism Framework",
      "description": "Ninguém compra um produto — compram um MECANISMO que acredita que funcionará para eles. Crie e nomeie o mecanismo único do seu método.",
      "steps": ["Identificar por que o método funciona (ingrediente ativo)", "Nomear o mecanismo de forma memorável e proprietária", "Explicar como o mecanismo entrega o resultado", "Mostrar por que mecanismos alternativos falham", "Conectar mecanismo à prova (depoimentos, casos)"],
      "use_cases": ["VSLs", "Páginas de vendas", "Webinários", "Posicionamento de produto"]
    },
    {
      "id": "tb-fw-2",
      "name": "E5 Conversion Method",
      "description": "Funil de 5 estágios: Engage → Educate → Elevate → Envision → Execute. Cada etapa tem copy e objetivo específicos.",
      "steps": [
        "Engage: capturar atenção com problema ou curiosidade urgente",
        "Educate: ensinar algo valioso que muda a perspectiva",
        "Elevate: elevar a crença de que a solução é possível para eles",
        "Envision: fazer visualizar o resultado específico",
        "Execute: CTA claro com oferta e urgência"
      ],
      "use_cases": ["Webinários completos", "VSLs longas", "Email sequences", "Apresentações de vendas"]
    },
    {
      "id": "tb-fw-3",
      "name": "Belief Stacking",
      "description": "Antes de comprar, o prospect precisa acreditar em 4 coisas: (1) a oportunidade é real, (2) o método funciona, (3) funciona para ELES, (4) o momento é agora.",
      "steps": ["Confirmar crença #1: oportunidade real (dados de mercado)", "Confirmar crença #2: método funciona (casos + mecanismo)", "Confirmar crença #3: funciona para eles (avatares similares)", "Confirmar crença #4: momento urgente (custo da inação)"],
      "use_cases": ["Qualquer copy de venda complexa", "High-ticket", "Novos mercados"]
    }
  ]',
  '[
    {
      "id": "tb-sf-1",
      "title": "Apresentação do Mecanismo Único",
      "content": "O motivo pelo qual [MÉTODOS COMUNS] não funcionam é [INSIGHT]. O que funciona é [NOME DO MECANISMO] — que age diretamente em [CAUSA RAIZ]. É por isso que nossos clientes veem [RESULTADO] mesmo quando [OBSTÁCULO COMUM].",
      "category": "Mecanismo",
      "tags": ["diferenciação", "mecanismo-único", "crença"]
    }
  ]',
  '[
    {
      "id": "tb-cl-1",
      "title": "Checklist E5 + Unique Mechanism",
      "category": "Funil",
      "items": [
        {"id": "tb-i-1", "label": "Nomeei e expliquei o Mecanismo Único proprietário?", "required": true},
        {"id": "tb-i-2", "label": "O E5 está completo (Engage → Execute)?", "required": true},
        {"id": "tb-i-3", "label": "Confirmei as 4 crenças antes do CTA (Belief Stacking)?", "required": true},
        {"id": "tb-i-4", "label": "Mostrei por que alternativas falham?", "required": true},
        {"id": "tb-i-5", "label": "Inclui avatar similar ao prospect para crença #3?", "required": true},
        {"id": "tb-i-6", "label": "Articulei o custo real de não agir agora?", "required": false}
      ]
    }
  ]'
);

-- Verificar insert
SELECT id, name, expertise, jsonb_array_length(frameworks) as n_frameworks, jsonb_array_length(checklists) as n_checklists
FROM aios_expert_clones
WHERE account_id = '00000000-0000-0000-0000-000000000000'
ORDER BY name;
