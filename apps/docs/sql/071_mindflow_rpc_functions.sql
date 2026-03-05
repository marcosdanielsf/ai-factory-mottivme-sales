-- =============================================================================
-- 071_mindflow_rpc_functions.sql
-- MindFlow: 5 RPC functions for atomic CRUD operations
-- Phase 01 Plan 01 - Foundation Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. mindflow_update_column_value
--    Atomic merge of a single column value into item's column_values JSONB
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mindflow_update_column_value(
  p_item_id UUID,
  p_column_id TEXT,
  p_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE mindflow_items
  SET column_values = column_values || jsonb_build_object(p_column_id, p_value)
  WHERE id = p_item_id
  RETURNING column_values INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Item % not found', p_item_id;
  END IF;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. mindflow_update_column_values
--    Batch merge of multiple column values into item's column_values JSONB
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mindflow_update_column_values(
  p_item_id UUID,
  p_values JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE mindflow_items
  SET column_values = column_values || p_values
  WHERE id = p_item_id
  RETURNING column_values INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Item % not found', p_item_id;
  END IF;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. mindflow_create_board
--    Creates board + default group + default view in a single transaction
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mindflow_create_board(
  p_name TEXT,
  p_created_by UUID,
  p_columns JSONB DEFAULT '[]'::jsonb,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_board_id UUID;
  v_group_id UUID;
  v_view_id UUID;
BEGIN
  -- Create board
  INSERT INTO mindflow_boards (name, description, columns, created_by)
  VALUES (p_name, p_description, p_columns, p_created_by)
  RETURNING id INTO v_board_id;

  -- Create default group
  INSERT INTO mindflow_groups (board_id, name, color, position)
  VALUES (v_board_id, 'New Group', '#6C5CE7', 'a0')
  RETURNING id INTO v_group_id;

  -- Create default view
  INSERT INTO mindflow_views (board_id, name, type, is_default, created_by)
  VALUES (v_board_id, 'Main Table', 'table', true, p_created_by)
  RETURNING id INTO v_view_id;

  RETURN jsonb_build_object(
    'board_id', v_board_id,
    'group_id', v_group_id,
    'view_id', v_view_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. mindflow_move_item
--    Move item to a different group and/or position
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mindflow_move_item(
  p_item_id UUID,
  p_target_group_id UUID,
  p_new_position TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mindflow_items
  SET group_id = p_target_group_id,
      position = p_new_position,
      updated_at = now()
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item % not found', p_item_id;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. mindflow_reorder_group
--    Change a group's position (fractional index)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mindflow_reorder_group(
  p_group_id UUID,
  p_new_position TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mindflow_groups
  SET position = p_new_position,
      updated_at = now()
  WHERE id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Group % not found', p_group_id;
  END IF;
END;
$$;
