#!/usr/bin/env python3
"""
Helper Agents: VSL, Video & Selfie Scripts v1.0.0
=================================================

Agentes auxiliares para criar scripts de video, VSL, Loom e instrucoes de gravacao selfie.
Baseado em: Charlie Morgan (Trojan Horse), JP Middleton (Sistema Aristoteles), Eric Worre (Network Marketing)

Uso:
    python helper_agents_vsl.py --script native_vsl --produto "Mentoria XYZ" --resultado "aumentar faturamento"
    python helper_agents_vsl.py --selfie-coach --nome "Dr. Joao" --lead "Maria" --horario "14h de amanha"
    python helper_agents_vsl.py --eric-worre --lead "Carlos" --resultado "renda em dolar"

Autor: MOTTIVME AI Factory
Data: 2025-02-02
"""

import argparse
import json
from datetime import datetime
from typing import Dict, Optional
from dataclasses import dataclass

# =============================================================================
# TEMPLATES DE SCRIPTS
# =============================================================================

TEMPLATES = {
    "native_vsl": """## Native VSL - {produto}

**Duracao:** 60-90 segundos
**Formato:** Video selfie ou Loom
**Quando usar:** Apos lead dar permissao (Trojan Horse)

---

### ROTEIRO:

**[GANCHO - 10s]**
"A maioria dos {avatar} tem dois problemas:
{problema_1} e {problema_2}."

**[AGITACAO - 20s]**
"Voce provavelmente ja tentou {solucao_comum} e nao funcionou.
Isso porque {razao_fracasso}."

**[SOLUCAO - 30s]**
"O que a gente faz e diferente.
Nos implementamos um sistema que {beneficio_1} e {beneficio_2},
sem voce precisar {esforco_evitado}."

**[PROVA - 15s]**
"O {cliente_exemplo} conseguiu {resultado_especifico} em {tempo}.
E ele comecou exatamente onde voce ta agora."

**[CTA - 15s]**
"Se voce quiser ver como isso funciona pro seu caso,
vamos marcar 15 minutos pra eu te mostrar.
Faz sentido?"

---

### REGRAS DE GRAVACAO:
- Olhe direto pra camera
- Fale como se fosse um amigo
- NAO leia, use como guia
- Energia alta mas natural
- Grave em ambiente silencioso
""",

    "trojan_horse_audio": """## Trojan Horse Audio - Pedido de Permissao

**Duracao:** 30-45 segundos
**Formato:** Audio WhatsApp/Instagram
**Quando usar:** Primeiro contato frio

---

### ROTEIRO:

"Oi {nome_lead}, tudo bem?

Olha, eu sei que voce recebe mensagens de vendedor o tempo todo
e provavelmente ta de saco cheio disso.

Sendo bem transparente: eu quero te apresentar algo,
mas em vez de jogar um textao em voce,
eu queria pedir sua permissao primeiro.

Se tiver tudo bem eu te mandar um video de 60 segundos
explicando como {resultado_vago},
me avisa.

Se nao, sem problema, a gente continua amigos.

Posso te mandar?"

---

### DICAS:
- Fale devagar, como se estivesse pensando
- Pause antes de "Posso te mandar?"
- Tom de voz curioso, nao vendedor
""",

    "selfie_confirmation": """## Selfie de Confirmacao - Pos-Agendamento

**Duracao:** 20-30 segundos
**Formato:** Video selfie WhatsApp
**Quando usar:** Imediatamente apos lead agendar

---

### ROTEIRO:

"Fala {nome_lead}! Aqui e o {nome_mentor}.

To aqui confirmando nossa conversa de {dia} as {hora}.

Cara, to ansioso pra te mostrar como {resultado}.

Ah, e antes da nossa call, da uma olhada nesse video aqui
[apontar pra baixo indicando proxima mensagem].

Vai adiantar muito nossa conversa.

Ate la!"

---

### DICAS:
- Sorria no inicio e no final
- Mencione o nome do lead
- Seja breve e energico
- Grave de dia com luz natural
""",

    "case_study": """## Video de Caso de Sucesso

**Duracao:** 60-90 segundos
**Formato:** Loom ou video editado
**Quando usar:** Doutrinacao pre-call

---

### ROTEIRO:

**[CONTEXTO - 15s]**
"Deixa eu te contar a historia do {cliente}.
Ele era {situacao_similar} e tava
{frustracao}."

**[PROBLEMA - 15s]**
"O maior desafio dele era {problema_especifico}.
Ele ja tinha tentado {solucoes_falhas}."

**[TRANSFORMACAO - 30s]**
"Quando ele comecou com a gente, a primeira coisa
que fizemos foi {acao_inicial}.
Em {tempo_curto}, ele conseguiu {resultado_1}.
E depois de {tempo_longo}, {resultado_2}."

**[RESULTADO FINAL - 15s]**
"Hoje o {cliente} {situacao_transformada}.
E tudo comecou com uma conversa de 15 minutos igual
a que a gente vai ter."

---

### ELEMENTOS VISUAIS (se Loom):
- Mostrar foto do cliente (com permissao)
- Mostrar print de resultado/depoimento
- Mostrar grafico de evolucao
""",

    "eric_worre_reactivation": """## Reativacao Eric Worre - Tecnica de Video com Horario

**Objetivo:** Reativar leads frios com permissao de video + compromisso de horario

---

### FASE 1: PERMISSAO

**Mensagem:**
"Oi {nome_lead}! To com um video de 5 min que explica exatamente como {resultado_vago}.
Se eu te mandar voce assiste?"

**Se SIM:** Vai para FASE 2
**Se NAO:** "Sem problema! Quando fizer sentido, me chama."

---

### FASE 2: COMPROMISSO DE HORARIO

**Mensagem:**
"Show! Que horario hoje voce consegue dar play?
Quero mandar na hora certa pra voce nao esquecer."

**Exemplos de resposta do lead:**
- "Hoje as 20h" → Fase 3
- "Pode ser agora" → Enviar imediatamente
- "Amanha de manha" → Confirmar horario exato

---

### FASE 3: CONFIRMACAO + AGENDAMENTO

**Mensagem:**
"Combinado! As {horario} em ponto mando pra voce. Fica de olho!"

**Acao tecnica:**
- Usar ferramenta Agendar_video_timed
- scheduledTime: horario informado
- followUpDelay: 10 minutos

---

### FASE 4: FOLLOW-UP (10 min apos envio)

**Mensagem automatica:**
"E ai, conseguiu ver? O que mais chamou sua atencao?"

**Se responder com interesse:** Fase 5
**Se nao responder:** "Fica tranquilo! Quando tiver um tempinho, da uma olhada."

---

### FASE 5: TRANSICAO PARA AGENDAMENTO

**Mensagem:**
"Quer que eu te explique melhor como funciona?
Tenho 15 min amanha as 14h ou quinta as 10h. Qual fica melhor?"

---

### PRINCIPIOS (Charlie Morgan + Eric Worre)
1. NUNCA envie video sem permissao
2. SEMPRE pergunte o horario que o lead pode assistir
3. ENVIE no horario EXATO (nem antes, nem depois)
4. FOLLOW-UP em 10 minutos apos envio
5. Use curiosidade epistemica (resultado vago)
"""
}

