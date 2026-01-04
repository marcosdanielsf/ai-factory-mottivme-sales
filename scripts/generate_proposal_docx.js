const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, PageBreak, LevelFormat, BorderStyle,
        WidthType, ShadingType, VerticalAlign, HeadingLevel, PageNumber } = require('docx');
const fs = require('fs');

// Cores
const PRIMARY = "1a365d";
const SECONDARY = "2c5282";
const ACCENT = "38a169";
const HIGHLIGHT = "ed8936";
const GOLD = "d69e2e";
const LIGHT_BG = "f7fafc";
const HEADER_BG = "1a365d";

// Bordas de tabela
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e0" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e0" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e0" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e0" }
};

// Helper para criar tabela
function createTable(headers, rows, colWidths) {
  const tableRows = [];

  // Header row
  tableRows.push(new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders: cellBorders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })]
      })]
    }))
  }));

  // Data rows
  rows.forEach((row, rowIndex) => {
    tableRows.push(new TableRow({
      children: row.map((cell, i) => new TableCell({
        borders: cellBorders,
        width: { size: colWidths[i], type: WidthType.DXA },
        shading: { fill: rowIndex % 2 === 0 ? "FFFFFF" : LIGHT_BG, type: ShadingType.CLEAR },
        children: [new Paragraph({
          children: [new TextRun({ text: cell, size: 20 })]
        })]
      }))
    }));
  });

  return new Table({ columnWidths: colWidths, rows: tableRows });
}

// Helper para criar paragrafo de titulo
function title(text) {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: PRIMARY })]
  });
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, color: SECONDARY })]
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: ACCENT })]
  });
}

function body(text) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22 })]
  });
}

function highlight(text) {
  return new Paragraph({
    spacing: { before: 150, after: 150 },
    children: [new TextRun({ text, bold: true, size: 22, color: HIGHLIGHT })]
  });
}

function gold(text) {
  return new Paragraph({
    spacing: { before: 150, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: GOLD })]
  });
}

