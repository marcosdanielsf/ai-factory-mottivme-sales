#!/usr/bin/env python3
"""
Gerador de PDF profissional para proposta EXPANDIDA Flavia Leal Beauty School
Ecossistema Completo - 6 Fases
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# Cores da marca MOTTIVME
PRIMARY_COLOR = HexColor('#1a365d')  # Azul escuro
SECONDARY_COLOR = HexColor('#2c5282')  # Azul medio
ACCENT_COLOR = HexColor('#38a169')  # Verde
LIGHT_BG = HexColor('#f7fafc')  # Cinza claro
HIGHLIGHT = HexColor('#ed8936')  # Laranja
GOLD = HexColor('#d69e2e')  # Dourado

def create_styles():
    styles = getSampleStyleSheet()

    # Titulo principal
    styles.add(ParagraphStyle(
        name='MainTitle',
        parent=styles['Title'],
        fontSize=28,
        textColor=PRIMARY_COLOR,
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))

    # Subtitulo
    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=SECONDARY_COLOR,
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica'
    ))

    # Heading 1
    styles.add(ParagraphStyle(
        name='H1',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=PRIMARY_COLOR,
        spaceBefore=20,
        spaceAfter=12,
        fontName='Helvetica-Bold'
    ))

    # Heading 2
    styles.add(ParagraphStyle(
        name='H2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=SECONDARY_COLOR,
        spaceBefore=16,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    ))

    # Heading 3
    styles.add(ParagraphStyle(
        name='H3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=ACCENT_COLOR,
        spaceBefore=12,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    ))

    # Body text
    styles.add(ParagraphStyle(
        name='Body',
        parent=styles['Normal'],
        fontSize=10,
        textColor=black,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        fontName='Helvetica',
        leading=13
    ))

    # Quote/Blockquote
    styles.add(ParagraphStyle(
        name='Quote',
        parent=styles['Normal'],
        fontSize=10,
        textColor=SECONDARY_COLOR,
        spaceBefore=6,
        spaceAfter=6,
        leftIndent=15,
        rightIndent=15,
        fontName='Helvetica-Oblique',
        leading=13
    ))

    # Highlight text
    styles.add(ParagraphStyle(
        name='Highlight',
        parent=styles['Normal'],
        fontSize=11,
        textColor=HIGHLIGHT,
        fontName='Helvetica-Bold',
        spaceAfter=8
    ))

    # Gold highlight
    styles.add(ParagraphStyle(
        name='Gold',
        parent=styles['Normal'],
        fontSize=11,
        textColor=GOLD,
        fontName='Helvetica-Bold',
        spaceAfter=8
    ))

    # Footer
    styles.add(ParagraphStyle(
        name='Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=HexColor('#718096'),
        alignment=TA_CENTER
    ))

    # Small text
    styles.add(ParagraphStyle(
        name='Small',
        parent=styles['Normal'],
        fontSize=9,
        textColor=HexColor('#4a5568'),
        spaceAfter=4,
        fontName='Helvetica'
    ))

    return styles

def create_table(data, col_widths=None, header_color=None):
    """Cria tabela estilizada"""
    if header_color is None:
        header_color = PRIMARY_COLOR
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_BG),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#cbd5e0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_BG]),
    ]))
    return t

def build_pdf():
    output_path = "/Users/marcosdaniels/Documents/Projetos/MOTTIVME SALES TOTAL/projects/n8n-workspace/Fluxos n8n/AI-Factory- Mottivme Sales/PROPOSTA-FLAVIA-LEAL-EXPANDIDA.pdf"

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.6*inch,
        leftMargin=0.6*inch,
        topMargin=0.6*inch,
        bottomMargin=0.6*inch
    )

    styles = create_styles()
    story = []

    # ========== CAPA ==========
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph("PROPOSTA COMERCIAL EXPANDIDA", styles['MainTitle']))
    story.append(Paragraph("Ecossistema Completo de Automacao Inteligente", styles['Subtitle']))
    story.append(Spacer(1, 0.3*inch))

    story.append(Paragraph("<b>Preparada exclusivamente para:</b>", styles['Body']))
    story.append(Paragraph("Flavia Leal & Theo Castro", styles['H2']))
    story.append(Paragraph("Flavia Leal Beauty School", styles['Body']))
    story.append(Paragraph("4 Escolas | Massachusetts & Florida, EUA", styles['Body']))
    story.append(Spacer(1, 0.3*inch))

    story.append(Paragraph("<b>Por:</b>", styles['Body']))
    story.append(Paragraph("Marcos Daniel", styles['H2']))
    story.append(Paragraph("MOTTIVME - Automacao de Vendas com IA", styles['Body']))
    story.append(Spacer(1, 0.3*inch))

    story.append(Paragraph("<b>Data:</b> 02 de Janeiro de 2026", styles['Body']))
    story.append(PageBreak())

    # ========== VISAO GERAL ==========
    story.append(Paragraph("VISAO GERAL DO PROJETO", styles['H1']))
    story.append(Paragraph(
        "Apos 4 horas de conversa profunda, identificamos que voces precisam de uma solucao COMPLETA - "
        "nao apenas pre-vendas, mas um ecossistema inteiro que conecte todos os produtos e servicos da "
        "Flavia Leal Beauty School.", styles['Body']))
    story.append(Spacer(1, 10))

    story.append(Paragraph("O Que Este Documento Cobre", styles['H2']))
    verticais = [
        ['Vertical', 'Descricao'],
        ['1. Pre-Vendas & CRM', 'Atendimento 24/7, qualificacao, agendamento'],
        ['2. Pos-Venda & Retencao', 'Onboarding, engajamento, upsell'],
        ['3. E-Commerce de Produtos', 'Loja virtual para materiais e equipamentos'],
        ['4. Guia da Beleza', 'Plataforma de marketing para alunos'],
        ['5. Produtos Marca Propria', 'Integracao com fabrica Brasil'],
        ['6. Cursos Online', 'Plataforma de educacao digital'],
    ]
    story.append(create_table(verticais, [2*inch, 4.8*inch]))
    story.append(PageBreak())

    # ========== PROBLEMAS ==========
    story.append(Paragraph("O QUE IDENTIFICAMOS NA NOSSA CONVERSA", styles['H1']))

    problemas = [
        ("Problema 1: Leads que Escapam",
         "Leads chegam as 2h, 4h, 6h da manha. Ninguem responde. Quando a equipe acorda, o lead ja esfriou ou foi pra concorrencia."),
        ("Problema 2: Equipe Sobrecarregada",
         "A Fabi e as secretarias fazem TUDO: atendimento presencial, WhatsApp, matriculas, follow-up."),
        ("Problema 3: Falta de Visibilidade",
         "Voce nao sabe quantos leads entraram, de onde vieram, quantos converteram. Impossivel otimizar."),
        ("Problema 4: Produtos Encalhados",
         "Tem produto parado, material que poderia estar gerando receita. Sem loja virtual, sem processo de venda automatizado."),
        ("Problema 5: Oportunidades Nao Exploradas",
         "Guia da Beleza parado, produtos de marca propria esperando, cursos online que poderiam escalar. Dinheiro na mesa."),
    ]

    for titulo, desc in problemas:
        story.append(Paragraph(f"<b>{titulo}</b>", styles['H3']))
        story.append(Paragraph(desc, styles['Quote']))

    story.append(PageBreak())

    # ========== CRONOGRAMA GERAL ==========
    story.append(Paragraph("CRONOGRAMA COMPLETO - 6 FASES EM 6 MESES", styles['H1']))

    cronograma_geral = [
        ['Fase', 'Periodo', 'Foco', 'Resultado'],
        ['1', 'Dias 1-30', 'Pre-Vendas & CRM', 'IA atendendo 24/7'],
        ['2', 'Dias 31-60', 'Pos-Venda & Retencao', 'Churn reduzido, upsell'],
        ['3', 'Dias 61-90', 'E-Commerce Produtos', 'Loja virtual funcionando'],
        ['4', 'Dias 91-120', 'Guia da Beleza', 'Plataforma gerando receita'],
        ['5', 'Dias 121-150', 'Marca Propria', 'Integracao com fabrica BR'],
        ['6', 'Dias 151-180', 'Cursos Online', 'Escala nacional/intl'],
    ]
    story.append(create_table(cronograma_geral, [0.6*inch, 1.3*inch, 2*inch, 2.8*inch]))
    story.append(PageBreak())

    # ========== FASE 1 ==========
    story.append(Paragraph("FASE 1: PRE-VENDAS & CRM (Dias 1-30)", styles['H1']))
    story.append(Paragraph("<b>Objetivo:</b> Sistema basico funcionando, IA atendendo 24/7", styles['Body']))

    story.append(Paragraph("Semana 1-2: Fundacao e Agente IA", styles['H2']))
    fase1_s1 = [
        ['Dia', 'Entrega'],
        ['1-2', 'Kickoff + Acesso aos sistemas + Mapeamento'],
        ['3-4', 'CRM Socialfy 100% configurado'],
        ['5-7', '4 Pipelines (1 por escola) criados'],
        ['8-10', 'Agente IA "Diana" no WhatsApp (teste)'],
        ['11-14', 'Integracao Instagram DM + Ajustes tom de voz'],
    ]
    story.append(create_table(fase1_s1, [0.8*inch, 5.8*inch]))

    story.append(Paragraph("Semana 3-4: Automacoes e Go Live", styles['H2']))
    fase1_s2 = [
        ['Dia', 'Entrega'],
        ['15-17', 'Sequencias de follow-up (7 fluxos)'],
        ['18-19', 'Sistema de qualificacao automatica'],
        ['20-21', 'Alertas de lead quente para equipe'],
        ['22-24', 'Dashboard de metricas completo'],
        ['25-27', 'Treinamento equipe Fabi (2h ao vivo)'],
        ['28-30', 'Go Live + Ajustes finos'],
    ]
    story.append(create_table(fase1_s2, [0.8*inch, 5.8*inch]))

    story.append(Paragraph("Entregaveis Fase 1", styles['H3']))
    entregaveis_f1 = [
        "CRM configurado com 4 pipelines",
        "Agente IA 24/7 no WhatsApp + Instagram",
        "7 sequencias de follow-up automaticas",
        "Dashboard de metricas em tempo real",
        "Equipe treinada + Documentacao"
    ]
    for e in entregaveis_f1:
        story.append(Paragraph(f"• {e}", styles['Body']))

    story.append(Paragraph("<b>Investimento Fase 1:</b> Setup $4,997 | Mensalidade $1,497/mes", styles['Highlight']))
    story.append(PageBreak())

    # ========== FASE 2 ==========
    story.append(Paragraph("FASE 2: POS-VENDA & RETENCAO (Dias 31-60)", styles['H1']))
    story.append(Paragraph("<b>Objetivo:</b> Reduzir churn, aumentar LTV, automatizar upsell", styles['Body']))

    fase2 = [
        ['Dia', 'Entrega'],
        ['31-35', 'Agente IA de Onboarding'],
        ['36-40', 'Sequencia de engajamento 90 dias'],
        ['41-42', 'Sistema de NPS automatico'],
        ['43-47', 'Pipeline de upsell (especializacoes)'],
        ['48-52', 'Campanha de reativacao de base'],
        ['53-56', 'Sistema de indicacoes (Member Get Member)'],
        ['57-60', 'Coleta automatica de depoimentos'],
    ]
    story.append(create_table(fase2, [0.8*inch, 5.8*inch]))

    story.append(Paragraph("<b>Investimento Fase 2:</b> Setup $2,997 | Mensalidade +$497/mes", styles['Highlight']))
    story.append(PageBreak())

    # ========== FASE 3 ==========
    story.append(Paragraph("FASE 3: E-COMMERCE DE PRODUTOS (Dias 61-90)", styles['H1']))
    story.append(Paragraph("<b>Objetivo:</b> Loja virtual para materiais, equipamentos e kits", styles['Body']))

    fase3 = [
        ['Dia', 'Entrega'],
        ['61-65', 'Setup plataforma e-commerce'],
        ['66-70', 'Cadastro de produtos (materiais, kits)'],
        ['71-75', 'Integracao pagamentos (Stripe/PayPal)'],
        ['76-80', 'IA vendedora de produtos'],
        ['81-85', 'Fluxo de compra automatizado'],
        ['86-90', 'Sistema de envio/shipping'],
    ]
    story.append(create_table(fase3, [0.8*inch, 5.8*inch]))

    story.append(Paragraph("Entregaveis Fase 3", styles['H3']))
    entregaveis_f3 = [
        "Loja virtual funcionando",
        "Catalogo completo de produtos",
        "Pagamentos integrados",
        "IA vendendo produtos automaticamente",
        "Sistema de shipping configurado",
        "Dashboard de vendas de produtos"
    ]
    for e in entregaveis_f3:
        story.append(Paragraph(f"• {e}", styles['Body']))

    story.append(Paragraph("<b>Investimento Fase 3:</b> Setup $3,997 | Mensalidade +$397/mes | Comissao 3%", styles['Highlight']))
    story.append(PageBreak())

    # ========== FASE 4 ==========
    story.append(Paragraph("FASE 4: GUIA DA BELEZA (Dias 91-120)", styles['H1']))
    story.append(Paragraph("<b>Objetivo:</b> Plataforma de marketing para alunos e profissionais", styles['Body']))

    fase4 = [
        ['Dia', 'Entrega'],
        ['91-95', 'Setup plataforma Guia da Beleza'],
        ['96-100', 'Sistema de cadastro de profissionais'],
        ['101-105', 'Area gratuita vs premium'],
        ['106-110', 'Sistema de destaques pagos'],
        ['111-115', 'Integracao com CRM (ex-alunos)'],
        ['116-120', 'Automacao de oferta para formandos'],
    ]
    story.append(create_table(fase4, [0.8*inch, 5.8*inch]))

    story.append(Paragraph("<b>Investimento Fase 4:</b> Setup $4,997 | Mensalidade +$397/mes | Comissao 10%", styles['Highlight']))
    story.append(PageBreak())

    # ========== FASE 5 ==========
    story.append(Paragraph("FASE 5: PRODUTOS MARCA PROPRIA (Dias 121-150)", styles['H1']))
    story.append(Paragraph("<b>Objetivo:</b> Integrar fabrica do Brasil, vender linha propria", styles['Body']))

    fase5 = [
        ['Dia', 'Entrega'],
        ['121-125', 'Mapeamento de produtos fabrica'],
        ['126-130', 'Sistema de pedidos Brasil-EUA'],
        ['131-135', 'Logistica de importacao'],
        ['136-140', 'Produtos na loja virtual'],
        ['141-145', 'Sistema de revenda (B2B)'],
        ['146-150', 'Programa de afiliados/multinivel'],
    ]
    story.append(create_table(fase5, [0.8*inch, 5.8*inch]))

    story.append(Paragraph("<b>Investimento Fase 5:</b> Setup $5,997 | Mensalidade +$597/mes | Comissao 5%", styles['Highlight']))
    story.append(PageBreak())

    # ========== FASE 6 ==========
    story.append(Paragraph("FASE 6: CURSOS ONLINE (Dias 151-180)", styles['H1']))
    story.append(Paragraph("<b>Objetivo:</b> Escalar educacao para Brasil e mundo", styles['Body']))

    fase6 = [
        ['Dia', 'Entrega'],
        ['151-155', 'Setup plataforma EAD'],
        ['156-160', 'Estrutura de cursos (modulos)'],
        ['161-165', 'Sistema de certificados'],
        ['166-170', 'Gravacao curso piloto'],
        ['171-175', 'Funil de vendas curso online'],
        ['176-180', 'Lancamento + Automacoes'],
    ]
    story.append(create_table(fase6, [0.8*inch, 5.8*inch]))

    story.append(Paragraph("<b>Investimento Fase 6:</b> Setup $7,997 | Mensalidade +$697/mes | Comissao 10%", styles['Highlight']))
    story.append(PageBreak())

    # ========== RESUMO FINANCEIRO ==========
    story.append(Paragraph("RESUMO FINANCEIRO COMPLETO", styles['H1']))

    story.append(Paragraph("Investimento por Fase", styles['H2']))
    resumo_fin = [
        ['Fase', 'Setup', 'Mensalidade'],
        ['1. Pre-Vendas & CRM', '$4,997', '$1,497/mes'],
        ['2. Pos-Venda & Retencao', '$2,997', '+$497/mes'],
        ['3. E-Commerce Produtos', '$3,997', '+$397/mes'],
        ['4. Guia da Beleza', '$4,997', '+$397/mes'],
        ['5. Marca Propria', '$5,997', '+$597/mes'],
        ['6. Cursos Online', '$7,997', '+$697/mes'],
        ['TOTAL', '$30,982', '$4,082/mes'],
    ]
    story.append(create_table(resumo_fin, [2.5*inch, 2*inch, 2*inch]))
    story.append(Spacer(1, 12))

    # OPCOES
    story.append(Paragraph("OPCOES DE CONTRATACAO", styles['H1']))

    story.append(Paragraph("OPCAO A: PROJETO COMPLETO (Recomendado)", styles['H2']))
    story.append(Paragraph("Contrata todas as 6 fases de uma vez", styles['Body']))
    opcao_a = [
        ['Item', 'Valor Normal', 'Valor Especial'],
        ['Setup Total', '$30,982', '$19,997 (35% OFF)'],
        ['Mensalidade Total', '$4,082/mes', '$2,997/mes (27% OFF)'],
        ['Parcelamento Setup', '-', '6x de $3,500'],
    ]
    story.append(create_table(opcao_a, [2.2*inch, 2*inch, 2.4*inch], ACCENT_COLOR))

    story.append(Paragraph("<b>Bonus Exclusivos Projeto Completo:</b>", styles['Gold']))
    bonus_list = [
        "Clone de Video (Avatar Flavia) - $2,000 valor",
        "Clone de Voz (ElevenLabs) - $500 valor",
        "Consultoria Estrategica Mensal - $1,500/mes valor",
        "Suporte VIP WhatsApp 90 dias - $1,500 valor",
        "TOTAL BONUS: $5,500"
    ]
    for b in bonus_list:
        story.append(Paragraph(f"• {b}", styles['Small']))

    story.append(Spacer(1, 10))
    story.append(Paragraph("OPCAO B: FASE A FASE", styles['H2']))
    story.append(Paragraph("Contrata uma fase por vez, conforme resultado", styles['Body']))
    opcao_b = [
        ['Item', 'Valor'],
        ['Fase 1 (inicio imediato)', '$4,997 + $1,497/mes'],
        ['Fases subsequentes', 'Valor cheio da fase'],
    ]
    story.append(create_table(opcao_b, [3.3*inch, 3.3*inch]))

    story.append(Spacer(1, 10))
    story.append(Paragraph("OPCAO C: CORE + ESCALA", styles['H2']))
    story.append(Paragraph("Fases 1-3 agora, Fases 4-6 depois", styles['Body']))
    opcao_c = [
        ['Pacote', 'Setup', 'Mensalidade'],
        ['Core (Fases 1-3)', '$9,997', '$2,391/mes'],
        ['Escala (Fases 4-6)', '$14,997', '$1,691/mes'],
    ]
    story.append(create_table(opcao_c, [2.2*inch, 2.2*inch, 2.2*inch]))
    story.append(PageBreak())

    # ========== ROI ==========
    story.append(Paragraph("ROI PROJETADO", styles['H1']))

    story.append(Paragraph("Cenario Conservador (Mes 6)", styles['H2']))
    roi_c = [
        ['Vertical', 'Receita Adicional/Mes'],
        ['Pre-Vendas (+4 matriculas)', '+$8,000'],
        ['Upsell (+2 especializacoes)', '+$2,000'],
        ['E-Commerce produtos', '+$3,000'],
        ['Guia da Beleza', '+$1,500'],
        ['Marca Propria', '+$5,000'],
        ['Cursos Online', '+$5,000'],
        ['TOTAL ADICIONAL', '+$24,500/mes'],
    ]
    story.append(create_table(roi_c, [3.3*inch, 3.3*inch]))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Cenario Esperado (Mes 12)", styles['H2']))
    roi_e = [
        ['Vertical', 'Receita Adicional/Mes'],
        ['Pre-Vendas (+8 matriculas)', '+$16,000'],
        ['Upsell (+5 especializacoes)', '+$5,000'],
        ['E-Commerce produtos', '+$8,000'],
        ['Guia da Beleza', '+$3,000'],
        ['Marca Propria', '+$15,000'],
        ['Cursos Online', '+$20,000'],
        ['TOTAL ADICIONAL', '+$67,000/mes'],
    ]
    story.append(create_table(roi_e, [3.3*inch, 3.3*inch], ACCENT_COLOR))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Payback", styles['H2']))
    payback = [
        ['Opcao', 'Investimento Total', 'Payback'],
        ['Projeto Completo', '$19,997 + $2,997/mes', '~2 meses'],
        ['Fase a Fase', '$30,982 + $4,082/mes', '~3 meses'],
    ]
    story.append(create_table(payback, [2.2*inch, 2.2*inch, 2.2*inch]))
    story.append(PageBreak())

    # ========== PARTICIPACAO ==========
    story.append(Paragraph("O QUE VOCE PRECISA FAZER", styles['H1']))
    story.append(Paragraph("Sua participacao total: ~15 horas em 6 meses", styles['Body']))

    participacao = [
        ['Tarefa', 'Tempo', 'Quando'],
        ['Call de kickoff', '1h', 'Dia 1'],
        ['Revisar tom de voz da IA', '30min', 'Dia 5'],
        ['Gravar 5 audios de referencia', '30min', 'Dia 7'],
        ['Validar funis e mensagens', '1h', 'Dia 14'],
        ['Treinamento equipe Fase 1', '2h', 'Dia 26'],
        ['Validacao Pos-Venda', '1h', 'Dia 45'],
        ['Revisao catalogo produtos', '1h', 'Dia 70'],
        ['Validacao Guia da Beleza', '1h', 'Dia 100'],
        ['Gravacao video curso piloto', '3h', 'Dia 160'],
        ['Revisao e aprovacao final', '2h', 'Dia 175'],
    ]
    story.append(create_table(participacao, [3*inch, 1.5*inch, 2*inch]))
    story.append(Paragraph("<b>Todo o resto e com a gente.</b>", styles['Highlight']))
    story.append(PageBreak())

    # ========== GARANTIAS ==========
    story.append(Paragraph("GARANTIAS BLINDADAS", styles['H1']))

    garantias = [
        ("1. Garantia de Saida",
         "Contrato minimo de 6 meses, mas voce pode sair em 3 meses sem multa se nao estiver satisfeita."),
        ("2. Opcao de Manutencao Minima (Plano Autonomo)",
         "Apos 3 meses, se preferir continuar apenas com a IA e os processos ja criados - sem suporte ativo e "
         "otimizacoes continuas - voce paga apenas $497/mes por fase implementada. Sem custos adicionais. "
         "A IA continua funcionando 24/7 e voce pode retomar o plano completo a qualquer momento."),
        ("3. Garantia de Resultado",
         "Se em 6 meses o ecossistema completo nao gerar ROI positivo, continuo trabalhando SEM COBRAR ate gerar."),
        ("4. Garantia de Entrega",
         "Cada fase tem prazo definido. Se nao entregar no prazo, voce ganha 1 mes de mensalidade gratis daquela fase."),
        ("5. Garantia de Propriedade",
         "Tudo que for construido e SEU. Se encerrar o contrato, os dados, funis, lojas e automacoes ficam com voce."),
        ("6. Garantia de Suporte",
         "Resposta em ate 24h uteis. Se nao responder, desconto na mensalidade."),
        ("7. Garantia de Compatibilidade",
         "Se algum sistema nao funcionar bem com outro, ajustamos sem custo adicional ate funcionar perfeitamente."),
    ]

    for titulo, desc in garantias:
        story.append(Paragraph(f"<b>{titulo}</b>", styles['H3']))
        story.append(Paragraph(desc, styles['Quote']))

    story.append(PageBreak())

    # ========== FAQ ==========
    story.append(Paragraph("FAQ - PERGUNTAS FREQUENTES", styles['H1']))

    faqs = [
        ('"Por que fazer tudo junto em vez de fase a fase?"',
         "O ecossistema integrado gera sinergias. Um aluno de curso presencial compra produtos, entra no Guia, indica amigos. "
         "Fazer separado perde essas conexoes e custa mais no total."),
        ('"E se eu so quiser comecar com pre-vendas?"',
         "Pode! A Fase 1 funciona independente. Mas o desconto do projeto completo e significativo e voce perde os bonus."),
        ('"Quanto tempo por semana vou gastar com isso?"',
         "Apos implementacao de cada fase: menos de 1h por semana por vertical. Com o ecossistema completo, ~3-4h/semana total."),
        ('"A IA consegue separar os assuntos mesmo?"',
         'Sim. Treinamos a IA para identificar: "Quero fazer curso" vs "Quero comprar produto" vs "Quero anunciar no Guia". '
         "Cada um vai pro funil certo."),
        ('"E os produtos de marca propria? Preciso ir ao Brasil?"',
         "Voce vai ao Brasil para fechar com a fabrica. Depois, o sistema de pedidos e automatizado. A logistica a gente configura junto."),
    ]

    for pergunta, resposta in faqs:
        story.append(Paragraph(f"<b>{pergunta}</b>", styles['H3']))
        story.append(Paragraph(resposta, styles['Body']))

    story.append(PageBreak())

    # ========== PROXIMOS PASSOS ==========
    story.append(Paragraph("PROXIMOS PASSOS", styles['H1']))

    story.append(Paragraph("Escolha sua Opcao:", styles['H2']))
    opcoes = [
        "OPCAO A: Projeto Completo ($19,997 + $2,997/mes) - RECOMENDADO",
        "OPCAO B: Fase a Fase (comecar com Fase 1: $4,997 + $1,497/mes)",
        "OPCAO C: Core + Escala ($9,997 agora, Fases 4-6 depois)"
    ]
    for o in opcoes:
        story.append(Paragraph(f"[ ] {o}", styles['Body']))

    story.append(Spacer(1, 12))
    passos = [
        ("Passo 1: Aceite", 'Responda "QUERO COMECAR COM OPCAO [A/B/C]"'),
        ("Passo 2: Pagamento", "Envio o link para pagamento do setup escolhido"),
        ("Passo 3: Kickoff", "Agendamos call de 1h nas proximas 24h"),
        ("Passo 4: Go Live Fase 1", "Em 30 dias, primeiro sistema funcionando"),
    ]
    for titulo, desc in passos:
        story.append(Paragraph(f"<b>{titulo}:</b> {desc}", styles['Body']))

    story.append(Spacer(1, 12))
    story.append(Paragraph("Timeline se Fechar HOJE com Projeto Completo", styles['H2']))
    timeline = [
        ['Marco', 'Data', 'Acontece'],
        ['Hoje', '02/Jan', 'Aceite + Pagamento'],
        ['Amanha', '03/Jan', 'Call de Kickoff'],
        ['Dia 30', '01/Fev', 'Fase 1 completa - IA atendendo'],
        ['Dia 60', '03/Mar', 'Fase 2 completa - Pos-venda ativo'],
        ['Dia 90', '02/Abr', 'Fase 3 completa - E-commerce no ar'],
        ['Dia 120', '02/Mai', 'Fase 4 completa - Guia da Beleza'],
        ['Dia 150', '01/Jun', 'Fase 5 completa - Marca propria'],
        ['Dia 180', '01/Jul', 'Fase 6 completa - Cursos online'],
    ]
    story.append(create_table(timeline, [1*inch, 1.2*inch, 4.4*inch]))
    story.append(Paragraph("<b>Em 6 meses: Ecossistema completo gerando +$67,000/mes</b>", styles['Gold']))
    story.append(PageBreak())

    # ========== TERMO ==========
    story.append(Paragraph("TERMO DE ACEITE", styles['H1']))
    story.append(Paragraph('Ao responder "QUERO COMECAR", voce concorda com:', styles['Body']))

    story.append(Paragraph("<b>Para Projeto Completo (Opcao A):</b>", styles['H3']))
    termos_a = [
        "Setup de $19,997 (ou 6x $3,500)",
        "Mensalidade de $2,997/mes (inicio apos go-live Fase 1)",
        "Contrato de 12 meses (saida permitida em 3 meses)",
        "Termos de garantia descritos acima",
        "Bonus inclusos ($5,500 em valor)"
    ]
    for t in termos_a:
        story.append(Paragraph(f"• {t}", styles['Body']))

    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>Para Fase a Fase (Opcao B):</b>", styles['H3']))
    termos_b = [
        "Setup Fase 1: $4,997 (ou 3x $1,800)",
        "Mensalidade Fase 1: $1,497/mes",
        "Contrato de 6 meses por fase",
        "Fases subsequentes com valores cheios"
    ]
    for t in termos_b:
        story.append(Paragraph(f"• {t}", styles['Body']))

    story.append(Spacer(1, 0.4*inch))
    story.append(Paragraph("<b>Flavia, voce construiu 4 escolas do zero.</b>", styles['Body']))
    story.append(Paragraph("<b>Voce ja provou que consegue criar imperios.</b>", styles['Body']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Agora e hora de construir a MAQUINA que vai conectar todos os seus produtos, servicos e sonhos "
        "em um unico ecossistema que funciona 24/7.", styles['Body']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Vamos construir esse imperio juntos?</b>", styles['Highlight']))

    story.append(Spacer(1, 0.4*inch))
    story.append(Paragraph("Marcos Daniel", styles['Body']))
    story.append(Paragraph("MOTTIVME", styles['Body']))
    story.append(Paragraph("WhatsApp: +1 (857) 285-9871", styles['Body']))
    story.append(Paragraph("Email: marcos@mottivme.com", styles['Body']))

    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("<i>Proposta valida ate 05/01/2026</i>", styles['Footer']))
    story.append(Paragraph("<i>Precos em dolar americano (USD)</i>", styles['Footer']))
    story.append(Paragraph("<i>Desconto Projeto Completo valido apenas para fechamento ate 05/01/2026</i>", styles['Footer']))

    # Build PDF
    doc.build(story)
    print(f"PDF criado com sucesso: {output_path}")
    return output_path

if __name__ == "__main__":
    build_pdf()