SELFIE_COACH_TEMPLATE = """## Instrucoes de Gravacao - {tipo}

### PARA: {nome_mentor}
### DESTINATARIO: {nome_lead}
### DURACAO ALVO: {duracao} segundos

---

### SEU ROTEIRO:

{roteiro}

---

### CHECKLIST PRE-GRAVACAO:
- [ ] Ambiente silencioso
- [ ] Luz natural de frente (janela)
- [ ] Fundo neutro ou profissional
- [ ] Celular na altura dos olhos
- [ ] Modo aviao (sem interrupcoes)

### DICAS DE PERFORMANCE:
1. **NAO LEIA** - Use o roteiro como guia, nao script
2. **OLHE PRA CAMERA** - E o olho da pessoa
3. **FALE DEVAGAR** - Audio de WhatsApp comprime
4. **SORRIA** - Transmite confianca
5. **SEJA BREVE** - Menos e mais

### ERROS COMUNS A EVITAR:
- Gravar deitado ou de lado
- Ambiente com eco
- Luz atras (contraluz)
- Falar rapido demais
- Parecer que ta lendo

### REVISAO:
Antes de enviar, pergunte:
"Eu assistiria isso de um estranho?"
Se sim, envia. Se nao, regrava.
"""


# =============================================================================
# DATACLASSES
# =============================================================================

