#!/usr/bin/env python3
"""
Agent Factory v2.0.0 - Sistema Completo de Criacao de Agentes SDR
=================================================================

Baseado no debate entre 8 especialistas:
- Arquiteto de Escala
- Humanizador UX
- Social Seller
- Pre-vendas BANT
- Neurovendas/PNL
- Follow-up Master
- Dale Carnegie
- Juiz Orquestrador

Uso:
    python agent_factory_v2.py --onboarding           # Inicia onboarding interativo
    python agent_factory_v2.py --from-json config.json # Cria de arquivo JSON
    python agent_factory_v2.py --list                  # Lista agentes existentes

Autor: MOTTIVME AI Factory
Data: 2026-02-02
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from pathlib import Path

# Supabase
from supabase import create_client, Client

# Config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://bfumywvwubvernvhjehk.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE')


# =============================================================================
# TEMPLATES IMUTAVEIS (CORE)
# =============================================================================

PRIME_DIRECTIVE = """Voce e um ser humano conversando com outro ser humano.
Seu objetivo nao e vender, e CRIAR CONEXAO e AJUDAR.
A venda e consequencia natural de uma conexao genuina.
Escute mais do que fala. Pergunte mais do que afirme.
Nunca pareca um robo. Nunca pareca desesperado."""

FERRAMENTAS_CORE = [
    {
        "nome": "Busca_disponibilidade",
        "descricao": "Busca horarios disponiveis no calendario",
        "quando_usar": "ANTES de mencionar qualquer horario",
        "obrigatorio": True
    },
    {
        "nome": "Agendar_reuniao",
        "descricao": "Cria agendamento no calendario",
        "quando_usar": "Quando lead confirmar horario",
        "obrigatorio": True
    },
    {
        "nome": "Atualizar_nome",
        "descricao": "Salva nome correto do lead",
        "quando_usar": "Quando lead informar nome correto",
        "obrigatorio": True
    },
    {
        "nome": "Escalar_humano",
        "descricao": "Transfere para atendente humano",
        "quando_usar": "Quando lead pedir ou situacao critica",
        "obrigatorio": True
    },
    {
        "nome": "Refletir",
        "descricao": "Pensar antes de responder",
        "quando_usar": "Para casos complexos",
        "obrigatorio": True
    },
    {
        "nome": "Agendar_followup_futuro",
        "descricao": "Agenda follow-up para data futura",
        "quando_usar": "Quando lead pedir contato futuro",
        "obrigatorio": True
    },
    {
        "nome": "Adicionar_tag_perdido",
        "descricao": "Marca lead como perdido/desqualificado",
        "quando_usar": "Quando desqualificar lead",
        "obrigatorio": True
    }
]

REGRAS_INVIOLAVEIS = """## REGRAS INVIOLAVEIS

### 1. HORARIOS
⛔ **PROIBIDO** mencionar dia ou hora sem ANTES chamar Busca_disponibilidade.
Sem excecao. Horarios inventados causam frustracao e prejudicam a operacao.

### 2. NOME DO LEAD
⛔ **PROIBIDO** chamar lead pelo nome errado apos ele corrigir.
SEMPRE use Atualizar_nome primeiro, depois continue.

### 3. ATUALIZACAO DE NOME
Se nome parecer invalido (username, frase, emoji):
→ Perguntar: "Como posso te chamar?"
→ Usar Atualizar_nome para salvar
→ Continuar com nome correto

### 4. NUNCA FAZER
- Inventar informacoes (localizacao, preco, disponibilidade)
- Dar diagnostico ou prescricao (se area de saude)
- Prometer resultados especificos
- Parecer robo/assistente
- Dizer que vai "retornar depois"
- Usar linguagem de marketing generica"""

QUALIFICACAO_SPIN = """## QUALIFICACAO (fazer naturalmente)

| Preciso saber | Pergunta natural |
|---------------|------------------|
| Situacao | "Como ta sua rotina hoje com [area]?" |
| Problema | "O que mais te incomoda nisso?" |
| Implicacao | "E se continuar assim, o que acontece?" |
| Necessidade | "Se resolvesse isso, como seria?" |

### Sinais de temperatura:
🔥 QUENTE: Responde rapido, pergunta preco, menciona urgencia
🌡️ MORNO: Interessado mas sem pressa
❄️ FRIO: "So pesquisando", respostas curtas, demora"""

LINGUAGEM_PERSUASIVA = """## LINGUAGEM

### SEMPRE USE:
- Nome do lead (max 1x a cada 3-4 msgs)
- Palavras dele (espelhamento)
- "Voce" mais que "eu/nos"
- Perguntas abertas
- Verbos no positivo

### NUNCA USE:
- "Nao" no inicio de frase
- "Mas" (substitua por "e")
- "Problema" (use "situacao" ou "desafio")
- "Gastar" (use "investir" ou "dedicar")
- "Tentar" (use "fazer" ou "comecar")

### PADROES PERSUASIVOS:
- Escassez: "Essa semana so tenho [horarios da ferramenta]"
- Prova social: "A maioria das pessoas na sua situacao..."
- Futuro positivo: "Imagina voce daqui 3 meses..."
- Validacao: "Faz total sentido voce pensar assim"
- Micro-compromisso: "Se eu conseguir um horario, funcionaria?"
"""

CONEXAO_CARNEGIE = """## CONEXAO HUMANA (6 Principios Carnegie)

1. **INTERESSE GENUINO** - Pergunte sobre a PESSOA
2. **NOME E MUSICA** - Use o nome (max 1x a cada 3-4 msgs)
3. **OUCA MAIS** - 70% perguntas, 30% afirmacoes
4. **FALE DOS INTERESSES DELE** - Resultado, nao produto
5. **FACA ELE SE SENTIR IMPORTANTE** - "Que legal que voce..."
6. **NUNCA DISCUTA** - "Entendo seu ponto. E se..."
"""

FOLLOWUP_CADENCIA = """## FOLLOW-UP (valor, nao cobranca)

| Tentativa | Timing | Tipo |
|-----------|--------|------|
| 1 | 24h | Valor (conteudo relevante) |
| 2 | 72h | Novidade |
| 3 | 7 dias | Escassez real |
| 4 | 14 dias | Breakup elegante |

### PROIBIDO:
❌ "Viu minha mensagem?"
❌ "Ainda tem interesse?"
❌ Mensagem igual a anterior
"""

LEMBRETE_CRITICO = """## ⚠️ LEMBRETE CRITICO

