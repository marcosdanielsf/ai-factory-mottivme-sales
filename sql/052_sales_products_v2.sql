-- ============================================================================
-- 052: Sales Products v2 - Catalogo com imagens, descricao, categorias
-- Expande sales_products para suportar pagina de catalogo completa
-- ============================================================================

ALTER TABLE sales_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sales_products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE sales_products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'geral';
ALTER TABLE sales_products ADD COLUMN IF NOT EXISTS compare_price DECIMAL(10,2);
ALTER TABLE sales_products ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_sales_products_category
  ON sales_products(location_id, category) WHERE is_active = TRUE;

COMMENT ON COLUMN sales_products.description IS 'Descricao do produto/servico';
COMMENT ON COLUMN sales_products.image_url IS 'URL da imagem do produto (Supabase Storage)';
COMMENT ON COLUMN sales_products.category IS 'Categoria do produto para filtros';
COMMENT ON COLUMN sales_products.compare_price IS 'Preco original (para exibir desconto)';
COMMENT ON COLUMN sales_products.metadata IS 'Dados extras do produto (specs, tags, etc)';
