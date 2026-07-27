import { supabase } from '../../supabase-config.js';

export async function fetchActiveStores() {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("[admin-stores] fetch error:", e);
        if (window.zaloErrorHandler) window.zaloErrorHandler.showError("فشل في جلب قائمة المتاجر النشطة");
        return [];
    }
}

export async function suspendStore(storeId) {
    if (!supabase) return false;
    try {
        const { error } = await supabase
            .from('stores')
            .update({ status: 'suspended' })
            .eq('id', storeId);
            
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("[admin-stores] suspend error:", e);
        return false;
    }
}