1. Voce NAO PODE sugerir horarios sem Busca_disponibilidade ANTES
2. Voce NAO PODE chamar lead pelo nome errado apos correcao
3. Voce NAO PODE inventar informacoes
4. Voce NAO PODE parecer robo ou desesperado
5. Voce NAO PODE pular etapas de qualificacao
"""

MATRIZ_TRANSICAO = {
    "sdr_inbound": {
        "interesse_claro": "scheduler",
        "objecao": "objection_handler",
        "sem_resposta_24h": "followuper",
        "desqualificado": "tag_perdido"
    },
    "scheduler": {
        "reuniao_agendada": "concierge",
        "objecao": "objection_handler",
        "sem_resposta_24h": "followuper"
    },
    "objection_handler": {
        "objecao_resolvida": "scheduler",
        "objecao_persistente_2x": "escalar_humano",
        "lead_desistiu": "tag_perdido"
    },
    "concierge": {
        "consulta_confirmada": "done",
        "pediu_remarcar": "scheduler",
        "no_show": "scheduler"
    },
    "followuper": {
        "reengajou": "sdr_inbound",
        "quer_agendar": "scheduler",
        "pediu_parar": "tag_perdido",
        "4_tentativas_sem_resposta": "tag_perdido"
    },
    "social_seller_instagram": {
        "qualificado": "sdr_inbound",
        "quer_agendar": "scheduler",
        "objecao": "objection_handler"
    },
    "reativador_base": {
        "reengajou": "sdr_inbound",
        "sem_interesse": "tag_perdido"
    }
}

PROMPTS_POR_MODO = {
    "sdr_inbound": {
        "objetivo": "Qualificar lead e transicionar para agendamento",
        "etapas": ["abertura", "qualificacao_spin", "identificar_temperatura", "transicionar_ou_nutrir"],
        "tamanho_msg": "2-4 linhas",
        "tom": "Acolhedor e curioso",
        "emojis": "1-2 por msg"
    },
    "scheduler": {
        "objetivo": "Converter lead qualificado em agendamento",
        "etapas": ["buscar_disponibilidade", "oferecer_horarios", "confirmar_dados", "agendar", "confirmar"],
        "tamanho_msg": "1-3 linhas",
        "tom": "Pratico e eficiente",
        "emojis": "0-1 por msg"
    },
    "concierge": {
        "objetivo": "Garantir show rate",
        "etapas": ["confirmar_agendamento", "lembrete_24h", "lembrete_2h", "responder_duvidas"],
        "tamanho_msg": "3-5 linhas",
        "tom": "Premium e atencioso",
        "emojis": "0-1 por msg"
    },
    "followuper": {
        "objetivo": "Reengajar leads que esfriaram",
        "etapas": ["valor_24h", "novidade_72h", "escassez_7d", "breakup_14d"],
        "tamanho_msg": "2-3 linhas",
        "tom": "Leve e sem pressao",
        "emojis": "1-2 por msg"
    },
    "objection_handler": {
        "objetivo": "Resolver objecao e reconverter",
        "etapas": ["validar", "explorar", "isolar", "resolver", "confirmar", "avancar"],
        "tamanho_msg": "3-5 linhas",
        "tom": "Empatico e confiante",
        "emojis": "0-1 por msg",
        "max_tentativas": 2
    },
    "social_seller_instagram": {
        "objetivo": "Prospectar via DM",
        "sub_fluxos": {
            "novo_seguidor": "24-48h apos follow",
            "visita_sincera": "Logo apos visita",
            "gatilho_social": "Ate 2h apos interacao"
        },
        "tamanho_msg": "1-3 linhas",
        "tom": "Casual e autentico",
        "emojis": "2-3 por msg"
    },
    "reativador_base": {
        "objetivo": "Reconectar com leads inativos (meses)",
        "etapas": ["reconectar", "atualizar", "valor", "requalificar", "reativar"],
        "tamanho_msg": "2-4 linhas",
        "tom": "Caloroso e nostalgico",
        "emojis": "1-2 por msg"
    }
}


# =============================================================================
# DATACLASSES
# =============================================================================

@dataclass
class AgentConfig:
    """Configuracao completa do agente"""

    # Tecnico (Fase 1)
    location_id: str = ""
    api_key: str = ""
    calendar_id_principal: str = ""
    calendarios_adicionais: List[Dict] = field(default_factory=list)
    telefone_humano: str = ""

    # Identidade (Fase 2)
    empresa_nome: str = ""
    empresa_oferta: str = ""
    empresa_cidade: str = ""
    empresa_estado: str = ""
    agent_name: str = ""
    agent_genero: str = "F"
    agent_tom: str = "casual"  # formal, casual, tecnico

    # Negocio (Fase 3)
    origem_leads: List[str] = field(default_factory=list)
    ticket_medio: str = ""
    cobranca_agendamento: bool = False
    objecoes_comuns: List[str] = field(default_factory=list)
    compliance_palavras_proibidas: List[str] = field(default_factory=list)
    compliance_substituicoes: Dict[str, str] = field(default_factory=dict)

    # Avancado (Opcional)
    cadencia_followup: str = "moderado"  # agressivo, moderado, suave
    usar_emojis: bool = True
    usar_girias: bool = True
    usar_audios: bool = False
    prova_social: List[str] = field(default_factory=list)
    diferenciais: List[str] = field(default_factory=list)
    dados_fixos: Dict[str, str] = field(default_factory=dict)

    # Ferramentas opcionais
    ferramentas_opcionais: List[str] = field(default_factory=list)

    # Metadata
    version: str = "1.0.0"
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class GeneratedAgent:
    """Agente gerado pronto para inserir"""
    location_id: str
    agent_name: str
    version: str
    system_prompt: str
    prompts_by_mode: Dict
    tools_config: Dict
    personality_config: Dict
    business_config: Dict
    qualification_config: Dict
    compliance_rules: Dict
    hyperpersonalization: Dict
    deployment_notes: Dict


# =============================================================================
# GERADORES DE JSONB
# =============================================================================

def generate_tools_config(config: AgentConfig) -> Dict:
    """Gera tools_config JSONB"""

    # Ferramentas core (sempre presentes)
    ferramentas = {tool["nome"]: tool for tool in FERRAMENTAS_CORE}

    # Ferramentas opcionais
    ferramentas_opcionais_defs = {
        "Criar_ou_buscar_cobranca": {
            "nome": "Criar_ou_buscar_cobranca",
            "descricao": "Gera link de pagamento",
            "quando_usar": "Quando lead confirmar e precisar pagar",
            "obrigatorio": False
        },
        "Criar_grupo_whatsapp": {
            "nome": "Criar_grupo_whatsapp",
            "descricao": "Cria grupo de WhatsApp",
            "quando_usar": "Para onboarding em grupo",
            "obrigatorio": False
        },
        "Enviar_arquivo": {
            "nome": "Enviar_arquivo",
            "descricao": "Envia arquivo para o lead",
            "quando_usar": "Quando precisar enviar material",
            "obrigatorio": False
        },
        "Fazer_chamada_whatsapp": {
            "nome": "Fazer_chamada_whatsapp",
            "descricao": "Inicia chamada de voz",
            "quando_usar": "Para contato mais pessoal",
            "obrigatorio": False
        },
        "Atualizar_Profissao": {
            "nome": "Atualizar_Profissao",
            "descricao": "Salva profissao do lead",
            "quando_usar": "Quando lead informar profissao",
            "obrigatorio": False
        },
        "Atualizar_Estado": {
            "nome": "Atualizar_Estado",
            "descricao": "Salva estado do lead",
            "quando_usar": "Quando lead informar localizacao",
            "obrigatorio": False
        }
    }

    for ferramenta_nome in config.ferramentas_opcionais:
        if ferramenta_nome in ferramentas_opcionais_defs:
            ferramentas[ferramenta_nome] = ferramentas_opcionais_defs[ferramenta_nome]

    return {
        "ferramentas_disponiveis": ferramentas,
        "transicoes": MATRIZ_TRANSICAO,
        "limites_anti_loop": {
            "Busca_disponibilidade": 2,
            "Agendar_reuniao": 1,
            "Escalar_humano": 1,
            "Criar_ou_buscar_cobranca": 1
        },
        "calendarios": {
            "principal": config.calendar_id_principal,
            "adicionais": config.calendarios_adicionais
        }
    }


def generate_personality_config(config: AgentConfig) -> Dict:
    """Gera personality_config JSONB"""

    tom_descricoes = {
        "formal": "Profissional e respeitoso",
        "casual": "Amigavel e acessivel",
        "tecnico": "Especialista e preciso"
    }

    return {
        "agent_identity": {
            "nome": config.agent_name,
            "genero": config.agent_genero,
            "versao": config.version
        },
        "tom": {
            "tipo": config.agent_tom,
            "descricao": tom_descricoes.get(config.agent_tom, "Amigavel")
        },
        "formatacao": {
            "usar_emojis": config.usar_emojis,
            "usar_girias": config.usar_girias,
            "usar_audios": config.usar_audios
        },
        "modes": PROMPTS_POR_MODO,
        "default_mode": "sdr_inbound"
    }


def generate_business_config(config: AgentConfig) -> Dict:
    """Gera business_config JSONB"""

    return {
        "empresa": {
            "nome": config.empresa_nome,
            "oferta": config.empresa_oferta,
            "cidade": config.empresa_cidade,
            "estado": config.empresa_estado
        },
        "comercial": {
            "ticket_medio": config.ticket_medio,
            "cobranca_agendamento": config.cobranca_agendamento,
            "origem_leads": config.origem_leads
        },
        "diferenciais": config.diferenciais,
        "prova_social": config.prova_social,
        "dados_fixos": config.dados_fixos,
        "contatos": {
            "telefone_humano": config.telefone_humano
        }
    }


def generate_qualification_config(config: AgentConfig) -> Dict:
    """Gera qualification_config JSONB"""

    return {
        "framework": "SPIN",
        "perguntas": {
            "situacao": "Como ta sua rotina hoje com [area]?",
            "problema": "O que mais te incomoda nisso?",
            "implicacao": "E se continuar assim, o que acontece?",
            "necessidade": "Se resolvesse isso, como seria?"
        },
        "sinais_temperatura": {
            "quente": ["responde rapido", "pergunta preco", "menciona urgencia"],
            "morno": ["interessado", "sem pressa"],
            "frio": ["so pesquisando", "respostas curtas", "demora"]
        },
        "acoes_por_temperatura": {
            "quente": "Agendar AGORA",
            "morno": "Nutrir + agendar em 48h",
            "frio": "Valor + followup em 7 dias"
        },
        "objecoes_comuns": config.objecoes_comuns,
        "score_minimo_agendamento": 60
    }


def generate_compliance_rules(config: AgentConfig) -> Dict:
    """Gera compliance_rules JSONB"""

    return {
        "palavras_proibidas": config.compliance_palavras_proibidas,
        "substituicoes": config.compliance_substituicoes,
        "regras_globais": {
            "nunca_fazer": [
                "Inventar informacoes",
                "Dar diagnostico/prescricao",
                "Prometer resultados especificos",
                "Parecer robo",
                "Dizer que vai retornar depois"
            ],
            "sempre_fazer": [
                "Confirmar dados antes de agendar",
                "Escalar quando solicitado",
                "Manter tom de colega",
                "Respeitar pedidos de parada"
            ]
        },
        "por_modo": {
            "sdr_inbound": {
                "max_mensagens_sem_resposta": 3,
                "tempo_max_conversa": "15min"
            },
            "scheduler": {
                "max_tentativas_horario": 3,
                "confirmar_dados_antes": True
            },
            "objection_handler": {
                "max_tentativas_objecao": 2
            }
        }
    }


def generate_hyperpersonalization(config: AgentConfig) -> Dict:
    """Gera hyperpersonalization JSONB"""

    return {
        "variaveis_dinamicas": {
            "{{nome}}": "Nome do lead",
            "{{primeiro_nome}}": "Primeiro nome do lead",
            "{{telefone}}": "Telefone do lead",
            "{{email}}": "Email do lead",
            "{{origem}}": "Origem do lead",
            "{{cidade}}": "Cidade do lead"
        },
        "form_responses": {
            "form_resp1": "Interesse principal",
            "form_resp2": "Dado adicional 1",
            "form_resp3": "Dado adicional 2",
            "form_resp4": "Dado adicional 3",
            "form_resp5": "Dado adicional 4",
            "form_resp6": "Dado adicional 5",
            "form_resp7": "Dado adicional 6",
            "form_resp8": "Dado adicional 7"
        },
        "contexto_conversas": {
            "usar_historico": True,
            "max_mensagens_contexto": 10,
            "detectar_retorno": True
        },
        "personalizacao_por_origem": {
            "instagram": {"tom": "mais casual", "emojis": "mais"},
            "formulario": {"tom": "profissional", "emojis": "moderado"},
            "indicacao": {"tom": "pessoal", "mencionar_indicador": True}
        },
        "gatilhos_temporais": {
            "manha": "Bom dia",
            "tarde": "Boa tarde",
            "noite": "Boa noite"
        }
    }


def generate_deployment_notes(config: AgentConfig) -> Dict:
    """Gera deployment_notes JSONB"""

    return {
        "versao": config.version,
        "data_deploy": datetime.now().strftime("%Y-%m-%d"),
        "autor": "Agent Factory v2.0.0",
        "changelog": [
            f"v{config.version} - Versao inicial gerada automaticamente"
        ],
        "metricas_esperadas": {
            "taxa_resposta": ">80%",
            "taxa_agendamento": ">30%",
            "show_rate": ">70%"
        },
        "testes_recomendados": [
            "Lead quente perguntando preco",
            "Lead frio apenas curiosidade",
            "Objecao 'ta caro'",
            "Objecao 'preciso pensar'",
            "Lead pergunta localizacao",
            "Lead pede humano"
        ]
    }


# =============================================================================
# GERADOR DE SYSTEM PROMPT
# =============================================================================

def generate_system_prompt(config: AgentConfig) -> str:
    """Gera o system_prompt completo"""

    # Saudacao baseada no tom
    saudacao_regra = "Usar saudacao (Bom dia/Boa tarde/Boa noite) + nome na primeira mensagem" if config.agent_tom != "formal" else "Usar saudacao formal apropriada"

    # Tom descricao
    tom_map = {
        "formal": "Profissional, respeitoso, sem girias",
        "casual": "Amigavel, acessivel, pode usar girias (vc, ta, pra)",
        "tecnico": "Especialista, preciso, linguagem tecnica quando apropriado"
    }

    # Emojis
    emoji_config = "Moderado (1-2 por mensagem)" if config.usar_emojis else "Nenhum"

    # Dados fixos formatados
    dados_fixos_texto = ""
    if config.dados_fixos:
        dados_fixos_texto = "\n".join([f"- {k}: {v}" for k, v in config.dados_fixos.items()])

    # Diferenciais formatados
    diferenciais_texto = ""
    if config.diferenciais:
        diferenciais_texto = "\n".join([f"- {d}" for d in config.diferenciais])

    # Compliance formatado
    compliance_texto = ""
    if config.compliance_palavras_proibidas:
        compliance_texto = f"""
