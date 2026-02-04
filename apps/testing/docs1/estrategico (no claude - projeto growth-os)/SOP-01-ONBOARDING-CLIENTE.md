# SOP 01: Onboarding de Novo Cliente

**Versão:** 1.0
**Data:** 14/01/2026
**Caso Base:** Dr. Luiz - Instituto Amar
**Duração Típica:** 7-14 dias

---

## OBJETIVO

Configurar um novo cliente na plataforma Mottivme desde o kickoff inicial até o go-live da IA em produção.

---

## PRÉ-REQUISITOS

Antes de iniciar o onboarding, verificar:

- [ ] Contrato assinado e pagamento do setup recebido
- [ ] Questionário inicial de cliente preenchido (se houver)
- [ ] Acesso ao Google Calendar agendado
- [ ] Equipe interna alocada (SDR/Implementador)

---

## FASE 1: KICKOFF INICIAL (Dia 1)

### 1.1 Preparação da Reunião

**Antes da call:**
```bash
# Criar pasta do cliente
mkdir -p ~/Documents/MOTTIVME-CONTEXTOS/clients/[NOME-CLIENTE]

# Criar documento de contexto
touch ~/Documents/MOTTIVME-CONTEXTOS/[NOME-AGENTE]-[CLIENTE].md
```

**Checklist de materiais:**
- [ ] Link da reunião (Google Meet/Zoom)
- [ ] Questionário de discovery preenchido
- [ ] Script de kickoff preparado
- [ ] Apresentação da Mottivme pronta

### 1.2 Durante o Kickoff (90-120 min)

**Agenda:**
1. **Introduções** (10 min)
   - Apresentar equipe Mottivme
   - Entender contexto do cliente
   - Alinhar expectativas

2. **Discovery Profundo** (40 min)
   - Qual o problema principal que resolvem?
   - Quem é o avatar ideal do cliente deles?
   - Qual a dor principal desse avatar?
   - Quais sonhos e desejos?
   - Ticket médio e valores praticados?
   - Quais canais de captação hoje?
   - O que funciona / o que não funciona?

3. **Mapeamento de Processo** (20 min)
   - Como o atendimento é feito hoje?
   - Quais scripts usam?
   - Quais as regras de negócio?
   - Quais são 3 exemplos de ótimas conversas?
   - Quais são 3 exemplos de péssimas conversas?

4. **Coleta de Materiais** (10 min)
   - Scripts de vendas
   - Vídeos de apresentação
   - PDFs, links, Landing Pages
   - Dados de acesso (Instagram, Facebook, WhatsApp)

5. **Definição da IA** (10 min)
   - Nome da IA
   - Personalidade (tom, voz)
   - Expressões permitidas/proibidas
   - Frases obrigatórias do dono

**SAÍDA ESPERADA:**
- Questionário de discovery completo
- Materiais coletados
- Próximos passos definidos

---

## FASE 2: CONFIGURAÇÃO TÉCNICA (Dias 2-5)

### 2.1 Criar Subconta GHL

```bash
# Acessar GHL Agency
https://app.gohighlevel.com/

# Criar nova location
Settings > Accounts > Locations > Add Location

# Preencher:
- Name: [Nome Cliente]
- Timezone: America/Sao_Paulo
- Currency: BRL
```

### 2.2 Configurar Custom Fields

**Campos obrigatórios:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `lead_score` | Numérica (0-100) | Score de qualificação |
| `genero_detectado` | Texto | Masculino/Feminino/Neutro |
| `dor_principal` | Texto Longo | Dor identificada |
| `ultima_interacao` | Data | Último contato |
| `valor_estimado` | Monetário | Ticket potencial |
| `profissao` | Texto | Para qualificar capacidade |
| `fonte_lead` | Dropdown | Instagram/WhatsApp/Indicação |

### 2.3 Configurar Pipeline de Vendas

