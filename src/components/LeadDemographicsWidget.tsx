import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { MapPin, Shield, Loader2 } from 'lucide-react';
import { useLeadDemographics } from '../hooks/useLeadDemographics';

interface LeadDemographicsWidgetProps {
  locationId?: string;
}

const WORK_PERMIT_COLORS: Record<string, string> = {
  'Sim': '#10B981',      // Green
  'Não': '#EF4444',      // Red
  'Não informado': '#6B7280', // Gray
  'Outro': '#F59E0B'     // Amber
};

const STATE_COLORS = [
  '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#FB7185', '#FDA4AF', '#FECDD3', '#FEE2E2'
];

export const LeadDemographicsWidget: React.FC<LeadDemographicsWidgetProps> = ({ locationId }) => {
  const { demographics, loading, error } = useLeadDemographics(locationId);

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
        </div>
      </div>
    );
  }

  if (error || !demographics) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
        <p className="text-text-muted text-sm text-center py-8">
          {error || 'Sem dados demográficos disponíveis'}
        </p>
      </div>
    );
  }

  const workPermitData = demographics.work_permit.filter(wp => wp.status !== 'Não informado' || wp.total > 0);
  const statesData = demographics.states.filter(s => s.state !== 'Não informado');

  const totalWorkPermit = workPermitData.reduce((sum, wp) => sum + wp.total, 0);
  const totalWithPermit = workPermitData.find(wp => wp.status === 'Sim')?.total || 0;
  const percentWithPermit = totalWorkPermit > 0 ? Math.round((totalWithPermit / totalWorkPermit) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Work Permit Card */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-accent-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Work Permit</h3>
        </div>

        {workPermitData.length > 0 ? (
          <div className="flex items-center gap-6">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workPermitData}
                    dataKey="total"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    paddingAngle={2}
                  >
                    {workPermitData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={WORK_PERMIT_COLORS[entry.status] || '#6B7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value} leads`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-2">
              {workPermitData.map((wp, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: WORK_PERMIT_COLORS[wp.status] || '#6B7280' }}
                    />
                    <span className="text-text-secondary">{wp.status}</span>
                  </div>
                  <span className="font-medium text-text-primary">{wp.total}</span>
                </div>
              ))}

              <div className="pt-2 mt-2 border-t border-border-default">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Com Work Permit</span>
                  <span className="text-lg font-bold text-green-400">{percentWithPermit}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-4">Sem dados de Work Permit</p>
        )}
      </div>

      {/* State Distribution Card */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-text-primary">Distribuição por Estado</h3>
        </div>

        {statesData.length > 0 ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statesData.slice(0, 6)}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="state"
                  width={80}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value} leads`, 'Total']}
                />
                <Bar
                  dataKey="total"
                  fill="#8B5CF6"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-4">
            Sem dados de Estado
            <br />
            <span className="text-xs">Ajuste o mapeamento no n8n</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default LeadDemographicsWidget;
