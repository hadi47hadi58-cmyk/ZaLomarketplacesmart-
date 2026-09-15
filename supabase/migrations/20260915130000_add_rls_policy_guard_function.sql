-- =====================================================================
-- Migration: RLS policy guard function
-- Date: 2026-09-15
--
-- Adds public.check_dangerous_rls_policies(), a SECURITY DEFINER function
-- that reports any RLS policy on the sensitive tables (stores, products,
-- orders, users) whose name starts with temp_/allow_all_/test_, or whose
-- INSERT/UPDATE/DELETE condition is unconditionally `true` — the exact
-- shape of the 10 policies removed in
-- 20260915120000_remove_overly_permissive_temp_policies.sql.
--
-- It intentionally does NOT flag public SELECT policies in general
-- (browsing products/shops/reviews without login is normal, intended
-- behavior for this marketplace) — only unrestricted writes, or clearly
-- temporary/test-named policies, on the four sensitive tables.
--
-- The function returns only policy/table/command names — never row data —
-- so it is safe to expose to the `anon` and `authenticated` roles and call
-- from CI (scripts/check-rls-policies.js) using the existing public anon
-- key, with no new secrets required.
--
-- This migration was already applied directly to production on
-- 2026-09-15; this file documents that change in version control.
-- =====================================================================

create or replace function public.check_dangerous_rls_policies()
returns table(tablename text, policyname text, cmd text)
language sql
security definer
set search_path = public
as $$
  select p.tablename::text, p.policyname::text, p.cmd::text
  from pg_policies p
  where p.schemaname = 'public'
    and p.tablename in ('stores','products','orders','users')
    and (
      p.policyname ilike 'temp_%'
      or p.policyname ilike 'allow_all_%'
      or p.policyname ilike 'test_%'
      or (
        p.cmd in ('INSERT','UPDATE','DELETE')
        and (p.qual = 'true' or p.with_check = 'true')
      )
    );
$$;

grant execute on function public.check_dangerous_rls_policies() to anon, authenticated;
