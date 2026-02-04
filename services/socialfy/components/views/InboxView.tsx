import React from 'react';
import { Search, MoreHorizontal, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Button, Input, ChannelBadge } from '../UI';
import { useData } from '../../App';

export const InboxView = () => {
  const { leads, loading } = useData();

  if (loading) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center animate-in fade-in duration-500 bg-white rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex animate-in fade-in duration-500 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 mb-4">Unified Inbox</h2>
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
             <Input placeholder="Search messages..." className="pl-9 h-9 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leads.slice(0, 5).map((lead: any, i: number) => (
             <div key={lead.id} className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${i === 0 ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''}`}>
                <div className="flex justify-between items-start mb-1">
                   <span className="font-semibold text-slate-900 text-sm">{lead.name}</span>
                   <span className="text-xs text-slate-400 dark:text-slate-500">10:42 AM</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                   <ChannelBadge channel={lead.channels[0]} size="sm" />
                   <span className="text-xs text-slate-500 truncate">RE: Project collaboration proposal</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                   Hi Marcos, thanks for reaching out. I'd be interested in hearing more about your services...
                </p>
             </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">JS</div>
              <div>
                 <h3 className="font-bold text-slate-900 dark:text-white">Joao Silva</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400">CEO @ TechCorp • 3 active deals</p>
              </div>
           </div>
           <div className="flex gap-2">
              <Button variant="outline" className="h-8 text-xs">View Lead</Button>
              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal size={16}/></Button>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
           <div className="flex justify-center">
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Today</span>
           </div>

           <div className="flex justify-end">
              <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-md text-sm shadow-sm">
                 <p>Hi Joao, saw your recent post about expansion into the BR market. We help companies scale their sales teams efficiently. Would you be open to a quick chat?</p>
                 <div className="flex justify-end items-center gap-1 mt-1 opacity-70 text-[10px]">
                    <span>10:30 AM</span>
                    <CheckCircle2 size={10} />
                 </div>
              </div>
           </div>

           <div className="flex justify-start">
              <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md text-sm shadow-sm">
                 <p>Hi Marcos, thanks for reaching out. I'd be interested in hearing more about your services. Do you have any case studies?</p>
                 <div className="flex justify-end mt-1 text-slate-400 text-[10px]">
                    <span>10:42 AM</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200 dark:border-slate-700">
           <div className="flex gap-2 mb-2">
              <button className="text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors">Generate Reply (AI)</button>
              <button className="text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors">Schedule Meeting</button>
           </div>
           <div className="flex gap-2">
              <Input placeholder="Type a message..." className="flex-1" />
              <Button className="w-12 h-10 p-0 flex items-center justify-center"><ArrowUpRight size={18} /></Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InboxView;
