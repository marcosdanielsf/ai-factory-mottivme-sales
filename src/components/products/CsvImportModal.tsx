import React, { useState, useCallback } from 'react';
import { X, Upload, FileText, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CsvImportModalProps {
  locationId: string;
  onClose: () => void;
  onImported: () => void;
}

interface CsvRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  dbField: string;
}

const DB_FIELDS = [
  { value: 'name', label: 'Nome do Produto' },
  { value: 'ticket', label: 'Preco (R$)' },
  { value: 'description', label: 'Descricao' },
  { value: 'category', label: 'Categoria' },
  { value: 'compare_price', label: 'Preco Original' },
  { value: 'sales_cycle_days', label: 'Ciclo de Vendas (dias)' },
  { value: 'target_units', label: 'Meta Unidades' },
  { value: '', label: '(Ignorar)' },
];

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ locationId, onClose, onImported }) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'done'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });

  const parseCsv = useCallback((text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;

    const separator = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length !== headers.length) continue;
      const row: CsvRow = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });
      rows.push(row);
    }

    setCsvHeaders(headers);
    setCsvRows(rows);
    setMappings(headers.map(h => ({
      csvColumn: h,
      dbField: autoMapField(h),
    })));
    setStep('mapping');
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) parseCsv(text);
    };
    reader.readAsText(file, 'UTF-8');
  }, [parseCsv]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleImport = useCallback(async () => {
    setImporting(true);
    const activeMappings = mappings.filter(m => m.dbField);

    interface ProductInsert {
      location_id: string;
      name?: string;
      ticket?: number;
      description?: string;
      category?: string;
      compare_price?: number;
      sales_cycle_days?: number;
      target_units?: number;
    }

    const validRows: ProductInsert[] = [];

    for (const row of csvRows) {
      const product: ProductInsert = { location_id: locationId };

      for (const mapping of activeMappings) {
        const value = row[mapping.csvColumn];
        if (!value) continue;

        if (mapping.dbField === 'ticket' || mapping.dbField === 'compare_price') {
          (product as Record<string, unknown>)[mapping.dbField] = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        } else if (mapping.dbField === 'sales_cycle_days' || mapping.dbField === 'target_units') {
          (product as Record<string, unknown>)[mapping.dbField] = parseInt(value) || 0;
        } else {
          (product as Record<string, unknown>)[mapping.dbField] = value;
        }
      }

      if (product.name) validRows.push(product);
    }

    let success = 0;
    let errors = 0;

    // Batch insert in chunks of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      try {
        const { error } = await supabase.from('sales_products').insert(batch);
        if (error) throw error;
        success += batch.length;
      } catch {
        errors += batch.length;
      }
    }

    setImportResult({ success, errors });
    setImporting(false);
    setStep('done');
  }, [csvRows, mappings, locationId]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Importar Produtos via CSV</h2>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'upload' && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-zinc-600 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFile(file);
                };
                input.click();
              }}
            >
              <Upload size={40} className="mx-auto text-zinc-500 mb-4" />
              <p className="text-sm text-zinc-300 mb-1">Arraste um arquivo CSV ou clique para selecionar</p>
              <p className="text-xs text-zinc-600">Separador: virgula ou ponto-e-virgula. Encoding: UTF-8</p>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{csvRows.length} linhas encontradas. Mapeie as colunas:</p>
              </div>

              <div className="space-y-2">
                {mappings.map((mapping, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-2.5">
                    <span className="text-xs text-zinc-400 w-40 truncate font-mono">{mapping.csvColumn}</span>
                    <span className="text-zinc-600">→</span>
                    <select
                      value={mapping.dbField}
                      onChange={e => {
                        const updated = [...mappings];
                        updated[i] = { ...mapping, dbField: e.target.value };
                        setMappings(updated);
                      }}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {DB_FIELDS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">Preview (primeiras 3 linhas):</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        {mappings.filter(m => m.dbField).map((m, i) => (
                          <th key={i} className="text-left py-1 px-2 text-zinc-500 font-medium">{m.dbField}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 3).map((row, ri) => (
                        <tr key={ri} className="border-b border-zinc-800">
                          {mappings.filter(m => m.dbField).map((m, ci) => (
                            <td key={ci} className="py-1 px-2 text-zinc-300 truncate max-w-[150px]">
                              {row[m.csvColumn] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              {importResult.errors === 0 ? (
                <Check size={40} className="mx-auto text-green-400 mb-4" />
              ) : (
                <AlertTriangle size={40} className="mx-auto text-amber-400 mb-4" />
              )}
              <p className="text-sm text-white mb-2">Importacao concluida!</p>
              <p className="text-xs text-zinc-400">
                {importResult.success} produtos importados
                {importResult.errors > 0 && `, ${importResult.errors} erros`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-700">
          {step === 'mapping' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !mappings.some(m => m.dbField === 'name')}
                className={`flex items-center gap-1 px-4 py-1.5 text-xs rounded-lg transition-colors ${
                  mappings.some(m => m.dbField === 'name')
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {importing ? 'Importando...' : `Importar ${csvRows.length} produtos`}
              </button>
            </>
          )}
          {step === 'done' && (
            <button
              onClick={() => { onImported(); onClose(); }}
              className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function autoMapField(header: string): string {
  const h = header.toLowerCase().trim();
  if (h.includes('nome') || h.includes('name') || h.includes('produto')) return 'name';
  if (h.includes('preco') || h.includes('price') || h.includes('valor') || h.includes('ticket')) return 'ticket';
  if (h.includes('descri')) return 'description';
  if (h.includes('categ')) return 'category';
  if (h.includes('ciclo') || h.includes('cycle')) return 'sales_cycle_days';
  if (h.includes('meta') || h.includes('target') || h.includes('unid')) return 'target_units';
  if (h.includes('original') || h.includes('compare') || h.includes('de ')) return 'compare_price';
  return '';
}
