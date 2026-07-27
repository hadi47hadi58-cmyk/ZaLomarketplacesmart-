import { supabase } from '../../supabase-config.js';

export async function fetchAllProducts() {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, stores(name, store_name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error fetching products:", e);
        return [];
    }
}
