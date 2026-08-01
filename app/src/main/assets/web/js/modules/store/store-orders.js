import { supabase } from '../../supabase-config.js';

export async function fetchStoreOrders() {
    if (!supabase) return [];
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return [];
        
        // Find user's store
        let { data: store } = await supabase
            .from('stores')
            .select('id')
            .eq('merchant_id', session.user.id)
            .maybeSingle();
            
        if (!store && session.user.email) {
            const { data: storeByEmail } = await supabase
                .from('stores')
                .select('id')
                .or(`merchant_email.eq.${session.user.email},email.eq.${session.user.email}`)
                .maybeSingle();
            if (storeByEmail) store = storeByEmail;
        }
            
        if (!store) return [];
        
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
