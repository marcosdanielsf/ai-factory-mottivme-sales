-- Migration: Adicionar location_id em brand_configs para lookup do AI Factory
-- Rollback: ALTER TABLE public.brand_configs DROP COLUMN IF EXISTS location_id;

ALTER TABLE public.brand_configs ADD COLUMN IF NOT EXISTS location_id TEXT;
CREATE INDEX IF NOT EXISTS idx_brand_configs_location_id ON public.brand_configs(location_id);

-- Atualizar brands existentes com location_ids do GHL
-- socialfy (Marcos Daniels)
UPDATE public.brand_configs SET location_id = 'cd1uyzpJox6XPt4Vct8Y' WHERE client_slug = 'socialfy';
-- dr-alberto-correia (Alberto Correia)
UPDATE public.brand_configs SET location_id = 'GT77iGk2WDneoHwtuq6D' WHERE client_slug = 'dr-alberto-correia';
-- dra-eline-lobo (Eline Lôbo)
UPDATE public.brand_configs SET location_id = 'pFHwENFUxjtiON94jn2k' WHERE client_slug = 'dra-eline-lobo';
-- vss (Vertex Sales Solutions)
UPDATE public.brand_configs SET location_id = 'ehlHgDeJS3sr8rCDcZtA' WHERE client_slug = 'vss';
-- lumar (Otica Lumar)
UPDATE public.brand_configs SET location_id = '4ncGXJgs8EC5zOplK3mT' WHERE client_slug = 'lumar';
