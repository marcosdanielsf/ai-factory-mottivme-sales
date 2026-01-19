# INSTRUÇÕES: Criar Funil de Captação no GHL

> Documento para criar a landing page de captação dentro do GoHighLevel
> Tempo estimado: 1-2 horas
> Última atualização: 2026-01-16

---

## VISÃO GERAL

Este documento guia a criação de um funil (landing page) para captação de pacientes dentro do GHL. A página terá:

- Hero com CTA principal
- Seção de benefícios
- Sobre o médico
- Serviços oferecidos
- Depoimentos
- FAQ
- Formulário de contato
- Botão flutuante WhatsApp

---

## PASSO 1: Criar o Funil

### 1.1 Acessar Funnels

1. No menu lateral, clique em **Sites**
2. Clique em **Funnels**
3. Clique no botão **+ New Funnel** (canto superior direito)

### 1.2 Configurar Funil

1. **Name:** `Landing Page - [Nome da Clínica]`
2. **Domain:** Selecione o subdomínio ou domínio personalizado
3. Clique **Create Funnel**

### 1.3 Adicionar Página

1. Clique em **+ Add New Step**
2. Selecione **Landing Page**
3. **Step Name:** `Página Principal`
4. **Path:** `/` (ou `agendamento`)
5. Clique **Save**
6. Clique em **Open Page Editor** para editar

---

## PASSO 2: Configurar Página

### 2.1 Configurações Gerais

No editor, clique no ícone de engrenagem (Settings):

**SEO Settings:**
- **Page Title:** `[Nome do Médico] - [Especialidade] em [Cidade]`
- **Meta Description:** `Agende sua consulta com [Nome do Médico], [Especialidade] em [Cidade]. Atendimento humanizado, convênios aceitos. WhatsApp: [Número]`

**Favicon:** Fazer upload do logo da clínica

**Custom Code (Head):**
```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 2.2 Configurar Cores

No painel lateral, vá em **Theme Settings**:

| Configuração | Valor Sugerido |
|--------------|----------------|
| Primary Color | `#0D6EFD` (azul) |
| Secondary Color | `#198754` (verde) |
| Background | `#FFFFFF` |
| Text Color | `#1A1A2E` |
| Font Family | Inter |

---

## PASSO 3: Construir as Seções

### SEÇÃO 1: HERO (Topo)

**Estrutura:**
```
[CONTAINER - Full Width, Background com gradiente ou imagem]
  [ROW - 2 colunas no desktop, 1 no mobile]
    [COLUNA 1 - 60%]
      - Headline (H1)
      - Subheadline (parágrafo)
      - Estatísticas (3 números)
      - Botões CTA (2)
    [COLUNA 2 - 40%]
      - Imagem do médico ou clínica
```

**Textos para copiar:**

**Headline (H1):**
```
Cuidando da sua saúde com excelência e dedicação
```

**Subheadline:**
```
[Especialidade] em [Cidade] com atendimento humanizado.
Agende sua consulta e tenha o cuidado que você merece.
```

**Estatísticas:**
```
+[X] Anos de Experiência
+[X] Pacientes Atendidos
[X]% de Satisfação
```

**Botão 1 (Principal):**
- Texto: `Agendar Consulta`
- Link: `#formulario` (âncora) ou link do calendário
- Cor: Primary (azul)

