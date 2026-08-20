import { supabase } from './supabase-config.js';

export async function upsertStoreToSupabase(storeData) {
    if (!supabase || !storeData) return false;
    try {
        const storeName = storeData.name || storeData.storeName || storeData.store_name || 'متجر معتمد';
        const payload = {
            name: storeName,
            store_name: storeName,
            wilaya: storeData.wilaya || '58 - المنيعة',
            baladiya: storeData.commune || storeData.baladiya || '',
            category: storeData.category || 'عام',
            phone: storeData.phone || '0698694010',
            logo_url: storeData.logoImg || storeData.logo || storeData.logo_url || 'assets/icon-192.svg',
            banner_url: storeData.coverImg || storeData.coverImage || storeData.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500',
            status: 'active',
            is_official: true,
            updated_at: new Date().toISOString()
        };
        if (storeData.id && !String(storeData.id).startsWith('store_')) {
            payload.id = storeData.id;
        }

        const { data, error } = await supabase.from('stores').upsert(payload, { onConflict: 'name' });
        if (error) {
            // Fallback: try simple insert
            await supabase.from('stores').insert([payload]);
        }
        return true;
    } catch(e) {
        console.warn("Supabase upsertStoreToSupabase exception:", e);
        return false;
    }
}

export async function addProductToSupabase(productData) {
    if (!supabase || !productData) return false;
    try {
        const { data, error } = await supabase.from('products').insert([productData]);
        if (error) {
            console.warn("Error inserting product into products table:", error);
            // Try trimmed payload matching standard columns
            const cleanPayload = {
                name: productData.name || productData.productName,
                price: productData.price,
                stock: productData.stock || 1,
                category: productData.category || 'عام',
                description: productData.description || '',
                image_url: productData.image || productData.image_url || productData.imageUrl,
                store_name: productData.storeName || productData.store_name,
                wilaya: productData.wilaya,
                phone: productData.phone,
                status: 'active'
            };
            const { error: err2 } = await supabase.from('products').insert([cleanPayload]);
            if (err2) console.warn("Retry product insert warning:", err2);
        }
        
        // Also ensure store is registered in Supabase stores table
        if (productData.storeName || productData.store_name) {
            upsertStoreToSupabase({
                name: productData.storeName || productData.store_name,
                wilaya: productData.wilaya,
                phone: productData.phone,
                logo: productData.logo || 'assets/icon-192.svg'
            });
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
        const payload = {
            store_name: storyData.author || storyData.store_name || storyData.name,
            author_name: storyData.author || storyData.store_name || storyData.name,
            author: storyData.author || storyData.store_name || storyData.name,
            wilaya: storyData.wilaya || '58 - المنيعة',
            phone: storyData.phone || '0698694010',
            title: storyData.caption || storyData.title || 'عرض خاص',
            description: storyData.caption || storyData.title || 'عرض خاص',
            caption: storyData.caption || storyData.title || 'عرض خاص',
            image_url: storyData.image_url || storyData.image || 'images/wilaya-thumb.jpg',
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
        }
        
        // Also register store
        if (payload.store_name) {
            upsertStoreToSupabase({
                name: payload.store_name,
                wilaya: payload.wilaya,
                phone: payload.phone,
                logo: storyData.logo || 'assets/icon-192.svg'
            });
        }
        return true;
    } catch (e) {
        console.warn("Supabase story insert exception:", e);
        return false;
    }
}

