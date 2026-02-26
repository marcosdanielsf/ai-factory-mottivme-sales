import { useState, useCallback, useEffect, useMemo } from 'react';
import { SupervisionFilters, SavedFilter, FilterOption } from '../types/supervision';

const STORAGE_KEY = 'mottivme_supervision_saved_filters';

export const useSavedFilters = (locations?: FilterOption[]) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedFilters(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading saved filters:', err);
    }
  }, []);

  // Persist to localStorage
  const persist = useCallback((filters: SavedFilter[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      setSavedFilters(filters);
    } catch (err) {
      console.error('Error saving filters:', err);
    }
  }, []);

  const saveFilter = useCallback((name: string, filters: SupervisionFilters) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      filters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persist([...savedFilters, newFilter]);
    return newFilter;
  }, [savedFilters, persist]);

  const updateFilter = useCallback((id: string, name: string, filters: SupervisionFilters) => {
    const updated = savedFilters.map((f) =>
      f.id === id ? { ...f, name, filters, updatedAt: new Date().toISOString() } : f
    );
    persist(updated);
  }, [savedFilters, persist]);

  const deleteFilter = useCallback((id: string) => {
    persist(savedFilters.filter((f) => f.id !== id));
  }, [savedFilters, persist]);

  const defaultClientFilters: SavedFilter[] = useMemo(() => {
    if (!locations) return [];
    return locations
      .filter(loc => (loc.count || 0) > 0)
      .map(loc => ({
        id: `auto_${loc.value}`,
        name: loc.label || loc.value,
        filters: { locationId: loc.value } as SupervisionFilters,
        createdAt: '',
        updatedAt: '',
      }));
  }, [locations]);

  return {
    savedFilters,
    defaultClientFilters,
    saveFilter,
    updateFilter,
    deleteFilter,
  };
};
