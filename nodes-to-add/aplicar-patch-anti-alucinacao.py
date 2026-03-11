#!/usr/bin/env python3
"""
SCRIPT: Aplicar Patch Anti-Alucinação no AI Factory V3

Este script aplica automaticamente todas as correções necessárias:
1. Modifica o System Message do nó 1.7 (guardrails anti-alucinação)
2. Modifica o User Message do nó 1.7 (ancoragem do nome)
3. Adiciona o novo nó 1.8 (validador de alucinação)
4. Atualiza as conexões (1.7 → 1.8 → 2.1)
5. Reduz a temperature do Groq de 0.3 para 0.1

Uso:
    python3 aplicar-patch-anti-alucinacao.py
"""

import json
import os
from datetime import datetime

# Caminhos
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(SCRIPT_DIR)
WORKFLOW_ORIGINAL = os.path.join(PARENT_DIR, "10-AI-Factory-V3-Unified.json")
WORKFLOW_MODIFICADO = os.path.join(PARENT_DIR, "10-AI-Factory-V3-Unified-ANTI-ALUCINACAO.json")
WORKFLOW_BACKUP = os.path.join(PARENT_DIR, f"10-AI-Factory-V3-Unified-BACKUP-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")

# ========== PATCHES ==========

PATCH_SYSTEM_MESSAGE = """## ⚠️ REGRAS CRÍTICAS ANTI-ALUCINAÇÃO (LER PRIMEIRO!)

### CLIENTE ATUAL - DADOS OBRIGATÓRIOS
VOCÊ ESTÁ ANALISANDO EXCLUSIVAMENTE O CLIENTE: {{ $json.nome_lead }}
TELEFONE DO CLIENTE: {{ $json.telefone_lead }}

### REGRA ABSOLUTA #1: ANCORAGEM DO NOME
O campo "nome_negocio" no seu output JSON DEVE ser:
- EXATAMENTE "{{ $json.nome_lead }}" OU
- Um nome extraído DIRETAMENTE e LITERALMENTE da transcrição abaixo

### REGRA ABSOLUTA #2: PROIBIÇÕES
❌ NUNCA use nomes que você "conhece" de outros contextos
❌ NUNCA invente nomes como "Dra. Eline Lobo", "Dr. João Silva", "Clínica XYZ" que NÃO estão na transcrição
❌ NUNCA use dados de exemplos, few-shots ou treinamento para o nome_negocio
❌ NUNCA "adivinhe" o nome do negócio - extraia APENAS do texto

### REGRA ABSOLUTA #3: VERIFICAÇÃO ANTES DE RESPONDER
Antes de gerar seu JSON, faça esta verificação mental:
1. ✓ O nome_negocio que vou usar aparece na transcrição fornecida?
2. ✓ O nome_negocio corresponde ou deriva de "{{ $json.nome_lead }}"?
3. ✓ Eu NÃO estou usando informações de outros clientes/contextos?

SE QUALQUER VERIFICAÇÃO FALHAR → Use "{{ $json.nome_lead }}" como nome_negocio.

### REGRA ABSOLUTA #4: VALIDAÇÃO DO OUTPUT
Seu JSON de output será REJEITADO se:
- nome_negocio contiver "Eline Lobo" quando input for outro cliente
- nome_negocio não tiver NENHUMA relação com o nome_lead do input
- nome_negocio for um nome "famoso" que não está na transcrição

---

"""

PATCH_USER_MESSAGE = """## 🎯 DADOS OBRIGATÓRIOS DO CLIENTE ATUAL

| Campo | Valor (USE EXATAMENTE ESTE) |
|-------|----------------------------|
| **NOME DO CLIENTE** | {{ $json.nome_lead }} |
| **TELEFONE** | {{ $json.telefone_lead }} |
| **CONTACT ID** | {{ $json.contact_id }} |

⚠️ **ATENÇÃO CRÍTICA:**
O agente que você criar é para "{{ $json.nome_lead }}".
O nome_negocio no seu JSON DEVE ser "{{ $json.nome_lead }}" ou extraído da transcrição abaixo.
NUNCA use nomes de outros clientes como "Dra. Eline Lobo".

---

"""

