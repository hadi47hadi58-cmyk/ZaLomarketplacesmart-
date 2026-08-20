import { supabase } from '../supabase-config.js';

export async function addProductToSupabase(productData) {
    if (!supabase) return false;
    try {
        const { data, error } = await supabase.from('products').insert([productData]);
        if (error) {
            console.error("Error inserting product:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Supabase insert exception:", e);
        return false;
    }
}

export async function addStoryToSupabase(storyData) {
    if (!supabase) return false;
    try {
        const { data, error } = await supabase.from('market_posts').insert([storyData]);
        if (error) {
            console.error("Error inserting story:", error);
            return false;
        }
        return true;
    } catch (e) {
        console.error("Supabase insert exception:", e);
        return false;
    }
}
