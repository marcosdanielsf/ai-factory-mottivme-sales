-- =============================================================================
-- 072_mindflow_rls_policies.sql
-- MindFlow: RLS policies + GRANT statements
-- Phase 01 Plan 01 - Foundation Schema
-- =============================================================================

-- ===========================================================================
-- ENABLE ROW LEVEL SECURITY on all 6 tables
-- ===========================================================================

ALTER TABLE mindflow_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- POLICIES (Phase 1: owner-based access)
-- Phase 7 will extend with role-based sharing
-- ===========================================================================

-- Boards: owner can do everything
DROP POLICY IF EXISTS mindflow_boards_owner ON mindflow_boards;
CREATE POLICY mindflow_boards_owner ON mindflow_boards
  FOR ALL
  USING (created_by = auth.uid());

-- Groups: access via board ownership
DROP POLICY IF EXISTS mindflow_groups_via_board ON mindflow_groups;
CREATE POLICY mindflow_groups_via_board ON mindflow_groups
  FOR ALL
  USING (board_id IN (SELECT id FROM mindflow_boards WHERE created_by = auth.uid()));

-- Items: access via board ownership
DROP POLICY IF EXISTS mindflow_items_via_board ON mindflow_items;
CREATE POLICY mindflow_items_via_board ON mindflow_items
  FOR ALL
  USING (board_id IN (SELECT id FROM mindflow_boards WHERE created_by = auth.uid()));

-- Views: access via board ownership
DROP POLICY IF EXISTS mindflow_views_via_board ON mindflow_views;
CREATE POLICY mindflow_views_via_board ON mindflow_views
  FOR ALL
  USING (board_id IN (SELECT id FROM mindflow_boards WHERE created_by = auth.uid()));

-- Dashboards: owner can do everything
DROP POLICY IF EXISTS mindflow_dashboards_owner ON mindflow_dashboards;
CREATE POLICY mindflow_dashboards_owner ON mindflow_dashboards
  FOR ALL
  USING (created_by = auth.uid());

-- Widgets: access via dashboard ownership
DROP POLICY IF EXISTS mindflow_widgets_via_dashboard ON mindflow_dashboard_widgets;
CREATE POLICY mindflow_widgets_via_dashboard ON mindflow_dashboard_widgets
  FOR ALL
  USING (dashboard_id IN (SELECT id FROM mindflow_dashboards WHERE created_by = auth.uid()));

-- ===========================================================================
-- GRANT ALL on all 6 tables to authenticated role
-- ===========================================================================

GRANT ALL ON mindflow_boards TO authenticated;
GRANT ALL ON mindflow_groups TO authenticated;
GRANT ALL ON mindflow_items TO authenticated;
GRANT ALL ON mindflow_views TO authenticated;
GRANT ALL ON mindflow_dashboards TO authenticated;
GRANT ALL ON mindflow_dashboard_widgets TO authenticated;
