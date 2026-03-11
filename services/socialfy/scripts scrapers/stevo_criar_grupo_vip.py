#!/usr/bin/env python3
"""
Script MOTTIVME - Criar Grupo VIP com Especialista via Stevo API

Fluxo:
1. Lead agenda consulta (trigger vindo do GHL)
2. Cria grupo WhatsApp com lead + especialista
3. Envia mensagem de apresentação edificando MOTTIVME e especialista

Autor: Marcos Daniels - MOTTIVME
Data: 2026-01-11
"""

import requests
import json
import sys

# ============ CONFIGURAÇÕES ============
STEVO_BASE_URL = "https://smv2-2.stevo.chat"
STEVO_API_KEY = "1768108453277bwfTzN4uG8h9Hng5"
INSTANCE_NAME = "marcosdaniels"


def criar_grupo(lead_nome, lead_numero, especialista_numero, especialista_nome):
    """
    Cria grupo WhatsApp com lead e especialista

    Args:
        lead_nome: Nome do lead
        lead_numero: Número do lead (apenas números com DDI, ex: 5511999999999)
        especialista_numero: Número do especialista (apenas números com DDI)
        especialista_nome: Nome do especialista

    Returns:
        dict: Com 'jid' do grupo criado ou 'error' em caso de falha
    """
    url = f"{STEVO_BASE_URL}/group/create"

    nome_grupo = f"MOTTIVME | {lead_nome.split()[0]} + {especialista_nome.split()[0]}"

    payload = {
        "instanceName": INSTANCE_NAME,
        "groupName": nome_grupo,
        "participants": [
            lead_numero,
            especialista_numero
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "apikey": STEVO_API_KEY
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        data = response.json()

        if data.get("message") == "success":
            grupo_jid = data["data"]["jid"]
            print(f"✅ Grupo criado: {nome_grupo}")
            print(f"   ID do grupo: {grupo_jid}")
            return {"success": True, "jid": grupo_jid, "nome": nome_grupo}
        else:
            print(f"❌ Erro ao criar grupo: {data}")
            return {"success": False, "error": data}

    except Exception as e:
        print(f"❌ Exceção ao criar grupo: {e}")
        return {"success": False, "error": str(e)}


def enviar_mensagem_grupo(grupo_jid, mensagem):
    """
    Envia mensagem em um grupo

    Args:
        grupo_jid: ID do grupo (termina com @g.us)
        mensagem: Texto da mensagem

    Returns:
        bool: True se sucesso, False se falha
    """
    url = f"{STEVO_BASE_URL}/send/text"

    payload = {
        "instanceName": INSTANCE_NAME,
        "number": grupo_jid,
        "text": mensagem
    }

    headers = {
        "Content-Type": "application/json",
        "apikey": STEVO_API_KEY
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        data = response.json()

        if data.get("message") == "success":
            msg_id = data["data"]["Info"]["ID"]
            print(f"✅ Mensagem enviada (ID: {msg_id})")
            return True
        else:
            print(f"❌ Erro ao enviar mensagem: {data}")
            return False

    except Exception as e:
        print(f"❌ Exceção ao enviar mensagem: {e}")
        return False


def gerar_mensagem_apresentacao(lead_nome, lead_empresa, lead_objetivo, especialista_nome, especialista_bio):
    """
    Gera mensagem de apresentação edificando MOTTIVME e especialista

    Args:
        lead_nome: Nome do lead
        lead_empresa: Empresa do lead (opcional)
        lead_objetivo: Objetivo do lead (opcional)
        especialista_nome: Nome do especialista
        especialista_bio: Biografia do especialista

    Returns:
        str: Mensagem formatada
    """
    empresa_text = f" da *{lead_empresa}*" if lead_empresa else ""
    objetivo_text = f" que está buscando *{lead_objetivo}*" if lead_objetivo else " que está buscando escalar resultados"

    mensagem = f"""🎯 *GRUPO EXCLUSIVO MOTTIVME*

Olá *{lead_nome}*! 👋

Criei esse grupo para você ter acesso *direto* ao especialista que vai conduzir sua call.

---

*🧠 Apresentando seu especialista:*

*{especialista_nome}*
Especialista em Growth & Vendas da *MOTTIVME*

Com nossa metodologia, ajudamos dezenas de empresas a:
✅ Escalar faturamento com automações inteligentes
✅ Implementar IA no atendimento e vendas
✅ Criar máquinas de prospecção ativa

---

{especialista_nome}, esse é o *{lead_nome}*{empresa_text}, {objetivo_text}.

Podem se apresentar e alinhar qualquer dúvida antes da call! 🚀"""

    return mensagem


def fluxo_completo(lead_nome, lead_numero, lead_empresa="", lead_objetivo="", especialista_nome="Archie", especialista_numero="5511936180422", especialista_bio="Estrategista de crescimento com mais de 10 anos de experiência em ajudar empresas a escalarem faturamente através de automações e IA."):
    """
    Executa fluxo completo: criar grupo + enviar apresentação

    Args:
        lead_nome: Nome do lead
        lead_numero: Número do lead (com DDI, sem +)
        lead_empresa: Empresa do lead (opcional)
        lead_objetivo: Objetivo do lead (opcional)
        especialista_nome: Nome do especialista
        especialista_numero: Número do especialista (com DDI, sem +)
        especialista_bio: Biografia do especialista

    Returns:
        dict: Resultado da operação
    """

    print("=" * 50)
    print("🚀 MOTTIVME - Fluxo Grupo VIP")
    print("=" * 50)
    print(f"Lead: {lead_nome} ({lead_numero})")
    print(f"Especialista: {especialista_nome} ({especialista_numero})")
    print()

    # 1. Criar grupo
    print("📝 Passo 1: Criando grupo...")
    resultado_grupo = criar_grupo(
        lead_nome=lead_nome,
        lead_numero=lead_numero,
        especialista_numero=especialista_numero,
        especialista_nome=especialista_nome
    )

    if not resultado_grupo.get("success"):
        return {"success": False, "step": "criar_grupo", "error": resultado_grupo.get("error")}

    grupo_jid = resultado_grupo["jid"]

    # 2. Gerar mensagem de apresentação
    print()
    print("📝 Passo 2: Gerando mensagem de apresentação...")
    mensagem = gerar_mensagem_apresentacao(
        lead_nome=lead_nome,
        lead_empresa=lead_empresa,
        lead_objetivo=lead_objetivo,
        especialista_nome=especialista_nome,
        especialista_bio=especialista_bio
    )

    # 3. Enviar mensagem no grupo
    print()
    print("📝 Passo 3: Enviando mensagem no grupo...")
    resultado_msg = enviar_mensagem_grupo(grupo_jid, mensagem)

    if not resultado_msg:
        return {"success": False, "step": "enviar_mensagem", "error": "Falha ao enviar"}

    print()
    print("=" * 50)
    print("✅ FLUXO CONCLUÍDO COM SUCESSO!")
    print(f"   Grupo: {resultado_grupo['nome']}")
    print(f"   JID: {grupo_jid}")
    print("=" * 50)

    return {
        "success": True,
        "grupo_nome": resultado_grupo["nome"],
        "grupo_jid": grupo_jid
    }


# ============ MAIN ============
if __name__ == "__main__":

    # Exemplo de uso
    if len(sys.argv) > 1:
        # Usando argumentos de linha de comando
        lead_nome = sys.argv[1]
        lead_numero = sys.argv[2] if len(sys.argv) > 2 else "5511936180422"
        lead_empresa = sys.argv[3] if len(sys.argv) > 3 else ""
        lead_objetivo = sys.argv[4] if len(sys.argv) > 4 else ""
    else:
        # Valores padrão para teste
        lead_nome = "Marcos Daniels"
        lead_numero = "5511936180422"  # Seu número para teste
        lead_empresa = "MOTTIVME"
        lead_objetivo = "implementar IA no atendimento"

    resultado = fluxo_completo(
        lead_nome=lead_nome,
        lead_numero=lead_numero,
        lead_empresa=lead_empresa,
        lead_objetivo=lead_objetivo
    )

    if not resultado.get("success"):
        print(f"\n❌ Erro no fluxo: {resultado}")
        sys.exit(1)
