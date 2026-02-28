import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProducts, type Product } from '../../hooks/useProducts';
import { useAccount } from '../../contexts/AccountContext';

// ============================================
// HELPERS
// ============================================

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ============================================
// PRODUCT CARD (sortable)
// ============================================

interface ProductCardProps {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

function SortableProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden flex flex-col">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={16} />
      </div>

      {/* Image */}
      <div className="relative h-48 bg-zinc-700 flex-shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
            <Package size={40} />
            <span className="text-xs">Sem imagem</span>
          </div>
        )}

        {/* Category badge */}
        {product.category && product.category !== 'geral' && (
          <span className="absolute top-2 right-2 bg-zinc-900/80 text-zinc-300 text-xs px-2 py-0.5 rounded-full border border-zinc-600">
            {product.category}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-zinc-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={() => onEdit(product)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
          >
            <Edit2 size={14} />
            Editar
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-zinc-100 font-medium text-sm leading-tight line-clamp-2">{product.name}</h3>

        {product.description && (
          <p className="text-zinc-400 text-xs line-clamp-2">{product.description}</p>
        )}

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            {product.compare_price && product.compare_price > product.ticket && (
              <span className="text-zinc-500 text-xs line-through">{formatBRL(product.compare_price)}</span>
            )}
            <span className="text-emerald-400 font-semibold text-sm">{formatBRL(product.ticket)}</span>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 text-xs">{product.sales_cycle_days}d ciclo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// IMAGE UPLOAD ZONE
// ============================================

interface ImageUploadZoneProps {
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

function ImageUploadZone({ previewUrl, onFileSelect, onClear }: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onFileSelect(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !previewUrl && inputRef.current?.click()}
      className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden
        ${dragging ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-600 hover:border-zinc-500'}
        ${previewUrl ? 'h-48 cursor-default' : 'h-32'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-2 right-2 p-1 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-full"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
          <Upload size={24} />
          <span className="text-xs text-center px-4">Clique ou arraste uma imagem aqui</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// MODAL DE CRIAR/EDITAR
// ============================================

interface FormState {
  name: string;
  description: string;
  ticket: string;
  compare_price: string;
  category: string;
  sales_cycle_days: string;
  target_units: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  ticket: '',
  compare_price: '',
  category: '',
  sales_cycle_days: '30',
  target_units: '10',
};

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    description: p.description ?? '',
    ticket: String(p.ticket),
    compare_price: p.compare_price ? String(p.compare_price) : '',
    category: p.category ?? '',
    sales_cycle_days: String(p.sales_cycle_days),
    target_units: String(p.target_units),
  };
}

interface ProductModalProps {
  editing: Product | null;
  categories: string[];
  locationId: string;
  onClose: () => void;
  onSave: (form: FormState, imageFile: File | null) => Promise<void>;
  saving: boolean;
}

function ProductModal({ editing, categories, onClose, onSave, saving }: ProductModalProps) {
  const [form, setForm] = useState<FormState>(editing ? productToForm(editing) : EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(editing?.image_url ?? null);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const filteredCategories = categories.filter(c =>
    c.toLowerCase().includes(form.category.toLowerCase()) && c !== form.category
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700">
          <h2 className="text-zinc-100 font-semibold text-base">
            {editing ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          className="p-6 flex flex-col gap-5"
          onSubmit={(e) => { e.preventDefault(); onSave(form, imageFile); }}
        >
          {/* Imagem */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Imagem do produto</label>
            <ImageUploadZone
              previewUrl={previewUrl}
              onFileSelect={handleFileSelect}
              onClear={handleClearImage}
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Nome *</label>
            <input
              required
              value={form.name}
              onChange={set('name')}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              placeholder="Ex: Plano Anual Pro"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
              placeholder="Descreva o produto brevemente..."
            />
          </div>

          {/* Preços */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Preço (R$) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.ticket}
                onChange={set('ticket')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Preço original (riscado)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.compare_price}
                onChange={set('compare_price')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="relative">
            <label className="block text-xs text-zinc-400 mb-1.5">Categoria</label>
            <input
              value={form.category}
              onChange={set('category')}
              onFocus={() => setShowCategorySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 150)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              placeholder="Ex: consultoria, software, treinamento..."
            />
            {showCategorySuggestions && filteredCategories.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                {filteredCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onMouseDown={() => setForm(prev => ({ ...prev, category: cat }))}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ciclo + Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Ciclo de vendas (dias) *</label>
              <input
                required
                type="number"
                min="1"
                value={form.sales_cycle_days}
                onChange={set('sales_cycle_days')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Meta de unidades</label>
              <input
                type="number"
                min="0"
                value={form.target_units}
                onChange={set('target_units')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving && <RefreshCw size={14} className="animate-spin" />}
              {editing ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="p-5 bg-zinc-800 rounded-2xl border border-zinc-700">
        <Package size={48} className="text-zinc-500" />
      </div>
      <div>
        <p className="text-zinc-200 font-medium text-base">Nenhum produto cadastrado</p>
        <p className="text-zinc-500 text-sm mt-1 max-w-xs">
          Adicione produtos para que seus agentes possam apresentá-los
        </p>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus size={16} />
        Cadastrar primeiro produto
      </button>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function Products() {
  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id ?? null;

  const { products, loading, error, createProduct, updateProduct, deleteProduct, uploadProductImage, fetchCategories, refetch } = useProducts(locationId);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sortedIds, setSortedIds] = useState<string[]>([]);

  useEffect(() => {
    setSortedIds(products.map(p => p.id));
  }, [products]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, [fetchCategories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter ? p.category === categoryFilter : true;
    return matchSearch && matchCategory;
  });

  const sortedFiltered = sortedIds
    .map(id => filtered.find(p => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedIds.indexOf(String(active.id));
    const newIndex = sortedIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const next = [...sortedIds];
    next.splice(oldIndex, 1);
    next.splice(newIndex, 0, String(active.id));
    setSortedIds(next);

    // Persist sort_order
    await Promise.all(
      next.map((id, idx) => updateProduct(id, { sort_order: idx }))
    );
  }, [sortedIds, updateProduct]);

  const openNew = () => {
    setEditing(null);
    setSaveError(null);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setSaveError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este produto?')) return;
    try {
      await deleteProduct(id);
    } catch (err: unknown) {
      console.error('[Products] delete error', err);
    }
  };

  const handleSave = async (form: FormState, imageFile: File | null) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) {
        await updateProduct(editing.id, {
          name: form.name,
          description: form.description || null,
          ticket: parseFloat(form.ticket),
          compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
          category: form.category || 'geral',
          sales_cycle_days: parseInt(form.sales_cycle_days, 10),
          target_units: parseInt(form.target_units, 10),
        });
        if (imageFile) {
          await uploadProductImage(imageFile, editing.id);
        }
      } else {
        if (!locationId) throw new Error('Selecione uma conta primeiro');
        const created = await createProduct({
          location_id: locationId,
          name: form.name,
          description: form.description || null,
          ticket: parseFloat(form.ticket),
          compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
          category: form.category || 'geral',
          sales_cycle_days: parseInt(form.sales_cycle_days, 10),
          target_units: parseInt(form.target_units, 10),
        });
        if (imageFile && created) {
          await uploadProductImage(imageFile, created.id);
        }
      }
      setShowModal(false);
      fetchCategories().then(setCategories);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar produto';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const allCategories = [...new Set([...categories, ...products.map(p => p.category)])].filter(Boolean);

  return (
    <div className="p-6 min-h-screen bg-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Catálogo de Produtos</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>
        {allCategories.length > 0 && (
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="appearance-none bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-8 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="">Todas as categorias</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Error banner */}
      {(error || saveError) && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-900/30 border border-red-700/50 rounded-lg mb-4 text-red-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error ?? saveError}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 gap-3 text-zinc-500">
          <RefreshCw size={20} className="animate-spin" />
          <span className="text-sm">Carregando produtos...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && <EmptyState onNew={openNew} />}

      {/* No results */}
      {!loading && products.length > 0 && sortedFiltered.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <Package size={36} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum produto encontrado para os filtros aplicados.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && sortedFiltered.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedFiltered.map(p => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedFiltered.map(product => (
                <SortableProductCard
                  key={product.id}
                  product={product}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modal */}
      {showModal && (
        <ProductModal
          editing={editing}
          categories={allCategories}
          locationId={locationId ?? ''}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
