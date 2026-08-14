import { supabase } from '../../supabase-config.js';

export async function fetchAllProducts() {
    let products = [];
    
    // 1. Fetch from Supabase
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data && Array.isArray(data) && data.length > 0) {
                products = data.map(p => {
                    const sName = p.store_name || p.storeName || (p.store_id === 4 ? 'ABDELALI.PHONE' : (p.store_id === 2 ? 'ZaLo kids' : (p.store_id === 3 ? 'Nadjemi Abdelhadi' : 'متجر الشريك المعتمد')));
                    const pName = p.name || p.productName || 'منتج';
                    const pImg = p.image_url || p.image || p.img || 'assets/icon-192.svg';
                    return {
                        id: p.id,
                        productId: p.id,
                        name: pName,
                        productName: pName,
                        description: p.description || '',
                        price: p.price || 0,
                        stock: p.stock || p.stock_quantity || 0,
                        category: p.category || 'عام',
                        subcategory: p.subcategory || '',
                        store_id: p.store_id,
                        storeName: sName,
                        store_name: sName,
                        image_url: pImg,
                        img: pImg,
                        sku: p.sku || `ZL-PRD-${String(p.id).padStart(4, '0')}`,
                        sales_count: p.sales_count || p.salesCount || 0,
                        computedSales: p.sales_count || p.salesCount || 0,
                        rating: p.rating || 5,
                        created_at: p.created_at || new Date().toISOString()
                    };
                });
            }
        }
    } catch (e) {
        console.warn("[admin-products] Supabase fetch error:", e);
    }

    // 2. Fetch from LocalStorage fallback if needed
    try {
        const localKeys = ['products', 'zalo_products'];
        localKeys.forEach(k => {
            const localProds = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(localProds) && localProds.length > 0) {
                localProds.forEach(lp => {
                    const pId = lp.id || lp.productId;
                    const exists = products.some(p => p.id == pId || (p.name && p.name === (lp.name || lp.productName)));
                    if (!exists) {
                        const pName = lp.name || lp.productName || 'منتج';
                        const pImg = lp.image || lp.image_url || lp.img || 'assets/icon-192.svg';
                        products.push({
                            id: pId,
                            productId: pId,
                            name: pName,
                            productName: pName,
                            description: lp.description || '',
                            price: lp.price || 0,
                            stock: lp.stock || lp.stock_quantity || 0,
                            category: lp.category || 'عام',
                            subcategory: lp.subcategory || '',
                            store_id: lp.store_id || lp.storeId || 1,
                            storeName: lp.storeName || lp.store_name || 'متجر زالو',
                            store_name: lp.store_name || lp.storeName || 'متجر زالو',
                            image_url: pImg,
                            img: pImg,
                            sku: lp.sku || `ZL-PRD-${String(pId).padStart(4, '0')}`,
                            sales_count: lp.sales_count || lp.salesCount || 0,
                            computedSales: lp.computedSales || lp.sales_count || 0,
                            rating: lp.rating || 5,
                            created_at: lp.created_at || lp.createdAt || new Date().toISOString()
                        });
                    }
                });
            }
        });
    } catch (e) {
        console.warn("[admin-products] LocalStorage fetch error:", e);
    }
                        store_id: lp.store_id || lp.storeId || 1,
                        storeName: lp.storeName || lp.store_name || 'متجر زالو',
                        store_name: lp.store_name || lp.storeName || 'متجر زالو',
                        image_url: lp.image_url || lp.img || '',
                        img: lp.img || lp.image_url || 'assets/icon-192.svg',
                        sku: lp.sku || `ZL-PRD-${String(pId).padStart(4, '0')}`,
                        sales_count: lp.sales_count || lp.salesCount || 0,
                        computedSales: lp.computedSales || lp.sales_count || 0,
                        rating: lp.rating || 5,
                        created_at: lp.created_at || lp.createdAt || new Date().toISOString()
                    });
                }
            });
        }
    } catch (e) {
        console.warn("[admin-products] LocalStorage fetch error:", e);
    }

    // 3. Guaranteed foundation products fallback if both are empty
    if (products.length === 0) {
        products = [
            { id: 1, productId: 1, name: "حامل الهواتف المحمولة", productName: "حامل الهواتف المحمولة", price: 1300, stock: 13, category: "هواتف وإلكترونيات", store_id: 4, storeName: "ABDELALI.PHONE", store_name: "ABDELALI.PHONE", sku: "ZL-PRD-0001", computedSales: 0, img: "assets/icon-192.svg" },
            { id: 2, productId: 2, name: "ساعة ذكية رياضية", productName: "ساعة ذكية رياضية", price: 2500, stock: 10, category: "هواتف وإلكترونيات", store_id: 4, storeName: "ABDELALI.PHONE", store_name: "ABDELALI.PHONE", sku: "ZL-PRD-0002", computedSales: 0, img: "assets/icon-192.svg" },
            { id: 3, productId: 3, name: "حامل دفتر الصحي الاطفال", productName: "حامل دفتر الصحي الاطفال", price: 3000, stock: 5, category: "ملابس وأزياء", store_id: 2, storeName: "ZaLo kids", store_name: "ZaLo kids", sku: "ZL-PRD-0003", computedSales: 0, img: "assets/icon-192.svg" },
            { id: 4, productId: 4, name: "فراش تغيير ملابس اطفال", productName: "فراش تغيير ملابس اطفال", price: 4500, stock: 8, category: "ملابس وأزياء", store_id: 2, storeName: "ZaLo kids", store_name: "ZaLo kids", sku: "ZL-PRD-0004", computedSales: 0, img: "assets/icon-192.svg" }
        ];
    }

    return products;
}

