-- =============================================================================
-- Migration: 009b_fix_orphan_leads.sql
-- Purpose: Fix orphan leads that have NULL tenant_id
-- Date: 2026-01-29
-- Author: Security Review Fix
-- =============================================================================

-- IMPORTANTE: Execute esta migration ANTES da 009_auth_tenant.sql atualizada
-- para garantir que todos os leads tenham um tenant_id válido.

-- =============================================================================
-- PART 1: IDENTIFY ORPHAN LEADS
-- =============================================================================

-- Count orphan leads (for logging/verification)
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count 
    FROM public.growth_leads 
    WHERE tenant_id IS NULL;
    
    RAISE NOTICE 'Found % orphan leads with NULL tenant_id', orphan_count;
END $$;

-- =============================================================================
-- PART 2: CREATE DEFAULT TENANT IF NOT EXISTS
-- =============================================================================

-- Ensure we have at least one tenant to assign orphans to
INSERT INTO public.tenants (
    id,
    company_name,
    slug,
    plan,
    status,
    settings
)
SELECT 
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Sistema (Leads Legados)',
    'sistema-legado',
    'free',
    'active',
    '{"is_system": true, "migration_created": true}'::JSONB
WHERE NOT EXISTS (
    SELECT 1 FROM public.tenants LIMIT 1
);

-- =============================================================================
-- PART 3: ASSIGN ORPHAN LEADS TO DEFAULT TENANT
-- =============================================================================

-- Update all orphan leads to use the first available tenant
-- (or the system tenant we just created)
UPDATE public.growth_leads 
SET tenant_id = (
    SELECT id FROM public.tenants 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE tenant_id IS NULL;

-- =============================================================================
-- PART 4: VERIFICATION
-- =============================================================================

-- Verify no more orphans exist
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count 
    FROM public.growth_leads 
    WHERE tenant_id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % orphan leads still exist', orphan_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All leads now have a valid tenant_id';
    END IF;
END $$;

-- =============================================================================
-- PART 5: MAKE tenant_id NOT NULL (OPTIONAL - run manually after verification)
-- =============================================================================

-- UNCOMMENT AFTER VERIFYING THE MIGRATION WORKED:
-- ALTER TABLE public.growth_leads 
--     ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================================================
-- ROLLBACK (if needed)
-- =============================================================================

-- To rollback, you can set tenant_id back to NULL for system tenant leads:
-- UPDATE public.growth_leads 
-- SET tenant_id = NULL 
-- WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
