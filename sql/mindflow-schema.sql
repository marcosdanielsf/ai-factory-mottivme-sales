-- migration: 001-mindflow-schema.sql
-- autor: supabase-dba agent
-- data: 2026-03-04
-- descricao: Schema inicial do MindFlow v5 — tabelas mindflow_maps e mindflow_elements
--            com RLS, indices e trigger de updated_at

-- ============================================================
-- DOWN (rollback) — descomentar para reverter
-- ============================================================
-- BEGIN;
--
-- DROP POLICY IF EXISTS "elements_via_map" ON public.mindflow_elements;
-- DROP POLICY IF EXISTS "owner_access_elements_insert" ON public.mindflow_elements;
-- DROP POLICY IF EXISTS "owner_access_elements_update" ON public.mindflow_elements;
-- DROP POLICY IF EXISTS "owner_access_elements_delete" ON public.mindflow_elements;
-- DROP TABLE IF EXISTS public.mindflow_elements;
--
-- DROP POLICY IF EXISTS "owner_access" ON public.mindflow_maps;
-- DROP POLICY IF EXISTS "owner_access_maps_insert" ON public.mindflow_maps;
-- DROP POLICY IF EXISTS "owner_access_maps_update" ON public.mindflow_maps;
-- DROP POLICY IF EXISTS "owner_access_maps_delete" ON public.mindflow_maps;
-- DROP TABLE IF EXISTS public.mindflow_maps;
--
-- COMMIT;

-- ============================================================
-- UP
-- ============================================================
BEGIN;

