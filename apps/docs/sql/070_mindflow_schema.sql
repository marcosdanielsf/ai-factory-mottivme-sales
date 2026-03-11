-- =============================================================================
-- 070_mindflow_schema.sql
-- MindFlow: 6 tables + indexes + updated_at triggers
-- Phase 01 Plan 01 - Foundation Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. mindflow_boards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mindflow_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'New Board',
  description TEXT,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_order TEXT[] NOT NULL DEFAULT '{}',
  icon TEXT DEFAULT 'table-2',
  color TEXT DEFAULT '#6C5CE7',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. mindflow_groups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mindflow_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES mindflow_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Group',
  color TEXT DEFAULT '#6C5CE7',
  position TEXT NOT NULL,
  is_collapsed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. mindflow_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mindflow_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES mindflow_boards(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES mindflow_groups(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES mindflow_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  column_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  position TEXT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. mindflow_views
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mindflow_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES mindflow_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Main Table',
  type TEXT NOT NULL DEFAULT 'table' CHECK (type IN ('table', 'kanban', 'calendar')),
  position INTEGER NOT NULL DEFAULT 0,
  filters JSONB DEFAULT '[]'::jsonb,
  sort_config JSONB DEFAULT '[]'::jsonb,
  group_by TEXT,
  hidden_columns TEXT[] DEFAULT '{}',
  column_widths JSONB DEFAULT '{}'::jsonb,
  kanban_config JSONB,
  calendar_config JSONB,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. mindflow_dashboards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mindflow_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES mindflow_boards(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'New Dashboard',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. mindflow_dashboard_widgets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mindflow_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES mindflow_dashboards(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  layout JSONB DEFAULT '{"x":0,"y":0,"w":6,"h":4}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================================================
-- INDEXES
-- ===========================================================================

-- Items: board lookup (excluding archived)
CREATE INDEX IF NOT EXISTS idx_mindflow_items_board
  ON mindflow_items(board_id) WHERE NOT is_archived;

-- Items: group lookup
CREATE INDEX IF NOT EXISTS idx_mindflow_items_group
  ON mindflow_items(group_id);

-- Items: parent lookup for subitems (Phase 6)
CREATE INDEX IF NOT EXISTS idx_mindflow_items_parent
  ON mindflow_items(parent_id) WHERE parent_id IS NOT NULL;

-- Items: position ordering within group
CREATE INDEX IF NOT EXISTS idx_mindflow_items_position
  ON mindflow_items(board_id, group_id, position);

-- Items: JSONB column_values search (GIN with jsonb_path_ops)
CREATE INDEX IF NOT EXISTS idx_mindflow_items_colvals
  ON mindflow_items USING GIN(column_values jsonb_path_ops);

-- Groups: board lookup
CREATE INDEX IF NOT EXISTS idx_mindflow_groups_board
  ON mindflow_groups(board_id);

-- Views: board lookup
CREATE INDEX IF NOT EXISTS idx_mindflow_views_board
  ON mindflow_views(board_id);

-- Widgets: dashboard lookup
CREATE INDEX IF NOT EXISTS idx_mindflow_widgets_dashboard
  ON mindflow_dashboard_widgets(dashboard_id);

-- ===========================================================================
-- TRIGGER FUNCTION: auto-set updated_at
-- ===========================================================================

CREATE OR REPLACE FUNCTION mindflow_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- TRIGGERS: attach updated_at to 5 tables
-- ===========================================================================

DROP TRIGGER IF EXISTS trg_mindflow_boards_updated_at ON mindflow_boards;
CREATE TRIGGER trg_mindflow_boards_updated_at
  BEFORE UPDATE ON mindflow_boards
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();

DROP TRIGGER IF EXISTS trg_mindflow_groups_updated_at ON mindflow_groups;
CREATE TRIGGER trg_mindflow_groups_updated_at
  BEFORE UPDATE ON mindflow_groups
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();

DROP TRIGGER IF EXISTS trg_mindflow_items_updated_at ON mindflow_items;
CREATE TRIGGER trg_mindflow_items_updated_at
  BEFORE UPDATE ON mindflow_items
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();

DROP TRIGGER IF EXISTS trg_mindflow_views_updated_at ON mindflow_views;
CREATE TRIGGER trg_mindflow_views_updated_at
  BEFORE UPDATE ON mindflow_views
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();

DROP TRIGGER IF EXISTS trg_mindflow_dashboards_updated_at ON mindflow_dashboards;
CREATE TRIGGER trg_mindflow_dashboards_updated_at
  BEFORE UPDATE ON mindflow_dashboards
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();
