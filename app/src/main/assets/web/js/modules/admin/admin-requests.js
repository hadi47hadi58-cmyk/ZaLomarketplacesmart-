import { supabase } from '../../supabase-config.js';

export async function fetchMerchantRequests() {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('merchant_requests')
            .select(`
                id,
                user_id,
                email,
                store_name,
                phone,
                wilaya,
                store_type,
                status,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("[admin-requests] fetch error:", e);
        if (window.zaloErrorHandler) window.zaloErrorHandler.showError("فشل في جلب طلبات التجار");
        return [];
    }
}

export async function approveMerchantRequest(requestId) {
    if (!supabase) return false;
    
    try {
        const { error } = await supabase
            .from('merchant_requests')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', requestId);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("[admin-requests] approve error:", e);
        if (window.zaloErrorHandler) window.zaloErrorHandler.showError("حدث خطأ أثناء محاولة قبول الطلب");
        return false;
    }
}

export async function rejectMerchantRequest(requestId) {
    if (!supabase) return false;
    
    try {
        const { error } = await supabase
            .from('merchant_requests')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', requestId);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error("[admin-requests] reject error:", e);
        if (window.zaloErrorHandler) window.zaloErrorHandler.showError("حدث خطأ أثناء محاولة رفض الطلب");
        return false;
    }
}
