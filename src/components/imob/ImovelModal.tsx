import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { Imovel } from '../../hooks/imob/useImobImoveis';

interface ImovelModalProps {
  imovel?: Imovel | null;
  locationId: string;
  onSave: (data: Partial<Imovel>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

const FIELD_SECTION = 'flex flex-col gap-1';
const LABEL = 'text-xs text-zinc-400';
const INPUT = 'bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors';
const SELECT = INPUT;

const emptyForm = (): Partial<Imovel> => ({
  titulo: '',
  tipo: 'apartamento',
  finalidade: 'venda',
  status: 'disponivel',
  bairro: '',
  cidade: '',
  estado: '',
  condominio: '',
  endereco: '',
  area_total: null,
  area_construida: null,
  quartos: null,
  suites: null,
  banheiros: null,
  vagas_garagem: null,
  valor_venda: null,
  valor_aluguel: null,
  valor_condominio: null,
  aceita_financiamento: false,
  aceita_permuta: false,
  fotos_urls: [],
  video_url: '',
  tour_360_url: '',
  proprietario_nome: '',
  proprietario_telefone: '',
  destaque: false,
});

export const ImovelModal: React.FC<ImovelModalProps> = ({ imovel, locationId, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState<Partial<Imovel>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fotoInput, setFotoInput] = useState('');

  useEffect(() => {
    if (imovel) {
      setForm({ ...imovel });
    } else {
      setForm({ ...emptyForm(), location_id: locationId });
    }
  }, [imovel, locationId]);

  const set = <K extends keyof Imovel>(key: K, value: Imovel[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.titulo?.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!imovel || !onDelete) return;
    if (!confirm('Suspender este imóvel?')) return;
    setDeleting(true);
    try {
      await onDelete(imovel.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const addFoto = () => {
    const url = fotoInput.trim();
    if (!url) return;
    set('fotos_urls', [...(form.fotos_urls || []), url]);
    setFotoInput('');
  };

  const removeFoto = (idx: number) => {
    set('fotos_urls', (form.fotos_urls || []).filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-700">
          <h2 className="text-base font-semibold text-zinc-100">
            {imovel ? 'Editar Imóvel' : 'Novo Imóvel'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Básico */}
          <section className="space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Básico</p>
            <div className={FIELD_SECTION}>
              <label className={LABEL}>Título *</label>
              <input className={INPUT} value={form.titulo || ''} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Apartamento 3 quartos no Jardins" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Tipo</label>
                <select className={SELECT} value={form.tipo || 'apartamento'} onChange={e => set('tipo', e.target.value as Imovel['tipo'])}>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                  <option value="rural">Rural</option>
                </select>
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Finalidade</label>
                <select className={SELECT} value={form.finalidade || 'venda'} onChange={e => set('finalidade', e.target.value as Imovel['finalidade'])}>
                  <option value="venda">Venda</option>
                  <option value="aluguel">Aluguel</option>
                  <option value="temporada">Temporada</option>
                </select>
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Status</label>
                <select className={SELECT} value={form.status || 'disponivel'} onChange={e => set('status', e.target.value as Imovel['status'])}>
                  <option value="disponivel">Disponível</option>
                  <option value="reservado">Reservado</option>
                  <option value="vendido">Vendido</option>
                  <option value="suspenso">Suspenso</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Código</label>
                <input className={INPUT} value={form.codigo || ''} onChange={e => set('codigo', e.target.value)} placeholder="Código interno" />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Condomínio</label>
                <input className={INPUT} value={form.condominio || ''} onChange={e => set('condominio', e.target.value)} placeholder="Nome do condomínio" />
              </div>
            </div>
          </section>

          {/* Localização */}
          <section className="space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Localização</p>
            <div className={FIELD_SECTION}>
              <label className={LABEL}>Endereço</label>
              <input className={INPUT} value={form.endereco || ''} onChange={e => set('endereco', e.target.value)} placeholder="Rua, número" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Bairro</label>
                <input className={INPUT} value={form.bairro || ''} onChange={e => set('bairro', e.target.value)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Cidade</label>
                <input className={INPUT} value={form.cidade || ''} onChange={e => set('cidade', e.target.value)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Estado</label>
                <input className={INPUT} value={form.estado || ''} onChange={e => set('estado', e.target.value)} maxLength={2} placeholder="SP" />
              </div>
            </div>
          </section>

          {/* Características */}
          <section className="space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Características</p>
            <div className="grid grid-cols-3 gap-3">
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Área Total (m²)</label>
                <input type="number" className={INPUT} value={form.area_total ?? ''} onChange={e => set('area_total', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Área Construída (m²)</label>
                <input type="number" className={INPUT} value={form.area_construida ?? ''} onChange={e => set('area_construida', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Vagas Garagem</label>
                <input type="number" className={INPUT} value={form.vagas_garagem ?? ''} onChange={e => set('vagas_garagem', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Quartos</label>
                <input type="number" className={INPUT} value={form.quartos ?? ''} onChange={e => set('quartos', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Suítes</label>
                <input type="number" className={INPUT} value={form.suites ?? ''} onChange={e => set('suites', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Banheiros</label>
                <input type="number" className={INPUT} value={form.banheiros ?? ''} onChange={e => set('banheiros', e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                <input type="checkbox" checked={form.aceita_financiamento ?? false} onChange={e => set('aceita_financiamento', e.target.checked)} className="w-4 h-4 accent-blue-500" />
                Aceita Financiamento
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                <input type="checkbox" checked={form.aceita_permuta ?? false} onChange={e => set('aceita_permuta', e.target.checked)} className="w-4 h-4 accent-blue-500" />
                Aceita Permuta
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                <input type="checkbox" checked={form.destaque ?? false} onChange={e => set('destaque', e.target.checked)} className="w-4 h-4 accent-yellow-500" />
                Destaque
              </label>
            </div>
          </section>

          {/* Valores */}
          <section className="space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Valores</p>
            <div className="grid grid-cols-3 gap-3">
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Valor Venda (R$)</label>
                <input type="number" className={INPUT} value={form.valor_venda ?? ''} onChange={e => set('valor_venda', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Valor Aluguel (R$)</label>
                <input type="number" className={INPUT} value={form.valor_aluguel ?? ''} onChange={e => set('valor_aluguel', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Condomínio (R$)</label>
                <input type="number" className={INPUT} value={form.valor_condominio ?? ''} onChange={e => set('valor_condominio', e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>
          </section>

          {/* Mídia */}
          <section className="space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Mídia</p>
            <div className={FIELD_SECTION}>
              <label className={LABEL}>Fotos (URLs)</label>
              <div className="flex gap-2">
                <input
                  className={INPUT + ' flex-1'}
                  value={fotoInput}
                  onChange={e => setFotoInput(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={e => e.key === 'Enter' && addFoto()}
                />
                <button onClick={addFoto} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-300 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              {(form.fotos_urls || []).length > 0 && (
                <div className="space-y-1 mt-1">
                  {(form.fotos_urls || []).map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-zinc-400 truncate flex-1">{url}</span>
                      <button onClick={() => removeFoto(idx)} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <Minus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={FIELD_SECTION}>
              <label className={LABEL}>URL Vídeo</label>
              <input className={INPUT} value={form.video_url || ''} onChange={e => set('video_url', e.target.value)} placeholder="https://youtube.com/..." />
            </div>
            <div className={FIELD_SECTION}>
              <label className={LABEL}>URL Tour 360°</label>
              <input className={INPUT} value={form.tour_360_url || ''} onChange={e => set('tour_360_url', e.target.value)} placeholder="https://..." />
            </div>
          </section>

          {/* Proprietário */}
          <section className="space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Proprietário</p>
            <div className="grid grid-cols-2 gap-3">
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Nome</label>
                <input className={INPUT} value={form.proprietario_nome || ''} onChange={e => set('proprietario_nome', e.target.value)} />
              </div>
              <div className={FIELD_SECTION}>
                <label className={LABEL}>Telefone</label>
                <input className={INPUT} value={form.proprietario_telefone || ''} onChange={e => set('proprietario_telefone', e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-zinc-700">
          <div>
            {imovel && onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Trash2 size={15} />
                {deleting ? 'Suspendendo...' : 'Suspender'}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.titulo?.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
