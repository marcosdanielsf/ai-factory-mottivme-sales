import React, { useState } from 'react';
import { Plus, Loader2, X, Users, Play, Calendar, Target, TrendingUp, Percent } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Button, Card, Badge, ChannelBadge } from '../UI';
import { useData } from '../../App';
import { UILead, UIPipelineCard } from '../../hooks/useSupabaseData';

// Modal component for showing details
interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, icon, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {icon}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Lead list item component
const LeadListItem: React.FC<{ lead: UILead }> = ({ lead }) => (
  <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
    <img
      src={lead.avatar}
      alt={lead.name}
      className="w-10 h-10 rounded-full object-cover"
    />
    <div className="flex-1 min-w-0">
      <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{lead.name}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
        {lead.title} {lead.company && `@ ${lead.company}`}
      </div>
    </div>
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        {lead.channels.slice(0, 3).map((c) => (
          <ChannelBadge key={c} channel={c} size="sm" />
        ))}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        lead.status === 'Responding' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
        lead.status === 'In Cadence' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
        lead.status === 'Scheduled' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
        lead.status === 'Converted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
      }`}>
        {lead.status}
      </span>
    </div>
    <div className="text-right">
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{lead.icpScore}</div>
      <div className="text-xs text-slate-400">ICP</div>
    </div>
  </div>
);

// Pipeline deal list item component
const DealListItem: React.FC<{ deal: UIPipelineCard }> = ({ deal }) => (
  <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
      {deal.leadName.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{deal.leadName}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
        {deal.title} {deal.company && `@ ${deal.company}`}
      </div>
    </div>
    <div className="flex flex-col items-end gap-1">
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        deal.stage === 'Scheduled' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
        deal.stage === 'Won' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
        deal.stage === 'Proposal' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
      }`}>
        {deal.stage}
      </span>
      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        R$ {deal.value.toLocaleString('pt-BR')}
      </span>
    </div>
  </div>
);

