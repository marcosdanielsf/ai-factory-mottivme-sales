import React, { useState, useCallback } from 'react';
import { Wand2, ArrowRight, ArrowLeft, Loader2, Copy, Check, X, Bot, Building2, MessageCircle, Shield, Eye } from 'lucide-react';

interface PromptGeneratorProps {
  onGenerated: (prompt: string) => void;
  onClose: () => void;
  existingContext?: {
    agentName?: string;
    businessConfig?: Record<string, any>;
    complianceRules?: Record<string, any>;
  };
}

interface WizardData {
  agentType: string;
  businessContext: string;
  tone: string;
  complianceLevel: string;
  extras: string;
}

const AGENT_TYPES = [
  { id: 'sdr_inbound', label: 'SDR Inbound', desc: 'Qualifica leads que chegam por WhatsApp/Instagram' },
  { id: 'social_seller', label: 'Social Seller', desc: 'Prospecta e engaja leads em redes sociais' },
  { id: 'followuper', label: 'Follow Up', desc: 'Reengaja leads que pararam de responder' },
  { id: 'scheduler', label: 'Agendador', desc: 'Agenda reunioes e consultas' },
  { id: 'reativador', label: 'Reativador', desc: 'Reativa leads frios (30+ dias sem contato)' },
  { id: 'customer_success', label: 'Customer Success', desc: 'Acompanha clientes pos-venda' },
  { id: 'concierge', label: 'Concierge', desc: 'Atende leads ja qualificados, suporte premium' },
  { id: 'custom', label: 'Personalizado', desc: 'Defina o tipo manualmente' },
];

const TONE_OPTIONS = [
  { id: 'professional', label: 'Profissional', desc: 'Formal, objetivo, corporativo' },
  { id: 'friendly', label: 'Amigavel', desc: 'Caloroso, acessivel, empatetico' },
  { id: 'consultive', label: 'Consultivo', desc: 'Especialista, educativo, confiavel' },
  { id: 'casual', label: 'Casual', desc: 'Descontraido, jovem, direto' },
];

const COMPLIANCE_LEVELS = [
  { id: 'strict', label: 'Estrito', desc: 'Saude, financeiro, juridico — maximo cuidado' },
  { id: 'moderate', label: 'Moderado', desc: 'Comercio, servicos — equilibrado' },
  { id: 'light', label: 'Leve', desc: 'Varejo, entretenimento — mais flexivel' },
];

