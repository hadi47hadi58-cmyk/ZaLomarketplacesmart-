import { supabase } from '../../supabase-config.js';

export const AdminDB = {
    async fetchPendingRequests() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('merchant_requests')
            .select('*')
            .eq('status', 'pending');
        if (error) {
            console.error("Error fetching requests:", error);
            return [];
        }
        return data;
    },

    async fetchAllStores() {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('stores')
            .select('*');
        if (error) {
            console.error("Error fetching stores:", error);
            return [];
        }
        return data;
    },

    async approveMerchant(id, isEmail = false) {
        if (!supabase) return false;
        const column = isEmail ? 'email' : (id.includes('-') ? 'user_id' : 'id');
        const { error } = await supabase
            .from('merchant_requests')
            .update({ status: 'approved' })
            .eq(column, id);
        
        if (error) {
            console.error("Approve error:", error);
            return false;
        }
        return true;
    }
};
