import { supabase } from '../../supabase-config.js';

export async function fetchStoreOrders() {
    if (!supabase) return [];
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return [];
        
        // Find user's store
        const { data: store, error: storeErr } = await supabase
            .from('stores')
            .select('id')
            .eq('merchant_id', session.user.id)
            .maybeSingle();
            
        if (!store || storeErr) return [];
        
        const { data, error } = await supabase
            .from('orders')
            .select('*, profiles(full_name, name, phone)')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error fetching store orders:", e);
        return [];
    }
}