-- Requer extensao moddatetime para trigger de updated_at automatico
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ------------------------------------------------------------
-- Tabela: mindflow_maps
-- Um registro por mapa mental. Referencia o usuario do Supabase Auth.
-- org_id e opcional para suporte futuro a multi-tenant por organizacao.
-- layout enum em texto para flexibilidade sem DDL adicional em cada novo algoritmo.
-- viewport JSONB armazena {x, y, zoom} — persiste posicao da camera entre sessoes.
-- thumbnail_url aponta para Supabase Storage (PNG ~150x100 gerado ao fechar o editor).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mindflow_maps (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        UUID,                                           -- multi-tenant futuro
  title         TEXT        NOT NULL DEFAULT 'Novo Mapa',
  layout        TEXT        NOT NULL DEFAULT 'radial',          -- radial | tree | horizontal | vertical | organic | timeline
  viewport      JSONB       NOT NULL DEFAULT '{"x":0,"y":0,"zoom":1}',
  thumbnail_url TEXT,                                           -- Supabase Storage path, gerado pelo cliente
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: atualiza updated_at automaticamente em qualquer UPDATE
CREATE TRIGGER set_updated_at_mindflow_maps
  BEFORE UPDATE ON public.mindflow_maps
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ------------------------------------------------------------
-- Tabela: mindflow_elements
-- Tabela polimorfica: armazena todos os tipos de elementos do canvas.
-- type define o contrato do campo `data` JSONB (ver 04-architecture.md secao 3.2).
-- Tipos validos: node | sticky | text | shape | frame | image | drawing | comment | connection
-- x, y: coordenadas no canvas (sistema de coordenadas do viewport SVG).
-- width, height: nullable pois alguns tipos (ex: drawing) definem tamanho pelo conteudo.
-- rotation: graus, 0 = sem rotacao.
-- z_index: ordem de renderizacao (maior = mais a frente).
-- parent_id: auto-referencia para suporte a hierarquia (nos filhos, elementos dentro de frames).
-- data: payload especifico por tipo — validacao ocorre na camada de aplicacao (TypeScript).
-- Cascade DELETE: ao deletar um mapa, todos os elementos sao removidos automaticamente.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mindflow_elements (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id        UUID        NOT NULL REFERENCES public.mindflow_maps(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL,
  x             FLOAT       NOT NULL DEFAULT 0,
  y             FLOAT       NOT NULL DEFAULT 0,
  width         FLOAT,                                          -- null para tipos de tamanho dinamico
  height        FLOAT,
  rotation      FLOAT       NOT NULL DEFAULT 0,
  z_index       INT         NOT NULL DEFAULT 0,
  parent_id     UUID        REFERENCES public.mindflow_elements(id) ON DELETE SET NULL,
  data          JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: atualiza updated_at automaticamente em qualquer UPDATE
CREATE TRIGGER set_updated_at_mindflow_elements
  BEFORE UPDATE ON public.mindflow_elements
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ------------------------------------------------------------
-- Indices
-- idx_elements_map_id: consulta principal — carregar todos os elementos de um mapa.
--   Usado pelo auto-save (DELETE + bulk INSERT por map_id) e pelo load inicial.
-- idx_elements_parent_id: arvore de hierarquia — getChildren(parentId) no canvasStore.
-- idx_elements_type: filtrar por tipo (ex: listar apenas comentarios de um mapa).
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elements_map_id
  ON public.mindflow_elements(map_id);

CREATE INDEX IF NOT EXISTS idx_elements_parent_id
  ON public.mindflow_elements(parent_id);

CREATE INDEX IF NOT EXISTS idx_elements_type
  ON public.mindflow_elements(type);

-- Indice adicional: busca de mapas por usuario (lista de mapas na home page)
CREATE INDEX IF NOT EXISTS idx_maps_user_id
  ON public.mindflow_maps(user_id);

-- ------------------------------------------------------------
-- RLS: mindflow_maps
-- Politica owner_access: usuario autenticado acessa APENAS seus proprios mapas (SELECT).
-- Politicas separadas para INSERT/UPDATE/DELETE para controle granular.
-- Service role bypassa RLS por padrao no Supabase (nao precisa de policy adicional).
-- ------------------------------------------------------------
ALTER TABLE public.mindflow_maps ENABLE ROW LEVEL SECURITY;

-- Leitura: usuario ve apenas seus proprios mapas
CREATE POLICY "owner_access"
  ON public.mindflow_maps
  FOR SELECT
  USING (user_id = auth.uid());

-- Criacao: usuario so pode criar mapas para si mesmo
CREATE POLICY "owner_access_maps_insert"
  ON public.mindflow_maps
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Atualizacao: usuario so pode editar seus proprios mapas
CREATE POLICY "owner_access_maps_update"
  ON public.mindflow_maps
  FOR UPDATE
  USING (user_id = auth.uid());

-- Delecao: usuario so pode deletar seus proprios mapas
CREATE POLICY "owner_access_maps_delete"
  ON public.mindflow_maps
  FOR DELETE
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- RLS: mindflow_elements
-- Politica elements_via_map: acesso indireto via ownership do mapa pai.
-- O usuario acessa elementos se e dono do mapa referenciado por map_id.
-- Subquery em mindflow_maps e eficiente gracias ao idx_maps_user_id.
-- ------------------------------------------------------------
ALTER TABLE public.mindflow_elements ENABLE ROW LEVEL SECURITY;

-- Leitura: usuario ve elementos de mapas que lhe pertencem
CREATE POLICY "elements_via_map"
  ON public.mindflow_elements
  FOR SELECT
  USING (
    map_id IN (
      SELECT id FROM public.mindflow_maps
      WHERE user_id = auth.uid()
    )
  );

-- Criacao: usuario so pode inserir elementos em seus proprios mapas
CREATE POLICY "owner_access_elements_insert"
  ON public.mindflow_elements
  FOR INSERT
  WITH CHECK (
    map_id IN (
      SELECT id FROM public.mindflow_maps
      WHERE user_id = auth.uid()
    )
  );

-- Atualizacao: usuario so pode editar elementos de seus proprios mapas
CREATE POLICY "owner_access_elements_update"
  ON public.mindflow_elements
  FOR UPDATE
  USING (
    map_id IN (
      SELECT id FROM public.mindflow_maps
      WHERE user_id = auth.uid()
    )
  );

-- Delecao: usuario so pode deletar elementos de seus proprios mapas
CREATE POLICY "owner_access_elements_delete"
  ON public.mindflow_elements
  FOR DELETE
  USING (
    map_id IN (
      SELECT id FROM public.mindflow_maps
      WHERE user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- GRANT: permissoes para o role authenticated
-- Service role ja tem acesso total por padrao no Supabase.
-- ------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mindflow_maps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mindflow_elements TO authenticated;

COMMIT;