**11 Estágios Padrão:**
1. Novo Lead - Inbound
2. Novo Lead - Outbound
3. Em Qualificação
4. Qualificado (MQL)
5. Reuniao Agendada
6. Reuniao Realizada
7. Proposta Enviada
8. Negociacao
9. Fechado Ganho
10. Fechado Perdido
11. Reaquecimento

### 2.4 Criar Registro no Supabase

```sql
-- Inserir agente na tabela agent_versions
INSERT INTO agent_versions (
  location_id,
  agent_name,
  is_active,
  status,
  system_prompt,
  tools_config,
  personality_config,
  business_config,
  hyperpersonalization
) VALUES (
  '[LOCATION_ID_GHL]',
  '[nome-agente]-[nome-cliente]',
  true,
  'active',
  '[PROMPT ESTÁTICO SEM {{ }}]',
  '[JSON COM FERRAMENTAS]',
  '[JSON COM PERSONALIDADE]',
  '[JSON COM DADOS NEGÓCIO]',
  '[JSON COM DDDS]'
);
```

### 2.5 Conectar Canais

**Instagram:**
- Acessar/facebook_business_settings
- Adicionar conta Instagram
- Configurar 2FA
- Conectar ao GHL

**WhatsApp:**
- Gerar QR Code no GHL
- Conectar número do WhatsApp Business
- Configurar webhooks

---

## FASE 3: CRIAÇÃO DA IA (Dias 3-7)

### 3.1 System Prompt (Prompt Estático)

Estrutura mínima obrigatória:

```markdown
## IDENTIDADE
- Nome: [NOME IA]
- Função: [FUNÇÃO - ex: Consultora de Saúde]
- Empresa: [NOME CLIENTE]
- Responsável: [NOME DONO]

## AVATAR IDEAL
- Gênero: [% feminino/% masculino/misto]
- Idade: [faixa etária]
- Profissão: [principais profissões]
- Localização: [região de atendimento]
- Investimento: [ticket médio]

## DORES PRINCIPAIS
1. [Dor 1]
2. [Dor 2]
3. [Dor 3]

## MODOS DE OPERAÇÃO
- first_contact: Primeiro contato
- scheduler: Agendamento
- rescheduler: Reagendamento
- concierge: Pós-agendamento
- followuper: Reativação
- objection_handler: Quebra de objeções

## PERSONALIDADE
- Formalidade: [X/10]
- Estilo: [ex: acolhedora, empática, direta]
- Emojis permitidos: [lista]
- Abreviações: [sim/não]
- Expressões carinhosas: [lista com limite de uso]

## FRASES OBRIGATÓRIAS
Use pelo menos 1 por conversa:
1. "[Frase 1]"
2. "[Frase 2]"
3. "[Frase 3]"

## FLUXO DE ATENDIMENTO
1. Saudação (adaptar ao gênero)
2. Descoberta da dor (OBRIGATÓRIO)
3. Conexão e empatia
4. Apresentação do profissional/serviço
5. Chamar Busca_disponibilidade
6. Oferecer 2 dias diferentes
7. Apresentar valor com desconto
8. Confirmar agendamento
9. Enviar dados de pagamento
10. Orientar próximos passos

## REGRAS CRÍTICAS
OBRIGATÓRIO ✅
1. Descobrir a dor ANTES de oferecer agendamento
2. Chamar Busca_disponibilidade ANTES de mencionar horários
3. Oferecer 2 DIAS diferentes
4. Detectar gênero antes de usar expressões
5. Máximo 1 mensagem por resposta

PROIBIDO ❌
1. Interpretar exames (se médico)
2. Dar diagnóstico ou prescrição
3. Usar expressões femininas para homens
4. Repetir mesma expressão > 2x
5. Enviar múltiplas mensagens seguidas
6. Prometer resultados específicos

## FERRAMENTAS DISPONÍVEIS
- Busca_disponibilidade: Consulta calendário
- Agendar_reuniao: Cria agendamento
- Adicionar_tag_perdido: Desqualifica lead
- Escalar_humano: Transfere para humano
- Atualizar_campo: Atualiza CRM
```

