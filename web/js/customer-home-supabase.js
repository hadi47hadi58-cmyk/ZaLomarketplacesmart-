import { supabase } from '../supabase-config.js';

export async function fetchLiveStories() {
    try {
        const { data, error } = await supabase.from('market_posts').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching stories:", error);
            return null;
        }
        return data;
    } catch (e) {
        console.error("Supabase exception:", e);
        return null;
    }
}

export async function fetchStoresDirectory() {
    try {
        const { data, error } = await supabase.from('stores').select('*').order('wilaya', { ascending: true });
        if (error) {
            console.error("Error fetching stores:", error);
            return null;
        }
        return data;
    } catch (e) {
        console.error("Supabase exception:", e);
        return null;
    }
}

export async function fetchProducts() {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching products:", error);
            return null;
        }
        return data;
    } catch (e) {
        console.error("Supabase exception:", e);
        return null;
    }
}
