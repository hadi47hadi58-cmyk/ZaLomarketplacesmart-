import { supabase } from '../../supabase-config.js';

export async function fetchStoreProducts() {
    let products = [];
    const sb = supabase || window.supabaseClient;

    let storeSettings = {};
    try {
        storeSettings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || '{}');
    } catch(e) {}

    const localStoreName = storeSettings.storeName || storeSettings.name || localStorage.getItem('zalo_active_store') || '';
    const localStoreId = storeSettings.id || localStorage.getItem('zalo_current_store_id') || localStorage.getItem('zalo_uid') || '';

    // 1. Fetch from Supabase
    if (sb) {
        try {
            let sessionUserId = null;
            let sessionEmail = null;
            try {
                const { data: { session } } = await sb.auth.getSession();
                if (session?.user) {
                    sessionUserId = session.user.id;
                    sessionEmail = session.user.email;
                }
            } catch(e) {}

            let storeId = localStoreId;

            // Find store if we have session
            if (sessionUserId) {
                let { data: store } = await sb
                    .from('stores')
                    .select('id, name')
                    .eq('merchant_id', sessionUserId)
                    .maybeSingle();

                if (!store && sessionEmail) {
                    const { data: storeByEmail } = await sb
                        .from('stores')
                        .select('id, name')
                        .or(`merchant_email.eq.${sessionEmail},email.eq.${sessionEmail}`)
                        .maybeSingle();
                    if (storeByEmail) store = storeByEmail;
                }
                if (store) {
                    storeId = store.id;
                }
            }

            let query = sb.from('products').select('*');
            if (storeId) {
                query = query.or(`store_id.eq.${storeId}${localStoreName ? `,store_name.eq.${localStoreName}` : ''}`);
            } else if (localStoreName) {
                query = query.eq('store_name', localStoreName);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (!error && Array.isArray(data) && data.length > 0) {
                products = data.map(p => ({
                    id: p.id || p.productId,
                    productId: p.id || p.productId,
                    name: p.name || p.productName || 'منتج',
                    productName: p.productName || p.name || 'منتج',
                    price: p.price || 0,
                    stock: p.stock !== undefined ? p.stock : (p.stock_quantity || 0),
                    category: p.category || 'عام',
                    subcategory: p.subcategory || '',
                    description: p.description || '',
                    sku: p.sku || `SKU-${p.id}`,
                    weight: p.weight || 0.1,
                    minOrder: p.minOrder || p.min_order || 1,
                    image_url: p.image_url || p.image || 'assets/icon-192.svg',
                    image: p.image_url || p.image || 'assets/icon-192.svg',
                    store_id: p.store_id || storeId,
                    store_name: p.store_name || localStoreName
                }));
            }
        } catch (e) {
            console.warn("Error fetching store products from Supabase:", e);
        }
    }

    // 2. Merge with LocalStorage products
    try {
        let localProds = JSON.parse(localStorage.getItem('zalo_products') || '[]');
        let legacyProds = JSON.parse(localStorage.getItem('products') || '[]');
        let combined = [...localProds, ...legacyProds];

        combined.forEach(lp => {
            const pId = String(lp.id || lp.productId || '');
            const pName = lp.name || lp.productName;
            if (!pId && !pName) return;

            const exists = products.some(p => String(p.id) === pId || (p.name && p.name === pName));
            if (!exists) {
                products.push({
                    id: pId || ('p_' + Date.now()),
                    productId: pId || ('p_' + Date.now()),
                    name: pName || 'منتج',
                    productName: pName || 'منتج',
                    price: lp.price || 0,
                    stock: lp.stock !== undefined ? lp.stock : (lp.stock_quantity || 0),
                    category: lp.category || 'عام',
                    subcategory: lp.subcategory || '',
                    description: lp.description || '',
                    sku: lp.sku || `SKU-${pId}`,
                    weight: lp.weight || 0.1,
                    minOrder: lp.minOrder || lp.min_order || 1,
                    image_url: lp.image_url || lp.image || 'assets/icon-192.svg',
                    image: lp.image || lp.image_url || 'assets/icon-192.svg',
                    store_id: lp.store_id || lp.storeId || localStoreId,
                    store_name: lp.store_name || lp.storeName || localStoreName
                });
            }
        });
    } catch(e) {
        console.warn("LocalStorage merge error:", e);
    }

    return products;
}

