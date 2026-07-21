// ZaLo Marketplace Smart Sync Update: 2026-07-21
// ZaLo Smart Marketplace - Supabase SSR Config (supabase-config.js)
// Initializing Supabase Client with SSR capabilities for enhanced security.

import { createBrowserClient } from 'https://cdn.jsdelivr.net/npm/@supabase/ssr@0.5.2/+esm';

// Supabase Credentials
const SUPABASE_URL = window.SUPABASE_URL || "https://xwwzadxsqmmxerbolovz.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3d3phZHhzcW1teGVyYm9sb3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDkzNTAsImV4cCI6MjA5Nzk4NTM1MH0.j8UJu80Gtkr1ocxG0fhbFaNja8EiRFGu53sdEFyxck4";

// Initialize Supabase Client
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'zalo_auth_session', // موحد لضمان التزامن
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

console.log("Supabase Client initialized successfully with SSR capabilities for ZaLo Smart.");
