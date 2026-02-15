import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Product {
  id: string;
  location_id: string;
  name: string;
  ticket: number;
  sales_cycle_days: number;
  target_units: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

type CreateProductInput = Pick<Product, 'location_id' | 'name' | 'ticket' | 'sales_cycle_days' | 'target_units'>;
type UpdateProductInput = Partial<Pick<Product, 'name' | 'ticket' | 'sales_cycle_days' | 'target_units' | 'is_active' | 'sort_order'>>;

export const useProducts = (locationId?: string | null) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!isSupabaseConfigured() || !locationId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('sales_products')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (err) throw new Error(err.message);
      setProducts((data || []) as Product[]);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar produtos');
      console.error('[useProducts Error]', err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(async (input: CreateProductInput) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { data, error: err } = await supabase
      .from('sales_products')
      .insert(input)
      .select()
      .single();

    if (err) throw new Error(err.message);
    await fetchProducts();
    return data as Product;
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: string, updates: UpdateProductInput) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { error: err } = await supabase
      .from('sales_products')
      .update(updates)
      .eq('id', id);

    if (err) throw new Error(err.message);
    await fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

    const { error: err } = await supabase
      .from('sales_products')
      .update({ is_active: false })
      .eq('id', id);

    if (err) throw new Error(err.message);
    await fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, createProduct, updateProduct, deleteProduct, refetch: fetchProducts };
};

export default useProducts;
