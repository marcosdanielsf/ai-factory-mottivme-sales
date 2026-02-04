/**
 * Export utilities for CSV/Excel downloads
 */

/**
 * Converte um array de objetos para string CSV
 */
export function arrayToCSV<T extends Record<string, unknown>>(data: T[], headers?: Record<string, string>): string {
  if (data.length === 0) return '';

  // Pega as chaves do primeiro objeto
  const keys = Object.keys(data[0]);
  
  // Header row - usa headers customizados se fornecidos
  const headerRow = keys.map(key => {
    const label = headers?.[key] ?? key;
    // Escapa aspas duplas
    return `"${String(label).replace(/"/g, '""')}"`;
  }).join(',');

  // Data rows
  const dataRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      
      // Trata null/undefined
      if (value === null || value === undefined) {
        return '""';
      }
      
      // Converte para string e escapa aspas
      const strValue = String(value).replace(/"/g, '""');
      return `"${strValue}"`;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Faz download de um arquivo CSV
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Adiciona BOM para Excel reconhecer UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpa a URL
  URL.revokeObjectURL(url);
}

/**
 * Exporta um array de objetos para CSV e faz download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[], 
  filename: string,
  headers?: Record<string, string>
): void {
  if (data.length === 0) {
    console.warn('exportToCSV: No data to export');
    return;
  }
  
  const csvContent = arrayToCSV(data, headers);
  downloadCSV(csvContent, filename);
}

/**
 * Gera um nome de arquivo com timestamp
 */
export function generateFilename(prefix: string, extension = 'csv'): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${prefix}_${timestamp}.${extension}`;
}