@dataclass
class VideoScriptConfig:
    """Configuracao para gerar script de video"""
    template: str
    produto: str = ""
    avatar: str = "pessoas"
    problema_1: str = ""
    problema_2: str = ""
    solucao_comum: str = ""
    razao_fracasso: str = ""
    beneficio_1: str = ""
    beneficio_2: str = ""
    esforco_evitado: str = ""
    cliente_exemplo: str = "um cliente nosso"
    resultado_especifico: str = ""
    tempo: str = "30 dias"
    nome_lead: str = ""
    nome_mentor: str = ""
    resultado_vago: str = ""
    dia: str = ""
    hora: str = ""


@dataclass
class SelfieCoachConfig:
    """Configuracao para gerar instrucoes de selfie"""
    tipo: str  # confirmation, case_study, trojan_horse
    nome_mentor: str
    nome_lead: str
    duracao: int = 30
    roteiro: str = ""
    resultado: str = ""
    dia: str = ""
    hora: str = ""


@dataclass
class TimedVideoConfig:
    """Configuracao para video com horario"""
    contact_id: str
    scheduled_time: str
    video_url: str
    follow_up_delay: int = 10
    follow_up_message: str = "E ai, conseguiu ver? O que mais chamou sua atencao?"


# =============================================================================
# GERADORES
# =============================================================================

