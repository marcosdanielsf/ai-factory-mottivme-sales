import React from 'react';
import { Plus, Bot } from 'lucide-react';
import { Button, Card, Badge } from '../UI';
import { useData } from '../../App';

export const AgentsView = () => {
  const { agents, loading } = useData();

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Agents</h1>
            <p className="text-slate-500 dark:text-slate-400">Configure your autonomous workforce</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading agents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Agents</h1>
          <p className="text-slate-500 dark:text-slate-400">Configure your autonomous workforce</p>
        </div>
        <Button><Plus size={16}/> New Agent</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent: any) => (
          <Card key={agent.id} className="p-6 border-t-4 border-t-blue-500 hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Bot size={28} />
              </div>
              <Badge color={agent.isActive ? 'green' : 'gray'}>{agent.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{agent.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{agent.type} • {agent.model}</p>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 h-20 overflow-hidden">
              "{agent.description}"
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 text-xs">Edit</Button>
              <Button variant="outline" className="flex-1 text-xs">Test</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AgentsView;
