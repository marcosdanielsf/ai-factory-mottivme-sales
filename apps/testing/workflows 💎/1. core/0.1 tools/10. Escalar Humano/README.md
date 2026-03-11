# Escalar humano - Tool Documentation

## Overview

**Tool Name:** Escalar humano  
**Type:** n8n LangChain Tool Workflow  
**Node ID:** `29b66b52-da59-4683-a5bf-c048e79bfc82`  
**Node Type:** `@n8n/n8n-nodes-langchain.toolWorkflow`  
**Type Version:** 2.2  
**Workflow:** 0.1 - Fluxo Principal de Conversasão - GHL - Versionado  

---

## Purpose

This tool is designed to **escalate customer interactions from the AI agent to a human manager/support team member** when:

- The AI agent cannot resolve the customer's issue
- The customer explicitly requests to speak with a human
- The conversation requires human judgment or decision-making
- Quality assurance or compliance review is needed

---

## Business Value

- **Ensures Quality:** Critical customer issues are handled by qualified human staff
- **Improves Customer Satisfaction:** Customers get human support when needed
- **Reduces Escalation Time:** Automated hand-off to the right manager
- **Audit Trail:** All escalations are tracked and logged in GoHighLevel

---

## How It Works

### Trigger Point

The tool is invoked when a decision node in the main workflow determines that human intervention is needed.

### Data Collection

The tool automatically gathers context from two main sources:

```
1. Info Node
   ├─ api_key (GHL API authentication)
   ├─ telefone (Customer phone number)
   ├─ id_conversa_alerta (Conversation/Alert ID)
   └─ location_id (Agency/Location ID)

2. Mensagem recebida Node
   └─ body.location.name (Responsible manager name)
```

---

## Input Parameters

| Parameter | Type | Required | Source | Description |
|-----------|------|----------|--------|-------------|
| `contact_id` | string | No | Info.id_conversa_alerta | Unique identifier for the conversation/alert |
| `api key v2` | string | No | Info.api_key | GHL API v2 key for authentication |
| `telefone` | string | No | Info.telefone | Customer's phone number |
| `message` | string | No | AI Generated | Context message explaining the escalation reason |
| `location.id` | string | No | Info.location_id | ID of the agency/location handling the account |
| `usuario_responsavel` | string | No | Mensagem recebida.body.location.name | Name of the responsible manager |

---

## Target Workflow

**Workflow ID:** `0r0V3ija6EM88T6E`  
**Name:** `05 - Escalar para humano - SOCIALFY`  
**Purpose:** Processes the escalation and notifies the responsible manager  

---

## Dependencies

### Node Dependencies

This tool requires data from:
- **Info Node** - Provides customer and account context
- **Mensagem recebida Node** - Provides location/manager information

### External Dependencies

- **GoHighLevel API v2** - For reading/writing customer data
- **05 - Escalar para humano - SOCIALFY Workflow** - For processing the escalation

---

## Example Scenario

### Complex Pricing Request

```
Customer: "I need a custom pricing plan for 50+ locations"

AI Agent Analysis:
├─ Issue Type: Complex Business Negotiation
├─ Resolution: Requires human decision-making
└─ Action: Escalate

Tool Data:
{
  "contact_id": "6547890abcdef",
  "api_key": "ghl_key_prod_xxxxx",
  "telefone": "+55 11 98765-4321",
  "message": "Customer requesting custom enterprise plan for 50+ locations. Estimated deal value: $50k+.",
  "location.id": "location_mottivme_001",
  "usuario_responsavel": "João Silva - Account Manager"
}
```

---

## Configuration

### File Location
```
/Users/marcosdaniels/Projects/mottivme/ai-factory-mottivme-sales/
└── 1. ai-factory-agents/workflows/1. core/
    └── 0.1 tools/
        └── 10. Escalar Humano/
            ├── tool-config.json (Raw node extraction)
            └── README.md (This file)
```

---

## Integration Points

### Upstream (What triggers this tool)
- Decision nodes in main conversation flow
- Customer escalation requests
- AI agent confidence thresholds

### Downstream (What this tool triggers)
- `05 - Escalar para humano - SOCIALFY` workflow
- Manager notification system
- CRM escalation tracking

---

## Data Flow

```
┌─────────────────────────────────────┐
│  Customer Escalation Requested      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Extract from Info + Mensagem       │
│  - Contact ID                       │
│  - Phone & Location                 │
│  - Manager name                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Generate AI Context Message        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Invoke External Workflow           │
│  (05 - Escalar para humano)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Manager Notified + Assigned        │
│  Customer Transferred               │
└─────────────────────────────────────┘
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-26 | Initial extraction and documentation |

---

**Last Updated:** 2026-01-26  
**Owner:** AI Factory Team - Mottivme Sales
