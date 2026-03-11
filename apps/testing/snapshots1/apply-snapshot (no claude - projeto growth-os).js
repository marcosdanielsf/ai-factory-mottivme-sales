/**
 * MOTTIVME - Aplicador de Snapshots GHL
 * ======================================
 * Aplica snapshots (Clínicas, Mentores, Agentes) via API do GoHighLevel
 *
 * REQUISITOS:
 * - Node.js 18+
 * - Token OAuth válido do GHL (não API Key de agência!)
 *
 * USO:
 * node apply-snapshot.js <subnicho> <locationId> <accessToken>
 *
 * EXEMPLOS:
 * node apply-snapshot.js clinicas hHTtB7iZ4EUqQ3L2yQZK eyJhbGciOiJSUzI1NiIs...
 * node apply-snapshot.js mentores sNwLyynZWP6jEtBy1ubf eyJhbGciOiJSUzI1NiIs...
 * node apply-snapshot.js agentes cd1uyzpJox6XPt4Vct8Y eyJhbGciOiJSUzI1NiIs...
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

// ============================================
// FUNÇÕES DE API
// ============================================

async function makeRequest(method, endpoint, accessToken, body = null) {
  const url = `${BASE_URL}${endpoint}`;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': API_VERSION
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// CRIAR CUSTOM FIELDS
// ============================================

async function createCustomFields(locationId, accessToken, fields) {
  console.log('\n📋 CRIANDO CUSTOM FIELDS...\n');

  const results = [];

  for (const field of fields) {
    const body = {
      name: field.name,
      dataType: field.dataType,
      model: field.model,
      placeholder: field.placeholder || '',
      position: field.position || 0
    };

    // Adicionar opções para campos de seleção
    if (field.picklistOptions) {
      body.picklistOptions = field.picklistOptions;
    }

    console.log(`  → ${field.name}...`);

    const result = await makeRequest(
      'POST',
      `/locations/${locationId}/customFields`,
      accessToken,
      body
    );

    if (result.success) {
      console.log(`    ✅ Criado (ID: ${result.data.customField?.id || 'N/A'})`);
      results.push({ name: field.name, id: result.data.customField?.id, status: 'created' });
    } else {
      const errorMsg = result.data?.message || JSON.stringify(result.data);
      console.log(`    ⚠️ Falhou: ${errorMsg}`);
      results.push({ name: field.name, status: 'failed', error: errorMsg });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return results;
}

// ============================================
// CRIAR PIPELINES
// ============================================

async function createPipelines(locationId, accessToken, pipelines) {
  console.log('\n🔄 CRIANDO PIPELINES...\n');

  const results = [];

  for (const pipeline of pipelines) {
    console.log(`  → ${pipeline.name}...`);

    const body = {
      name: pipeline.name,
      stages: pipeline.stages.map(stage => ({
        name: stage.name,
        position: stage.position
      }))
    };

    const result = await makeRequest(
      'POST',
      `/locations/${locationId}/pipelines`,
      accessToken,
      body
    );

    if (result.success) {
      const pipelineId = result.data.pipeline?.id || result.data.id;
      console.log(`    ✅ Criado (ID: ${pipelineId})`);
      console.log(`       Estágios: ${pipeline.stages.map(s => s.name).join(' → ')}`);
      results.push({
        name: pipeline.name,
        id: pipelineId,
        stages: result.data.pipeline?.stages || result.data.stages,
        status: 'created'
      });
    } else {
      const errorMsg = result.data?.message || JSON.stringify(result.data);
      console.log(`    ⚠️ Falhou: ${errorMsg}`);
      results.push({ name: pipeline.name, status: 'failed', error: errorMsg });
    }

    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}

// ============================================
// CRIAR TAGS
// ============================================

async function createTags(locationId, accessToken, tags) {
  console.log('\n🏷️ CRIANDO TAGS...\n');

  const results = [];

  for (const tagName of tags) {
    console.log(`  → ${tagName}...`);

    const result = await makeRequest(
      'POST',
      `/locations/${locationId}/tags`,
      accessToken,
      { name: tagName }
    );

    if (result.success) {
      console.log(`    ✅ Criada`);
      results.push({ name: tagName, id: result.data.tag?.id, status: 'created' });
    } else {
      const errorMsg = result.data?.message || JSON.stringify(result.data);
      console.log(`    ⚠️ Falhou: ${errorMsg}`);
      results.push({ name: tagName, status: 'failed', error: errorMsg });
    }

    await new Promise(r => setTimeout(r, 200));
  }

  return results;
}

// ============================================
// VERIFICAR LOCATION
// ============================================

async function verifyLocation(locationId, accessToken) {
  console.log(`\n🔍 Verificando location: ${locationId}...`);

  const result = await makeRequest('GET', `/locations/${locationId}`, accessToken);

  if (result.success) {
    const name = result.data.location?.name || result.data.name || 'N/A';
    console.log(`✅ Location válida: ${name}`);
    return { valid: true, name };
  } else {
    console.log(`❌ Location inválida ou sem acesso (${result.status})`);
    return { valid: false };
  }
}

// ============================================
// MAIN
// ============================================

async function applySnapshot(subnicho, locationId, accessToken) {
  // Carregar snapshot
  const snapshotPath = path.join(__dirname, `snapshot-${subnicho}-v1.json`);

  if (!fs.existsSync(snapshotPath)) {
    console.error(`❌ Snapshot não encontrado: ${snapshotPath}`);
    console.log('Snapshots disponíveis: clinicas, mentores, agentes');
    process.exit(1);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║  MOTTIVME SNAPSHOT: ${snapshot.snapshot.name.padEnd(36)}║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Versão: ${snapshot.snapshot.version.padEnd(47)}║`);
  console.log(`║  Location: ${locationId.padEnd(45)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝');

  // 1. Verificar location
  const locationCheck = await verifyLocation(locationId, accessToken);
  if (!locationCheck.valid) {
    console.log('\n❌ Abortando: Location inválida ou token sem permissão');
    process.exit(1);
  }

  // 2. Criar Custom Fields
  const fieldsResults = await createCustomFields(locationId, accessToken, snapshot.customFields);

  // 3. Criar Pipelines
  const pipelinesResults = await createPipelines(locationId, accessToken, snapshot.pipelines);

  // 4. Criar Tags
  const tagsResults = await createTags(locationId, accessToken, snapshot.tags);

  // 5. Resumo
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                        RESUMO                               ║');
  console.log('╠════════════════════════════════════════════════════════════╣');

  const fieldsCreated = fieldsResults.filter(r => r.status === 'created').length;
  const pipelinesCreated = pipelinesResults.filter(r => r.status === 'created').length;
  const tagsCreated = tagsResults.filter(r => r.status === 'created').length;

  console.log(`║  Custom Fields: ${fieldsCreated}/${snapshot.customFields.length} criados`.padEnd(59) + '║');
  console.log(`║  Pipelines:     ${pipelinesCreated}/${snapshot.pipelines.length} criados`.padEnd(59) + '║');
  console.log(`║  Tags:          ${tagsCreated}/${snapshot.tags.length} criadas`.padEnd(59) + '║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // 6. Workflows (apenas listar - precisam ser criados manualmente ou via n8n)
  console.log('\n📝 WORKFLOWS A CONFIGURAR:');
  snapshot.workflows.forEach((wf, i) => {
    console.log(`   ${i + 1}. ${wf.name}`);
    console.log(`      Trigger: ${wf.trigger}`);
  });

  // 7. Salvar resultado
  const outputFile = `/tmp/snapshot-result-${subnicho}-${locationId}.json`;
  const output = {
    locationId,
    locationName: locationCheck.name,
    snapshot: snapshot.snapshot,
    appliedAt: new Date().toISOString(),
    results: {
      customFields: fieldsResults,
      pipelines: pipelinesResults,
      tags: tagsResults
    },
    workflowsToConfigure: snapshot.workflows
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`\n📄 Resultado salvo em: ${outputFile}`);

  return output;
}

// ============================================
// EXECUÇÃO
// ============================================

const [,, subnicho, locationId, accessToken] = process.argv;

if (!subnicho || !locationId || !accessToken) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          MOTTIVME - Aplicador de Snapshots GHL             ║
╚════════════════════════════════════════════════════════════╝

USO:
  node apply-snapshot.js <subnicho> <locationId> <accessToken>

SUBNICHADOS DISPONÍVEIS:
  clinicas  - Clínicas High Ticket (Menopausa, Emagrecimento, etc.)
  mentores  - Mentores e Coaches High Ticket
  agentes   - Agentes Financeiros (Seguros, Previdência, etc.)

EXEMPLOS:
  node apply-snapshot.js clinicas hHTtB7iZ4EUqQ3L2yQZK eyJhbGci...
  node apply-snapshot.js mentores sNwLyynZWP6jEtBy1ubf eyJhbGci...
  node apply-snapshot.js agentes cd1uyzpJox6XPt4Vct8Y eyJhbGci...

COMO OBTER O ACCESS TOKEN:
  1. Vá em Settings > Integrations > Private Integrations no GHL
  2. Crie uma nova integração com escopos:
     - locations/customFields.write
     - locations/customFields.readonly
     - locations.readonly
     - locations/tags.write
     - opportunities/pipelines.write
  3. Copie o Access Token gerado
`);
  process.exit(1);
}

applySnapshot(subnicho, locationId, accessToken).then(() => {
  console.log('\n✅ Snapshot aplicado com sucesso!\n');
}).catch(error => {
  console.error('\n❌ Erro ao aplicar snapshot:', error);
  process.exit(1);
});