## COMPLIANCE

### Palavras PROIBIDAS:
{chr(10).join(['- ' + p for p in config.compliance_palavras_proibidas])}

### Substituicoes obrigatorias:
{chr(10).join([f'- "{k}" → "{v}"' for k, v in config.compliance_substituicoes.items()])}
"""

    # Ferramentas formatadas
    ferramentas_texto = """## FERRAMENTAS

| Ferramenta | Quando usar |
|------------|-------------|
| **Busca_disponibilidade** | ANTES de mencionar qualquer horario |
| **Agendar_reuniao** | Quando lead confirmar horario |
| **Atualizar_nome** | Quando lead informar nome correto |
| **Escalar_humano** | Quando lead pedir ou situacao critica |
| **Refletir** | Para casos complexos |
| **Agendar_followup_futuro** | Quando lead pedir contato futuro |
| **Adicionar_tag_perdido** | Quando desqualificar lead |"""

    if config.ferramentas_opcionais:
        for f in config.ferramentas_opcionais:
            ferramentas_texto += f"\n| **{f}** | Quando necessario |"

    prompt = f"""# {config.agent_name} - {config.empresa_nome} v{config.version}

> {PRIME_DIRECTIVE}

---

## AGORA (contexto dinamico)
DATA: {{{{ data_atual }}}}
HORA_LOCAL: {{{{ hora_local }}}}
MODO_ATIVO: {{{{ agent_mode }}}}
MSG_PENDENTE: {{{{ msg_pendente }}}}

