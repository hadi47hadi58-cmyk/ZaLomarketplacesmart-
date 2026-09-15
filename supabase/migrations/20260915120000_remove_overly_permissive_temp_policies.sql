-- =====================================================================
-- Migration: Remove overly permissive temporary RLS policies
-- Date: 2026-09-15
--
-- Context: these ten policies were applied directly to the production
-- database during earlier development/testing and were never scoped to
-- authenticated users or record ownership. In their previous form they
-- allowed ANY visitor (including fully anonymous, unauthenticated
-- requests) to read, insert, update, or delete ANY row in the `stores`,
-- `products`, and `orders` tables — i.e. any visitor could read, modify,
-- or delete any store, any product, or any order belonging to any other
-- user, with no ownership or authentication check whatsoever.
--
-- These policies have already been dropped directly on the production
-- database as of 2026-09-15. This migration file exists purely to
-- document that change in version control so the repository accurately
-- reflects the live security posture of the database — it is a record
-- of an action already taken, not a pending change to apply.
-- =====================================================================

-- Table: stores
DROP POLICY IF EXISTS "Public stores access" ON public.stores;
DROP POLICY IF EXISTS stores_insert_policy ON public.stores;
DROP POLICY IF EXISTS stores_update_policy ON public.stores;

-- Table: products
DROP POLICY IF EXISTS "Public products access" ON public.products;
DROP POLICY IF EXISTS products_delete_policy ON public.products;
DROP POLICY IF EXISTS products_update_policy ON public.products;
DROP POLICY IF EXISTS products_insert_policy ON public.products;

-- Table: orders
DROP POLICY IF EXISTS temp_allow_insert ON public.orders;
DROP POLICY IF EXISTS temp_allow_select ON public.orders;
DROP POLICY IF EXISTS allow_all_select ON public.orders;
