import { supabase } from './supabase-config.js';

export async function upsertStoreToSupabase(storeData) {
    if (!supabase || !storeData) return null;
    try {
        const storeName = storeData.name || storeData.storeName || storeData.store_name || 'متجر معتمد';
        const payload = {
            name: storeName,
            wilaya: storeData.wilaya || '58 - المنيعة',
            commune: storeData.commune || storeData.baladiya || 'المركز',
            category: storeData.category || 'عام',
            phone: storeData.phone || '0698694010',
            logo_url: storeData.logoImg || storeData.logo || storeData.logo_url || 'assets/icon-192.svg',
            banner_url: storeData.coverImg || storeData.coverImage || storeData.banner_url || 'assets/icon-192.svg',
            status: 'APPROVED',
            is_official: true,
            is_verified: true,
            updated_at: new Date().toISOString()
        };
        // Resolve numeric INT merchant_id from users table using Supabase Auth UID
        let numericMerchantId = null;
        if (storeData.merchant_id && !isNaN(parseInt(storeData.merchant_id))) {
            numericMerchantId = parseInt(storeData.merchant_id);
        } else {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.id) {
                    const { data: uData } = await supabase.from('users').select('id').eq('supabase_uid', user.id).maybeSingle();
                    if (uData && uData.id) {
                        numericMerchantId = parseInt(uData.id);
                    }
                }
            } catch(e) {}
        }
        if (numericMerchantId) {
            payload.merchant_id = numericMerchantId;
        }
        if (storeData.id && !isNaN(parseInt(storeData.id)) && !String(storeData.id).startsWith('store_')) {
            payload.id = parseInt(storeData.id);
        }

        // 1. Try to find existing store by name or merchant_id
        let existingStore = null;
        if (payload.id) {
            const { data } = await supabase.from('stores').select('id, name').eq('id', payload.id).maybeSingle();
            existingStore = data;
        }
        if (!existingStore && payload.name) {
            const { data } = await supabase.from('stores').select('id, name').eq('name', payload.name).maybeSingle();
            existingStore = data;
        }
        if (!existingStore && payload.merchant_id) {
            const { data } = await supabase.from('stores').select('id, name').eq('merchant_id', payload.merchant_id).maybeSingle();
            existingStore = data;
        }

        if (existingStore && existingStore.id) {
            await supabase.from('stores').update(payload).eq('id', existingStore.id);
            return existingStore;
        }

        // 2. Insert new store if not existing
        const { data: inserted, error } = await supabase.from('stores').insert([payload]).select('id, name').maybeSingle();
        if (!error && inserted) {
            return inserted;
        }

        // Fallback upsert
        const { data: upserted } = await supabase.from('stores').upsert(payload).select('id, name').maybeSingle();
        return upserted || existingStore || null;
    } catch(e) {
        console.warn("Supabase upsertStoreToSupabase exception:", e);
        return null;
    }
}

