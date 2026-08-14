import { supabase } from '../../supabase-config.js';
import { fetchMerchantRequests, rejectMerchantRequest } from './admin-requests.js';

export async function fetchActiveStores() {
    try {
        const allStores = await fetchMerchantRequests();
        return allStores.filter(s => {
            const st = String(s.status || '').toUpperCase();
            return st === 'APPROVED' || st === 'ACTIVE';
        });
    } catch (e) {
        console.error("[admin-stores] fetch error:", e);
        return [];
    }
}

export async function suspendStore(storeId) {
    try {
        return await rejectMerchantRequest(storeId);
    } catch (e) {
        console.error("[admin-stores] suspend error:", e);
        return false;
    }
}


