# 01 - Organizador Calls

Workflow responsavel por organizar e classificar calls gravadas do Google Drive.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | 01-Organizador-Calls |
| **Nodes** | 13 |
| **Trigger** | Webhook Google Drive |
| **Frequencia** | Evento (nova call) |

## Funcao

1. Recebe notificacao de novo arquivo no Google Drive
2. Baixa a call
3. Transcreve usando Whisper
4. Classifica por tipo (kickoff, follow-up, suporte)
5. Move para pasta correta
6. Dispara workflow 03 se for kickoff

## Fluxo

```
GDrive Webhook --> Download --> Transcricao --> Classificacao --> Move --> Trigger 03
```

## Nodes Principais

- **Webhook** - Recebe evento do GDrive
- **GDrive Download** - Baixa arquivo
- **OpenAI Whisper** - Transcreve
- **Groq Classifier** - Classifica tipo
- **GDrive Move** - Move para pasta

## Configuracao

### Variaveis

```
GDRIVE_FOLDER_INPUT=xxx
GDRIVE_FOLDER_KICKOFF=xxx
GDRIVE_FOLDER_FOLLOWUP=xxx
```

### Criterios de Classificacao

| Tipo | Criterio |
|------|----------|
| Kickoff | Primeira reuniao, apresentacao |
| Follow-up | Retorno, andamento |
| Suporte | Duvida, problema |

## Output

- Call transcrita salva em `transcriptions`
- Metadados em `call_metadata`
- Trigger para workflow 03 se kickoff
