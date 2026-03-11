import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Appointment {
  id: string;
  leadName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  phone: string;
  procedure: string;
}

// Mock data
const mockAppointments: Appointment[] = [
  {
    id: '1',
    leadName: 'Maria Silva',
    date: '2024-01-20',
    time: '14:00',
    status: 'confirmed',
    phone: '(11) 99999-1234',
    procedure: 'Avaliacao Inicial',
  },
  {
    id: '2',
    leadName: 'Joao Santos',
    date: '2024-01-20',
    time: '15:30',
    status: 'pending',
    phone: '(11) 98888-5678',
    procedure: 'Retorno',
  },
  {
    id: '3',
    leadName: 'Ana Costa',
    date: '2024-01-21',
    time: '10:00',
    status: 'confirmed',
    phone: '(11) 97777-9012',
    procedure: 'Procedimento Estetico',
  },
  {
    id: '4',
    leadName: 'Carlos Oliveira',
    date: '2024-01-21',
    time: '11:30',
    status: 'cancelled',
    phone: '(11) 96666-3456',
    procedure: 'Avaliacao Inicial',
  },
  {
    id: '5',
    leadName: 'Patricia Lima',
    date: '2024-01-22',
    time: '09:00',
    status: 'confirmed',
    phone: '(11) 95555-7890',
    procedure: 'Consulta',
  },
];

const StatusBadge = ({ status }: { status: Appointment['status'] }) => {
  const config = {
    confirmed: { label: 'Confirmado', color: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
    pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-400', icon: AlertCircle },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-400', icon: XCircle },
    completed: { label: 'Concluido', color: 'bg-text-muted/10 text-text-muted', icon: CheckCircle },
  };

  const { label, color, icon: Icon } = config[status];

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-semibold">
            {appointment.leadName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{appointment.leadName}</h3>
            <p className="text-sm text-text-muted">{appointment.procedure}</p>
          </div>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar size={14} className="text-text-muted" />
          {new Date(appointment.date).toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
          })}
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Clock size={14} className="text-text-muted" />
          {appointment.time}
        </div>
        <div className="flex items-center gap-2 text-text-secondary col-span-2">
          <Phone size={14} className="text-text-muted" />
          {appointment.phone}
        </div>
      </div>
    </div>
  );
};

export const ClientAgendamentos = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | Appointment['status']>('all');
  const [currentWeek, setCurrentWeek] = useState(0);

  const filteredAppointments = mockAppointments.filter(
    apt => filterStatus === 'all' || apt.status === filterStatus
  );

  const stats = {
    total: mockAppointments.length,
    confirmed: mockAppointments.filter(a => a.status === 'confirmed').length,
    pending: mockAppointments.filter(a => a.status === 'pending').length,
    cancelled: mockAppointments.filter(a => a.status === 'cancelled').length,
  };

  // Generate week days
  const getWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (currentWeek * 7));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const weekDays = getWeekDays();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-3">
          <Calendar className="text-accent-primary" size={28} />
          Agendamentos
        </h1>
        <p className="text-text-secondary mt-1">
          Acompanhe os agendamentos feitos pelo seu agente
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          <p className="text-sm text-text-muted">Total</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.confirmed}</p>
          <p className="text-sm text-text-muted">Confirmados</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-sm text-text-muted">Pendentes</p>
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
          <p className="text-sm text-text-muted">Cancelados</p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentWeek(w => w - 1)}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-text-muted" />
          </button>
          <span className="font-medium text-text-primary">
            {weekDays[0].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setCurrentWeek(w => w + 1)}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-text-muted" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayAppointments = mockAppointments.filter(
              a => new Date(a.date).toDateString() === day.toDateString()
            );

            return (
              <div
                key={index}
                className={`p-3 rounded-xl text-center transition-all cursor-pointer ${
                  isToday
                    ? 'bg-accent-primary/10 border border-accent-primary/30'
                    : 'hover:bg-bg-tertiary'
                }`}
              >
                <p className="text-xs text-text-muted uppercase">
                  {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-semibold mt-1 ${
                  isToday ? 'text-accent-primary' : 'text-text-primary'
                }`}>
                  {day.getDate()}
                </p>
                {dayAppointments.length > 0 && (
                  <div className="flex justify-center gap-1 mt-2">
                    {dayAppointments.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((status) => {
          const labels = { all: 'Todos', confirmed: 'Confirmados', pending: 'Pendentes', cancelled: 'Cancelados' };
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary border border-border-default text-text-secondary hover:text-text-primary'
              }`}
            >
              {labels[status]}
            </button>
          );
        })}
      </div>

      {/* Appointments List */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt) => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))
        ) : (
          <div className="col-span-2 bg-bg-secondary border border-border-default rounded-xl p-12 text-center">
            <Calendar size={48} className="text-text-muted mx-auto mb-4 opacity-50" />
            <p className="text-text-primary font-medium">Nenhum agendamento encontrado</p>
            <p className="text-sm text-text-muted mt-1">
              Os agendamentos feitos pelo agente aparecerao aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