### 3.2 Tools Config (Ferramentas)

Estrutura JSON:
```json
{
  "tools": [
    {
      "name": "Busca_disponibilidade",
      "description": "Consulta calendário do profissional",
      "parameters": {
        "calendar_id": "string obrigatório"
      }
    },
    {
      "name": "Agendar_reuniao",
      "description": "Cria agendamento no calendário",
      "parameters": {
        "nome": "string",
        "telefone": "string (+55...)",
        "email": "string",
        "eventId": "string",
        "data": "dd/MM/yyyy",
        "hora": "HH:mm"
      }
    }
  ],
  "prompts_por_modo": {
    "first_contact": "[prompt específico]",
    "scheduler": "[prompt específico]",
    "objection_handler": "[prompt específico]"
  }
}
```

### 3.3 Personality Config

```json
{
  "formalidade": 7,
  "estilo": "acolhedora, empática, profissional mas próxima",
  "expressoes_por_genero": {
    "feminino": ["minha linda", "querida", "flor", "maravilhosa"],
    "masculino": ["meu querido", "amigo"],
    "neutro": ["olá", "bem-vindo"]
  },
  "regra_uso": "Máximo 2x cada expressão por conversa",
  "emojis_permitidos": ["❤️", "🌸", "✨", "💕", "🙏", "😊"],
  "abreviacoes": ["vc", "tb", "pra", "tá", "né", "q", "pq"]
}
```

### 3.4 Business Config

```json
{
  "nome_empresa": "[NOME]",
  "nome_profissional": "[NOME]",
  "especialidade": "[ESPECIALIDADE]",
  "valores": {
    "consulta_normal": 1271,
    "consulta_desconto": 971,
    "tratamento_minimo": 5000,
    "tratamento_medio": 15000
  },
  "pagamento": {
    "chave_pix": "[CHAVE CNPJ]",
    "nome_pix": "[NOME EMPRESA]",
    "banco": "[BANCO]",
    "desconto_condicao": "Só se pagar na hora"
  }
}
```

### 3.5 Hyperpersonalization (por DDD)

```json
{
  "18": {
    "regiao": "Presidente Prudente",
    "comunidade": "local",
    "distancia": "0km",
    "msg": "Que bom que você é daqui de Prudente!"
  },
  "11": {
    "regiao": "São Paulo Capital",
    "distancia": "~550km",
    "msg": "Temos pacientes de SP! Muitas aproveitam pra conhecer a região."
  }
}
```

---

## FASE 4: WORKFLOW N8N (Dias 4-7)

### 4.1 Criar Workflow de Recebimento

```
Webhook GHL
  ↓
Buscar agente no Supabase
  ↓
Preparar contexto (informações do lead)
  ↓
Executar AI Agent (Claude/GPT)
  ↓
Processar resposta
  ↓
Verificar se tem tool call
  ↓
Executar tool (se necessário)
  ↓
Enviar mensagem WhatsApp
  ↓
Salvar no Supabase
```

### 4.2 Testar Workflow

```bash
# Teste com lead fictício
curl -X POST https://cliente-a1.mentorfy.io/webhook/ghl-mensagem-recebida \
  -H "Content-Type: application/json" \
  -d '{
    "contact": {
      "id": "test123",
      "phone": "+5518999999999",
      "email": "test@email.com",
      "firstName": "Maria",
      "lastName": "Silva"
    },
    "message": "Oi, vi o anúncio sobre menopausa"
  }'
```

---

## FASE 5: GO-LIVE (Dia 7-14)

### 5.1 Checklist Pré-Go-Live

- [ ] Agente criado no Supabase
- [ ] Workflow n8n ativo
- [ ] Subconta GHL configurada
- [ ] Instagram conectado
- [ ] WhatsApp conectado
- [ ] Teste com lead real bem-sucedido
- [ ] Documento de contexto criado
- [ ] Cliente treinado no dashboard

