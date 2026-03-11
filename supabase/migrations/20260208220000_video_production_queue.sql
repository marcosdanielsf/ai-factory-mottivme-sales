-- =====================================================
-- Video Production Queue System
-- =====================================================
-- Purpose: Manages AI video production pipeline for Vertex Sales Solutions
-- Pipeline: Script → ElevenLabs (voice clone) → HeyGen (AI avatar) → publish
-- Created: 2026-02-08
-- =====================================================

-- =====================================================
-- Table: video_production_queue
-- =====================================================
-- Main queue table for video production jobs
-- Tracks entire lifecycle from script to published content

CREATE TABLE IF NOT EXISTS video_production_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Content
    title text NOT NULL,
    script text NOT NULL,
    format text NOT NULL DEFAULT 'reel' CHECK (format IN ('reel', 'short', 'long', 'carrossel')),
    duration_target integer, -- target duration in seconds (30, 45, 60, 120, 600, 900)
    taco_track text CHECK (taco_track IN ('T', 'A', 'C', 'O', 'H')), -- content track

    -- Status tracking
    status text NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'audio_generating',
        'audio_ready',
        'video_generating',
        'video_ready',
        'publishing',
        'published',
        'failed'
    )),
    error_message text,

    -- Provider IDs and URLs
    voice_id text, -- ElevenLabs voice ID
    avatar_id text, -- HeyGen avatar ID
    audio_url text, -- ElevenLabs generated audio URL
    video_url text, -- HeyGen generated video URL
    thumbnail_url text,
    elevenlabs_request_id text, -- for polling ElevenLabs API
    heygen_video_id text, -- for polling HeyGen API

    -- Publishing
    publish_channels jsonb NOT NULL DEFAULT '[]'::jsonb, -- array: ["instagram", "linkedin", "youtube", "tiktok"]
    publish_results jsonb NOT NULL DEFAULT '{}'::jsonb, -- results per channel with URLs
    scheduled_at timestamptz, -- when to publish (null = manual trigger)
    published_at timestamptz,

    -- Metadata and brand
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb, -- hashtags, description, CTA, etc.
    brand text NOT NULL DEFAULT 'vertex' CHECK (brand IN ('vertex', 'socialfy', 'mottivme'))
);

COMMENT ON TABLE video_production_queue IS 'Main queue for AI video production jobs - tracks script to published content pipeline';
COMMENT ON COLUMN video_production_queue.format IS 'Video format: reel (IG/TikTok), short (YouTube), long (YouTube), carrossel (static slides)';
COMMENT ON COLUMN video_production_queue.taco_track IS 'Content track: T=Trust, A=Awareness, C=Consideration, O=Objection, H=Hand Raiser';
COMMENT ON COLUMN video_production_queue.status IS 'Pipeline status: draft → audio_generating → audio_ready → video_generating → video_ready → publishing → published';
COMMENT ON COLUMN video_production_queue.publish_channels IS 'Array of target channels: ["instagram", "linkedin", "youtube", "tiktok"]';
COMMENT ON COLUMN video_production_queue.publish_results IS 'Object with results per channel: {"instagram": {"url": "...", "published_at": "..."}}';
COMMENT ON COLUMN video_production_queue.metadata IS 'Extra data: hashtags, description, CTA, thumbnail overrides, etc.';

-- =====================================================
-- Table: video_avatars
-- =====================================================
-- Stores AI avatar configurations for different brands and people

CREATE TABLE IF NOT EXISTS video_avatars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Avatar identity
    name text NOT NULL, -- 'Andre Rosa', 'Marcos Daniels'
    provider text NOT NULL DEFAULT 'heygen' CHECK (provider IN ('heygen', 'did', 'synthesia')),
    provider_avatar_id text NOT NULL, -- the ID from the provider

    -- Brand and locale
    brand text NOT NULL DEFAULT 'vertex' CHECK (brand IN ('vertex', 'socialfy', 'mottivme')),
    language text NOT NULL DEFAULT 'pt-BR',
    is_active boolean NOT NULL DEFAULT true,

    -- Extra data
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    UNIQUE (provider, provider_avatar_id)
);

