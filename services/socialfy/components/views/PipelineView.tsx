import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button, Card, ChannelBadge } from '../UI';
import { useData } from '../../App';

export const PipelineView = () => {
  const { pipeline, loading } = useData();
  const stages = ['New', 'Relationship', 'Scheduled', 'Won'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-500 dark:text-slate-400">Loading pipeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pipeline</h1>
          <p className="text-slate-500 dark:text-slate-400">Track your opportunities</p>
        </div>
        <Button><Plus size={16}/> Add Deal</Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {stages.map(stage => {
            const cards = pipeline.filter((c: any) => c.stage === stage);
            return (
              <div key={stage} className="w-80 bg-slate-100 rounded-xl flex flex-col max-h-full">
                <div className="p-4 font-bold text-slate-700 flex justify-between items-center sticky top-0 bg-slate-100 rounded-t-xl z-10">
                  <span>{stage}</span>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{cards.length}</span>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {cards.map(card => (
                    <Card key={card.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                         <span className="font-bold text-slate-800">{card.leadName}</span>
                         <span className="text-xs font-semibold text-emerald-600">R$ {card.value.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-slate-500 mb-3">{card.title} @ {card.company}</div>
                      <div className="flex items-center gap-1 mb-3">
                        {card.channels.map(c => <ChannelBadge key={c} channel={c} size="sm" />)}
                      </div>
                      <div className="pt-3 border-t border-slate-100 text-xs flex justify-between items-center text-slate-500 dark:text-slate-400">
                         <span>{card.cadenceStatus}</span>
                         <span className="bg-white px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{card.nextActivity}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PipelineView;