---

## CONTEXTO DO LEAD
**{{{{ nome }}}}** | {{{{ telefone }}}} | {{{{ email }}}}
Contact: {{{{ contact_id }}}} | Timezone: {{{{ timezone }}}}

{{{{ form_narrativa }}}}
{{{{ historico_resumido }}}}

---

## QUEM VOCE E

Voce e **{config.agent_name}**, {'assistente' if config.agent_genero == 'F' else 'assistente'} da **{config.empresa_nome}**.
A empresa oferece: {config.empresa_oferta}.

### Sua Personalidade
- Tom: {config.agent_tom} ({tom_map.get(config.agent_tom, 'Amigavel')})
- Emojis: {emoji_config}
- Girias: {"Sim (vc, ta, pra, tô)" if config.usar_girias else "Nao"}
- Tamanho das mensagens: Curtas (2-4 linhas)

### Dados que voce SABE (nunca inventar outros):
- Empresa: {config.empresa_nome}
- Localizacao: {config.empresa_cidade}, {config.empresa_estado}
- Oferta: {config.empresa_oferta}
{dados_fixos_texto}

### Diferenciais pra mencionar:
{diferenciais_texto if diferenciais_texto else "- Atendimento personalizado"}

---

## SAUDACAO

Regra: {saudacao_regra}

- HORA < 12 → "Bom dia"
- HORA 12-17 → "Boa tarde"
- HORA >= 18 → "Boa noite"

### Se PRIMEIRO CONTATO + FORMULARIO:
"{{{{ saudacao }}}}, {{{{ primeiro_nome }}}}! Vi que voce se interessou por [interesse do form]..."

### Se PRIMEIRO CONTATO + SEM FORMULARIO:
"{{{{ saudacao }}}}, {{{{ primeiro_nome }}}}! Tudo bem? Sou {config.agent_name}..."

### Se RETORNO (ja conversaram):
"{{{{ primeiro_nome }}}}! Que bom falar com voce de novo..."

---

## CALENDARIOS

| TIPO | CALENDAR_ID |
|------|-------------|
| Principal | {config.calendar_id_principal} |
{chr(10).join([f"| {c.get('nome', 'Adicional')} | {c.get('id', '')} |" for c in config.calendarios_adicionais])}

---

{ferramentas_texto}

---

{compliance_texto}

---

{REGRAS_INVIOLAVEIS}

---

{QUALIFICACAO_SPIN}

---

{LINGUAGEM_PERSUASIVA}

---

{CONEXAO_CARNEGIE}

---

{FOLLOWUP_CADENCIA}

---

## TRANSICAO DE MODOS

Modo atual: **{{{{ agent_mode }}}}**

### Quando SINALIZAR mudanca:

| Se acontecer... | Sinalize: |
|-----------------|-----------|
| Lead quer agendar | `proximo_modo: scheduler` |
| Lead levantou objecao | `proximo_modo: objection_handler` |
| Lead nao responde 24h | `proximo_modo: followuper` |
| Lead pediu humano | `proximo_modo: escalar_humano` |
| Lead desqualificado | `proximo_modo: tag_perdido` |

### REGRAS DE TRANSICAO:
1. NUNCA mude tom bruscamente
2. SEMPRE referencie conversa anterior
3. NUNCA diga "outro departamento"
4. Voce e o MESMO agente

---

