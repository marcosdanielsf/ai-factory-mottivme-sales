import React, { useMemo } from 'react';
import { useAccount } from '../../contexts/AccountContext';
import { useLocations } from '../../hooks/useLocations';
import { useGHLPipelines } from '../../hooks/ghl/useGHLPipelines';
import { useGHLOpportunities } from '../../hooks/ghl/useGHLOpportunities';
import { SalesFunnelChart } from '../../components/charts/SalesFunnelChart';
import { Euro, Users, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

export default function GHLPipeline() {
    const { selectedAccount } = useAccount();
    const { locations } = useLocations();
    const locationId = selectedAccount?.location_id || locations?.[0]?.location_id || '';

    const { pipelines, loading: loadingPipelines } = useGHLPipelines(locationId);
    const { opportunities, loading: loadingOpps } = useGHLOpportunities({ locationId, status: 'open' });

    // Filter opportunities by pipeline (using first pipeline as default if multiple)
    const activePipeline = pipelines[0];

    const funnelData = useMemo(() => {
        if (!activePipeline || !opportunities.length) {
            return {
                totalLeads: 0,
                totalResponderam: 0,
                totalAgendaram: 0,
                totalCompareceram: 0,
                totalFecharam: 0,
            };
        }

        const stages = activePipeline.stages;
        const total = opportunities.length;

        // Mapear etapas por posicao no pipeline (0=topo, last=fundo)
        const getCountAtStage = (index: number) => {
            if (!stages[index]) return 0;
            return opportunities.filter(opp => opp.pipelineStageId === stages[index].id).length;
        };

        return {
            totalLeads: total,
            totalResponderam: stages.length > 1 ? total - getCountAtStage(0) : 0,
            totalAgendaram: getCountAtStage(Math.floor(stages.length * 0.5)),
            totalCompareceram: getCountAtStage(Math.floor(stages.length * 0.75)),
            totalFecharam: stages.length > 1 ? getCountAtStage(stages.length - 1) : 0,
        };
    }, [activePipeline, opportunities]);

    const totalValue = useMemo(() => {
        return opportunities.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0);
    }, [opportunities]);

    if (!locationId) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Selecione uma conta para visualizar o pipeline.
            </div>
        );
    }

    if (loadingPipelines || loadingOpps) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Pipeline de Vendas (GHL Direct)</h1>
                <div className="text-sm text-gray-400">
                    Location: {locationId}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">Total no Pipeline</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Euro className="w-5 h-5 text-green-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">Oportunidades Abertas</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{opportunities.length}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Placeholder metrics */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">Taxa de Conversão</p>
                            <h3 className="text-2xl font-bold text-white mt-1">--%</h3>
                        </div>
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-sm">Estagnadas</p>
                            <h3 className="text-2xl font-bold text-white mt-1">0</h3>
                        </div>
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline Chart */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-6">
                    {activePipeline?.name || 'Pipeline'}
                </h2>

                {funnelData.totalLeads > 0 ? (
                    <div className="h-[400px]">
                        <SalesFunnelChart data={funnelData} />
                    </div>
                ) : (
                    <div className="h-[200px] flex items-center justify-center text-gray-500">
                        Nenhum dado disponível neste pipeline
                    </div>
                )}
            </div>
        </div>
    );
}
