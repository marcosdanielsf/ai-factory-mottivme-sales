import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export interface KnowledgeBaseItem {
  id: string;
  location_id: string;
  category: string;
  key: string;
  value: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export type KBCategory = 'precos' | 'servicos' | 'horarios' | 'equipe' | 'procedimentos' | 'faq';

export interface GroupedKB {
  category: KBCategory;
  items: KnowledgeBaseItem[];
}

interface UseKnowledgeBaseResult {
  grouped: GroupedKB[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createItem: (category: string, key: string, value: string) => Promise<boolean>;
  updateItem: (id: string, newValue: string) => Promise<boolean>;
  toggleActive: (id: string, isActive: boolean) => Promise<boolean>;
}

const CATEGORIES: KBCategory[] = ['precos', 'servicos', 'horarios', 'equipe', 'procedimentos', 'faq'];

export function useKnowledgeBase(locationId: string | null | undefined): UseKnowledgeBaseResult {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!locationId || locationId.length < 5) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('client_knowledge_base')
      .select('*')
      .eq('location_id', locationId)
      .order('category')
      .order('key');

    if (err) {
      setError(err.message);
    } else {
      setItems((data as KnowledgeBaseItem[]) || []);
    }
    setLoading(false);
  }, [locationId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const grouped: GroupedKB[] = useMemo(
    () => CATEGORIES.map((cat) => ({ category: cat, items: items.filter((i) => i.category === cat) })),
    [items],
  );

  const createItem = async (category: string, key: string, value: string): Promise<boolean> => {
    if (!locationId) return false;
    const { error: err } = await supabase
      .from('client_knowledge_base')
      .insert({ location_id: locationId, category, key, value, updated_by: 'brand_portal' });
    if (err) {
      setError(err.message);
      return false;
    }
    await fetchItems();
    return true;
  };

  const updateItem = async (id: string, newValue: string): Promise<boolean> => {
    const { error: err } = await supabase
      .from('client_knowledge_base')
      .update({ value: newValue, updated_by: 'brand_portal' })
      .eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    await fetchItems();
    return true;
  };

  const toggleActive = async (id: string, isActive: boolean): Promise<boolean> => {
    const { error: err } = await supabase
      .from('client_knowledge_base')
      .update({ is_active: isActive, updated_by: 'brand_portal' })
      .eq('id', id);
    if (err) {
      setError(err.message);
      return false;
    }
    await fetchItems();
    return true;
  };

  return { grouped, loading, error, refetch: fetchItems, createItem, updateItem, toggleActive };
}