{LEMBRETE_CRITICO}
"""

    return prompt


# =============================================================================
# GERADOR PRINCIPAL
# =============================================================================

# =============================================================================
# AUDITOR DE CONSISTENCIA CROSS-FIELD
# =============================================================================

@dataclass
class AuditIssue:
    """Um problema encontrado na auditoria"""
    campo: str          # ex: "business_config"
    severidade: str     # "critico", "alto", "medio"
    descricao: str
    sugestao: str


def audit_agent_consistency(agent: GeneratedAgent, config: AgentConfig) -> List[AuditIssue]:
    """
    Audita consistencia entre os 8 campos JSONB do agente.
    Retorna lista de inconsistencias encontradas.

    Checagens:
    1. Enderecos/localizacao (business_config vs system_prompt)
    2. Precos/valores (business_config vs compliance_rules vs prompts_by_mode)
    3. Personalidade (personality_config vs compliance_rules)
    4. Tipo de negocio (hyperpersonalization vs prompts)
    5. Ferramentas (tools_config vs system_prompt)
    6. Objecoes (compliance_rules vs qualification_config)
    7. Dados placeholder/genericos
    """
    issues: List[AuditIssue] = []

    sp = agent.system_prompt
    bc = agent.business_config
    pc = agent.personality_config
    cr = agent.compliance_rules
    hp = agent.hyperpersonalization
    tc = agent.tools_config
    qc = agent.qualification_config
    pbm = agent.prompts_by_mode

    # =========================================================================
    # 1. PLACEHOLDERS / DADOS GENERICOS
    # =========================================================================
    placeholders = [
        "Rua Exemplo", "exemplo.com", "000.000", "XXX",
        "Lorem", "TODO", "PLACEHOLDER", "Endereco aqui",
        "cidade_exemplo", "clinica_estetica"  # template generico
    ]

    campos_json = {
        "business_config": bc,
        "personality_config": pc,
        "compliance_rules": cr,
        "hyperpersonalization": hp,
        "tools_config": tc,
        "qualification_config": qc
    }

    for campo_nome, campo_val in campos_json.items():
        campo_str = json.dumps(campo_val, ensure_ascii=False).lower()
        for ph in placeholders:
            if ph.lower() in campo_str:
                issues.append(AuditIssue(
                    campo=campo_nome,
                    severidade="critico",
                    descricao=f"Placeholder generico encontrado: '{ph}'",
                    sugestao=f"Substituir '{ph}' por dados reais do config"
                ))

    # =========================================================================
    # 2. ENDERECO: business_config vs system_prompt vs config
    # =========================================================================
    bc_str = json.dumps(bc, ensure_ascii=False)

    if config.empresa_cidade and config.empresa_cidade not in bc_str:
        issues.append(AuditIssue(
            campo="business_config",
            severidade="alto",
            descricao=f"Cidade '{config.empresa_cidade}' do config nao aparece em business_config",
            sugestao="Sincronizar localizacao com dados do onboarding"
        ))

    if config.empresa_cidade and config.empresa_cidade not in sp:
        issues.append(AuditIssue(
            campo="system_prompt",
            severidade="alto",
            descricao=f"Cidade '{config.empresa_cidade}' do config nao aparece em system_prompt",
            sugestao="Adicionar cidade correta no system_prompt"
        ))

    # =========================================================================
    # 3. PERSONALIDADE: personality_config vs compliance_rules
    # =========================================================================
    pc_str = json.dumps(pc, ensure_ascii=False).lower()
    cr_str = json.dumps(cr, ensure_ascii=False).lower()

    # Detectar contradicoes comuns
    contradicoes_personalidade = [
        ("maravilhosa", "nunca use apelidos"),
        ("querida", "nunca use apelidos"),
        ("amor", "nunca use apelidos"),
        ("fofa", "nunca use apelidos"),
        ("girias", "formal"),
        ("informal", "formal"),
    ]

    for termo_pc, termo_cr in contradicoes_personalidade:
        if termo_pc in pc_str and termo_cr in cr_str:
            issues.append(AuditIssue(
                campo="personality_config + compliance_rules",
                severidade="critico",
                descricao=f"Contradicao: personality usa '{termo_pc}' mas compliance diz '{termo_cr}'",
                sugestao="Alinhar tom entre personality_config e compliance_rules"
            ))

    # Tom do config vs personality_config
    if config.agent_tom == "formal" and any(g in pc_str for g in ["giria", "vc ", " ta ", " pra "]):
        issues.append(AuditIssue(
            campo="personality_config",
            severidade="alto",
            descricao="Tom configurado como 'formal' mas personality tem girias",
            sugestao="Remover girias do personality_config"
        ))

    # =========================================================================
    # 4. PRECOS/VALORES: business_config vs compliance_rules vs prompts
    # =========================================================================
    # Detectar precos em compliance que nao batem com business
    import re

    precos_bc = set(re.findall(r'R\$\s*[\d.,]+', bc_str))
    precos_cr = set(re.findall(r'R\$\s*[\d.,]+', cr_str))
    precos_sp = set(re.findall(r'R\$\s*[\d.,]+', sp))

    # Precos em compliance que nao estao em business = suspeito
    precos_orphan_cr = precos_cr - precos_bc
    if precos_orphan_cr:
        issues.append(AuditIssue(
            campo="compliance_rules",
            severidade="alto",
            descricao=f"Precos em compliance_rules nao encontrados em business_config: {precos_orphan_cr}",
            sugestao="Verificar se precos sao reais ou de template generico"
        ))

    # Parcelamento/desconto mencionado sem estar no config
    termos_financeiros = ["parcelamento", "12x", "desconto", "avaliacao gratuita", "consulta gratuita"]
    for termo in termos_financeiros:
        in_cr = termo in cr_str
        in_bc = termo in bc_str
        if in_cr and not in_bc:
            issues.append(AuditIssue(
                campo="compliance_rules",
                severidade="alto",
                descricao=f"Termo financeiro '{termo}' em compliance_rules mas nao em business_config",
                sugestao=f"Verificar se '{termo}' e real ou copiado de template"
            ))

    # =========================================================================
    # 5. FERRAMENTAS: tools_config vs system_prompt
    # =========================================================================
    metadata_keys = {
        "framework", "location_id", "enabled_tools", "regras_globais",
        "videos_obrigatorios", "por_modo", "version", "config"
    }
    if isinstance(tc, dict):
        tool_names = [k for k in tc.keys() if k not in metadata_keys]
        for tool_name in tool_names:
            if tool_name not in sp:
                issues.append(AuditIssue(
                    campo="tools_config vs system_prompt",
                    severidade="medio",
                    descricao=f"Ferramenta '{tool_name}' em tools_config mas nao mencionada no system_prompt",
                    sugestao="Garantir que system_prompt instrui quando usar cada ferramenta"
                ))

    # =========================================================================
    # 6. TIPO DE NEGOCIO: hyperpersonalization vs config
    # =========================================================================
    hp_str = json.dumps(hp, ensure_ascii=False).lower()

    if config.empresa_oferta:
        oferta_lower = config.empresa_oferta.lower()
        # Detectar tipo errado no hyperpersonalization
        tipos_errados = {
            "estetica": ["hormonal", "cardiologia", "ortopedia"],
            "hormonal": ["estetica", "dermatologia", "plastica"],
            "mentoria": ["clinica", "consultorio", "paciente"],
            "coaching": ["clinica", "consultorio", "paciente"],
        }
        for tipo_hp, conflitos in tipos_errados.items():
            if tipo_hp in hp_str:
                for conflito in conflitos:
                    if conflito in oferta_lower:
                        issues.append(AuditIssue(
                            campo="hyperpersonalization",
                            severidade="critico",
                            descricao=f"Tipo '{tipo_hp}' em hyperpersonalization conflita com oferta '{config.empresa_oferta}'",
                            sugestao="Corrigir tipo de negocio no hyperpersonalization"
                        ))

    # =========================================================================
    # 7. OBJECOES: qualification_config vs prompts_by_mode
    # =========================================================================
    if isinstance(qc, dict):
        objecoes_qc = qc.get("objecoes_comuns", [])
        if isinstance(objecoes_qc, list) and config.objecoes_comuns:
            for objecao in config.objecoes_comuns:
                objecao_lower = objecao.lower().strip()
                qc_str = json.dumps(objecoes_qc, ensure_ascii=False).lower()
                if objecao_lower and objecao_lower not in qc_str:
                    issues.append(AuditIssue(
                        campo="qualification_config",
                        severidade="medio",
                        descricao=f"Objecao '{objecao}' do onboarding nao esta em qualification_config",
                        sugestao="Adicionar objecao ao qualification_config"
                    ))

    # =========================================================================
    # 8. NOME DO AGENTE: consistencia
    # =========================================================================
    if config.agent_name and config.agent_name not in sp:
        issues.append(AuditIssue(
            campo="system_prompt",
            severidade="critico",
            descricao=f"Nome do agente '{config.agent_name}' nao aparece no system_prompt",
            sugestao="Verificar geracao do system_prompt"
        ))

    return issues


def format_audit_report(issues: List[AuditIssue]) -> str:
    """Formata relatorio de auditoria"""
    if not issues:
        return "✅ AUDITORIA APROVADA - Nenhuma inconsistencia encontrada."

    criticos = [i for i in issues if i.severidade == "critico"]
    altos = [i for i in issues if i.severidade == "alto"]
    medios = [i for i in issues if i.severidade == "medio"]

    report = f"""
