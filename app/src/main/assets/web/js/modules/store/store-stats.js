import { supabase } from '../../supabase-config.js';

export async function fetchStoreStats() {
    if (!supabase) return { totalSales: 0, pendingOrders: 0, productsCount: 0 };
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return { totalSales: 0, pendingOrders: 0, productsCount: 0 };
        
        const { data: store } = await supabase.from('stores').select('id').eq('merchant_id', session.user.id).maybeSingle();
        if (!store) return { totalSales: 0, pendingOrders: 0, productsCount: 0 };
        
        const { count: pendingOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('store_id', store.id).eq('status', 'pending');
        const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', store.id);
        const { data: orders } = await supabase.from('orders').select('total_amount').eq('store_id', store.id).eq('status', 'delivered');
        
        let totalSales = 0;
        if (orders) {
            totalSales = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
        }
        
        return { totalSales, pendingOrders: pendingOrders || 0, productsCount: productsCount || 0 };
    } catch (e) {
        console.error("Error fetching stats:", e);
        return { totalSales: 0, pendingOrders: 0, productsCount: 0 };
    }
}
