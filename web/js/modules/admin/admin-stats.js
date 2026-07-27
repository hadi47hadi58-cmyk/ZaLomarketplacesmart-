import { supabase } from '../../supabase-config.js';

export async function fetchAdminDashboardStats() {
    if (!supabase) return { activeStores: 0, newRequests: 0, pendingRequests: 0, totalSales: 0 };
    
    try {
        // Active stores count
        const { count: activeStoresCount, error: err1 } = await supabase
            .from('stores')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
            
        // Pending requests count
        const { count: pendingRequestsCount, error: err2 } = await supabase
            .from('merchant_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
            
        // Assuming we have total sales logic or we mock it for now since orders table might be empty
        const totalSales = 0; // We can query sum from orders later when available
        const newRequests = pendingRequestsCount || 0; // Same for this UI
        
        return {
            activeStores: activeStoresCount || 0,
            newRequests: newRequests,
            pendingRequests: pendingRequestsCount || 0,
            totalSales: totalSales
        };
    } catch (e) {
        console.error("Error fetching stats:", e);
        return { activeStores: 0, newRequests: 0, pendingRequests: 0, totalSales: 0 };
    }
}