╔══════════════════════════════════════════════════════════════╗
║  🔍 RELATORIO DE AUDITORIA CROSS-FIELD                      ║
╚══════════════════════════════════════════════════════════════╝

Total: {len(issues)} inconsistencias
  🔴 Criticos: {len(criticos)}
  🟠 Altos: {len(altos)}
  🟡 Medios: {len(medios)}

{"=" * 60}
"""

    for sev, lista, emoji in [("critico", criticos, "🔴"), ("alto", altos, "🟠"), ("medio", medios, "🟡")]:
        if lista:
            report += f"\n{emoji} SEVERIDADE: {sev.upper()}\n{'-' * 40}\n"
            for i, issue in enumerate(lista, 1):
                report += f"\n  {i}. [{issue.campo}]\n"
                report += f"     Problema: {issue.descricao}\n"
                report += f"     Sugestao: {issue.sugestao}\n"

    if criticos:
        report += f"\n⛔ {len(criticos)} PROBLEMAS CRITICOS - Corrigir antes de deploy!\n"

    return report


def auto_fix_issues(agent: GeneratedAgent, config: AgentConfig, issues: List[AuditIssue]) -> GeneratedAgent:
    """
    Tenta corrigir automaticamente problemas simples.
    Retorna agente corrigido.
    """
    bc = dict(agent.business_config) if isinstance(agent.business_config, dict) else agent.business_config
    hp = dict(agent.hyperpersonalization) if isinstance(agent.hyperpersonalization, dict) else agent.hyperpersonalization

    for issue in issues:
        # Fix placeholders em business_config
        if issue.campo == "business_config" and "Placeholder" in issue.descricao:
            bc_str = json.dumps(bc, ensure_ascii=False)
            for ph in ["Rua Exemplo", "exemplo.com", "cidade_exemplo"]:
                if ph in bc_str:
                    replacement = {
                        "Rua Exemplo": f"{config.empresa_cidade}, {config.empresa_estado}" if config.empresa_cidade else "",
                        "exemplo.com": "",
                        "cidade_exemplo": config.empresa_cidade or ""
                    }
                    bc_str = bc_str.replace(ph, replacement.get(ph, ""))
            bc = json.loads(bc_str)

        # Fix tipo errado em hyperpersonalization
        if issue.campo == "hyperpersonalization" and "Tipo" in issue.descricao:
            if "clinica_estetica" in json.dumps(hp, ensure_ascii=False):
                hp_str = json.dumps(hp, ensure_ascii=False).replace("clinica_estetica", "personalizado")
                hp = json.loads(hp_str)

    return GeneratedAgent(
        location_id=agent.location_id,
        agent_name=agent.agent_name,
        version=agent.version,
        system_prompt=agent.system_prompt,
        prompts_by_mode=agent.prompts_by_mode,
        tools_config=agent.tools_config,
        personality_config=agent.personality_config,
        business_config=bc,
        qualification_config=agent.qualification_config,
        compliance_rules=agent.compliance_rules,
        hyperpersonalization=hp,
        deployment_notes=agent.deployment_notes
    )


class AgentFactoryV2:
    """Fabrica de agentes v2.0.0"""

    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    def generate_agent(self, config: AgentConfig) -> GeneratedAgent:
        """Gera agente completo a partir da configuracao"""

        print(f"\n🏭 Gerando agente: {config.agent_name}")
        print("=" * 50)

        # Gerar cada JSONB
        print("📝 Gerando system_prompt...")
        system_prompt = generate_system_prompt(config)

        print("🔧 Gerando tools_config...")
        tools_config = generate_tools_config(config)

        print("🎭 Gerando personality_config...")
        personality_config = generate_personality_config(config)

        print("💼 Gerando business_config...")
        business_config = generate_business_config(config)

        print("📊 Gerando qualification_config...")
        qualification_config = generate_qualification_config(config)

        print("⚖️ Gerando compliance_rules...")
        compliance_rules = generate_compliance_rules(config)

        print("✨ Gerando hyperpersonalization...")
        hyperpersonalization = generate_hyperpersonalization(config)

        print("📋 Gerando deployment_notes...")
        deployment_notes = generate_deployment_notes(config)

        agent = GeneratedAgent(
            location_id=config.location_id,
            agent_name=config.agent_name,
            version=config.version,
            system_prompt=system_prompt,
            prompts_by_mode=PROMPTS_POR_MODO,
            tools_config=tools_config,
            personality_config=personality_config,
            business_config=business_config,
            qualification_config=qualification_config,
            compliance_rules=compliance_rules,
            hyperpersonalization=hyperpersonalization,
            deployment_notes=deployment_notes
        )

        # AUDITORIA CROSS-FIELD
        print("\n🔍 Rodando auditoria cross-field...")
        issues = audit_agent_consistency(agent, config)
        report = format_audit_report(issues)
        print(report)

        criticos = [i for i in issues if i.severidade == "critico"]
        if criticos:
            print("🔧 Tentando auto-fix dos problemas criticos...")
            agent = auto_fix_issues(agent, config, issues)

            # Re-auditar apos fix
            issues_pos = audit_agent_consistency(agent, config)
            criticos_pos = [i for i in issues_pos if i.severidade == "critico"]
            if criticos_pos:
                print(f"⚠️  {len(criticos_pos)} problemas criticos restantes apos auto-fix.")
                print("    Revise manualmente antes de fazer deploy.")
            else:
                print("✅ Auto-fix resolveu todos os problemas criticos!")

        return agent

    def save_to_supabase(self, agent: GeneratedAgent) -> Dict:
        """Salva agente no Supabase"""

        print(f"\n💾 Salvando no Supabase...")

        try:
            # Desativar versoes anteriores
            self.supabase.table('agent_versions').update({
                'is_active': False
            }).eq('location_id', agent.location_id).execute()

            # Inserir nova versao
            result = self.supabase.table('agent_versions').insert({
                'location_id': agent.location_id,
                'agent_name': agent.agent_name,
                'version': agent.version,
                'is_active': True,
                'system_prompt': agent.system_prompt,
                'prompts_by_mode': agent.prompts_by_mode,
                'tools_config': agent.tools_config,
                'personality_config': agent.personality_config,
                'business_config': agent.business_config,
                'qualification_config': agent.qualification_config,
                'compliance_rules': agent.compliance_rules,
                'hyperpersonalization': agent.hyperpersonalization,
                'deployment_notes': agent.deployment_notes
            }).execute()

            if result.data:
                agent_id = result.data[0]['id']
                print(f"✅ Agente salvo com ID: {agent_id}")
                return {"success": True, "id": agent_id}
            else:
                return {"success": False, "error": "Nenhum dado retornado"}

        except Exception as e:
            print(f"❌ Erro: {e}")
            return {"success": False, "error": str(e)}

    def export_to_sql(self, agent: GeneratedAgent, filepath: str):
        """Exporta agente para arquivo SQL"""

        sql = f"""-- ============================================================