**Botão 2 (Secundário):**
- Texto: `WhatsApp`
- Link: `https://wa.me/55[DDD][NUMERO]?text=Olá! Gostaria de agendar uma consulta.`
- Cor: Verde (#25D366)
- Ícone: WhatsApp

**Configurações do Container:**
- Background: Gradiente de `#F8F9FA` para `#FFFFFF`
- Padding: 80px top, 80px bottom
- Mobile: 40px top, 40px bottom

---

### SEÇÃO 2: BENEFÍCIOS

**Estrutura:**
```
[CONTAINER - Largura máxima 1200px]
  [HEADLINE CENTRALIZADO]
  [ROW - 4 colunas no desktop, 2 no tablet, 1 no mobile]
    [CARD 1] Ícone + Título + Descrição
    [CARD 2] Ícone + Título + Descrição
    [CARD 3] Ícone + Título + Descrição
    [CARD 4] Ícone + Título + Descrição
```

**Headline:**
```
Por que escolher [Nome/Clínica]?
```

**Cards (copiar e personalizar):**

| Ícone | Título | Descrição |
|-------|--------|-----------|
| 🩺 | Atendimento Humanizado | Consultas sem pressa, com atenção total às suas necessidades |
| 📍 | Localização Privilegiada | Fácil acesso, estacionamento e próximo ao metrô |
| 📱 | Agendamento Fácil | Marque sua consulta pelo WhatsApp ou site 24h |
| 💳 | Convênios e Particular | Aceitamos os principais convênios e facilitamos pagamento |

**Configurações:**
- Background: Branco
- Padding: 60px top, 60px bottom
- Cards: Background cinza claro (#F8F9FA), border-radius 12px

---

### SEÇÃO 3: SOBRE O MÉDICO

**Estrutura:**
```
[CONTAINER]
  [ROW - 2 colunas]
    [COLUNA 1 - 40%]
      - Foto do médico
    [COLUNA 2 - 60%]
      - Headline
      - Texto sobre
      - Lista de credenciais
      - CTA
```

**Textos para copiar:**

**Headline:**
```
Conheça [Nome do Médico]
```

**Texto sobre:**
```
Com mais de [X] anos de experiência em [Especialidade], [Nome] é formado(a) pela [Universidade] e possui especialização em [Área].

Atualmente atende no(a) [Hospital/Clínica], oferecendo tratamentos modernos e personalizados para cada paciente.

Membro da [Sociedade Médica], mantém-se constantemente atualizado(a) com as mais recentes práticas e tecnologias da área.
```

**Lista de credenciais:**
```
✓ CRM [NÚMERO]/[UF]
✓ Especialista em [Especialidade] pela [Instituição]
✓ Membro da [Sociedade]
✓ +[X] anos de experiência
```

**Botão CTA:**
- Texto: `Agendar Consulta`
- Link: `#formulario`

**Configurações:**
- Background: Cinza claro (#F8F9FA)
- Padding: 60px
- Imagem: border-radius 16px, sombra suave

---

### SEÇÃO 4: SERVIÇOS

**Estrutura:**
```
[CONTAINER]
  [HEADLINE CENTRALIZADO]
  [ROW - 3 colunas no desktop, 2 no tablet, 1 no mobile]
    [CARD SERVIÇO 1]
    [CARD SERVIÇO 2]
    [CARD SERVIÇO 3]
    [CARD SERVIÇO 4]
    [CARD SERVIÇO 5]
    [CARD SERVIÇO 6]
```

**Headline:**
```
Nossos Serviços
```

**Subheadline:**
```
Conheça os principais tratamentos e procedimentos oferecidos
```

**Modelo de Card:**
```
[ÍCONE]
[TÍTULO DO SERVIÇO]
[Breve descrição em 1-2 linhas]
```

**Exemplos por especialidade:**

**Cardiologia:**
- Consulta Cardiológica
- Eletrocardiograma (ECG)
- Teste Ergométrico
- Holter 24h
- MAPA (Monitorização)
- Check-up Cardíaco

**Dermatologia:**
- Consulta Dermatológica
- Tratamento de Acne
- Botox e Preenchimento
- Peeling Químico
- Laser e Luz Pulsada
- Dermatoscopia Digital

**Ortopedia:**
- Consulta Ortopédica
- Tratamento de Coluna
- Lesões Esportivas
- Infiltração Articular
- Fisioterapia
- Cirurgia Ortopédica

**Configurações:**
- Background: Branco
- Cards: Borda 1px cinza, hover com sombra
- Ícones: Cor primary

---

### SEÇÃO 5: DEPOIMENTOS

**Estrutura:**
```
[CONTAINER - Background colorido]
  [HEADLINE CENTRALIZADO]
  [ROW - 3 colunas ou Slider]
    [DEPOIMENTO 1]
    [DEPOIMENTO 2]
    [DEPOIMENTO 3]
```

**Headline:**
```
O que nossos pacientes dizem
```

**Modelo de Depoimento:**
```
"[Texto do depoimento entre aspas]"

⭐⭐⭐⭐⭐

[Nome do Paciente]
[Cidade ou "Paciente desde 20XX"]
```

**Depoimentos exemplo (personalizar):**

**Depoimento 1:**
```
"Atendimento excepcional! O doutor(a) [Nome] me ouviu com atenção e explicou tudo detalhadamente. Me senti muito bem acolhida."

⭐⭐⭐⭐⭐

Maria Silva
Paciente desde 2023
```

**Depoimento 2:**
```
"Profissional extremamente competente. Resolveu meu problema que outros médicos não conseguiram diagnosticar. Super recomendo!"

⭐⭐⭐⭐⭐

João Santos
São Paulo, SP
```

**Depoimento 3:**
```
"Consultório muito bem localizado, equipe atenciosa e pontualidade no atendimento. Voltarei sempre que precisar."

⭐⭐⭐⭐⭐

Ana Costa
Paciente desde 2022
```

**Configurações:**
- Background: Primary color com opacidade baixa ou gradiente suave
- Cards: Background branco, sombra, border-radius 16px
- Estrelas: Cor amarela (#FFC107)

---

### SEÇÃO 6: FAQ (Perguntas Frequentes)

**Estrutura:**
```
[CONTAINER]
  [ROW - 2 colunas]
    [COLUNA 1]
      - Headline
      - Texto introdutório
      - CTA WhatsApp
    [COLUNA 2]
      - Accordion com perguntas
```

**Headline:**
```
Perguntas Frequentes
```

**Texto introdutório:**
```
Tire suas dúvidas sobre agendamento, convênios e atendimento. Se não encontrar sua resposta, fale conosco pelo WhatsApp.
```

**Perguntas e Respostas:**

**P: Quais convênios são aceitos?**
```
Aceitamos os principais convênios: Unimed, Bradesco Saúde, SulAmérica, Amil, Porto Seguro, NotreDame Intermédica, entre outros. Também atendemos particular com facilidade de pagamento.
```

**P: Como faço para agendar uma consulta?**
```
Você pode agendar pelo WhatsApp clicando no botão desta página, pelo telefone [NÚMERO] ou preenchendo o formulário abaixo. Retornamos em até 2 horas em horário comercial.
```

**P: Qual o tempo de espera para consulta?**
```
Trabalhamos com hora marcada e respeitamos seu tempo. O tempo médio de espera é de no máximo 15 minutos. Consultas de primeira vez têm duração de 45 minutos.
```

**P: Onde fica o consultório?**
```
Estamos localizados na [Endereço completo]. Fácil acesso por [referências], com estacionamento no local/próximo.
```

**P: Preciso de pedido médico para exames?**
```
Sim, para a maioria dos exames é necessário pedido médico. Na consulta, o doutor(a) [Nome] avaliará quais exames são necessários e fornecerá os pedidos.
```

**Configurações do Accordion:**
- Estilo: Clean, com ícone + ou seta
- Hover: Destacar pergunta
- Animação: Suave ao expandir

---

### SEÇÃO 7: FORMULÁRIO DE CONTATO

**Estrutura:**
```
[CONTAINER - ID: formulario]
  [ROW - 2 colunas no desktop]
    [COLUNA 1]
      - Headline
      - Texto
      - Informações de contato
    [COLUNA 2]
      - Formulário GHL
```

**Headline:**
```
Agende sua Consulta
```

**Texto:**
```
Preencha o formulário abaixo e entraremos em contato para confirmar seu agendamento. Ou se preferir, fale diretamente pelo WhatsApp.
```

**Informações de contato:**
```
📍 [Endereço completo]
📞 [Telefone]
📱 [WhatsApp]
✉️ [E-mail]

Horário de Funcionamento:
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h
```

### Configurar Formulário GHL

1. Arraste o elemento **Form** para a coluna
2. Clique no formulário para editar
3. Configure os campos:

| Campo | Tipo | Obrigatório | Placeholder |
|-------|------|-------------|-------------|
| Nome Completo | Text | Sim | Seu nome completo |
| WhatsApp | Phone | Sim | (11) 99999-9999 |
| E-mail | Email | Não | seu@email.com |
| Convênio | Dropdown | Sim | Selecione seu convênio |
| Mensagem | Textarea | Não | Conte-nos como podemos ajudar |

**Opções do campo Convênio:**
```
Particular
Unimed
Bradesco Saúde
SulAmérica
Amil
Porto Seguro
NotreDame Intermédica
Outro
```

**Configurações do Formulário:**
- **Submit Button Text:** `Solicitar Agendamento`
- **Button Color:** Primary (azul)
- **Success Message:** `Obrigado! Recebemos sua solicitação e entraremos em contato em breve.`
- **Redirect URL:** (opcional) página de obrigado

### Conectar ao Pipeline

1. Clique no formulário
2. Vá em **Actions**
3. Adicione ação: **Add to Pipeline**
4. Selecione: `Captação Marketing`
5. Stage: `Novo Lead`

### Adicionar Tags

1. Em **Actions**, adicione: **Add Tag**
2. Tags: `origem:landing-page`, `novo-lead`

### Notificação

1. Em **Actions**, adicione: **Send Internal Notification**
2. Configure para notificar a secretária

---

### SEÇÃO 8: FOOTER

**Estrutura:**
```
[CONTAINER - Background escuro]
  [ROW - 3 ou 4 colunas]
    [Logo + Descrição]
    [Links Rápidos]
    [Contato]
    [Redes Sociais]
  [Linha de Copyright]
```

**Textos:**

**Descrição:**
```
[Nome da Clínica/Médico]
[Especialidade] com atendimento humanizado em [Cidade].
```

**Links Rápidos:**
```
Sobre
Serviços
Convênios
Agendamento
```

**Contato:**
```
[Endereço]
[Telefone]
[E-mail]
```

**Copyright:**
```
© 2026 [Nome da Clínica]. Todos os direitos reservados.
CRM [NÚMERO]/[UF]
```

**Configurações:**
- Background: Escuro (#1A1A2E)
- Texto: Branco/Cinza claro
- Links: Hover com cor primary

---

## PASSO 4: Botão Flutuante WhatsApp

### 4.1 Adicionar Código Customizado

1. Vá em **Settings** da página
2. Em **Custom Code (Body)**, adicione:

```html
<!-- Botão WhatsApp Flutuante -->
<style>
.whatsapp-float {
    position: fixed;
    width: 60px;
    height: 60px;
    bottom: 20px;
    right: 20px;
    background-color: #25D366;
    color: white;
    border-radius: 50%;
    text-align: center;
    font-size: 30px;
    box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: all 0.3s;
}
.whatsapp-float:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.6);
}
.whatsapp-float svg {
    width: 35px;
    height: 35px;
    fill: white;
}
</style>

<a href="https://wa.me/55XXXXXXXXXXX?text=Olá! Gostaria de agendar uma consulta." class="whatsapp-float" target="_blank" rel="noopener">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </svg>
</a>
```

**IMPORTANTE:** Substitua `55XXXXXXXXXXX` pelo número real com DDD.

---

## PASSO 5: Configurações Mobile

### 5.1 Verificar Responsividade

1. No editor, clique no ícone de **celular** (preview mobile)
2. Revise cada seção verificando:
   - Textos legíveis (mínimo 16px)
   - Botões clicáveis (mínimo 44px altura)
   - Imagens redimensionando corretamente
   - Espaçamentos adequados

### 5.2 Ajustes Comuns

| Elemento | Desktop | Mobile |
|----------|---------|--------|
| Headline H1 | 48px | 32px |
| Subtítulo | 20px | 16px |
| Padding seções | 80px | 40px |
| Colunas | 2-4 | 1 |
| Imagem hero | 40% largura | 100% largura, abaixo |

### 5.3 Ocultar no Mobile (se necessário)

Para ocultar elemento no mobile:
1. Selecione o elemento
2. Vá em **Settings > Visibility**
3. Desmarque **Show on Mobile**

---

## PASSO 6: Publicar e Testar

### 6.1 Preview

1. Clique em **Preview** (olho) no editor
2. Teste navegação desktop
3. Teste navegação mobile (redimensione janela ou use DevTools)

### 6.2 Publicar

1. Clique em **Save** para salvar alterações
2. Volte para a lista de Funnels
3. Verifique se o funil está **Published** (toggle verde)

### 6.3 Testar Formulário

1. Acesse a URL pública do funil
2. Preencha o formulário com dados de teste
3. Verifique:
   - [ ] Contato criado no GHL
   - [ ] Adicionado ao pipeline correto
   - [ ] Tags aplicadas
   - [ ] Notificação recebida

### 6.4 Testar WhatsApp

1. Clique no botão flutuante
2. Verifique se abre WhatsApp com mensagem pré-preenchida
3. Teste no mobile também

---

## CHECKLIST FINAL

### Conteúdo
- [ ] Todos os `[CAMPOS]` substituídos por dados reais
- [ ] Nome do médico correto
- [ ] CRM e especialidade corretos
- [ ] Endereço completo
- [ ] Telefone/WhatsApp funcionando
- [ ] Convênios atualizados
- [ ] Serviços corretos para a especialidade

### Design
- [ ] Logo da clínica adicionada
- [ ] Cores consistentes com a marca
- [ ] Imagens em boa qualidade
- [ ] Responsivo no mobile
- [ ] Botão WhatsApp flutuante funcionando

### Formulário
- [ ] Campos configurados corretamente
- [ ] Dropdown de convênios atualizado
- [ ] Conectado ao pipeline "Captação Marketing"
- [ ] Tags sendo aplicadas
- [ ] Notificação configurada
- [ ] Mensagem de sucesso personalizada

### SEO
- [ ] Título da página configurado
- [ ] Meta description preenchida
- [ ] Favicon adicionado

### Testes
- [ ] Formulário testado (criar lead teste)
- [ ] WhatsApp testado (desktop e mobile)
- [ ] Todos os links funcionando
- [ ] Velocidade de carregamento OK

---

## DICAS EXTRAS

### Pixel do Facebook

Para adicionar o Pixel do Facebook (para remarketing):

1. Vá em **Settings > Tracking Code**
2. Cole o código do Pixel no campo **Head Tracking Code**

### Google Analytics

1. Vá em **Settings > Tracking Code**
2. Cole o código do GA4 no campo **Head Tracking Code**

### Domínio Personalizado

Para usar domínio próprio (ex: `agendar.clinicaexemplo.com.br`):

1. Vá em **Settings > Domains**
2. Adicione o domínio
3. Configure DNS conforme instruções do GHL

---

## SUPORTE

Dúvidas sobre a criação do funil? Consulte:
- Documentação GHL: https://help.gohighlevel.com
- Templates de referência: `templates/landing-page-clinica.html`

---

*Versão: 1.0*
*Data: 2026-01-16*
*MedFlow - CRM para Clínicas Médicas*
