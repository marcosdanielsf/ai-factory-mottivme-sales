const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://bfumywvwubvernvhjehk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MDM3OTksImV4cCI6MjA2Njk3OTc5OX0.60VyeZ8XaD6kz7Eh5Ov_nEeDtu5woMwMJYgUM-Sruao"
);

async function catalogAll() {
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║     CATÁLOGO COMPLETO: TODAS AS TABELAS DASH                     ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");

  // ============================================================================
  // 1. APP_DASH_PRINCIPAL - ANÁLISE COMPLETA
  // ============================================================================
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("1. APP_DASH_PRINCIPAL - ANÁLISE COMPLETA DO STATUS");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const { count: totalCount } = await supabase.from("app_dash_principal").select("*", { count: "exact", head: true });
  console.log("📊 Total de registros: " + totalCount);

  // Contar todos os status incluindo NULL
  const { data: allData } = await supabase.from("app_dash_principal").select("status, funil, tag, lead_usuario_responsavel");

  const statusCount = { "NULL/vazio": 0 };
  const funilCount = {};
  const tagCount = {};
  const responsavelCount = {};

  (allData || []).forEach(row => {
    // Status
    if (row.status === null || row.status === "" || row.status === undefined) {
      statusCount["NULL/vazio"]++;
    } else {
      statusCount[row.status] = (statusCount[row.status] || 0) + 1;
    }

    // Funil
    const f = row.funil || "NULL";
    funilCount[f] = (funilCount[f] || 0) + 1;

    // Tag
    const t = row.tag || "NULL";
    tagCount[t] = (tagCount[t] || 0) + 1;

    // Responsável
    const r = row.lead_usuario_responsavel || "NULL";
    responsavelCount[r] = (responsavelCount[r] || 0) + 1;
  });

  console.log("\n📊 STATUS (todas as etapas do funil):");
  Object.entries(statusCount).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
    const pct = ((c / totalCount) * 100).toFixed(1);
    console.log("   " + s.padEnd(30) + ": " + String(c).padStart(6) + " (" + pct + "%)");
  });

  console.log("\n📊 FUNIL:");
  Object.entries(funilCount).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([f, c]) => {
    console.log("   " + f.substring(0,40).padEnd(42) + ": " + c);
  });

  console.log("\n📊 RESPONSÁVEL (top 10):");
  Object.entries(responsavelCount).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([r, c]) => {
    console.log("   " + r.substring(0,30).padEnd(32) + ": " + c);
  });

  console.log("\n📊 TAGS (top 15):");
  Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([t, c]) => {
    console.log("   " + t.substring(0,40).padEnd(42) + ": " + c);
  });

  // ============================================================================
  // 2. LISTAR TODAS AS TABELAS/VIEWS DASH
  // ============================================================================
  console.log("\n═══════════════════════════════════════════════════════════════════");
  console.log("2. TODAS AS TABELAS/VIEWS COM 'DASH' NO NOME");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const dashTables = [
    "app_bdr_dashboard",
    "app_dash_principal",
    "app_dash_resumo",
    "app_dash_backup_1",
    "app_dash_backup_2",
    "app_dash_backup_oct24",
    "dashboard_alertas_cliente",
    "dashboard_alertas_urgentes",
    "dashboard_alerts_breakdown",
    "dashboard_alerts_by_day",
    "dashboard_alerts_recent",
    "dashboard_channels",
    "dashboard_cliente_hoje",
    "dashboard_conversas_por_lead",
    "dashboard_custos_por_lead",
    "dashboard_followup_metrics",
    "dashboard_followup_performance",
    "dashboard_funnel",
    "dashboard_mottivme_geral",
    "dashboard_off_hours",
    "dashboard_overview",
    "dashboard_performance_agentes",
    "dashboard_performance_cliente",
    "dashboard_ranking_clientes"
  ];

  for (const tableName of dashTables) {
    try {
      const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true });
      if (error) {
        console.log("   ❌ " + tableName + ": ERRO - " + error.message);
      } else {
        console.log("   ✅ " + tableName.padEnd(35) + ": " + (count || 0) + " registros");
      }
    } catch (e) {
      console.log("   ❌ " + tableName + ": ERRO");
    }
  }

  // ============================================================================
  // 3. DETALHES DAS PRINCIPAIS VIEWS DE DASHBOARD
  // ============================================================================
  console.log("\n═══════════════════════════════════════════════════════════════════");
  console.log("3. DETALHES DAS PRINCIPAIS VIEWS");
  console.log("═══════════════════════════════════════════════════════════════════");

  // dashboard_funnel
  console.log("\n📊 dashboard_funnel:");
  const { data: funnelData } = await supabase.from("dashboard_funnel").select("*").order("data", { ascending: false }).limit(10);
  if (funnelData && funnelData.length > 0) {
    console.log("   Colunas: " + Object.keys(funnelData[0]).join(", "));
    console.log("   Últimos dias:");
    funnelData.forEach(r => {
      console.log("   " + (r.data || "?").substring(0,10) + ": novos=" + (r.novos_leads || 0) +
        " resp=" + (r.responderam || 0) + " agend=" + (r.agendaram || 0) + " fech=" + (r.fecharam || 0));
    });
  }

  // dashboard_ranking_clientes
  console.log("\n📊 dashboard_ranking_clientes:");
  const { data: rankingData } = await supabase.from("dashboard_ranking_clientes").select("*").limit(10);
  if (rankingData && rankingData.length > 0) {
    console.log("   Colunas: " + Object.keys(rankingData[0]).join(", "));
    rankingData.forEach(r => {
      console.log("   " + (r.agent_name || r.cliente || "?").substring(0,25).padEnd(27) +
        " leads=" + (r.total_leads || 0) + " resp=" + (r.leads_responderam || 0) +
        " conv=" + (r.taxa_conversao || 0) + "%");
    });
  }

  // dashboard_overview
  console.log("\n📊 dashboard_overview:");
  const { data: overviewData } = await supabase.from("dashboard_overview").select("*").limit(5);
  if (overviewData && overviewData.length > 0) {
    console.log("   Colunas: " + Object.keys(overviewData[0]).join(", "));
    overviewData.forEach(r => console.log("   " + JSON.stringify(r)));
  }

  // dashboard_mottivme_geral
  console.log("\n📊 dashboard_mottivme_geral:");
  const { data: geralData } = await supabase.from("dashboard_mottivme_geral").select("*").limit(5);
  if (geralData && geralData.length > 0) {
    console.log("   Colunas: " + Object.keys(geralData[0]).join(", "));
    geralData.forEach(r => console.log("   " + JSON.stringify(r)));
  }

  // ============================================================================
  // 4. FUNIL POR RESPONSÁVEL (CLIENTE)
  // ============================================================================
  console.log("\n═══════════════════════════════════════════════════════════════════");
  console.log("4. FUNIL POR RESPONSÁVEL (SIMULANDO CLIENTE)");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  // Agrupar por lead_usuario_responsavel e contar status
  const byResponsavel = {};
  (allData || []).forEach(row => {
    const r = row.lead_usuario_responsavel || "SEM RESPONSÁVEL";
    if (!byResponsavel[r]) {
      byResponsavel[r] = { total: 0, won: 0, lost: 0, new_lead: 0, booked: 0, outros: 0 };
    }
    byResponsavel[r].total++;
    const s = (row.status || "").toLowerCase();
    if (s === "won") byResponsavel[r].won++;
    else if (s === "lost") byResponsavel[r].lost++;
    else if (s === "new_lead") byResponsavel[r].new_lead++;
    else if (s === "booked") byResponsavel[r].booked++;
    else byResponsavel[r].outros++;
  });

  console.log("Responsável".padEnd(35) + "| Total | Won | Lost | New | Book | Outros");
  console.log("-".repeat(85));
  Object.entries(byResponsavel)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .forEach(([r, d]) => {
      console.log(
        r.substring(0,33).padEnd(35) + "| " +
        String(d.total).padStart(5) + " | " +
        String(d.won).padStart(3) + " | " +
        String(d.lost).padStart(4) + " | " +
        String(d.new_lead).padStart(3) + " | " +
        String(d.booked).padStart(4) + " | " +
        String(d.outros).padStart(6)
      );
    });

  // ============================================================================
  // 5. RESUMO FINAL
  // ============================================================================
  console.log("\n═══════════════════════════════════════════════════════════════════");
  console.log("5. RESUMO FINAL - NÚMEROS REAIS");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  console.log("┌─────────────────────────────────────────────────────────────────┐");
  console.log("│ FONTE DE DADOS REAL: app_dash_principal                         │");
  console.log("├─────────────────────────────────────────────────────────────────┤");
  console.log("│ Total de Leads:        " + String(totalCount).padStart(6) + "                                   │");
  console.log("│ Com status definido:   " + String(totalCount - statusCount["NULL/vazio"]).padStart(6) + "                                   │");
  console.log("│ Status NULL/vazio:     " + String(statusCount["NULL/vazio"]).padStart(6) + "                                   │");
  console.log("│ Won (fechados):        " + String(statusCount["won"] || 0).padStart(6) + "                                   │");
  console.log("│ Lost (perdidos):       " + String(statusCount["lost"] || 0).padStart(6) + "                                   │");
  console.log("│ New Lead:              " + String(statusCount["new_lead"] || 0).padStart(6) + "                                   │");
  console.log("│ Booked:                " + String(statusCount["booked"] || 0).padStart(6) + "                                   │");
  console.log("└─────────────────────────────────────────────────────────────────┘");
}

catalogAll().catch(console.error);
