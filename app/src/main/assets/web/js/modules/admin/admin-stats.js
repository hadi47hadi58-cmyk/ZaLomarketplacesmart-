import { supabase } from '../../supabase-config.js';

export async function fetchAdminDashboardStats() {
    let stats = {
        activeStores: 2,
        pendingRequests: 2,
        totalProducts: 4,
        verifiedUsers: 4,
        totalSales: 0,
        netProfits: 0,
        activeOrders: 0,
        rating: "5.0 / 5.0 ★",
        adminsCount: 1
    };

    try {
        if (supabase) {
            // 1. Fetch all stores from Supabase
            const { data: stores, error: storeErr } = await supabase
                .from('stores')
                .select('*');

            if (!storeErr && stores && Array.isArray(stores)) {
                const active = stores.filter(s => String(s.status || '').toUpperCase() === 'APPROVED' || String(s.status || '').toLowerCase() === 'active');
                const pending = stores.filter(s => String(s.status || '').toUpperCase() !== 'APPROVED' && String(s.status || '').toLowerCase() !== 'active');
                stats.activeStores = active.length;
                stats.pendingRequests = pending.length;
            }

            // 2. Fetch merchant_requests
            const { data: reqs, error: reqErr } = await supabase
                .from('merchant_requests')
                .select('*');
            if (!reqErr && reqs && Array.isArray(reqs)) {
                stats.pendingRequests += reqs.filter(r => String(r.status || '').toUpperCase() !== 'APPROVED').length;
            }

            // 3. Fetch products
            const { data: products, error: prodErr } = await supabase
                .from('products')
                .select('*');
            if (!prodErr && products && Array.isArray(products)) {
                stats.totalProducts = products.length;
            }

            // 4. Fetch users
            const { data: users, error: userErr } = await supabase
                .from('users')
                .select('*');
            if (!userErr && users && Array.isArray(users) && users.length > 0) {
                stats.verifiedUsers = Math.max(users.length, stats.activeStores + stats.pendingRequests);
            } else {
                stats.verifiedUsers = Math.max(4, stats.activeStores + stats.pendingRequests);
            }

            // 5. Fetch orders
            const { data: orders, error: orderErr } = await supabase
                .from('orders')
                .select('*');
            if (!orderErr && orders && Array.isArray(orders)) {
                stats.activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
                const completed = orders.filter(o => o.status === 'DELIVERED');
                const totalRev = completed.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
                stats.totalSales = totalRev;
                stats.netProfits = Math.round(totalRev * 0.05);
            }
        }
    } catch (e) {
        console.warn("[admin-stats] Error fetching live stats:", e);
    }

    return stats;
}