-- AGENT INSERT - {agent.agent_name} v{agent.version}
-- Gerado por: Agent Factory v2.0.0
-- Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- ============================================================

-- 1. Desativar versoes anteriores
UPDATE agent_versions
SET is_active = false
WHERE location_id = '{agent.location_id}'
  AND is_active = true;

-- 2. Inserir nova versao
INSERT INTO agent_versions (
    id,
    location_id,
    agent_name,
    version,
    is_active,
    system_prompt,
    prompts_by_mode,
    tools_config,
    personality_config,
    business_config,
    qualification_config,
    compliance_rules,
    hyperpersonalization,
    deployment_notes,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '{agent.location_id}',
    '{agent.agent_name}',
    '{agent.version}',
    true,
    $SYSTEM_PROMPT$
{agent.system_prompt}
$SYSTEM_PROMPT$,
    '{json.dumps(agent.prompts_by_mode, ensure_ascii=False)}'::jsonb,
    '{json.dumps(agent.tools_config, ensure_ascii=False)}'::jsonb,
    '{json.dumps(agent.personality_config, ensure_ascii=False)}'::jsonb,
    '{json.dumps(agent.business_config, ensure_ascii=False)}'::jsonb,
    '{json.dumps(agent.qualification_config, ensure_ascii=False)}'::jsonb,
    '{json.dumps(agent.compliance_rules, ensure_ascii=False)}'::jsonb,
    '{json.dumps(agent.hyperpersonalization, ensure_ascii=False)}'::jsonb,
    '{json.dumps(agent.deployment_notes, ensure_ascii=False)}'::jsonb,
    NOW(),
    NOW()
);

-- 3. Verificar insercao
SELECT
    id,
    agent_name,
    version,
    is_active,
    LENGTH(system_prompt) as prompt_chars
FROM agent_versions
WHERE location_id = '{agent.location_id}'
  AND is_active = true;