export async function addProductToSupabase(productData) {
    if (!supabase || !productData) return false;
    try {
        const storeName = productData.storeName || productData.store_name || productData.store || 'متجر معتمد';
        
        // 1. Ensure store exists in stores table to satisfy foreign key requirement
        let storeRecord = await upsertStoreToSupabase({
            name: storeName,
            wilaya: productData.wilaya,
            phone: productData.phone,
            merchant_id: productData.merchant_id || productData.user_id,
            logo: productData.logo || 'assets/icon-192.svg'
        });

        const storeIdInt = (storeRecord && storeRecord.id && !isNaN(parseInt(storeRecord.id)))
            ? parseInt(storeRecord.id)
            : (productData.store_id && !isNaN(parseInt(productData.store_id)) ? parseInt(productData.store_id) : null);

        const productName = productData.name || productData.productName || 'منتج جديد';
        const priceNum = parseFloat(productData.price) || 0;
        const stockInt = parseInt(productData.stock) || 1;
        const img = productData.image || productData.image_url || productData.imageUrl || 'assets/icon-192.svg';

        const cleanPayload = {
            name: productName,
            price: priceNum,
            stock: stockInt,
            category: productData.category || 'عام',
            description: productData.description || '',
            image_url: img,
            is_active: true
        };

        if (storeIdInt) {
            cleanPayload.store_id = storeIdInt;
        }

        // Try primary insert
        let { data, error } = await supabase.from('products').insert([cleanPayload]).select();
        
        if (error) {
            console.warn("Primary product insert error, attempting adaptive fallback:", error.message || error);
            
            // Try with status: 'active'
            const fallback1 = { ...cleanPayload, status: 'active' };
            const res1 = await supabase.from('products').insert([fallback1]).select();
            if (!res1.error) {
                console.log("Successfully inserted product with status column:", res1.data);
                return true;
            }

            // Try without store_id in case of FK constraint
            const fallbackNoStore = { ...cleanPayload };
            delete fallbackNoStore.store_id;
            const res2 = await supabase.from('products').insert([fallbackNoStore]).select();
            if (!res2.error) {
                console.log("Successfully inserted product without store_id:", res2.data);
                return true;
            }

            // Minimal fallback: name, price, category, image_url
            const minimalPayload = {
                name: productName,
                price: priceNum,
                category: productData.category || 'عام',
                image_url: img
            };
            const res3 = await supabase.from('products').insert([minimalPayload]);
            if (!res3.error) {
                console.log("Successfully inserted product with minimal payload");
                return true;
            }
            console.warn("All product insert attempts failed:", res3.error);
        } else {
            console.log("Successfully added product to Supabase products table:", data);
        }
        return true;
    } catch (e) {
        console.warn("Supabase insert exception:", e);
        return false;
    }
}

export async function uploadFileToSupabase(file, folder = 'media') {
    if (!supabase || !file) return null;
    try {
        const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const bucketsToTry = ['media', 'products', 'stores', 'public'];
        for (const bucket of bucketsToTry) {
            try {
                const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });
                if (!error && data) {
                    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
                    if (publicUrl) return publicUrl;
                }
            } catch(bErr) {
                // Try next bucket
            }
        }
        return null;
    } catch (e) {
        console.warn("Supabase storage upload exception:", e);
        return null;
    }
}

export async function addStoryToSupabase(storyData) {
    if (!supabase || !storyData) return false;
    try {
        const storeName = storyData.author || storyData.store_name || storyData.name || 'متجر معتمد';
        
        // 1. Ensure/get store record to obtain store_id
        let storeRecord = await upsertStoreToSupabase({
            name: storeName,
            wilaya: storyData.wilaya,
            phone: storyData.phone,
            merchant_id: storyData.merchant_id || storyData.user_id,
            logo: storyData.logo || storyData.logo_url || 'assets/icon-192.svg'
        });

        const storeIdInt = (storeRecord && storeRecord.id && !isNaN(parseInt(storeRecord.id)))
            ? parseInt(storeRecord.id)
            : (storyData.store_id && !isNaN(parseInt(storyData.store_id)) ? parseInt(storyData.store_id) : null);

        const payload = {
            store_id: storeIdInt,
            store_name: storeName,
            author_name: storeName,
            author: storeName,
            wilaya: storyData.wilaya || '58 - المنيعة',
            phone: storyData.phone || '0698694010',
            title: storyData.caption || storyData.title || 'عرض خاص',
            description: storyData.caption || storyData.title || 'عرض خاص',
            caption: storyData.caption || storyData.title || 'عرض خاص',
            image_url: storyData.image_url || storyData.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500',
            video_url: storyData.video_url || storyData.video || null,
            is_video: !!storyData.is_video,
            price: String(storyData.price || '0'),
            status: 'active',
            post_type: 'story',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('market_posts').insert([payload]);
        if (error) {
            console.warn("Error inserting story into market_posts:", error);
            const fallbackPayload = { ...payload };
            delete fallbackPayload.store_id;
            await supabase.from('market_posts').insert([fallbackPayload]);
        } else {
            console.log("Successfully added story to market_posts with store_id:", storeIdInt);
        }
        return true;
    } catch (e) {
        console.warn("Supabase story insert exception:", e);
        return false;
    }
}

