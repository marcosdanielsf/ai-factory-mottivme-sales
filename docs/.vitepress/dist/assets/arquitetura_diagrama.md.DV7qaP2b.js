import{_ as n,c as s,o as t,ag as e}from"./chunks/framework.dvv-DFtf.js";const h=JSON.parse('{"title":"Diagrama de Fluxos","description":"","frontmatter":{},"headers":[],"relativePath":"arquitetura/diagrama.md","filePath":"arquitetura/diagrama.md"}'),p={name:"arquitetura/diagrama.md"};function l(d,a,i,o,r,c){return t(),s("div",null,[...a[0]||(a[0]=[e(`<h1 id="diagrama-de-fluxos" tabindex="-1">Diagrama de Fluxos <a class="header-anchor" href="#diagrama-de-fluxos" aria-label="Permalink to &quot;Diagrama de Fluxos&quot;">​</a></h1><h2 id="fluxo-principal" tabindex="-1">Fluxo Principal <a class="header-anchor" href="#fluxo-principal" aria-label="Permalink to &quot;Fluxo Principal&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Call Google Meet/Zoom</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>01-Organizador-Calls (classifica e move)</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>03-Call-Analyzer-Onboarding (cria agente com validacao)</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>04-Agent-Factory (provisiona no GHL)</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>05-Execution-Modular (roda em producao)</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>08-QA-Analyst (monitora qualidade)</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>09-Reflection-Loop -&gt; 11-Prompt-Updater (auto-melhora)</span></span></code></pre></div><h2 id="fluxo-self-improving" tabindex="-1">Fluxo Self-Improving <a class="header-anchor" href="#fluxo-self-improving" aria-label="Permalink to &quot;Fluxo Self-Improving&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Conversa Finalizada</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>08-QA-Analyst (avalia conversas)</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       +--&gt; Score &lt; 6.0? --&gt; Alerta</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>09-Reflection-Loop (identifica padroes)</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>10-AI-as-Judge (pontua precisao)</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>11-Prompt-Updater (gera novo prompt)</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>13-Feedback-Loop (aplica em producao)</span></span></code></pre></div><h2 id="fluxo-multi-tenant" tabindex="-1">Fluxo Multi-Tenant <a class="header-anchor" href="#fluxo-multi-tenant" aria-label="Permalink to &quot;Fluxo Multi-Tenant&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>Mensagem WhatsApp</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       v</span></span>
<span class="line"><span>12-Multi-Tenant-Classifier</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       +--&gt; Cliente A --&gt; Agente A</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       +--&gt; Cliente B --&gt; Agente B</span></span>
<span class="line"><span>       |</span></span>
<span class="line"><span>       +--&gt; Cliente C --&gt; Agente C</span></span></code></pre></div><h2 id="detalhes-por-workflow" tabindex="-1">Detalhes por Workflow <a class="header-anchor" href="#detalhes-por-workflow" aria-label="Permalink to &quot;Detalhes por Workflow&quot;">​</a></h2><table tabindex="0"><thead><tr><th>#</th><th>Workflow</th><th>Trigger</th><th>Output</th></tr></thead><tbody><tr><td>01</td><td>Organizador Calls</td><td>Webhook GDrive</td><td>Pasta organizada</td></tr><tr><td>02</td><td>Head de Vendas</td><td>Schedule</td><td>Analise semanal</td></tr><tr><td>03</td><td>Call Analyzer</td><td>01 finalizado</td><td>Agente criado</td></tr><tr><td>04</td><td>Agent Factory</td><td>03 finalizado</td><td>Agente no GHL</td></tr><tr><td>05</td><td>Execution</td><td>Webhook GHL</td><td>Resposta enviada</td></tr><tr><td>06</td><td>Call Revisao</td><td>Schedule</td><td>Agentes revisados</td></tr><tr><td>07</td><td>Engenheiro</td><td>Manual</td><td>Prompt otimizado</td></tr><tr><td>08</td><td>QA Analyst</td><td>Schedule</td><td>Score calculado</td></tr><tr><td>09</td><td>Reflection</td><td>08 finalizado</td><td>Padroes identificados</td></tr><tr><td>10</td><td>AI Judge</td><td>09 finalizado</td><td>Score de precisao</td></tr><tr><td>11</td><td>Prompt Updater</td><td>10 finalizado</td><td>Novo prompt</td></tr><tr><td>12</td><td>Classifier</td><td>Webhook</td><td>Cliente identificado</td></tr><tr><td>13</td><td>Feedback Loop</td><td>11 finalizado</td><td>Prompt aplicado</td></tr></tbody></table>`,9)])])}const g=n(p,[["render",l]]);export{h as __pageData,g as default};
