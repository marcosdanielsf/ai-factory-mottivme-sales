import React, { useState } from 'react';
import { useAccount } from '../../contexts/AccountContext';
import { useLocations } from '../../hooks/useLocations';
import { useGHLCalendar } from '../../hooks/ghl/useGHLCalendar';
import { DateRangePicker, DateRange } from '../../components/DateRangePicker';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { addDays } from 'date-fns';

export default function GHLAgenda() {
    const { selectedAccount } = useAccount();
    const { locations } = useLocations();
    const locationId = selectedAccount?.location_id || locations?.[0]?.location_id || '';

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 7)
    });

    const { events, loading } = useGHLCalendar(locationId, dateRange);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'text-green-500 bg-green-500/10';
            case 'cancelled': return 'text-red-500 bg-red-500/10';
            case 'showed': return 'text-blue-500 bg-blue-500/10';
            case 'noshow': return 'text-yellow-500 bg-yellow-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <CheckCircle className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            case 'noshow': return <AlertCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    if (!locationId) {
        return (
            <div className="flex items-center justify-center p-12 text-gray-500">
                Selecione uma conta para visualizar a agenda.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Agenda (GHL Direct)</h1>
                    <p className="text-gray-400 text-sm">Visualizando agendamentos diretamente do calendar</p>
                </div>

                <DateRangePicker
                    date={dateRange}
                    setDate={setDateRange}
                />
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-500" />
                        Eventos ({events.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        Nenhum agendamento encontrado neste período.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-900/50 text-gray-400 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Título</th>
                                    <th className="px-6 py-3">Data/Hora</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Calendar ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {events.map((event) => (
                                    <tr key={event.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {event.title}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {new Date(event.startTime).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.appointmentStatus)}`}>
                                                {getStatusIcon(event.appointmentStatus)}
                                                {event.appointmentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                                            {event.calendarId.substring(0, 8)}...
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