const STEPS = ['Tipo de Agente', 'Contexto do Negocio', 'Tom e Personalidade', 'Compliance', 'Preview e Gerar'];

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ onGenerated, onClose, existingContext }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    agentType: existingContext?.businessConfig?.vertical ? 'custom' : 'sdr_inbound',
    businessContext: existingContext?.agentName
      ? `Empresa: ${existingContext.businessConfig?.empresa || ''}\nVertical: ${existingContext.businessConfig?.vertical || ''}\nServicos: `
      : '',
    tone: 'friendly',
    complianceLevel: 'moderate',
    extras: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0: return !!data.agentType;
      case 1: return data.businessContext.trim().length >= 20;
      case 2: return !!data.tone;
      case 3: return !!data.complianceLevel;
      case 4: return true;
      default: return false;
    }
  }, [step, data]);

  const generatePrompt = useCallback(async () => {
    setGenerating(true);
    try {
      const agentTypeLabel = AGENT_TYPES.find(t => t.id === data.agentType)?.label || data.agentType;
      const toneLabel = TONE_OPTIONS.find(t => t.id === data.tone)?.label || data.tone;
      const complianceLabel = COMPLIANCE_LEVELS.find(c => c.id === data.complianceLevel)?.label || data.complianceLevel;

      const metaPrompt = `Voce e um especialista em criar system prompts para agentes de IA conversacionais de vendas via WhatsApp.

Gere um system prompt completo e profissional em portugues brasileiro para um agente com as seguintes caracteristicas:

TIPO: ${agentTypeLabel}
CONTEXTO DO NEGOCIO: ${data.businessContext}
TOM: ${toneLabel}
NIVEL DE COMPLIANCE: ${complianceLabel}
${data.extras ? `INSTRUCOES EXTRAS: ${data.extras}` : ''}

O prompt DEVE seguir esta estrutura:
1. Header com nome e versao (# NOME v1.0.0 - CONTEXTO)
2. Identidade (quem voce e, o que faz)
3. Fluxo de atendimento (fases numeradas)
4. Regras criticas (proibicoes, obrigacoes)
5. Ferramenta de escala (como transferir para humano)
6. Limites de mensagem (max caracteres, max perguntas por turno)

Regras do prompt:
- Maximo 2000 caracteres
- Linguagem natural, como se falasse com o agente
- Incluir regra anti-loop (max 3 msgs sem resposta)
- Incluir regra de escala para humano
- NAO usar markdown no conteudo das mensagens do agente
- 1 emoji max por mensagem
- 1 pergunta por turno
- Max 3 linhas por mensagem

Retorne APENAS o system prompt, sem explicacoes ou comentarios.`;

      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        setGeneratedPrompt('// Erro: VITE_GROQ_API_KEY nao configurada.\n// Configure no .env para usar o gerador de prompts.\n\n' + getFallbackPrompt(data));
        return;
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: metaPrompt }],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq API error: ${res.status} - ${err}`);
      }

      const result = await res.json();
      const prompt = result.choices?.[0]?.message?.content || '';
      setGeneratedPrompt(prompt);
    } catch (err: any) {
      console.error('[PromptGenerator]', err);
      setGeneratedPrompt(`// Erro ao gerar: ${err.message}\n\n${getFallbackPrompt(data)}`);
    } finally {
      setGenerating(false);
    }
  }, [data]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedPrompt]);

  const handleUse = useCallback(() => {
    onGenerated(generatedPrompt);
    onClose();
  }, [generatedPrompt, onGenerated, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <Wand2 size={18} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Gerar Prompt com IA</h2>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-zinc-800">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => i < step && setStep(i)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  i === step ? 'bg-violet-500/20 text-violet-400 font-medium' :
                  i < step ? 'text-zinc-400 hover:text-white cursor-pointer' :
                  'text-zinc-600 cursor-default'
                }`}
              >
                {i + 1}. {s}
              </button>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-zinc-700" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400 mb-4">Que tipo de agente voce quer criar?</p>
              <div className="grid grid-cols-2 gap-2">
                {AGENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setData(d => ({ ...d, agentType: type.id }))}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      data.agentType === type.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                    }`}
                  >
                    <div className={`text-sm font-medium ${data.agentType === type.id ? 'text-violet-400' : 'text-white'}`}>
                      {type.label}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400 mb-1">Descreva o negocio e contexto do agente:</p>
              <p className="text-xs text-zinc-600 mb-3">Inclua: nome da empresa, servicos oferecidos, publico-alvo, diferenciais, regiao de atuacao.</p>
              <textarea
                value={data.businessContext}
                onChange={e => setData(d => ({ ...d, businessContext: e.target.value }))}
                placeholder="Ex: Clinica de estetica em Sao Paulo, atende mulheres 25-55 anos. Servicos: harmonizacao facial, botox, preenchimento. Diferencial: 15 anos de experiencia, Dra. com CREMESP ativo..."
                className="w-full h-48 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-none"
              />
              <div className="text-xs text-zinc-600 text-right">
                {data.businessContext.length} caracteres {data.businessContext.length < 20 && '(minimo 20)'}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400 mb-4">Como o agente deve se comunicar?</p>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map(tone => (
                  <button
                    key={tone.id}
                    onClick={() => setData(d => ({ ...d, tone: tone.id }))}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      data.tone === tone.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                    }`}
                  >
                    <div className={`text-sm font-medium ${data.tone === tone.id ? 'text-violet-400' : 'text-white'}`}>
                      {tone.label}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{tone.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400 mb-4">Nivel de compliance e restricoes:</p>
              <div className="space-y-2">
                {COMPLIANCE_LEVELS.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setData(d => ({ ...d, complianceLevel: level.id }))}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      data.complianceLevel === level.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                    }`}
                  >
                    <div className={`text-sm font-medium ${data.complianceLevel === level.id ? 'text-violet-400' : 'text-white'}`}>
                      {level.label}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{level.desc}</div>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Instrucoes extras (opcional):</label>
                <textarea
                  value={data.extras}
                  onChange={e => setData(d => ({ ...d, extras: e.target.value }))}
                  placeholder="Ex: Nunca mencionar concorrentes, sempre oferecer avaliacao gratuita..."
                  className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {!generatedPrompt && !generating && (
                <div className="text-center py-8">
                  <Wand2 size={40} className="mx-auto text-violet-400 mb-4" />
                  <p className="text-sm text-zinc-400 mb-2">Tudo pronto para gerar seu prompt!</p>
                  <p className="text-xs text-zinc-600 mb-6">
                    Tipo: {AGENT_TYPES.find(t => t.id === data.agentType)?.label} |
                    Tom: {TONE_OPTIONS.find(t => t.id === data.tone)?.label} |
                    Compliance: {COMPLIANCE_LEVELS.find(c => c.id === data.complianceLevel)?.label}
                  </p>
                  <button
                    onClick={generatePrompt}
                    className="px-6 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-500 transition-colors"
                  >
                    Gerar Prompt
                  </button>
                </div>
              )}

              {generating && (
                <div className="text-center py-12">
                  <Loader2 size={32} className="mx-auto text-violet-400 animate-spin mb-4" />
                  <p className="text-sm text-zinc-400">Gerando prompt com IA...</p>
                </div>
              )}

              {generatedPrompt && !generating && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500">Prompt gerado:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={generatePrompt}
                        className="text-xs text-zinc-500 hover:text-violet-400 px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors"
                      >
                        Regenerar
                      </button>
                      <button
                        onClick={handleCopy}
                        className="text-xs text-zinc-500 hover:text-white px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors flex items-center gap-1"
                      >
                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {copied ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                  <pre className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-xs text-zinc-300 max-h-[400px] overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {generatedPrompt}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-700">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className={`flex items-center gap-1 text-sm px-4 py-1.5 rounded-lg transition-colors ${
                canAdvance()
                  ? 'bg-violet-600 text-white hover:bg-violet-500'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              Proximo <ArrowRight size={14} />
            </button>
          ) : generatedPrompt ? (
            <button
              onClick={handleUse}
              className="flex items-center gap-1 text-sm px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
            >
              Usar este Prompt
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

function getFallbackPrompt(data: WizardData): string {
  const type = AGENT_TYPES.find(t => t.id === data.agentType)?.label || 'Agente';
  return `# ${type} v1.0.0 - Gerado pelo Prompt Generator

## Identidade
Voce e um assistente virtual especializado em atendimento via WhatsApp.

## Contexto
${data.businessContext}

## Fluxo de Atendimento
1. Acolhimento - Saudacao e identificacao da necessidade
2. Discovery - Entender o que o lead precisa (1 pergunta por turno)
3. Qualificacao - Verificar fit (orcamento, timeline, decisor)
4. Apresentacao - Mostrar opcoes relevantes
5. Agendamento - Trial close e escala para humano

## Regras Criticas
- Max 3 linhas por mensagem
- 1 pergunta por turno
- 1 emoji max por mensagem
- NUNCA inventar informacoes
- NUNCA usar markdown
- Escalar para humano quando: lead pede, voce nao sabe, 3+ msgs sem resposta

## Compliance
- Nivel: ${data.complianceLevel}
${data.extras ? `- Extras: ${data.extras}` : ''}
`;
}

export default PromptGenerator;
