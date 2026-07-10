-- =========================================================================
-- ZaLo Smart Algerian Multivendor Marketplace - PostgreSQL Session Cleanup
-- =========================================================================
-- This script schedules a daily cron job to purge expired, inactive, or
-- "ghost" sessions using pg_cron in Supabase.
-- =========================================================================

-- 1. Create the cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete sessions that are inactive, past their expiration time,
    -- or are older than 24 hours and have been marked inactive/zombie.
    DELETE FROM public.sessions
    WHERE is_active = FALSE 
       OR expires_at < NOW()
       OR (created_at < NOW() - INTERVAL '24 hours' AND is_active = FALSE);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '🧹 [Session Cleanup] Completed. Purged % expired/ghost sessions.', deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Schedule the cleanup using pg_cron (Daily at 3:00 AM)
-- Note: pg_cron is available natively on Supabase. Ensure pg_cron extension is enabled.
-- You can enable it via: CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
    'daily-session-cleanup', -- job name
    '0 3 * * *',             -- cron expression (daily at 3:00 AM)
    'SELECT public.cleanup_stale_sessions();'
);
