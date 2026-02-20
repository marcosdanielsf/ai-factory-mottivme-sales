import React, { useState, useEffect } from 'react';
import { Settings, ChevronDown, ChevronRight, Save, Download } from 'lucide-react';
import { useJarvisBrainConfig } from '../../hooks/useJarvisBrainConfig';
import { supabase } from '../../lib/supabase';

const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Claude 4.5 Haiku (rápido, barato)' },
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (balanceado)' },
  { value: 'claude-opus-4-6', label: 'Claude Opus 4.6 (mais capaz)' },
];

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-sm font-medium text-zinc-200">{title}</span>
        {open ? <ChevronDown size={15} className="text-zinc-500" /> : <ChevronRight size={15} className="text-zinc-500" />}
      </button>
      {open && <div className="px-5 pb-5 flex flex-col gap-4 border-t border-zinc-800 pt-4">{children}</div>}
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-zinc-400">{label}</label>
        <span className="text-xs text-cyan-400 font-mono">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-500"
      />
      <div className="flex justify-between text-xs text-zinc-600 mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400 mb-1.5 block">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
      />
    </div>
  );
}

export default function JarvisConfig() {
  const { config, loading, updateConfig, ensureConfig } = useJarvisBrainConfig();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Form state
  const [keywordConf, setKeywordConf] = useState(0.7);
  const [semanticConf, setSemanticConf] = useState(0.8);
  const [maxDocs, setMaxDocs] = useState(5);
  const [maxConversations, setMaxConversations] = useState(10);
  const [maxMemories, setMaxMemories] = useState(10);
  const [defaultModel, setDefaultModel] = useState('claude-3-5-haiku-20241022');
  const [rateLimit, setRateLimit] = useState(20);
  const [maxResponseLength, setMaxResponseLength] = useState(2048);
  const [confirmDestructive, setConfirmDestructive] = useState(true);

  useEffect(() => {
    ensureConfig();
  }, [ensureConfig]);

  useEffect(() => {
    if (config) {
      setKeywordConf(config.keyword_confidence);
      setSemanticConf(config.semantic_confidence);
      setMaxDocs(config.max_docs_context);
      setMaxConversations(config.max_conversations_context);
      setMaxMemories(config.max_memories_context);
      setDefaultModel(config.default_model);
      setRateLimit(config.rate_limit_per_minute);
      setMaxResponseLength(config.max_response_length);
      setConfirmDestructive(config.confirm_destructive);
    }
  }, [config]);

  async function handleSave() {
    setSaving(true);
    await updateConfig({
      keyword_confidence: keywordConf,
      semantic_confidence: semanticConf,
      max_docs_context: maxDocs,
      max_conversations_context: maxConversations,
      max_memories_context: maxMemories,
      default_model: defaultModel,
      rate_limit_per_minute: rateLimit,
      max_response_length: maxResponseLength,
      confirm_destructive: confirmDestructive,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [convRes, memRes] = await Promise.all([
        supabase.from('jarvis_conversations').select('*, jarvis_messages(*)').eq('user_id', user.id),
        supabase.from('jarvis_memory').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        conversations: convRes.data ?? [],
        memories: memRes.data ?? [],
        config,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-600 flex items-center justify-center">
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <Settings size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Configuração JARVIS</h1>
            <p className="text-sm text-zinc-500">Brain Router e parâmetros de comportamento</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
          } disabled:opacity-50`}
        >
          <Save size={14} />
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar tudo'}
        </button>
      </div>

      <div className="max-w-2xl flex flex-col gap-4">
        {/* Brain Router */}
        <Accordion title="Brain Router" defaultOpen>
          <SliderField
            label="Confiança por keyword"
            value={keywordConf}
            onChange={setKeywordConf}
            format={v => `${Math.round(v * 100)}%`}
          />
          <SliderField
            label="Confiança semântica"
            value={semanticConf}
            onChange={setSemanticConf}
            format={v => `${Math.round(v * 100)}%`}
          />
          <NumberField
            label="Max docs no contexto"
            value={maxDocs}
            onChange={setMaxDocs}
            min={1}
            max={20}
          />
          <NumberField
            label="Max conversas no contexto"
            value={maxConversations}
            onChange={setMaxConversations}
            min={1}
            max={50}
          />
          <NumberField
            label="Max memórias no contexto"
            value={maxMemories}
            onChange={setMaxMemories}
            min={1}
            max={50}
          />
        </Accordion>

        {/* Modelo Padrão */}
        <Accordion title="Modelo Padrão">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Modelo de linguagem</label>
            <select
              value={defaultModel}
              onChange={e => setDefaultModel(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <p className="text-xs text-zinc-600 mt-2">
              Projetos com model_override ignoram este valor.
            </p>
          </div>
        </Accordion>

        {/* Segurança */}
        <Accordion title="Segurança">
          <NumberField
            label="Rate limit (requisições/min)"
            value={rateLimit}
            onChange={setRateLimit}
            min={1}
            max={60}
          />
          <NumberField
            label="Tamanho máximo de resposta (tokens)"
            value={maxResponseLength}
            onChange={setMaxResponseLength}
            min={256}
            max={8192}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfirmDestructive(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors shrink-0 ${confirmDestructive ? 'bg-cyan-500' : 'bg-zinc-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white mx-0.5 transition-transform ${confirmDestructive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <div>
              <p className="text-sm text-zinc-300">Confirmar ações destrutivas</p>
              <p className="text-xs text-zinc-600">Pede confirmação antes de deletar ou modificar dados</p>
            </div>
          </div>
        </Accordion>

        {/* Dados */}
        <Accordion title="Dados">
          <div>
            <p className="text-sm text-zinc-400 mb-4">
              Exporta todas as conversas, memórias e configurações em formato JSON.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {exporting ? 'Exportando...' : 'Exportar dados (JSON)'}
            </button>
          </div>
        </Accordion>
      </div>
    </div>
  );
}