function quote(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    indent: { left: 400 },
    children: [new TextRun({ text, italics: true, size: 22, color: SECONDARY })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } }
  },
  sections: [{
    properties: {
      page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "MOTTIVME - Proposta Comercial", size: 18, color: "718096" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Pagina ", size: 18, color: "718096" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "718096" }),
            new TextRun({ text: " de ", size: 18, color: "718096" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "718096" })
          ]
        })]
      })
    },
    children: [
      // ========== CAPA ==========
      new Paragraph({ spacing: { before: 1200 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "PROPOSTA COMERCIAL EXPANDIDA", bold: true, size: 56, color: PRIMARY })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "Ecossistema Completo de Automacao Inteligente", size: 28, color: SECONDARY })]
      }),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Preparada exclusivamente para:", size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Flavia Leal & Theo Castro", bold: true, size: 28, color: SECONDARY })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Flavia Leal Beauty School", size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "4 Escolas | Massachusetts & Florida, EUA", size: 22 })]
      }),
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Por:", size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Marcos Daniel", bold: true, size: 28, color: SECONDARY })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "MOTTIVME - Automacao de Vendas com IA", size: 22 })]
      }),
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Data: 02 de Janeiro de 2026", bold: true, size: 22 })]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== VISAO GERAL ==========
      title("VISAO GERAL DO PROJETO"),
      body("Apos 4 horas de conversa profunda, identificamos que voces precisam de uma solucao COMPLETA - nao apenas pre-vendas, mas um ecossistema inteiro que conecte todos os produtos e servicos da Flavia Leal Beauty School."),
      h2("O Que Este Documento Cobre"),
      createTable(
        ["Vertical", "Descricao"],
        [
          ["1. Pre-Vendas & CRM", "Atendimento 24/7, qualificacao, agendamento"],
          ["2. Pos-Venda & Retencao", "Onboarding, engajamento, upsell"],
          ["3. E-Commerce de Produtos", "Loja virtual para materiais e equipamentos"],
          ["4. Guia da Beleza", "Plataforma de marketing para alunos"],
          ["5. Produtos Marca Propria", "Integracao com fabrica Brasil"],
          ["6. Cursos Online", "Plataforma de educacao digital"]
        ],
        [2800, 6560]
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== PROBLEMAS ==========
      title("O QUE IDENTIFICAMOS NA NOSSA CONVERSA"),
      h3("Problema 1: Leads que Escapam"),
      quote("Leads chegam as 2h, 4h, 6h da manha. Ninguem responde. Quando a equipe acorda, o lead ja esfriou ou foi pra concorrencia."),
      h3("Problema 2: Equipe Sobrecarregada"),
      quote("A Fabi e as secretarias fazem TUDO: atendimento presencial, WhatsApp, matriculas, follow-up."),
      h3("Problema 3: Falta de Visibilidade"),
      quote("Voce nao sabe quantos leads entraram, de onde vieram, quantos converteram. Impossivel otimizar."),
      h3("Problema 4: Produtos Encalhados"),
      quote("Tem produto parado, material que poderia estar gerando receita. Sem loja virtual, sem processo de venda automatizado."),
      h3("Problema 5: Oportunidades Nao Exploradas"),
      quote("Guia da Beleza parado, produtos de marca propria esperando, cursos online que poderiam escalar. Dinheiro na mesa."),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== CRONOGRAMA GERAL ==========
      title("CRONOGRAMA COMPLETO - 6 FASES EM 6 MESES"),
      createTable(
        ["Fase", "Periodo", "Foco", "Resultado"],
        [
          ["1", "Dias 1-30", "Pre-Vendas & CRM", "IA atendendo 24/7"],
          ["2", "Dias 31-60", "Pos-Venda & Retencao", "Churn reduzido, upsell"],
          ["3", "Dias 61-90", "E-Commerce Produtos", "Loja virtual funcionando"],
          ["4", "Dias 91-120", "Guia da Beleza", "Plataforma gerando receita"],
          ["5", "Dias 121-150", "Marca Propria", "Integracao com fabrica BR"],
          ["6", "Dias 151-180", "Cursos Online", "Escala nacional/intl"]
        ],
        [900, 1800, 3000, 3660]
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== FASE 1 ==========
      title("FASE 1: PRE-VENDAS & CRM (Dias 1-30)"),
      body("Objetivo: Sistema basico funcionando, IA atendendo 24/7"),
      h2("Semana 1-2: Fundacao e Agente IA"),
      createTable(
        ["Dia", "Entrega"],
        [
          ["1-2", "Kickoff + Acesso aos sistemas + Mapeamento"],
          ["3-4", "CRM Socialfy 100% configurado"],
          ["5-7", "4 Pipelines (1 por escola) criados"],
          ["8-10", "Agente IA 'Diana' no WhatsApp (teste)"],
          ["11-14", "Integracao Instagram DM + Ajustes tom de voz"]
        ],
        [1200, 8160]
      ),
      h2("Semana 3-4: Automacoes e Go Live"),
      createTable(
        ["Dia", "Entrega"],
        [
          ["15-17", "Sequencias de follow-up (7 fluxos)"],
          ["18-19", "Sistema de qualificacao automatica"],
          ["20-21", "Alertas de lead quente para equipe"],
          ["22-24", "Dashboard de metricas completo"],
          ["25-27", "Treinamento equipe Fabi (2h ao vivo)"],
          ["28-30", "Go Live + Ajustes finos"]
        ],
        [1200, 8160]
      ),
      highlight("Investimento Fase 1: Setup $4,997 | Mensalidade $1,497/mes"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== FASE 2 ==========
      title("FASE 2: POS-VENDA & RETENCAO (Dias 31-60)"),
      body("Objetivo: Reduzir churn, aumentar LTV, automatizar upsell"),
      createTable(
        ["Dia", "Entrega"],
        [
          ["31-35", "Agente IA de Onboarding"],
          ["36-40", "Sequencia de engajamento 90 dias"],
          ["41-42", "Sistema de NPS automatico"],
          ["43-47", "Pipeline de upsell (especializacoes)"],
          ["48-52", "Campanha de reativacao de base"],
          ["53-56", "Sistema de indicacoes (Member Get Member)"],
          ["57-60", "Coleta automatica de depoimentos"]
        ],
        [1200, 8160]
      ),
      highlight("Investimento Fase 2: Setup $2,997 | Mensalidade +$497/mes"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== FASE 3 ==========
      title("FASE 3: E-COMMERCE DE PRODUTOS (Dias 61-90)"),
      body("Objetivo: Loja virtual para materiais, equipamentos e kits"),
      createTable(
        ["Dia", "Entrega"],
        [
          ["61-65", "Setup plataforma e-commerce"],
          ["66-70", "Cadastro de produtos (materiais, kits)"],
          ["71-75", "Integracao pagamentos (Stripe/PayPal)"],
          ["76-80", "IA vendedora de produtos"],
          ["81-85", "Fluxo de compra automatizado"],
          ["86-90", "Sistema de envio/shipping"]
        ],
        [1200, 8160]
      ),
      highlight("Investimento Fase 3: Setup $3,997 | Mensalidade +$397/mes | Comissao 3%"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== FASE 4 ==========
      title("FASE 4: GUIA DA BELEZA (Dias 91-120)"),
      body("Objetivo: Plataforma de marketing para alunos e profissionais"),
      createTable(
        ["Dia", "Entrega"],
        [
          ["91-95", "Setup plataforma Guia da Beleza"],
          ["96-100", "Sistema de cadastro de profissionais"],
          ["101-105", "Area gratuita vs premium"],
          ["106-110", "Sistema de destaques pagos"],
          ["111-115", "Integracao com CRM (ex-alunos)"],
          ["116-120", "Automacao de oferta para formandos"]
        ],
        [1200, 8160]
      ),
      highlight("Investimento Fase 4: Setup $4,997 | Mensalidade +$397/mes | Comissao 10%"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== FASE 5 ==========
      title("FASE 5: PRODUTOS MARCA PROPRIA (Dias 121-150)"),
      body("Objetivo: Integrar fabrica do Brasil, vender linha propria"),
      createTable(
        ["Dia", "Entrega"],
        [
          ["121-125", "Mapeamento de produtos fabrica"],
          ["126-130", "Sistema de pedidos Brasil-EUA"],
          ["131-135", "Logistica de importacao"],
          ["136-140", "Produtos na loja virtual"],
          ["141-145", "Sistema de revenda (B2B)"],
          ["146-150", "Programa de afiliados/multinivel"]
        ],
        [1200, 8160]
      ),
      highlight("Investimento Fase 5: Setup $5,997 | Mensalidade +$597/mes | Comissao 5%"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== FASE 6 ==========
      title("FASE 6: CURSOS ONLINE (Dias 151-180)"),
      body("Objetivo: Escalar educacao para Brasil e mundo"),
      createTable(
        ["Dia", "Entrega"],
        [
          ["151-155", "Setup plataforma EAD"],
          ["156-160", "Estrutura de cursos (modulos)"],
          ["161-165", "Sistema de certificados"],
          ["166-170", "Gravacao curso piloto"],
          ["171-175", "Funil de vendas curso online"],
          ["176-180", "Lancamento + Automacoes"]
        ],
        [1200, 8160]
      ),
      highlight("Investimento Fase 6: Setup $7,997 | Mensalidade +$697/mes | Comissao 10%"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== RESUMO FINANCEIRO ==========
      title("RESUMO FINANCEIRO COMPLETO"),
      h2("Investimento por Fase"),
      createTable(
        ["Fase", "Setup", "Mensalidade"],
        [
          ["1. Pre-Vendas & CRM", "$4,997", "$1,497/mes"],
          ["2. Pos-Venda & Retencao", "$2,997", "+$497/mes"],
          ["3. E-Commerce Produtos", "$3,997", "+$397/mes"],
          ["4. Guia da Beleza", "$4,997", "+$397/mes"],
          ["5. Marca Propria", "$5,997", "+$597/mes"],
          ["6. Cursos Online", "$7,997", "+$697/mes"],
          ["TOTAL", "$30,982", "$4,082/mes"]
        ],
        [4000, 2680, 2680]
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== OPCOES ==========
      title("OPCOES DE CONTRATACAO"),
      h2("OPCAO A: PROJETO COMPLETO (Recomendado)"),
      body("Contrata todas as 6 fases de uma vez"),
      createTable(
        ["Item", "Valor Normal", "Valor Especial"],
        [
          ["Setup Total", "$30,982", "$19,997 (35% OFF)"],
          ["Mensalidade Total", "$4,082/mes", "$2,997/mes (27% OFF)"],
          ["Parcelamento Setup", "-", "6x de $3,500"]
        ],
        [3120, 3120, 3120]
      ),
      gold("Bonus Exclusivos Projeto Completo:"),
      body("- Clone de Video (Avatar Flavia) - $2,000 valor"),
      body("- Clone de Voz (ElevenLabs) - $500 valor"),
      body("- Consultoria Estrategica Mensal - $1,500/mes valor"),
      body("- Suporte VIP WhatsApp 90 dias - $1,500 valor"),
      body("- TOTAL BONUS: $5,500"),
      h2("OPCAO B: FASE A FASE"),
      body("Contrata uma fase por vez, conforme resultado"),
      createTable(
        ["Item", "Valor"],
        [
          ["Fase 1 (inicio imediato)", "$4,997 + $1,497/mes"],
          ["Fases subsequentes", "Valor cheio da fase"]
        ],
        [4680, 4680]
      ),
      h2("OPCAO C: CORE + ESCALA"),
      body("Fases 1-3 agora, Fases 4-6 depois"),
      createTable(
        ["Pacote", "Setup", "Mensalidade"],
        [
          ["Core (Fases 1-3)", "$9,997", "$2,391/mes"],
          ["Escala (Fases 4-6)", "$14,997", "$1,691/mes"]
        ],
        [3120, 3120, 3120]
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== ROI ==========
      title("ROI PROJETADO"),
      h2("Cenario Conservador (Mes 6)"),
      createTable(
        ["Vertical", "Receita Adicional/Mes"],
        [
          ["Pre-Vendas (+4 matriculas)", "+$8,000"],
          ["Upsell (+2 especializacoes)", "+$2,000"],
          ["E-Commerce produtos", "+$3,000"],
          ["Guia da Beleza", "+$1,500"],
          ["Marca Propria", "+$5,000"],
          ["Cursos Online", "+$5,000"],
          ["TOTAL ADICIONAL", "+$24,500/mes"]
        ],
        [4680, 4680]
      ),
      h2("Cenario Esperado (Mes 12)"),
      createTable(
        ["Vertical", "Receita Adicional/Mes"],
        [
          ["Pre-Vendas (+8 matriculas)", "+$16,000"],
          ["Upsell (+5 especializacoes)", "+$5,000"],
          ["E-Commerce produtos", "+$8,000"],
          ["Guia da Beleza", "+$3,000"],
          ["Marca Propria", "+$15,000"],
          ["Cursos Online", "+$20,000"],
          ["TOTAL ADICIONAL", "+$67,000/mes"]
        ],
        [4680, 4680]
      ),
      gold("Em 6 meses: Ecossistema completo gerando +$67,000/mes"),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== PARTICIPACAO ==========
      title("O QUE VOCE PRECISA FAZER"),
      body("Sua participacao total: ~15 horas em 6 meses"),
      createTable(
        ["Tarefa", "Tempo", "Quando"],
        [
          ["Call de kickoff", "1h", "Dia 1"],
          ["Revisar tom de voz da IA", "30min", "Dia 5"],
          ["Gravar 5 audios de referencia", "30min", "Dia 7"],
          ["Validar funis e mensagens", "1h", "Dia 14"],
          ["Treinamento equipe Fase 1", "2h", "Dia 26"],
          ["Validacao Pos-Venda", "1h", "Dia 45"],
          ["Revisao catalogo produtos", "1h", "Dia 70"],
          ["Validacao Guia da Beleza", "1h", "Dia 100"],
          ["Gravacao video curso piloto", "3h", "Dia 160"],
          ["Revisao e aprovacao final", "2h", "Dia 175"]
        ],
        [4680, 2340, 2340]
      ),
      highlight("Todo o resto e com a gente."),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== GARANTIAS ==========
      title("GARANTIAS BLINDADAS"),
      h3("1. Garantia de Saida"),
      quote("Contrato minimo de 6 meses, mas voce pode sair em 3 meses sem multa se nao estiver satisfeita."),
      h3("2. Opcao de Manutencao Minima (Plano Autonomo)"),
      quote("Apos 3 meses, se preferir continuar apenas com a IA e os processos ja criados - sem suporte ativo e otimizacoes continuas - voce paga apenas $497/mes por fase implementada. Sem custos adicionais. A IA continua funcionando 24/7 e voce pode retomar o plano completo a qualquer momento."),
      h3("3. Garantia de Resultado"),
      quote("Se em 6 meses o ecossistema completo nao gerar ROI positivo, continuo trabalhando SEM COBRAR ate gerar."),
      h3("4. Garantia de Entrega"),
      quote("Cada fase tem prazo definido. Se nao entregar no prazo, voce ganha 1 mes de mensalidade gratis daquela fase."),
      h3("5. Garantia de Propriedade"),
      quote("Tudo que for construido e SEU. Se encerrar o contrato, os dados, funis, lojas e automacoes ficam com voce."),
      h3("6. Garantia de Suporte"),
      quote("Resposta em ate 24h uteis. Se nao responder, desconto na mensalidade."),
      h3("7. Garantia de Compatibilidade"),
      quote("Se algum sistema nao funcionar bem com outro, ajustamos sem custo adicional ate funcionar perfeitamente."),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== FAQ ==========
      title("FAQ - PERGUNTAS FREQUENTES"),
      h3('"Por que fazer tudo junto em vez de fase a fase?"'),
      body("O ecossistema integrado gera sinergias. Um aluno de curso presencial compra produtos, entra no Guia, indica amigos. Fazer separado perde essas conexoes e custa mais no total."),
      h3('"E se eu so quiser comecar com pre-vendas?"'),
      body("Pode! A Fase 1 funciona independente. Mas o desconto do projeto completo e significativo e voce perde os bonus."),
      h3('"Quanto tempo por semana vou gastar com isso?"'),
      body("Apos implementacao de cada fase: menos de 1h por semana por vertical. Com o ecossistema completo, ~3-4h/semana total."),
      h3('"A IA consegue separar os assuntos mesmo?"'),
      body('Sim. Treinamos a IA para identificar: "Quero fazer curso" vs "Quero comprar produto" vs "Quero anunciar no Guia". Cada um vai pro funil certo.'),
      h3('"E os produtos de marca propria? Preciso ir ao Brasil?"'),
      body("Voce vai ao Brasil para fechar com a fabrica. Depois, o sistema de pedidos e automatizado. A logistica a gente configura junto."),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== PROXIMOS PASSOS ==========
      title("PROXIMOS PASSOS"),
      h2("Escolha sua Opcao:"),
      body("[ ] OPCAO A: Projeto Completo ($19,997 + $2,997/mes) - RECOMENDADO"),
      body("[ ] OPCAO B: Fase a Fase (comecar com Fase 1: $4,997 + $1,497/mes)"),
      body("[ ] OPCAO C: Core + Escala ($9,997 agora, Fases 4-6 depois)"),
      new Paragraph({ spacing: { before: 200 } }),
      body('Passo 1: Aceite - Responda "QUERO COMECAR COM OPCAO [A/B/C]"'),
      body("Passo 2: Pagamento - Envio o link para pagamento do setup escolhido"),
      body("Passo 3: Kickoff - Agendamos call de 1h nas proximas 24h"),
      body("Passo 4: Go Live Fase 1 - Em 30 dias, primeiro sistema funcionando"),
      h2("Timeline se Fechar HOJE com Projeto Completo"),
      createTable(
        ["Marco", "Data", "Acontece"],
        [
          ["Hoje", "02/Jan", "Aceite + Pagamento"],
          ["Amanha", "03/Jan", "Call de Kickoff"],
          ["Dia 30", "01/Fev", "Fase 1 completa - IA atendendo"],
          ["Dia 60", "03/Mar", "Fase 2 completa - Pos-venda ativo"],
          ["Dia 90", "02/Abr", "Fase 3 completa - E-commerce no ar"],
          ["Dia 120", "02/Mai", "Fase 4 completa - Guia da Beleza"],
          ["Dia 150", "01/Jun", "Fase 5 completa - Marca propria"],
          ["Dia 180", "01/Jul", "Fase 6 completa - Cursos online"]
        ],
        [1500, 1500, 6360]
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ========== TERMO ==========
      title("TERMO DE ACEITE"),
      body('Ao responder "QUERO COMECAR", voce concorda com:'),
      h3("Para Projeto Completo (Opcao A):"),
      body("- Setup de $19,997 (ou 6x $3,500)"),
      body("- Mensalidade de $2,997/mes (inicio apos go-live Fase 1)"),
      body("- Contrato de 12 meses (saida permitida em 3 meses)"),
      body("- Termos de garantia descritos acima"),
      body("- Bonus inclusos ($5,500 em valor)"),
      h3("Para Fase a Fase (Opcao B):"),
      body("- Setup Fase 1: $4,997 (ou 3x $1,800)"),
      body("- Mensalidade Fase 1: $1,497/mes"),
      body("- Contrato de 6 meses por fase"),
      body("- Fases subsequentes com valores cheios"),
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        children: [new TextRun({ text: "Flavia, voce construiu 4 escolas do zero.", bold: true, size: 24 })]
      }),
      new Paragraph({
        children: [new TextRun({ text: "Voce ja provou que consegue criar imperios.", bold: true, size: 24 })]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      body("Agora e hora de construir a MAQUINA que vai conectar todos os seus produtos, servicos e sonhos em um unico ecossistema que funciona 24/7."),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [new TextRun({ text: "Vamos construir esse imperio juntos?", bold: true, size: 28, color: HIGHLIGHT })]
      }),
      new Paragraph({ spacing: { before: 400 } }),
      body("Marcos Daniel"),
      body("MOTTIVME"),
      body("WhatsApp: +1 (857) 285-9871"),
      body("Email: marcos@mottivme.com"),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Proposta valida ate 05/01/2026", italics: true, size: 18, color: "718096" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Precos em dolar americano (USD)", italics: true, size: 18, color: "718096" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Desconto Projeto Completo valido apenas para fechamento ate 05/01/2026", italics: true, size: 18, color: "718096" })]
      })
    ]
  }]
});

const outputPath = "/Users/marcosdaniels/Documents/Projetos/MOTTIVME SALES TOTAL/projects/n8n-workspace/Fluxos n8n/AI-Factory- Mottivme Sales/PROPOSTA-FLAVIA-LEAL-EXPANDIDA.docx";

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("DOCX criado com sucesso: " + outputPath);
});
