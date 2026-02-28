import { useState, useCallback } from 'react'
import { AgentEvolutionChart, type DataSource } from '../components/charts/AgentEvolutionChart'
import { TrendingUp, Brain, Zap, Users, Sparkles } from 'lucide-react'

const INFO_CARDS = {
  improver: [
    { icon: Brain, bgClass: 'bg-blue-500/10', iconClass: 'text-blue-500', title: 'Score PNL', description: 'Mede a capacidade do agente de aplicar tecnicas de Programacao Neurolinguistica: Yes Set, Pressuposicoes, VAC e Rapport natural.' },
    { icon: Zap, bgClass: 'bg-emerald-500/10', iconClass: 'text-emerald-500', title: 'Score Neurovendas', description: 'Avalia o uso de gatilhos mentais e tecnicas de persuasao: 3 Cerebros, Escassez, Autoridade e Prova Social.' },
    { icon: Users, bgClass: 'bg-orange-500/10', iconClass: 'text-orange-500', title: 'Score Pessoas', description: 'Analisa habilidades interpessoais do agente: Empatia, Fluidez, Uso do nome e Fechamento efetivo.' },
  ],
  reflection: [
    { icon: Brain, bgClass: 'bg-blue-500/10', iconClass: 'text-blue-500', title: 'Score Completude', description: 'Avalia se o agente cobre todos os pontos necessarios da conversa: qualificacao, objecoes e proximo passo.' },
    { icon: Zap, bgClass: 'bg-emerald-500/10', iconClass: 'text-emerald-500', title: 'Score Profundidade', description: 'Mede a profundidade da analise: perguntas abertas, exploracao de dor e entendimento do contexto.' },
    { icon: Users, bgClass: 'bg-orange-500/10', iconClass: 'text-orange-500', title: 'Score Tom', description: 'Analisa tom e linguagem do agente: naturalidade, adaptacao ao perfil do lead e cordialidade.' },
  ],
}

export function Evolution() {
  const [dataSource, setDataSource] = useState<DataSource>('improver')

  const handleDataSourceChange = useCallback((source: DataSource) => {
    setDataSource(source)
  }, [])

  const cards = INFO_CARDS[dataSource]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-accent-primary/10 rounded-xl">
            <Sparkles className="w-6 h-6 text-accent-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Evolucao do Agente
          </h1>
        </div>
        <p className="text-text-muted mt-2 max-w-xl">
          {dataSource === 'reflection'
            ? 'Evolucao baseada no Reflection Loop. Scores derivados da analise automatica de conversas.'
            : 'Acompanhe a evolucao dos scores do agente SDR ao longo do tempo. O Improver analisa conversas semanalmente e sugere melhorias.'}
        </p>
      </div>

      {/* Evolution Chart */}
      <div className="mb-8">
        <AgentEvolutionChart limit={50} onDataSourceChange={handleDataSourceChange} />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-bg-secondary border border-border-default rounded-xl p-6 hover:border-border-hover transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 ${card.bgClass} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${card.iconClass}`} />
                </div>
                <h3 className="text-text-primary font-semibold">{card.title}</h3>
              </div>
              <p className="text-text-muted text-sm">{card.description}</p>
            </div>
          )
        })}
      </div>

      {/* How it works */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
        <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-primary" />
          Como funciona o Improver
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              1
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">Simular</p>
              <p className="text-text-muted">3 perfis de lead sao simulados</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              2
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">Avaliar ANTES</p>
              <p className="text-text-muted">Especialistas dao nota 0-100</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              3
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">Gerar Patches</p>
              <p className="text-text-muted">Melhorias cirurgicas no prompt</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              4
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">Avaliar DEPOIS</p>
              <p className="text-text-muted">Re-simular e comparar scores</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              5
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">Aprovar</p>
              <p className="text-text-muted">Voce aprova via WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Evolution
