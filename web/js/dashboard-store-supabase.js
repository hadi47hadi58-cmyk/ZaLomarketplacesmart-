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

export async function uploadFileToSupabase(file, folder = 'media') {
    if (!supabase || !file) return null;
    try {
        const fileExt = file.name ? file.name.split('.').pop() : 'bin';
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Try uploading to 'media' bucket (most common name)
        const { data, error } = await supabase.storage.from('media').upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

        if (error) {
            console.warn("Supabase storage upload error:", error);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
        return publicUrl;
    } catch (e) {
        console.error("Supabase storage exception:", e);
        return null;
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