"""

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(sql)

        print(f"📄 SQL exportado para: {filepath}")

    def export_to_json(self, agent: GeneratedAgent, filepath: str):
        """Exporta agente para arquivo JSON"""

        data = {
            "location_id": agent.location_id,
            "agent_name": agent.agent_name,
            "version": agent.version,
            "system_prompt": agent.system_prompt,
            "prompts_by_mode": agent.prompts_by_mode,
            "tools_config": agent.tools_config,
            "personality_config": agent.personality_config,
            "business_config": agent.business_config,
            "qualification_config": agent.qualification_config,
            "compliance_rules": agent.compliance_rules,
            "hyperpersonalization": agent.hyperpersonalization,
            "deployment_notes": agent.deployment_notes,
            "generated_at": datetime.now().isoformat(),
            "generator": "Agent Factory v2.0.0"
        }

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"📄 JSON exportado para: {filepath}")

    def list_agents(self) -> List[Dict]:
        """Lista agentes existentes"""

        result = self.supabase.table('agent_versions').select(
            'id, agent_name, version, location_id, is_active, created_at'
        ).order('created_at', desc=True).limit(20).execute()

        return result.data


def run_onboarding() -> AgentConfig:
    """Executa onboarding interativo"""

    print("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏭 AGENT FACTORY v2.0.0 - ONBOARDING                       ║
║   Sistema de Criacao de Agentes SDR                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    """)

    config = AgentConfig()

    # FASE 1: TECNICO
    print("\n📡 FASE 1: SETUP TECNICO")
    print("-" * 40)
    config.location_id = input("1. Location ID do GHL: ").strip()
    config.api_key = input("2. API Key: ").strip()
    config.calendar_id_principal = input("3. Calendar ID principal: ").strip()

    add_calendarios = input("4. Tem calendarios adicionais? (s/n): ").strip().lower()
    if add_calendarios == 's':
        while True:
            nome = input("   Nome do calendario (ou Enter pra pular): ").strip()
            if not nome:
                break
            cal_id = input(f"   Calendar ID de '{nome}': ").strip()
            config.calendarios_adicionais.append({"nome": nome, "id": cal_id})

    config.telefone_humano = input("5. Telefone para escalar: ").strip()

    # FASE 2: IDENTIDADE
    print("\n🎭 FASE 2: IDENTIDADE DO AGENTE")
    print("-" * 40)
    config.empresa_nome = input("6. Nome da empresa: ").strip()
    config.empresa_oferta = input("7. O que voce vende (1 frase): ").strip()
    config.empresa_cidade = input("   Cidade: ").strip()
    config.empresa_estado = input("   Estado: ").strip()
    config.agent_name = input("8. Nome do agente: ").strip()
    config.agent_genero = input("9. Genero (M/F): ").strip().upper() or "F"
    config.agent_tom = input("10. Tom (formal/casual/tecnico): ").strip().lower() or "casual"

    # FASE 3: NEGOCIO
    print("\n💼 FASE 3: NEGOCIO E REGRAS")
    print("-" * 40)
    origens = input("11. Origem dos leads (separado por virgula): ").strip()
    config.origem_leads = [o.strip() for o in origens.split(",")] if origens else ["whatsapp"]

    config.ticket_medio = input("12. Ticket medio: ").strip()
    config.cobranca_agendamento = input("13. Agendamento e pago? (s/n): ").strip().lower() == 's'

    objecoes = input("14. 3 objecoes mais comuns (separado por virgula): ").strip()
    config.objecoes_comuns = [o.strip() for o in objecoes.split(",")] if objecoes else []

    proibidas = input("15. Palavras proibidas - compliance (separado por virgula): ").strip()
    config.compliance_palavras_proibidas = [p.strip() for p in proibidas.split(",")] if proibidas else []

    # FASE BONUS
    print("\n✨ FASE BONUS: AVANCADO (opcional)")
    print("-" * 40)
    config.usar_emojis = input("Usar emojis? (s/n) [s]: ").strip().lower() != 'n'
    config.usar_girias = input("Usar girias (vc, ta, pra)? (s/n) [s]: ").strip().lower() != 'n'

    if config.cobranca_agendamento:
        config.ferramentas_opcionais.append("Criar_ou_buscar_cobranca")

    return config


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description='Agent Factory v2.0.0')
    parser.add_argument('--onboarding', action='store_true', help='Inicia onboarding interativo')
    parser.add_argument('--from-json', type=str, help='Cria agente de arquivo JSON')
    parser.add_argument('--list', action='store_true', help='Lista agentes existentes')
    parser.add_argument('--audit', type=str, help='Audita agente existente por ID (UUID)')
    parser.add_argument('--save', action='store_true', help='Salva no Supabase')
    parser.add_argument('--output', type=str, default='agent_output', help='Prefixo dos arquivos de saida')

    args = parser.parse_args()

    factory = AgentFactoryV2()

    if args.list:
        print("\n📋 AGENTES EXISTENTES:")
        print("=" * 70)
        agents = factory.list_agents()
        for ag in agents:
            status = "🟢" if ag.get('is_active') else "⚪"
            print(f"{status} {ag['agent_name']} v{ag.get('version', '?')} [{ag['location_id'][:8]}...]")
        return

    if args.audit:
        print(f"\n🔍 AUDITORIA DO AGENTE: {args.audit}")
        print("=" * 60)
        result = factory.supabase.table('agent_versions').select(
            'id, agent_name, version, location_id, system_prompt, '
            'prompts_by_mode, tools_config, personality_config, '
            'business_config, qualification_config, compliance_rules, '
            'hyperpersonalization'
        ).eq('id', args.audit).execute()

        if not result.data:
            print(f"❌ Agente {args.audit} nao encontrado.")
            return

        row = result.data[0]
        # Criar GeneratedAgent a partir dos dados do banco
        existing = GeneratedAgent(
            location_id=row.get('location_id', ''),
            agent_name=row.get('agent_name', ''),
            version=row.get('version', ''),
            system_prompt=row.get('system_prompt', ''),
            prompts_by_mode=row.get('prompts_by_mode') or {},
            tools_config=row.get('tools_config') or {},
            personality_config=row.get('personality_config') or {},
            business_config=row.get('business_config') or {},
            qualification_config=row.get('qualification_config') or {},
            compliance_rules=row.get('compliance_rules') or {},
            hyperpersonalization=row.get('hyperpersonalization') or {},
            deployment_notes={}
        )
        # Criar config minimo para comparacao
        minimal_config = AgentConfig(
            location_id=row.get('location_id', ''),
            agent_name=row.get('agent_name', '')
        )
        # Tentar extrair dados do business_config e system_prompt
        bc = existing.business_config
        if isinstance(bc, dict):
            minimal_config.empresa_nome = bc.get('empresa', bc.get('nome', ''))
            loc = bc.get('localizacao', {})
            if isinstance(loc, dict):
                minimal_config.empresa_cidade = loc.get('cidade', '')
                minimal_config.empresa_estado = loc.get('estado', '')

        issues = audit_agent_consistency(existing, minimal_config)
        report = format_audit_report(issues)
        print(report)
        return

    if args.from_json:
        with open(args.from_json, 'r', encoding='utf-8') as f:
            data = json.load(f)
        config = AgentConfig(**data)
    elif args.onboarding:
        config = run_onboarding()
    else:
        print("Use --onboarding ou --from-json config.json")
        return

    # Gerar agente
    agent = factory.generate_agent(config)

    # Exportar
    factory.export_to_json(agent, f"{args.output}.json")
    factory.export_to_sql(agent, f"{args.output}.sql")

    # Salvar no Supabase
    if args.save:
        result = factory.save_to_supabase(agent)
        if result["success"]:
            print(f"\n✅ Agente '{agent.agent_name}' criado com sucesso!")
        else:
            print(f"\n❌ Erro ao salvar: {result.get('error')}")

    print(f"""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✅ AGENTE GERADO COM SUCESSO!                              ║
║                                                               ║
║   Arquivos:                                                   ║
║   - {args.output}.json                                        ║
║   - {args.output}.sql                                         ║
║                                                               ║
║   Proximos passos:                                            ║
║   1. Revise o arquivo .json                                   ║
║   2. Execute o .sql no Supabase                               ║
║   3. Teste com cenarios reais                                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    """)


if __name__ == "__main__":
    main()