export const DashboardView = () => {
  const { metrics, campaigns, leads, pipeline, loading } = useData();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const channelData = [
    { name: 'LinkedIn', value: 85, color: '#0A66C2' },
    { name: 'WhatsApp', value: 72, color: '#25D366' },
    { name: 'Instagram', value: 52, color: '#E1306C' },
    { name: 'Email', value: 32, color: '#6B7280' },
    { name: 'Phone', value: 24, color: '#3B82F6' },
  ];

  // Filter functions for each metric
  const getLeadsInCadence = () => leads.filter(l => l.status === 'In Cadence');
  const getScheduledMeetings = () => pipeline.filter(p => p.stage === 'Scheduled');
  const getRespondingLeads = () => leads.filter(l => l.status === 'Responding');
  const getConvertedLeads = () => leads.filter(l => l.status === 'Converted');

  // Metric card config with icons and click handlers
  const metricConfig: Record<string, { icon: React.ReactNode; modalTitle: string; getData: () => any[] }> = {
    'Total Leads': {
      icon: <Users size={20} />,
      modalTitle: 'Todos os Leads',
      getData: () => leads,
    },
    'Active Cadences': {
      icon: <Play size={20} />,
      modalTitle: 'Leads em Cadência',
      getData: getLeadsInCadence,
    },
    'Meetings': {
      icon: <Calendar size={20} />,
      modalTitle: 'Reuniões Agendadas',
      getData: getScheduledMeetings,
    },
    'Show-Rate': {
      icon: <Target size={20} />,
      modalTitle: 'Performance de Show-Rate',
      getData: getScheduledMeetings,
    },
    'Response Rate': {
      icon: <TrendingUp size={20} />,
      modalTitle: 'Leads Respondendo',
      getData: getRespondingLeads,
    },
    'Conversion Rate': {
      icon: <Percent size={20} />,
      modalTitle: 'Leads Convertidos',
      getData: getConvertedLeads,
    },
  };

  const handleMetricClick = (metricLabel: string) => {
    if (metricConfig[metricLabel]) {
      setActiveModal(metricLabel);
    }
  };

  const renderModalContent = () => {
    if (!activeModal || !metricConfig[activeModal]) return null;

    const config = metricConfig[activeModal];
    const data = config.getData();

    if (data.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            {config.icon}
          </div>
          <p className="text-slate-500 dark:text-slate-400">Nenhum dado encontrado</p>
        </div>
      );
    }

    // Check if it's pipeline data (has 'stage' property) or lead data
    const isPipelineData = data[0] && 'stage' in data[0];

    return (
      <div className="space-y-2">
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {data.length} {data.length === 1 ? 'item' : 'itens'} encontrados
        </div>
        {isPipelineData
          ? data.map((deal: UIPipelineCard) => <DealListItem key={deal.id} deal={deal} />)
          : data.map((lead: UILead) => <LeadListItem key={lead.id} lead={lead} />)
        }
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-500 dark:text-slate-400">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Overview of your sales performance</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="text-xs md:text-sm flex-1 sm:flex-none">Last 30 Days</Button>
          <Button className="text-xs md:text-sm flex-1 sm:flex-none"><Plus size={16} /> <span className="hidden sm:inline">New</span> Campaign</Button>
        </div>
      </div>

      {/* Metrics Cards - Now Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {metrics.map((metric, idx) => {
          const config = metricConfig[metric.label];
          const isClickable = !!config;

          return (
            <Card
              key={idx}
              className={`p-3 md:p-4 flex flex-col justify-between h-24 md:h-32 ${
                isClickable ? 'cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:scale-[1.02]' : ''
              }`}
              onClick={() => isClickable && handleMetricClick(metric.label)}
            >
              <div className="flex justify-between items-start gap-1">
                <div className="flex items-center gap-2">
                  {config && (
                    <span className="text-blue-500 dark:text-blue-400 hidden md:block">
                      {config.icon}
                    </span>
                  )}
                  <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{metric.label}</span>
                </div>
                <span className={`text-[10px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap ${metric.trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                  {metric.change}
                </span>
              </div>
              <div>
                <h3 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</h3>
                <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                  {metric.description}
                  {isClickable && <span className="text-blue-500 ml-1">→ Ver detalhes</span>}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Channel Performance Chart */}
        <Card className="lg:col-span-2 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 md:mb-6">
            <h3 className="font-semibold text-sm md:text-base text-slate-900 dark:text-slate-100">Channel Performance</h3>
            <Badge color="gray">Last 30 Days</Badge>
          </div>
          <div className="h-[200px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={channelData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cadence Funnel */}
        <Card className="p-4 md:p-6">
          <h3 className="font-semibold text-sm md:text-base text-slate-900 dark:text-slate-100 mb-4 md:mb-6">Cadence Funnel</h3>
          <div className="space-y-4 relative">
             <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-700"></div>
             {[
               { label: 'Started', value: '1,247', percent: '100%' },
               { label: 'Day 1-3', value: '892', percent: '71%' },
               { label: 'Day 4-7', value: '456', percent: '36%' },
               { label: 'Responded', value: '187', percent: '15%' },
               { label: 'Meeting', value: '45', percent: '3.6%' },
               { label: 'Won', value: '12', percent: '1%' },
             ].map((step, i) => (
               <div key={i} className="relative pl-8 flex items-center justify-between group">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-800 absolute left-0 top-1.5 shadow-sm z-10"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{step.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{step.percent} conversion</p>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded">{step.value}</span>
               </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Active Campaigns Table */}
      <Card className="overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-sm md:text-base text-slate-900 dark:text-slate-100">Active Campaigns</h3>
          <Button variant="ghost" className="text-xs md:text-sm text-blue-600 dark:text-blue-400">View All</Button>
        </div>

        {/* Mobile: Card view */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
          {campaigns.slice(0, 4).map((campaign) => (
            <div key={campaign.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100 text-sm">{campaign.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{campaign.owner}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${campaign.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{campaign.status}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {campaign.channels.map((c: string) => <ChannelBadge key={c} channel={c} size="sm" />)}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Leads: <span className="font-medium text-slate-700 dark:text-slate-300">{campaign.leads}</span></span>
                <span className="text-slate-500 dark:text-slate-400">Responses: <span className="font-medium text-slate-700 dark:text-slate-300">{campaign.responses}</span></span>
                <span className="text-slate-500 dark:text-slate-400">Conv: <span className="font-medium text-emerald-600 dark:text-emerald-400">{campaign.conversionRate}%</span></span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-3">Campaign</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Channels</th>
                <th className="px-6 py-3">Leads</th>
                <th className="px-6 py-3">Responses</th>
                <th className="px-6 py-3">Conv.</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{campaign.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{campaign.owner}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{campaign.type}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {campaign.channels.map((c: string) => <ChannelBadge key={c} channel={c} size="sm" />)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{campaign.leads}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{campaign.responses}</td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{campaign.conversionRate}%</span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${campaign.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                       {campaign.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      {activeModal && metricConfig[activeModal] && (
        <DetailModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={metricConfig[activeModal].modalTitle}
          icon={metricConfig[activeModal].icon}
        >
          {renderModalContent()}
        </DetailModal>
      )}
    </div>
  );
};

export default DashboardView;
