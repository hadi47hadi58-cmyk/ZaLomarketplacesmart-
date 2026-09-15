#!/usr/bin/env node
/**
 * scripts/check-rls-policies.js
 *
 * CI guard: fails the build if any temp/test/allow_all-style RLS policy,
 * or any unrestricted (true) INSERT/UPDATE/DELETE policy, is present on
 * the sensitive tables (stores, products, orders, users).
 *
 * This calls the public.check_dangerous_rls_policies() SQL function
 * (see supabase/migrations/20260915130000_add_rls_policy_guard_function.sql)
 * via PostgREST using the existing public anon key — no service_role key
 * or database password is needed, and this script never prints the
 * specific policy names it finds, only that a check failed.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('dummy-project')) {
    console.log('RLS guard: SUPABASE_URL/SUPABASE_KEY not configured for this build, skipping check.');
    process.exit(0);
  }

  let res;
  try {
    res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/check_dangerous_rls_policies`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
  } catch (e) {
    console.error('RLS guard: could not reach the policy-check endpoint.');
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`RLS guard: policy-check endpoint returned HTTP ${res.status}.`);
    process.exit(1);
  }

  let rows;
  try {
    rows = await res.json();
  } catch (e) {
    console.error('RLS guard: could not parse the policy-check response.');
    process.exit(1);
  }

  if (Array.isArray(rows) && rows.length > 0) {
    console.error(`RLS guard: تم رصد ${rows.length} سياسة RLS مفتوحة، راجع سجل الفحص.`);
    process.exit(1);
  }

  console.log('RLS guard: no dangerous policies detected. ✅');
}

main().catch(() => {
  console.error('RLS guard: unexpected error while checking policies.');
  process.exit(1);
});
