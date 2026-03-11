-- Phase 10: Allow authenticated users to update stage configs
-- Apply manually via Supabase SQL Editor before inline editing will work.
DROP POLICY IF EXISTS "auth update cjm_stage_config" ON cjm_stage_config;
CREATE POLICY "auth update cjm_stage_config"
  ON cjm_stage_config FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
