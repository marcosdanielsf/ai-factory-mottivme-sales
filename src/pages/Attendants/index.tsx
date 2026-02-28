import React, { useState } from 'react';
import { UserPlus, Users, Pencil, Power, Clock, X, Check } from 'lucide-react';
import { useAttendants, Attendant, DaySchedule, DEFAULT_SCHEDULE, isAvailableNow } from '../../hooks/useAttendants';
import { useAccount } from '../../contexts/AccountContext';
import { useToast } from '../../hooks/useToast';

const DAYS_LABELS: Record<string, string> = {
  domingo: 'Dom',
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sab',
};

const DAYS_ORDER = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

const ROLE_OPTIONS = [
  { value: 'atendente', label: 'Atendente' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'supervisor', label: 'Supervisor' },
];

interface AttendantFormData {
  name: string;
  whatsapp: string;
  email: string;
  role: string;
  ghl_user_id: string;
  schedule: Record<string, DaySchedule>;
}

const EMPTY_FORM: AttendantFormData = {
  name: '',
  whatsapp: '',
  email: '',
  role: 'atendente',
  ghl_user_id: '',
  schedule: DEFAULT_SCHEDULE,
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Attendants() {
  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id ?? null;
  const { attendants, loading, createAttendant, updateAttendant, toggleActive } = useAttendants(locationId);
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AttendantFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (attendant: Attendant) => {
    setEditingId(attendant.id);
    setForm({
      name: attendant.name,
      whatsapp: attendant.whatsapp ?? '',
      email: attendant.email ?? '',
      role: attendant.role,
      ghl_user_id: attendant.ghl_user_id ?? '',
      schedule: attendant.schedule ?? DEFAULT_SCHEDULE,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Nome e obrigatorio', 'error');
      return;
    }
    if (!locationId) {
      showToast('Selecione uma subconta primeiro', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        role: form.role,
        ghl_user_id: form.ghl_user_id.trim() || null,
        schedule: form.schedule,
      };

      if (editingId) {
        await updateAttendant(editingId, payload);
        showToast('Atendente atualizado com sucesso', 'success');
      } else {
        await createAttendant({ location_id: locationId, ...payload });
        showToast('Atendente criado com sucesso', 'success');
      }
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (attendant: Attendant) => {
    try {
      await toggleActive(attendant.id, attendant.is_active);
      showToast(
        attendant.is_active ? 'Atendente desativado' : 'Atendente ativado',
        'info'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar status';
      showToast(msg, 'error');
    }
  };

  const updateScheduleDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: { ...prev.schedule[day], [field]: value },
      },
    }));
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border-default bg-bg-secondary shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Atendentes</h1>
            <p className="text-sm text-text-muted mt-0.5">
              Cadastre atendentes humanos que receberao handoff da IA
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            <UserPlus size={16} />
            Novo Atendente
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-text-muted text-sm">Carregando atendentes...</div>
          </div>
        ) : attendants.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
              <Users size={32} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">Nenhum atendente cadastrado</h3>
            <p className="text-sm text-text-muted max-w-xs">
              Cadastre atendentes para que a IA possa transferir conversas quando necessario
            </p>
            <button
              onClick={openCreate}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              <UserPlus size={16} />
              Cadastrar primeiro atendente
            </button>
          </div>
        ) : (
          /* Table */
          <div className="bg-bg-secondary rounded-xl border border-border-default overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default bg-bg-tertiary/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Atendente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">WhatsApp</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Cargo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Disponivel</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/50">
                {attendants.map(att => {
                  const available = att.is_active && isAvailableNow(att);
                  return (
                    <tr
                      key={att.id}
                      className={`hover:bg-bg-tertiary/30 transition-colors ${!att.is_active ? 'opacity-60' : ''}`}
                    >
                      {/* Avatar + Nome */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-xs font-semibold text-accent-primary shrink-0">
                            {getInitials(att.name)}
                          </div>
                          <span className="text-sm font-medium text-text-primary">{att.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{att.whatsapp || '—'}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{att.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary capitalize">
                          {att.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          att.is_active
                            ? 'bg-accent-success/10 text-accent-success'
                            : 'bg-bg-tertiary text-text-muted'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${att.is_active ? 'bg-accent-success' : 'bg-text-muted'}`} />
                          {att.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          available
                            ? 'bg-green-400/10 text-green-400'
                            : 'bg-bg-tertiary text-text-muted'
                        }`}>
                          <Clock size={10} />
                          {available ? 'Agora' : 'Fora'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEdit(att)}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggle(att)}
                            className={`p-1.5 rounded-md transition-colors ${
                              att.is_active
                                ? 'text-text-muted hover:text-accent-error hover:bg-accent-error/10'
                                : 'text-text-muted hover:text-accent-success hover:bg-accent-success/10'
                            }`}
                            title={att.is_active ? 'Desativar' : 'Ativar'}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-secondary border border-border-default rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0">
              <h2 className="text-base font-semibold text-text-primary">
                {editingId ? 'Editar Atendente' : 'Novo Atendente'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Dados basicos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Nome *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo"
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">WhatsApp</label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="+55 11 99999-9999"
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@empresa.com"
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Cargo</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
                  >
                    {ROLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">GHL User ID</label>
                  <input
                    type="text"
                    value={form.ghl_user_id}
                    onChange={e => setForm(prev => ({ ...prev, ghl_user_id: e.target.value }))}
                    placeholder="ID do usuario no GHL"
                    className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-all"
                  />
                </div>
              </div>

              {/* Horarios */}
              <div>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Horarios de Atendimento
                </h3>
                <div className="space-y-2">
                  {DAYS_ORDER.map(day => {
                    const sched = form.schedule[day] ?? { start: '08:00', end: '18:00', active: false };
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateScheduleDay(day, 'active', !sched.active)}
                          className={`flex items-center justify-center w-5 h-5 rounded border transition-colors shrink-0 ${
                            sched.active
                              ? 'bg-accent-primary border-accent-primary text-white'
                              : 'border-border-default text-transparent'
                          }`}
                        >
                          <Check size={12} />
                        </button>
                        <span className="w-8 text-xs font-medium text-text-secondary shrink-0">
                          {DAYS_LABELS[day]}
                        </span>
                        <input
                          type="time"
                          value={sched.start}
                          disabled={!sched.active}
                          onChange={e => updateScheduleDay(day, 'start', e.target.value)}
                          className="bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary disabled:opacity-40 disabled:cursor-not-allowed w-24"
                        />
                        <span className="text-xs text-text-muted">ate</span>
                        <input
                          type="time"
                          value={sched.end}
                          disabled={!sched.active}
                          onChange={e => updateScheduleDay(day, 'end', e.target.value)}
                          className="bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary disabled:opacity-40 disabled:cursor-not-allowed w-24"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Schedule preview */}
                <div className="mt-4 p-3 bg-bg-tertiary/50 rounded-lg border border-border-default/50">
                  <p className="text-xs text-text-muted mb-2">Preview da semana:</p>
                  <div className="flex gap-1.5">
                    {DAYS_ORDER.map(day => {
                      const sched = form.schedule[day];
                      return (
                        <div
                          key={day}
                          className={`flex-1 rounded py-1.5 text-center text-[10px] font-medium transition-colors ${
                            sched?.active
                              ? 'bg-accent-primary/20 text-accent-primary'
                              : 'bg-bg-hover text-text-muted'
                          }`}
                          title={sched?.active ? `${sched.start} - ${sched.end}` : 'Inativo'}
                        >
                          {DAYS_LABELS[day]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default shrink-0">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : editingId ? 'Salvar Alteracoes' : 'Criar Atendente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendants;
