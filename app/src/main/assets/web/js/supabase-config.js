// ZaLo Marketplace Smart Sync Update: 2026-07-16
// ZaLo Smart Marketplace - Supabase Config (supabase-config.js)
// This file initializes the Supabase Client for the client-side Web Application.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase Credentials
const SUPABASE_URL = window.SUPABASE_URL || "SUPABASE_URL_PLACEHOLDER";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "SUPABASE_KEY_PLACEHOLDER";

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// Helper for Secure Authenticated Session
export async function getSessionUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Failed to fetch session:", error.message);
        return null;
    }
    return session ? session.user : null;
}

// Expose globally for backward compatibility
window.supabase = supabase;
window.supabaseGetSessionUser = getSessionUser;

console.log("Supabase Client initialized successfully for ZaLo Smart.");
