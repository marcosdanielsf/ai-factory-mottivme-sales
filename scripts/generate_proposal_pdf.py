#!/usr/bin/env python3
"""
Gerador de PDF profissional para proposta Flavia Leal Beauty School
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

# Cores da marca
PRIMARY_COLOR = HexColor('#1a365d')  # Azul escuro
SECONDARY_COLOR = HexColor('#2c5282')  # Azul medio
ACCENT_COLOR = HexColor('#38a169')  # Verde
LIGHT_BG = HexColor('#f7fafc')  # Cinza claro
HIGHLIGHT = HexColor('#ed8936')  # Laranja

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

    # Body text
    styles.add(ParagraphStyle(
        name='Body',
        parent=styles['Normal'],
        fontSize=11,
        textColor=black,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        fontName='Helvetica',
        leading=14
    ))

    # Quote/Blockquote
    styles.add(ParagraphStyle(
        name='Quote',
        parent=styles['Normal'],
        fontSize=11,
        textColor=SECONDARY_COLOR,
        spaceBefore=8,
        spaceAfter=8,
        leftIndent=20,
        rightIndent=20,
        fontName='Helvetica-Oblique',
        leading=14,
        borderColor=ACCENT_COLOR,
        borderWidth=2,
        borderPadding=10
    ))

    # Highlight text
    styles.add(ParagraphStyle(
        name='Highlight',
        parent=styles['Normal'],
        fontSize=12,
        textColor=HIGHLIGHT,
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

    return styles

def create_table(data, col_widths=None):
    """Cria tabela estilizada"""
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_BG),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#cbd5e0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_BG]),
    ]))
    return t

def build_pdf():
    output_path = "/Users/marcosdaniels/Documents/Projetos/MOTTIVME SALES TOTAL/projects/n8n-workspace/Fluxos n8n/AI-Factory- Mottivme Sales/PROPOSTA-FLAVIA-LEAL-FINAL.pdf"

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )

    styles = create_styles()
    story = []

    # ========== CAPA ==========
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("PROPOSTA COMERCIAL", styles['MainTitle']))
    story.append(Paragraph("Sistema de Automacao Inteligente", styles['Subtitle']))
    story.append(Spacer(1, 0.5*inch))

    story.append(Paragraph("<b>Preparada exclusivamente para:</b>", styles['Body']))
    story.append(Paragraph("Flavia Leal & Theo Castro", styles['H2']))
    story.append(Paragraph("Flavia Leal Beauty School", styles['Body']))
    story.append(Paragraph("4 Escolas | Massachusetts & Florida, EUA", styles['Body']))
    story.append(Spacer(1, 0.5*inch))

    story.append(Paragraph("<b>Por:</b>", styles['Body']))
    story.append(Paragraph("Marcos Daniel", styles['H2']))
    story.append(Paragraph("MOTTIVME - Automacao de Vendas com IA", styles['Body']))
    story.append(Spacer(1, 0.5*inch))

    story.append(Paragraph("<b>Data:</b> 02 de Janeiro de 2026", styles['Body']))
    story.append(PageBreak())

    # ========== DIAGNOSTICO ==========
    story.append(Paragraph("O QUE IDENTIFICAMOS NA NOSSA CONVERSA", styles['H1']))
    story.append(Paragraph(
        "Apos 4 horas de conversa profunda, ficou claro que voces tem um negocio incrivel com 4 escolas, "
        "mas estao enfrentando desafios que impedem o proximo nivel:", styles['Body']))
    story.append(Spacer(1, 12))

    problemas = [
        ("Problema 1: Leads que Escapam",
         "Leads chegam as 2h, 4h, 6h da manha. Ninguem responde. Quando a equipe acorda, o lead ja esfriou ou foi pra concorrencia."),
        ("Problema 2: Equipe Sobrecarregada",
         "A Fabi e as secretarias fazem TUDO: atendimento presencial, WhatsApp, matriculas, follow-up. Impossivel fazer bem todas as coisas."),
        ("Problema 3: Falta de Visibilidade",
         "Voce nao sabe quantos leads entraram, de onde vieram, quantos converteram. Impossivel otimizar o que nao se mede."),
        ("Problema 4: Dependencia de Pessoas",
         "Se alguem falta, adoece ou sai de ferias, o atendimento para. A maquina depende de humanos que falham."),
        ("Problema 5: Investimentos sem Retorno",
         '"O Te desde que chegou so gastou" - voces ja investiram em solucoes que nao funcionaram. Precisa de algo que DE RESULTADO.'),
    ]

    for titulo, desc in problemas:
        story.append(Paragraph(f"<b>{titulo}</b>", styles['H2']))
        story.append(Paragraph(desc, styles['Quote']))

    story.append(PageBreak())

    # ========== SOLUCAO ==========
    story.append(Paragraph("A SOLUCAO: SISTEMA BPOSS", styles['H1']))
    story.append(Paragraph("<b>Business Process Outsourcing Sales Services</b>", styles['Body']))
    story.append(Paragraph("Automacao de Pre-Vendas com Inteligencia Artificial", styles['Body']))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Como Funciona (Visao Geral)", styles['H2']))

    fluxo_data = [
        ['Etapa', 'O que acontece'],
        ['1. LEAD CHEGA', 'Qualquer hora, qualquer canal (WhatsApp, Instagram, Site)'],
        ['2. AGENTE IA 24/7', 'Responde em < 2 min, qualifica automaticamente, agenda visita'],
        ['3. DASHBOARD', 'Voce ve tudo em tempo real com metricas claras'],
        ['4. VENDEDORA HUMANA', 'Recebe so leads QUENTES com resumo da conversa'],
        ['5. FOLLOW-UP AUTO', 'Sequencia de 21 dias, ninguem escapa do funil'],
    ]
    story.append(create_table(fluxo_data, [1.5*inch, 5*inch]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Diferencial para Escolas de Beleza", styles['H2']))
    diferenciais = [
        "<b>Fuso horario:</b> IA atende quando brasileiros estao acordos (noite americana)",
        "<b>Multilingue:</b> Portugues, Ingles, Espanhol nativo",
        "<b>Especializacao:</b> Entende cursos de licenciamento, I20, especializacoes",
        "<b>Personalizacao:</b> Usa a voz e o tom da Flavia nas mensagens",
    ]
    for d in diferenciais:
        story.append(Paragraph(f"• {d}", styles['Body']))

    story.append(PageBreak())

    # ========== CRONOGRAMA ==========
    story.append(Paragraph("CRONOGRAMA DE IMPLEMENTACAO", styles['H1']))

    story.append(Paragraph("FASE 1: FUNDACAO (Dias 1-15)", styles['H2']))
    fase1 = [
        ['Dia', 'Entrega'],
        ['1-3', 'Kickoff + Acesso aos sistemas'],
        ['4-7', 'CRM GoHighLevel 100% configurado'],
        ['8-10', 'Funis separados por produto (4 funis)'],
        ['11-13', 'Agente IA no WhatsApp (teste)'],
        ['14-15', 'Dashboard de metricas + Go Live'],
    ]
    story.append(create_table(fase1, [1*inch, 5.5*inch]))
    story.append(Paragraph("<b>Resultado:</b> Sistema basico funcionando, IA atendendo 24/7", styles['Highlight']))

    story.append(Paragraph("FASE 2: AUTOMACAO (Dias 16-30)", styles['H2']))
    fase2 = [
        ['Dia', 'Entrega'],
        ['16-18', 'Sequencias de follow-up (7 fluxos)'],
        ['19-21', 'Integracao com calendario'],
        ['22-25', 'Reativacao de base antiga'],
        ['26-28', 'Treinamento da equipe (2h ao vivo)'],
        ['29-30', 'Ajustes finos + Documentacao'],
    ]
    story.append(create_table(fase2, [1*inch, 5.5*inch]))
    story.append(Paragraph("<b>Resultado:</b> Automacao completa, equipe treinada, base reativada", styles['Highlight']))

    story.append(Paragraph("FASE 3: ESCALA (Dias 31-60)", styles['H2']))
    fase3 = [
        ['Dia', 'Entrega'],
        ['31-40', 'Sistema de prospeccao ativa (50 leads/dia)'],
        ['41-50', 'Otimizacao baseada em dados'],
        ['51-60', 'Escala para 200 leads/dia'],
    ]
    story.append(create_table(fase3, [1*inch, 5.5*inch]))
    story.append(Paragraph("<b>Resultado:</b> Maquina de geracao de leads em pleno funcionamento", styles['Highlight']))

    story.append(PageBreak())

    # ========== CHECKLIST ==========
    story.append(Paragraph("O QUE VOCE PRECISA FAZER", styles['H1']))
    story.append(Paragraph("Sua participacao total: ~5 horas em 60 dias", styles['Body']))

    checklist = [
        ['Tarefa', 'Tempo', 'Quando'],
        ['Call de kickoff', '1h', 'Dia 1'],
        ['Revisar tom de voz da IA', '30min', 'Dia 5'],
        ['Gravar 5 audios de referencia', '30min', 'Dia 7'],
        ['Validar funis e mensagens', '1h', 'Dia 14'],
        ['Participar do treinamento', '2h', 'Dia 26'],
    ]
    story.append(create_table(checklist, [3*inch, 1.5*inch, 2*inch]))
    story.append(Paragraph("<b>Todo o resto e com a gente.</b>", styles['Highlight']))

    story.append(PageBreak())

    # ========== ENTREGAVEIS ==========
    story.append(Paragraph("ENTREGAVEIS COMPLETOS", styles['H1']))

    # CRM
    story.append(Paragraph("1. CRM GoHighLevel Configurado", styles['H2']))
    crm_data = [
        ['Item', 'Descricao'],
        ['Pipelines', '4 pipelines (1 por escola)'],
        ['Etapas', 'Lead > Qualificado > Agendado > Matriculado > Aluno'],
        ['Campos', 'Todos os campos necessarios mapeados'],
        ['Tags', 'Sistema de tags para segmentacao'],
        ['Usuarios', 'Acessos configurados por nivel'],
    ]
    story.append(create_table(crm_data, [2*inch, 4.5*inch]))

    # IA
    story.append(Paragraph("2. Agente IA 24/7", styles['H2']))
    ia_data = [
        ['Caracteristica', 'Detalhe'],
        ['Tempo resposta', '< 2 minutos'],
        ['Disponibilidade', '24 horas, 7 dias'],
        ['Idiomas', 'PT, EN, ES'],
        ['Canais', 'WhatsApp (principal), Instagram DM'],
        ['Personalidade', 'Tom da Flavia, empolgada mas profissional'],
    ]
    story.append(create_table(ia_data, [2*inch, 4.5*inch]))

    # Follow-up
    story.append(Paragraph("3. Automacoes de Follow-up", styles['H2']))
    followup_data = [
        ['Sequencia', 'Trigger', 'Duracao'],
        ['Lead novo', 'Primeiro contato', '7 dias'],
        ['Nao respondeu', 'Sem resposta 24h', '14 dias'],
        ['Agendou mas nao veio', 'No-show', '7 dias'],
        ['Visitou mas nao fechou', 'Pos-visita', '21 dias'],
        ['Lead frio', 'Sem interacao 30d', '30 dias'],
        ['Ex-aluno', 'Pos-conclusao', 'Continuo'],
    ]
    story.append(create_table(followup_data, [2.2*inch, 2.2*inch, 2*inch]))

    # Bonus
    story.append(Paragraph("4. Bonus Exclusivos", styles['H2']))
    bonus_data = [
        ['Bonus', 'Valor', 'Descricao'],
        ['Blitz de Reativacao', '$1,500', 'Campanha na sua base inteira em 48h'],
        ['Clone de Voz', '$500', '10 audios personalizados'],
        ['Suporte Prioritario', '$1,500', 'WhatsApp direto por 90 dias'],
        ['TOTAL BONUS', '$3,500', 'Incluso na proposta'],
    ]
    story.append(create_table(bonus_data, [2*inch, 1.2*inch, 3.3*inch]))

    story.append(PageBreak())

    # ========== INVESTIMENTO ==========
    story.append(Paragraph("INVESTIMENTO", styles['H1']))

    story.append(Paragraph("O Custo de NAO Ter", styles['H2']))
    story.append(Paragraph("Antes de falar em investimento, vamos ao custo de continuar como esta:", styles['Body']))

    custo_inacao = [
        ['Perda', 'Valor Mensal'],
        ['Leads perdidos de madrugada (~20/mes)', '$4,000'],
        ['Leads que esfriam por follow-up lento', '$3,000'],
        ['Base antiga nao trabalhada', '$2,000'],
        ['Tempo da equipe em tarefas manuais', '$1,000'],
        ['CUSTO MENSAL DA INACAO', '~$10,000'],
    ]
    story.append(create_table(custo_inacao, [4*inch, 2.5*inch]))

    story.append(Paragraph("Seu Investimento Real", styles['H2']))
    investimento = [
        ['Item', 'Valor', 'Condicao Especial'],
        ['Setup e Implementacao', '$7,997', '$4,997 (37% OFF)'],
        ['Opcao parcelada', '-', '3x de $1,800'],
        ['Mensalidade Completa', '$1,997', '$1,497/mes (25% OFF)'],
        ['Plano Autonomo (apos 3 meses)', '-', '$497/mes'],
    ]
    story.append(create_table(investimento, [2.2*inch, 1.5*inch, 2.8*inch]))

    story.append(Paragraph("ROI Calculado", styles['H2']))
    roi_data = [
        ['Cenario', 'Matriculas Extras', 'Receita', 'ROI'],
        ['Conservador', '+2/mes', '+$4,000', '167%'],
        ['Esperado', '+4/mes', '+$8,000', '434%'],
        ['Otimista', '+6/mes', '+$12,000', '701%'],
    ]
    story.append(create_table(roi_data, [1.6*inch, 1.6*inch, 1.6*inch, 1.6*inch]))

    story.append(Paragraph("<b>Payback do setup:</b> 1-2 meses | <b>ROI anual esperado:</b> 301%", styles['Highlight']))

    story.append(PageBreak())

    # ========== GARANTIAS ==========
    story.append(Paragraph("GARANTIAS", styles['H1']))

    garantias = [
        ("1. Garantia de Saida",
         "Contrato minimo de 6 meses, mas voce pode sair em 3 meses sem multa se nao estiver satisfeita."),
        ("2. Opcao de Manutencao Minima (Plano Autonomo)",
         "Apos 3 meses, se preferir continuar apenas com a IA e os processos ja criados - sem suporte ativo e "
         "otimizacoes continuas - voce paga apenas $497/mes. Sem custos adicionais. A IA continua funcionando 24/7, "
         "as automacoes rodam normalmente, e voce pode retomar o plano completo de manutencao ($1,497/mes) a qualquer momento."),
        ("3. Garantia de Resultado",
         "Se em 6 meses o sistema nao gerar ROI positivo, continuo trabalhando SEM COBRAR ate gerar."),
        ("4. Garantia de Entrega",
         "Se nao entregar a Fase 1 em 15 dias, voce ganha 1 mes de mensalidade gratis."),
        ("5. Garantia de Propriedade",
         "Tudo que for construido e SEU. Se encerrar o contrato, os dados, funis e automacoes ficam com voce."),
        ("6. Garantia de Suporte",
         "Resposta em ate 24h uteis. Se nao responder, desconto na mensalidade."),
    ]

    for titulo, desc in garantias:
        story.append(Paragraph(f"<b>{titulo}</b>", styles['H2']))
        story.append(Paragraph(desc, styles['Quote']))

    story.append(PageBreak())

    # ========== PROXIMOS PASSOS ==========
    story.append(Paragraph("PROXIMOS PASSOS", styles['H1']))
    story.append(Paragraph("Para ativar tudo isso:", styles['Body']))

    passos = [
        ("Passo 1: Aceite", 'Responda "QUERO COMECAR" nesta conversa'),
        ("Passo 2: Pagamento", "Envio o link para pagamento do setup ($4,997 ou 3x $1,800)"),
        ("Passo 3: Kickoff", "Agendamos call de 1h nas proximas 24h"),
        ("Passo 4: Go Live", "Em 15 dias, sistema funcionando"),
    ]
    for titulo, desc in passos:
        story.append(Paragraph(f"<b>{titulo}</b>", styles['H2']))
        story.append(Paragraph(desc, styles['Body']))

    story.append(Paragraph("Timeline se Fechar HOJE", styles['H2']))
    timeline = [
        ['Dia', 'Acontece'],
        ['Hoje', 'Aceite + Pagamento'],
        ['Amanha', 'Call de Kickoff'],
        ['Dia 15', 'Sistema no ar, IA atendendo'],
        ['Dia 30', 'Automacoes completas, equipe treinada'],
        ['Dia 60', 'Prospeccao ativa, 50-200 leads/dia'],
    ]
    story.append(create_table(timeline, [1.5*inch, 5*inch]))

    story.append(PageBreak())

    # ========== FAQ ==========
    story.append(Paragraph("FAQ - PERGUNTAS FREQUENTES", styles['H1']))

    faqs = [
        ('"E se a IA responder errado?"',
         "A IA e treinada com suas informacoes especificas e tem regras claras do que pode/nao pode fazer. "
         "Alem disso, voce recebe notificacao de conversas 'sensiveis' para intervir. E sempre pode ajustar o comportamento."),
        ('"Funciona com meu CRM atual?"',
         "Se voce ja usa GoHighLevel, aproveitamos tudo. Se usa outro, migramos os dados. "
         "Se nao tem CRM, configuramos do zero. Qualquer cenario funciona."),
        ('"Quanto tempo por semana vou gastar com isso?"',
         "Apos implementacao: menos de 1h por semana revisando dashboard e aprovando ajustes. "
         "A ideia e LIBERAR seu tempo, nao criar mais trabalho."),
        ('"O que acontece se eu cancelar?"',
         "Os dados sao seus. Exportamos tudo. Voce pode continuar usando o CRM pagando direto ($97/mes). "
         "So perde as automacoes e o suporte."),
        ('"Voces ja trabalharam com escolas de beleza?"',
         "Trabalhamos com clinicas de estetica, que tem modelo similar: alto ticket, venda consultiva, "
         "importancia de relacionamento. A logica e a mesma, adaptamos para seu contexto especifico."),
    ]

    for pergunta, resposta in faqs:
        story.append(Paragraph(f"<b>{pergunta}</b>", styles['H2']))
        story.append(Paragraph(resposta, styles['Body']))

    story.append(PageBreak())

    # ========== TERMO DE ACEITE ==========
    story.append(Paragraph("TERMO DE ACEITE", styles['H1']))
    story.append(Paragraph('Ao responder "QUERO COMECAR", voce concorda com:', styles['Body']))

    termos = [
        "Setup de $4,997 (ou 3x $1,800)",
        "Mensalidade de $1,497/mes (inicio apos go-live)",
        "Opcao de Plano Autonomo por $497/mes apos 3 meses",
        "Contrato de 6 meses (saida permitida em 3 meses)",
        "Termos de garantia descritos acima",
    ]
    for t in termos:
        story.append(Paragraph(f"• {t}", styles['Body']))

    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("<b>Flavia, voce construiu 4 escolas do zero.</b>", styles['Body']))
    story.append(Paragraph("<b>Agora e hora de construir a MAQUINA que vai fazer elas crescerem sozinhas.</b>", styles['Body']))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph("<b>Vamos comecar?</b>", styles['Highlight']))

    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("Marcos Daniel", styles['Body']))
    story.append(Paragraph("MOTTIVME", styles['Body']))
    story.append(Paragraph("WhatsApp: +1 (857) 285-9871", styles['Body']))
    story.append(Paragraph("Email: marcos@mottivme.com", styles['Body']))

    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("<i>Proposta valida ate 05/01/2026</i>", styles['Footer']))
    story.append(Paragraph("<i>Precos em dolar americano (USD)</i>", styles['Footer']))

    # Build PDF
    doc.build(story)
    print(f"PDF criado com sucesso: {output_path}")
    return output_path

if __name__ == "__main__":
    build_pdf()
