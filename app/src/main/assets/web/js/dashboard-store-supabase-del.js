import { supabase } from '../supabase-config.js';

export async function deleteProductFromSupabase(productId) {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        return !error;
    } catch (e) { return false; }
}

export async function deleteStoryFromSupabase(storyId) {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('market_posts').delete().eq('id', storyId);
        return !error;
    } catch (e) { return false; }
}
