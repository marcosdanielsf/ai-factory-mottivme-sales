# TODOS - Vertical Médico (MedFlow)

> Última atualização: 2026-01-16 18:30
> Atualizar este arquivo ANTES de pausar qualquer tarefa

---

## EM ANDAMENTO

- [ ] **Criar workflows no GHL** (documento de instruções criado)
  - [ ] WF02 - Confirmação de Consulta (PRIORIDADE)
  - [ ] WF07 - No-Show Recovery (PRIORIDADE)
  - [ ] WF05 - Aniversário (PRIORIDADE)

- [ ] **Criar funil no GHL** (documento de instruções criado)
  - [ ] Seguir `docs/INSTRUCOES-FUNIL-GHL.md`

---

## PENDENTE (prioridade alta)

- [ ] Criar workflows restantes (após validar os 3 primeiros):
  - [ ] WF01 - Novo Lead
  - [ ] WF03 - Pós-Consulta
  - [ ] WF04 - Lembrete de Retorno
  - [ ] WF06 - Reativação Paciente Inativo
  - [ ] WF08 - Lista de Espera
- [ ] Ajustar snapshot v2.0 baseado na pesquisa
  - [ ] Adicionar campo "Sexo/Gênero" (padrão iClinic)
  - [ ] Adicionar campo "Origem do Lead" com opções

---

## PENDENTE (prioridade média)

- [ ] Criar formulário de captação otimizado
- [ ] Criar sequência de nurturing para lead frio
- [ ] Configurar integração com Meta Ads (CAPI)

---

## PENDENTE (prioridade baixa)

- [ ] Case studies (quando tivermos clientes)

---

## CONCLUÍDO

- [x] Criar proposta de funcionalidades (2026-01-16)
- [x] Criar snapshot GHL v1.0 (2026-01-16)
- [x] Aplicar snapshot na location Dr Thauan (2026-01-16)
- [x] Criar estrutura de pastas do projeto (2026-01-16)
- [x] Criar CLAUDE.md da vertical (2026-01-16)
- [x] Criar sistema de memória estendida (2026-01-16)
- [x] **Pesquisa de mercado completa** (2026-01-16)
  - [x] MEDX - análise completa
  - [x] iClinic - análise completa
  - [x] Doctoralia - análise completa
  - [x] Shosp - análise completa
  - [x] Feegow - análise completa
  - [x] Consolidar em `research/competitors.json`
  - [x] Identificar gaps em `research/gaps.md`
  - [x] Atualizar insights.md
- [x] Criar pipelines manualmente no GHL (2026-01-16)
  - [x] Pipeline "Jornada do Paciente"
  - [x] Pipeline "Captação Marketing"
- [x] Criar calendários manualmente no GHL (2026-01-16)
  - [x] Consulta Primeira Vez (45min)
  - [x] Consulta Retorno (30min)
  - [x] Procedimento (60min)
- [x] **Documento de instruções para workflows** (2026-01-16)
  - [x] Instruções detalhadas para 3 workflows prioritários
  - [x] Checklist de validação
  - [x] Salvo em `docs/INSTRUCOES-WORKFLOWS-GHL.md`
- [x] **Documento de instruções Fase 2** (2026-01-16)
  - [x] Instruções para 5 workflows restantes
  - [x] Checklist completo dos 8 workflows
  - [x] Salvo em `docs/INSTRUCOES-WORKFLOWS-GHL-FASE2.md`
- [x] **Landing page modelo para clínica** (2026-01-16)
  - [x] Template HTML completo e responsivo
  - [x] Guia de personalização
  - [x] Salvo em `templates/landing-page-clinica.html`
- [x] **Comparativo visual MedFlow vs concorrentes** (2026-01-16)
  - [x] Tabela comparativa completa (6 sistemas, 25+ funcionalidades)
  - [x] Cards de preço e WhatsApp
  - [x] Seção de gaps de mercado
  - [x] Seção de pricing
  - [x] Salvo em `templates/comparativo-medflow.html`
- [x] **Calculadora ROI WhatsApp** (2026-01-16)
  - [x] Inputs interativos (consultas, no-show, valor, sistema atual)
  - [x] Cálculo automático de economia
  - [x] Comparativo de custos WhatsApp por sistema
  - [x] CTA dinâmico com valor calculado
  - [x] Salvo em `templates/calculadora-roi-whatsapp.html`
- [x] **Pitch Deck de Vendas MedFlow** (2026-01-16)
  - [x] 10 slides interativos (problema, solução, comparativo, ROI, pricing)
  - [x] Navegação por teclado, touch e botões
  - [x] Barra de progresso
  - [x] Design responsivo
  - [x] Salvo em `templates/pitch-deck-medflow.html`
- [x] **Documentação de Onboarding para Clínicas** (2026-01-16)
  - [x] Manual completo em Markdown (11 seções)
  - [x] Versão HTML interativa com checklist
  - [x] Progresso salvo no navegador (localStorage)
  - [x] FAQ, suporte, glossário
  - [x] Salvo em `docs/ONBOARDING-CLINICAS.md` e `templates/onboarding-clinicas.html`
- [x] **Índice Central de Materiais** (2026-01-16)
  - [x] Portal HTML com todos os materiais organizados
  - [x] Acesso rápido aos principais recursos
  - [x] Estrutura de arquivos visual
  - [x] Design responsivo
  - [x] Salvo em `templates/index.html`
- [x] **Instruções para Funil no GHL** (2026-01-16)
  - [x] Passo a passo completo para criar landing page no GHL
  - [x] Textos prontos para todas as seções
  - [x] Configuração de formulário e pipeline
  - [x] Código do botão WhatsApp flutuante
  - [x] Checklist de validação
  - [x] Salvo em `docs/INSTRUCOES-FUNIL-GHL.md`

---

## BLOQUEIOS

| Item | Bloqueio | Ação necessária |
|------|----------|-----------------|
| Pipelines GHL | API não permite | Criar manualmente |
| Calendários GHL | API não permite | Criar manualmente |
| Workflows GHL | Não tem API | Criar manualmente |

---

## MÉTRICAS DE VALIDAÇÃO

Para considerar a vertical pronta para produção:
- [ ] 1 clínica piloto usando por 30 dias
- [ ] Taxa de no-show medida antes/depois
- [ ] NPS da clínica piloto > 8
- [ ] Documentação completa