COMMENT ON TABLE video_avatars IS 'AI avatar configurations for video production (HeyGen, D-ID, Synthesia)';
COMMENT ON COLUMN video_avatars.provider_avatar_id IS 'Avatar ID from the provider API (e.g., HeyGen avatar ID)';
COMMENT ON COLUMN video_avatars.is_active IS 'Whether this avatar is available for new videos';

-- =====================================================
-- Table: video_voices
-- =====================================================
-- Stores voice clone configurations for different brands and people

CREATE TABLE IF NOT EXISTS video_voices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Voice identity
    name text NOT NULL, -- 'Andre Rosa', 'Marcos Daniels'
    provider text NOT NULL DEFAULT 'elevenlabs' CHECK (provider IN ('elevenlabs', 'openai', 'azure')),
    provider_voice_id text NOT NULL, -- the ID from ElevenLabs

    -- Brand and locale
    brand text NOT NULL DEFAULT 'vertex' CHECK (brand IN ('vertex', 'socialfy', 'mottivme')),
    language text NOT NULL DEFAULT 'pt-BR',
    is_active boolean NOT NULL DEFAULT true,

    -- Extra data
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    UNIQUE (provider, provider_voice_id)
);

COMMENT ON TABLE video_voices IS 'Voice clone configurations for audio generation (ElevenLabs, OpenAI, Azure)';
COMMENT ON COLUMN video_voices.provider_voice_id IS 'Voice ID from the provider API (e.g., ElevenLabs voice ID)';
COMMENT ON COLUMN video_voices.is_active IS 'Whether this voice is available for new videos';

-- =====================================================
-- Indexes
-- =====================================================

-- video_production_queue indexes
CREATE INDEX IF NOT EXISTS idx_video_production_queue_status ON video_production_queue(status);
CREATE INDEX IF NOT EXISTS idx_video_production_queue_brand ON video_production_queue(brand);
CREATE INDEX IF NOT EXISTS idx_video_production_queue_scheduled
    ON video_production_queue(scheduled_at)
    WHERE status = 'video_ready';
CREATE INDEX IF NOT EXISTS idx_video_production_queue_created_at ON video_production_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_production_queue_brand_status ON video_production_queue(brand, status);

-- video_avatars indexes
CREATE INDEX IF NOT EXISTS idx_video_avatars_brand_active ON video_avatars(brand, is_active);
CREATE INDEX IF NOT EXISTS idx_video_avatars_provider ON video_avatars(provider);

-- video_voices indexes
CREATE INDEX IF NOT EXISTS idx_video_voices_brand_active ON video_voices(brand, is_active);
CREATE INDEX IF NOT EXISTS idx_video_voices_provider ON video_voices(provider);

-- =====================================================
-- Triggers
-- =====================================================

-- Updated_at trigger function (reuse if exists, create if not)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to video_production_queue
DROP TRIGGER IF EXISTS update_video_production_queue_updated_at ON video_production_queue;
CREATE TRIGGER update_video_production_queue_updated_at
    BEFORE UPDATE ON video_production_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE video_production_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_voices ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies (allow full access for backend)
CREATE POLICY "Service role has full access to video_production_queue"
    ON video_production_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to video_avatars"
    ON video_avatars
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to video_voices"
    ON video_voices
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can read (for dashboard/UI)
CREATE POLICY "Authenticated users can read video_production_queue"
    ON video_production_queue
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read video_avatars"
    ON video_avatars
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read video_voices"
    ON video_voices
    FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- Sample data (optional - comment out if not needed)
-- =====================================================

-- Sample voice: Andre Rosa (Vertex)
-- INSERT INTO video_voices (name, provider, provider_voice_id, brand, language, metadata)
-- VALUES (
--     'Andre Rosa',
--     'elevenlabs',
--     'TBD_VOICE_ID',
--     'vertex',
--     'pt-BR',
--     '{"description": "Voz do Andre Rosa para Vertex Sales Solutions"}'::jsonb
-- );

-- Sample avatar: Andre Rosa (Vertex)
-- INSERT INTO video_avatars (name, provider, provider_avatar_id, brand, language, metadata)
-- VALUES (
--     'Andre Rosa',
--     'heygen',
--     'TBD_AVATAR_ID',
--     'vertex',
--     'pt-BR',
--     '{"description": "Avatar do Andre Rosa para Vertex Sales Solutions"}'::jsonb
-- );

-- =====================================================
-- End of migration
-- =====================================================
