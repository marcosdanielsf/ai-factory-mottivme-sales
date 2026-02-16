import { useState, useMemo, useRef } from 'react';
import { X, Loader2, Upload, AlertTriangle, Database } from 'lucide-react';
import { CreateCampaignInput } from '../../../hooks/useColdCallCampaigns';
import { ContactImportModal } from '../../../components/coldcall/ContactImportModal';
import { Contact } from '../../../hooks/useAvailableContacts';
import { DAY_LABELS, ALL_DAYS } from '../constants';
import { parsePhoneList, parseCSV } from '../helpers';

export function CreateCampaignModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateCampaignInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneText, setPhoneText] = useState('');
  const [rateLimit, setRateLimit] = useState(10);
  const [scheduleStart, setScheduleStart] = useState('09:00');
  const [scheduleEnd, setScheduleEnd] = useState('18:00');
  const [scheduleDays, setScheduleDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import mode
  const [importMode, setImportMode] = useState<'paste' | 'database'>('paste');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedContacts, setImportedContacts] = useState<Contact[]>([]);

  const parsedItems = useMemo(() => {
    if (importMode === 'database' && importedContacts.length > 0) {
      return importedContacts.map(c => ({
        phone: c.phone,
        name: c.name,
        context: c.segmento,
      }));
    }
    return parsePhoneList(phoneText);
  }, [phoneText, importMode, importedContacts]);

  const handleImportSuccess = (contacts: Contact[]) => {
    setImportedContacts(contacts);
    setShowImportModal(false);
  };

  const toggleDay = (day: string) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const items = parseCSV(text);
      const lines = items.map((i) => [i.phone, i.name, i.context].filter(Boolean).join(','));
      setPhoneText((prev) => (prev ? prev + '\n' : '') + lines.join('\n'));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nome da campanha é obrigatório.');
      return;
    }
    if (parsedItems.length === 0) {
      setErrorMsg('Adicione pelo menos um contato.');
      return;
    }

    try {
      setSaving(true);
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        phone_list: parsedItems,
        rate_limit: rateLimit,
        schedule_start: scheduleStart,
        schedule_end: scheduleEnd,
        schedule_days: scheduleDays,
      });
      // Reset
      setName('');
      setDescription('');
      setPhoneText('');
      setRateLimit(10);
      setScheduleStart('09:00');
      setScheduleEnd('18:00');
      setScheduleDays(['mon', 'tue', 'wed', 'thu', 'fri']);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar campanha';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <ContactImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />

      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
        <div className="bg-bg-secondary border border-border-default rounded-xl w-full max-w-2xl mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-text-primary">Nova Campanha</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Nome da campanha <span className="text-accent-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Prospecção Médicos SP"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Descrição <span className="text-text-muted">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a campanha..."
              rows={2}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm resize-none"
            />
          </div>

          {/* Phone list */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Lista de telefones <span className="text-accent-error">*</span>
            </label>

            {/* Tabs */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setImportMode('paste')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                  importMode === 'paste'
                    ? 'bg-accent-primary/15 border-accent-primary text-accent-primary'
                    : 'bg-bg-tertiary border-border-default text-text-muted hover:border-border-hover'
                }`}
              >
                📋 Colar Lista
              </button>
              <button
                onClick={() => setImportMode('database')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                  importMode === 'database'
                    ? 'bg-accent-primary/15 border-accent-primary text-accent-primary'
                    : 'bg-bg-tertiary border-border-default text-text-muted hover:border-border-hover'
                }`}
              >
                <Database className="w-4 h-4 inline mr-1" />
                Importar do Banco
              </button>
            </div>

            {/* Paste mode */}
            {importMode === 'paste' && (
              <>
                <div className="flex items-center justify-end mb-1.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload CSV
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </div>
                <textarea
                  value={phoneText}
                  onChange={(e) => setPhoneText(e.target.value)}
                  placeholder={"telefone,nome,contexto\n5511999990001,Dr. Silva,Clínica SP\n5511999990002,Dra. Santos,Hospital RJ"}
                  rows={5}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm font-mono resize-none"
                />
              </>
            )}

            {/* Database mode */}
            {importMode === 'database' && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="w-full px-4 py-3 bg-accent-primary/10 border-2 border-dashed border-accent-primary/30 rounded-lg text-accent-primary hover:bg-accent-primary/15 hover:border-accent-primary/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Database className="w-5 h-5" />
                  Selecionar Contatos do Banco
                </button>

                {importedContacts.length > 0 && (
                  <div className="px-3 py-2 bg-accent-success/10 border border-accent-success/30 rounded-lg">
                    <p className="text-xs text-accent-success font-medium">
                      ✅ {importedContacts.length} contato{importedContacts.length !== 1 ? 's' : ''} importado{importedContacts.length !== 1 ? 's' : ''} do banco
                    </p>
                    <button
                      onClick={() => setImportedContacts([])}
                      className="mt-1 text-xs text-accent-error hover:underline"
                    >
                      Limpar seleção
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Count */}
            {parsedItems.length > 0 && (
              <p className="mt-1.5 text-xs text-accent-success font-medium">
                ✅ {parsedItems.length} contato{parsedItems.length !== 1 ? 's' : ''} detectado{parsedItems.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Rate limit */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Rate limit (ligações/hora)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={50}
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="flex-1 accent-accent-primary"
              />
              <span className="w-12 text-center text-sm font-medium text-text-primary bg-bg-tertiary border border-border-default rounded-lg px-2 py-1">
                {rateLimit}
              </span>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Horário início
              </label>
              <input
                type="time"
                value={scheduleStart}
                onChange={(e) => setScheduleStart(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Horário fim
              </label>
              <input
                type="time"
                value={scheduleEnd}
                onChange={(e) => setScheduleEnd(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Dias da semana
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const active = scheduleDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      active
                        ? 'bg-accent-primary/15 border-accent-primary text-accent-primary'
                        : 'bg-bg-tertiary border-border-default text-text-muted hover:border-border-hover'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 px-3 py-2 bg-accent-error/10 border border-accent-error/30 rounded-lg text-accent-error text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-default">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-tertiary hover:bg-bg-hover border border-border-default rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-primary hover:bg-accent-primary/80 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar campanha
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
