# SDR1 Agent - Sales Development Representative

## Quick Overview

SDR1 is the primary automated Sales Development Representative agent in MOTTIVME workflow.

### Core Details
- **Agent ID**: 5656766a-0825-4b7b-8ba4-9ef600a5df0a
- **Model**: OpenAI GPT-5
- **Framework**: n8n LangChain
- **CRM**: GoHighLevel (GHL)

### Key Capabilities
1. Conversation Management - Natural language with leads
2. Lead Qualification - BANT-based analysis
3. Availability Checking - Calendar slot verification
4. Appointment Scheduling - Calendar booking
5. Payment Handling - Invoice/charge creation
6. Escalation - Handoff to human agents

## Configuration

### Execution Parameters
- Max Iterations: 8 reasoning loops
- Retry on Fail: Enabled (4s delay)
- Return Intermediate Steps: true
- Fallback Mode: Enabled

### Agent Tools (11 Total)

#### 1. Adicionar_tag_perdido
- Mark lead as lost/unqualified
- Type: HTTP Request
- Use when: Lead disqualified

#### 2. Busca_disponibilidade  
- Check calendar availability
- Type: Workflow Tool
- Use when: Before scheduling appointment

#### 3. Agendar_reuniao
- Schedule appointment
- Type: Workflow Tool
- Syncs with: GHL + KOMMO

#### 4. Atualizar Profissao
- Update lead profession
- Type: Workflow Tool
- Field: contact.profissao

#### 5. Atualizar Estado
- Update US state residence
- Type: Workflow Tool
- Field: estado_onde_mora

#### 6. Escalar humano
- Escalate to manager
- Type: Workflow Tool
- Use when: Complex issues

#### 7. Refletir
- Internal reasoning/thinking
- Type: LangChain Think Tool
- No external calls

#### 8. Atualizar agendamento
- Update appointment details
- Type: Workflow Tool
- Cannot change: date/time

#### 9. Enviar arquivo
- Send Google Drive files
- Type: Workflow Tool
- Integrates: Google Drive + GHL

#### 10. Criar ou buscar cobranca
- Create/search invoices
- Type: Workflow Tool
- Requirement: Schedule appointment first

#### 11. Enviar comprovante de pagamento
- Email payment receipt
- Type: Workflow Tool
- Recipient: Manager email

## Integration with GHL

### API Details
- Endpoint: https://services.leadconnectorhq.com
- Version: 2021-04-15
- Authentication: Bearer token (from context)

### Context Variables Used
- user_prompt: Lead message from GHL
- system_prompt: Agent instructions
- mensagens_antigas: Conversation history
- api_key: GHL API key
- lead_id: Contact ID
- location_id: Business location
- usuario_responsavel: Escalation manager

## Error Handling

### Retry Mechanism
- Automatic retries enabled
- Delay: 4 seconds
- Max retries: Based on maxIterations (8)

### Graceful Degradation
- Fallback mode for missing prompts
- Intermediate steps captured for debugging
- Error propagation to workflow

## Performance

- Max conversation loops: 8
- Tool latency: 2-5s per API call
- Retry overhead: 4s per failure
- Context window: Unlimited

## Related Files

- **Workflow File**: 0.1 - Fluxo Principal de Conversacao - GHL - Versionado.json
- **Location**: /Users/marcosdaniels/Projects/mottivme/ai-factory-mottivme-sales/1. ai-factory-agents/workflows/1. core/
- **Total Workflow Nodes**: 180

## Files in This Directory

- agent-config.json: Full agent configuration from workflow
- tools-list.json: Complete tools specification
- summary.json: Quick reference summary
- README.md: This documentation

---

Last Updated: 2026-01-26
Version: 1.0

