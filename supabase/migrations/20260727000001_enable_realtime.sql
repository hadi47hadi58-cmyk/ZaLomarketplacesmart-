-- =====================================================================
-- Migration: Enable Realtime for core tables
-- Date: 2026-07-27
-- =====================================================================

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['merchant_requests', 'stores', 'profiles', 'career_applications', 'notifications']) LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
        EXCEPTION WHEN duplicate_object THEN
            -- Table is already in the publication
            NULL;
        WHEN undefined_object THEN
            -- Publication might not exist or table might not exist
            NULL;
        END;
    END LOOP;
END $$;