NODE_1_8_CODE = '''// =====================================================
// NÓ 1.8 - VALIDAR OUTPUT E CORRIGIR ALUCINAÇÕES
// Detecta quando a IA "inventou" dados de outro cliente
// =====================================================

// Buscar dados do nó 1.6 (dados originais do cliente)
let dadosInput = {};
try {
  const items16 = $('1.6 Preparar Dados').all();
  if (items16 && items16.length > 0) {
    dadosInput = items16[0].json;
  }
} catch (e) {
  try {
    const itemsPreparar = $('Preparar Dados').all();
    if (itemsPreparar && itemsPreparar.length > 0) {
      dadosInput = itemsPreparar[0].json;
    }
  } catch (e2) {
    console.log('Aviso: Não foi possível buscar dados do nó 1.6');
  }
}

const respostaIA = $input.first().json;

const nomeLeadEsperado = dadosInput.nome_lead || dadosInput.name || dadosInput.contactName || '';
const telefoneEsperado = dadosInput.telefone_lead || dadosInput.phone || '';
const textoTranscricao = dadosInput.texto_transcricao || dadosInput.transcription || '';

let outputText = respostaIA.output || respostaIA.text || respostaIA.message || '';
if (typeof outputText === 'object') {
  outputText = JSON.stringify(outputText);
}

const CLIENTES_CONHECIDOS = [
  'Dra. Eline Lobo', 'Eline Lobo', 'Dra Eline', 'Clínica da Dra. Eline', 'Clínica Eline Lobo',
  'Dr. João Silva', 'João Silva', 'Clínica Premium', 'Dra. Maria', 'Dr. Carlos',
  'Clínica Exemplo', 'Dr. Exemplo', 'Clínica Modelo', 'Dra. Ana Paula', 'Dr. Roberto'
];

function extrairCampoJSON(texto, campo) {
  try {
    const patterns = [
      new RegExp(`"${campo}"\\\\s*:\\\\s*"([^"]+)"`, 'i'),
      new RegExp(`'${campo}'\\\\s*:\\\\s*'([^']+)'`, 'i'),
    ];
    for (const regex of patterns) {
      const match = texto.match(regex);
      if (match) return match[1];
    }
    return null;
  } catch (e) { return null; }
}

function substituirCampoJSON(texto, campo, novoValor) {
  try {
    const valorEscapado = novoValor.replace(/"/g, '\\\\"');
    const regex = new RegExp(`("${campo}"\\\\s*:\\\\s*)"([^"]+)"`, 'gi');
    return texto.replace(regex, `$1"${valorEscapado}"`);
  } catch (e) { return texto; }
}

function normalizarNome(nome) {
  if (!nome) return '';
  return nome.toLowerCase()
    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-z0-9\\s]/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
}

function calcularSimilaridade(str1, str2) {
  const s1 = normalizarNome(str1);
  const s2 = normalizarNome(str2);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  const palavras1 = s1.split(/\\s+/).filter(p => p.length > 2);
  const palavras2 = s2.split(/\\s+/).filter(p => p.length > 2);
  if (palavras1.length === 0 || palavras2.length === 0) return 0;
  let comuns = 0;
  for (const p1 of palavras1) {
    if (palavras2.some(p2 => p2.includes(p1) || p1.includes(p2))) comuns++;
  }
  return comuns / Math.max(palavras1.length, palavras2.length);
}

const validacao = {
  passou: true, alertas: [], correcoes: [], alucinacao_detectada: false,
  nome_ia: null, nome_esperado: nomeLeadEsperado, similaridade: 0,
  timestamp: new Date().toISOString()
};

const nomeNegocioIA = extrairCampoJSON(outputText, 'nome_negocio');
validacao.nome_ia = nomeNegocioIA;

if (nomeNegocioIA) {
  for (const clienteConhecido of CLIENTES_CONHECIDOS) {
    const nomeNormalizado = normalizarNome(nomeNegocioIA);
    const clienteNormalizado = normalizarNome(clienteConhecido);
    if (nomeNormalizado.includes(clienteNormalizado) || clienteNormalizado.includes(nomeNormalizado)) {
      const leadNormalizado = normalizarNome(nomeLeadEsperado);
      if (!leadNormalizado.includes(clienteNormalizado) && !clienteNormalizado.includes(leadNormalizado)) {
        validacao.alucinacao_detectada = true;
        validacao.passou = false;
        validacao.alertas.push({
          tipo: 'ALUCINACAO_CRITICA', severidade: 'ALTA',
          mensagem: `IA gerou "${nomeNegocioIA}" mas cliente real é "${nomeLeadEsperado}"`,
          cliente_inventado: nomeNegocioIA, cliente_real: nomeLeadEsperado
        });
        outputText = substituirCampoJSON(outputText, 'nome_negocio', nomeLeadEsperado);
        validacao.correcoes.push({
          campo: 'nome_negocio', valor_errado: nomeNegocioIA, valor_corrigido: nomeLeadEsperado,
          motivo: 'Alucinação detectada - nome de outro cliente conhecido'
        });
        break;
      }
    }
  }

  if (!validacao.alucinacao_detectada) {
    validacao.similaridade = calcularSimilaridade(nomeNegocioIA, nomeLeadEsperado);
    if (validacao.similaridade < 0.15 && textoTranscricao) {
      const transcricaoNormalizada = normalizarNome(textoTranscricao);
      const nomeParcial = normalizarNome(nomeNegocioIA).substring(0, 15);
      if (!transcricaoNormalizada.includes(nomeParcial)) {
        validacao.alucinacao_detectada = true;
        validacao.passou = false;
        validacao.alertas.push({
          tipo: 'NOME_NAO_NA_TRANSCRICAO', severidade: 'ALTA',
          mensagem: `"${nomeNegocioIA}" não aparece na transcrição - provável alucinação`
        });
        outputText = substituirCampoJSON(outputText, 'nome_negocio', nomeLeadEsperado);
        validacao.correcoes.push({
          campo: 'nome_negocio', valor_errado: nomeNegocioIA, valor_corrigido: nomeLeadEsperado,
          motivo: 'Nome não encontrado na transcrição'
        });
      }
    }
  }
}

console.log('\\n========== VALIDAÇÃO ANTI-ALUCINAÇÃO ==========');
console.log(`Cliente esperado: "${nomeLeadEsperado}"`);
console.log(`Nome gerado pela IA: "${nomeNegocioIA || 'N/A'}"`);
console.log(`Alucinação detectada: ${validacao.alucinacao_detectada ? '⚠️ SIM' : '✅ NÃO'}`);
console.log(`Correções aplicadas: ${validacao.correcoes.length}`);
console.log('================================================\\n');

return [{
  json: {
    ...respostaIA,
    output: outputText,
    _validacao_alucinacao: validacao,
    _dados_input_original: { nome_lead: nomeLeadEsperado, telefone: telefoneEsperado },
    _processado_em: new Date().toISOString(),
    _versao_validador: '1.0.0'
  }
}];'''