### 5.2 Go-Live

1. **Iniciar com 20 leads teste**
   - Monitorar cada conversa
   - Ajustar prompt em tempo real
   - Documentar aprendizados

2. **Escalonar gradualmente**
   - Dia 1-2: 20 leads
   - Dia 3-4: 50 leads
   - Dia 5+: Volume total

3. **Monitoramento diário**
   - Taxa de resposta
   - Taxa de agendamento
   - Qualidade das conversas
   - Feedback do cliente

### 5.3 Pós-Go-Live (Semana 1)

- Reunião diária de 15min com cliente
- Ajustes finos de personalidade
- Correção de rotas de fuga
- Documentar evolution log

---

## MATERIAIS DE ENTREGA

### Para o Cliente

1. **Acesso ao CRM** (GHL)
   - Link: https://app.gohighlevel.com/
   - Login: credentials enviadas por email

2. **Dashboard de Métricas**
   - Leads gerados
   - Taxa de resposta
   - Taxa de agendamento
   - Conversões

3. **Documento de Contexto da IA**
   - Caminho: `/Documents/MOTTIVME-CONTEXTOS/[AGENTE]-[CLIENTE].md`

### Interno (Mottivme)

1. **Pasta do Cliente**
   ```
   ~/Documents/MOTTIVME-CONTEXTOS/clients/[NOME-CLIENTE]/
   ├── contrato.pdf
   ├── kickoff-notas.md
   ├── scripts-de-vendas.pdf
   ├── conversas-exemplos.pdf
   ├── context-ia.md
   └── evolution-log.md
   ```

2. **Registro no Supabase**
   - agent_versions: configuração da IA
   - agent_metrics: métricas de desempenho
   - call_recordings: gravações (se aplicável)

---

## TROUBLESHOOTING

### Problema: IA não responde

**Verificar:**
1. Webhook está ativo?
2. Location ID correto?
3. API key Supabase válida?
4. Workflow n8n sem erros?

**Ação:**
```bash
# Checar health
curl https://agenticoskevsacademy-production.up.railway.app/health

# Ver logs n8n
# Acessar cliente-a1.mentorfy.io
```

### Problema: IA com personalidade errada

**Verificar:**
1. personality_config no Supabase
2. system_prompt está correto?
3. gender detection funcionando?

**Ação:**
```sql
-- Atualizar personality
UPDATE agent_versions
SET personality_config = '[NOVO JSON]'
WHERE agent_name = '[nome-agente]'
  AND location_id = '[location_id]';
```

### Problema: Baixa taxa de agendamento

**Verificar:**
1. A IA está descobrindo a dor?
2. Está chamando Busca_disponibilidade?
3. Está oferecendo 2 dias diferentes?

**Ação:**
- Analisar logs de conversa
- Ajustar fluxo de atendimento
- Treinar IA com exemplos adicionais

---

## MÉTRICAS DE SUCESSO

### Semana 1
- Taxa de resposta: > 80%
- Taxa de agendamento: > 20%
- Leads qualificados: > 30%

### Mês 1
- Taxa de resposta: > 90%
- Taxa de agendamento: > 30%
- Leads qualificados: > 50%

### Mês 3
- Taxa de resposta: > 95%
- Taxa de agendamento: > 40%
- Conversão: > 20%

---

## PRÓXIMOS PASSOS

Após onboarding completo:

1. **Manutenção Semanal**
   - Reunião de review
   - Ajustes de prompt
   - Novas funcionalidades

2. **Otimização Mensal**
   - Análise de métricas
   - A/B testing de mensagens
   - Expansão de canais

3. **Escalonamento Trimestral**
   - Novos modos de operação
   - Integrações adicionais
   - Multi-agentes

---

*Documento baseado em caso real: Dr. Luiz - Instituto Amar*
*Versão 1.0 - Janeiro 2026*
