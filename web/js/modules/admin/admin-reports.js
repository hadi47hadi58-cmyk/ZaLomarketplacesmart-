import { supabase } from '../../supabase-config.js';

export async function fetchAdminReports() {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*, stores(name, store_name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Error fetching admin reports:", e);
        return [];
    }
}
