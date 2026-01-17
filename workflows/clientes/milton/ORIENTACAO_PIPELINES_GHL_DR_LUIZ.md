{
  "name": "GHL - Mottivme - EUA",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "742766a1-1f96-4420-877b-ac3035ef5e3c",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        -1040,
        400
      ],
      "id": "9d0fbdc9-c765-4cf8-90dc-e42f5e52992a",
      "name": "Mensagem recebida",
      "webhookId": "742766a1-1f96-4420-877b-ac3035ef5e3c"
    },
    {
      "parameters": {
        "content": "# Enviando resposta\nVamos verificar se nossa resposta deve ser enviada ou não caso o usuario tenha enviado alguma mensagem durante o pensamento da IA, significa que precisamos considerar a ultima mensagem antes de responder, e o processo seguinte ira receber nossa mensagem que iriamos mandar.",
        "height": 668,
        "width": 2236,
        "color": 7
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        6832,
        32
      ],
      "id": "84ef2723-e6b9-471a-adcd-2776b66add49",
      "name": "Sticky Note4"
    },
    {
      "parameters": {
        "content": "## 1. Assistencia",
        "height": 80,
        "width": 540,
        "color": 5
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        -368,
        80
      ],
      "id": "1fcdf1c6-9fcb-4785-9c0a-a0df6bc9e113",
      "name": "Sticky Note30"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO execution_metrics (\n  execution_id,\n  workflow_id,\n  workflow_name,\n  workflow_version,\n  n8n_version,\n  environment,\n  status,\n  started_at,\n  owner_id\n) VALUES (\n  $1, $2, $3, $4, $5, $6, $7, NOW(), $8\n)\nRETURNING *;",
        "options": {
          "queryReplacement": "={{ $json.dados }}"
        }
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        2400,
        -16
      ],
      "id": "5e211984-e7e9-4207-85dc-bdb79c09d82e",
      "name": "Postgres",
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "4a6c297c-ff22-4d5d-9f91-35eaa64b0d9a",
              "name": "=dados",
              "value": "={{ $execution.id }},{{ $workflow.id }},{{ $workflow.name }},1,1.99,{{ $execution.mode }},running,cmcprclas0000syak01gtgj80",
              "type": "string"
            },
            {
              "id": "f3b2358a-0eec-409b-9d61-a27ea7fbe59d",
              "name": "session",
              "value": "=etapa,{{ $('Info').first().json.etapa_funil || 'NULL' }},{{ $execution.id }},{{ $('Info').first().json.lead_id}},{{ !$('Info').first().json.n8n_ativo === false }},{{ $('Info').first().json.mensagem_id || 'NULL' }},{{ $('Info').first().json.api_key || 'NULL' }},{{ $json.contact.locationId || NULL }},{{ $('Info').first().json.source || 'whatsapp' }}",
              "type": "string"
            },
            {
              "id": "a6e046b5-48b9-4789-a337-cfbbe0a901b3",
              "name": "location.id",
              "value": "={{ $json.contact.locationId }}",
              "type": "string"
            }
          ]
        },
        "options": {
          "ignoreConversionErrors": false,
          "dotNotation": false
        }
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        1776,
        -16
      ],
      "id": "27b02001-885c-4000-8761-b71cf5211396",
      "name": "GetInfo",
      "alwaysOutputData": true,
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "content": "## Rastreio de consumo",
        "height": 240,
        "width": 416
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        944,
        -80
      ],
      "id": "cd7d054b-28da-49c6-b860-bf9a7f46c430",
      "name": "Sticky Note7"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "304623c3-1fc3-495e-867b-8710765f00fd",
              "leftValue": "={{ $json.output.length }}",
              "rightValue": 2,
              "operator": {
                "type": "number",
                "operation": "gt"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.filter",
      "typeVersion": 2.2,
      "position": [
        7488,
        320
      ],
      "id": "bbfcd953-0ed5-4ab5-a648-d7fdc236d6c9",
      "name": "Filter"
    },
    {
      "parameters": {
        "content": "## Última mensagem e Fluxo",
        "height": 240,
        "width": 416
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        1408,
        -64
      ],
      "id": "2afdd330-64df-42b9-8e2e-cd6a49b1c63f",
      "name": "Sticky Note28"
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "92f3d821-7bee-4bad-8725-37e8be4c4d53",
      "name": "Loop Over Items3",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [
        9872,
        320
      ]
    },
    {
      "parameters": {},
      "id": "692c5d4f-454a-40cf-91e1-e461e9439102",
      "name": "no.op",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [
        10768,
        384
      ]
    },
    {
      "parameters": {
        "content": "## Verifica se o cliente mandou mensagem\nVerificamos se enquanto a IA está pensando, se o cliente mandou mensagem. Se sim, temos que salvar nossa mensagem para pensar novamente.",
        "height": 544,
        "width": 1200,
        "color": 6
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        5616,
        32
      ],
      "id": "1b2d28af-f6cc-423c-af60-a263399a8607",
      "name": "Sticky Note3"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://services.leadconnectorhq.com/conversations/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-04-15"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"type\": \"IG\",\n  \"contactId\": \"{{ $('Info').first().json.lead_id }}\",\n  \"message\": \"{{ $json.output }}\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        10320,
        416
      ],
      "id": "14ea4d82-2ec1-48b9-bd6e-13c79edd4185",
      "name": "Instagram",
      "retryOnFail": true
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://services.leadconnectorhq.com/conversations/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-04-15"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"type\": \"SMS\",\n  \"contactId\": \"{{ $('Info').first().json.lead_id }}\",\n  \"message\": \"{{ $json.output }}\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        10320,
        224
      ],
      "id": "1b40c3ac-9eb4-4147-aaca-667884fe9afb",
      "name": "Whatsapp",
      "retryOnFail": true
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "whatsapp ",
                    "rightValue": "={{ $('Info').first().json.source }} ",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "f5034094-22ae-449d-a556-1fc1bc216e49"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Whatsapp"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "21897a45-e463-4f12-aa85-a06b148d7ecb",
                    "leftValue": "instagram",
                    "rightValue": "={{ $('Info').first().json.source }}",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Instagram"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        10096,
        320
      ],
      "id": "49729a51-bf11-4a98-80f4-dd07b13afddd",
      "name": "Canal"
    },
    {
      "parameters": {
        "amount": 1.5
      },
      "id": "c489fdba-5ff3-432a-82bd-329da009ca43",
      "name": "1.5s",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        10544,
        320
      ],
      "webhookId": "797b3aee-c794-439d-9ef4-1d53cc744fcf"
    },
    {
      "parameters": {
        "dataToSave": {
          "values": [
            {
              "key": "a_lead_response",
              "value": "={{ $('Parser Chain').item.json.output.messages.join(\"\") }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.executionData",
      "typeVersion": 1.1,
      "position": [
        10320,
        32
      ],
      "id": "0c8c2285-0241-48b8-b690-fdf5082c025c",
      "name": "Execution Data1"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "22078f8d-4e31-4138-955b-5aebf5e9c54c",
                    "leftValue": "={{ $json.location_id }}",
                    "rightValue": "mHuN6v75KQc3lwmBd6mV",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Milton"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.location_id }}",
                    "rightValue": "=mHuN6v75KQc3lwmBd6mV",
                    "operator": {
                      "type": "string",
                      "operation": "notEquals"
                    },
                    "id": "5acaf89e-0978-4e4e-9707-010666a790b2"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Padrão"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "0f4d74c1-270a-4ec7-825b-12524c47998e",
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "agente_versionado",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "agente_versionado"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        5216,
        368
      ],
      "id": "c2b0f8e6-f701-465e-8b09-bde4ff2e1c96",
      "name": "Tipo de IA"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "c2f0dc1a-df0b-4b25-b860-e0fe6b204092",
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "followuper",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "followuper"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "11fcf8b1-3421-4eda-b9ba-bfd77777548d",
                    "leftValue": "={{ $('Info').first().json.first_name }}",
                    "rightValue": "Marcos Daniels",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Marcos Daniel"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "sdrcarreira",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "1d24e4cd-fb46-464d-a0e8-cd441c83711a"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "SDR Carreira"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "c6a257bf-f976-4bb7-862e-f8e2ec42f906",
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "sdrconsultoria",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "SDR Consultoria"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "d8efacc2-b932-41f4-bad3-b3e72e1fd686",
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "rescheduler",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "rescheduler"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "3f90ae36-2e0e-4a41-977a-d9b49c650549",
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "engagementkeeper",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "engagementkeeper"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "8d095acc-f300-4678-bfae-3a59e0353d8f",
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "customersuccess",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "customersuccess"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "862c7391-2ac8-411c-af18-fd1d0da3d596",
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "modular",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "modular"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.3,
      "position": [
        5600,
        800
      ],
      "id": "00a9761e-ee50-470d-afb4-6e9da78bc6c5",
      "name": "Switch"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "c1347694-76f6-44df-888e-74ee5d651820",
              "name": "prompt",
              "value": "=## OBJETIVO\n\nReativar leads frios que demonstraram interesse em **carreira de agente financeiro**. O lead já recebeu a mensagem de abertura por automação e respondeu. Seu papel é dar continuidade, validar work permit e agendar reunião de carreira.\n\n- **Com Work Permit** → Agendar reunião de CARREIRA\n- **Sem Work Permit** → Redirecionar para CONSULTORIA\n\n---\n\n## ⚠️ REGRA CRÍTICA - NOME DO LEAD\n\n**Se precisar usar o nome do lead:**\n- Extraia do histórico da conversa (como o lead se apresentou)\n- Se não souber o nome, NÃO invente - use frases sem nome\n- NUNCA confie cegamente em dados do sistema que podem estar incorretos\n\n---\n\n## ⚠️ REGRA DE ENCERRAMENTO PÓS-AGENDAMENTO\n\n**APÓS CONFIRMAR AGENDAMENTO:**\n1. Envie a confirmação: \"Valeu! Registrei: [dia], às [hora] (NY).\"\n2. Se lead responder \"ok\", \"obrigado\", \"valeu\", \"👍\" → Feche com UMA mensagem calorosa e PARE\n3. Se lead responder NOVAMENTE após fechamento → Envie APENAS emoji: 🙏🏻 ou 😌\n\n**PROIBIDO continuar conversa após lead agradecer o agendamento confirmado.**\n**NÃO faça novas perguntas após o fechamento.**\n\n---\n\n## PRINCÍPIOS FUNDAMENTAIS (Full Sales)\n\n- **\"Venda\" a reunião, não o produto** - Foque em agendar, não em explicar demais\n- **Resposta inicial imediata** - Não deixe o lead esfriar\n- **Persista e acredite em todas as vendas** - O ouro está no follow-up\n- **Use escassez real** - \"Agenda cheia\", \"poucos horários\"\n- **Fechamento OU/OU** - Sempre ofereça 2 opções de horário\n- **Nunca pareça desesperado** - Gere valor ao ponto da pessoa querer participar\n\n---\n\n## ⚠️ REGRAS CRÍTICAS\n\n### 1. NUNCA REPETIR PERGUNTAS\nVerifique o histórico antes de perguntar. Se o lead já informou → NÃO pergunte novamente.\n\n### 2. COMPLIANCE - TERMOS PROIBIDOS\n| ❌ NUNCA USE | ✅ USE SEMPRE |\n|--------------|---------------|\n| investimento, investir | planejamento, planejar |\n| consultor financeiro | agente financeiro licenciado |\n| estrategista financeiro | proteção financeira |\n\n---\n\n## MENSAGEM DE ABERTURA (JÁ ENVIADA POR AUTOMAÇÃO)\n\n> \"Olá [nome], tudo bem? Aqui é a Isa, faço parte da equipe do [usuario responsavel]. Vi que você se interessou pela carreira como Agente Financeiro aqui com a gente. Tô entrando em contato pra saber se ainda continua interessado(a) ou se seu momento mudou?\"\n\n⚠️ **NÃO reenvie. O lead já recebeu e está respondendo.**\n\n---\n\n## MATRIZ DE FOLLOW-UP (Níveis)\n\n| Nível | Situação | Ação |\n|-------|----------|------|\n| **FUP 1** | Não respondeu ou parou no início | Mensagem curta: \"👀\" ou \"Oi [nome]?\" |\n| **FUP 2** | Engajou mas parou no meio | Retomar com valor + horários |\n| **FUP 3** | Chegou no final mas não fechou | \"Fala e fecha\" - Saudação + Horários |\n| **FUP 4** | No-show em reunião | Reagendamento |\n\n---\n\n## FLUXO CONFORME RESPOSTA DO LEAD\n\n### Cenário 1: \"Ainda tenho interesse\" / \"Sim\" / \"Quero saber mais\"\n\n**Tréplica + Qualificação Work Permit:**\n> \"Que bacana, [nome]! Fico feliz que ainda tenha esse interesse. Deixa te perguntar... você já tem permissão de trabalho (work permit) aí nos EUA?\"\n\n**→ Se SIM:** [FLUXO CARREIRA]  \n**→ Se NÃO:** [FLUXO CONSULTORIA]\n\n---\n\n### Cenário 2: \"Meu momento mudou\" / \"Não tenho mais interesse\"\n\n**Tréplica empática + Ponte:**\n> \"Entendi, [nome]! E como estão as coisas por aí? Tá conseguindo se organizar financeiramente ou ainda tá naquela correria?\"\n\n**Se demonstrar dificuldade:**\n> \"Olha, mesmo sem seguir a carreira agora, a gente oferece uma consultoria gratuita pra te ajudar a proteger o que você já conquistou. É um bate-papo rápido com o [usuario responsavel] ou alguém da equipe. Faz sentido pra você?\"\n\n→ [FLUXO CONSULTORIA]\n\n---\n\n### Cenário 3: Resposta genérica (\"tudo bem\", \"oi\", \"quem é?\")\n\n**Tréplica + Reforço:**\n> \"Que bom que respondeu! Então, você tinha demonstrado interesse na carreira de agente financeiro com a gente. Queria saber se ainda faz sentido pra você ou se seu momento mudou?\"\n\n→ Aguardar e seguir cenário apropriado\n\n---\n\n### Cenário 4: Pergunta sobre a carreira (\"como funciona?\", \"quanto ganha?\")\n\n**Pitch curto + Qualificação:**\n> \"Boa pergunta! A carreira é pra brasileiros legalizados aqui nos EUA, com licença estadual, ajudando famílias com proteção financeira. Tem liberdade de horário, renda escalável e a gente dá todo suporte. O [usuario responsavel] explica os detalhes na reunião. Você tem work permit?\"\n\n→ Validar work permit e seguir fluxo\n\n---\n\n## FLUXO CARREIRA (COM WORK PERMIT)\n\n### Qualificação mínima:\n- **Estado onde mora** (se não tiver no CRM)\n- **Work Permit confirmado**\n\n### NÃO pergunte:\n- Profissão, família, tempo nos EUA, data de nascimento\n- **[usuario responsavel] qualifica na reunião**\n\n### Pitch + Pré-fechamento:\n> \"Perfeito, [nome]! Pelo seu perfil, faz total sentido uma conversa com o [usuario responsavel] ou um especialista da equipe. É uma sessão online pelo Zoom onde você vai entender como funciona a carreira, o processo de licenciamento e tirar todas as dúvidas. Sem compromisso.\"\n>\n> \"Em razão do grande número de interessados, estamos trabalhando com agenda. Posso ver os horários que ainda tenho disponíveis?\"\n\n### Fechamento OU/OU:\n> \"[nome], tenho aqui ainda [dia] às [hora] e [dia] às [hora]. Qual desses fica melhor pra você?\"\n\n### Tréplica de compromisso:\n> \"Perfeito! Só reforçando que é uma oportunidade única e algumas pessoas acabam não dando valor. Por ter custo zero, não se programam e esquecem. Caso tenha algum imprevisto, me avisa com antecedência pra eu tentar reagendar, combinado?\"\n\n---\n\n## FLUXO CONSULTORIA (SEM WORK PERMIT)\n\n### Redirecionamento:\n> \"Entendi, [nome]. Sem o work permit, a carreira como agente ainda não é possível. Mas o melhor caminho agora é um planejamento pra proteger sua renda aqui nos EUA, mesmo sem status definido.\"\n>\n> \"Quero te presentear com uma consultoria online gratuita. É pra entender seu momento e te mostrar opções de proteção financeira. Faz sentido pra você?\"\n\n### Se perguntarem preço:\n> \"Os planos começam em:\n> - **$50/mês** - proteção de crianças e jovens\n> - **$200/mês** - futuro dos adultos\n> - **$100/mês** - planos pro futuro das crianças (College)\n>\n> Você estaria disposto(a) a começar nessa faixa?\"\n\n### Dados mínimos (se não tiver):\n1. Estado onde mora\n2. Profissão/trabalho atual\n3. Tempo nos EUA\n4. Data de nascimento\n\n### Fechamento:\n> \"Ótimo! Vou checar a agenda. Você prefere [dia] às [hora] ou [dia] às [hora]?\"\n\n---\n\n## AGENDAMENTO\n\n### Coletar dados (se não tiver):\n> \"Perfeito! Me passa teu email e o WhatsApp é esse aqui mesmo?  pra confirmar. (se não for dos EUA, inclui o código do país)\"\n\n### Validação (só se API der erro):\n- **EUA:** \"Número +1XXXXXXXXXX, certo?\"\n- **Brasil:** \"Número +55XXXXXXXXX, certo?\"\n\n### Confirmação:\n> \"Maravilhaaa {{ $('Info').first().json.first_name }}! Agendei aqui no sistema. Vou enviar confirmação por e-mail e WhatsApp, ok?\"\n\n### Finalização:\n> \"Valeu, {{ $('Info').first().json.first_name }}! Registrei aqui: [dia_reuniao], às [horario_reuniao] (NY). Qualquer coisa me chama!\"\n\n---\n\n## OBJEÇÕES COMUNS\n\n### \"Não tenho tempo agora\"\n> \"Entendo! A conversa é rápida, uns 20-30 minutos. Tenho horário [dia] às [hora] ou [dia] às [hora]. Algum desses encaixa?\"\n\n### \"Me manda mais informações por aqui\"\n> \"Claro! Mas assim, pra eu te passar informações que realmente façam sentido pro seu momento, o ideal é uma conversa rápida. O [usuario responsavel] consegue personalizar de acordo com seu perfil. Posso ver um horário?\"\n\n### \"Vou pensar\"\n> \"Tranquilo! Fica à vontade. Só te aviso que os horários estão bem disputados essa semana. Se quiser, já deixo reservado e qualquer coisa você me avisa. Pode ser?\"\n\n### \"Quanto custa pra começar na carreira?\"\n> \"Boa pergunta! O [usuario responsavel] passa os detalhes na reunião porque depende do estado onde você mora e do seu perfil. Posso agendar pra você tirar essa dúvida direto com ele?\"",
              "type": "string"
            },
            {
              "id": "7c1cec03-5b93-4741-a15c-01ccaade24de",
              "name": "origem",
              "value": "Prompt F3 - FUP",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        5824,
        512
      ],
      "id": "752300de-49aa-43eb-8139-a2983492660f",
      "name": "Prompt F3 - followuper1"
    },
    {
      "parameters": {
        "modelName": "models/gemini-2.5-pro",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [
        6048,
        560
      ],
      "id": "608eee20-1134-4e61-b2fd-aaf29cd64ae6",
      "name": "Gemini2",
      "notesInFlow": false,
      "credentials": {
        "googlePalmApi": {
          "id": "4ut0CD80SN7lbITM",
          "name": "Google Gemini(PaLM) Api account"
        }
      }
    },
    {
      "parameters": {
        "model": {
          "__rl": true,
          "value": "gpt-5",
          "mode": "list",
          "cachedResultName": "gpt-5"
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [
        6176,
        560
      ],
      "id": "c5430ec6-20b7-4eda-af27-1da220c8756a",
      "name": "OpenAI Chat Model2",
      "credentials": {
        "openAiApi": {
          "id": "WEENPovt22LUaeRp",
          "name": "OpenAi - Marcos"
        }
      }
    },
    {
      "parameters": {
        "description": "Uma ferramenta de raciocínio interno para agentes de IA no n8n.\nUse-a para estruturar pensamentos, lógica e instruções ocultas que ajudam o modelo a chegar em uma resposta final.\nO conteúdo definido aqui não é mostrado ao usuário final — serve apenas como contexto privado para guiar a geração de saída."
      },
      "type": "@n8n/n8n-nodes-langchain.toolThink",
      "typeVersion": 1,
      "position": [
        6432,
        560
      ],
      "id": "ba46d61b-823a-49cc-95da-886134dd14e2",
      "name": "Think1"
    },
    {
      "parameters": {
        "description": "Buscar/consultar por horários disponíveis antes de agendar. Exemplo: startDate=1735689600000 endDate=1736294400000. calendario pode ser consultoria financeira ou carreira. E dateEndTo e dateStartFrom é a data de inicio e fim, geralmente entre hoje e 7 dias. Garanta que vai buscar slots disponíveis à partir do ano 2025",
        "workflowId": {
          "__rl": true,
          "value": "pZIcRI1PGMzbQHZZ",
          "mode": "list",
          "cachedResultUrl": "/workflow/pZIcRI1PGMzbQHZZ",
          "cachedResultName": "[ GHL ] Busca Disponibilidade"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "calendar": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('calendar', `Buscar horários disponíveis. IMPORTANTE: O parâmetro 'calendar' deve ser o ID do calendário (ex: LvZWMISiyYnF8p7TrY7q), NÃO o nome. Consulte o CONTEXTO para obter calendarID_carreira ou calendarID_consultoria conforme work permit do lead.`, 'string') }}",
            "API_KEY": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('API_KEY', ``, 'string') }}",
            "startDate": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('startDate', `exemplo: 1735689600000`, 'string') }}",
            "endDate": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('endDate', `exemplo: 1736294400000`, 'string') }}",
            "lead_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('lead_id', `exemplo: 23533559\n`, 'string') }}",
            "usuario_responsavel": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('usuario_responsavel', ``, 'string') }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "calendar",
              "displayName": "calendar",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "API_KEY",
              "displayName": "API_KEY",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "startDate",
              "displayName": "startDate",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "endDate",
              "displayName": "endDate",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "lead_id",
              "displayName": "lead_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "usuario_responsavel",
              "displayName": "usuario_responsavel",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        6560,
        560
      ],
      "id": "27440a79-76b8-4462-bb33-e440fa50964e",
      "name": "Busca_disponibilidade"
    },
    {
      "parameters": {
        "description": "Agendar um nova reunião. startTime segue o seguinte padrão 2021-06-23T03:30:00+05:30.",
        "workflowId": {
          "__rl": true,
          "value": "u1UsmjNNpaEiwIsp",
          "mode": "list",
          "cachedResultUrl": "/workflow/u1UsmjNNpaEiwIsp",
          "cachedResultName": "Agendar pelo GHL - ATUALIZAR KOMMO"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "API_KEY": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('API_KEY', ``, 'string') }}",
            "email": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('email', ``, 'string') }}",
            "telefone": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('telefone', ``, 'string') }}",
            "location_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('location_id', ``, 'string') }}",
            "calendar_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('calendar_id', `Buscar horários disponíveis. IMPORTANTE: O parâmetro 'calendar' deve ser o ID do calendário (ex: LvZWMISiyYnF8p7TrY7q), NÃO o nome. Consulte o CONTEXTO para obter calendarID_carreira ou calendarID_consultoria conforme work permit do lead.`, 'string') }}",
            "startTime": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('startTime', ``, 'string') }}",
            "firstName": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('firstName', ``, 'string') }}",
            "lastName": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('lastName', ``, 'string') }}",
            "lead_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('lead_id', ``, 'string') }}",
            "Carreira_Consultoria": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('Carreira_Consultoria', `Especificar o tipo do agendamento`, 'string') }}",
            "usuario_responsavel": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('usuario_responsavel', ``, 'string') }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "API_KEY",
              "displayName": "API_KEY",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "email",
              "displayName": "email",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "telefone",
              "displayName": "telefone",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "location_id",
              "displayName": "location_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "calendar_id",
              "displayName": "calendar_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "startTime",
              "displayName": "startTime",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "firstName",
              "displayName": "firstName",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "lastName",
              "displayName": "lastName",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "lead_id",
              "displayName": "lead_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "estadoValue",
              "displayName": "estadoValue",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": true
            },
            {
              "id": "workPermitValue",
              "displayName": "workPermitValue",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": true
            },
            {
              "id": "Carreira_Consultoria",
              "displayName": "Carreira_Consultoria",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "usuario_responsavel",
              "displayName": "usuario_responsavel",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        6688,
        560
      ],
      "id": "e44376ce-50d7-4bd9-836b-eed8921130ec",
      "name": "Agendar_reuniao"
    },
    {
      "parameters": {
        "description": "Atualizar o estado onde o lead mora (estado_onde_mora). Use esta tool quando o lead informar em qual estado dos EUA ele reside. Valores aceitos: nomes dos estados americanos (ex: Florida, California, Texas, New York, etc). Campo ID customizado no GHL.",
        "workflowId": {
          "__rl": true,
          "value": "3Dd8d5AnpD4iLPwG",
          "mode": "list",
          "cachedResultUrl": "/workflow/3Dd8d5AnpD4iLPwG",
          "cachedResultName": "Atualizar Work Permit GHL (Otimizado)"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "location_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('location_id', ``, 'string') }}",
            "API_KEY": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('API_KEY', ``, 'string') }}",
            "contact_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('contact_id', ``, 'string') }}",
            "workPermitValue": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('workPermitValue', ``, 'string') }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "API_KEY",
              "displayName": "API_KEY",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "location_id",
              "displayName": "location_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "contact_id",
              "displayName": "contact_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "workPermitValue",
              "displayName": "workPermitValue",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        6816,
        560
      ],
      "id": "b5b877fe-eea3-461b-8bf9-6907f2539afe",
      "name": "Atualizar Work Permit"
    },
    {
      "parameters": {
        "description": "Atualizar a profissão/ocupação do lead (contact.profissao). Use esta tool quando o lead informar qual é sua profissão ou área de atuação atual. Valores: texto livre com a profissão (ex: Engenheiro, Médico, Empresário, Corretor de Imóveis, etc). Campo ID customizado no GHL.",
        "workflowId": {
          "__rl": true,
          "value": "Kq3b79P6v4rTsiaH",
          "mode": "list",
          "cachedResultUrl": "/workflow/Kq3b79P6v4rTsiaH",
          "cachedResultName": "Atualizar Campo Profissão GHL (Auto-Config)"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "API_KEY": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('API_KEY', ``, 'string') }}",
            "location_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('location_id', ``, 'string') }}",
            "contact_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('contact_id', ``, 'string') }}",
            "profissaoValue": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('profissaoValue', ``, 'string') }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "API_KEY",
              "displayName": "API_KEY",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "location_id",
              "displayName": "location_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "contact_id",
              "displayName": "contact_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "profissaoValue",
              "displayName": "profissaoValue",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        6944,
        560
      ],
      "id": "a8f6f9f2-0ef0-4af3-b5ba-36022df6527a",
      "name": "Atualizar Profissão"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "66bb063b-646e-4774-9415-e21a35c7e99b",
              "leftValue": "={{ $json.output }}",
              "rightValue": "<ctrl",
              "operator": {
                "type": "string",
                "operation": "notContains"
              }
            },
            {
              "id": "50ac2eba-f7b0-4477-98e6-f19887142f51",
              "leftValue": "{{ $json.output }}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "notEmpty",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        7248,
        400
      ],
      "id": "a7e27cd3-fe35-4d87-a0cc-960b226751ec",
      "name": "Tudo certo?3"
    },
    {
      "parameters": {
        "description": "Atualizar o estado onde o lead mora (estado_onde_mora). Use esta tool quando o lead informar em qual estado dos EUA ele reside. Valores aceitos: nomes dos estados americanos (ex: Florida, California, Texas, New York, etc). Campo ID customizado no GHL.",
        "workflowId": {
          "__rl": true,
          "value": "wsQQYmx8CLNBHoWq",
          "mode": "list",
          "cachedResultUrl": "/workflow/wsQQYmx8CLNBHoWq",
          "cachedResultName": "Atualizar Estado GHL (Otimizado)"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "API_KEY": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('API_KEY', ``, 'string') }}",
            "estadoValue": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('estadoValue', ``, 'string') }}",
            "contact_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('contact_id', ``, 'string') }}",
            "location_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('location_id', ``, 'string') }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "API_KEY",
              "displayName": "API_KEY",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "location_id",
              "displayName": "location_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "contact_id",
              "displayName": "contact_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "estadoValue",
              "displayName": "estadoValue",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        7072,
        560
      ],
      "id": "e537196e-d75c-40a5-adce-62e9f6cf57f7",
      "name": "Atualizar Estado"
    },
    {
      "parameters": {
        "jsCode": "// 1. Pega todas as mensagens disponíveis na fila\nconst todasMensagens = $('Buscar mensagens').all();\n\n// 2. CRÍTICO: Check de Fila Vazia (Race Condition)\n// Se a fila estiver vazia, significa que o workflow \"vencedor\" já acordou, \n// processou e limpou a fila enquanto este workflow estava esperando.\nif (!todasMensagens || todasMensagens.length === 0) {\n  return []; // Para o workflow imediatamente. Este workflow perdeu.\n}\n\n// 3. Ordenar as mensagens por timestamp (do mais recente para o mais antigo)\n// Adicionamos um desempate pelo ID da tabela caso dois timestamps sejam idênticos.\nconst filaOrdenada = todasMensagens.sort((a, b) => {\n  const tA = new Date(a.json.timestamp).getTime();\n  const tB = new Date(b.json.timestamp).getTime();\n  \n  // Se timestamps forem diferentes, ordena por tempo\n  if (tA !== tB) {\n    return tA - tB;\n  }\n  \n  // Se timestamps forem iguais (raro, mas possível), desempata pelo ID\n  return (a.json.id || 0) - (b.json.id || 0);\n});\n\n// 4. Identificar a mensagem \"Vencedora\" (a última da fila)\nconst mensagemVencedora = filaOrdenada[filaOrdenada.length - 1];\nconst idVencedor = mensagemVencedora.json.id_mensagem;\n\n// 5. Pegar o ID da mensagem que este workflow atual está processando\nconst idWorkflowAtual = $('Info').first().json.mensagem_id;\n\n// 6. Comparar: Eu sou o dono da última mensagem?\nif (idVencedor !== idWorkflowAtual) {\n  // NÃO sou o vencedor. A última mensagem pertence a outro workflow.\n  // Retorno array vazio para parar este fluxo imediatamente.\n  return []; \n}\n\n// 7. SIM, sou o vencedor!\n// Retorno TODA a fila ordenada para que a IA processe as mensagens agrupadas.\nreturn filaOrdenada;"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        2464,
        432
      ],
      "id": "2fd9497b-d435-4859-8085-9ca08f74dd8a",
      "name": "Mensagem encavalada?"
    },
    {
      "parameters": {
        "operation": "select",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_fila_mensagens",
          "mode": "list"
        },
        "returnAll": true,
        "where": {
          "values": [
            {
              "column": "lead_id",
              "value": "={{ $json.lead_id }}"
            }
          ]
        },
        "sort": {
          "values": [
            {
              "column": "timestamp"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        2016,
        432
      ],
      "id": "08911ab3-3746-4962-ad5a-6dc2d9482055",
      "name": "Buscar mensagens",
      "retryOnFail": true,
      "alwaysOutputData": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      }
    },
    {
      "parameters": {
        "operation": "deleteTable",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_fila_mensagens",
          "mode": "list"
        },
        "deleteCommand": "delete",
        "where": {
          "values": [
            {
              "column": "lead_id",
              "value": "={{ $('Info').item.json.lead_id }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        2688,
        432
      ],
      "id": "f8d6c788-ee01-406a-b8ac-8fa5918c04e2",
      "name": "Limpar fila de mensagens",
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      }
    },
    {
      "parameters": {
        "content": "# Processando mensagens encavaladas\n\nEssa etapa trata a situação em que o usuário envia múltiplas mensagens seguidas. O ponto negativo é o aumento no tempo de resposta do agente. Lógica dispensa uso de soluções mais complexas, como RabbitMQ.\n\nTempo de espera recomendado de ~16s. Quando estiver testando, recomendamos reduzir um pouco para ficar mais rápido de testar.\n",
        "height": 540,
        "width": 1216,
        "color": 4
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        768,
        224
      ],
      "id": "552aff3e-c1cd-4034-9aa3-ce4b4ff9dda3",
      "name": "Sticky Note2"
    },
    {
      "parameters": {
        "amount": 18
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        1792,
        432
      ],
      "id": "fe78cf85-80f8-4e73-b6cb-0f734000f692",
      "name": "Esperar",
      "webhookId": "8dc4b864-2419-4a99-912a-b207889259d0"
    },
    {
      "parameters": {
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_fila_mensagens",
          "mode": "list",
          "cachedResultName": "n8n_fila_mensagens"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "mensagem": "={{ $json.mensagem }}",
            "id_mensagem": "={{ $json.mensagem_id }}",
            "timestamp": "={{ $json.datetime }}",
            "lead_id": "={{ $json.lead_id }}"
          },
          "matchingColumns": [
            "id"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "id_mensagem",
              "displayName": "id_mensagem",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "telefone",
              "displayName": "telefone",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "mensagem",
              "displayName": "mensagem",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "timestamp",
              "displayName": "timestamp",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true
            },
            {
              "id": "instagram",
              "displayName": "instagram",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "lead_id",
              "displayName": "lead_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1568,
        432
      ],
      "id": "7fe31a6f-81c3-41d9-90dc-b11a6700ea1c",
      "name": "Enfileirar mensagem.",
      "retryOnFail": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      }
    },
    {
      "parameters": {
        "url": "={{ $json.photo_audio }}",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "chatwootApi",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1568,
        624
      ],
      "id": "50e58ada-17c5-444d-bb5a-031c75b58d22",
      "name": "Download áudio",
      "retryOnFail": true,
      "credentials": {
        "chatwootApi": {
          "id": "UmVE5jAScA8a8vNB",
          "name": "ChatWoot account"
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "resource": "audio",
        "operation": "transcribe",
        "options": {
          "language": "pt"
        }
      },
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "typeVersion": 1.8,
      "position": [
        2464,
        624
      ],
      "id": "15c6ca44-f7aa-4ae5-b675-e3215498e156",
      "name": "Transcrever audio",
      "credentials": {
        "openAiApi": {
          "id": "WEENPovt22LUaeRp",
          "name": "OpenAi - Marcos"
        }
      }
    },
    {
      "parameters": {
        "operation": "binaryToPropery",
        "options": {}
      },
      "type": "n8n-nodes-base.extractFromFile",
      "typeVersion": 1,
      "position": [
        1792,
        624
      ],
      "id": "71865eca-bb21-445d-af46-10cbe092c19f",
      "name": "Extract from File"
    },
    {
      "parameters": {
        "operation": "toBinary",
        "sourceProperty": "data",
        "options": {
          "fileName": "={{ $json.fileName }}",
          "mimeType": "={{ $json.mimeType }}"
        }
      },
      "type": "n8n-nodes-base.convertToFile",
      "typeVersion": 1.1,
      "position": [
        2240,
        624
      ],
      "id": "29c1f075-fa8e-4558-9467-25af8aeab578",
      "name": "Convert to File"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "c3bb05a3-1c9e-4993-a20f-7d92b005cc09",
              "name": "last_db_message",
              "value": "={{ $input.last().json }}",
              "type": "string"
            },
            {
              "id": "80a47b08-9d11-4fa6-b5c0-c892bd503182",
              "name": "current_message",
              "value": "={{ $('Info').first().json.mensagem_id }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        2240,
        432
      ],
      "id": "de8e48f8-ec8a-4b68-ae3a-e0d6dcc06276",
      "name": "Form Mensagem"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "loose",
            "version": 2
          },
          "conditions": [
            {
              "id": "8ca54eae-15d1-49d3-af33-7a6e5d17b833",
              "leftValue": "={{ $('Info').item.json.n8n_ativo }}",
              "rightValue": "disparo realizado",
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            },
            {
              "id": "8d1933c9-21dc-4aeb-bce7-6b20411d2801",
              "leftValue": "={{ $('Tipo de mensagem').item.json.mensagem.toLowerCase() }}",
              "rightValue": "okkk",
              "operator": {
                "type": "string",
                "operation": "notEquals"
              }
            }
          ],
          "combinator": "and"
        },
        "looseTypeValidation": true,
        "options": {}
      },
      "type": "n8n-nodes-base.filter",
      "typeVersion": 2.2,
      "position": [
        3712,
        384
      ],
      "id": "9a3eadf7-268c-40e1-a8e9-c0c5c0563682",
      "name": "Permitido AI?"
    },
    {
      "parameters": {
        "operation": "select",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_active_conversation",
          "mode": "list",
          "cachedResultName": "n8n_active_conversation"
        },
        "limit": 1,
        "where": {
          "values": [
            {
              "column": "lead_id",
              "value": "={{ $('Info').item.json.lead_id }}"
            },
            {
              "column": "workflow_id",
              "value": "={{ $('Info').item.json.workflow_id }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        3184,
        432
      ],
      "id": "6caccaa4-742d-4f2b-b949-cc7ade8191f4",
      "name": "Conversa Ativa",
      "retryOnFail": true,
      "alwaysOutputData": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.isEmpty() || $json.status === 'inactive' || (new Date() - new Date($json.created_at)) > 1 * 60 * 1000  }}",
                    "rightValue": "",
                    "operator": {
                      "type": "boolean",
                      "operation": "true",
                      "singleValue": true
                    },
                    "id": "be5f5420-f7d0-46e7-acb7-663377e7ff88"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Iniciar Conversa"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "064c4e28-0fba-45da-8ad8-15c9678b7842",
                    "leftValue": "={{ $json.retries > 10 ||  $json.waiting_process_id && $json.status === 'active' && $json.waiting_process_id !== $('Info').item.json.process_id }}",
                    "rightValue": "",
                    "operator": {
                      "type": "boolean",
                      "operation": "true",
                      "singleValue": true
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Ignorar"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "ccd478c2-5d5c-4e0d-a6ad-3727d8fb420e",
                    "leftValue": "={{ $json.status === 'active' }}",
                    "rightValue": "",
                    "operator": {
                      "type": "boolean",
                      "operation": "true",
                      "singleValue": true
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Aguardar"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        3408,
        400
      ],
      "id": "89dea703-ecde-4be1-a795-47eeff3e0c11",
      "name": "Ação Planejada"
    },
    {
      "parameters": {
        "amount": 15
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1.1,
      "position": [
        3920,
        560
      ],
      "id": "b4c39404-bd9b-40d3-9b6b-02b19dffe0b9",
      "name": "Wait",
      "webhookId": "25bf655d-bb8b-41ae-b2f4-38c313bb86ab"
    },
    {
      "parameters": {
        "operation": "upsert",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_active_conversation",
          "mode": "list",
          "cachedResultName": "n8n_active_conversation"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "waiting_process_id": "={{ $('Info').item.json.process_id }}",
            "id": "={{ $('Conversa Ativa').item.json.id }}",
            "workflow_id": "={{ $json.workflow_id }}",
            "retries": "={{ $('Conversa Ativa').item.json.retries + 1 }}"
          },
          "matchingColumns": [
            "id"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "lead_id",
              "displayName": "lead_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": true
            },
            {
              "id": "lead_name",
              "displayName": "lead_name",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": true
            },
            {
              "id": "status",
              "displayName": "status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": true
            },
            {
              "id": "owner_id",
              "displayName": "owner_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": true
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": false,
              "removed": true
            },
            {
              "id": "output_preview",
              "displayName": "output_preview",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": true
            },
            {
              "id": "waiting_process_id",
              "displayName": "waiting_process_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": false
            },
            {
              "id": "workflow_id",
              "displayName": "workflow_id",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": false
            },
            {
              "id": "retries",
              "displayName": "retries",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": false,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        3712,
        560
      ],
      "id": "ee72b5c3-acb5-40ef-88ad-581dbdc6e7f3",
      "name": "Salvar Espera",
      "retryOnFail": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      }
    },
    {
      "parameters": {
        "dataToSave": {
          "values": [
            {
              "key": "a_lead_id",
              "value": "={{ $('Info').item.json.lead_id }}"
            },
            {
              "key": "a_lead_name",
              "value": "={{ $('Info').item.json.full_name }}"
            },
            {
              "key": "location_name",
              "value": "={{ $('Info').first().json.location_name }}"
            },
            {
              "key": "telefone",
              "value": "={{ $('Info').item.json.telefone }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.executionData",
      "typeVersion": 1.1,
      "position": [
        3872,
        384
      ],
      "id": "127f9a90-b6f0-4e4b-8bad-d587f040fb95",
      "name": "Execution Data"
    },
    {
      "parameters": {
        "resource": "image",
        "modelId": {
          "__rl": true,
          "value": "claude-sonnet-4-5-20250929",
          "mode": "list",
          "cachedResultName": "claude-sonnet-4-5-20250929"
        },
        "text": "O que há nessa imagem?",
        "imageUrls": "={{ $json.photo_audio }}",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.anthropic",
      "typeVersion": 1,
      "position": [
        2464,
        816
      ],
      "id": "589530cd-8824-4374-bebe-60c941f35a4e",
      "name": "Analyze image",
      "credentials": {
        "anthropicApi": {
          "id": "nNkFTZpNoiBCbO1I",
          "name": "Anthropic account"
        }
      }
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "fd3e8b9e-eed6-4f43-94c8-089af8417065",
              "name": "imagem",
              "value": "={{ $json.content[0].text ? \"[Imagem Recebida]: \"+ $json.content[0].text : \"\"}}",
              "type": "string"
            },
            {
              "id": "a3bc628f-18b3-4e08-b620-65c5a3a57b40",
              "name": "audio:",
              "value": "={{ $json.text ? \"[Audio Recebido]: \"+ $json.text : \"\"}}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        2688,
        720
      ],
      "id": "381982e9-3080-4be1-ab10-7496d618c3f1",
      "name": "Imagem ou audio"
    },
    {
      "parameters": {
        "content": "# Processando áudio",
        "height": 276,
        "width": 880,
        "color": 6
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        944,
        784
      ],
      "id": "818df88c-3aec-498e-9af7-e5dd8e66a693",
      "name": "Sticky Note8"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $('Set mensagens').first().json.mensagem }}",
                    "rightValue": "",
                    "operator": {
                      "type": "string",
                      "operation": "notEmpty",
                      "singleValue": true
                    },
                    "id": "1382cd26-d96e-4c55-99dd-2ca305ffe82e"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Texto"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        7792,
        320
      ],
      "id": "1fba49bc-d9ca-4350-a40c-95956cd997ca",
      "name": "Tipo de mensagem1"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [
        8912,
        752
      ],
      "id": "e73c2f55-9dda-4655-8184-a0724ee21078",
      "name": "Google Gemini Chat Model2",
      "credentials": {
        "googlePalmApi": {
          "id": "4ut0CD80SN7lbITM",
          "name": "Google Gemini(PaLM) Api account"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "97df1142-b72f-499f-9053-d3b2f6500f9c",
              "leftValue": "={{ $json.waiting_process_id && $json.waiting_process_id !== $('Info').first().json.process_id }}",
              "rightValue": "",
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.filter",
      "typeVersion": 2.2,
      "position": [
        8608,
        224
      ],
      "id": "044e8168-9d34-4672-bafd-11ac7d3885fe",
      "name": "Deve enviar mensagem?"
    },
    {
      "parameters": {
        "operation": "select",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_active_conversation",
          "mode": "list",
          "cachedResultName": "n8n_active_conversation"
        },
        "limit": 1,
        "where": {
          "values": [
            {
              "column": "lead_id",
              "value": "={{ $('Info').first().json.lead_id }}"
            },
            {
              "column": "workflow_id",
              "value": "={{ $('Info').first().json.workflow_id }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        7936,
        320
      ],
      "id": "3e7a1e6e-f39d-4a1d-a548-3f881ca63394",
      "name": "Conversa ativa atualizada",
      "retryOnFail": true,
      "alwaysOutputData": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "9d2eedc1-7e26-437e-a11b-bc18f563d470",
              "leftValue": "={{ $json.waiting_process_id }}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "notEmpty",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        8160,
        320
      ],
      "id": "d4ce52e6-36a4-4f49-96f5-6673d2028fd9",
      "name": "If"
    },
    {
      "parameters": {
        "operation": "deleteTable",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_active_conversation",
          "mode": "list",
          "cachedResultName": "n8n_active_conversation"
        },
        "deleteCommand": "delete",
        "where": {
          "values": [
            {
              "column": "id",
              "value": "={{ $json.id }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        8608,
        416
      ],
      "id": "e4225a8d-69bc-4188-82ca-1d5451db8ed5",
      "name": "Termino de resposta",
      "retryOnFail": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      }
    },
    {
      "parameters": {
        "operation": "upsert",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_active_conversation",
          "mode": "list",
          "cachedResultName": "n8n_active_conversation"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "lead_id": "={{ $('Info').first().json.lead_id }}",
            "lead_name": "={{ $('Info').first().json.full_name }}",
            "status": "inactive",
            "id": "={{ $('Conversa Ativa').first().json.id || $('Info').first().json.process_id }}",
            "owner_id": "={{ $('Info').first().json.owner_id }}",
            "workflow_id": "={{ $('Info').first().json.workflow_id }}",
            "output_preview": "={{ $('Tipo de mensagem1').item.json.output }}"
          },
          "matchingColumns": [
            "id"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "lead_id",
              "displayName": "lead_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false
            },
            {
              "id": "lead_name",
              "displayName": "lead_name",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false
            },
            {
              "id": "status",
              "displayName": "status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false
            },
            {
              "id": "owner_id",
              "displayName": "owner_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": false,
              "removed": true
            },
            {
              "id": "output_preview",
              "displayName": "output_preview",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": false
            },
            {
              "id": "waiting_process_id",
              "displayName": "waiting_process_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "workflow_id",
              "displayName": "workflow_id",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {
          "replaceEmptyStrings": true
        }
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        8384,
        224
      ],
      "id": "78d5a613-591c-429e-8ddb-58d723173f32",
      "name": "Atualizar resposta IA",
      "retryOnFail": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      }
    },
    {
      "parameters": {
        "fieldToSplitOut": "output.messages",
        "options": {
          "destinationFieldName": "output"
        }
      },
      "id": "e35f9440-b3dd-4e68-baf7-2c45f56d2d01",
      "name": "Segmentos1",
      "type": "n8n-nodes-base.splitOut",
      "typeVersion": 1,
      "position": [
        9648,
        320
      ],
      "alwaysOutputData": true
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "ff19cb21-f08f-4c45-9e0c-bf15cc3a8c63",
              "leftValue": "={{ $json.output.messages.join().toLowerCase()?.includes(\"json\") }}",
              "rightValue": "json",
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            },
            {
              "id": "6495fa85-2af7-493f-bf75-e3d46220f622",
              "leftValue": "={{ $json.output.messages.join().toLowerCase()?.includes(\"{\") }}",
              "rightValue": "{{",
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            },
            {
              "id": "9862c89d-b15e-4ca9-819b-1d78ce50969e",
              "leftValue": "={{ $json.output.messages.join().toLowerCase()?.includes(\"output\") }}",
              "rightValue": "output",
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            },
            {
              "id": "221b46a6-b8e2-4876-91e5-1e63c832c3ec",
              "leftValue": "={{ $json.output.messages.join().toLowerCase()?.includes(\"parsed\") }}",
              "rightValue": "parsed",
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            },
            {
              "id": "dbfb7464-ce46-4d5d-9b0b-716ef05a823d",
              "leftValue": "={{ $json.output.messages.join().toLowerCase()?.includes(\"split\") }}",
              "rightValue": "split",
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            },
            {
              "id": "45b8f555-eada-41a5-abc8-a115b34d9e4d",
              "leftValue": "={{ $json.output.messages.join().toLowerCase()?.includes(\"properties\") }}",
              "rightValue": "",
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            },
            {
              "id": "7a3e9dac-e029-44cd-8c7c-ed187ec77bd7",
              "leftValue": "={{ $json.output.messages.join().toLowerCase()?.includes(\"type\") }}",
              "rightValue": "",
              "operator": {
                "type": "boolean",
                "operation": "false",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        9200,
        320
      ],
      "id": "b153f1e0-24ea-413c-b28e-b3b3740b1bd6",
      "name": "If1"
    },
    {
      "parameters": {
        "schemaType": "manual",
        "inputSchema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"messages\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  },\n  \"required\": [\"messages\"]\n}",
        "autoFix": true
      },
      "type": "@n8n/n8n-nodes-langchain.outputParserStructured",
      "typeVersion": 1.3,
      "position": [
        8912,
        544
      ],
      "id": "c5a2f379-586b-459a-9cbd-4c75ef3a5e1f",
      "name": "Structured Output Parser"
    },
    {
      "parameters": {
        "dataToSave": {
          "values": [
            {
              "key": "agente_ia",
              "value": "={{ $('Info').first().json.agente_ia }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.executionData",
      "typeVersion": 1.1,
      "position": [
        9424,
        320
      ],
      "id": "80fa7d09-8a0c-4dd3-ba4d-863316d6cd4b",
      "name": "Execution Data2"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "7eab8669-6929-4dc6-b3e2-943065bc306c",
              "name": "mensagem",
              "value": "={{ \n  ['arquivo de imagem', 'arquivo de áudio', 'mensagem de áudio', ''].includes(($json.mensagem || '').toLowerCase().trim()) \n    ? ($('Imagem ou audio').first().json['audio:'] || $('Imagem ou audio').first().json.imagem || $('Info').first().json.mensagem || '')\n    : ($json.mensagem || $('Info').first().json.mensagem || '')\n}}",
              "type": "string"
            },
            {
              "id": "09b2dd8b-c24b-49e8-bc36-918ae46a4f6b",
              "name": "output_preview",
              "value": "={{ $json.output_preview }}",
              "type": "string"
            },
            {
              "id": "562253ae-7585-480e-ba6e-4774dbfd05ae",
              "name": "mensagens_antigas",
              "value": "={{ \n  $('Mensagem anteriores').all()\n    .map(item => {\n      const prefix = item.json.message.type === \"human\" ? \"Lead/Humano\" : \"Assistente/IA\";\n      const content = item.json.message.type === \"human\" && item.json.message.content.includes(\"Responda\")\n        ? \"[ Lead não respondeu ainda... ]\"\n        : item.json.message.content;\n      return `[${item.json.created_at}] ${prefix}: ${content}`;\n    })\n    .join(\"\\n\\n\") \n}}\n",
              "type": "string"
            },
            {
              "id": "d134ff5d-a48c-44d8-9350-572093043f53",
              "name": "=location_id",
              "value": "={{ $('Info').first().json.location_id }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        5040,
        384
      ],
      "id": "d0730a17-8c90-4a71-97cc-e000c11c732a",
      "name": "Set mensagens",
      "executeOnce": true
    },
    {
      "parameters": {
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_historico_mensagens",
          "mode": "list",
          "cachedResultName": "n8n_historico_mensagens"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "message": "={\n  \"type\": \"ai\",\n  \"content\": \"{{ $('Parser Chain').first().json.output.messages.join(\"\") }}\",\n  \"tool_calls\": [],\n  \"additional_kwargs\": {},\n  \"response_metadata\": {},\n  \"invalid_tool_calls\": []\n}",
            "session_id": "={{ $('Memoria Lead').first().json.session_id }}",
            "location_id": "={{ $('Info').first().json.location_id }}"
          },
          "matchingColumns": [
            "session_id",
            "created_at"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "session_id",
              "displayName": "session_id",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "message",
              "displayName": "message",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true
            },
            {
              "id": "message_hash",
              "displayName": "message_hash",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "location_id",
              "displayName": "location_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        10048,
        32
      ],
      "id": "4c2926af-db3d-410d-9923-d7a16e686eef",
      "name": "Memoria IA",
      "retryOnFail": true,
      "executeOnce": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_historico_mensagens",
          "mode": "list",
          "cachedResultName": "n8n_historico_mensagens"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "message": "={{ $json.message }}",
            "session_id": "={{ $json.session_id }}",
            "location_id": "={{ $('Info').first().json.location_id }}"
          },
          "matchingColumns": [
            "id"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "session_id",
              "displayName": "session_id",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "message",
              "displayName": "message",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": true
            },
            {
              "id": "message_hash",
              "displayName": "message_hash",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": true,
              "removed": true
            },
            {
              "id": "location_id",
              "displayName": "location_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        4624,
        384
      ],
      "id": "bc82b37e-61e1-453c-a986-634199b59727",
      "name": "Memoria Lead",
      "retryOnFail": true,
      "executeOnce": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "jsCode": "// Pega o item de entrada\nconst inputItems = $input.all();\n\n// Processa cada item\nconst outputItems = inputItems.map((inputItem, index) => {\n  // Pega os dados do nó Info\n  const infoData = $('Info').first().json;\n  \n  // ===== CRÍTICO: Com returnAll, Postgres retorna múltiplos items =====\n  // Precisamos pegar TODOS os items, não só o último\n  const allMessages = $('Mensagem anteriores').all();\n  \n  console.log(`Total de items do Postgres: ${allMessages.length}`);\n  \n  // Transforma todos os items em um array de mensagens\n  const msgArray = allMessages\n    .map(item => item.json)\n    .filter(item => {\n      return item && item.created_at && item.message && item.message.content;\n    });\n  \n  console.log(`Total de mensagens válidas: ${msgArray.length}`);\n  \n  // Adiciona a mensagem ATUAL do lead ao histórico\n  const mensagemAtual = infoData.mensagem;\n  if (mensagemAtual && mensagemAtual.trim()) {\n    msgArray.push({\n      created_at: new Date().toISOString(),\n      message: {\n        type: \"human\",\n        content: mensagemAtual\n      }\n    });\n  }\n  \n  console.log(`Total com mensagem atual: ${msgArray.length}`);\n  \n  // Deduplica por timestamp + conteúdo\n  const seen = new Map();\n  const unique = msgArray.filter(item => {\n    // Cria chave única baseada em timestamp e conteúdo\n    const timestamp = new Date(item.created_at).getTime();\n    const content = item.message?.content || '';\n    const key = `${timestamp}_${content.substring(0, 100)}`;\n    \n    // Se já viu essa chave, ignora\n    if (seen.has(key)) {\n      console.log(`Duplicata encontrada: ${content.substring(0, 50)}...`);\n      return false;\n    }\n    \n    seen.set(key, true);\n    return true;\n  });\n  \n  console.log(`Mensagens após deduplicação: ${unique.length}`);\n  \n  // Formata as mensagens em ordem cronológica\n  const mensagens_antigas = unique\n    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))\n    .map(item => {\n      const prefix = item.message.type === \"human\" ? \"Lead/Humano\" : \"Assistente/IA\";\n      const content = item.message.type === \"human\" && item.message.content.includes(\"Responda\")\n        ? \"[ Lead não respondeu ainda... ]\"\n        : item.message.content;\n      return `[${item.created_at}] ${prefix}: ${content}`;\n    })\n    .join(\"\\n\\n\");\n  \n  console.log(`Histórico formatado com ${mensagens_antigas.split('\\n\\n').length} mensagens`);\n  \n  // Retorna mantendo o pairedItem\n  return {\n    json: {\n      mensagens_antigas: mensagens_antigas,\n      mensagens_count: unique.length,\n      ...inputItem.json,\n      ...infoData\n    },\n    pairedItem: inputItem.pairedItem\n  };\n});\n\nreturn outputItems;"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        4864,
        384
      ],
      "id": "e126f603-2e24-4c4b-83da-2c3ea7830548",
      "name": "Deduplica Mensagens"
    },
    {
      "parameters": {
        "operation": "select",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_historico_mensagens",
          "mode": "list",
          "cachedResultName": "n8n_historico_mensagens"
        },
        "returnAll": true,
        "where": {
          "values": [
            {
              "column": "session_id",
              "value": "={{ $json.lead_id }}"
            }
          ]
        },
        "sort": {
          "values": [
            {
              "column": "created_at"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        4240,
        384
      ],
      "id": "d11d0a46-bd2d-41cc-ab94-7b9a4e659c77",
      "name": "Mensagem anteriores",
      "retryOnFail": true,
      "alwaysOutputData": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "sseEndpoint": "https://cliente-a1.mentorfy.io/mcp/busca_historias/sse",
        "options": {
          "timeout": 60000
        }
      },
      "type": "@n8n/n8n-nodes-langchain.mcpClientTool",
      "typeVersion": 1,
      "position": [
        7200,
        560
      ],
      "id": "13baabb2-7cf2-4fc7-8717-9fdb64423c89",
      "name": "Busca historias",
      "retryOnFail": true,
      "waitBetweenTries": 3000
    },
    {
      "parameters": {
        "url": "=https://services.leadconnectorhq.com/contacts/{{ $json.lead_id }}",
        "options": {},
        "headerParametersUi": {
          "parameter": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            }
          ]
        }
      },
      "name": "Search Contact",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 2,
      "position": [
        1552,
        -16
      ],
      "id": "f895bd78-1cd2-4761-a1cf-a4854387a604",
      "executeOnce": false,
      "retryOnFail": true,
      "waitBetweenTries": 3000,
      "notes": "Busca contato por EMAIL"
    },
    {
      "parameters": {
        "content": "## Importante\n\nEssa tool cria campo no Socialfy, basta solicitar ao Claude o campo que quer criar e copiar o campo a baixo e colar no claude para dar como referencia",
        "height": 320,
        "width": 320,
        "color": 6
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        -368,
        -272
      ],
      "id": "a0e6d054-2189-47bd-8719-eb7dfbb63f35",
      "name": "Sticky Note"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "  INSERT INTO public.crm_historico_mensagens\n  (lead_id, mensagem, datetime, source, full_name, location_id, api_key, tipo)\n  VALUES\n  ('{{ $json.lead_id }}', '{{ $json.mensagem }}', '{{ $json.datetime }}', '{{ $json.source }}', '{{ $json.full_name }}', '{{ $json.location.id }}', '{{ $json.api_key }}', 'human')\n  ON CONFLICT (lead_id, mensagem, datetime)\n  DO NOTHING\n  RETURNING *;",
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1792,
        -400
      ],
      "id": "d2acb803-00c3-43fb-96d3-fe77a795ca76",
      "name": "historico_mensagens_leads",
      "alwaysOutputData": true,
      "retryOnFail": false,
      "executeOnce": false,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "bb6433a3-a8c8-41fc-ba24-c5508055f5e7",
              "name": "lead_id",
              "value": "={{ $('Info').first().json.lead_id }}",
              "type": "string"
            },
            {
              "id": "e3c59cf4-b8fb-47bd-9201-0cde177d3f2c",
              "name": "mensagem",
              "value": "={{ $('Info').first().json.mensagem }}",
              "type": "string"
            },
            {
              "id": "551981a4-e58d-4ee7-b27f-1d1bba8fde43",
              "name": "datetime",
              "value": "={{ $('Info').first().json.datetime }}",
              "type": "string"
            },
            {
              "id": "74b98426-15c4-4a10-9978-f310ad162656",
              "name": "source",
              "value": "={{ $('Info').first().json.source }}",
              "type": "string"
            },
            {
              "id": "30c0f0ec-8f71-4d0d-8e88-dfad7fa31d63",
              "name": "full_name",
              "value": "={{ $('Info').item.json.full_name }}",
              "type": "string"
            },
            {
              "id": "96903a49-e8ca-4f89-ac29-404fa61b5a7e",
              "name": "api_key",
              "value": "={{ $json.api_key }}",
              "type": "string"
            },
            {
              "id": "9621f071-1ddc-4b66-8fd1-1152035f623d",
              "name": "location.id",
              "value": "={{ $json.location_id }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        1568,
        -400
      ],
      "id": "899a71b5-3541-49b1-a128-31b1cf8038b0",
      "name": "Edit Fields1"
    },
    {
      "parameters": {
        "operation": "upsert",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_active_conversation",
          "mode": "list",
          "cachedResultName": "n8n_active_conversation"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "lead_id": "={{ $('Info').item.json.lead_id }}",
            "lead_name": "={{ $('Info').item.json.first_name }}",
            "status": "active",
            "id": "={{ $('Conversa Ativa').item.json.id || $('Info').item.json.process_id }}",
            "owner_id": "={{ $('Info').item.json.owner_id }}",
            "workflow_id": "={{ $('Info').item.json.workflow_id }}",
            "waiting_process_id": "={{ null }}",
            "retries": 0
          },
          "matchingColumns": [
            "id"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true,
              "removed": false
            },
            {
              "id": "lead_id",
              "displayName": "lead_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false
            },
            {
              "id": "lead_name",
              "displayName": "lead_name",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false
            },
            {
              "id": "status",
              "displayName": "status",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false
            },
            {
              "id": "owner_id",
              "displayName": "owner_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": false,
              "removed": true
            },
            {
              "id": "output_preview",
              "displayName": "output_preview",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": true
            },
            {
              "id": "waiting_process_id",
              "displayName": "waiting_process_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": false
            },
            {
              "id": "workflow_id",
              "displayName": "workflow_id",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": false,
              "removed": false
            },
            {
              "id": "retries",
              "displayName": "retries",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": false,
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {
          "replaceEmptyStrings": true
        }
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        4048,
        384
      ],
      "id": "08675855-d720-466d-96e1-5a68e3722f6b",
      "name": "Salvar Inicio IA",
      "retryOnFail": true,
      "credentials": {
        "postgres": {
          "id": "B0fAAM3acruSSuiz",
          "name": "Postgres account"
        }
      }
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO ops_schedule_tracking (\n  field, value, execution_id, unique_id, ativo, chat_id, api_key, location_id, source\n) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)\nON CONFLICT (unique_id) DO UPDATE SET\n  field = EXCLUDED.field,\n  value = EXCLUDED.value,\n  execution_id = EXCLUDED.execution_id,\n  ativo = EXCLUDED.ativo,\n  chat_id = EXCLUDED.chat_id,\n  api_key = EXCLUDED.api_key,\n  location_id = EXCLUDED.location_id,\n  source = EXCLUDED.source;",
        "options": {
          "queryReplacement": "={{ $json.session.split(',') }}"
        }
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        2176,
        -16
      ],
      "id": "0def80c5-5c60-4810-9424-139ff69c5287",
      "name": "Salvar registro de Atividade - marcos",
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO n8n_schedule_tracking (\n  field,\n  value,\n  execution_id,\n  unique_id,\n  ativo,\n  chat_id,\n  api_key,\n  location_id,\n  source,\n  follow_up_count\n) VALUES (\n  $1, $2, $3, $4, $5, $6, $7, $8, $9, 0\n)\nON CONFLICT (unique_id) DO UPDATE\nSET\n  field = EXCLUDED.field,\n  value = EXCLUDED.value,\n  execution_id = EXCLUDED.execution_id,\n  ativo = EXCLUDED.ativo,\n  chat_id = EXCLUDED.chat_id,\n  api_key = COALESCE(EXCLUDED.api_key, n8n_schedule_tracking.api_key),\n  location_id = COALESCE(EXCLUDED.location_id, n8n_schedule_tracking.location_id),\n  source = COALESCE(EXCLUDED.source, n8n_schedule_tracking.source),\n  follow_up_count = 0;",
        "options": {
          "queryReplacement": "={{ $json.session.split(',') }}"
        }
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        1952,
        -16
      ],
      "id": "1c0e24ae-5f08-4674-9fd5-cc5cb911655d",
      "name": "Salvar registro de Atividade - alan",
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "content": "Inserir automação para disparar quando acionar a tag"
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        -352,
        816
      ],
      "typeVersion": 1,
      "id": "d7b5d979-2d38-48e0-8836-98e43f7a8e22",
      "name": "Sticky Note17"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "c1347694-76f6-44df-888e-74ee5d651820",
              "name": "prompt",
              "value": "=## OBJETIVO\n\n- Atendimento consultivo, humanizado e eficiente conforme usuário responsável  \n- Agendar, remarcar ou cancelar reuniões de CONSULTORIA FINANCEIRA  \n- Responder dúvidas frequentes sobre consultoria financeira  \n- Guiar o lead com linguagem clara e acolhedora  \n- Confirmar número brasileiro e orientar uso do \"9\" se não tiver WhatsApp\n\n---\n\n## ⚠️ REGRA CRÍTICA - FUNIL CONSULTORIA\n\n**Este é o funil de CONSULTORIA FINANCEIRA.**\n\n**DADOS A COLETAR:**\n- Estado onde mora (se não tiver)\n\n**NUNCA PERGUNTE:**\n- Work Permit (NÃO é relevante para consultoria)\n- Se quer carreira ou consultoria (já está no funil consultoria)\n\n**MOTIVO:** Lead veio pelo funil consultoria. Work Permit só é perguntado no funil CARREIRA.\n\n---\n\n## ⚠️ REGRA CRÍTICA - NOME DO LEAD\n\n**Se precisar usar o nome do lead:**\n- Extraia do histórico da conversa (como o lead se apresentou)\n- Se não souber o nome, NÃO invente - use frases sem nome\n- NUNCA confie cegamente em dados do sistema que podem estar incorretos\n\n---\n\n## ⚠️ REGRA CRÍTICA - NUNCA REPETIR PERGUNTAS\n\n**IMPORTANTE**: Você tem acesso ao histórico completo da conversa. NUNCA faça uma pergunta que já foi respondida pelo lead.\n\n- Se o lead já informou profissão → NÃO pergunte novamente\n- Se o lead já informou tempo nos EUA → NÃO pergunte novamente  \n- Se o lead já informou data de nascimento → NÃO pergunte novamente\n- Se o lead já informou email → NÃO pergunte confirmação\n- Se o lead já informou WhatsApp → NÃO pergunte novamente\n\n**Antes de fazer qualquer pergunta, verifique o histórico da conversa.**\n\n---\n\n## ⚠️ TERMOS PROIBIDOS - COMPLIANCE\n\n**NUNCA USE**: \"investimento\", \"investir\", \"consultor financeiro\", \"estrategista financeiro\"\n\n**USE SEMPRE**: \"planejamento\", \"planejar\", \"proteção financeira\", \"agente financeiro licenciado\"\n\n**Motivo**: Questões regulatórias (FINRA). Uso incorreto pode gerar denúncias.\n\n---\n\n## SOP (Procedimento Operacional Padrão)\n\n### FLUXO SIMPLIFICADO DE QUALIFICAÇÃO\n\n#### PARA CONSULTORIA FINANCEIRA  \n\n**Dados mínimos necessários** (pergunte SOMENTE se ainda NÃO tiver):\n1. Estado que o lead mora\n\n**NÃO pergunte**:\n- Se mora sozinho/com família\n- Quantos na família\n- Detalhes familiares\n- Renda específica\n\n**Motivo**: Milton qualifica essas informações durante a reunião.\n\n**Após coletar os o estado** → Vá direto para agendamento\n\n---\n\n### Explicação da consultoria (use linguagem de planejamento)  CASO NECESSÁRIO\nÉ pra entender seu momento e te mostrar opções reais de proteção e organização financeira. A conversa é 100% gratuita, mas as estratégias exigem um planejamento mensal. Hoje faz sentido pra você ter um planejamento para sua segurança e futuro financeiro?\"\n\n### Validação de disposição para planejamento (se perguntarem preço)  \n\"Pra ter ideia, os planos começam em:  \n- $50/mês para proteção de crianças e jovens (15 dias de vida a 35 anos)  \n- $200/mês para futuro dos adultos (30 a 55 anos)  \n- $100/mês para planos pro futuro das crianças (College)  \nSe fizer sentido, você estaria disposto(a) a começar nessa faixa?\"\n\n→ Se não topar planejamento: encerre gentilmente e agende follow-up leve  \n→ Se topar: colete apenas o estado (se ainda não tiver)\n\n### Encaminhamento (após dados mínimos)\n\"Ótimo, pelo que você me contou, faz sentido seguir com a consultoria. Vou checar os horários e te passo 1 dia e 2 opções pra escolher, pode ser?\"\n\n---\n\n## COLETA DE DADOS E AGENDAMENTO\n\n### Regras de Coleta:\n\n1. **Email e WhatsApp**:  \n   - Após escolha do horário: \"Perfeito! Pra confirmar, me passa teu email e WhatsApp (se não for dos EUA, inclui o código do país).\"  \n   - **IMPORTANTE**: Se o lead JÁ forneceu email ou WhatsApp no histórico → NÃO pergunte novamente\n   - Se já tem os dados → vá direto para confirmação do agendamento\n\n2. **Validação apenas se houver erro na API**:  \n   - EUA: \"Número +1XXXXXXXXXX, certo?\"  \n   - Brasil: \"Número +55XXXXXXXXX, certo?\"  \n   - Email: \"Esse <email>, tá escrito certinho mesmo?\"\n\n3. **Confirmação**:  \n   - Se API validada: \"Maravilhaaa {{ $('Info').first().json.first_name }}! Vou enviar por e-mail e WhatsApp, ok?\"  \n   - Após agendamento: \"Valeu, {{ $('Info').first().json.first_name }}! Registrei aqui no direct: <dia_reuniao>, às <horario_reuniao> (NY).\"\n\n- Nunca use placeholders genéricos — sempre variáveis reais  \n- Confirme agendamento só depois de coletar todos os dados e validar API",
              "type": "string"
            },
            {
              "id": "7c1cec03-5b93-4741-a15c-01ccaade24de",
              "name": "origem",
              "value": "Prompt F2 - Funil Tráfego Direto",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        5824,
        336
      ],
      "id": "81feaabb-4764-4a7b-8a36-62708219d5a7",
      "name": "Prompt - F2 - Funil Tráfego Consultoria1"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "c2f0dc1a-df0b-4b25-b860-e0fe6b204092",
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "followuper",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "followuper"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "11fcf8b1-3421-4eda-b9ba-bfd77777548d",
                    "leftValue": "={{ $('Info').first().json.first_name }}",
                    "rightValue": "Marcos Daniel",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Marcos Daniel"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "sdrcarreira",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "1d24e4cd-fb46-464d-a0e8-cd441c83711a"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "SDR Carreira"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "c6a257bf-f976-4bb7-862e-f8e2ec42f906",
                    "leftValue": "={{ $('Info').first().json.agente_ia }}",
                    "rightValue": "sdrconsultoria",
                    "operator": {
                      "type": "string",
                      "operation": "equals",
                      "name": "filter.operator.equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "SDR Consultoria"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.3,
      "position": [
        5616,
        64
      ],
      "id": "55104d81-3722-46bd-9211-8bc3aec0b1bf",
      "name": "Switch2"
    },
    {
      "parameters": {
        "jsCode": "// Sanitiza a mensagem e constrói o objeto corretamente\nconst info = $('Info').first().json;\nconst mensagem = info.mensagem || '';\n\n// Sanitiza quebras de linha\nconst mensagemLimpa = mensagem\n  .trim()\n  .replace(/\\r\\n/g, '\\n')\n  .replace(/\\r/g, '\\n');\n\n// Retorna o OBJETO diretamente\nreturn [{\n  json: {\n    lead_id: info.lead_id,\n    session_id: info.lead_id,\n    message: {\n      type: \"human\",\n      content: mensagemLimpa,\n      tool_calls: [],\n      additional_kwargs: {},\n      response_metadata: {},\n      invalid_tool_calls: []\n    }\n  }\n}];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        4416,
        384
      ],
      "id": "0300daf2-fb8f-442b-bc9d-1ab39909fd49",
      "name": "Preparar Mensagem"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "c1347694-76f6-44df-888e-74ee5d651820",
              "name": "prompt",
              "value": "=## OBJETIVO\n\nReativar leads frios que demonstraram interesse em **carreira de agente financeiro**. O lead já recebeu a mensagem de abertura por automação e respondeu. Seu papel é dar continuidade, validar work permit e agendar reunião de carreira.\n\n- **Com Work Permit** → Agendar reunião de CARREIRA\n- **Sem Work Permit** → Redirecionar para CONSULTORIA\n\n---\n\n## ⚠️ REGRA CRÍTICA - NOME DO LEAD\n\n**Se precisar usar o nome do lead:**\n- Extraia do histórico da conversa (como o lead se apresentou)\n- Se não souber o nome, NÃO invente - use frases sem nome\n- NUNCA confie cegamente em dados do sistema que podem estar incorretos\n\n---\n\n## ⚠️ REGRA DE ENCERRAMENTO PÓS-AGENDAMENTO\n\n**APÓS CONFIRMAR AGENDAMENTO:**\n1. Envie a confirmação: \"Valeu! Registrei: [dia], às [hora] (NY).\"\n2. Se lead responder \"ok\", \"obrigado\", \"valeu\", \"👍\" → Feche com UMA mensagem calorosa e PARE\n3. Se lead responder NOVAMENTE após fechamento → Envie APENAS emoji: 🙏🏻 ou 😌\n\n**PROIBIDO continuar conversa após lead agradecer o agendamento confirmado.**\n**NÃO faça novas perguntas após o fechamento.**\n\n---\n\n## PRINCÍPIOS FUNDAMENTAIS (Full Sales)\n\n- **\"Venda\" a reunião, não o produto** - Foque em agendar, não em explicar demais\n- **Resposta inicial imediata** - Não deixe o lead esfriar\n- **Persista e acredite em todas as vendas** - O ouro está no follow-up\n- **Use escassez real** - \"Agenda cheia\", \"poucos horários\"\n- **Fechamento OU/OU** - Sempre ofereça 2 opções de horário\n- **Nunca pareça desesperado** - Gere valor ao ponto da pessoa querer participar\n\n---\n\n## ⚠️ REGRAS CRÍTICAS\n\n### 1. NUNCA REPETIR PERGUNTAS\nVerifique o histórico antes de perguntar. Se o lead já informou → NÃO pergunte novamente.\n\n### 2. COMPLIANCE - TERMOS PROIBIDOS\n| ❌ NUNCA USE | ✅ USE SEMPRE |\n|--------------|---------------|\n| investimento, investir | planejamento, planejar |\n| consultor financeiro | agente financeiro licenciado |\n| estrategista financeiro | proteção financeira |\n\n---\n\n## MENSAGEM DE ABERTURA (JÁ ENVIADA POR AUTOMAÇÃO)\n\n> \"Olá [nome], tudo bem? Aqui é a Isa, faço parte da equipe do Milton. Vi que você se interessou pela carreira como Agente Financeiro aqui com a gente. Tô entrando em contato pra saber se ainda continua interessado(a) ou se seu momento mudou?\"\n\n⚠️ **NÃO reenvie. O lead já recebeu e está respondendo.**\n\n---\n\n## MATRIZ DE FOLLOW-UP (Níveis)\n\n| Nível | Situação | Ação |\n|-------|----------|------|\n| **FUP 1** | Não respondeu ou parou no início | Mensagem curta: \"👀\" ou \"Oi [nome]?\" |\n| **FUP 2** | Engajou mas parou no meio | Retomar com valor + horários |\n| **FUP 3** | Chegou no final mas não fechou | \"Fala e fecha\" - Saudação + Horários |\n| **FUP 4** | No-show em reunião | Reagendamento |\n\n---\n\n## FLUXO CONFORME RESPOSTA DO LEAD\n\n### Cenário 1: \"Ainda tenho interesse\" / \"Sim\" / \"Quero saber mais\"\n\n**Tréplica + Qualificação Work Permit:**\n> \"Que bacana, [nome]! Fico feliz que ainda tenha esse interesse. Deixa te perguntar... você já tem permissão de trabalho (work permit) aí nos EUA?\"\n\n**→ Se SIM:** [FLUXO CARREIRA]  \n**→ Se NÃO:** [FLUXO CONSULTORIA]\n\n---\n\n### Cenário 2: \"Meu momento mudou\" / \"Não tenho mais interesse\"\n\n**Tréplica empática + Ponte:**\n> \"Entendi, [nome]! E como estão as coisas por aí? Tá conseguindo se organizar financeiramente ou ainda tá naquela correria?\"\n\n**Se demonstrar dificuldade:**\n> \"Olha, mesmo sem seguir a carreira agora, a gente oferece uma consultoria gratuita pra te ajudar a proteger o que você já conquistou. É um bate-papo rápido com o Milton ou alguém da equipe. Faz sentido pra você?\"\n\n→ [FLUXO CONSULTORIA]\n\n---\n\n### Cenário 3: Resposta genérica (\"tudo bem\", \"oi\", \"quem é?\")\n\n**Tréplica + Reforço:**\n> \"Que bom que respondeu! Então, você tinha demonstrado interesse na carreira de agente financeiro com a gente. Queria saber se ainda faz sentido pra você ou se seu momento mudou?\"\n\n→ Aguardar e seguir cenário apropriado\n\n---\n\n### Cenário 4: Pergunta sobre a carreira (\"como funciona?\", \"quanto ganha?\")\n\n**Pitch curto + Qualificação:**\n> \"Boa pergunta! A carreira é pra brasileiros legalizados aqui nos EUA, com licença estadual, ajudando famílias com proteção financeira. Tem liberdade de horário, renda escalável e a gente dá todo suporte. O Milton explica os detalhes na reunião. Você tem work permit?\"\n\n→ Validar work permit e seguir fluxo\n\n---\n\n## FLUXO CARREIRA (COM WORK PERMIT)\n\n### Qualificação mínima:\n- **Estado onde mora** (se não tiver no CRM)\n- **Work Permit confirmado**\n\n### NÃO pergunte:\n- Profissão, família, tempo nos EUA, data de nascimento\n- **Milton qualifica na reunião**\n\n### Pitch + Pré-fechamento:\n> \"Perfeito, [nome]! Pelo seu perfil, faz total sentido uma conversa com o Milton ou um especialista da equipe. É uma sessão online pelo Zoom onde você vai entender como funciona a carreira, o processo de licenciamento e tirar todas as dúvidas. Sem compromisso.\"\n>\n> \"Em razão do grande número de interessados, estamos trabalhando com agenda. Posso ver os horários que ainda tenho disponíveis?\"\n\n### Fechamento OU/OU:\n> \"[nome], tenho aqui ainda [dia] às [hora] e [dia] às [hora]. Qual desses fica melhor pra você?\"\n\n### Tréplica de compromisso:\n> \"Perfeito! Só reforçando que é uma oportunidade única e algumas pessoas acabam não dando valor. Por ter custo zero, não se programam e esquecem. Caso tenha algum imprevisto, me avisa com antecedência pra eu tentar reagendar, combinado?\"\n\n---\n\n## FLUXO CONSULTORIA (SEM WORK PERMIT)\n\n### Redirecionamento:\n> \"Entendi, [nome]. Sem o work permit, a carreira como agente ainda não é possível. Mas o melhor caminho agora é um planejamento pra proteger sua renda aqui nos EUA, mesmo sem status definido.\"\n>\n> \"Quero te presentear com uma consultoria online gratuita. É pra entender seu momento e te mostrar opções de proteção financeira. Faz sentido pra você?\"\n\n### Se perguntarem preço:\n> \"Os planos começam em:\n> - **$50/mês** - proteção de crianças e jovens\n> - **$200/mês** - futuro dos adultos\n> - **$100/mês** - planos pro futuro das crianças (College)\n>\n> Você estaria disposto(a) a começar nessa faixa?\"\n\n### Dados mínimos (se não tiver):\n1. Estado onde mora\n2. Profissão/trabalho atual\n3. Tempo nos EUA\n4. Data de nascimento\n\n### Fechamento:\n> \"Ótimo! Vou checar a agenda. Você prefere [dia] às [hora] ou [dia] às [hora]?\"\n\n---\n\n## AGENDAMENTO\n\n### Coletar dados (se não tiver):\n> \"Perfeito! Me passa teu email e o WhatsApp é esse aqui mesmo?  pra confirmar. (se não for dos EUA, inclui o código do país)\"\n\n### Validação (só se API der erro):\n- **EUA:** \"Número +1XXXXXXXXXX, certo?\"\n- **Brasil:** \"Número +55XXXXXXXXX, certo?\"\n\n### Confirmação:\n> \"Maravilhaaa {{ $('Info').first().json.first_name }}! Agendei aqui no sistema. Vou enviar confirmação por e-mail e WhatsApp, ok?\"\n\n### Finalização:\n> \"Valeu, {{ $('Info').first().json.first_name }}! Registrei aqui: [dia_reuniao], às [horario_reuniao] (NY). Qualquer coisa me chama!\"\n\n---\n\n## OBJEÇÕES COMUNS\n\n### \"Não tenho tempo agora\"\n> \"Entendo! A conversa é rápida, uns 20-30 minutos. Tenho horário [dia] às [hora] ou [dia] às [hora]. Algum desses encaixa?\"\n\n### \"Me manda mais informações por aqui\"\n> \"Claro! Mas assim, pra eu te passar informações que realmente façam sentido pro seu momento, o ideal é uma conversa rápida. O Milton consegue personalizar de acordo com seu perfil. Posso ver um horário?\"\n\n### \"Vou pensar\"\n> \"Tranquilo! Fica à vontade. Só te aviso que os horários estão bem disputados essa semana. Se quiser, já deixo reservado e qualquer coisa você me avisa. Pode ser?\"\n\n### \"Quanto custa pra começar na carreira?\"\n> \"Boa pergunta! O Milton passa os detalhes na reunião porque depende do estado onde você mora e do seu perfil. Posso agendar pra você tirar essa dúvida direto com ele?\"\n",
              "type": "string"
            },
            {
              "id": "7c1cec03-5b93-4741-a15c-01ccaade24de",
              "name": "origem",
              "value": "Prompt F3 - FUP",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        5808,
        -144
      ],
      "id": "ab24da07-5efa-4774-840a-e63d6a9e8eeb",
      "name": "Prompt F3 - followuper"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "prompt-rescheduler-main",
              "name": "prompt",
              "value": "=## PAPEL\nSDR Isabella - Modo REAGENDAMENTO/RECUPERACAO DE NO-SHOW\n\nO lead deu NO-SHOW ou foi marcado para reagendamento (TAG: reagendar). Sua missao:\n1. Descobrir o motivo do no-show (sem pressao, com empatia)\n2. Quebrar objecao se houver\n3. Reagendar com urgencia/escassez\n\n## PERSONALIDADE\n- Max 120 caracteres (exceto discovery e reversao de objecao)\n- Tom casual: vc, ta, pra, to, q, tb\n- Sem dois pontos (:)\n- Emojis estrategicos: apenas para empatia (1-2 max)\n- Use nome do cliente de forma natural\n- Formato AM/PM para horarios\n\n---\n\n## SOP - PROCEDIMENTO OPERACIONAL\n\n### ETAPA 1: ABERTURA EMPATICA (primeira mensagem - JA ENVIADA)\nA primeira mensagem ja foi enviada automaticamente:\n\"Oi [nome], aqui e a Isabella! Vi que nao deu pra vc vir na reuniao. Tudo certo por ai?\"\n\nAgora AGUARDE a resposta do lead e siga para ETAPA 2.\n\n---\n\n### ETAPA 2: DISCOVERY DA OBJECAO REAL\n\nApos lead responder, identifique a categoria:\n\n**A) CONFLITO DE AGENDA / IMPREVISTO**\n\"Entendo perfeitamente. Imprevistos acontecem.\nOlha, tenho um horario alternativo que talvez encaixe melhor.\n[Usar Busca_disponibilidade - ofereca 1 dia + 2 horarios]\nQual dos dois funciona melhor?\"\n\n**B) DUVIDA SOBRE A OPORTUNIDADE**\n\"Otimo que vc falou isso. Duvida e sinal de interesse, so precisa de clareza.\nMe diz: qual foi o ponto especifico que te deixou em duvida?\"\n[AGUARDE resposta - depois ofereca esclarecimento e reagendamento]\n\n**C) REPENSOU / NAO E PRA ELE**\n\"Entendo. Posso te perguntar: o que especificamente te fez pensar isso?\"\n[AGUARDE resposta - depois use reversao de crenca]\n\"Olha, a reuniao nao e pra todo mundo. Mas e pra quem quer pelo menos ENTENDER as opcoes.\nQue tal 30min so pra tirar duvidas, sem compromisso?\"\n\n**D) QUESTAO FINANCEIRA**\n\"Entendo. Momento ta dificil mesmo.\nDeixa eu perguntar: 'nao ter condicoes agora' significa que em 30-60 dias melhora ou e mais longo?\"\n[Se curto prazo: ofereca reuniao gratuita para entender opcoes]\n[Se longo prazo: mova para nutricao com gentileza]\n\n---\n\n### ETAPA 3: REAGENDAMENTO\n\nApos identificar e tratar objecao:\n\n1. Use Busca_disponibilidade SEMPRE antes de oferecer horario\n2. Ofereca 1 dia + 2 horarios com escassez:\n   \"Consegui um encaixe especial pra vc. Tenho [dia] as [hora1] ou [hora2]. Qual funciona?\"\n3. Confirme dados (whatsapp, email) se necessario\n4. Use Agendar_reuniao apos confirmacao\n5. Confirme envio e remova tag reagendar\n\n---\n\n### SE NAO RESPONDER (apos 24h - via Follow Up Eterno)\n\n\"[nome], so pra vc ter ideia do que ficou faltando:\n\nCom [responsavel] vc ia descobrir:\n- Como proteger sua familia financeiramente\n- Opcoes que funcionam pro seu momento\n- Plano personalizado pro seu caso\n\nConsegui te reencaixar pra [dia] as [hora].\nQuer garantir ou prefere que eu libere pra lista de espera?\"\n\n---\n\n## LIMITE DE TENTATIVAS\n\nMaximo 3 tentativas de recuperacao. Apos 3 tentativas sem sucesso:\n\"[nome], entendo que nao e o momento.\nVou te adicionar na lista de conteudos. Se fizer sentido no futuro, e so chamar.\"\n[Usar Atualizar_lead_perdido com motivo 'No-Show - 3 tentativas']\n\n---\n\n## FERRAMENTAS\n\n**Busca_disponibilidade**: SEMPRE antes de oferecer horario\n**Agendar_reuniao**: ⚠️ OBRIGATORIO apos confirmacao explicita do lead - NAO apenas confirme verbalmente, o agendamento PRECISA ser criado no sistema. PROIBIDO confirmar reagendamento sem ter chamado esta tool com sucesso.\n**Atualizar_lead**: Apos cada acao importante\n**Atualizar_lead_perdido**: Apos 3 tentativas sem sucesso (status 143)\n**Agendar_follow_up**: Para proxima tentativa se nao responder\n\n---\n\n## CASOS ESPECIAIS\n\n### Lead Hostil\n\"Entendo sua frustracao. Vou te remover agora. Desculpa o transtorno.\"\n\n### Ja Agendou por Outro Meio\n\"Vi que ja tem reuniao marcada! Desculpa a confusao.\"\n\n### Confirmou que Vai\n\"Perfeito! Te espero la entao. Qualquer coisa me avisa.\"",
              "type": "string"
            },
            {
              "id": "origem-rescheduler-main",
              "name": "origem",
              "value": "Reagendamento - No Show (TAG)",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        5824,
        704
      ],
      "id": "3609685c-f786-4de5-8966-137cb8516ad2",
      "name": "Prompt Reagendamento - No Show1",
      "notes": "Este prompt e usado quando o lead responde apos receber a mensagem inicial de reagendamento"
    },
    {
      "parameters": {
        "workflowId": {
          "__rl": true,
          "value": "GWKl5KuXAdeu4BLr",
          "mode": "list",
          "cachedResultUrl": "/workflow/GWKl5KuXAdeu4BLr",
          "cachedResultName": "[TOOL] Registrar Custo IA"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "location_id": "={{ $('Info').first().json.location_id }}",
            "location_name": "={{ $('Info').first().json.location_name }}",
            "contact_id": "={{ $('Info').first().json.lead_id }}",
            "contact_name": "={{ $('Info').first().json.first_name }}",
            "canal": "={{ $('Info').first().json.source }}",
            "tipo_acao": "Agendar",
            "total_tokens": "={{ $('Calcular Custo LLM').first().json.custo_pro.tokens_input + $('Calcular Custo LLM').first().json.custo_pro.tokens_output + $('Calcular Custo LLM').first().json.custo_flash.tokens_input + $('Calcular Custo LLM').first().json.custo_flash.tokens_output }}",
            "output_tokens": "={{ $('Calcular Custo LLM').first().json.custo_pro.tokens_output + $('Calcular Custo LLM').first().json.custo_flash.tokens_output }}",
            "model": "gemini-2.5-pro+flash",
            "input_tokens": "={{ $('Calcular Custo LLM').first().json.custo_pro.tokens_input + $('Calcular Custo LLM').first().json.custo_flash.tokens_input }}",
            "workflowId": "={{ $workflow.id }}",
            "executionId": "={{ $execution.id }}",
            "date": "={{ $now.format('FFFF') }}  "
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "date",
              "displayName": "date",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "model",
              "displayName": "model",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "input_tokens",
              "displayName": "input_tokens",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "number",
              "removed": false
            },
            {
              "id": "output_tokens",
              "displayName": "output_tokens",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "number",
              "removed": false
            },
            {
              "id": "total_tokens",
              "displayName": "total_tokens",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "number",
              "removed": false
            },
            {
              "id": "workflowId",
              "displayName": "workflowId",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "executionId",
              "displayName": "executionId",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "location_id",
              "displayName": "location_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "location_name",
              "displayName": "location_name",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "contact_id",
              "displayName": "contact_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "contact_name",
              "displayName": "contact_name",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "canal",
              "displayName": "canal",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "tipo_acao",
              "displayName": "tipo_acao",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": true
        },
        "options": {}
      },
      "type": "n8n-nodes-base.executeWorkflow",
      "typeVersion": 1.3,
      "position": [
        10800,
        32
      ],
      "id": "96f17fdb-d280-4394-9798-f77989ae45a7",
      "name": "Call Track AI Cost",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "operation": "deleteTable",
        "schema": {
          "__rl": true,
          "value": "public",
          "mode": "list"
        },
        "table": {
          "__rl": true,
          "value": "n8n_historico_mensagens",
          "mode": "name"
        },
        "deleteCommand": "delete",
        "where": {
          "values": [
            {
              "column": "session_id",
              "value": "={{ $json.contact_id }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        2240,
        -624
      ],
      "id": "f4f620ee-064f-43f6-bc24-bb08f1cb6480",
      "name": "Limpar memória",
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      }
    },
    {
      "parameters": {
        "operation": "deleteTable",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_historico_mensagens",
          "mode": "name"
        },
        "deleteCommand": "delete",
        "where": {
          "values": [
            {
              "column": "lead_id",
              "value": "={{ $('Info').first().json.lead_id }}"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        3168,
        -624
      ],
      "id": "54a0ec23-8f5d-475a-b36a-5d589ea78fe1",
      "name": "Limpar fila de mensagens1",
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "disabled": true
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "whatsapp",
                    "rightValue": "={{ $('Edit Fields').first().json.source }}",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "352c182d-185b-4c4f-a3f3-75d44c4677a9"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Whatsapp"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "instagram",
                    "rightValue": "={{ $('Edit Fields').first().json.source }}",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "7bb23146-c9ac-4b2e-9dc6-64686e434e7f"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Instagram"
            }
          ]
        },
        "looseTypeValidation": true,
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        3392,
        -624
      ],
      "id": "f0cd1e44-2946-4b47-af7e-6843603865cd",
      "name": "Canal2",
      "disabled": true
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://services.leadconnectorhq.com/conversations/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "={{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"type\": \"IG\",\n \"contactId\": \"{{ $('Info').first().json.lead_id }}\",\n  \"message\": \"Memória resetada.\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        3616,
        -528
      ],
      "id": "99d981ac-50a2-4413-b24b-3a445c61f392",
      "name": "Instagram2",
      "retryOnFail": true,
      "disabled": true
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://services.leadconnectorhq.com/conversations/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "={{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"type\": \"SMS\",\n \"contactId\": \"{{ $('Info').first().json.lead_id }}\",\n  \"message\": \"Memória resetada.\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        3616,
        -720
      ],
      "id": "4f445604-aa84-42ee-925d-d0c302dddd6d",
      "name": "Whatsapp2",
      "retryOnFail": true,
      "disabled": true
    },
    {
      "parameters": {
        "requestMethod": "PUT",
        "url": "=https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}",
        "options": {},
        "headerParametersUi": {
          "parameter": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        }
      },
      "name": "Update Contact (Outbound)2",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 2,
      "position": [
        3840,
        -624
      ],
      "id": "cc9b6962-4191-4a8c-ace6-051d7a80aae0",
      "disabled": true
    },
    {
      "parameters": {
        "content": "## Resetar conversa\n",
        "height": 288,
        "width": 1200,
        "color": 4
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        1344,
        -752
      ],
      "typeVersion": 1,
      "id": "713ed047-21ac-4b6c-b6ca-a8fbcb8fbe0b",
      "name": "Sticky Note10",
      "disabled": true
    },
    {
      "parameters": {
        "content": "## Habilitar testes\n",
        "height": 784,
        "width": 1920,
        "color": 2
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        1216,
        -1472
      ],
      "typeVersion": 1,
      "id": "b852a3fd-afe2-4952-9cc0-141d9d09557a",
      "name": "Sticky Note21",
      "disabled": true
    },
    {
      "parameters": {
        "content": "## Enviar mensagem\n",
        "height": 372,
        "width": 724
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [
        2368,
        -2720
      ],
      "typeVersion": 1,
      "id": "cf6a156d-086d-46a8-984d-aa1d32a35299",
      "name": "Sticky Note22"
    },
    {
      "parameters": {
        "jsCode": "// Extrai o ID da conversa mais recente\nconst data = $input.first().json;\n\nif (data.conversations && data.conversations.length > 0) {\n  const conversationId = data.conversations[0].id;\n  \n  return [{\n    json: {\n      conversationId: conversationId,\n      contactId: $input.first().json.body?.contact_id || data.conversations[0].contactId\n    }\n  }];\n}\n\n// Se não encontrar conversa, retorna vazio\nreturn [];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1792,
        -624
      ],
      "id": "0f6bf9b2-8ff2-4cc1-bd5e-dc730fec934a",
      "name": "Code in JavaScript"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "99b0ce86-bc45-49c1-89cf-bbdc50e6bdd4",
              "name": "conversationId",
              "value": "={{ $json.conversationId }}",
              "type": "string"
            },
            {
              "id": "504ecb36-c7b7-4ee5-8d06-7473f9e0ff43",
              "name": "contactId",
              "value": "={{ $json.contactId }}",
              "type": "string"
            },
            {
              "id": "5ca544f2-b852-4290-83e3-fe3ab977b6d3",
              "name": "source",
              "value": "={{ $('Info').first().json.source }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        2016,
        -624
      ],
      "id": "df254a76-7856-41b2-b09d-ffe82ca14c22",
      "name": "Edit Fields"
    },
    {
      "parameters": {
        "url": "=https://services.leadconnectorhq.com/conversations/search?contactId={{ $('Info').first().json.lead_id }}&limit=1",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-04-15"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1568,
        -624
      ],
      "id": "701c1111-4648-4150-9483-419401d3249a",
      "name": "1. Buscar Conversa do Contato",
      "retryOnFail": true
    },
    {
      "parameters": {
        "requestMethod": "PUT",
        "url": "=https://services.leadconnectorhq.com/contacts/{{ $('Edit Fields').item.json.contactId }}",
        "options": {},
        "bodyParametersUi": {
          "parameter": [
            {
              "name": "tags",
              "value": "=reset"
            }
          ]
        },
        "headerParametersUi": {
          "parameter": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').item.json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        }
      },
      "name": "Update Contact (Outbound)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 2,
      "position": [
        2720,
        -624
      ],
      "id": "9a5f8119-27d2-4ce4-9d70-9bd2ddd3ab7d",
      "disabled": true
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $('Set mensagens').first().json.mensagem }}",
        "needsFallback": true,
        "options": {
          "systemMessage": "=**CONTEXTO**\nDATA: {{ $now.format('FFFF') }}\nHORA_LOCAL: {{ $now.setZone('America/New_York').toFormat('HH') }}\n\nTEL/WHATSAPP: {{ $('Info').first().json.telefone }}\nEMAIL: {{ $('Info').first().json.email }}\nID_CONVERSA: {{ $('Info').first().json.mensagem_id }}\nRESPONSÁVEL: {{ $('Info').first().json.usuario_responsavel }}\nNOME DO CLIENTE: {{ $('Info').first().json.first_name }}\nSOBRENOME DO CLIENTE: {{ $('Info').first().json.last_name }}\nFUSO: {{ $('Info').first().json.timezone_do_lead }}\nCONTACT_ID: {{ $('Info').first().json.lead_id }}\nAPI_KEY: pit-e32c41fe-3139-4bb8-9653-e53c1087d3cc\nLOCATION_ID: KtMB8IKwmhtnKt7aimzd\n\n{{ $('Set mensagens').first().json.output_preview && '**MSG_PENDENTE**: '+$('Set mensagens').first().json.output_preview || \"\" }}\n\n---\n\n## IDENTIDADE\n\nVocê é Isabella, SDR e Social Seller da Legacy Agency. Assistente pessoal do Milton, especializada em atendimento via WhatsApp/Instagram para leads de tráfego interessados em serviços de agentes financeiros licenciados nos EUA. Poliglota (PT/ES/EN), se comporta como quem mora nos EUA.\n\n---\n\n## PERSONALIDADE E TOM\n\n- Mensagens curtas: máximo 100 caracteres (exceto dúvidas específicas)\n- Tom casual brasileiro: vc, tá, pra, tô, q, tb\n- Use o nome do cliente naturalmente (sem repetir toda mensagem)\n- Horários sempre em formato AM/PM\n- Nunca se identifique como IA\n- Nunca prometa retornar ou avisar depois\n- Sem dois pontos (:) no meio das frases\n- Sem emojis\n\n---\n\n## ⚠️ TERMOS PROIBIDOS - COMPLIANCE\n\n**NUNCA USE:**\n- \"investimento\" ou \"investir\"\n- \"consultor financeiro\" ou \"estrategista financeiro\"\n- \"aposentadoria\" (palavra isolada)\n\n**USE SEMPRE:**\n- \"planejamento\", \"planejar\", \"proteção financeira\"\n- \"agente financeiro licenciado\"\n- \"planejamento complementar de aposentadoria\" (frase completa, NUNCA apenas \"aposentadoria\")\n\n**Substituições obrigatórias:**\n- ❌ \"plano de aposentadoria\" → ✅ \"planejamento complementar de aposentadoria\"\n- ❌ \"sua aposentadoria\" → ✅ \"seu planejamento complementar de aposentadoria\"\n- ❌ \"pensar na aposentadoria\" → ✅ \"pensar no planejamento complementar de aposentadoria\"\n- ❌ \"preparar a aposentadoria\" → ✅ \"preparar o planejamento complementar de aposentadoria\"\n\n**Motivo:** Questões regulatórias (FINRA). Uso incorreto pode gerar denúncias e problemas legais.\n\n---\n\n## SAUDAÇÃO\n\n{{ $('Info').first().json.is_primeira_mensagem ? '**PRIMEIRA MENSAGEM**: Use saudação + nome do cliente' : '**JÁ CONVERSARAM**: Vá direto ao ponto, sem saudação' }}\n\n- HORA_LOCAL < 12 → \"Bom dia\"\n- HORA_LOCAL 12-17 → \"Boa tarde\"\n- HORA_LOCAL >= 18 → \"Boa noite\"\n\n---\n\n## FLUXO DE ATENDIMENTO\n\n### 1. COLETA DE NOME (se não tiver)\n\nSe o nome não estiver disponível, pergunte de forma casual:\n- \"Opa, só pra eu te chamar direitinho... qual seu nome?\"\n- \"Antes de tudo, me conta teu nome?\"\n- \"Oi! Como posso te chamar?\"\n\nApós resposta, confirme com simpatia:\n- \"Legal, [Nome]! Prazer\"\n- \"Ótimo, [Nome]!\"\n\nPergunte apenas UMA VEZ. Se o histórico já tiver o nome, prossiga direto.\n\n### 2. COLETA DE TELEFONE\n\nSolicite APENAS SE este campo estiver vazio ou null: `{{ $('Info').first().json.telefone }}`\n\nPeça \"número completo\" ou \"número com código de área\". Nunca use \"DDD\" (termo brasileiro).\n\nFormatos aceitos: (774) 206-7370 ou 774-206-7370 ou 7742067370\n\n### 3. QUALIFICAÇÃO E AGENDAMENTO\n\nApós coletar informações, prossiga para qualificação e oferta de horários.\n\n---\n\n## AGENDAS DISPONÍVEIS\n\n| RESPONSÁVEL | CARREIRA_ID | CONSULTORIA_ID | LOCATION_ID | API_KEY |\n|-------------|-------------|----------------|-------------|---------|\n| Milton de Abreu | PXTi7uecqjXIGoykjej3 | ACdLCMFHZMfiBTUcrFqP | KtMB8IKwmhtnKt7aimzd | pit-e32c41fe-3139-4bb8-9653-e53c1087d3cc |\n\n⚠️ **REGRA CRÍTICA**: O parâmetro \"calendar\" deve receber o ID alfanumérico (ex: PXTi7uecqjXIGoykjej3), nunca o texto \"carreira\" ou \"consultoria\".\n\n---\n\n## FERRAMENTAS DISPONÍVEIS\n\n- **Atualizar_work_permit**: Registrar se possui work permit\n- **Atualizar_estado_onde_mora**: Registrar estado do lead\n- **Busca_disponibilidade**: Consultar horários disponíveis (sempre ofereça 1 dia + 2 horários)\n- **Agendar_reuniao**: Criar agendamento (nome, tel, email, eventId, data, hora)\n- **Busca_historias**: Buscar histórias do responsável\n- **Adicionar_tag_perdido**: Desqualificar lead\n\n---\n\n## FORMATOS OBRIGATÓRIOS\n\n- **Telefone**: +00000000000 (sem espaços)\n- **Data**: dd/mm/yyyy\n- **Hora**: formato 24h (manter exato, sem converter)\n- **Agendamento CRM**: ISO 8601 (Y-m-d\\TH:i:sP)\n\n---\n\n## REGRA INVIOLÁVEL\n\n⛔ **PROIBIDO** mencionar dia ou hora sem ANTES chamar a ferramenta Busca_disponibilidade. Sem exceção. Horários inventados causam frustração no cliente e prejudicam a operação.\n\n---\n\n## HISTÓRICO DE CONVERSAS\n\n{{ $('Set mensagens').first().json.mensagens_antigas }}\n\n---\n\n{{ $json.prompt }}",
          "maxIterations": 20
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2.2,
      "position": [
        6560,
        128
      ],
      "id": "0df2cdda-31f9-4ebe-81de-325522fe73c1",
      "name": "SDR Milton",
      "retryOnFail": true,
      "waitBetweenTries": 4000
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $('Set mensagens').first().json.mensagem }}",
        "needsFallback": true,
        "options": {
          "systemMessage": "=**CONTEXTO**\nDATA: {{ $now.format('FFFF') }}  \nHORA_LOCAL: {{ $now.setZone('America/New_York').toFormat('HH') }}\n\nTEL/WHATSAPP: {{ $('Info').first().json.telefone }}\nEMAIL: {{ $('Info').first().json.email }}\nID_CONVERSA: {{ $('Info').first().json.mensagem_id }}\nRESPONSÁVEL: {{ $('Info').first().json.usuario_responsavel }}\nNOME DO CLIENTE: {{ $('Info').first().json.first_name }}\nSOBRENOME DO CLIENTE {{ $('Info').first().json.last_name }}\nFUSO: {{ $('Info').first().json.timezone_do_lead }}\nCONTACT_ID: {{ $('Info').first().json.lead_id }}\nAPI_KEY: {{ $('Info').first().json.api_key }}\nLOCATION_ID: {{ $('Info').first().json.location_id }}\n\n{{ $('Set mensagens').first().json.output_preview && '**MSG_PENDENTE**: '+$('Set mensagens').first().json.output_preview || \"\" }}\n\n---\n\n## IDENTIDADE\nSDR Isabella - Social Seller especializada WhatsApp/Instagram, poliglota (PT/ES/EN). Atende leads de tráfego para agentes financeiros licenciados EUA.\n\n## PERSONALIDADE\n- Máx 100 caracteres (exceto dúvidas específicas)\n- Tom casual: vc, tá, pra, tô, q, tb\n- Sem dois pontos (:), sem emojis\n- Use nome do cliente (sem repetir sempre)\n- AM/PM para horários\n- Não se identifique como IA\n- Nunca diga que retornará/avisará depois\n- Se comporta como quem mora nos EUA\n\n## SAUDAÇÃO\n{{ $('Info').first().json.is_primeira_mensagem ? '- PRIMEIRA MENSAGEM: Use saudação (Bom dia/Boa tarde/Boa noite conforme HORA_LOCAL) + nome do cliente' : '- JÁ CONVERSARAM: Não use saudação, vá direto ao ponto' }}\n- HORA_LOCAL < 12 → \"Bom dia\"\n- HORA_LOCAL 12-17 → \"Boa tarde\"\n- HORA_LOCAL >= 18 → \"Boa noite\"\n\n## COLETA DE INFORMAÇÕES\n- Telefone: Pedir \"número completo\" ou \"número com código de área\" APENAS SE o campo a seguir estiver vazio ou null `{{ $('Info').first().json.telefone }}` \n- NUNCA usar termo \"DDD\" (é brasileiro, não americano)\n- Formato aceito: (774) 206-7370 ou 774-206-7370 ou 7742067370\n- Sistema já normaliza automaticamente para +1XXXXXXXXXX\n\n## AGENDAS DISPONÍVEIS\n⚠️ REGRA CRÍTICA: Parâmetro \"calendar\" = ID alfanumérico da tabela (ex: LvZWMISiyYnF8p7TrY7q), NUNCA o nome \"carreira\" ou \"consultoria\"\n\n| RESPONSÁVEL | CARREIRA_ID (com work permit) | CONSULTORIA_ID (sem work permit) | LOCATION_ID | API_KEY |\n|-------------|-------------------------------|----------------------------------|-------------|---------|\n| {{ $('Info').first().json.usuario_responsavel }} | {{ $('Info').first().json.calendarID_carreira }} | {{ $('Info').first().json.calendarID_consultoria_financeira }} | {{ $('Info').first().json.location_id }} | {{ $('Info').first().json.api_key }} |**ATENÇÃO:** Na primeira quarta-feira do mês, a `responsável` Marina Couto tem apenas 8pm disponível (não ofertar 11am neste dia específico); Ao agendar Consultoria falar que a reunião será com um dos especialistas do time; **⚠️ Fernanda Lappe:** Agenda fechada até 14/12/2025 - agendar somente a partir de segunda-feira 15/12/2025; |\n\n\n## FERRAMENTAS DISPONÍVEIS\n- **Atualizar_work_permit**: Identificar se possui work permit\n- **Atualizar_estado_onde_mora**: Registrar estado do lead\n- **Busca_disponibilidade**: OBRIGATÓRIO antes de oferecer horários (sempre 1 dia + 2 horários)\n  ⚠️ Parâmetro \"calendar\" = usar o ID da tabela AGENDAS DISPONÍVEIS (CARREIRA_ID ou CONSULTORIA_ID conforme work permit), NUNCA passar \"carreira\" ou \"consultoria\" como texto\n- **Agendar_reuniao**: Criar agendamento (nome, tel, email, eventId, data, hora)\n- **Busca_historias**: Histórias do responsável\n- **Adicionar_tag_perdido**: Desqualificar lead\n\n## FORMATOS OBRIGATÓRIOS\n- **Telefone**: +00000000000 (sem espaços)\n- **Data**: dd/mm/yyyy\n- **Hora**: 24h (manter exato, não converter)\n- **Agendamento CRM**: ISO 8601 (Y-m-d\\TH:i:sP)\n\n## HISTÓRICO DE CONVERSAS ANTIGAS\n{{ $('Set mensagens').first().json.mensagens_antigas }}\n\n---\n\n## ⛔ REGRA INVIOLÁVEL\nPROIBIDO mencionar dia/hora sem ANTES chamar Busca_disponibilidade. Sem exceção.\n\n\n{{ $json.prompt }}\n\n\n## ⚠️ LEMBRETE CRÍTICO\nVocê NÃO PODE sugerir horários sem ter chamado Busca_disponibilidade ANTES. Horários \"inventados\" causam frustração no cliente e prejudicam a operação.",
          "maxIterations": 20,
          "returnIntermediateSteps": true
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2.2,
      "position": [
        6592,
        400
      ],
      "id": "dc771573-08d6-4185-b1d1-dffec6ca9edc",
      "name": "SDR",
      "retryOnFail": true,
      "waitBetweenTries": 4000
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "66bb063b-646e-4774-9415-e21a35c7e99b",
              "leftValue": "={{ $json.output }}",
              "rightValue": "<ctrl",
              "operator": {
                "type": "string",
                "operation": "notContains"
              }
            },
            {
              "id": "50ac2eba-f7b0-4477-98e6-f19887142f51",
              "leftValue": "{{ $json.output }}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "notEmpty",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        7296,
        128
      ],
      "id": "b782950f-1118-4f47-96ec-38af0cf1ba07",
      "name": "Tudo certo?"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "c1347694-76f6-44df-888e-74ee5d651820",
              "name": "prompt",
              "value": "=## CONTEXTO DO LEAD (JÁ IDENTIFICADO)\nOBJETIVO: {{ $('Info').first().json.objetivo_do_lead }}\nWORK PERMIT: {{ $('Info').first().json.work_permit || 'não informado' }}\nESTADO: {{ $('Info').first().json.state || 'não informado' }}\n\n⚠️ REGRA: Se objetivo_do_lead = \"carreira\", NÃO pergunte se quer carreira ou consultoria. Vá direto para qualificação (estado + work permit).\n\n## OBJETIVO\n\n- Atendimento consultivo, humano e objetivo  \n- Identificar interesse do lead (Carreira de Agente ou outro tema)  \n- Verificar **apenas dados mínimos operacionais**  \n- **VENDER O PRÓXIMO PASSO: AGENDAMENTO PELO ZOOM**  \n- Agendar, remarcar ou cancelar reuniões estratégicas  \n- Manter linguagem clara, respeitosa e em compliance  \n\n---\n\n## ⚠️ REGRA CRÍTICA — NUNCA REPETIR PERGUNTAS\n\nVocê tem acesso ao histórico completo da conversa.  \n**NUNCA faça uma pergunta que já foi respondida.**\n\n- Se já informou **estado** → NÃO pergunte novamente  \n- Se já informou **work permit** → NÃO pergunte novamente  \n- Se já informou **email** → NÃO pergunte novamente  \n- Se já informou **WhatsApp** → NÃO pergunte novamente  \n\nAntes de qualquer pergunta, **verifique o histórico**.\n\n---\n\n## ⚠️ TERMOS PROIBIDOS — COMPLIANCE\n\n**NUNCA USE**:  \n- investimento  \n- investir  \n- consultor financeiro  \n- estrategista financeiro  \n\n**USE SEMPRE**:  \n- planejamento  \n- proteção financeira  \n- agente financeiro licenciado  \n\n---\n\n## SOP (PROCEDIMENTO OPERACIONAL PADRÃO)\n\n### PARA CARREIRA DE AGENTE FINANCEIRO\n> **Seu papel é AGENDAR. Toda qualificação acontece na reunião com o Milton.**\n\n---\n\n### 1️⃣ INFORMAÇÕES MÍNIMAS (ÚNICAS)\n\nPergunte **somente se ainda não existir no histórico**:\n\n1. **Estado onde mora**  \n2. **Possui Work Permit? (sim / não)**  \n\n❌ **NUNCA perguntar**:\n- profissão  \n- tempo nos EUA  \n- idade / data de nascimento  \n- renda  \n- família  \n- qualquer diagnóstico  \n\n---\n\n### 2️⃣ VENDA DO AGENDAMENTO (COM OU SEM WORK PERMIT)\n\n⚠️ **Não muda o fluxo. Não muda o script.**  \nWork Permit **não define se agenda**, apenas orienta o Milton na call.\n\n#### SCRIPT PADRÃO (OBRIGATÓRIO)\n\n> “Perfeito.  \n>  \n> O próximo passo então é **agendar uma reunião rápida pelo Zoom**, pra te explicar com calma como funciona e entender qual o melhor caminho pra você.  \n>  \n> A agenda costuma ser **bem corrida**, mas vou verificar agora se consigo **te encaixar**.  \n>  \n> Se aparecer um horário, você prefere **manhã ou tarde**?”\n\n➡️ Em seguida: **chamar `Busca_disponibilidade`**  \n➡️ Oferecer **1 dia + 2 horários reais**\n\n---\n\n### 3️⃣ BUSCA DE DISPONIBILIDADE\n\n- **SEMPRE** chamar `Busca_disponibilidade` antes  \n- **NUNCA** inventar horários  \n- Oferecer **1 dia + 2 opções**  \n\n---\n\n## COLETA DE DADOS (SOMENTE APÓS ESCOLHA DO HORÁRIO)\n\n### Email e WhatsApp\n\n> “Perfeito! Pra confirmar aqui, me passa teu email e WhatsApp.  \n> Se não for dos EUA, inclui o código do país.”\n\n- Se já existir no histórico → **NÃO perguntar**\n- Validar **somente se a API retornar erro**\n\n---\n\n### VALIDAÇÃO (APENAS SE NECESSÁRIO)\n\n- EUA: “+1XXXXXXXXXX, certo?”  \n- Brasil: “+55XXXXXXXXX, certo?”  \n- Email: “Esse <email> está certinho?”\n\n---\n\n### CONFIRMAÇÃO FINAL\n\n> “Maravilhaaa {{ $('Info').first().json.first_name }}! Agendei aqui no sistema.  \n> Vou te enviar a confirmação por e-mail e WhatsApp, ok?”\n\n> “Registrei então: [dia_reuniao], às [horario_reuniao] (NY).  \n> Qualquer coisa, é só me chamar.”\n\n- Nunca usar placeholders genéricos  \n- Confirmar **somente após validação da API**\n\n---\n\n## ❌ REMOVIDO DEFINITIVAMENTE DO PROMPT\n\n- Qualificação no chat  \n- Perguntas sobre profissão, tempo nos EUA ou idade  \n- Explicações longas sobre carreira ou consultoria  \n- Tentativa de “convencer” o lead  \n\n👉 **VOCÊ agenda.  \nMilton decide e converte.**",
              "type": "string"
            },
            {
              "id": "7c1cec03-5b93-4741-a15c-01ccaade24de",
              "name": "origem",
              "value": "Prompt F2 - Funil Tráfego Direto",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        5824,
        112
      ],
      "id": "3b55c15d-5bfc-440c-b3e3-9bae458eff54",
      "name": "PROMPT VALIDADO1"
    },
    {
      "parameters": {
        "jsCode": "// Coloque isso em um Code node antes do Convert to File\nconst url = $('Download áudio').first().json.photo_audio || '';\nlet extension = 'ogg'; // default para WhatsApp\n\n// Tenta extrair extensão da URL\nconst match = url.match(/\\.(\\w+)(?:\\?|$)/);\nif (match) {\n  extension = match[1];\n}\n\n// Mapeia extensões comuns\nconst mimeTypes = {\n  'ogg': 'audio/ogg',\n  'opus': 'audio/ogg',\n  'mp3': 'audio/mpeg',\n  'wav': 'audio/wav',\n  'm4a': 'audio/mp4',\n  'webm': 'audio/webm'\n};\n\nreturn {\n  json: {\n    ...$input.first().json,\n    fileName: `audio.${extension}`,\n    mimeType: mimeTypes[extension] || 'audio/ogg'\n  },\n  binary: $input.first().binary\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        2016,
        624
      ],
      "id": "46304ba7-cfa5-4564-8b88-14c815545683",
      "name": "Extrair a extensão"
    },
    {
      "parameters": {
        "jsCode": "const data = $input.first().json;\n\n// Extrair output\nlet outputText = '';\nif (typeof data.output === 'string') {\n  outputText = data.output;\n} else if (data.output?.messages?.[0]) {\n  outputText = data.output.messages[0];\n} else if (data.output) {\n  outputText = JSON.stringify(data.output);\n}\n\n// ========================================\n// GEMINI 2.5 PRO (Agente principal)\n// ========================================\nconst PRO_PROMPT_TOKENS = 10050;\nconst PRO_CHARS_POR_TOKEN = 3.4;\nconst PRO_PRECO_INPUT = 1.25;\nconst PRO_PRECO_OUTPUT = 5.00;\n\nconst proCompletionTokens = Math.ceil(outputText.length / PRO_CHARS_POR_TOKEN);\nconst proCustoInput = (PRO_PROMPT_TOKENS / 1000000) * PRO_PRECO_INPUT;\nconst proCustoOutput = (proCompletionTokens / 1000000) * PRO_PRECO_OUTPUT;\nconst proCustoTotal = proCustoInput + proCustoOutput;\n\n// ========================================\n// GEMINI 2.5 FLASH (Tool de chat)\n// ========================================\nconst FLASH_PROMPT_TOKENS = 553;\nconst FLASH_CHARS_POR_TOKEN = 1.6;\nconst FLASH_PRECO_INPUT = 0.15;\nconst FLASH_PRECO_OUTPUT = 0.60;\n\nconst flashCompletionTokens = Math.ceil(outputText.length / FLASH_CHARS_POR_TOKEN);\nconst flashCustoInput = (FLASH_PROMPT_TOKENS / 1000000) * FLASH_PRECO_INPUT;\nconst flashCustoOutput = (flashCompletionTokens / 1000000) * FLASH_PRECO_OUTPUT;\nconst flashCustoTotal = flashCustoInput + flashCustoOutput;\n\n// ========================================\n// TOTAL COMBINADO\n// ========================================\nconst custoTotalUSD = proCustoTotal + flashCustoTotal;\nconst custoTotalBRL = custoTotalUSD * 6;\n\nreturn {\n  json: {\n    output: outputText,\n    custo_pro: {\n      modelo: 'gemini-2.5-pro',\n      tokens_input: PRO_PROMPT_TOKENS,\n      tokens_output: proCompletionTokens,\n      custo_usd: parseFloat(proCustoTotal.toFixed(6))\n    },\n    custo_flash: {\n      modelo: 'gemini-2.5-flash',\n      tokens_input: FLASH_PROMPT_TOKENS,\n      tokens_output: flashCompletionTokens,\n      custo_usd: parseFloat(flashCustoTotal.toFixed(6))\n    },\n    custo_total: {\n      custo_usd: parseFloat(custoTotalUSD.toFixed(6)),\n      custo_brl: parseFloat(custoTotalBRL.toFixed(4)),\n      tipo: 'estimado'\n    }\n  }\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        10560,
        32
      ],
      "id": "5670828a-5e60-46b8-a0c9-0b22497ce5e1",
      "name": "Calcular Custo LLM"
    },
    {
      "parameters": {
        "method": "PUT",
        "url": "=https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-04-15"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"customFields\": [\n    {\n      \"id\": \"{{ $json.ativar_ia_id }}\",\n      \"value\": \"sim\"\n    }\n  ]\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        2496,
        -624
      ],
      "id": "095aef36-e92d-4856-b477-4417f2828e99",
      "name": "ativar_ia2",
      "disabled": true,
      "notes": "Atualiza o campo customizado work_permit no contato"
    },
    {
      "parameters": {
        "url": "=https://services.leadconnectorhq.com/locations/{{ $('Info').first().json.location_id }}/customFields",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1568,
        -1136
      ],
      "id": "e0508580-5760-49d6-ad2a-ae9064a3d09d",
      "name": "1️⃣ Listar campos customizados"
    },
    {
      "parameters": {
        "jsCode": "const infoNode = $('Info').first().json;\nconst inputData = $input.first().json;\n\n// ========== 1. EXTRAI CAMPOS CUSTOMIZADOS ==========\nlet customFields = [];\n\nif (inputData.customFields) {\n  customFields = inputData.customFields;\n} else if (Array.isArray(inputData) && inputData[0]?.customFields) {\n  customFields = inputData[0].customFields;\n}\n\nconst ativarIAField = customFields.find(f => f.fieldKey === \"contact.ativar_ia\");\nconst especialistaMotiveField = customFields.find(f => f.fieldKey === \"contact.contactmotive_responsavel\");\nconst objetivoLeadField = customFields.find(f => f.fieldKey === \"contact.objetivo_do_lead\");\n\n// Pega as opções válidas diretamente do picklist do GHL\nconst opcoesObjetivoValidas = (objetivoLeadField?.picklistOptions || []).filter(opt => opt !== 'x');\nconst opcoesEspecialistaValidas = especialistaMotiveField?.picklistOptions || [];\n\n// ========== 2. EXTRAI CONVERSATION ID ==========\nlet conversationId = null;\nlet contactId = infoNode.lead_id || null;\n\nif (inputData.conversations && inputData.conversations.length > 0) {\n  conversationId = inputData.conversations[0].id;\n  contactId = inputData.body?.contact_id || inputData.conversations[0].contactId || contactId;\n}\n\n// ========== 3. DETECTA OBJETIVO ==========\nfunction getString(valor) {\n  if (!valor) return '';\n  if (typeof valor === 'string') return valor;\n  if (typeof valor === 'object') {\n    return valor.text || valor.message || valor.content || '';\n  }\n  return String(valor);\n}\n\nconst mensagem = getString(infoNode.message || infoNode.body).toLowerCase();\nconst objetivoDoLead = getString(infoNode.objetivo_do_lead).toLowerCase();\nconst especialistaMotive = getString(infoNode.contactmotive_responsavel).toLowerCase();\nconst informacoesIA = getString(infoNode.informaes_para_ai).toLowerCase();\n\nconst keywordsCarreira = ['carreira', 'recrutamento', 'recrutar', 'vaga', 'emprego', 'trabalho', 'sdrcarreira', 'socialsellercarreira'];\nconst keywordsConsultoria = ['consultoria', 'consultor', 'mentor', 'mentoria', 'sdrconsultoria', 'socialsellerconsultoria'];\n\nfunction contemKeyword(texto, keywords) {\n  return keywords.some(kw => texto.includes(kw));\n}\n\nfunction detectarObjetivo(texto) {\n  if (contemKeyword(texto, keywordsCarreira)) return 'carreira';\n  if (contemKeyword(texto, keywordsConsultoria)) return 'consultoria';\n  return null;\n}\n\n// Mapeamento objetivo → especialista\nfunction getEspecialista(objetivo) {\n  if (objetivo === 'carreira') return 'sdrcarreira';\n  if (objetivo === 'consultoria') return 'sdrconsultoria';\n  return '';\n}\n\nconst textoCompleto = `${mensagem} ${objetivoDoLead} ${especialistaMotive} ${informacoesIA}`;\n\nconst regexTeste = /\\/teste\\s+(carreira|recrutamento|consultoria|consultor|mentor)/i;\nconst matchTeste = mensagem.match(regexTeste);\n\nlet resultado = 'indefinido';\nlet especialistaDefinido = '';\nlet objetivoDefinido = '';\nlet fonteDeteccao = 'nenhuma';\n\n// Prioridade 1: Comando /teste na mensagem\nif (matchTeste) {\n  const objetivoDetectado = detectarObjetivo(matchTeste[1].toLowerCase());\n  if (objetivoDetectado && opcoesObjetivoValidas.includes(objetivoDetectado)) {\n    resultado = objetivoDetectado;\n    especialistaDefinido = getEspecialista(objetivoDetectado);\n    objetivoDefinido = objetivoDetectado;\n    fonteDeteccao = 'comando_teste';\n  }\n}\n\n// Prioridade 2: Campo objetivo_do_lead já preenchido COM VALOR VÁLIDO\nif (resultado === 'indefinido' && objetivoDoLead && opcoesObjetivoValidas.includes(objetivoDoLead)) {\n  resultado = objetivoDoLead;\n  especialistaDefinido = getEspecialista(objetivoDoLead);\n  objetivoDefinido = objetivoDoLead;\n  fonteDeteccao = 'campo_objetivo';\n}\n\n// Prioridade 3: Especialista já definido\nif (resultado === 'indefinido' && especialistaMotive) {\n  const objetivoDetectado = detectarObjetivo(especialistaMotive);\n  if (objetivoDetectado && opcoesObjetivoValidas.includes(objetivoDetectado)) {\n    resultado = objetivoDetectado;\n    especialistaDefinido = getEspecialista(objetivoDetectado);\n    objetivoDefinido = objetivoDetectado;\n    fonteDeteccao = 'campo_especialista';\n  }\n}\n\n// Prioridade 4: Análise do texto completo\nif (resultado === 'indefinido') {\n  const objetivoDetectado = detectarObjetivo(textoCompleto);\n  if (objetivoDetectado && opcoesObjetivoValidas.includes(objetivoDetectado)) {\n    resultado = objetivoDetectado;\n    especialistaDefinido = getEspecialista(objetivoDetectado);\n    objetivoDefinido = objetivoDetectado;\n    fonteDeteccao = 'analise_texto';\n  }\n}\n\n// ========== RETORNA TUDO ==========\nreturn [{\n  json: {\n    // IDs dos campos\n    ativar_ia_id: ativarIAField?.id || null,\n    especialista_motive_id: especialistaMotiveField?.id || null,\n    objetivo_lead_id: objetivoLeadField?.id || null,\n    \n    // IDs da conversa\n    conversationId: conversationId,\n    contactId: contactId,\n    \n    // Resultado da detecção\n    resultado: resultado,\n    especialista_motive: especialistaDefinido,\n    objetivo_lead: objetivoDefinido,\n    fonte_deteccao: fonteDeteccao,\n    precisa_perguntar: resultado === 'indefinido',\n    mensagem_original: mensagem,\n    \n    // Debug - opções válidas do GHL\n    opcoes_objetivo_validas: opcoesObjetivoValidas,\n    opcoes_especialista_validas: opcoesEspecialistaValidas\n  }\n}];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1792,
        -1136
      ],
      "id": "0f6d252b-a978-4d33-93d6-fb399f55ff17",
      "name": "2️⃣ Extrair IDs dos campos"
    },
    {
      "parameters": {
        "jsCode": "const infoNode = $('Info').first().json;\nconst inputData = $input.first().json;\n\n// ========== 1. EXTRAI CAMPOS CUSTOMIZADOS ==========\nlet customFields = [];\n\nif (Array.isArray(inputData)) {\n  customFields = inputData[0]?.customFields || [];\n} else if (inputData.customFields) {\n  customFields = inputData.customFields;\n}\n\nconst ativarIAField = customFields.find(f => f.fieldKey === \"contact.ativar_ia\");\nconst especialistaMotiveField = customFields.find(f => f.fieldKey === \"contact.contactmotive_responsavel\");\nconst objetivoLeadField = customFields.find(f => f.fieldKey === \"contact.objetivo_do_lead\");\n\n// Pega APENAS opções válidas do GHL (filtra 'x' e vazios)\nconst opcoesObjetivoValidas = (objetivoLeadField?.picklistOptions || []).filter(opt => opt && opt.toLowerCase() !== 'x');\nconst opcoesEspecialistaValidas = (especialistaMotiveField?.picklistOptions || []).filter(opt => opt && opt.toLowerCase() !== 'x');\n\n// ========== 2. EXTRAI CONVERSATION ID E SOURCE ==========\nlet conversationId = null;\nlet contactId = infoNode.lead_id || null;\nlet source = (infoNode.source || infoNode.channel || '').toLowerCase();\n\nif (inputData.conversations && inputData.conversations.length > 0) {\n  conversationId = inputData.conversations[0].id;\n  contactId = inputData.body?.contact_id || inputData.conversations[0].contactId || contactId;\n}\n\n// ========== 3. DETECTA OBJETIVO ==========\nfunction getString(valor) {\n  if (!valor) return '';\n  if (typeof valor === 'string') return valor;\n  if (typeof valor === 'object') {\n    return valor.text || valor.message || valor.content || '';\n  }\n  return String(valor);\n}\n\nconst mensagem = getString(infoNode.message || infoNode.body).toLowerCase();\nconst objetivoDoLead = getString(infoNode.objetivo_do_lead).toLowerCase();\nconst especialistaMotive = getString(infoNode.contactmotive_responsavel).toLowerCase();\nconst informacoesIA = getString(infoNode.informaes_para_ai).toLowerCase();\n\nconst keywordsCarreira = ['carreira', 'recrutamento', 'recrutar', 'vaga', 'emprego', 'trabalho'];\nconst keywordsConsultoria = ['consultoria', 'consultor', 'mentor', 'mentoria'];\n\nfunction contemKeyword(texto, keywords) {\n  return keywords.some(kw => texto.includes(kw));\n}\n\nfunction detectarObjetivo(texto) {\n  if (contemKeyword(texto, keywordsCarreira)) return 'carreira';\n  if (contemKeyword(texto, keywordsConsultoria)) return 'consultoria';\n  return null;\n}\n\nfunction getEspecialista(objetivo) {\n  if (objetivo === 'carreira') return 'sdrcarreira';\n  if (objetivo === 'consultoria') return 'sdrconsultoria';\n  return '';\n}\n\n// Verifica se opções válidas existem no GHL\nconst temOpcoesValidas = opcoesObjetivoValidas.length > 0;\n\nconst textoCompleto = `${mensagem} ${objetivoDoLead} ${especialistaMotive} ${informacoesIA}`;\n\nconst regexTeste = /\\/teste\\s+(carreira|recrutamento|consultoria|consultor|mentor)/i;\nconst matchTeste = mensagem.match(regexTeste);\n\nlet resultado = 'indefinido';\nlet especialistaDefinido = '';\nlet objetivoDefinido = '';\nlet fonteDeteccao = 'nenhuma';\n\n// SÓ DETECTA SE TIVER OPÇÕES VÁLIDAS NO GHL\nif (temOpcoesValidas) {\n  \n  // Prioridade 1: Comando /teste na mensagem\n  if (matchTeste) {\n    const objetivoDetectado = detectarObjetivo(matchTeste[1].toLowerCase());\n    if (objetivoDetectado && opcoesObjetivoValidas.includes(objetivoDetectado)) {\n      resultado = objetivoDetectado;\n      especialistaDefinido = getEspecialista(objetivoDetectado);\n      objetivoDefinido = objetivoDetectado;\n      fonteDeteccao = 'comando_teste';\n    }\n  }\n\n  // Prioridade 2: Campo objetivo_do_lead já preenchido COM VALOR VÁLIDO\n  if (resultado === 'indefinido' && objetivoDoLead && opcoesObjetivoValidas.includes(objetivoDoLead)) {\n    resultado = objetivoDoLead;\n    especialistaDefinido = getEspecialista(objetivoDoLead);\n    objetivoDefinido = objetivoDoLead;\n    fonteDeteccao = 'campo_objetivo';\n  }\n\n  // Prioridade 3: Especialista já definido\n  if (resultado === 'indefinido' && especialistaMotive) {\n    const objetivoDetectado = detectarObjetivo(especialistaMotive);\n    if (objetivoDetectado && opcoesObjetivoValidas.includes(objetivoDetectado)) {\n      resultado = objetivoDetectado;\n      especialistaDefinido = getEspecialista(objetivoDetectado);\n      objetivoDefinido = objetivoDetectado;\n      fonteDeteccao = 'campo_especialista';\n    }\n  }\n\n  // Prioridade 4: Análise do texto completo\n  if (resultado === 'indefinido') {\n    const objetivoDetectado = detectarObjetivo(textoCompleto);\n    if (objetivoDetectado && opcoesObjetivoValidas.includes(objetivoDetectado)) {\n      resultado = objetivoDetectado;\n      especialistaDefinido = getEspecialista(objetivoDetectado);\n      objetivoDefinido = objetivoDetectado;\n      fonteDeteccao = 'analise_texto';\n    }\n  }\n}\n\n// ========== RETORNA TUDO ==========\nreturn [{\n  json: {\n    // IDs dos campos\n    ativar_ia_id: ativarIAField?.id || null,\n    especialista_motive_id: especialistaMotiveField?.id || null,\n    objetivo_lead_id: objetivoLeadField?.id || null,\n    \n    // IDs da conversa\n    conversationId: conversationId,\n    contactId: contactId,\n    source: source,\n    \n    // Resultado da detecção\n    resultado: resultado,\n    especialista_motive: especialistaDefinido,\n    objetivo_lead: objetivoDefinido,\n    fonte_deteccao: fonteDeteccao,\n    precisa_perguntar: resultado === 'indefinido',\n    mensagem_original: mensagem,\n    \n    // Debug\n    opcoes_ghl_validas: opcoesObjetivoValidas,\n    tem_opcoes_validas: temOpcoesValidas\n  }\n}];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        2016,
        -1136
      ],
      "id": "3120d9d4-b751-45da-82e8-8b75a0f99e6b",
      "name": "3️⃣ Detectar Objetivo"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.resultado }}",
                    "rightValue": "carreira",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "76eef0e3-72b2-4beb-8523-04aca6b0f026"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Carreira"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.resultado }}",
                    "rightValue": "consultoria",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "68e4057a-3f5f-4b5e-990c-52b9618888a4"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Consultoria"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.resultado }}",
                    "rightValue": "indefinido",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "cb77dbef-ac1e-4b2a-a6f0-f011e353e870"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Indefinido"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        2240,
        -1152
      ],
      "id": "9993ac7c-0323-4e87-893d-3c0a5a1d9c43",
      "name": "4️⃣ Switch Objetivo"
    },
    {
      "parameters": {
        "method": "PUT",
        "url": "=https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-04-15"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"customFields\": [\n    {\n      \"id\": \"{{ $('3️⃣ Detectar Objetivo').first().json.especialista_motive_id }}\",\n      \"value\": \"sdrcarreira\"\n    },\n    {\n      \"id\": \"{{ $('3️⃣ Detectar Objetivo').first().json.objetivo_lead_id }}\",\n      \"value\": \"carreira\"\n    },\n    {\n      \"id\": \"{{ $('3️⃣ Detectar Objetivo').first().json.ativar_ia_id }}\",\n      \"value\": \"sim\"\n    }\n  ]\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        2464,
        -1328
      ],
      "id": "07c49aef-021f-4cfd-9606-5aa680dfac0b",
      "name": "5️⃣ Atualizar → Carreira"
    },
    {
      "parameters": {
        "method": "PUT",
        "url": "=https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-04-15"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"customFields\": [\n    {\n      \"id\": \"{{ $('3️⃣ Detectar Objetivo').first().json.especialista_motive_id }}\",\n      \"value\": \"sdrconsultoria\"\n    },\n    {\n      \"id\": \"{{ $('3️⃣ Detectar Objetivo').first().json.objetivo_lead_id }}\",\n      \"value\": \"consultoria\"\n    },\n    {\n      \"id\": \"{{ $('3️⃣ Detectar Objetivo').first().json.ativar_ia_id }}\",\n      \"value\": \"sim\"\n    }\n  ]\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        2464,
        -1136
      ],
      "id": "5120a9ea-740f-4f5f-bfde-6b5b28cc6591",
      "name": "5️⃣ Atualizar → Consultoria"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://services.leadconnectorhq.com/conversations/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"type\": \"SMS\",\n  \"contactId\": \"{{ $('Info').first().json.lead_id }}\",\n  \"message\": \"Olá! Para continuar, preciso saber seu objetivo. Por favor, responda:\\n\\n/teste carreira - para oportunidades de emprego\\n/teste consultoria - para serviços de consultoria\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        2688,
        -1040
      ],
      "id": "15d1509b-62ac-4e6f-b06a-eef93b5ad56f",
      "name": "5️⃣ Perguntar Objetivo (SMS)"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "whatsapp",
                    "rightValue": "={{ $json.source }}",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "352c182d-185b-4c4f-a3f3-75d44c4677a9"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Whatsapp"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "instagram",
                    "rightValue": "={{ $json.source }}",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "7bb23146-c9ac-4b2e-9dc6-64686e434e7f"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Instagram"
            }
          ]
        },
        "looseTypeValidation": true,
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        2464,
        -944
      ],
      "id": "03c01888-2538-4a48-a797-149418919738",
      "name": "Canal4"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://services.leadconnectorhq.com/conversations/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "={{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"type\": \"IG\",\n \"contactId\": \"{{ $('Info').first().json.lead_id }}\",\n  \"message\": \"Olá! Para continuar, preciso saber seu objetivo. Por favor, responda:\\n\\n/teste carreira - para oportunidades de emprego\\n/teste consultoria - para serviços de consultoria\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        2688,
        -848
      ],
      "id": "d856afe3-98e4-45c3-94a9-eb695c6795bc",
      "name": "Instagram4",
      "retryOnFail": true
    },
    {
      "parameters": {
        "operation": "upsert",
        "schema": {
          "__rl": true,
          "mode": "list",
          "value": "public"
        },
        "table": {
          "__rl": true,
          "value": "n8n_historico_mensagens",
          "mode": "name"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {},
          "matchingColumns": [
            "id"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "number",
              "canBeUsedToMatch": true
            },
            {
              "id": "session_id",
              "displayName": "session_id",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "message",
              "displayName": "message",
              "required": true,
              "defaultMatch": false,
              "display": true,
              "type": "object",
              "canBeUsedToMatch": false
            },
            {
              "id": "message_hash",
              "displayName": "message_hash",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "string",
              "canBeUsedToMatch": true
            },
            {
              "id": "created_at",
              "displayName": "created_at",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "type": "dateTime",
              "canBeUsedToMatch": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        2944,
        -624
      ],
      "id": "db781f06-0590-4338-b197-769b4243b4bb",
      "name": "Resetar status atendimento",
      "alwaysOutputData": false,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "disabled": true
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "c1347694-76f6-44df-888e-74ee5d651820",
              "name": "prompt",
              "value": "=# OBJETIVO\n\n- Garantir o comparecimento e maximizar o valor da reunião agendada.\n- Manter o lead engajado e aquecido, reforçando a importância do compromisso firmado.\n- Gerenciar dúvidas e objeções que surjam no período entre o agendamento e a reunião.\n- Remarcar ou cancelar reuniões de forma eficiente e cordial, preservando o relacionamento com o lead.\n\n---\n\n# SOBRE O MOMENTO PÓS-AGENDAMENTO\n\n### O QUE É\nEsta fase começa imediatamente após a confirmação do agendamento enviada pelo fluxo anterior. A IA agora assume um papel de suporte e manutenção do relacionamento, garantindo que a transição do agendamento para a reunião seja a mais suave possível.\n\n### PRINCIPAL MUDANÇA DE FOCO\nO objetivo muda de \"agendar\" para \"garantir o comparecimento e preparar o lead\". A comunicação deve ser mais passiva e reativa, agindo com base nas mensagens do lead, mas sempre com o objetivo de reforçar o valor da conversa agendada.\n\n### RECURSOS\nA IA ainda tem acesso a todas as informações sobre **Carreira de Agente Financeiro** e **Consultoria** para tirar dúvidas. As ferramentas de `Busca_disponibilidade` e `Agendar_reuniao` são essenciais para o processo de reagendamento.\n\n---\n\n# SOP (Procedimento Operacional Padrão) - Pós-Agendamento\n\nO fluxo é ativado quando um lead, que já possui uma reunião agendada, envia uma nova mensagem. O primeiro passo é sempre analisar a intenção da mensagem do lead.\n\n## PASSO 1: ANÁLISE DE INTENÇÃO\n\nA IA deve primeiro identificar o propósito da mensagem do lead, que geralmente se enquadra em um dos seguintes cenários:\n\n- **Cenário A:** O lead tem uma dúvida sobre a carreira, a consultoria ou a própria reunião.\n- **Cenário B:** O lead precisa remarcar a reunião.\n- **Cenário C:** O lead deseja cancelar a reunião.\n- **Cenário D:** É uma mensagem aleatória ou uma simples confirmação (ex: \"Ok, obrigado!\").\n\n## PASSO 2: TRATAMENTO POR CENÁRIO\n\n### TRATAMENTO DO CENÁRIO A: DÚVIDA OU PERGUNTA\n\n- **Ação:** Responder de forma clara e objetiva, utilizando o conhecimento das seções \"SOBRE A CARREIRA DE AGENTE FINANCEIRO\" e \"RECURSOS DA CARREIRA\" do prompt anterior.\n- **Script de Resposta:**\n    > `Claro, {{ $('Info').first().json.first_name }}! Ótima pergunta. Sobre [tópico da dúvida], funciona assim... [resposta clara e concisa].`\n- **Finalização e Reafirmação:** Após esclarecer a dúvida, sempre reforce o compromisso.\n    > `Ficou mais claro agora? Se tiver mais alguma dúvida, pode me mandar. Nosso papo em [dia da reunião], às [horário da reunião], está mantido, ok? Até lá!`\n\n### TRATAMENTO DO CENÁRIO B: PEDIDO DE REAGENDAMENTO\n\n- **Ação:** Mostrar empatia e iniciar imediatamente o processo para encontrar um novo horário.\n- **Script de Acolhimento:**\n    > `Sem problemas, {{ $('Info').first().json.first_name }}! Imprevistos acontecem. Agradeço muito por avisar com antecedência. Vamos encontrar um novo horário que funcione melhor para você.`\n- **Processo de Reagendamento:**\n    1.  Utilize a ferramenta `Busca_disponibilidade` para encontrar novos horários vagos.\n    2.  Ofereça 2 novas opções para o lead. Ex: `“Tenho um horário na terça às 15h ou na quarta às 11h (NY). Qual fica melhor para você?”`\n    3.  Após a escolha, utilize a ferramenta `Agendar_reuniao` com os novos dados (dia e hora).\n    4.  Envie a confirmação final, usando o mesmo script do fluxo anterior: `“Perfeito, {{ $('Info').first().json.first_name }}! Reunião reagendada. Vou te enviar os detalhes por e-mail e WhatsApp, ok?”`\n\n### TRATAMENTO DO CENÁRIO C: PEDIDO DE CANCELAMENTO\n\n- **Ação:** Tentar entender o motivo de forma sutil, sem pressionar, e deixar a porta aberta.\n- **Script de Sondagem:**\n    > `Entendi, {{ $('Info').first().json.first_name }}. Agradeço por me comunicar. Se não for incômodo perguntar, o cancelamento é por causa do horário ou o interesse no assunto mudou? Pergunto apenas para entender como podemos ajudar melhor no futuro.`\n- **Lógica Condicional:**\n    - **Se a resposta for sobre o horário:** Ofereça a opção de reagendamento, retornando ao fluxo do Cenário B.\n    - **Se a resposta for sobre mudança de interesse:** Agradeça e finalize cordialmente. `“Entendido. Respeito sua decisão. Se no futuro este tema voltar a ser uma prioridade, as portas estarão abertas. Sucesso para você!”`\n\n### TRATAMENTO DO CENÁRIO D: FECHAMENTO DA CONVERSA\n\n**REGRA:** Responder NO MÁXIMO 1 vez após confirmação do agendamento.\n\nSe já enviou confirmação do agendamento e lead responde com agradecimento/ok:\n\n→ **Dar fechamento caloroso e ENCERRAR:**\n→ **Dar fechamento caloroso e ENCERRAR:**\n- \"Forte abraço, {{ $('Info').first().json.first_name }}! Se cuida e até nossa conversa\"\n- \"Vai ser incrível. Fica com Deus e até lá!\"\n- \"Você vai amar a conversa. Abraço grande!\"\n- \"Animada pra nossa conversa! Abraço e fica com Deus\"\n- \"Vai valer muito a pena, {{ $('Info').first().json.first_name }}. Confia!\"\n\n**Se lead responder NOVAMENTE após esse fechamento:**\n→ Enviar apenas emoji: 🙏🏻 ou 😌 ou 🤗\n\n⚠️ **PROIBIDO chamar ferramentas neste cenário.**\n\n**EXCEÇÃO - responder apenas se:**\n- Lead fez PERGUNTA direta\n- Lead pediu reagendamento/cancelamento\n- Lead trouxe dúvida ou problema",
              "type": "string"
            },
            {
              "id": "7c1cec03-5b93-4741-a15c-01ccaade24de",
              "name": "origem",
              "value": "Prompt Concierge",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        5824,
        896
      ],
      "id": "ef45adce-4f39-4d1e-8744-a030340a3d17",
      "name": "Concierge"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "c1347694-76f6-44df-888e-74ee5d651820",
              "name": "prompt",
              "value": "=## CONTEXTO DO LEAD (JÁ IDENTIFICADO)\nOBJETIVO: {{ $('Info').first().json.objetivo_do_lead }}\nWORK PERMIT: {{ $('Info').first().json.work_permit || 'não informado' }}\nESTADO: {{ $('Info').first().json.state || 'não informado' }}\n\n---\n\n## ⚠️ REGRA CRÍTICA - VALIDAÇÃO DE WORK PERMIT (FUNIL CARREIRA)\n\n**ANTES de oferecer horários de CARREIRA:**\n1. SEMPRE perguntar: \"Você já tem permissão de trabalho (work permit) nos EUA?\"\n2. Se NÃO tem Work Permit → OBRIGATÓRIO redirecionar para CONSULTORIA\n3. NUNCA agendar reunião de carreira para lead SEM Work Permit\n\n**Se work_permit no contexto = 'não' ou 'não informado':**\n→ OBRIGATÓRIO validar antes de prosseguir com agendamento de carreira\n→ Se confirmar que NÃO tem → Redirecionar para consultoria financeira\n\n---\n\n## ⚠️ REGRA CRÍTICA - NOME DO LEAD\n\n**Se precisar usar o nome do lead:**\n- Extraia do histórico da conversa (como o lead se apresentou)\n- Se não souber o nome, NÃO invente - use frases sem nome\n- NUNCA confie cegamente em dados do sistema que podem estar incorretos\n\n---\n\n## ⚠️ REGRA DE ENCERRAMENTO PÓS-AGENDAMENTO\n\n**APÓS CONFIRMAR AGENDAMENTO:**\n1. Envie a confirmação: \"Valeu! Registrei: [dia], às [hora] (NY).\"\n2. Se lead responder \"ok\", \"obrigado\", \"valeu\", \"👍\" → Feche com UMA mensagem calorosa e PARE\n3. Se lead responder NOVAMENTE após fechamento → Envie APENAS emoji: 🙏🏻 ou 😌\n\n**PROIBIDO continuar conversa após lead agradecer o agendamento confirmado.**\n**NÃO faça novas perguntas após o fechamento.**\n\n---\n\n⚠️ REGRA: Se objetivo_do_lead = \"carreira\", NÃO pergunte se quer carreira ou consultoria. Vá direto para qualificação (estado + work permit).\n\n\n## OBJETIVO\n\n- Atendimento consultivo, humanizado e eficiente conforme usuário responsável  \n- Identificar se o lead quer Consultoria Financeira ou Carreira de Agente  \n- Redirecionar leads de Carreira sem Work Permit para Consultoria  \n- Agendar, remarcar ou cancelar reuniões estratégicas com agilidade  \n- Responder dúvidas frequentes sobre carreira e consultoria  \n- Guiar o lead com linguagem clara e acolhedora  \n- Confirmar número brasileiro e orientar uso do \"9\" se não tiver WhatsApp\n\n---\n\n## SOBRE A CARREIRA DE AGENTE FINANCEIRO – INFORMAÇÕES COMPLETAS\n\n### O QUE É A CARREIRA DE AGENTE FINANCEIRO\n\nCarreira para brasileiros legalizados nos EUA, com licença estadual, ajudando famílias a proteger e multiplicar patrimônio. Liberdade, alta renda, impacto social e demanda alta.\n\n### PRINCIPAIS DIFERENCIAIS\n\n- Liberdade geográfica  \n- Renda escalável  \n- Alta demanda entre brasileiros nos EUA  \n- Sem exigência de experiência  \n- Licença oficial do estado (não marketing multinível)  \n- Trabalho com propósito\n\n---\n\n## RECURSOS DA CARREIRA – DETALHADOS\n\n### 1. PROCESSO DE LICENCIAMENTO  \n- Suporte para licença estadual (Life & Health)  \n- Treinamento online em português  \n- Processo simples, parecido com tirar CNH  \n- Pode ser paralelo a outro trabalho\n\n### 2. TREINAMENTO E DESENVOLVIMENTO  \n- Treinamentos semanais e mentorias  \n- Comunidade ativa e conteúdo atualizado  \n- Trilhas para iniciantes e líderes\n\n### 3. PROSPECÇÃO E POSICIONAMENTO DIGITAL  \n- Estratégias de social selling  \n- Scripts e funis validados  \n- Suporte Instagram, WhatsApp e CRM\n\n### 4. FERRAMENTAS DE GESTÃO E APRESENTAÇÃO  \n- Simuladores e projeções financeiras  \n- CRM e acompanhamento  \n- Suporte técnico\n\n### 5. FORMAÇÃO DE EQUIPE E ESCALABILIDADE  \n- Recrutamento e liderança  \n- Bonificação por equipe (override)  \n- Reconhecimento e crescimento\n\n---\n\n## PLANOS E SERVIÇOS DISPONÍVEIS\n\nEncaminhar para atendimento humano caso o lead solicite:  \n- Custos/licenciamento  \n- Comissões e ganhos  \n- Produtos (seguros, aposentadoria, college plan)  \n- Suporte para início imediato\n\n---\n\n## SOP (Procedimento Operacional Padrão)\n\n### FLUXO DE QUALIFICAÇÃO\n\n#### PARA CONSULTORIA FINANCEIRA  \n1. Pergunte UMA coisa por vez: profissão, tempo nos EUA, data de nascimento para projeção patrimonial.  \n2. Liste horários disponíveis.  \n3. Colete email e WhatsApp (se não tiver).  \n4. Efetive agendamento, confirme envio do email.\n\n#### PARA CARREIRA DE AGENTE FINANCEIRO  \n1. Pergunte UMA coisa por vez: estado e se possui Work Permit.\n\n2. Se possui Work Permit:  \n- \"Maravilha! Vamos marcar papo no Zoom. Agenda cheia, mas vou tentar te encaixar...\"  \n- Ofereça 2 horários no dia atual, citando data e hora.\n\n### TRATAMENTO PARA USUÁRIOS SEM WORK PERMIT\n\n3. Se NÃO possui Work Permit e quer Carreira:  \n- Ofereça Consultoria Financeira Gratuita.  \n- Se aceitar, qualifique (profissão, tempo, nascimento) e liste horários.  \n- Se recusar, agradeça e encerre.\n\n## QUALIFICAÇÃO – LEAD SEM WORK PERMIT\n\n### Quando usar\nSe identificar que o lead NÃO possui Work Permit, conduza este fluxo de consultoria gratuita (não é vaga de carreira). Objetivo: qualificar e, se elegível, agendar consultoria com especialista.\n\n### Roteiro (mensagens curtas)\n1) Posicionamento inicial  \n\"Entendi. Então você ainda não tem o work permit, certo? Eu iria te mostrar uma oportunidade de fazer um extra com liberdade, mas sem o permit o melhor caminho agora é um planejamento estratégico pra proteger sua renda aqui nos EUA, mesmo sem status definido.\"\n\n2) Explicação da consultoria  \n\"Quero te presentear com uma consultoria online gratuita, comigo ou com um especialista da equipe. É pra entender seu momento e te mostrar opções reais de proteção e organização financeira, mesmo sem o permit. A conversa é 100% gratuita, mas as estratégias exigem um investimento mensal. Hoje faz sentido pra você investir na sua segurança e futuro financeiro?\"\n\n3) Validação de possibilidade de investimento (se perguntarem preço)  \n\"Pra ter ideia, os planos começam em:  \n- $50/mês para proteção de crianças e jovens (15 dias de vida a 35 anos)  \n- $200/mês para futuro dos adultos (30 a 55 anos)  \n- $100/mês para planos pro futuro das crianças (College)  \nSe fizer sentido, você estaria disposto(a) a começar nessa faixa?\"\n\n→ Se não topar investimento: encerre gentilmente (ver Encerramento) e agende follow-up leve.  \n→ Se topar: prossiga Qualificação.\n\n### Perguntas de qualificação (checklist)\nMarque internamente (sem listar tudo pro lead de uma vez; pergunte de forma natural):\n1. Idade (converter para faixa): __  \n2. Mora nos EUA: sozinho(a) / com família  \n   - Se família: quantos integrantes? Todos trabalham? Filhos menores de 18? quantos?  \n3. Trabalho atual: sim/não e com o quê  \n4. Disposição de investimento mensal: sim/não e valor aproximado  \n5. Observações: anote contexto relevante (profissão, renda única, responsabilidades etc.)\n\n### Critérios de qualificação (consultoria)\n- Faixa etária: 25–55 anos preferencial (avaliar exceções com bom fit)  \n- Investimento:  \n  - Seguro de Vida: $50+ (jovem 25–35) / $50+ (adulto 30+)  \n  - Aposentadoria: $100 (criança 1–30) / $200 (adulto 30–55)  \n- Contexto familiar: avaliar capacidade/necessidade (sozinho = 1 renda p/ 1 pessoa; com família = responsabilidades e proteção)\n\n→ Se QUALIFICADO: encaminhar para CONSULTORIA.  \n→ Se NÃO QUALIFICADO: Encerramento.\n\n### Encaminhamento (se qualificado)\n\"Ótimo, pelo que você me contou, faz sentido seguir com a consultoria. Vou checar os horários com um especialista e te passo 1 dia e 2 opções pra escolher, pode ser?\"\n\n---\n\n## SOCIAL SELLING - ESSENCIAIS\n\n1. Aborde como quem observa vitrine\n2. Venda invisível - conecte antes\n3. Educação + Desapego + Interesse genuíno\n4. Objetivo: agendar reunião\n5. Mensagens curtas = mais resposta\n6. Personalize com dados do perfil\n7. Finalize com pergunta/sugestão sutil\n\n---\n\n## RAPPORT E CONEXÃO\n\n**1. Rapport**  \n- Nunca volte direto pro convite de reunião.  \n- Reabra com pergunta leve e pessoal (família, trabalho, rotina ou algo já citado pelo lead).  \n- Ex.: \"Que bom falar contigo de novo! Como andam as coisas no trabalho?\"  \n\n**2. Conexão**  \n- Só responda ao que o lead compartilhou.  \n- Engaje de forma natural: validar, elogiar, rir junto ou compartilhar algo parecido.  \n- Regra: frases como \"Imagino mesmo!\" ou \"Aqui tá parecido\" **só podem ser usadas se o lead respondeu no momento e deu contexto**.  \n- É **proibido** usar esse tipo de frase em follow-up frio (quando o lead ainda não respondeu).  \n\n**3. Convite**  \n- Depois de 1–2 trocas de rapport, conduza suavemente para o agendamento.  \n- Ex.: \"Fulano, sei que a correria pega pra todo mundo… bora marcar uma call rápida só pra gente se conhecer melhor? Amanhã consigo às [hora AM] ou [hora PM], qual fica melhor pra vc?\" \n\n\n---\n\n---\n\n## QUEBRA DE OBJEÇÕES - MÉTODO ERIC WORRE (GO PRO)\n\n### PRINCÍPIOS FUNDAMENTAIS\n\n1. **FEEL, FELT, FOUND** - A fórmula de ouro para todas objeções\n2. **Nunca se defenda** - Objeção não é ataque pessoal\n3. **Faça perguntas, não discursos** - Deixe o lead se convencer\n4. **Eduque ANTES da objeção** - Previna ao invés de remediar\n5. **Seja consultor, não vendedor** - Mude sua postura\n6. **Entenda a origem** - 90% vem de experiência ruim ou história de terceiros\n\n### FÓRMULA UNIVERSAL: FEEL, FELT, FOUND\n\n**Estrutura em 3 passos:**\n1. **FEEL (Validar)**: \"Entendo como você se sente...\"\n2. **FELT (Conectar)**: \"Muita gente se sentiu assim também...\"\n3. **FOUND (Resolver)**: \"Mas o que descobriram foi...\"\n\n**Por que funciona:**\n- Move a objeção do presente (feel) para o passado (felt)\n- Cria identificação com outros que tiveram sucesso (prova social)\n- Abre espaço para nova perspectiva (found)\n\n---\n\n## OBJEÇÕES ESPECÍFICAS - CARREIRA DE AGENTE FINANCEIRO\n\n### 1️⃣ \"ISSO É PIRÂMIDE?\"\n\n**Método Eric Worre - Nunca se defenda, eduque:**\n\n\"[Nome], entendo perfeitamente seu receio. MUITA gente pensou a mesma coisa quando ouviu falar pela primeira vez. Eu também tive essa dúvida no início.\n\nMas olha o que eu descobri: pirâmide é ILEGAL, certo? Não pode existir. O governo fecha. Aqui a gente tá falando de uma LICENÇA PROFISSIONAL emitida pelo estado, tipo médico, advogado, corretor de imóveis.\n\nQuer ver a diferença? \n\n[PAUSA - deixe o silêncio trabalhar]\n\nPirâmide: você ganha recrutando pessoas, certo? Não tem produto, não tem serviço. É só dinheiro trocando de mão.\n\nAgente Financeiro Licenciado: você ganha ATENDENDO CLIENTES reais que precisam de proteção financeira. E pra isso, você precisa estudar, passar numa prova estadual e tirar uma licença. Se fosse pirâmide, o governo não dava licença, concorda?\n\nPosso te fazer uma pergunta? Vc conhece algum médico ou advogado que tem equipe e ganha sobre o trabalho da equipe dele? Pois é... ninguém chama de pirâmide, né? É a mesma estrutura aqui.\"\n\n**Se continuar resistente:**\n\"Olha, [nome], sem pressão nenhuma. Mas a call vai te mostrar EXATAMENTE como funciona - a licença, os órgãos que regulam, tudo. Melhor do que eu ficar tentando explicar por texto. Você perde algo em tirar 45min pra entender direito?\"\n\n---\n\n### 2️⃣ \"É PRA VENDER SEGURO?\"\n\n**Método Eric Worre - Reformule a profissão:**\n\n\"[Nome], eu sei exatamente o que passou na sua cabeça agora. Eu também pensei assim... 'Ah não, vender seguro de porta em porta, aqueles caras chatos.'\n\nMas ó o que eu descobri: aqui a gente não é VENDEDOR de seguro. A gente é CONSULTOR FINANCEIRO licenciado. É bem diferente.\n\nDeixa eu te explicar...\n\nVendedor de seguro: empurra produto, bate de porta em porta, tenta 'fechar' qualquer um.\n\nAgente Financeiro Licenciado: faz ANÁLISE COMPLETA da situação da pessoa - proteção, aposentadoria, investimento, college plan pros filhos. É consultoria, tipo planejador financeiro.\n\nPergunta sincera: você conhece alguém que trabalha de casa, escolhe o próprio horário, ganha em DÓLAR e fatura 10k, 15k, 20k+ por mês sendo 'vendedor de seguro'? \n\nNão, né? Porque não É vendedor. É profissional de alto nível. Por isso exige licença estadual.\n\nA call vai te mostrar a diferença. Vale 45min pra entender?\"\n\n**Se insistir no preconceito:**\n\"Olha, [nome], eu entendo o preconceito. Mas me responde uma coisa: você prefere ficar com a ideia que tem na cabeça, ou conhecer a realidade? Porque a realidade é BEM diferente do que você tá pensando. Sem compromisso. Só conversa. Depois você decide.\"\n\n---\n\n### 3️⃣ \"É EMPREGO FIXO?\" / \"TEM CARTEIRA ASSINADA?\"\n\n**Método Eric Worre - Questione a mentalidade CLT:**\n\n\"[Nome], entendo sua busca por estabilidade. Brasileiro foi criado pra buscar 'emprego fixo', né? Eu também fui.\n\nMas deixa eu te fazer uma pergunta: você acha que 'emprego fixo' é realmente FIXO? Eles te mandam embora quando quiserem, certo? E você fica travado num salário, com teto, com horário...\n\nO que eu descobri é o seguinte:\n\nCLT = Ilusão de estabilidade. Você depende do chefe, do humor da empresa, da economia. E ganha a mesma coisa todo mês, não importa o quanto se esforce.\n\nAgente Licenciado = Você monta SEU NEGÓCIO. Seus clientes são SEUS. Sua carteira é SUA. Ninguém te manda embora. Isso sim é estabilidade.\n\nPergunta sincera: você prefere ganhar $4.000 fixos pra sempre, ou começar em $2.000 mas poder chegar em $15.000+ conforme você cresce?\n\nPorque aqui não tem teto. Você manda no seu futuro.\"\n\n**Se insistir em segurança:**\n\"Olha, [nome], eu respeito totalmente. Mas me diz uma coisa: você tá nos EUA, certo? EUA é terra de EMPREENDEDOR. Você tem work permit, pode abrir negócio. Por que se limitar a depender de patrão quando você pode construir algo SEU? Pelo menos tira 45min pra ouvir. Não custa nada conhecer. Depois você decide o que faz sentido pra você.\"\n\n---\n\n### 4️⃣ \"TEM SALÁRIO?\" / \"QUANTO VOU GANHAR?\"\n\n**Método Eric Worre - Seja honesto mas mostre escalabilidade:**\n\n\"[Nome], não vou te enganar. Não tem salário fixo. Funciona por COMISSÃO RECORRENTE.\n\nMas ó a diferença...\n\nSalário fixo: você trabalha esse mês, ganha esse mês. Mês que vem, trabalha de novo pra ganhar de novo. É tipo hamster na roda.\n\nComissão recorrente: você fecha UM cliente, ganha TODO MÊS enquanto ele tiver o plano. É tipo ALUGUEL. Você trabalha uma vez, mas recebe pra sempre.\n\nDeixa eu te mostrar a matemática...\n\nSe você fecha 10 clientes que pagam $200/mês, você ganha comissão sobre $2.000 TODO MÊS. \nFecha 50 clientes? São $10.000 entrando mensalmente.\nFecha 100? $20.000.\n\nE isso é SÓ você. Se você montar equipe, ganha também sobre o trabalho da equipe (override).\n\nPergunta sincera: qual você prefere?\n→ Salário de $4.000 travado pra sempre  \n→ OU começar em $2.000 mas escalar pra $10k, $15k, $20k+?\n\nPorque aqui, o único limite é VOCÊ.\"\n\n**Se quiser números concretos:**\n\"Olha, [nome], não vou inventar número. Depende 100% de você. Tem gente que em 3 meses já tá faturando $5k. Tem gente que leva 6 meses. Na call, o [responsável] te mostra cases reais de brasileiros que começaram do zero. Aí você vê se o potencial vale o esforço. Mas te garanto uma coisa: se você quer crescer, aqui tem espaço. No CLT, não tem.\"\n\n---\n\n### 5️⃣ \"PRECISO DE EXPERIÊNCIA?\" / \"NÃO SEI VENDER\"\n\n**Desmistifique a necessidade de experiência:**\n\n\"Não precisa, [nome]. Zero experiência. O treinamento ensina TUDO - desde tirar a licença até como prospectar cliente. É tipo CNH: vc faz o curso, passa na prova, e aí sim começa a trabalhar.\n\nOlha, ninguém nasce sabendo vender, né? Mas aqui vc não vai 'vender'. Vc vai CONSULTAR. É diferente. É tipo médico explicando tratamento - vc apresenta soluções, a pessoa decide.\n\nE mais: vc não fica sozinho. Tem treinamento semanal, mentoria, scripts prontos, CRM com tudo automatizado. É tipo uma franquia - já tem o sistema, vc só segue.\n\nPosso te falar uma parada? A maioria dos agentes de sucesso não tinha experiência. Eles tinham VONTADE. O resto se aprende. Vc tem vontade de mudar de vida ou não?\"\n\n---\n\n### 6️⃣ \"QUANTO CUSTA PRA COMEÇAR?\" / \"PRECISO INVESTIR?\"\n\n**Seja transparente mas contextualize:**\n\n\"Sim, tem investimento inicial, [nome]. Afinal é uma LICENÇA profissional, né? Tipo tirar CNH ou fazer faculdade. Mas o [responsável] explica direitinho os valores e formas de pagamento na call.\n\nPensa assim: vc gastaria quanto numa faculdade? $20k? $50k? E quanto tempo pra se pagar? Aqui o investimento é BEM menor e o retorno pode vir em meses, não em anos.\n\nOlha, eu não vou chutar número por texto porque depende do estado e do pacote. Mas te garanto: é MUITO mais acessível que qualquer faculdade ou franquia. Na call vc vê tudo detalhado.\n\n[Nome], posso ser sincero? Brasileiro que fica esperando 'ter dinheiro sobrando' pra investir em si mesmo nunca sai do lugar. Investimento em carreira é PRIORIDADE, não luxo. A pergunta é: você quer mudar de vida ou não?\"\n\n---\n\n## TÉCNICA ERIC WORRE - EDUCAR ANTES DA OBJEÇÃO\n\n**Como prevenir objeções antes delas surgirem:**\n\nDurante o RAPPORT, ANTES de falar de carreira, insira isso:\n\n\"[Nome], deixa eu te fazer uma pergunta rápida: você sabe a diferença entre negócio tradicional e negócio escalável?\n\n[Espera resposta]\n\nNegócio tradicional: você abre uma loja, contrata funcionários, paga aluguel, tem custo fixo alto. Se você parar, o negócio para.\n\nNegócio escalável: você atende clientes, monta equipe, ganha sobre seu trabalho E sobre o trabalho da equipe. É igual corretor de imóveis, advogado que tem escritório, médico que tem clínica.\n\nPor isso exige LICENÇA. Porque é profissão regulamentada.\n\nFaz sentido até aqui?\"\n\n**Resultado:** Quando você falar de \"montar equipe\" e \"comissão recorrente\", ele já entendeu que é modelo legítimo.\n\n---\n\n## REGRAS DE OURO - QUEBRA DE OBJEÇÕES\n\n1. **Nunca entre na defensiva** - \"Não é pirâmide!\" soa defensivo. Use: \"Entendo sua preocupação, deixa eu te explicar...\"\n\n2. **Use perguntas estratégicas** - Ao invés de discursar: \"Você conhece algum advogado que tem equipe e ganha sobre o trabalho deles?\"\n\n3. **Valide SEMPRE antes de contra-argumentar** - \"Eu também pensei assim...\" / \"Muita gente pensa isso...\"\n\n4. **Use prova social** - \"Tem brasileiros faturando $15k, $20k+ por mês\" (não diga \"você vai ganhar\")\n\n5. **Máximo 2 tentativas por objeção** - Se insistir, não pressione. Ofereça call: \"Vale 45min pra tirar dúvida?\"\n\n6. **Silêncios estratégicos funcionam** - Após pergunta forte, CALE e espere\n\n7. **Foco na CALL, não em fechar por texto** - \"Melhor do que eu explicar por texto, bora marcar 45min?\"\n\n8. **Tom leve e consultivo** - Isabella ajuda, não empurra. Nunca soe desesperada ou agressiva.\n\n---\n\n## QUANDO DESQUALIFICAR (usar Adicionar_tag_perdido)\n\nApós 2 tentativas de quebra de objeção, se o lead:\n- Demonstra hostilidade\n- Diz \"não me procura mais\"\n- Continua insistindo em \"é pirâmide\" mesmo depois da explicação completa\n- Não quer nem ouvir (zero abertura)\n- Claramente não tem fit (mora no Brasil, sem planos pros EUA, etc)\n\n**Script de encerramento educado:**\n\"Tranquilo, [nome]! Sem pressão nenhuma. Qualquer coisa, me chama. Sucesso pra você!\"\n\n---\n\n## FLUXO DE AGENDAMENTO - CRÍTICO\n\n**NUNCA ofereça horários sem antes usar Busca_disponibilidade**\n\n1. Lead demonstra interesse em agendar.  \n2. **OBRIGATÓRIO**: chamar `Busca_disponibilidade` antes de sugerir horários.  \n3. Aguardar retorno da API → usar apenas os horários reais fornecidos (sempre 1 dia + 2 opções).  \n4. Ao oferecer os horários:  \n   - Explicar que o **próximo passo é uma reunião online**.  \n   - **Vender o agendamento** (mostrar valor, não só oferecer).  \n   - Usar técnica de comprometimento: \"Se eu conseguir [dia/hora], vc consegue também?\"  \n5. Confirmar escolha de dia/hora do cliente.  \n6. Coletar dados completos (nome, tel, e-mail) caso ainda não estejam no sistema.  \n7. Criar o agendamento via `Agendar_reuniao`.  \n8. **Proibido**: agendar reuniões duplicadas.  \n\n### EXEMPLOS CORRETOS DE AGENDAMENTO:\n\n✅ \"Maravilha, Daniela! Próximo passo é agendarmos uma reunião online pra que <usuário responsável> possa te explicar direitinho a carreira. Agenda tá bem cheia, mas se eu conseguir te encaixar, você prefere segunda 27/10 às 11am ou às 8pm (NY)?\"\n\n✅ \"Perfeito, João! Vamos marcar nosso papo no Zoom. A agenda de <usuário responsável> tá bem corrida, mas consegui te encaixar dia 28/10. Você prefere às 3pm ou às 8pm (horário de NY)?\"\n\n### EXEMPLOS INCORRETOS (NUNCA FAZER):\n\n❌ \"Maravilha, Daniela. Tenho seg 27/10 11am ou 8pm NY no Zoom. Qual melhor pra vc?\"\n→ Problema: Muito direto, não vende o valor, não cria urgência\n\n❌ \"Tenho disponível segunda e terça. Quando pode?\"\n→ Problema: Não oferece horários específicos, não usa técnica de escassez\n\n❌ \"Posso te agendar para vários horários essa semana.\"\n→ Problema: Remove a urgência, não usa escassez\n\n---\n\n## ⚠️ REGRA CRÍTICA - AGENDAMENTOS DUPLICADOS\n\n**ANTES de chamar Agendar_reuniao, SEMPRE verifique:**\n\n1. Você JÁ agendou este lead NESTA conversa?\n   - Procure no histórico por confirmações como \"Registrei aqui no direct\"\n   - Se SIM = NÃO agende novamente. Apenas confirme o agendamento existente.\n   \n2. O lead está pedindo para MUDAR o horário?\n   - Se SIM = É um reagendamento. Informe que vai remarcar.\n   - Se NÃO = Mantenha o agendamento original.\n\n**PROIBIDO fazer dois agendamentos na mesma conversa, exceto se for reagendamento explícito.**\n\nExemplos de reagendamento legítimo:\n✅ \"Não consigo às 3pm, tem outro horário?\"\n✅ \"Preciso remarcar, surgiu um imprevisto\"\n✅ \"Mudou minha agenda, pode ser outro dia?\"\n\nExemplos onde NÃO deve reagendar:\n❌ Lead não respondeu ainda se confirma o horário\n❌ Você já enviou confirmação com dia/hora\n❌ Lead apenas agradeceu ou disse \"ok\"\n\n---\n\n## COLETA DE DADOS E CONFIRMAÇÃO\n\n**SEMPRE responda com a mensagem completa, não pela metade!**\n\n- Após escolha do horário:  \n\"Perfeito! Pra confirmar, digite seu email e WhatsApp, por favor. Assim evito erro de número no agendamento.\"\n\n- Se não tiver dados, colete e agende imediatamente.  \n\n- Se API validada, confirme:  \n\"Maravilhaaa [nome]! Vou enviar por e-mail e WhatsApp, ok?\"\n\n- Se erro na API, valide:  \n  - EUA: \"Número +1XXXXXXXXXX, certo?\"  \n  - Brasil: \"Número +55XXXXXXXXX, certo?\"  \n  - Se não informar país: \"Número é dos EUA ou Brasil?\"  \n  - E-mail: \"Esse <email>, tá escrito certinho mesmo?\"\n\n- Após agendamento bem-sucedido, envie:  \n\"Valeu, [nome]! Registrei aqui no direct: <dia_reuniao>, às <horario_reuniao> (NY).\"\n\n- Nunca use placeholders genéricos — sempre variáveis reais.\n- Confirme agendamento só depois de coletar todos os dados e validar API.\n- Caso perguntem o tempo da reunião: 45 a 60 minutos\n\n---\n\n## FOLLOW-UP - REGRAS\n\n### Iniciar follow-up:\n\n- Se lead disser que não pode falar (trabalho, viagem, etc), marque data/hora solicitados.  \n- Se sumir sem responder, agende follow-up no mesmo dia em horários estratégicos.  \n- Se identificar momento ideal, registre data e mensagem personalizada nos campos:  \n  - data_msg_fup (ID: 2796271)  \n  - mensagem_fup (ID: 2796273)\n\n### Finalizar follow-up:\n\n- Ao receber resposta do lead, apague mensagem_fup (ID: 2796273) e data_msg_fup (ID: 2796271).  \n- Só depois disso, prossiga com conexão, qualificação e agendamento.\n\n---\n\n## PROCESSO OPERACIONAL COMPLETO\n\n1. Refletir com infos disponíveis antes de responder\n2. Identificar interesse (carreira/consultoria)\n3. Seguir SOP mas pular etapas se já tem informação\n4a. Apenas para lead de carreira: coletar work permit.\n4b. Coletar estado.\n4c. Coletar profissão quando relevante.\n5. Após coletar dados explicar que o próximo passo é agendar reunião online e \"vender o agendamento\"\n6. **CRÍTICO: NUNCA oferecer horários sem usar Busca_disponibilidade primeiro - SEMPRE consultar a API antes de qualquer oferta de horário**\n7. Agendar com calendarId correto do responsável\n8. Não perguntar sobre responsável/agenda específica\n9. Se falhar agendamento, buscar alternativas\n10. Se o dia e horário não forem aceitos, chamar Buscar_disponibilidade novamente para conferir alternativas. Se não tiver, agende follow-up para 7 dias depois.\n11. Escalar para humano se necessário\n12. Buscar história do usuário responsável para respostas personalizadas",
              "type": "string"
            },
            {
              "id": "7c1cec03-5b93-4741-a15c-01ccaade24de",
              "name": "origem",
              "value": "Prompt F2 - Funil Tráfego Direto",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        5824,
        1088
      ],
      "id": "5dd87fcd-28a8-4fc2-8756-3f501f58fc1b",
      "name": "Prompt F2 - Funil Tráfego Carreira\""
    },
    {
      "parameters": {
        "jsCode": "const customData = $input.first().json.body?.customData || $input.first().json.customData || {};\nconst body = $input.first().json.body || $input.first().json || {};\n\nconst anexo = (\n  customData.attachments || \n  customData.photo_audio || \n  body.attachments ||\n  body.photo_audio ||\n  ''\n).toLowerCase();\n\nlet tipo_mensagem_original = 'texto';\n\n// Imagens\nif (anexo.includes('.jpg') || anexo.includes('.jpeg') || anexo.includes('.png') || anexo.includes('.gif') || anexo.includes('.webp')) {\n  tipo_mensagem_original = 'imagem';\n}\n// PDF\nelse if (anexo.includes('.pdf')) {\n  tipo_mensagem_original = 'pdf';\n}\n// Planilhas e CSV\nelse if (anexo.includes('.csv') || anexo.includes('.xls') || anexo.includes('.xlsx')) {\n  tipo_mensagem_original = 'planilha';\n}\n// Áudio - AGORA INCLUI .MP4\nelse if (anexo.includes('.mp3') || anexo.includes('.ogg') || anexo.includes('.wav') || anexo.includes('.m4a') || anexo.includes('.opus') || anexo.includes('.mp4')) {\n  tipo_mensagem_original = 'audio';\n}\n// Documentos Word\nelse if (anexo.includes('.doc') || anexo.includes('.docx')) {\n  tipo_mensagem_original = 'documento_word';\n}\n\nreturn {\n  ...$input.first().json,\n  tipo_mensagem_original,\n  anexo_url: anexo\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        192,
        400
      ],
      "id": "a6d4dba4-9113-40f5-83e1-663de780a79d",
      "name": "Classificar Tipo Mensagem"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "reset-cmd",
                    "leftValue": "={{ $('Info').item.json.mensagem }}",
                    "rightValue": "/reset",
                    "operator": {
                      "type": "string",
                      "operation": "contains"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "/reset"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "teste-cmd",
                    "leftValue": "={{ $('Info').item.json.mensagem }}",
                    "rightValue": "/teste",
                    "operator": {
                      "type": "string",
                      "operation": "contains"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "/teste"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "texto-check",
                    "leftValue": "={{ $('Info').item.json.tipo_mensagem_original }}",
                    "rightValue": "texto",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  },
                  {
                    "id": "msg-existe",
                    "leftValue": "={{ !!$('Info').item.json.mensagem && $('Info').item.json.mensagem.length > 0 }}",
                    "rightValue": "",
                    "operator": {
                      "type": "boolean",
                      "operation": "true",
                      "singleValue": true
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Texto"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "imagem-check",
                    "leftValue": "={{ $('Info').item.json.tipo_mensagem_original }}",
                    "rightValue": "imagem",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Imagem"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "audio-check",
                    "leftValue": "={{ $('Info').item.json.tipo_mensagem_original }}",
                    "rightValue": "audio",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Áudio"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "id": "b8885ae3-133c-41d0-97e1-04b3daa9cc38",
                    "leftValue": "={{ $('Info').item.json.tipo_mensagem_original }}",
                    "rightValue": "",
                    "operator": {
                      "type": "string",
                      "operation": "empty",
                      "singleValue": true
                    }
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "mensagem vazia"
            }
          ]
        },
        "options": {
          "allMatchingOutputs": false
        }
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        880,
        352
      ],
      "id": "2093808e-d5e9-47bd-b68d-e1f98242dca4",
      "name": "Tipo de mensagem",
      "alwaysOutputData": false
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "734cd3ca-c411-46fe-8924-1ea800f80804",
              "name": "mensagem",
              "value": "={{ ($json.body?.message?.body || '').trim() || $json.mensagem_contexto || ($json.body?.customData?.message?.split(\"Instance Source:\")[0] ?? $json.body?.message?.content?.text ?? '').trim() }}",
              "type": "string"
            },
            {
              "id": "ccb3a74d-0336-4a28-9f43-7bdaff77b906",
              "name": "source",
              "value": "={{ \n  // Prioriza o canal da mensagem ATUAL, não a origem do lead\n  (() => {\n    const messageType = $json.body?.message?.type;\n    \n    // Type 2 = SMS - responde por SMS (usa \"whatsapp\" que no seu workflow envia SMS)\n    if (messageType === 2) return \"whatsapp\";\n    \n    // Type 15 = Instagram DM - pode responder por Instagram\n    if (messageType === 15) return \"instagram\";\n    \n    // Se não conseguir identificar pelo type, verifica a origem\n    // mas só usa Instagram se o type não for SMS\n    const origin = $json.body?.contact?.attributionSource?.medium;\n    if (origin === \"instagram\" && messageType !== 2 && messageType !== 20) return \"instagram\";\n    \n    // Default: SMS/WhatsApp (mais seguro)\n    return \"whatsapp\";\n  })().trim()\n}}",
              "type": "string"
            },
            {
              "id": "332d6a13-10c8-465f-8ddb-fa97266f9fec",
              "name": "first_name",
              "value": "={{ $json.first_name }}",
              "type": "string"
            },
            {
              "id": "60cb5031-9132-4c86-9ab7-c487a170c9e3",
              "name": "last_name",
              "value": "={{ $json.last_name }}",
              "type": "string"
            },
            {
              "id": "9d4ae7a5-635b-4dbc-93d1-9464ace3208c",
              "name": "email",
              "value": "={{ $json.body?.email }}",
              "type": "string"
            },
            {
              "id": "d6301da3-de8a-45e3-9705-32cf65c3bf1e",
              "name": "telefone",
              "value": "={{ $json.body?.customData?.phone }}",
              "type": "string"
            },
            {
              "id": "7e094af2-d305-42ba-b6d2-014b62231ebb",
              "name": "datetime",
              "value": "={{ $json.body?.date_created }}",
              "type": "string"
            },
            {
              "id": "f3471b65-9533-4f5c-a669-60aaf549b4e8",
              "name": "process_id",
              "value": "={{ $execution.id }}",
              "type": "string"
            },
            {
              "id": "257ef1e2-26bb-461e-8335-3d1101d3cda6",
              "name": "owner_origin",
              "value": "={{ $json.body?.location?.id }}",
              "type": "string"
            },
            {
              "id": "1e235f54-27cf-4b91-b156-1c0a69149370",
              "name": "owner_id",
              "value": "=cmcprclas0000syak01gtgj80",
              "type": "string"
            },
            {
              "id": "5041121e-02b1-4993-ad9c-34131a44b08d",
              "name": "timezone_do_lead",
              "value": "={{ $json.body?.customData?.timezone }}",
              "type": "string"
            },
            {
              "id": "367c6400-fd93-4f50-a09b-b2d56aea0bd9",
              "name": "lead_id",
              "value": "={{ $json.body?.contact_id }}",
              "type": "string"
            },
            {
              "id": "66a3f763-5dbe-4033-abd7-3079835a035a",
              "name": "mensagem_id",
              "value": "={{ $json.starttimeMs }}",
              "type": "string"
            },
            {
              "id": "110eb8f6-d0b2-4358-a002-3741abbcfeb7",
              "name": "workflow_id",
              "value": "={{ $workflow.id }}",
              "type": "string"
            },
            {
              "id": "ab843596-5dfa-41d7-8ac4-02cd1dd5b661",
              "name": "api_key",
              "value": "={{ $json.body?.customData?.ghl_api_key }}",
              "type": "string"
            },
            {
              "id": "8be8461d-83f1-4563-9e2e-46e978d3afb4",
              "name": "location_id",
              "value": "={{ $json.body?.location?.id }}",
              "type": "string"
            },
            {
              "id": "3df2e105-88b1-4d12-b957-6b5d909056be",
              "name": "tipo",
              "value": "={{ $json.body?.customData?.tipo }}",
              "type": "string"
            },
            {
              "id": "d1fa8d84-c23b-4292-86bc-2066e14c7882",
              "name": "calendarID_carreira",
              "value": "={{ $json.body?.customData?.calendar_id_carreira }}",
              "type": "string"
            },
            {
              "id": "cca7fe8b-af83-40c1-ba8b-d4de7cd21c47",
              "name": "calendarID_consultoria_financeira",
              "value": "={{ $json.body?.customData?.consultoria_financeira }}",
              "type": "string"
            },
            {
              "id": "dad6c1f3-82b2-45ea-b3be-c512a879ac98",
              "name": "origem_teste",
              "value": "Marcos Danielss",
              "type": "string"
            },
            {
              "id": "3038f1ef-1199-4aab-9354-dc9463c775de",
              "name": "etiquetas",
              "value": "={{ $json.body?.tags }}",
              "type": "string"
            },
            {
              "id": "4100931a-e49b-4b97-8a16-7a797b67899e",
              "name": "area_de_atuacao",
              "value": "={{ $json.body?.['Qual a sua área de atuação?']?.[0] }}",
              "type": "string"
            },
            {
              "id": "4ed525e0-9bb6-4663-980a-70a10db813d4",
              "name": "idade",
              "value": "={{ $json.body?.Idade }}",
              "type": "string"
            },
            {
              "id": "b14c96ea-7093-48b6-add5-dd0159af29cd",
              "name": "instagram",
              "value": "={{ $json.body?.Instagram }}",
              "type": "string"
            },
            {
              "id": "9d450e98-e0e3-48fb-bb77-41c6d701f227",
              "name": "modelo_de_atuacao",
              "value": "={{ $json.body?.['Modelo de atuação'] }}",
              "type": "string"
            },
            {
              "id": "69b88a48-6d28-42b1-8ff4-5120e516f348",
              "name": "faturamento_medio",
              "value": "={{ $json.body?.['Faturamento médio'] }}",
              "type": "string"
            },
            {
              "id": "35274cdc-7a80-4945-9296-5d74db32aff2",
              "name": "investimento",
              "value": "={{ $json.body?.Investimento }}",
              "type": "string"
            },
            {
              "id": "247f2856-13b1-4bc4-bb55-cf7842680459",
              "name": "event_chat",
              "value": "={{ $json.body?.event?.Info?.Chat }}",
              "type": "string"
            },
            {
              "id": "dda2ed54-8e91-41e2-92c9-1b2d12763e2b",
              "name": "event_is_group",
              "value": "={{ $json.body?.event?.Info?.IsGroup }}",
              "type": "boolean"
            },
            {
              "id": "b9e46b5c-3fb8-4be2-bb9e-71080728bd85",
              "name": "video_ads_url",
              "value": "={{ $json.body?.contact?.attributionSource?.videoUrl }}",
              "type": "string"
            },
            {
              "id": "16308ff3-20b3-4fd4-b126-21c34248530b",
              "name": "time_zone_do_agente",
              "value": "={{ $json.body?.customData?.timezone }}",
              "type": "string"
            },
            {
              "id": "2566e00f-ecfd-44e8-bab2-7d68447e3b9a",
              "name": "historia_do_usuario",
              "value": "={{ $json.body?.customData?.minha_historias }}",
              "type": "string"
            },
            {
              "id": "391cb65e-46a0-475b-8c42-3629883ad983",
              "name": "usuario_responsavel",
              "value": "={{ $json.body?.user?.firstName }} {{ $json.body?.user?.lastName }}",
              "type": "string"
            },
            {
              "id": "1cd51504-1dc9-4aea-956a-9a4757db1b6c",
              "name": "photo_audio",
              "value": "={{ $json.body?.customData?.photo_audio?.split(',')[0]?.trim() }}",
              "type": "string"
            },
            {
              "id": "77c42ca4-2ef7-4a40-b1ed-2fc5e8af7292",
              "name": "fonte_do_lead_bposs",
              "value": "={{ $json.body?.customData?.fonte_do_lead_bposs }}",
              "type": "string"
            },
            {
              "id": "a976a2ec-ed9f-452b-91d1-5725631ae2d5",
              "name": "quebra_de_objecoes_geral",
              "value": "={{ $json.body?.customData?.quebra_de_objecoes_geral }}",
              "type": "string"
            },
            {
              "id": "cc085a35-fef6-47b9-ad97-e9d671a71d29",
              "name": "quebra_de_objecoes_carreira",
              "value": "={{ $json.body?.customData?.quebra_de_objecoes_carreira }}",
              "type": "string"
            },
            {
              "id": "8f3c6a4d-df4f-4de7-ad41-0177eb567ed4",
              "name": "quebra_de_objecoes_consultoria",
              "value": "={{ $json.body?.customData?.quebra_de_objecoes_consultoria }}",
              "type": "string"
            },
            {
              "id": "03c2a02f-e2c2-4d42-afe3-3d6b7bfae375",
              "name": "tipos_work_permit_permitidos",
              "value": "={{ $json.body?.customData?.estruturas_work_permit }}",
              "type": "string"
            },
            {
              "id": "2d89fd62-be99-4c63-9bf9-c2b97c0cc735",
              "name": "link_do_zoom",
              "value": "={{ $json.body?.customData?.link_do_zoom }}",
              "type": "string"
            },
            {
              "id": "939d130d-8780-41e6-9693-10b83cd9bab5",
              "name": "agendamento_duracao_minutos",
              "value": "30",
              "type": "string"
            },
            {
              "id": "c9a26bfa-ced7-4b82-a6bb-2c0aeb46f9a3",
              "name": "cobranca_valor",
              "value": "500",
              "type": "string"
            },
            {
              "id": "9290e4ff-d01b-4fca-b5f3-7605d4f74c07",
              "name": "id_conversa_alerta",
              "value": "skfa6JP6lLlAXkc8FfIp",
              "type": "string"
            },
            {
              "id": "c594a0f2-aba9-458c-92ff-81e73086416c",
              "name": "url_asaas",
              "value": "https://api-sandbox.asaas.com",
              "type": "string"
            },
            {
              "id": "103fad86-a8b6-4591-b310-2dc7069bc189",
              "name": "etapa_funil",
              "value": "={{ $json.body?.customData?.etapa_funil }}",
              "type": "string"
            },
            {
              "id": "3ae92580-436d-4dfc-a7cc-f83f8f68309e",
              "name": "full_name",
              "value": "={{ $json.nome_completo }}",
              "type": "string"
            },
            {
              "id": "5476f99e-273b-45a1-996f-b98cb86ddd25",
              "name": "work_permit",
              "value": "={{ $json.body?.customData?.work_permit }}",
              "type": "string"
            },
            {
              "id": "989fb582-9e56-4962-8883-6076627c72b5",
              "name": "state",
              "value": "={{ $json.body?.customData?.state }}",
              "type": "string"
            },
            {
              "id": "15265189-0d84-420c-b7da-6181170a6b08",
              "name": "location_name",
              "value": "={{ $json.body?.location?.name }}",
              "type": "string"
            },
            {
              "id": "5770d76c-1a0f-4515-9683-381881715eb5",
              "name": "resposta_ia",
              "value": "={{ $json.body?.['Resposta IA'] }}",
              "type": "string"
            },
            {
              "id": "b1871710-95d0-495d-9592-ff09ea8ab983",
              "name": "objetivo_do_lead",
              "value": "={{ $json.objetivo_do_lead }}",
              "type": "string"
            },
            {
              "id": "5a729725-994d-46e5-a6f1-aac7b9504a3a",
              "name": "ativar_ia",
              "value": "={{ $json.ativar_ia }}",
              "type": "string"
            },
            {
              "id": "5e293330-4c28-4ae8-92ef-e99bc9feb55e",
              "name": "utm_content",
              "value": "={{ $json.utm_content }}",
              "type": "string"
            },
            {
              "id": "7d94c551-b241-48e8-84e8-9ab152f6a526",
              "name": "agente_ia",
              "value": "={{ $json.agente_ia }}",
              "type": "string"
            },
            {
              "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
              "name": "mensagem_contexto",
              "value": "={{ $json.mensagem_contexto }}",
              "type": "string"
            },
            {
              "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
              "name": "is_primeira_mensagem",
              "value": "={{ $json.is_primeira_mensagem }}",
              "type": "boolean"
            },
            {
              "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
              "name": "tipo_lead",
              "value": "={{ $json.tipo_lead }}",
              "type": "string"
            },
            {
              "id": "301166ea-a33e-4fa8-a1ec-3a3a0fd00923",
              "name": "tipo_mensagem_original",
              "value": "={{ \n  ($('Mensagem recebida').item.json.body.customData?.photo_audio || '').includes('.ogg') || \n  ($('Mensagem recebida').item.json.body.customData?.photo_audio || '').includes('.mp3') || \n  ($('Mensagem recebida').item.json.body.customData?.photo_audio || '').includes('.opus') || \n  ($('Mensagem recebida').item.json.body.customData?.photo_audio || '').includes('.mp4') || \n  ($('Mensagem recebida').item.json.body.customData?.message || '').startsWith('Mensagem de Áudio') \n    ? 'audio' \n    : ($('Mensagem recebida').item.json.body.customData?.photo_audio || '').includes('.jpeg') || \n      ($('Mensagem recebida').item.json.body.customData?.photo_audio || '').includes('.jpg') || \n      ($('Mensagem recebida').item.json.body.customData?.photo_audio || '').includes('.png') || \n      ($('Mensagem recebida').item.json.body.customData?.photo_audio || '').includes('.webp') \n        ? 'imagem' \n        : 'texto' \n}}",
              "type": "string"
            },
            {
              "id": "368ffdd1-2395-4632-b738-e35ebfbe0832",
              "name": "body.customData.ghl_api_key",
              "value": "={{ $('Mensagem recebida').item.json.body.customData.ghl_api_key }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        320,
        400
      ],
      "id": "0c41ece7-cfe0-4258-b300-cdadc036f58d",
      "name": "Info"
    },
    {
      "parameters": {
        "jsCode": "const start = new Date();\nconst starttimeISO = start.toISOString();\nconst starttimeMs = start.getTime();\n\nconst end = new Date(start);\nend.setDate(end.getDate() + 7);\nconst endtimeISO = end.toISOString();\nconst endtimeMs = end.getTime();\n\nconst inputData = $input.first().json;\n\nreturn [{\n  json: {\n    ...inputData,\n    starttimeISO,\n    starttimeMs,\n    endtimeISO,\n    endtimeMs\n  }\n}];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        48,
        400
      ],
      "id": "5f602624-2e32-4028-a166-2391156ee95a",
      "name": "Code1"
    },
    {
      "parameters": {
        "dataToSave": {
          "values": [
            {
              "key": "contact_id",
              "value": "={{ $json.body.contact_id }}"
            },
            {
              "key": "location_name",
              "value": "={{ $json.body.location.name }}"
            },
            {
              "key": "agente_ia",
              "value": "={{ $json.agente_ia }}"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.executionData",
      "typeVersion": 1.1,
      "position": [
        -144,
        400
      ],
      "id": "113fe42c-6a47-4719-9fe8-98bcb57f40f2",
      "name": "Execution Data5"
    },
    {
      "parameters": {
        "jsCode": "// Normalizar dados do lead\nconst inputData = $input.first().json;\nconst body = inputData.body || {};\nconst customData = body.customData || {};\nconst tags = (body.tags || '').toLowerCase();\nconst utmContent = body.contact?.attributionSource?.utmContent || '';\n\n// === OBJETIVO DO LEAD ===\nlet objetivo_do_lead = customData.objetivodolead || '';\n\nif (!objetivo_do_lead) {\n  if (tags.includes('consultoria')) {\n    objetivo_do_lead = 'consultoria';\n  } else if (tags.includes('carreira')) {\n    objetivo_do_lead = 'carreira';\n  } else if (utmContent.toLowerCase().includes('consultoria')) {\n    objetivo_do_lead = 'consultoria';\n  } else if (utmContent.toLowerCase().includes('carreira')) {\n    objetivo_do_lead = 'carreira';\n  } else {\n    objetivo_do_lead = 'indefinido'; // ✅ Não assume mais 'carreira' como padrão\n  }\n}\n\n// === AGENTE IA ===\nlet agente_ia = customData.motive || '';\n\nif (!agente_ia) {\n  // Verifica tags específicas\n  if (tags.includes('closer')) {\n    agente_ia = 'closer';\n  } else if (tags.includes('followuper')) {\n    agente_ia = 'followuper';\n  } else if (objetivo_do_lead === 'consultoria') {\n    agente_ia = 'sdrconsultoria';\n  } else if (objetivo_do_lead === 'carreira') {\n    agente_ia = 'sdrcarreira';\n  } else {\n    agente_ia = 'indefinido'; // ✅ Leads sem classificação clara\n  }\n}\n// ✅ Se customData.motive vier com 'assistente_admin' ou 'assistente_interno', \n//    mantém o valor original\n\n// === ATIVAR IA ===\nlet ativar_ia = customData.ativar_ia || '';\n\nif (tags.includes('perdido')) {\n  ativar_ia = 'nao';\n} else if (utmContent) {\n  ativar_ia = 'sim';\n} else if (ativar_ia === 'sim' || tags.includes('ativar_ia')) {\n  ativar_ia = 'sim';\n} else {\n  ativar_ia = 'nao';\n}\n\nreturn {\n  json: {\n    ...inputData,\n    objetivo_do_lead,\n    agente_ia,\n    ativar_ia,\n    utm_content: utmContent,\n    tags_original: body.tags\n  }\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -368,
        400
      ],
      "id": "50111461-8984-475a-a12b-3fca9b9b1202",
      "name": "Normalizar Dados1"
    },
    {
      "parameters": {
        "jsCode": "// Normalizar Nome do Lead\nconst inputData = $input.first().json;\nconst body = inputData.body || {};\n\nlet nome = body.full_name || ((body.first_name || '') + ' ' + (body.last_name || '')).trim() || body.customData?.name || '';\nconst nomeOriginal = nome;\n\nnome = nome.replace(/\\d+/g, '').trim();\nnome = nome.replace(/[_\\-.@]/g, ' ').trim();\nnome = nome.replace(/([a-z])([A-Z])/g, '$1 $2');\n\nconst apelidosCurtos = ['lu', 'le', 'li', 'jo', 'ze', 'ma', 'mi', 'ju', 'du', 'bi', 'ca', 'ka', 'fe', 'be', 'ne', 're', 'ra', 'ro', 'vi', 'va', 'na', 'ni', 'ta', 'ti', 'la', 'lo', 'ed', 'el'];\n\nfunction separarApelidoSobrenome(str) {\n  if (str.includes(' ')) return str;\n  if (str.length <= 10) return str;\n  const lower = str.toLowerCase();\n  for (let len = 2; len <= 3; len++) {\n    const possivel = lower.slice(0, len);\n    if (apelidosCurtos.includes(possivel)) {\n      const resto = str.slice(len);\n      if (resto.length >= 4) return str.slice(0, len) + ' ' + resto;\n    }\n  }\n  return str;\n}\n\nnome = separarApelidoSobrenome(nome);\nnome = nome.replace(/\\s+/g, ' ').trim();\n\nfunction capitalizar(str) {\n  const preposicoes = ['de', 'da', 'do', 'das', 'dos', 'e'];\n  return str.toLowerCase().split(' ').map((palavra, i) => {\n    if (i > 0 && preposicoes.includes(palavra)) return palavra;\n    return palavra.charAt(0).toUpperCase() + palavra.slice(1);\n  }).join(' ');\n}\n\nlet partes = nome.split(' ').filter(p => p.length > 0);\nlet firstName = partes[0] || nome || '';\nlet lastName = partes.slice(1).join(' ') || '';\n\nfirstName = capitalizar(firstName);\nlastName = capitalizar(lastName);\n\nconst tinhaNumero = /\\d/.test(nomeOriginal);\nconst qualidade = (firstName.length < 2 || tinhaNumero) ? 'revisar' : 'ok';\n\nreturn {\n  json: {\n    ...inputData,\n    nome_original: nomeOriginal,\n    first_name: firstName,\n    last_name: lastName,\n    nome_completo: lastName ? `${firstName} ${lastName}` : firstName,\n    qualidade_nome: qualidade\n  }\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -592,
        400
      ],
      "id": "958192bd-dac0-4b0a-9310-98b57bbe7b2c",
      "name": "Normalizar Nome1"
    },
    {
      "parameters": {
        "jsCode": "// Contexto Inicial do Lead baseado em UTM\nconst input = $input.first().json.body;\n\nconst utmContent = input.contact?.attributionSource?.utmContent || '';\nconst messageBody = (input.message?.body || '').trim();\nconst isPrimeiraMensagem = !messageBody || messageBody === '' || messageBody === ' ';\n\nconst contextoPorUTM = {\n  'CARREIRA': {\n    contexto: 'Lead interessado em CARREIRA no mercado financeiro americano',\n    interesse: 'Oportunidades de carreira como agente de seguros nos EUA',\n    abordagem: 'Falar sobre licenciamento, ganhos, estrutura de trabalho'\n  },\n  'CONSULTORIA': {\n    contexto: 'Lead interessado em CONSULTORIA financeira pessoal',\n    interesse: 'Planejamento financeiro, proteção patrimonial, seguros',\n    abordagem: 'Falar sobre benefícios, proteção familiar, investimentos'\n  },\n  'INVESTIMENTO': {\n    contexto: 'Lead interessado em INVESTIMENTOS',\n    interesse: 'Opções de investimento e crescimento patrimonial',\n    abordagem: 'Falar sobre produtos financeiros, retornos, segurança'\n  }\n};\n\nlet tipoLead = '';\nfor (const tipo of Object.keys(contextoPorUTM)) {\n  if (utmContent.toUpperCase().includes(tipo)) {\n    tipoLead = tipo;\n    break;\n  }\n}\n\nlet mensagemContexto = '';\nlet contextoObj = null;\n\nif (isPrimeiraMensagem && tipoLead) {\n  contextoObj = contextoPorUTM[tipoLead];\n  mensagemContexto = `[CONTEXTO DO LEAD]\\nTipo: ${tipoLead}\\n${contextoObj.contexto}\\nInteresse principal: ${contextoObj.interesse}\\nAbordagem sugerida: ${contextoObj.abordagem}\\n\\nWork Permit: ${input['Work Permit'] || input.customData?.work_permit || 'Não informado'}\\nEstado: ${input['Estado onde mora'] || 'Não informado'}\\n`;\n}\n\nreturn {\n  json: {\n    body: input,\n    is_primeira_mensagem: isPrimeiraMensagem,\n    tem_contexto_utm: !!tipoLead,\n    tipo_lead: tipoLead || 'NAO_IDENTIFICADO',\n    utm_content: utmContent,\n    mensagem_contexto: mensagemContexto,\n    mensagem_original: messageBody,\n    work_permit: input['Work Permit'] || input.customData?.work_permit || '',\n    estado: input['Estado onde mora'] || '',\n    contexto_para_ai: isPrimeiraMensagem && contextoObj ? contextoObj : null\n  }\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -816,
        400
      ],
      "id": "59201051-10d8-45b7-b4aa-72965abe0634",
      "name": "Contexto UTM"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "ativar-ia-check",
              "leftValue": "={{ $json.ativar_ia }}",
              "rightValue": "sim",
              "operator": {
                "type": "string",
                "operation": "equals"
              }
            },
            {
              "id": "80f34e52-b954-48d7-b92a-fb1c95652f9b",
              "leftValue": "={{ $json.etiquetas }}",
              "rightValue": "assistente-admin",
              "operator": {
                "type": "string",
                "operation": "contains"
              }
            }
          ],
          "combinator": "or"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        656,
        384
      ],
      "id": "6b931a1a-0bd1-456a-a915-3b98f2845bac",
      "name": "IA Ativa?"
    },
    {
      "parameters": {
        "content": "# Tratando input\n",
        "height": 540,
        "width": 1060
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        -336,
        224
      ],
      "id": "9fba5da6-20e4-4cf5-8e4e-68bc465fb326",
      "name": "Sticky Note5"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "790a5682-0b9a-413b-9626-01f6d49c4206",
              "name": "mensagem",
              "value": "={{ $('In3fo').item.json.mensagem }}",
              "type": "string"
            },
            {
              "id": "df7207e1-10cf-4fc8-be3e-58a2cbe6768b",
              "name": "api_key",
              "value": "={{ $('Info').item.json.api_key }}",
              "type": "string"
            },
            {
              "id": "fff142a6-bb90-419c-ac87-4be400fccc5e",
              "name": "location_id",
              "value": "={{ $('Info').item.json.location_id }}",
              "type": "string"
            },
            {
              "id": "42e917b9-b94a-427f-ad56-488d1e838eb8",
              "name": "location_name",
              "value": "={{ $('Info').item.json.location_name }}",
              "type": "string"
            },
            {
              "id": "206bb985-a330-4859-9352-2205d5c23553",
              "name": "lead_id",
              "value": "={{ $('Info').item.json.lead_id }}",
              "type": "string"
            },
            {
              "id": "a0ae9724-d22a-4e0b-abd9-944d1819d289",
              "name": "photo_audio",
              "value": "={{ $('Info').item.json.photo_audio }}",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        1088,
        672
      ],
      "id": "14c89ab2-622a-4ff7-84ef-b36dba072088",
      "name": "Edit Fields2"
    },
    {
      "parameters": {
        "jsCode": "const data = $input.first().json;\nconst outputText = data.output || '';\n\n// ========================================\n// ESTIMATIVA DE TOKENS - CALIBRADO v2\n// ========================================\n\n// Completion: 3.4 chars por token\nconst CHARS_POR_TOKEN_OUTPUT = 3.4;\n\n// Prompt: calibrado com média dos seus dados reais\n// 9922, 9962, 10042 -> média ~9975, arredondando pra 10050\nconst PROMPT_TOKENS_BASE = 10050;\n\n// Calcular completion tokens\nconst completionTokens = Math.ceil(outputText.length / CHARS_POR_TOKEN_OUTPUT);\n\nconst promptTokens = PROMPT_TOKENS_BASE;\nconst totalTokens = promptTokens + completionTokens;\n\n// ========================================\n// CÁLCULO DE CUSTO - Gemini 2.5 Pro\n// ========================================\nconst PRECO_INPUT = 1.25;\nconst PRECO_OUTPUT = 5.00;\n\nconst custoInput = (promptTokens / 1000000) * PRECO_INPUT;\nconst custoOutput = (completionTokens / 1000000) * PRECO_OUTPUT;\nconst custoTotal = custoInput + custoOutput;\n\nreturn {\n  json: {\n    output: outputText,\n    tokenUsage: {\n      promptTokens: promptTokens,\n      completionTokens: completionTokens,\n      totalTokens: totalTokens,\n      metodo: 'estimativa'\n    },\n    custo_llm: {\n      modelo: 'gemini-2.5-pro',\n      tokens_input: promptTokens,\n      tokens_output: completionTokens,\n      tokens_total: totalTokens,\n      custo_usd: parseFloat(custoTotal.toFixed(6)),\n      custo_brl: parseFloat((custoTotal * 6).toFixed(4)),\n      tipo: 'estimado'\n    }\n  }\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        7632,
        320
      ],
      "id": "3e7088cc-f286-416c-9a35-2a2db666c05b",
      "name": "Code in JavaScript2"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "c1347694-76f6-44df-888e-74ee5d651820",
              "name": "prompt",
              "value": "=## ⛔ REGRA INVIOLÁVEL\nPROIBIDO mencionar dia/hora sem ANTES chamar Busca_disponibilidade. Sem exceção.\n\n## CONTEXTO DO LEAD (JÁ IDENTIFICADO)\nOBJETIVO: {{ $('Info').first().json.objetivo_do_lead }}\nWORK PERMIT: {{ $('Info').first().json.work_permit || 'não informado' }}\nESTADO: {{ $('Info').first().json.state || 'não informado' }}\n\n---\n\n## ⚠️ REGRA CRÍTICA - NOME DO LEAD\n\n**Se precisar usar o nome do lead:**\n- Extraia do histórico da conversa (como o lead se apresentou)\n- Se não souber o nome, NÃO invente - use frases sem nome\n- NUNCA confie cegamente em dados do sistema que podem estar incorretos\n\n---\n\n## ⚠️ REGRA DE ENCERRAMENTO PÓS-AGENDAMENTO\n\n**APÓS CONFIRMAR AGENDAMENTO:**\n1. Envie a confirmação: \"Valeu! Registrei: [dia], às [hora] (NY).\"\n2. Se lead responder \"ok\", \"obrigado\", \"valeu\", \"👍\" → Feche com UMA mensagem calorosa e PARE\n3. Se lead responder NOVAMENTE após fechamento → Envie APENAS emoji: 🙏🏻 ou 😌\n\n**PROIBIDO continuar conversa após lead agradecer o agendamento confirmado.**\n**NÃO faça novas perguntas após o fechamento.**\n\n---\n\n⚠️ REGRA: Se objetivo_do_lead = \"carreira\", NÃO pergunte se quer carreira ou consultoria. Vá direto para qualificação (estado + work permit).\n\n\n## OBJETIVO\n\n- Atendimento consultivo, humanizado e eficiente conforme usuário responsável  \n- Identificar se o lead quer Consultoria Financeira ou Carreira de Agente  \n- Redirecionar leads de Carreira sem Work Permit para Consultoria  \n- Agendar, remarcar ou cancelar reuniões estratégicas com agilidade  \n- Responder dúvidas frequentes sobre carreira e consultoria  \n- Guiar o lead com linguagem clara e acolhedora  \n- Confirmar número brasileiro e orientar uso do \"9\" se não tiver WhatsApp\n\n---\n\n## SOBRE A CARREIRA DE AGENTE FINANCEIRO – INFORMAÇÕES COMPLETAS\n\n### O QUE É A CARREIRA DE AGENTE FINANCEIRO\n\nCarreira para brasileiros legalizados nos EUA, com licença estadual, ajudando famílias a proteger e multiplicar patrimônio. Liberdade, alta renda, impacto social e demanda alta.\n\n### PRINCIPAIS DIFERENCIAIS\n\n- Liberdade geográfica  \n- Renda escalável  \n- Alta demanda entre brasileiros nos EUA  \n- Sem exigência de experiência  \n- Licença oficial do estado (não marketing multinível)  \n- Trabalho com propósito\n\n---\n\n## RECURSOS DA CARREIRA – DETALHADOS\n\n### 1. PROCESSO DE LICENCIAMENTO  \n- Suporte para licença estadual (Life & Health)  \n- Treinamento online em português  \n- Processo simples, parecido com tirar CNH  \n- Pode ser paralelo a outro trabalho\n\n### 2. TREINAMENTO E DESENVOLVIMENTO  \n- Treinamentos semanais e mentorias  \n- Comunidade ativa e conteúdo atualizado  \n- Trilhas para iniciantes e líderes\n\n### 3. PROSPECÇÃO E POSICIONAMENTO DIGITAL  \n- Estratégias de social selling  \n- Scripts e funis validados  \n- Suporte Instagram, WhatsApp e CRM\n\n### 4. FERRAMENTAS DE GESTÃO E APRESENTAÇÃO  \n- Simuladores e projeções financeiras  \n- CRM e acompanhamento  \n- Suporte técnico\n\n### 5. FORMAÇÃO DE EQUIPE E ESCALABILIDADE  \n- Recrutamento e liderança  \n- Bonificação por equipe (override)  \n- Reconhecimento e crescimento\n\n---\n\n## PLANOS E SERVIÇOS DISPONÍVEIS\n\nEncaminhar para atendimento humano caso o lead solicite:  \n- Custos/licenciamento  \n- Comissões e ganhos  \n- Produtos (seguros, aposentadoria, college plan)  \n- Suporte para início imediato\n\n---\n\n## SOP (Procedimento Operacional Padrão)\n\n### FLUXO DE QUALIFICAÇÃO\n\n#### PARA CONSULTORIA FINANCEIRA  \n1. Pergunte UMA coisa por vez: profissão, tempo nos EUA, data de nascimento para projeção patrimonial.  \n2. Liste horários disponíveis.  \n3. Colete email e WhatsApp (se não tiver).  \n4. Efetive agendamento, confirme envio do email.\n\n#### PARA CARREIRA DE AGENTE FINANCEIRO  \n1. Pergunte UMA coisa por vez: estado e se possui Work Permit.\n\n2. Se possui Work Permit:  \n- \"Maravilha! Vamos marcar papo no Zoom. Agenda cheia, mas vou tentar te encaixar...\"  \n- Ofereça 2 horários no dia atual, citando data e hora.\n\n### TRATAMENTO PARA USUÁRIOS SEM WORK PERMIT\n\n3. Se NÃO possui Work Permit e quer Carreira:  \n- Ofereça Consultoria Financeira Gratuita.  \n- Se aceitar, qualifique (profissão, tempo, nascimento) e liste horários.  \n- Se recusar, agradeça e encerre.\n\n## QUALIFICAÇÃO – LEAD SEM WORK PERMIT\n\n### Quando usar\nSe identificar que o lead NÃO possui Work Permit, conduza este fluxo de consultoria gratuita (não é vaga de carreira). Objetivo: qualificar e, se elegível, agendar consultoria com especialista.\n\n### Roteiro (mensagens curtas)\n1) Posicionamento inicial  \n\"Entendi. Então você ainda não tem o work permit, certo? Eu iria te mostrar uma oportunidade de fazer um extra com liberdade, mas sem o permit o melhor caminho agora é um planejamento estratégico pra proteger sua renda aqui nos EUA, mesmo sem status definido.\"\n\n2) Explicação da consultoria  \n\"Quero te presentear com uma consultoria online gratuita, comigo ou com um especialista da equipe. É pra entender seu momento e te mostrar opções reais de proteção e organização financeira, mesmo sem o permit. A conversa é 100% gratuita, mas as estratégias exigem um investimento mensal. Hoje faz sentido pra você investir na sua segurança e futuro financeiro?\"\n\n3) Validação de possibilidade de investimento (se perguntarem preço)  \n\"Pra ter ideia, os planos começam em:  \n- $50/mês para proteção de crianças e jovens (15 dias de vida a 35 anos)  \n- $200/mês para futuro dos adultos (30 a 55 anos)  \n- $100/mês para planos pro futuro das crianças (College)  \nSe fizer sentido, você estaria disposto(a) a começar nessa faixa?\"\n\n→ Se não topar investimento: encerre gentilmente (ver Encerramento) e agende follow-up leve.  \n→ Se topar: prossiga Qualificação.\n\n### Perguntas de qualificação (checklist)\nMarque internamente (sem listar tudo pro lead de uma vez; pergunte de forma natural):\n1. Idade (converter para faixa): __  \n2. Mora nos EUA: sozinho(a) / com família  \n   - Se família: quantos integrantes? Todos trabalham? Filhos menores de 18? quantos?  \n3. Trabalho atual: sim/não e com o quê  \n4. Disposição de investimento mensal: sim/não e valor aproximado  \n5. Observações: anote contexto relevante (profissão, renda única, responsabilidades etc.)\n\n### Critérios de qualificação (consultoria)\n- Faixa etária: 25–55 anos preferencial (avaliar exceções com bom fit)  \n- Investimento:  \n  - Seguro de Vida: $50+ (jovem 25–35) / $50+ (adulto 30+)  \n  - Aposentadoria: $100 (criança 1–30) / $200 (adulto 30–55)  \n- Contexto familiar: avaliar capacidade/necessidade (sozinho = 1 renda p/ 1 pessoa; com família = responsabilidades e proteção)\n\n→ Se QUALIFICADO: encaminhar para CONSULTORIA.  \n→ Se NÃO QUALIFICADO: Encerramento.\n\n### Encaminhamento (se qualificado)\n\"Ótimo, pelo que você me contou, faz sentido seguir com a consultoria. Vou checar os horários com um especialista e te passo 1 dia e 2 opções pra escolher, pode ser?\"\n\n---\n\n## SOCIAL SELLING - ESSENCIAIS\n\n1. Aborde como quem observa vitrine\n2. Venda invisível - conecte antes\n3. Educação + Desapego + Interesse genuíno\n4. Objetivo: agendar reunião\n5. Mensagens curtas = mais resposta\n6. Personalize com dados do perfil\n7. Finalize com pergunta/sugestão sutil\n\n---\n\n## RAPPORT E CONEXÃO\n\n**1. Rapport**  \n- Nunca volte direto pro convite de reunião.  \n- Reabra com pergunta leve e pessoal (família, trabalho, rotina ou algo já citado pelo lead).  \n- Ex.: \"Que bom falar contigo de novo! Como andam as coisas no trabalho?\"  \n\n**2. Conexão**  \n- Só responda ao que o lead compartilhou.  \n- Engaje de forma natural: validar, elogiar, rir junto ou compartilhar algo parecido.  \n- Regra: frases como \"Imagino mesmo!\" ou \"Aqui tá parecido\" **só podem ser usadas se o lead respondeu no momento e deu contexto**.  \n- É **proibido** usar esse tipo de frase em follow-up frio (quando o lead ainda não respondeu).  \n\n**3. Convite**  \n- Depois de 1–2 trocas de rapport, conduza suavemente para o agendamento.  \n- Ex.: \"Fulano, sei que a correria pega pra todo mundo… bora marcar uma call rápida só pra gente se conhecer melhor? Amanhã consigo às [hora AM] ou [hora PM], qual fica melhor pra vc?\" \n\n\n---\n\n---\n\n## QUEBRA DE OBJEÇÕES - MÉTODO ERIC WORRE (GO PRO)\n\n### PRINCÍPIOS FUNDAMENTAIS\n\n1. **FEEL, FELT, FOUND** - A fórmula de ouro para todas objeções\n2. **Nunca se defenda** - Objeção não é ataque pessoal\n3. **Faça perguntas, não discursos** - Deixe o lead se convencer\n4. **Eduque ANTES da objeção** - Previna ao invés de remediar\n5. **Seja consultor, não vendedor** - Mude sua postura\n6. **Entenda a origem** - 90% vem de experiência ruim ou história de terceiros\n\n### FÓRMULA UNIVERSAL: FEEL, FELT, FOUND\n\n**Estrutura em 3 passos:**\n1. **FEEL (Validar)**: \"Entendo como você se sente...\"\n2. **FELT (Conectar)**: \"Muita gente se sentiu assim também...\"\n3. **FOUND (Resolver)**: \"Mas o que descobriram foi...\"\n\n**Por que funciona:**\n- Move a objeção do presente (feel) para o passado (felt)\n- Cria identificação com outros que tiveram sucesso (prova social)\n- Abre espaço para nova perspectiva (found)\n\n---\n\n## OBJEÇÕES ESPECÍFICAS - CARREIRA DE AGENTE FINANCEIRO\n\n### 1️⃣ \"ISSO É PIRÂMIDE?\"\n\n**Método Eric Worre - Nunca se defenda, eduque:**\n\n\"[Nome], entendo perfeitamente seu receio. MUITA gente pensou a mesma coisa quando ouviu falar pela primeira vez. Eu também tive essa dúvida no início.\n\nMas olha o que eu descobri: pirâmide é ILEGAL, certo? Não pode existir. O governo fecha. Aqui a gente tá falando de uma LICENÇA PROFISSIONAL emitida pelo estado, tipo médico, advogado, corretor de imóveis.\n\nQuer ver a diferença? \n\n[PAUSA - deixe o silêncio trabalhar]\n\nPirâmide: você ganha recrutando pessoas, certo? Não tem produto, não tem serviço. É só dinheiro trocando de mão.\n\nAgente Financeiro Licenciado: você ganha ATENDENDO CLIENTES reais que precisam de proteção financeira. E pra isso, você precisa estudar, passar numa prova estadual e tirar uma licença. Se fosse pirâmide, o governo não dava licença, concorda?\n\nPosso te fazer uma pergunta? Vc conhece algum médico ou advogado que tem equipe e ganha sobre o trabalho da equipe dele? Pois é... ninguém chama de pirâmide, né? É a mesma estrutura aqui.\"\n\n**Se continuar resistente:**\n\"Olha, [nome], sem pressão nenhuma. Mas a call vai te mostrar EXATAMENTE como funciona - a licença, os órgãos que regulam, tudo. Melhor do que eu ficar tentando explicar por texto. Você perde algo em tirar 45min pra entender direito?\"\n\n---\n\n### 2️⃣ \"É PRA VENDER SEGURO?\"\n\n**Método Eric Worre - Reformule a profissão:**\n\n\"[Nome], eu sei exatamente o que passou na sua cabeça agora. Eu também pensei assim... 'Ah não, vender seguro de porta em porta, aqueles caras chatos.'\n\nMas ó o que eu descobri: aqui a gente não é VENDEDOR de seguro. A gente é CONSULTOR FINANCEIRO licenciado. É bem diferente.\n\nDeixa eu te explicar...\n\nVendedor de seguro: empurra produto, bate de porta em porta, tenta 'fechar' qualquer um.\n\nAgente Financeiro Licenciado: faz ANÁLISE COMPLETA da situação da pessoa - proteção, aposentadoria, investimento, college plan pros filhos. É consultoria, tipo planejador financeiro.\n\nPergunta sincera: você conhece alguém que trabalha de casa, escolhe o próprio horário, ganha em DÓLAR e fatura 10k, 15k, 20k+ por mês sendo 'vendedor de seguro'? \n\nNão, né? Porque não É vendedor. É profissional de alto nível. Por isso exige licença estadual.\n\nA call vai te mostrar a diferença. Vale 45min pra entender?\"\n\n**Se insistir no preconceito:**\n\"Olha, [nome], eu entendo o preconceito. Mas me responde uma coisa: você prefere ficar com a ideia que tem na cabeça, ou conhecer a realidade? Porque a realidade é BEM diferente do que você tá pensando. Sem compromisso. Só conversa. Depois você decide.\"\n\n---\n\n### 3️⃣ \"É EMPREGO FIXO?\" / \"TEM CARTEIRA ASSINADA?\"\n\n**Método Eric Worre - Questione a mentalidade CLT:**\n\n\"[Nome], entendo sua busca por estabilidade. Brasileiro foi criado pra buscar 'emprego fixo', né? Eu também fui.\n\nMas deixa eu te fazer uma pergunta: você acha que 'emprego fixo' é realmente FIXO? Eles te mandam embora quando quiserem, certo? E você fica travado num salário, com teto, com horário...\n\nO que eu descobri é o seguinte:\n\nCLT = Ilusão de estabilidade. Você depende do chefe, do humor da empresa, da economia. E ganha a mesma coisa todo mês, não importa o quanto se esforce.\n\nAgente Licenciado = Você monta SEU NEGÓCIO. Seus clientes são SEUS. Sua carteira é SUA. Ninguém te manda embora. Isso sim é estabilidade.\n\nPergunta sincera: você prefere ganhar $4.000 fixos pra sempre, ou começar em $2.000 mas poder chegar em $15.000+ conforme você cresce?\n\nPorque aqui não tem teto. Você manda no seu futuro.\"\n\n**Se insistir em segurança:**\n\"Olha, [nome], eu respeito totalmente. Mas me diz uma coisa: você tá nos EUA, certo? EUA é terra de EMPREENDEDOR. Você tem work permit, pode abrir negócio. Por que se limitar a depender de patrão quando você pode construir algo SEU? Pelo menos tira 45min pra ouvir. Não custa nada conhecer. Depois você decide o que faz sentido pra você.\"\n\n---\n\n### 4️⃣ \"TEM SALÁRIO?\" / \"QUANTO VOU GANHAR?\"\n\n**Método Eric Worre - Seja honesto mas mostre escalabilidade:**\n\n\"[Nome], não vou te enganar. Não tem salário fixo. Funciona por COMISSÃO RECORRENTE.\n\nMas ó a diferença...\n\nSalário fixo: você trabalha esse mês, ganha esse mês. Mês que vem, trabalha de novo pra ganhar de novo. É tipo hamster na roda.\n\nComissão recorrente: você fecha UM cliente, ganha TODO MÊS enquanto ele tiver o plano. É tipo ALUGUEL. Você trabalha uma vez, mas recebe pra sempre.\n\nDeixa eu te mostrar a matemática...\n\nSe você fecha 10 clientes que pagam $200/mês, você ganha comissão sobre $2.000 TODO MÊS. \nFecha 50 clientes? São $10.000 entrando mensalmente.\nFecha 100? $20.000.\n\nE isso é SÓ você. Se você montar equipe, ganha também sobre o trabalho da equipe (override).\n\nPergunta sincera: qual você prefere?\n→ Salário de $4.000 travado pra sempre  \n→ OU começar em $2.000 mas escalar pra $10k, $15k, $20k+?\n\nPorque aqui, o único limite é VOCÊ.\"\n\n**Se quiser números concretos:**\n\"Olha, [nome], não vou inventar número. Depende 100% de você. Tem gente que em 3 meses já tá faturando $5k. Tem gente que leva 6 meses. Na call, o [responsável] te mostra cases reais de brasileiros que começaram do zero. Aí você vê se o potencial vale o esforço. Mas te garanto uma coisa: se você quer crescer, aqui tem espaço. No CLT, não tem.\"\n\n---\n\n### 5️⃣ \"PRECISO DE EXPERIÊNCIA?\" / \"NÃO SEI VENDER\"\n\n**Desmistifique a necessidade de experiência:**\n\n\"Não precisa, [nome]. Zero experiência. O treinamento ensina TUDO - desde tirar a licença até como prospectar cliente. É tipo CNH: vc faz o curso, passa na prova, e aí sim começa a trabalhar.\n\nOlha, ninguém nasce sabendo vender, né? Mas aqui vc não vai 'vender'. Vc vai CONSULTAR. É diferente. É tipo médico explicando tratamento - vc apresenta soluções, a pessoa decide.\n\nE mais: vc não fica sozinho. Tem treinamento semanal, mentoria, scripts prontos, CRM com tudo automatizado. É tipo uma franquia - já tem o sistema, vc só segue.\n\nPosso te falar uma parada? A maioria dos agentes de sucesso não tinha experiência. Eles tinham VONTADE. O resto se aprende. Vc tem vontade de mudar de vida ou não?\"\n\n---\n\n### 6️⃣ \"QUANTO CUSTA PRA COMEÇAR?\" / \"PRECISO INVESTIR?\"\n\n**Seja transparente mas contextualize:**\n\n\"Sim, tem investimento inicial, [nome]. Afinal é uma LICENÇA profissional, né? Tipo tirar CNH ou fazer faculdade. Mas o [responsável] explica direitinho os valores e formas de pagamento na call.\n\nPensa assim: vc gastaria quanto numa faculdade? $20k? $50k? E quanto tempo pra se pagar? Aqui o investimento é BEM menor e o retorno pode vir em meses, não em anos.\n\nOlha, eu não vou chutar número por texto porque depende do estado e do pacote. Mas te garanto: é MUITO mais acessível que qualquer faculdade ou franquia. Na call vc vê tudo detalhado.\n\n[Nome], posso ser sincero? Brasileiro que fica esperando 'ter dinheiro sobrando' pra investir em si mesmo nunca sai do lugar. Investimento em carreira é PRIORIDADE, não luxo. A pergunta é: você quer mudar de vida ou não?\"\n\n---\n\n## TÉCNICA ERIC WORRE - EDUCAR ANTES DA OBJEÇÃO\n\n**Como prevenir objeções antes delas surgirem:**\n\nDurante o RAPPORT, ANTES de falar de carreira, insira isso:\n\n\"[Nome], deixa eu te fazer uma pergunta rápida: você sabe a diferença entre negócio tradicional e negócio escalável?\n\n[Espera resposta]\n\nNegócio tradicional: você abre uma loja, contrata funcionários, paga aluguel, tem custo fixo alto. Se você parar, o negócio para.\n\nNegócio escalável: você atende clientes, monta equipe, ganha sobre seu trabalho E sobre o trabalho da equipe. É igual corretor de imóveis, advogado que tem escritório, médico que tem clínica.\n\nPor isso exige LICENÇA. Porque é profissão regulamentada.\n\nFaz sentido até aqui?\"\n\n**Resultado:** Quando você falar de \"montar equipe\" e \"comissão recorrente\", ele já entendeu que é modelo legítimo.\n\n---\n\n## REGRAS DE OURO - QUEBRA DE OBJEÇÕES\n\n1. **Nunca entre na defensiva** - \"Não é pirâmide!\" soa defensivo. Use: \"Entendo sua preocupação, deixa eu te explicar...\"\n\n2. **Use perguntas estratégicas** - Ao invés de discursar: \"Você conhece algum advogado que tem equipe e ganha sobre o trabalho deles?\"\n\n3. **Valide SEMPRE antes de contra-argumentar** - \"Eu também pensei assim...\" / \"Muita gente pensa isso...\"\n\n4. **Use prova social** - \"Tem brasileiros faturando $15k, $20k+ por mês\" (não diga \"você vai ganhar\")\n\n5. **Máximo 2 tentativas por objeção** - Se insistir, não pressione. Ofereça call: \"Vale 45min pra tirar dúvida?\"\n\n6. **Silêncios estratégicos funcionam** - Após pergunta forte, CALE e espere\n\n7. **Foco na CALL, não em fechar por texto** - \"Melhor do que eu explicar por texto, bora marcar 45min?\"\n\n8. **Tom leve e consultivo** - Isabella ajuda, não empurra. Nunca soe desesperada ou agressiva.\n\n---\n\n## QUANDO DESQUALIFICAR (usar Adicionar_tag_perdido)\n\nApós 2 tentativas de quebra de objeção, se o lead:\n- Demonstra hostilidade\n- Diz \"não me procura mais\"\n- Continua insistindo em \"é pirâmide\" mesmo depois da explicação completa\n- Não quer nem ouvir (zero abertura)\n- Claramente não tem fit (mora no Brasil, sem planos pros EUA, etc)\n\n**Script de encerramento educado:**\n\"Tranquilo, [nome]! Sem pressão nenhuma. Qualquer coisa, me chama. Sucesso pra você!\"\n\n---\n\n## FLUXO DE AGENDAMENTO - CRÍTICO\n\n**NUNCA ofereça horários sem antes usar Busca_disponibilidade**\n\n1. Lead demonstra interesse em agendar.  \n2. **OBRIGATÓRIO**: chamar `Busca_disponibilidade` antes de sugerir horários.  \n3. Aguardar retorno da API → usar apenas os horários reais fornecidos (sempre 1 dia + 2 opções).  \n4. Ao oferecer os horários:  \n   - Explicar que o **próximo passo é uma reunião online**.  \n   - **Vender o agendamento** (mostrar valor, não só oferecer).  \n   - Usar técnica de comprometimento: \"Se eu conseguir [dia/hora], vc consegue também?\"  \n5. Confirmar escolha de dia/hora do cliente.  \n6. Coletar dados completos (nome, tel, e-mail) caso ainda não estejam no sistema.  \n7. Criar o agendamento via `Agendar_reuniao`.  \n8. **Proibido**: agendar reuniões duplicadas.  \n\n### EXEMPLOS CORRETOS DE AGENDAMENTO:\n\n✅ \"Maravilha, Daniela! Próximo passo é agendarmos uma reunião online pra que <usuário responsável> possa te explicar direitinho a carreira. Agenda tá bem cheia, mas se eu conseguir te encaixar, você prefere segunda 27/10 às 11am ou às 8pm (NY)?\"\n\n✅ \"Perfeito, João! Vamos marcar nosso papo no Zoom. A agenda de <usuário responsável> tá bem corrida, mas consegui te encaixar dia 28/10. Você prefere às 3pm ou às 8pm (horário de NY)?\"\n\n### EXEMPLOS INCORRETOS (NUNCA FAZER):\n\n❌ \"Maravilha, Daniela. Tenho seg 27/10 11am ou 8pm NY no Zoom. Qual melhor pra vc?\"\n→ Problema: Muito direto, não vende o valor, não cria urgência\n\n❌ \"Tenho disponível segunda e terça. Quando pode?\"\n→ Problema: Não oferece horários específicos, não usa técnica de escassez\n\n❌ \"Posso te agendar para vários horários essa semana.\"\n→ Problema: Remove a urgência, não usa escassez\n\n---\n\n## ⚠️ REGRA CRÍTICA - AGENDAMENTOS DUPLICADOS\n\n**ANTES de chamar Agendar_reuniao, SEMPRE verifique:**\n\n1. Você JÁ agendou este lead NESTA conversa?\n   - Procure no histórico por confirmações como \"Registrei aqui no direct\"\n   - Se SIM = NÃO agende novamente. Apenas confirme o agendamento existente.\n   \n2. O lead está pedindo para MUDAR o horário?\n   - Se SIM = É um reagendamento. Informe que vai remarcar.\n   - Se NÃO = Mantenha o agendamento original.\n\n**PROIBIDO fazer dois agendamentos na mesma conversa, exceto se for reagendamento explícito.**\n\nExemplos de reagendamento legítimo:\n✅ \"Não consigo às 3pm, tem outro horário?\"\n✅ \"Preciso remarcar, surgiu um imprevisto\"\n✅ \"Mudou minha agenda, pode ser outro dia?\"\n\nExemplos onde NÃO deve reagendar:\n❌ Lead não respondeu ainda se confirma o horário\n❌ Você já enviou confirmação com dia/hora\n❌ Lead apenas agradeceu ou disse \"ok\"\n\n---\n\n## COLETA DE DADOS E CONFIRMAÇÃO\n\n**SEMPRE responda com a mensagem completa, não pela metade!**\n\n- Após escolha do horário:  \n\"Perfeito! Pra confirmar, digite seu email e WhatsApp, por favor. Assim evito erro de número no agendamento.\"\n\n- Se não tiver dados, colete e agende imediatamente.  \n\n- Se API validada, confirme:  \n\"Maravilhaaa [nome]! Vou enviar por e-mail e WhatsApp, ok?\"\n\n- Se erro na API, valide:  \n  - EUA: \"Número +1XXXXXXXXXX, certo?\"  \n  - Brasil: \"Número +55XXXXXXXXX, certo?\"  \n  - Se não informar país: \"Número é dos EUA ou Brasil?\"  \n  - E-mail: \"Esse <email>, tá escrito certinho mesmo?\"\n\n- Após agendamento bem-sucedido, envie:  \n\"Valeu, [nome]! Registrei aqui no direct: <dia_reuniao>, às <horario_reuniao> (NY).\"\n\n- Nunca use placeholders genéricos — sempre variáveis reais.\n- Confirme agendamento só depois de coletar todos os dados e validar API.\n- Caso perguntem o tempo da reunião: 45 a 60 minutos\n\n---\n\n## FOLLOW-UP - REGRAS\n\n### Iniciar follow-up:\n\n- Se lead disser que não pode falar (trabalho, viagem, etc), marque data/hora solicitados.  \n- Se sumir sem responder, agende follow-up no mesmo dia em horários estratégicos.  \n- Se identificar momento ideal, registre data e mensagem personalizada nos campos:  \n  - data_msg_fup (ID: 2796271)  \n  - mensagem_fup (ID: 2796273)\n\n### Finalizar follow-up:\n\n- Ao receber resposta do lead, apague mensagem_fup (ID: 2796273) e data_msg_fup (ID: 2796271).  \n- Só depois disso, prossiga com conexão, qualificação e agendamento.\n\n---\n\n## PROCESSO OPERACIONAL COMPLETO\n\n1. Refletir com infos disponíveis antes de responder\n2. Identificar interesse (carreira/consultoria)\n3. Seguir SOP mas pular etapas se já tem informação\n4a. Apenas para lead de carreira: coletar work permit.\n4b. Coletar estado.\n4c. Coletar profissão quando relevante.\n5. Após coletar dados explicar que o próximo passo é agendar reunião online e \"vender o agendamento\"\n6. **CRÍTICO: NUNCA oferecer horários sem usar Busca_disponibilidade primeiro - SEMPRE consultar a API antes de qualquer oferta de horário**\n7. Agendar com calendarId correto do responsável\n8. Não perguntar sobre responsável/agenda específica\n9. Se falhar agendamento, buscar alternativas\n10. Se o dia e horário não forem aceitos, chamar Buscar_disponibilidade novamente para conferir alternativas. Se não tiver, agende follow-up para 7 dias depois.\n11. Escalar para humano se necessário\n12. Buscar história do usuário responsável para respostas personalizadas\n\n## ⚠️ LEMBRETE CRÍTICO\nVocê NÃO PODE sugerir horários sem ter chamado Busca_disponibilidade ANTES. Horários \"inventados\" causam frustração no cliente e prejudicam a operação.",
              "type": "string"
            },
            {
              "id": "7c1cec03-5b93-4741-a15c-01ccaade24de",
              "name": "origem",
              "value": "Prompt F2 - Funil Tráfego Direto",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        5824,
        1280
      ],
      "id": "09906df6-8640-4103-8dc0-3718c8a5c94d",
      "name": "Customer Success"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.user_prompt }}",
        "options": {
          "systemMessage": "={{ $json.system_prompt }}\n\n## HISTÓRICO DE CONVERSAS ANTIGAS\n{{ $('Set mensagens').first().json.mensagens_antigas }}"
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.6,
      "position": [
        6688,
        976
      ],
      "id": "663ecbb1-2a03-40e9-8065-b9cdeb3bb6da",
      "name": "AI Agent - Modular"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "66bb063b-646e-4774-9415-e21a35c7e99b",
              "leftValue": "={{ $json.output }}",
              "rightValue": "<ctrl",
              "operator": {
                "type": "string",
                "operation": "notContains"
              }
            },
            {
              "id": "50ac2eba-f7b0-4477-98e6-f19887142f51",
              "leftValue": "{{ $json.output }}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "notEmpty",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        7008,
        976
      ],
      "id": "d193a3e4-d363-42c9-957f-4bb109712ab2",
      "name": "Tudo certo?4"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "WITH agent AS (\n  SELECT id\n  FROM agent_versions\n  WHERE location_id = '{{ $('Info').first().json.location_id }}'\n    AND is_active = true\n  LIMIT 1\n)\nINSERT INTO agent_conversations (\n  agent_version_id,\n  contact_id,\n  conversation_id,\n  channel,\n  status,\n  outcome,\n  mensagens_total,\n  started_at\n)\nSELECT\n  agent.id,\n  '{{ $('Info').first().json.lead_id }}',\n  '{{ $('Info').first().json.lead_id }}',\n  '{{ $('Info').first().json.source }}',\n  'active',\n  'in_progress',\n  1,\n  NOW()\nFROM agent\nON CONFLICT (contact_id) DO UPDATE SET\n  mensagens_total = agent_conversations.mensagens_total + 1\nRETURNING *;\n",
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        496,
        496
      ],
      "id": "1c441425-c366-40db-a54d-71e6ee89c716",
      "name": "SI - Upsert Conversation",
      "alwaysOutputData": true,
      "notesInFlow": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput",
      "notes": "Self-Improving: Cria/atualiza conversa"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO agent_conversation_messages (\n  conversation_id,\n  message_text,\n  is_from_lead,\n  created_at\n)\nSELECT\n  ac.id,\n  '{{ $json.mensagem }}',\n  true,\n  NOW()\nFROM agent_conversations ac\nWHERE ac.contact_id = '{{ $('Info').first().json.lead_id }}'\nLIMIT 1\nRETURNING *;",
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        5200,
        192
      ],
      "id": "528b23f1-75bd-486e-84a0-18e4fc446524",
      "name": "SI - Insert Lead Message",
      "alwaysOutputData": true,
      "notesInFlow": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput",
      "notes": "Self-Improving: Mensagem do lead"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO agent_conversation_messages (\n  conversation_id,\n  message_text,\n  is_from_lead,\n  created_at\n)\nSELECT\n  ac.id,\n  '{{ $('Parser Chain').first().json.output.messages.join(\"\") }}',\n  false,\n  NOW()\nFROM agent_conversations ac\nWHERE ac.contact_id = '{{ $('Info').first().json.lead_id }}'\nLIMIT 1\nRETURNING *;",
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        10176,
        -128
      ],
      "id": "59d5dee3-6a9c-433a-8a10-ccebabad18a8",
      "name": "SI - Insert AI Message",
      "alwaysOutputData": true,
      "notesInFlow": true,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput",
      "notes": "Self-Improving: Resposta da IA"
    },
    {
      "parameters": {
        "content": "## Self-Improving AI Integration\n\n**Como usar estes nos:**\n\n1. **SI - Upsert Conversation**\n   - Conectar APOS o no 'Info'\n   - Executar em PARALELO com o fluxo principal\n\n2. **SI - Insert Lead Message**\n   - Conectar APOS 'historico_mensagens_leads'\n   - Executar em PARALELO\n\n3. **SI - Insert AI Message**\n   - Conectar APOS 'Memoria IA'\n   - Executar em PARALELO\n\n4. **SI - Update Outcome** (Opcional)\n   - Conectar quando etapa do funil muda\n\n**IMPORTANTE:**\n- Os nos usam 'onError: continueRegularOutput' para nao quebrar o fluxo principal\n- Prefixo 'SI' = Self-Improving",
        "height": 544,
        "width": 400,
        "color": 5
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        -736,
        1072
      ],
      "id": "36f27ef4-95fd-4689-8b5e-b097fc2dad86",
      "name": "Instrucoes de Integracao"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=Mensagem do usuário a ser formatada: {{ $('Tipo de mensagem1').first().json.output }}",
        "hasOutputParser": true,
        "messages": {
          "messageValues": [
            {
              "message": "=Por favor, gere a saída no seguinte formato JSON:\n{\n  \"messages\": [\n    \"splitedMessage\",\n    \"splitedMessage\",\n    \"splitedMessage\"\n  ]\n}\n\nVocê é especialista em formatação de mensagem para WhatsApp e instagram, trabalhando somente na formatação e não alterando o conteúdo da menssagem. Responda apenas com o texto final, não comente nada e não fale 'sua mensagem formatada', apenas o texto final. Não comente e nem fale por conta própria, apenas pegue a mensagem do usuário e formate.\n\nRecomendado: ideal entre 1-2 mensagens e no max 3.\n\n- Substitua ** por *\n- Remova #\n- remova \\n e quebra de linhas\n- Substitua aspas duplas por aspas simples \" > '\n"
            }
          ]
        },
        "batching": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chainLlm",
      "typeVersion": 1.7,
      "position": [
        8832,
        320
      ],
      "id": "68545f00-8522-453a-a949-de63f4e0e114",
      "name": "Parser Chain",
      "executeOnce": true,
      "retryOnFail": true
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Set mensagens - Mapeia campos do workflow Info para formato interno\nconst input = $input.item.json;\n\n// Pegar dados do Info diretamente para garantir calendários\nconst infoData = $('Info').first().json;\n\n// Extrair source baseado no agente\nlet source = 'whatsapp';\nif (input.agente_ia === 'social_seller_instagram' || input.source === 'instagram') {\n  source = 'instagram';\n}\n\n// Extrair etiquetas (pode ser string ou array)\nlet etiquetas = [];\nif (input.etiquetas) {\n  etiquetas = typeof input.etiquetas === 'string' \n    ? input.etiquetas.split(',').map(t => t.trim()).filter(t => t) \n    : input.etiquetas;\n}\n\n// ─────────────────────────────────────────────────────────────────────────────\n// DADOS DO FORMULÁRIO DE TRÁFEGO (Facebook/Instagram Ads)\n// ─────────────────────────────────────────────────────────────────────────────\nconst formularioTrafego = {\n  origem_campanha: infoData.utm_campaign || input.utm_source || '',\n  sintomas_atuais: infoData.form_sintomas_atualmente || '',\n  procurou_ajuda: infoData.form_procurou_ajuda_medica || '',\n  mudanca_corpo: infoData.form_mudanca_no_corpo || '',\n  preferencia_consulta: infoData.form_tipo_de_consulta || '',\n  pronto_investir: infoData.form_interessado_em_investir || ''\n};\n\n// Verificar se é lead de tráfego (tem dados do formulário)\nconst isLeadTrafego = !!(formularioTrafego.sintomas_atuais || formularioTrafego.preferencia_consulta || formularioTrafego.origem_campanha || formularioTrafego.procurou_ajuda);\n\nreturn {\n  json: {\n    // IDs\n    location_id: infoData.location_id || input.owner_origin || '',\n    contact_id: infoData.lead_id || '',\n    conversation_id: infoData.id_conversa_alerta || infoData.lead_id || '',\n    \n    // Dados do contato\n    phone: infoData.telefone || '',\n    full_name: infoData.full_name || infoData.first_name || 'Visitante',\n    \n    // Mensagem\n    message: infoData.mensagem || input.resposta_ia || '',\n    source: source,\n    \n    // Contexto do lead\n    historico: input.historico || [],\n    etiquetas: etiquetas,\n    status_pagamento: infoData.status_cobranca || 'nenhum',\n    preferencia_audio_texto: infoData.tipo_mensagem_original || 'texto',\n    \n    // Modo do agente\n    modo_agente: infoData.agente_ia || 'sdr_inbound',\n    \n    // Calendários do GHL - AGORA PEGANDO DO INFO DIRETAMENTE\n    calendarios_ghl: {\n      sao_paulo: infoData.agenda_consultorio_sao_paulo || '',\n      presidente_prudente: infoData.agenda_presidente_prudente || '',\n      online: infoData.agenda_consulta_online || ''\n    },\n    \n    // API Key\n    ghl_api_key: infoData.api_key || '',\n    \n    // Dados extras do lead\n    objetivo: infoData.objetivo_do_lead || '',\n    is_primeira_mensagem: infoData.is_primeira_mensagem || false,\n    tipo_lead: infoData.tipo_lead || 'NAO_IDENTIFICADO',\n    \n    // Dados do formulário de tráfego\n    formulario_trafego: formularioTrafego,\n    is_lead_trafego: isLeadTrafego\n  }\n};"
      },
      "id": "cc27f040-ecf1-4f8f-aefd-89d0dc4fb5c8",
      "name": "Set mensagens2",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        5360,
        1632
      ]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "=SELECT av.*, l.api_key as location_api_key\nFROM agent_versions av\nLEFT JOIN locations l ON av.location_id = l.location_id\nWHERE av.location_id = '{{ $('Set mensagens').first().json.location_id }}'\n  AND av.is_active = true\n  AND av.status = 'active'\nORDER BY av.deployed_at DESC NULLS LAST, av.created_at DESC\nLIMIT 1",
        "options": {}
      },
      "id": "75331207-b907-4bac-a13d-a8532ed7f66c",
      "name": "Buscar Agente Ativo2",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.5,
      "position": [
        5584,
        1632
      ],
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      }
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// ═══════════════════════════════════════════════════════════════════════════\n// FORMATAR CALENDÁRIOS\n// Usa calendários do GHL (customData) com fallback para scheduling_config\n// ═══════════════════════════════════════════════════════════════════════════\n\nconst prev = $input.item.json;\nconst schedulingConfig = prev.scheduling_config || {};\nconst calendariosGHL = prev.calendarios_ghl || {};\n\n// Mapear calendários - prioridade para GHL, fallback para config do agente\nconst calendarios = [];\n\nconst calSP = calendariosGHL.sao_paulo || schedulingConfig.agenda_consultorio_sao_paulo;\nconst calPP = calendariosGHL.presidente_prudente || schedulingConfig.agenda_presidente_prudente;\nconst calOnline = calendariosGHL.online || schedulingConfig.agenda_consulta_online;\n\nif (calSP) {\n  calendarios.push(`• Consultório São Paulo (Moema): ID ${calSP}`);\n}\n\nif (calPP) {\n  calendarios.push(`• Unidade Presidente Prudente: ID ${calPP}`);\n}\n\nif (calOnline) {\n  calendarios.push(`• Consulta Online (Telemedicina): ID ${calOnline}`);\n}\n\n// Se não houver calendários configurados\nif (calendarios.length === 0) {\n  calendarios.push('• Calendários não configurados');\n}\n\nconst calendariosFormatados = calendarios.join('\\n');\n\n// Informações de agendamento\nconst agendamentoInfo = [\n  `Horários: Segunda a Sexta, 9h-18h | Sábado 8h-12h`,\n  `Duração consulta: 1h a 1h30`,\n  `Antecedência mínima: 24 horas`,\n  `Cancelamento: Até 24h antes sem custo`\n].join('\\n');\n\nreturn {\n  json: {\n    ...prev,\n    calendarios_formatados: calendariosFormatados,\n    agendamento_info: agendamentoInfo,\n    // IDs para usar nas tools de agendamento\n    calendar_ids: {\n      sao_paulo: calSP || '',\n      presidente_prudente: calPP || '',\n      online: calOnline || ''\n    },\n    // Garantir que dados do formulário passam adiante\n    formulario_trafego: prev.formulario_trafego || {},\n    is_lead_trafego: prev.is_lead_trafego || false\n  }\n};"
      },
      "id": "ab5ff102-3afc-4a7e-a208-9eb184999590",
      "name": "Formatar Calendários1",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        6016,
        1632
      ]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// ═══════════════════════════════════════════════════════════════════════════\n// MONTAR PROMPTS FINAIS v6.6 - VERSÃO SUPABASE\n// Pega prompts modulares do campo prompts_by_mode do Supabase\n// ═══════════════════════════════════════════════════════════════════════════\n\nconst prev = $input.item.json;\n\n// ─────────────────────────────────────────────────────────────────────────────\n// FUNÇÃO PARA SUBSTITUIR VARIÁVEIS MUSTACHE\n// ─────────────────────────────────────────────────────────────────────────────\nfunction replaceVars(template, vars) {\n  if (!template) return '';\n  let result = template;\n\n  for (const [key, value] of Object.entries(vars)) {\n    const pattern = new RegExp(`\\\\{\\\\{\\\\s*${key}\\\\s*\\\\}\\\\}`, 'g');\n    result = result.replace(pattern, value || '');\n  }\n\n  return result;\n}\n\n// ─────────────────────────────────────────────────────────────────────────────\n// VARIÁVEIS PARA SUBSTITUIÇÃO\n// ─────────────────────────────────────────────────────────────────────────────\nconst variaveis = {\n  modo_agente: prev.agent_type || 'sdr_inbound',\n  source: prev.source || 'instagram',\n  full_name: prev.full_name || 'Visitante',\n  timezone: 'America/Sao_Paulo',\n  agente: prev.agent_name || 'Isabella',\n  data_hora: prev.data_hora,\n  status_pagamento: prev.status_pagamento || 'nenhum',\n  preferencia_audio_texto: prev.preferencia_audio_texto || 'texto'\n};\n\n// ─────────────────────────────────────────────────────────────────────────────\n// DETECTAR MODO ATIVO (agente_ia)\n// ─────────────────────────────────────────────────────────────────────────────\nconst modoAtivo = prev.agente_ia || prev.agent_type || 'sdr_inbound';\n\n// ─────────────────────────────────────────────────────────────────────────────\n// PEGAR PROMPTS DO SUPABASE (prompts_by_mode)\n// ─────────────────────────────────────────────────────────────────────────────\nconst promptsDoAgente = prev.prompts_by_mode || {};\n\n// Normalizar o modo para encontrar no JSON\nfunction normalizarModo(modo) {\n  const modoLower = (modo || '').toLowerCase().trim();\n\n  const aliases = {\n    'sdr': 'sdr_inbound',\n    'inbound': 'sdr_inbound',\n    'social_seller': 'social_seller_instagram',\n    'instagram': 'social_seller_instagram',\n    'agendamento': 'scheduler',\n    'followup': 'followuper',\n    'objecao': 'objection_handler',\n    'objecoes': 'objection_handler',\n    'reativador': 'reativador_base'\n  };\n\n  return aliases[modoLower] || modoLower;\n}\n\nconst modoNormalizado = normalizarModo(modoAtivo);\n\n// Pegar o prompt do modo ativo (ou fallback para sdr_inbound)\nconst promptModoAtivo = promptsDoAgente[modoNormalizado]\n  || promptsDoAgente['sdr_inbound']\n  || '';\n\n// Prompt base vem do system_prompt do agente\nconst promptBase = prev.system_prompt || '';\n\n// ─────────────────────────────────────────────────────────────────────────────\n// MONTAR SYSTEM PROMPT FINAL\n// ─────────────────────────────────────────────────────────────────────────────\nlet systemPrompt = promptBase + '\\n\\n' + promptModoAtivo;\n\n// Substituir variáveis\nsystemPrompt = replaceVars(systemPrompt, variaveis);\n\n// ─────────────────────────────────────────────────────────────────────────────\n// REGRA DINÂMICA DE SAUDAÇÃO\n// ─────────────────────────────────────────────────────────────────────────────\nlet regraSaudacao = '';\nconst hora = prev.hora_numero;\nconst historicoExiste = prev.historico_existe;\n\nif (!historicoExiste) {\n  if (hora >= 5 && hora < 12) {\n    regraSaudacao = '\\n\\n<regra_saudacao>\\nÉ a PRIMEIRA mensagem. Inicie com \"Bom dia\" de forma calorosa.\\n</regra_saudacao>';\n  } else if (hora >= 12 && hora < 18) {\n    regraSaudacao = '\\n\\n<regra_saudacao>\\nÉ a PRIMEIRA mensagem. Inicie com \"Boa tarde\" de forma calorosa.\\n</regra_saudacao>';\n  } else {\n    regraSaudacao = '\\n\\n<regra_saudacao>\\nÉ a PRIMEIRA mensagem. Inicie com \"Boa noite\" de forma calorosa.\\n</regra_saudacao>';\n  }\n} else {\n  regraSaudacao = '\\n\\n<regra_saudacao>\\nConversa já iniciada. NÃO repita saudação. Continue naturalmente.\\n</regra_saudacao>';\n}\n\nsystemPrompt += regraSaudacao;\n\n// ─────────────────────────────────────────────────────────────────────────────\n// MONTAR BLOCO DE RESPOSTAS DO FORMULÁRIO DE TRÁFEGO\n// ─────────────────────────────────────────────────────────────────────────────\nlet blocoFormularioTrafego = '';\nconst form = prev.formulario_trafego || {};\nconst isLeadTrafego = prev.is_lead_trafego || false;\n\nif (isLeadTrafego) {\n  const linhas = [];\n  if (form.origem_campanha) linhas.push(`VEIO POR CAMPANHA: ${form.origem_campanha}`);\n  if (form.procurou_ajuda) linhas.push(`PROCUROU AJUDA ANTES: ${form.procurou_ajuda}`);\n  if (form.sintomas_atuais) linhas.push(`SINTOMAS ATUAIS: ${form.sintomas_atuais}`);\n  if (form.mudanca_corpo) linhas.push(`MUDANÇA NO CORPO: ${form.mudanca_corpo}`);\n  if (form.preferencia_consulta) linhas.push(`PREFERÊNCIA CONSULTA: ${form.preferencia_consulta}`);\n  if (form.pronto_investir) linhas.push(`PRONTO PRA INVESTIR: ${form.pronto_investir}`);\n\n  if (linhas.length > 0) {\n    blocoFormularioTrafego = `\\n<respostas_formulario_trafego>\\n${linhas.join('\\n')}\\n</respostas_formulario_trafego>\\n`;\n  }\n}\n\n// ─────────────────────────────────────────────────────────────────────────────\n// MONTAR USER PROMPT\n// ─────────────────────────────────────────────────────────────────────────────\nconst etiquetasStr = Array.isArray(prev.etiquetas)\n  ? prev.etiquetas.join(', ')\n  : (prev.etiquetas || 'nenhuma');\n\nlet userPrompt = `\n<contexto_conversa>\nLEAD: ${prev.full_name}\nCANAL: ${prev.source}\nDDD: ${prev.ddd || 'não identificado'}\nDATA/HORA: ${prev.data_hora}\nETIQUETAS: ${etiquetasStr}\nSTATUS PAGAMENTO: ${prev.status_pagamento}\nMODO ATIVO: ${modoAtivo}\n</contexto_conversa>\n`;\n\nif (blocoFormularioTrafego) {\n  userPrompt += blocoFormularioTrafego;\n}\n\nuserPrompt += `\n<hiperpersonalizacao>\n${prev.contexto_hiperpersonalizado}\n</hiperpersonalizacao>\n\n<calendarios_disponiveis>\n${prev.calendarios_formatados || ''}\n\n${prev.agendamento_info || ''}\n</calendarios_disponiveis>\n`;\n\nif (prev.historico_formatado) {\n  userPrompt += `\n<historico_conversa>\n${prev.historico_formatado}\n</historico_conversa>\n`;\n}\n\nuserPrompt += `\n<mensagem_atual>\nLEAD: ${prev.message}\n</mensagem_atual>\n\nResponda à mensagem acima como Isabella, seguindo as instruções do MODO ATIVO: ${modoAtivo}.`;\n\n// ─────────────────────────────────────────────────────────────────────────────\n// OUTPUT FINAL\n// ─────────────────────────────────────────────────────────────────────────────\nreturn {\n  json: {\n    system_prompt: systemPrompt,\n    user_prompt: userPrompt,\n    _meta: {\n      agent_name: prev.agent_name || 'Isabella',\n      agent_version: prev.version || 'v6.6',\n      modo_ativo: modoAtivo,\n      modo_normalizado: modoNormalizado,\n      prompt_modo_encontrado: !!promptsDoAgente[modoNormalizado],\n      contact_id: prev.contact_id,\n      conversation_id: prev.conversation_id,\n      historico_mensagens: prev.historico_existe ? 'sim' : 'não',\n      hora_execucao: prev.data_hora,\n      is_lead_trafego: isLeadTrafego,\n      prompt_size: systemPrompt.length,\n      modos_disponiveis: Object.keys(promptsDoAgente)\n    }\n  }\n};"
      },
      "id": "cf20742a-6d5e-4ddc-9aa3-83979c3ce0f5",
      "name": "Montar Prompts Finais1",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        6240,
        1632
      ]
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// ═══════════════════════════════════════════════════════════════════════════\n// PREPARAR EXECUÇÃO + IDENTIFICAR CONTEXTO v6.6 - VERSÃO SUPABASE\n// Passa prompts_by_mode do Supabase para o próximo nó\n// ═══════════════════════════════════════════════════════════════════════════\n\n// Pegar dados do agente (vem do node anterior - Buscar Agente Ativo)\nconst agent = $input.item.json;\n\n// Pegar dados das mensagens dos nodes Set mensagens\nconst mensagens = $('Set mensagens2').first().json;\nconst setMensagens = $('Set mensagens').first().json;\n\n// Pegar customData do webhook original\nconst customData = $('Mensagem recebida').first().json.body?.customData || {};\n\n// Pegar agente_ia direto do Info (fonte mais confiável)\nconst infoData = $('Info').first().json;\n\n// ─────────────────────────────────────────────────────────────────────────────\n// PARSE SEGURO DE JSON\n// ─────────────────────────────────────────────────────────────────────────────\nfunction safeParseJSON(value, fallback = {}) {\n  if (!value) return fallback;\n  if (typeof value === 'object') return value;\n  try {\n    return JSON.parse(value);\n  } catch (e) {\n    console.log('Erro parsing JSON:', e.message);\n    return fallback;\n  }\n}\n\n// ─────────────────────────────────────────────────────────────────────────────\n// EXTRAIR DDD DO TELEFONE\n// ─────────────────────────────────────────────────────────────────────────────\nfunction extrairDDD(telefone) {\n  if (!telefone) return null;\n  const limpo = telefone.replace(/\\D/g, '');\n\n  if (limpo.startsWith('55') && limpo.length >= 12) {\n    return limpo.substring(2, 4);\n  }\n  if (limpo.length >= 10 && limpo.length <= 11) {\n    return limpo.substring(0, 2);\n  }\n  return null;\n}\n\n// ─────────────────────────────────────────────────────────────────────────────\n// DETERMINAR PERÍODO DO DIA\n// ─────────────────────────────────────────────────────────────────────────────\nfunction getPeriodoHorario() {\n  const agora = new Date();\n  const hora = agora.getHours();\n\n  if (hora >= 5 && hora < 12) return 'manha';\n  if (hora >= 12 && hora < 18) return 'tarde';\n  return 'noite';\n}\n\n// ─────────────────────────────────────────────────────────────────────────────\n// GERAR CONTEXTO HIPERPERSONALIZADO\n// ─────────────────────────────────────────────────────────────────────────────\nfunction gerarContextoHiperpersonalizado(ddd, periodo, hyperConfig) {\n  const contextos = [];\n\n  if (hyperConfig.personalizacao_por_ddd && ddd) {\n    const dddConfig = hyperConfig.personalizacao_por_ddd[ddd];\n    if (dddConfig) {\n      contextos.push(`[REGIÃO ${ddd}] ${dddConfig.contexto || ''}`);\n      if (dddConfig.unidade_proxima) {\n        contextos.push(`Unidade mais próxima: ${dddConfig.unidade_proxima}`);\n      }\n    }\n  }\n\n  if (hyperConfig.saudacoes_por_horario) {\n    const saudacao = hyperConfig.saudacoes_por_horario[periodo];\n    if (saudacao) {\n      contextos.push(`Saudação recomendada: \"${saudacao}\"`);\n    }\n  }\n\n  return contextos.length > 0\n    ? contextos.join('\\n')\n    : 'Usar abordagem padrão empática e acolhedora';\n}\n\n// ─────────────────────────────────────────────────────────────────────────────\n// PARSEAR CONFIGURAÇÕES DO AGENTE\n// ─────────────────────────────────────────────────────────────────────────────\nconst toolsConfig = safeParseJSON(agent.tools_config, {});\nconst businessConfig = safeParseJSON(agent.business_config, {});\nconst hyperpersonalization = safeParseJSON(agent.hyperpersonalization, {});\nconst qualificationConfig = safeParseJSON(agent.qualification_config, {});\nconst schedulingConfig = safeParseJSON(agent.scheduling_config, {});\nconst complianceConfig = safeParseJSON(agent.compliance_config, {});\nconst escalationConfig = safeParseJSON(agent.escalation_config, {});\nconst metricsConfig = safeParseJSON(agent.metrics_config, {});\nconst integrationConfig = safeParseJSON(agent.integration_config, {});\nconst knowledgeBase = safeParseJSON(agent.knowledge_base, []);\n\n// ⚠️ NOVO v6.6: Parsear prompts_by_mode do Supabase\nconst promptsByMode = safeParseJSON(agent.prompts_by_mode, {});\n\n// ─────────────────────────────────────────────────────────────────────────────\n// DADOS CONTEXTUAIS\n// ─────────────────────────────────────────────────────────────────────────────\nconst ddd = extrairDDD(mensagens.phone);\nconst periodo = getPeriodoHorario();\nconst agora = new Date();\nconst dataHora = agora.toLocaleString('pt-BR', {\n  timeZone: 'America/Sao_Paulo',\n  dateStyle: 'full',\n  timeStyle: 'short'\n});\n\nconst contextoHiper = gerarContextoHiperpersonalizado(ddd, periodo, hyperpersonalization);\n\n// ─────────────────────────────────────────────────────────────────────────────\n// FORMATAR HISTÓRICO\n// ─────────────────────────────────────────────────────────────────────────────\nlet historicoFormatado = '';\nif (mensagens.historico && mensagens.historico.length > 0) {\n  historicoFormatado = mensagens.historico\n    .slice(-10)\n    .map(m => `${m.role === 'user' ? 'LEAD' : 'ISABELLA'}: ${m.content}`)\n    .join('\\n');\n}\n\n// ─────────────────────────────────────────────────────────────────────────────\n// DETECTAR MODO ATIVO (agente_ia)\n// ─────────────────────────────────────────────────────────────────────────────\nconst agenteIA = infoData.agente_ia\n  || customData.agente_ia\n  || customData.agente_IA\n  || setMensagens.source\n  || mensagens.modo_agente\n  || agent.agent_type\n  || 'sdr_inbound';\n\nconsole.log('>>> MODO ATIVO DETECTADO:', agenteIA);\nconsole.log('>>> PROMPTS DISPONÍVEIS:', Object.keys(promptsByMode));\n\n// ─────────────────────────────────────────────────────────────────────────────\n// OUTPUT\n// ─────────────────────────────────────────────────────────────────────────────\nreturn {\n  json: {\n    agent_id: agent.id,\n    agent_name: agent.agent_name || 'Isabella',\n    agent_type: agent.agent_type,\n    version: agent.version,\n    system_prompt: agent.system_prompt,\n    user_prompt_template: agent.user_prompt_template,\n    location_api_key: agent.location_api_key,\n    agente_ia: agenteIA,\n    prompts_by_mode: promptsByMode,\n    tools_config: toolsConfig,\n    business_config: businessConfig,\n    hyperpersonalization: hyperpersonalization,\n    qualification_config: qualificationConfig,\n    scheduling_config: schedulingConfig,\n    compliance_config: complianceConfig,\n    escalation_config: escalationConfig,\n    metrics_config: metricsConfig,\n    integration_config: integrationConfig,\n    knowledge_base: knowledgeBase,\n    contact_id: mensagens.contact_id,\n    phone: mensagens.phone,\n    full_name: mensagens.full_name,\n    source: mensagens.source,\n    message: mensagens.message,\n    conversation_id: mensagens.conversation_id,\n    etiquetas: mensagens.etiquetas,\n    status_pagamento: mensagens.status_pagamento,\n    preferencia_audio_texto: mensagens.preferencia_audio_texto,\n    ddd: ddd,\n    periodo: periodo,\n    data_hora: dataHora,\n    contexto_hiperpersonalizado: contextoHiper,\n    historico_formatado: historicoFormatado,\n    historico_existe: mensagens.historico && mensagens.historico.length > 0,\n    hora_numero: agora.getHours(),\n    calendarios_ghl: mensagens.calendarios_ghl || {},\n    ghl_api_key: mensagens.ghl_api_key || '',\n    formulario_trafego: mensagens.formulario_trafego || {},\n    is_lead_trafego: mensagens.is_lead_trafego || false\n  }\n};"
      },
      "id": "7ad8fd16-75cc-436e-817e-22efff1abe3c",
      "name": "Preparar Execução + Identificar Contexto3",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        5808,
        1632
      ]
    },
    {
      "parameters": {
        "toolDescription": "Adicionar tag 'perdido'. Use quando o lead se enquadrar em qualquer situação: já cadastrado, é agente, mora no Brasil, sem interesse, ou está insatisfeito. Motivo da desqualificação deve ser especificado.",
        "method": "PUT",
        "url": "https://services.leadconnectorhq.com/contacts/{contact_Id}",
        "sendHeaders": true,
        "parametersHeaders": {
          "values": [
            {
              "name": "Authorization",
              "valueProvider": "fieldValue",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "valueProvider": "fieldValue",
              "value": "2021-04-15"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"tags\": [\"perdido\"]\n}",
        "placeholderDefinitions": {
          "values": [
            {
              "name": "contact_Id",
              "description": "ID do contato",
              "type": "string"
            }
          ]
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
      "typeVersion": 1.1,
      "position": [
        6320,
        560
      ],
      "id": "35fe3339-b424-44e6-99dd-e551e1577e21",
      "name": "Adicionar_tag_perdido"
    },
    {
      "parameters": {
        "description": "Utilize essa ferramenta para direcionar o atendimento para o gestor responsável.",
        "workflowId": {
          "__rl": true,
          "value": "0r0V3ija6EM88T6E",
          "mode": "list",
          "cachedResultUrl": "/workflow/0r0V3ija6EM88T6E",
          "cachedResultName": "05 - Escalar para humano - SOCIALFY"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "api key v2": "={{ $('Info').first().json.api_key }}",
            "telefone": "={{ $('Info').first().json.telefone }}",
            "message": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('message', ``, 'string') }}",
            "contact_id": "={{ $('Info').first().json.id_conversa_alerta }}",
            "location.id": "={{ $('Info').first().json.location_id }}",
            "usuario_responsavel": "={{ $('Mensagem recebida').first().json.body.location.name }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "contact_id",
              "displayName": "contact_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "api key v2",
              "displayName": "api key v2",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "telefone",
              "displayName": "telefone",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "message",
              "displayName": "message",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "location.id",
              "displayName": "location.id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "usuario_responsavel",
              "displayName": "usuario_responsavel",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "telefone",
              "displayName": "telefone",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        6448,
        1200
      ],
      "id": "5e2db320-0bbe-4b1d-9a16-4c82e98fa4d5",
      "name": "Escalar humano"
    },
    {
      "parameters": {
        "description": "Use essa ferramenta para refletir sobre algo. Ela não obterá novas informações nem alterará o banco de dados, apenas adicionará o pensamento ao registro. Use-a quando for necessário um raciocínio complexo ou alguma memória em cache."
      },
      "type": "@n8n/n8n-nodes-langchain.toolThink",
      "typeVersion": 1.1,
      "position": [
        6576,
        1200
      ],
      "id": "6439ceda-2199-45ff-97f2-8934925a89b0",
      "name": "Refletir"
    },
    {
      "parameters": {
        "description": "Utilize essa ferramenta para atualizar informações no título e descrição do evento.\n\n* Ao atualizar o título e descrição, sempre verifique se você está mantendo informações anteriores que ainda são relevantes. Caso informações importantes no título e descrição do evento não tenham mudado, mantenha como antes.\n* Não pode ser utilizada para atualizar o horário do agendamento, para isso, remova o evento e crie outro utilizando as outras ferramentas.",
        "workflowId": {
          "__rl": true,
          "value": "tB6BNUcIu0SxpA9u",
          "mode": "list",
          "cachedResultUrl": "/workflow/tB6BNUcIu0SxpA9u",
          "cachedResultName": "04.1 Atualizar/Cancelar agendamento"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "API_KEY": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('API_KEY', ``, 'string') }}",
            "email": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('email', ``, 'string') }}",
            "telefone": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('telefone', ``, 'string') }}",
            "location_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('location_id', ``, 'string') }}",
            "startTime": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('startTime', ``, 'string') }}",
            "calendar_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('calendar_id', ``, 'string') }}",
            "lead_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('lead_id', ``, 'string') }}",
            "firstName": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('firstName', ``, 'string') }}",
            "lastName": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('lastName', ``, 'string') }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "API_KEY",
              "displayName": "API_KEY",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "email",
              "displayName": "email",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "telefone",
              "displayName": "telefone",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "location_id",
              "displayName": "location_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "calendar_id",
              "displayName": "calendar_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "startTime",
              "displayName": "startTime",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "firstName",
              "displayName": "firstName",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "lastName",
              "displayName": "lastName",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "lead_id",
              "displayName": "lead_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        6704,
        1200
      ],
      "id": "bbf84ee2-06d3-440a-ac23-c39b76d2c73d",
      "name": "Atualizar agendamento"
    },
    {
      "parameters": {
        "description": "Utilize essa ferramenta para enviar um arquivo do Google Drive para o usuário.\n",
        "workflowId": {
          "__rl": true,
          "value": "si0lxAyvbgKOoO0g",
          "mode": "list",
          "cachedResultUrl": "/workflow/si0lxAyvbgKOoO0g",
          "cachedResultName": "02. Baixar e enviar arquivo do Google Drive"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "file_id": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('file_id', ``, 'string') }}",
            "id_conversa": "={{ $('Edit Fields').first().json.conversationId }}",
            "source": "={{ $('Info').first().json.source }}",
            "contact_id": "={{ $('Edit Fields').first().json.contactId }}",
            "api_key": "={{ $('Info').first().json.api_key }}"
          },
          "matchingColumns": [
            "file_id"
          ],
          "schema": [
            {
              "id": "file_id",
              "displayName": "file_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "contact_id",
              "displayName": "contact_id",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "id_conversa",
              "displayName": "id_conversa",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "api_key",
              "displayName": "api_key",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            },
            {
              "id": "source",
              "displayName": "source",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        6832,
        1200
      ],
      "id": "28a7453d-c82b-49f0-9bdd-1d5f27c7c7c8",
      "name": "Enviar arquivo"
    },
    {
      "parameters": {
        "description": "Utilize essa ferramenta para criar uma nova cobrança para o usuário, ou para consultar os dados de uma cobrança já existente.\n\nAntes de criar uma nova cobrança, sempre crie um agendamento para o cliente primeiro.",
        "workflowId": {
          "__rl": true,
          "value": "45POrWnyU2UR7HjQ",
          "mode": "list",
          "cachedResultUrl": "/workflow/45POrWnyU2UR7HjQ",
          "cachedResultName": "06.1 Integração Asaas"
        },
        "workflowInputs": {
          "mappingMode": "defineBelow",
          "value": {
            "cobranca_valor": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('cobranca_valor', `Valor exato da cobrança em reais (ex: 600.00). Consulte sempre a tabela de preços no contexto do negócio/prompt antes de preencher.`, 'number') }}",
            "cobranca_vencimento": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('cobranca_vencimento', `Data do vencimento no format YYYY-MM-DD. Informar como o dia do agendamento + 7 dias.`, 'string') }}",
            "telefone": "={{ $('Info').first().json.telefone }}",
            "nome": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('nome', ``, 'string') }}",
            "cpf": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('cpf', ``, 'string') }}",
            "id_conta": "={{ $('Info').first().json.location_id}}",
            "id_contato": "={{ $('Info').first().json.lead_id }}",
            "asaas_id_cliente": "={{ $('Info').first().json.atributos_contato.asaas_id_cliente }}",
            "asaas_id_cobranca": "={{ $('Info').first().json.atributos_contato.asaas_id_cobranca }}",
            "url_asaas": "={{ $('Info').first().json.url_asaas }}",
            "api_key": "={{ $('Info').first().json.api_key }}"
          },
          "matchingColumns": [],
          "schema": [
            {
              "id": "cobranca_valor",
              "displayName": "cobranca_valor",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "cobranca_vencimento",
              "displayName": "cobranca_vencimento",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "telefone",
              "displayName": "telefone",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "nome",
              "displayName": "nome",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "cpf",
              "displayName": "cpf",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "id_conta",
              "displayName": "id_conta",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "id_contato",
              "displayName": "id_contato",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "asaas_id_cliente",
              "displayName": "asaas_id_cliente",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "asaas_id_cobranca",
              "displayName": "asaas_id_cobranca",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "url_chatwoot",
              "displayName": "url_chatwoot",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": true
            },
            {
              "id": "url_asaas",
              "displayName": "url_asaas",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string"
            },
            {
              "id": "api_key",
              "displayName": "api_key",
              "required": false,
              "defaultMatch": false,
              "display": true,
              "canBeUsedToMatch": true,
              "type": "string",
              "removed": false
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        }
      },
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 2.2,
      "position": [
        6960,
        1200
      ],
      "id": "bd53eb72-6472-43cc-b968-af9475a78b41",
      "name": "Criar ou buscar cobranca"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://agenticoskevsacademy-production.up.railway.app/api/match-lead-context",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"phone\": \"{{ $('Info').first().json.telefone || '' }}\",\n  \"email\": \"{{ $('Info').first().json.email || '' }}\",\n  \"ig_id\": \"{{ $('Mensagem recebida').first().json.body?.contact?.attributionSource?.igSid || '' }}\",\n  \"ghl_contact_id\": \"{{ $('Info').first().json.lead_id || '' }}\",\n  \"location_id\": \"{{ $('Info').first().json.location_id || '' }}\",\n  \"ig_handle\": \"{{ $('Info').first().json.instagram || '' }}\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1792,
        -1648
      ],
      "id": "6f106acb-101a-4739-b6d5-0c5180d31624",
      "name": "Match Lead Context",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.matched }}",
                    "rightValue": true,
                    "operator": {
                      "type": "boolean",
                      "operation": "equals"
                    },
                    "id": "matched-true-condition"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Lead Já Enriquecido"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.matched }}",
                    "rightValue": false,
                    "operator": {
                      "type": "boolean",
                      "operation": "equals"
                    },
                    "id": "matched-false-condition"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Fazer Scrape"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        2016,
        -1648
      ],
      "id": "e9cc1f30-cd98-4a39-b613-35e6ed68c3f0",
      "name": "Lead Prospectado?"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://agenticoskevsacademy-production.up.railway.app/api/auto-enrich-lead",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"phone\": \"{{ $('Info').first().json.telefone || '' }}\",\n  \"email\": \"{{ $('Info').first().json.email || '' }}\",\n  \"ig_id\": \"{{ $('Mensagem recebida').first().json.body?.contact?.attributionSource?.igSid || $('Mensagem recebida').first().json.body?.contact?.attributionSource?.mediumId || '' }}\",\n  \"ig_handle\": \"{{ $('Info').first().json.instagram || '' }}\",\n  \"ghl_contact_id\": \"{{ $('Info').first().json.lead_id || '' }}\",\n  \"location_id\": \"{{ $('Info').first().json.location_id || '' }}\",\n  \"first_name\": \"{{ $('Info').first().json.first_name || '' }}\",\n  \"source_channel\": \"{{ $('Mensagem recebida').first().json.body?.contact?.attributionSource?.medium || 'ghl_webhook' }}\"\n}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "json"
            }
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        2240,
        -1552
      ],
      "id": "3646be28-51c1-4a5b-915e-a5ad152d9640",
      "name": "Auto Enrich Lead",
      "notesInFlow": true,
      "onError": "continueRegularOutput",
      "notes": "Scrape automático do Instagram + salva no banco"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://agenticoskevsacademy-production.up.railway.app/webhook/classify-lead",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"username\": \"{{ $('Info').first().json.first_name || 'lead' }}\",\n  \"message\": \"{{ $('Mensagem recebida').first().json.body?.message?.body || $('Mensagem recebida').first().json.body?.lastMessage?.body || '' }}\",\n  \"tenant_id\": \"{{ $('Info').first().json.location_id || 'default' }}\",\n  \"context\": {\n    \"source\": \"{{ $('Mensagem recebida').first().json.body?.contact?.attributionSource?.medium || $('Mensagem recebida').first().json.body?.contact_source || 'unknown' }}\",\n    \"phone\": \"{{ $('Info').first().json.telefone || $('Mensagem recebida').first().json.body?.phone || '' }}\",\n    \"email\": \"{{ $('Info').first().json.email || '' }}\",\n    \"tags\": \"{{ $('Mensagem recebida').first().json.body?.tags || '' }}\"\n  }\n}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "json"
            }
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1568,
        -2000
      ],
      "id": "56493da6-b5eb-4f16-9ff4-cfb9bea369b2",
      "name": "Classificar Lead IA",
      "notesInFlow": true,
      "onError": "continueRegularOutput",
      "notes": "Classifica automaticamente: LEAD_HOT, LEAD_WARM, LEAD_COLD, PESSOAL, SPAM"
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.classification }}",
                    "rightValue": "LEAD",
                    "operator": {
                      "type": "string",
                      "operation": "startsWith"
                    },
                    "id": "is-lead-condition"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "É Lead - Ativar IA"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.classification }}",
                    "rightValue": "PESSOAL",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "is-pessoal-condition"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Pessoal - Mover Perdido"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "leftValue": "",
                  "typeValidation": "loose",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.classification }}",
                    "rightValue": "SPAM",
                    "operator": {
                      "type": "string",
                      "operation": "equals"
                    },
                    "id": "is-spam-condition"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Spam - Mover Perdido"
            }
          ]
        },
        "options": {
          "fallbackOutput": "extra"
        }
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        1792,
        -2032
      ],
      "id": "04d41d2f-cb7e-48c9-881f-082f64551cdd",
      "name": "Rotear por Classificação"
    },
    {
      "parameters": {
        "requestMethod": "PATCH",
        "url": "=https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}",
        "options": {},
        "bodyParametersUi": {
          "parameter": [
            {
              "name": "tags",
              "value": "=lead-classificado-ia"
            }
          ]
        },
        "headerParametersUi": {
          "parameter": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        }
      },
      "name": "GHL - Tag Classificado",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 2,
      "position": [
        2240,
        -2240
      ],
      "id": "d0f3e5dc-88ee-402d-b34d-40c655bac0b2",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "method": "PUT",
        "url": "=https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer pit-3872ad13-41f7-4e76-a3ff-f2dee789f8d6"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"customFields\": [\n    {\"key\": \"ativar_ia\", \"field_value\": \"nao\"},\n    {\"key\": \"objetivo_lead\", \"field_value\": \"{{ $('Classificar Lead IA').first().json.classification }}\"},\n    {\"key\": \"motivo_perdido\", \"field_value\": \"{{ $('Classificar Lead IA').first().json.reasoning }}\"}\n  ],\n  \"tags\": [\"perdido\"]\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        2016,
        -2048
      ],
      "id": "45ab9060-9d84-40d2-8714-785f42315dd6",
      "name": "GHL - Mover Perdido",
      "notesInFlow": true,
      "onError": "continueRegularOutput",
      "notes": "Move lead pra perdido: PESSOAL ou SPAM"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://agenticoskevsacademy-production.up.railway.app/api/analyze-conversation-context",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"contact_id\": \"{{ $('Info').first().json.lead_id || '' }}\",\n  \"location_id\": \"{{ $('Info').first().json.location_id || '' }}\",\n  \"current_message\": \"{{ $('Mensagem recebida').first().json.body?.message?.body || $('Mensagem recebida').first().json.body?.lastMessage?.body || '' }}\",\n  \"contact_tags\": {{ JSON.stringify(($('Mensagem recebida').first().json.body?.tags || '').split(',').filter(t => t.trim())) }},\n  \"last_message_direction\": \"{{ $('Mensagem recebida').first().json.body?.lastMessage?.direction || 'inbound' }}\",\n  \"conversation_count\": {{ $('Mensagem recebida').first().json.body?.conversationCount || 1 }}\n}",
        "options": {
          "response": {
            "response": {
              "responseFormat": "json"
            }
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1568,
        -2288
      ],
      "id": "1185f96c-dbb3-4a3b-b35e-089b00599e59",
      "name": "Analisar Contexto Conversa",
      "notesInFlow": true,
      "onError": "continueRegularOutput",
      "notes": "Analisa: tags, última msg, histórico. Decide se ativa IA ou não."
    },
    {
      "parameters": {
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.should_activate_ia }}",
                    "rightValue": true,
                    "operator": {
                      "type": "boolean",
                      "operation": "equals"
                    },
                    "id": "should-activate-true"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Ativar IA"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": true,
                  "leftValue": "",
                  "typeValidation": "strict",
                  "version": 2
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.should_activate_ia }}",
                    "rightValue": false,
                    "operator": {
                      "type": "boolean",
                      "operation": "equals"
                    },
                    "id": "should-activate-false"
                  }
                ],
                "combinator": "and"
              },
              "renameOutput": true,
              "outputKey": "Não Ativar"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [
        1792,
        -2288
      ],
      "id": "79fff014-09f5-42cb-8d79-5b9e09f5ea2f",
      "name": "Decisão de Contexto"
    },
    {
      "parameters": {
        "requestMethod": "PUT",
        "url": "=https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}",
        "options": {},
        "bodyParametersUi": {
          "parameter": [
            {
              "name": "tags",
              "value": "=lead-prospectado-ia"
            }
          ]
        },
        "headerParametersUi": {
          "parameter": [
            {
              "name": "Authorization",
              "value": "=Bearer {{ $('Info').first().json.api_key }}"
            },
            {
              "name": "Version",
              "value": "2021-07-28"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        }
      },
      "name": "GHL - Tag Prospectado",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 2,
      "position": [
        2464,
        -1744
      ],
      "id": "b224fb74-c8be-4549-baee-3e76eb38b2ca",
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "check-ativar-ia-prospectado",
              "leftValue": "={{ $('Info').first().json.ativar_ia }}",
              "rightValue": "sim",
              "operator": {
                "type": "string",
                "operation": "notEquals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        2240,
        -1744
      ],
      "id": "035ff355-84b5-425b-b8bf-77be2a3ab5fb",
      "name": "Já Ativou IA? (Prospectado)"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "check-ativar-ia-classificado",
              "leftValue": "={{ $('Info').first().json.ativar_ia }}",
              "rightValue": "sim",
              "operator": {
                "type": "string",
                "operation": "notEquals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        2016,
        -2240
      ],
      "id": "2752649d-6e34-43cb-a888-0163fce1a6d0",
      "name": "Já Ativou IA? (Classificado)"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "loose",
            "version": 2
          },
          "conditions": [
            {
              "id": "check-utm",
              "leftValue": "={{ $('Contexto UTM').first().json.tem_contexto_utm }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        1568,
        -1648
      ],
      "id": "b086b092-a434-48b1-9949-0ad12d15ecaf",
      "name": "Veio de Tráfego?"
    },
    {
      "parameters": {
        "content": "## 🚦 VERIFICAÇÃO DE TRÁFEGO - 03/01/2026\n\n### Lógica:\n- **tem_contexto_utm = true** → Lead veio de TRÁFEGO (anúncio)\n  - SKIP toda classificação de IA\n  - Já tem automação própria no GHL\n  \n- **tem_contexto_utm = false** → Lead orgânico ou prospectado\n  - Continua para Match Lead Context\n  - Segue fluxo de classificação\n\n### Tags do Sistema:\n| Tag | Quando |\n|-----|--------|\n| `lead-prospectado-ia` | matched=true (AgenticOS) |\n| `lead-classificado-ia` | Lead válido (LEAD_*) |\n| `perdido` | SPAM ou PESSOAL |\n",
        "height": 492,
        "width": 400,
        "color": 5
      },
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [
        704,
        -2592
      ],
      "id": "bbf9dcf9-b70a-4a65-91be-04a5926d391a",
      "name": "Verificação Tráfego"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "check-primeira-mensagem",
              "leftValue": "={{ $('Info').first().json.is_primeira_mensagem }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        480,
        256
      ],
      "id": "4c4e5b05-388f-4be7-8ea5-e6e897a837de",
      "name": "É Primeira Mensagem?1"
    },
    {
      "parameters": {
        "descriptionType": "manual",
        "toolDescription": "Utilize essa ferramenta para listar os arquivos disponíveis para envio para o usuário.",
        "resource": "fileFolder",
        "returnAll": true,
        "filter": {
          "folderId": {
            "__rl": true,
            "value": "18mSZn8rMAt_9hFpj5oITD1wRLMKHqk0s",
            "mode": "list",
            "cachedResultName": "Arquivos da Secretária v3",
            "cachedResultUrl": "https://drive.google.com/drive/folders/18mSZn8rMAt_9hFpj5oITD1wRLMKHqk0s"
          }
        },
        "options": {}
      },
      "type": "n8n-nodes-base.googleDriveTool",
      "typeVersion": 3,
      "position": [
        7088,
        1200
      ],
      "id": "fdbb95b2-c566-4bcb-ad65-92f7f9ee75a1",
      "name": "Listar arquivos",
      "credentials": {
        "googleDriveOAuth2Api": {
          "id": "huUvmVlBHgVbw2p1",
          "name": "drive marcos - supabase - supercérebro"
        }
      }
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO public.crm_historico_mensagens\n  (lead_id, mensagem, datetime, source, full_name, location_id, api_key, tipo)\n  VALUES\n  ('{{ $json.lead_id }}', '{{ $json.resposta_ia }}', NOW(), '{{ $json.source }}', '{{ $('Info').first().json.usuario_responsavel }}', '{{ $json.location.id }}', '{{ $json.api_key }}', 'ai')\n  ON CONFLICT (lead_id, mensagem, datetime)\n  DO NOTHING\n  RETURNING *;",
        "options": {}
      },
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.6,
      "position": [
        10208,
        -240
      ],
      "id": "782c3c6e-f771-4570-911a-31022a289099",
      "name": "historico_mensagens_leads1",
      "alwaysOutputData": true,
      "retryOnFail": false,
      "executeOnce": false,
      "credentials": {
        "postgres": {
          "id": "w2mBaRwhZ3tM4FUw",
          "name": "Postgres Marcos Daniels."
        }
      },
      "onError": "continueRegularOutput"
    }
  ],
  "pinData": {
    "1️⃣ Listar campos customizados": [
      {
        "json": {
          "customFields": [
            {
              "id": "41NnWP9CM6f8ao444wAA",
              "name": "Commision",
              "model": "contact",
              "fieldKey": "contact.commision",
              "placeholder": "Commision",
              "dataType": "MONETORY",
              "position": 650,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-21T18:23:38.004Z",
              "standard": false
            },
            {
              "id": "44j7hoM33qQ4oXEpRlav",
              "name": "Insured Name",
              "model": "contact",
              "fieldKey": "contact.insured_name",
              "placeholder": "Insured Name",
              "dataType": "TEXT",
              "position": 450,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-21T18:23:37.988Z",
              "standard": false
            },
            {
              "id": "x",
              "name": "x",
              "model": "contact",
              "fieldKey": "contact.x",
              "placeholder": "Selecione o agente",
              "dataType": "SINGLE_OPTIONS",
              "position": 750,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-11-27T20:13:34.994Z",
              "standard": false,
              "picklistOptions": [
                "followuper",
                "customersuccess",
                "closer",
                "engagementkeeper",
                "rescheduler",
                "socialsellerconsultoria",
                "socialsellercarreira",
                "sdrcarreira",
                "sdrconsultoria"
              ]
            },
            {
              "id": "4KzXBGYsXFd5TAV0FaBB",
              "name": "Last Appointment",
              "model": "contact",
              "fieldKey": "contact.last_appointment",
              "placeholder": "",
              "dataType": "TEXT",
              "position": 500,
              "documentType": "field",
              "parentId": "jF2vkd3e098P7H4g0yfF",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-12-01T19:21:45.984Z",
              "standard": false
            },
            {
              "id": "5O5PGpw4s2uPmsgVm4dJ",
              "name": "Policy Status",
              "model": "contact",
              "fieldKey": "contact.policy_status",
              "placeholder": "",
              "dataType": "SINGLE_OPTIONS",
              "position": 500,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-21T18:23:37.993Z",
              "standard": false,
              "picklistOptions": [
                "Inforce",
                "Declined",
                "Pending",
                "Not Active",
                "Lapsed",
                "Incomplete",
                "Issued"
              ]
            },
            {
              "id": "6oUZvpESKC6lYMBVFrkW",
              "name": "Objetivo do lead",
              "model": "contact",
              "fieldKey": "contact.objetivo_do_lead",
              "placeholder": "",
              "dataType": "SINGLE_OPTIONS",
              "position": 800,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-12-02T15:03:03.918Z",
              "standard": false,
              "picklistOptions": [
                "x",
                "x"
              ]
            },
            {
              "id": "B74QtnVtKv26woBJOyWQ",
              "name": "Work Permit",
              "model": "contact",
              "fieldKey": "contact.work_permit",
              "placeholder": "",
              "dataType": "SINGLE_OPTIONS",
              "position": 350,
              "documentType": "field",
              "parentId": "jF2vkd3e098P7H4g0yfF",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-21T18:23:37.981Z",
              "standard": false,
              "picklistOptions": [
                "Sim",
                "Não"
              ]
            },
            {
              "id": "JWxa5EEbzAYyxSHwIR1M",
              "name": "Policy Information",
              "model": "contact",
              "fieldKey": "contact.policy_information",
              "placeholder": "Policy Information",
              "dataType": "TEXT",
              "position": 400,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-21T18:23:37.992Z",
              "standard": false
            },
            {
              "id": "KyCwTVHktt5YFB0vS80i",
              "name": "agente",
              "model": "contact",
              "fieldKey": "contact.agente",
              "placeholder": "",
              "dataType": "SINGLE_OPTIONS",
              "position": 450,
              "documentType": "field",
              "parentId": "jF2vkd3e098P7H4g0yfF",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-11-14T14:18:01.986Z",
              "standard": false,
              "picklistOptions": [
                "followuper",
                "socialsellerconsultoria",
                "socialsellercarreira",
                "sdrcarreira",
                "sdrconsultoria",
                "rescheduler",
                "engagementkeeper",
                "customersuccess",
                "closer"
              ]
            },
            {
              "id": "Lv7ZJRH3FB7qfXz2zc0F",
              "name": "Antecipated Annual Premium",
              "model": "contact",
              "fieldKey": "contact.antecipated_annual_premium",
              "placeholder": "Antecipated Annual Premium",
              "dataType": "MONETORY",
              "position": 600,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-21T18:23:37.995Z",
              "standard": false
            },
            {
              "id": "Qs5Y7yd0BAnL1rWYukm3",
              "name": "Informações para AI",
              "model": "contact",
              "fieldKey": "contact.informaes_para_ai",
              "placeholder": "",
              "dataType": "LARGE_TEXT",
              "position": 350,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-19T13:49:13.762Z",
              "standard": false
            },
            {
              "id": "QscDNHLfaghT6tgXEPF8",
              "name": "Estado onde mora",
              "model": "contact",
              "fieldKey": "contact.estado_onde_mora",
              "placeholder": "Estado onde mora",
              "dataType": "TEXT",
              "position": 400,
              "documentType": "field",
              "parentId": "jF2vkd3e098P7H4g0yfF",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-21T18:23:37.999Z",
              "standard": false
            },
            {
              "id": "RJ0wpy85jYkSxuhJ5n3W",
              "name": "Policy Issue Date",
              "model": "contact",
              "fieldKey": "contact.policy_issue_date",
              "placeholder": "",
              "dataType": "DATE",
              "position": 550,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-21T18:23:38.003Z",
              "standard": false
            },
            {
              "id": "TpoUKxaDLu5KH3ZkoTs7",
              "name": "ativar_ia",
              "model": "contact",
              "fieldKey": "contact.ativar_ia",
              "placeholder": "",
              "dataType": "SINGLE_OPTIONS",
              "position": 850,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-12-02T15:23:57.847Z",
              "standard": false,
              "picklistOptions": [
                "x",
                "x"
              ]
            },
            {
              "id": "b1a8GRh6TphG03Xuxqzx",
              "name": "Resposta IA",
              "model": "contact",
              "fieldKey": "contact.resposta_ia",
              "placeholder": "",
              "dataType": "LARGE_TEXT",
              "position": 150,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-19T13:49:13.767Z",
              "standard": false
            },
            {
              "id": "fDcrMyGupF6DD3PvPQdW",
              "name": "FUP_counter",
              "model": "contact",
              "fieldKey": "contact.fup_counter",
              "placeholder": "",
              "dataType": "NUMERICAL",
              "position": 250,
              "documentType": "field",
              "parentId": "2Qo8AjI5igaCtBrIlva5",
              "locationId": "mHuN6v75KQc3lwmBd6mV",
              "dateAdded": "2025-08-19T13:49:13.770Z",
              "standard": false
            }
          ],
          "traceId": "380349f6-708d-4d51-a7f9-c73d6c61545b"
        }
      }
    ],
    "Mensagem recebida": [
      {
        "json": {
          "headers": {
            "host": "cliente-a1.mentorfy.io",
            "user-agent": "axios/1.13.2",
            "content-length": "6541",
            "accept": "application/json, text/plain, */*",
            "accept-encoding": "gzip, compress, deflate, br",
            "content-type": "application/json",
            "traceparent": "00-de22e0da7d93350348798bd7984ca75b-02ed74856339f441-01",
            "x-forwarded-for": "34.69.206.63",
            "x-forwarded-host": "cliente-a1.mentorfy.io",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https",
            "x-forwarded-server": "9e2d5292a02e",
            "x-real-ip": "34.69.206.63"
          },
          "params": {},
          "query": {},
          "body": {
            "Policy Issue Date": "",
            "Informações para IA |socialfy|": "",
            "Profissão": "",
            "Etapa do Funil": "",
            "Commision": "",
            "Objetivo do lead": "carreira",
            "Informações para AI": "",
            "Last Appointment": "",
            "Especialista Motive": "sdrcarreira",
            "Estado onde mora": "",
            "ativar_ia": "sim",
            "Work Permit": "",
            "Antecipated Annual Premium": "",
            "Policy Information": "",
            "FUP_counter [socialfy]": "",
            "Status Appointment": "",
            "Policy Status": "",
            "FUP_counter": "",
            "Resposta IA |socialfy|": "",
            "Resposta IA": "Olá Marina, queria entender melhor sobre essa carreira",
            "Insured Name": "",
            "contact_id": "vjvDtWjv7vYinjRu6I9C",
            "first_name": "Gaby",
            "last_name": "vi 🖤",
            "full_name": "Gaby vi 🖤",
            "tags": "ativar_ia,carreira",
            "country": "US",
            "date_created": "2026-01-06T16:55:31.082Z",
            "full_address": "",
            "contact_type": "lead",
            "location": {
              "name": "Marina Couto",
              "address": "Boca Raton",
              "city": "Boca Raton",
              "state": "Flórida",
              "country": "US",
              "postalCode": "123",
              "fullAddress": "Boca Raton, Boca Raton Flórida 123",
              "id": "Bgi2hFMgiLLoRlOO0K5b"
            },
            "user": {
              "firstName": "Marina",
              "lastName": "Couto",
              "email": "marina@fiveringsflorida.com"
            },
            "message": {
              "type": 18,
              "body": "Olá Marina, queria entender melhor sobre essa carreira"
            },
            "workflow": {
              "id": "2a979d1f-374b-4f9a-8920-367c33edbf5a",
              "name": "3. AI Chat N8N - Terceiros"
            },
            "triggerData": {},
            "contact": {
              "attributionSource": {
                "photoUrl": null,
                "sessionSource": "Paid Social",
                "adId": "120240292570920210",
                "productId": null,
                "videoUrl": "https://www.facebook.com/ads/image/?d=AQKL2GzqkelD0Xvi0X2AVyopIZWFrcFqbcQkjSGIed54BIaynpYDQZWRRqpNpOzEVKm9_mbb-KB7ocj-CiWVrhG9_JuRw6hj6AwpX3_4gG7lrbZCGLe4kqeCjG2uNPrUbJpsW98NzPtGWrddqYXcIOmn",
                "igSid": "862000286465410",
                "mediumId": "862000286465410",
                "utmContent": "2025-09 Marina 01 - DIRECT",
                "medium": "instagram",
                "postId": null,
                "flowId": null
              },
              "lastAttributionSource": {
                "photoUrl": null,
                "sessionSource": "Paid Social",
                "adId": "120240292570920210",
                "productId": null,
                "videoUrl": "https://www.facebook.com/ads/image/?d=AQKL2GzqkelD0Xvi0X2AVyopIZWFrcFqbcQkjSGIed54BIaynpYDQZWRRqpNpOzEVKm9_mbb-KB7ocj-CiWVrhG9_JuRw6hj6AwpX3_4gG7lrbZCGLe4kqeCjG2uNPrUbJpsW98NzPtGWrddqYXcIOmn",
                "igSid": "862000286465410",
                "mediumId": "862000286465410",
                "utmContent": "2025-09 Marina 01 - DIRECT",
                "medium": "instagram",
                "postId": null,
                "flowId": null
              }
            },
            "attributionSource": {},
            "customData": {
              "ID": "vjvDtWjv7vYinjRu6I9C",
              "message": "Olá Marina, queria entender melhor sobre essa carreira",
              "name": "Gaby",
              "phone": "",
              "tipo": "msg",
              "ghl_api_key": "pit-7f333e6f-a839-4f58-b371-778fed9dc2ea",
              "preco": "",
              "tempo": "",
              "regiao": "",
              "info": "",
              "timezone": "America/New_York",
              "consultoria_financeira": "adnTALAtLmPN7yuideFk",
              "oportunidade": "",
              "subject": "",
              "source.url": "",
              "minha_historias": "Marina Couto nasceu em Belém do Pará, uma cidade marcada pelo calor, pela fé e pela força do povo amazônico. Desde cedo, ela aprendeu a valorizar as raízes culturais da sua terra, carregando consigo lembranças das comidas típicas, da praia e das cores vibrantes da sua cidade natal.  Há mais de duas décadas, Marina decidiu embarcar em uma nova jornada: deixou o Brasil e se mudou para os Estados Unidos. O sonho era grande, mas os desafios que encontrou no caminho foram ainda maiores. A adaptação não foi fácil — recomeçar do zero, enfrentar trabalhos que não traziam realização, lidar com as dificuldades de um novo idioma e, principalmente, com a sensação de ser uma imigrante em um país desconhecido.  Houve momentos de incerteza, mas nunca de desistência. Marina sempre acreditou que sua **força de vontade seria maior do que qualquer obstáculo**. Foi essa determinação que a levou a descobrir no mercado financeiro não apenas uma profissão, mas um verdadeiro propósito de vida.  Com dedicação, ela se tornou agente financeira, construiu carreira sólida ao longo de 11 anos e alcançou uma posição de liderança respeitada: **Fundadora da Agência Brazillionaires e Million Dollar Agency Director na Five Rings**. Hoje, é reconhecida como **pioneira** por ter iniciado um movimento que mudou a vida de inúmeros brasileiros nos Estados Unidos.  Mas a história de Marina vai além dos títulos. Sua missão é clara: **transformar os brasileiros no grupo imigrante mais rico dos Estados Unidos**. Para ela, dinheiro nunca vem em primeiro lugar. O que importa são as pessoas, suas histórias e seus sonhos. Por isso, ela criou um modelo único de treinamento, no qual qualquer pessoa pode começar do zero e se tornar um profissional financeiro de sucesso com seu acompanhamento direto.  No coração da sua trajetória, a família sempre ocupou lugar central. Ao lado do marido, Gustavo, e dos filhos, Victor e Tiago, Marina construiu uma vida de conquistas. Realizou sonhos importantes, como a casa própria, a liberdade de viajar em família e a possibilidade de proporcionar experiências inesquecíveis aos filhos.  Apesar da rotina intensa, Marina mantém sua essência leve e próxima. Nas suas conversas, é comum ouvir um “**opa amigo, oi amiga, tudo bem?**”, porque, para ela, cada contato é antes de tudo uma relação humana. Cristã e membro da PIB Flórida em Pompano Beach, Marina encontra na fé a base para seguir firme em sua missão.  Nos momentos de lazer, ela se permite sonhar ainda mais: aprecia carros exóticos, acompanha corridas de Fórmula 1, lê livros sobre desenvolvimento pessoal e relaxa com boas séries na Netflix. Cada detalhe da sua vida mostra que ela nunca deixou de acreditar que **sonhar é o primeiro passo para conquistar**.  Hoje, a história de Marina não é apenas sobre superação pessoal. É sobre inspiração. É sobre provar que, mesmo diante dos maiores desafios, é possível transformar dificuldades em oportunidades e construir um legado que impacta a vida de milhares de pessoas.  Marina Couto é mais que uma profissional de finanças. Ela é uma **líder visionária, mãe dedicada, mulher de fé e exemplo de coragem**. Uma brasileira que transformou sua história — e agora dedica sua vida a ajudar outros brasileiros a transformarem as suas.",
              "campaingn": "",
              "utm_campaign": "",
              "link_do_zoom": "https://us02web.zoom.us/j/88260482475?pwd=9SRGjNR8jvet9vxzxr6e6ErYbytYRM.1",
              "photo": "",
              "pipeline_stage": "",
              "tipo_de_mensagem": "18",
              "photo_audio_nativo": "",
              "photo_audio": "",
              "fonte_do_lead_bposs": "",
              "quebra_de_objecoes_carreira": "",
              "quebra_de_objecoes_consultoria": "",
              "quebra_de_objecoes_geral": "",
              "sobre_o_produto": "",
              "estruturas_work_permit": "",
              "work_permit": "",
              "state": "",
              "calendar_id_carreira": "LvZWMISiyYnF8p7TrY7q",
              "etapa_funil": "",
              "motive": "sdrcarreira",
              "objetivodolead": "carreira",
              "ativar_ia": "sim"
            }
          },
          "webhookUrl": "https://cliente-a1.mentorfy.io/webhook/742766a1-1f96-4420-877b-ac3035ef5e3c",
          "executionMode": "production"
        },
        "pairedItem": {
          "item": 0
        }
      }
    ]
  },
  "connections": {
    "Mensagem recebida": {
      "main": [
        [
          {
            "node": "Contexto UTM",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "GetInfo": {
      "main": [
        [
          {
            "node": "Postgres",
            "type": "main",
            "index": 0
          },
          {
            "node": "Salvar registro de Atividade - alan",
            "type": "main",
            "index": 0
          },
          {
            "node": "Salvar registro de Atividade - marcos",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter": {
      "main": [
        [
          {
            "node": "Code in JavaScript2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Loop Over Items3": {
      "main": [
        [
          {
            "node": "Memoria IA",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Canal",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "no.op": {
      "main": [
        [
          {
            "node": "Loop Over Items3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Canal": {
      "main": [
        [
          {
            "node": "Whatsapp",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Instagram",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Instagram": {
      "main": [
        [
          {
            "node": "1.5s",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Whatsapp": {
      "main": [
        [
          {
            "node": "1.5s",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "1.5s": {
      "main": [
        [
          {
            "node": "no.op",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Tipo de IA": {
      "main": [
        [
          {
            "node": "Switch2",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Switch",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Set mensagens2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch": {
      "main": [
        [
          {
            "node": "Prompt F3 - followuper1",
            "type": "main",
            "index": 0
          }
        ],
        [],
        [
          {
            "node": "Prompt F2 - Funil Tráfego Carreira\"",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Prompt F2 - Funil Tráfego Carreira\"",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Prompt Reagendamento - No Show1",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Concierge",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Customer Success",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    },
    "Prompt F3 - followuper1": {
      "main": [
        [
          {
            "node": "SDR",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Gemini2": {
      "ai_languageModel": [
        [
          {
            "node": "SDR",
            "type": "ai_languageModel",
            "index": 0
          },
          {
            "node": "SDR Milton",
            "type": "ai_languageModel",
            "index": 0
          },
          {
            "node": "AI Agent - Modular",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI Chat Model2": {
      "ai_languageModel": [
        [
          {
            "node": "SDR",
            "type": "ai_languageModel",
            "index": 1
          },
          {
            "node": "SDR Milton",
            "type": "ai_languageModel",
            "index": 1
          }
        ]
      ]
    },
    "Think1": {
      "ai_tool": [
        [
          {
            "node": "SDR",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "SDR Milton",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Busca_disponibilidade": {
      "ai_tool": [
        [
          {
            "node": "SDR",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "SDR Milton",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Agendar_reuniao": {
      "ai_tool": [
        [
          {
            "node": "SDR",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "SDR Milton",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Atualizar Work Permit": {
      "ai_tool": [
        [
          {
            "node": "SDR",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "SDR Milton",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Atualizar Profissão": {
      "ai_tool": [
        [
          {
            "node": "SDR",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "SDR Milton",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Tudo certo?3": {
      "main": [
        [
          {
            "node": "Filter",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "SDR",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Atualizar Estado": {
      "ai_tool": [
        [
          {
            "node": "SDR",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "SDR Milton",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Mensagem encavalada?": {
      "main": [
        [
          {
            "node": "Limpar fila de mensagens",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Buscar mensagens": {
      "main": [
        [
          {
            "node": "Form Mensagem",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Limpar fila de mensagens": {
      "main": [
        [
          {
            "node": "Conversa Ativa",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Esperar": {
      "main": [
        [
          {
            "node": "Buscar mensagens",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Enfileirar mensagem.": {
      "main": [
        [
          {
            "node": "Esperar",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Download áudio": {
      "main": [
        [
          {
            "node": "Extract from File",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Transcrever audio": {
      "main": [
        [
          {
            "node": "Imagem ou audio",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract from File": {
      "main": [
        [
          {
            "node": "Extrair a extensão",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Convert to File": {
      "main": [
        [
          {
            "node": "Transcrever audio",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Form Mensagem": {
      "main": [
        [
          {
            "node": "Mensagem encavalada?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Permitido AI?": {
      "main": [
        [
          {
            "node": "Execution Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Conversa Ativa": {
      "main": [
        [
          {
            "node": "Ação Planejada",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Ação Planejada": {
      "main": [
        [
          {
            "node": "Permitido AI?",
            "type": "main",
            "index": 0
          }
        ],
        [],
        [
          {
            "node": "Salvar Espera",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Wait": {
      "main": [
        [
          {
            "node": "Conversa Ativa",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Salvar Espera": {
      "main": [
        [
          {
            "node": "Wait",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Execution Data": {
      "main": [
        [
          {
            "node": "Salvar Inicio IA",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Analyze image": {
      "main": [
        [
          {
            "node": "Imagem ou audio",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Imagem ou audio": {
      "main": [
        [
          {
            "node": "Conversa Ativa",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Tipo de mensagem1": {
      "main": [
        [
          {
            "node": "Conversa ativa atualizada",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Gemini Chat Model2": {
      "ai_languageModel": [
        [
          {
            "node": "Parser Chain",
            "type": "ai_languageModel",
            "index": 0
          },
          {
            "node": "Structured Output Parser",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Deve enviar mensagem?": {
      "main": [
        [
          {
            "node": "Parser Chain",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Conversa ativa atualizada": {
      "main": [
        [
          {
            "node": "If",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "If": {
      "main": [
        [
          {
            "node": "Atualizar resposta IA",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Termino de resposta",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Termino de resposta": {
      "main": [
        [
          {
            "node": "Parser Chain",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Atualizar resposta IA": {
      "main": [
        [
          {
            "node": "Deve enviar mensagem?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "If1": {
      "main": [
        [
          {
            "node": "Execution Data2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Structured Output Parser": {
      "ai_outputParser": [
        [
          {
            "node": "Parser Chain",
            "type": "ai_outputParser",
            "index": 0
          }
        ]
      ]
    },
    "Execution Data2": {
      "main": [
        [
          {
            "node": "Segmentos1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Segmentos1": {
      "main": [
        [
          {
            "node": "Loop Over Items3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Memoria IA": {
      "main": [
        [
          {
            "node": "Execution Data1",
            "type": "main",
            "index": 0
          },
          {
            "node": "SI - Insert AI Message",
            "type": "main",
            "index": 0
          },
          {
            "node": "historico_mensagens_leads1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Set mensagens": {
      "main": [
        [
          {
            "node": "SI - Insert Lead Message",
            "type": "main",
            "index": 0
          },
          {
            "node": "Tipo de IA",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Memoria Lead": {
      "main": [
        [
          {
            "node": "Deduplica Mensagens",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Deduplica Mensagens": {
      "main": [
        [
          {
            "node": "Set mensagens",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Mensagem anteriores": {
      "main": [
        [
          {
            "node": "Preparar Mensagem",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Busca historias": {
      "ai_tool": [
        [
          {
            "node": "SDR",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "SDR Milton",
            "type": "ai_tool",
            "index": 0
          },
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Search Contact": {
      "main": [
        [
          {
            "node": "GetInfo",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Edit Fields1": {
      "main": [
        [
          {
            "node": "historico_mensagens_leads",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "historico_mensagens_leads": {
      "main": [
        []
      ]
    },
    "Salvar Inicio IA": {
      "main": [
        [
          {
            "node": "Mensagem anteriores",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Switch2": {
      "main": [
        [
          {
            "node": "Prompt F3 - followuper",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "PROMPT VALIDADO1",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "PROMPT VALIDADO1",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Prompt - F2 - Funil Tráfego Consultoria1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prompt - F2 - Funil Tráfego Consultoria1": {
      "main": [
        [
          {
            "node": "SDR Milton",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Mensagem": {
      "main": [
        [
          {
            "node": "Memoria Lead",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prompt F3 - followuper": {
      "main": [
        [
          {
            "node": "SDR Milton",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Execution Data1": {
      "main": [
        [
          {
            "node": "Calcular Custo LLM",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prompt Reagendamento - No Show1": {
      "main": [
        [
          {
            "node": "SDR",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Limpar memória": {
      "main": [
        [
          {
            "node": "ativar_ia2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Limpar fila de mensagens1": {
      "main": [
        [
          {
            "node": "Canal2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Canal2": {
      "main": [
        [
          {
            "node": "Whatsapp2",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Instagram2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Instagram2": {
      "main": [
        [
          {
            "node": "Update Contact (Outbound)2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Whatsapp2": {
      "main": [
        [
          {
            "node": "Update Contact (Outbound)2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code in JavaScript": {
      "main": [
        [
          {
            "node": "Edit Fields",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Edit Fields": {
      "main": [
        [
          {
            "node": "Limpar memória",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "1. Buscar Conversa do Contato": {
      "main": [
        [
          {
            "node": "Code in JavaScript",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Update Contact (Outbound)": {
      "main": [
        [
          {
            "node": "Resetar status atendimento",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "SDR Milton": {
      "main": [
        [
          {
            "node": "Tudo certo?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "SDR": {
      "main": [
        [
          {
            "node": "Tudo certo?3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Tudo certo?": {
      "main": [
        [
          {
            "node": "Filter",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "SDR Milton",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "PROMPT VALIDADO1": {
      "main": [
        [
          {
            "node": "SDR Milton",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extrair a extensão": {
      "main": [
        [
          {
            "node": "Convert to File",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Calcular Custo LLM": {
      "main": [
        [
          {
            "node": "Call Track AI Cost",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "ativar_ia2": {
      "main": [
        [
          {
            "node": "Update Contact (Outbound)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "1️⃣ Listar campos customizados": {
      "main": [
        [
          {
            "node": "2️⃣ Extrair IDs dos campos",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "2️⃣ Extrair IDs dos campos": {
      "main": [
        [
          {
            "node": "3️⃣ Detectar Objetivo",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "3️⃣ Detectar Objetivo": {
      "main": [
        [
          {
            "node": "4️⃣ Switch Objetivo",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "4️⃣ Switch Objetivo": {
      "main": [
        [
          {
            "node": "5️⃣ Atualizar → Carreira",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "5️⃣ Atualizar → Consultoria",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Canal4",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Canal4": {
      "main": [
        [
          {
            "node": "5️⃣ Perguntar Objetivo (SMS)",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Instagram4",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Resetar status atendimento": {
      "main": [
        [
          {
            "node": "Limpar fila de mensagens1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Concierge": {
      "main": [
        [
          {
            "node": "SDR",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prompt F2 - Funil Tráfego Carreira\"": {
      "main": [
        [
          {
            "node": "SDR",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Classificar Tipo Mensagem": {
      "main": [
        [
          {
            "node": "Info",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Tipo de mensagem": {
      "main": [
        [
          {
            "node": "1. Buscar Conversa do Contato",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "1️⃣ Listar campos customizados",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Enfileirar mensagem.",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Analyze image",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Download áudio",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Edit Fields2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Info": {
      "main": [
        [
          {
            "node": "Search Contact",
            "type": "main",
            "index": 0
          },
          {
            "node": "Edit Fields1",
            "type": "main",
            "index": 0
          },
          {
            "node": "SI - Upsert Conversation",
            "type": "main",
            "index": 0
          },
          {
            "node": "IA Ativa?",
            "type": "main",
            "index": 0
          },
          {
            "node": "É Primeira Mensagem?1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code1": {
      "main": [
        [
          {
            "node": "Classificar Tipo Mensagem",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Execution Data5": {
      "main": [
        [
          {
            "node": "Code1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Normalizar Dados1": {
      "main": [
        [
          {
            "node": "Execution Data5",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Normalizar Nome1": {
      "main": [
        [
          {
            "node": "Normalizar Dados1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Contexto UTM": {
      "main": [
        [
          {
            "node": "Normalizar Nome1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "IA Ativa?": {
      "main": [
        [
          {
            "node": "Tipo de mensagem",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code in JavaScript2": {
      "main": [
        [
          {
            "node": "Tipo de mensagem1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Customer Success": {
      "main": [
        [
          {
            "node": "SDR",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent - Modular": {
      "main": [
        [
          {
            "node": "Tudo certo?4",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Tudo certo?4": {
      "main": [
        [
          {
            "node": "Filter",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "AI Agent - Modular",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "SI - Upsert Conversation": {
      "main": [
        []
      ]
    },
    "Parser Chain": {
      "main": [
        [
          {
            "node": "If1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Set mensagens2": {
      "main": [
        [
          {
            "node": "Buscar Agente Ativo2",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Buscar Agente Ativo2": {
      "main": [
        [
          {
            "node": "Preparar Execução + Identificar Contexto3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Formatar Calendários1": {
      "main": [
        [
          {
            "node": "Montar Prompts Finais1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Preparar Execução + Identificar Contexto3": {
      "main": [
        [
          {
            "node": "Formatar Calendários1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Montar Prompts Finais1": {
      "main": [
        [
          {
            "node": "AI Agent - Modular",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Adicionar_tag_perdido": {
      "ai_tool": [
        [
          {
            "node": "SDR",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Escalar humano": {
      "ai_tool": [
        [
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Refletir": {
      "ai_tool": [
        [
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Atualizar agendamento": {
      "ai_tool": [
        [
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Enviar arquivo": {
      "ai_tool": [
        [
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Criar ou buscar cobranca": {
      "ai_tool": [
        [
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "Match Lead Context": {
      "main": [
        [
          {
            "node": "Lead Prospectado?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Lead Prospectado?": {
      "main": [
        [
          {
            "node": "Já Ativou IA? (Prospectado)",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Auto Enrich Lead",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Classificar Lead IA": {
      "main": [
        [
          {
            "node": "Rotear por Classificação",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Rotear por Classificação": {
      "main": [
        [
          {
            "node": "Já Ativou IA? (Classificado)",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "GHL - Mover Perdido",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "GHL - Mover Perdido",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Analisar Contexto Conversa": {
      "main": [
        [
          {
            "node": "Decisão de Contexto",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Decisão de Contexto": {
      "main": [
        [
          {
            "node": "Já Ativou IA? (Classificado)",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "GHL - Mover Perdido",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Já Ativou IA? (Prospectado)": {
      "main": [
        [
          {
            "node": "GHL - Tag Prospectado",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Já Ativou IA? (Classificado)": {
      "main": [
        [
          {
            "node": "GHL - Tag Classificado",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Veio de Tráfego?": {
      "main": [
        [],
        [
          {
            "node": "Match Lead Context",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "É Primeira Mensagem?1": {
      "main": [
        [
          {
            "node": "Veio de Tráfego?",
            "type": "main",
            "index": 0
          },
          {
            "node": "Classificar Lead IA",
            "type": "main",
            "index": 0
          },
          {
            "node": "Analisar Contexto Conversa",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Listar arquivos": {
      "ai_tool": [
        [
          {
            "node": "AI Agent - Modular",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {
    "executionOrder": "v1",
    "timezone": "America/New_York",
    "callerPolicy": "workflowsFromSameOwner",
    "availableInMCP": true,
    "errorWorkflow": "WnRF9AdjFBkEW9Ma",
    "timeSavedMode": "fixed"
  },
  "versionId": "8b56935b-4179-432a-b712-180cd297dc60",
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "9d65e6caa0e89e696b77790e020391d74468b15f71b3dcdb63aad81f090f5e69"
  },
  "id": "PNU745c6bXwEPpoD",
  "tags": [
    {
      "updatedAt": "2025-06-20T13:58:36.168Z",
      "createdAt": "2025-06-20T13:58:36.168Z",
      "id": "kEruuvE7z6URbdVG",
      "name": "Marcos-Daniel"
    }
  ]
}