NEW_NODE_1_8 = {
    "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": NODE_1_8_CODE
    },
    "id": "node-1-8-validar-alucinacao",
    "name": "1.8 Validar Alucinação",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [13784, 1088],
    "notesInFlow": True,
    "notes": "ANTI-ALUCINAÇÃO: Detecta se a IA gerou dados de outro cliente e corrige automaticamente."
}


def main():
    print("=" * 60)
    print("APLICANDO PATCH ANTI-ALUCINAÇÃO NO AI FACTORY V3")
    print("=" * 60)

    # 1. Ler workflow original
    print(f"\n[1/6] Lendo workflow original: {WORKFLOW_ORIGINAL}")
    with open(WORKFLOW_ORIGINAL, 'r', encoding='utf-8') as f:
        workflow = json.load(f)

    # 2. Criar backup
    print(f"[2/6] Criando backup: {WORKFLOW_BACKUP}")
    with open(WORKFLOW_BACKUP, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, ensure_ascii=False, indent=2)

    # 3. Encontrar e modificar nó 1.7
    print("[3/6] Modificando nó 1.7 (System Message e User Message)")
    node_17_found = False
    for node in workflow['nodes']:
        if node.get('name') == '1.7 AI - Analisar Kickoff (GHL Architect V2)':
            node_17_found = True
            # Modificar text (User Message)
            original_text = node['parameters'].get('text', '')
            if not original_text.startswith('=## 🎯 DADOS OBRIGATÓRIOS'):
                node['parameters']['text'] = '=' + PATCH_USER_MESSAGE + original_text.lstrip('=')
                print("   ✓ User Message modificado (ancoragem do nome adicionada)")
            else:
                print("   - User Message já continha o patch")

            # Modificar systemMessage
            options = node['parameters'].get('options', {})
            original_system = options.get('systemMessage', '')
            if not original_system.startswith('=## ⚠️ REGRAS CRÍTICAS ANTI-ALUCINAÇÃO'):
                options['systemMessage'] = '=' + PATCH_SYSTEM_MESSAGE + original_system.lstrip('=')
                node['parameters']['options'] = options
                print("   ✓ System Message modificado (guardrails anti-alucinação adicionados)")
            else:
                print("   - System Message já continha o patch")
            break

    if not node_17_found:
        print("   ⚠️ AVISO: Nó 1.7 não encontrado!")

    # 4. Encontrar e modificar nó Groq (temperature)
    print("[4/6] Modificando nó Groq (temperature 0.3 → 0.1)")
    groq_found = False
    for node in workflow['nodes']:
        if node.get('name') == 'Groq Llama 3.3 70B':
            groq_found = True
            options = node['parameters'].get('options', {})
            old_temp = options.get('temperature', 'não definido')
            options['temperature'] = 0.1
            node['parameters']['options'] = options
            print(f"   ✓ Temperature alterado de {old_temp} para 0.1")
            break

    if not groq_found:
        print("   ⚠️ AVISO: Nó Groq não encontrado!")

    # 5. Adicionar nó 1.8
    print("[5/6] Adicionando nó 1.8 (Validar Alucinação)")
    node_18_exists = any(n.get('name') == '1.8 Validar Alucinação' for n in workflow['nodes'])
    if not node_18_exists:
        workflow['nodes'].append(NEW_NODE_1_8)
        print("   ✓ Nó 1.8 adicionado")
    else:
        print("   - Nó 1.8 já existe")

    # 6. Atualizar conexões
    print("[6/6] Atualizando conexões (1.7 → 1.8 → 2.1)")
    connections = workflow.get('connections', {})

    # Conexão 1.7 → 1.8
    connections['1.7 AI - Analisar Kickoff (GHL Architect V2)'] = {
        "main": [[{
            "node": "1.8 Validar Alucinação",
            "type": "main",
            "index": 0
        }]]
    }
    print("   ✓ Conexão 1.7 → 1.8 configurada")

    # Conexão 1.8 → 2.1
    connections['1.8 Validar Alucinação'] = {
        "main": [[{
            "node": "2.1 Processar Análise + Hiperpersonalização",
            "type": "main",
            "index": 0
        }]]
    }
    print("   ✓ Conexão 1.8 → 2.1 configurada")

    workflow['connections'] = connections

    # 7. Salvar workflow modificado
    print(f"\n[SALVANDO] Workflow modificado: {WORKFLOW_MODIFICADO}")
    with open(WORKFLOW_MODIFICADO, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("✅ PATCH APLICADO COM SUCESSO!")
    print("=" * 60)
    print(f"\nArquivos gerados:")
    print(f"  - Backup: {os.path.basename(WORKFLOW_BACKUP)}")
    print(f"  - Modificado: {os.path.basename(WORKFLOW_MODIFICADO)}")
    print(f"\nPróximos passos:")
    print(f"  1. Importe o arquivo '{os.path.basename(WORKFLOW_MODIFICADO)}' no n8n")
    print(f"  2. Teste com a transcrição do 'Dr Luiz e Mariana'")
    print(f"  3. Verifique se output contém 'Dr Luiz' e NÃO 'Dra. Eline'")
    print("=" * 60)


if __name__ == "__main__":
    main()