class HelperAgentsVSL:
    """Classe principal dos helpers de VSL/Video"""

    def __init__(self):
        pass

    def generate_script(self, config: VideoScriptConfig) -> str:
        """Gera script de video baseado no template"""

        if config.template not in TEMPLATES:
            raise ValueError(f"Template '{config.template}' nao encontrado. "
                           f"Disponiveis: {list(TEMPLATES.keys())}")

        template = TEMPLATES[config.template]

        # Substituir placeholders
        script = template.format(
            produto=config.produto or "[PRODUTO]",
            avatar=config.avatar,
            problema_1=config.problema_1 or "[PROBLEMA 1]",
            problema_2=config.problema_2 or "[PROBLEMA 2]",
            solucao_comum=config.solucao_comum or "[SOLUCAO COMUM]",
            razao_fracasso=config.razao_fracasso or "[RAZAO DO FRACASSO]",
            beneficio_1=config.beneficio_1 or "[BENEFICIO 1]",
            beneficio_2=config.beneficio_2 or "[BENEFICIO 2]",
            esforco_evitado=config.esforco_evitado or "[ESFORCO EVITADO]",
            cliente_exemplo=config.cliente_exemplo,
            resultado_especifico=config.resultado_especifico or "[RESULTADO]",
            tempo=config.tempo,
            nome_lead=config.nome_lead or "[NOME]",
            nome_mentor=config.nome_mentor or "[MENTOR]",
            resultado_vago=config.resultado_vago or "[RESULTADO]",
            dia=config.dia or "[DIA]",
            hora=config.hora or "[HORA]",
            # Para case_study
            cliente=config.cliente_exemplo,
            situacao_similar=config.avatar,
            frustracao=config.problema_1 or "[FRUSTRACAO]",
            problema_especifico=config.problema_2 or "[PROBLEMA]",
            solucoes_falhas=config.solucao_comum or "[TENTATIVAS]",
            acao_inicial=config.beneficio_1 or "[ACAO]",
            tempo_curto="2 semanas",
            resultado_1=config.resultado_especifico or "[RESULTADO 1]",
            tempo_longo="3 meses",
            resultado_2=config.beneficio_2 or "[RESULTADO 2]",
            situacao_transformada=config.resultado_vago or "[TRANSFORMACAO]"
        )

        return script

    def generate_selfie_instructions(self, config: SelfieCoachConfig) -> str:
        """Gera instrucoes para gravacao de selfie"""

        # Gerar roteiro baseado no tipo
        if config.tipo == "confirmation":
            roteiro = f"""Fala {config.nome_lead}! Aqui e o {config.nome_mentor}.

To aqui confirmando nossa conversa de {config.dia} as {config.hora}.

Cara, to ansioso pra te mostrar como {config.resultado}.

Ah, e antes da nossa call, da uma olhada nesse video aqui
[apontar pra baixo indicando proxima mensagem].

Vai adiantar muito nossa conversa.

Ate la!"""
            duracao = 25

        elif config.tipo == "trojan_horse":
            roteiro = f"""Oi {config.nome_lead}, tudo bem?

Olha, eu sei que voce recebe mensagens o tempo todo
e provavelmente ta de saco cheio disso.

Eu quero te apresentar algo, mas em vez de jogar um textao,
queria pedir sua permissao primeiro.

Se tiver tudo bem eu te mandar um video de 60 segundos
explicando como {config.resultado}, me avisa.

Posso te mandar?"""
            duracao = 40

        elif config.tipo == "quick_value":
            roteiro = f"""E ai {config.nome_lead}!

Lembrei de voce porque acabei de ver um caso muito parecido com o seu.

O {config.nome_mentor.split()[0]} conseguiu {config.resultado}
e pensei "caramba, {config.nome_lead} precisa ver isso".

Da uma olhada nesse material aqui [apontar pra baixo].

Depois me conta o que achou!"""
            duracao = 20

        else:
            roteiro = config.roteiro or "[ROTEIRO NAO DEFINIDO]"
            duracao = config.duracao

        instructions = SELFIE_COACH_TEMPLATE.format(
            tipo=config.tipo.replace("_", " ").title(),
            nome_mentor=config.nome_mentor,
            nome_lead=config.nome_lead,
            duracao=duracao,
            roteiro=roteiro
        )

        return instructions

    def generate_timed_video_tool_call(self, config: TimedVideoConfig) -> Dict:
        """Gera chamada de ferramenta para video com horario"""

        return {
            "tool": "Agendar_video_timed",
            "parameters": {
                "contactId": config.contact_id,
                "scheduledTime": config.scheduled_time,
                "contentType": "video_url",
                "content": config.video_url,
                "followUpDelay": config.follow_up_delay,
                "followUpMessage": config.follow_up_message
            }
        }

    def get_eric_worre_flow(self, nome_lead: str, resultado: str) -> Dict:
        """Retorna fluxo completo do Eric Worre"""

        return {
            "modo": "reactivator_eric_worre",
            "lead": nome_lead,
            "resultado": resultado,
            "fases": [
                {
                    "fase": 1,
                    "nome": "PERMISSAO",
                    "mensagem": f"Oi {nome_lead}! To com um video de 5 min que explica exatamente como {resultado}. Se eu te mandar voce assiste?",
                    "espera_resposta": True,
                    "respostas_positivas": ["sim", "pode", "manda", "claro", "ok", "blz"],
                    "proximo_se_positivo": 2,
                    "resposta_negativa": "Sem problema! Quando fizer sentido, me chama."
                },
                {
                    "fase": 2,
                    "nome": "COMPROMISSO_HORARIO",
                    "mensagem": "Show! Que horario hoje voce consegue dar play? Quero mandar na hora certa pra voce nao esquecer.",
                    "espera_resposta": True,
                    "tipo_resposta": "horario",
                    "proximo": 3
                },
                {
                    "fase": 3,
                    "nome": "CONFIRMACAO",
                    "mensagem_template": "Combinado! As {horario} em ponto mando pra voce. Fica de olho!",
                    "acao": "Agendar_video_timed",
                    "proximo": 4
                },
                {
                    "fase": 4,
                    "nome": "FOLLOW_UP",
                    "delay_minutos": 10,
                    "mensagem": "E ai, conseguiu ver? O que mais chamou sua atencao?",
                    "espera_resposta": True,
                    "proximo_se_interesse": 5,
                    "resposta_sem_interesse": "Fica tranquilo! Quando tiver um tempinho, da uma olhada."
                },
                {
                    "fase": 5,
                    "nome": "TRANSICAO_AGENDAMENTO",
                    "mensagem": "Quer que eu te explique melhor como funciona? Tenho 15 min amanha as 14h ou quinta as 10h. Qual fica melhor?",
                    "acao": "transicionar_para_scheduler"
                }
            ]
        }


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description='Helper Agents VSL v1.0.0')

    # Subcommands
    parser.add_argument('--script', type=str, choices=list(TEMPLATES.keys()),
                       help='Gerar script de video')
    parser.add_argument('--selfie-coach', action='store_true',
                       help='Gerar instrucoes de selfie')
    parser.add_argument('--eric-worre', action='store_true',
                       help='Gerar fluxo Eric Worre')

    # Script params
    parser.add_argument('--produto', type=str, default='')
    parser.add_argument('--avatar', type=str, default='pessoas')
    parser.add_argument('--resultado', type=str, default='')
    parser.add_argument('--lead', type=str, default='')
    parser.add_argument('--mentor', type=str, default='')
    parser.add_argument('--dia', type=str, default='')
    parser.add_argument('--hora', type=str, default='')

    # Selfie coach params
    parser.add_argument('--tipo', type=str, default='confirmation',
                       choices=['confirmation', 'trojan_horse', 'quick_value'])

    # Output
    parser.add_argument('--output', type=str, help='Arquivo de saida')
    parser.add_argument('--json', action='store_true', help='Output em JSON')

    args = parser.parse_args()

    helper = HelperAgentsVSL()

    if args.script:
        config = VideoScriptConfig(
            template=args.script,
            produto=args.produto,
            avatar=args.avatar,
            nome_lead=args.lead,
            nome_mentor=args.mentor,
            resultado_vago=args.resultado,
            dia=args.dia,
            hora=args.hora
        )
        result = helper.generate_script(config)

        if args.json:
            print(json.dumps({"script": result, "template": args.script}, ensure_ascii=False, indent=2))
        else:
            print(result)

    elif args.selfie_coach:
        config = SelfieCoachConfig(
            tipo=args.tipo,
            nome_mentor=args.mentor or "Mentor",
            nome_lead=args.lead or "Lead",
            resultado=args.resultado,
            dia=args.dia,
            hora=args.hora
        )
        result = helper.generate_selfie_instructions(config)

        if args.json:
            print(json.dumps({"instructions": result, "tipo": args.tipo}, ensure_ascii=False, indent=2))
        else:
            print(result)

    elif args.eric_worre:
        result = helper.get_eric_worre_flow(
            nome_lead=args.lead or "Lead",
            resultado=args.resultado or "resultado incrivel"
        )

        print(json.dumps(result, ensure_ascii=False, indent=2))

    else:
        print("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎬 HELPER AGENTS VSL v1.0.0                                ║
║   Scripts de Video, VSL, Loom e Selfie                        ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   TEMPLATES DISPONIVEIS:                                      ║
║   - native_vsl       : Video de 1-2min apos permissao         ║
║   - trojan_horse_audio: Audio de 45s pedindo permissao        ║
║   - selfie_confirmation: Video 20-30s confirmando call        ║
║   - case_study       : Script de caso de sucesso              ║
║   - eric_worre_reactivation: Tecnica completa de reativacao   ║
║                                                               ║
║   EXEMPLOS:                                                   ║
║   python helper_agents_vsl.py --script native_vsl             ║
║   python helper_agents_vsl.py --selfie-coach --tipo confirmation ║
║   python helper_agents_vsl.py --eric-worre --lead "Maria"     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
        """)


if __name__ == "__main__":
    main()
