import { supabase } from '../../supabase-config.js';

let MOCK_FALLBACK_STORES = [];

function getStatusOverrides() {
    try {
        return JSON.parse(localStorage.getItem('zalo_store_status_overrides') || '{}');
    } catch(e) {
        return {};
    }
}

function setStatusOverride(id, storeName, newStatus) {
    try {
        const overrides = getStatusOverrides();
        if (id) overrides[String(id)] = newStatus;
        if (storeName) overrides[String(storeName).trim()] = newStatus;
        localStorage.setItem('zalo_store_status_overrides', JSON.stringify(overrides));
    } catch(e) {}
}

export async function fetchMerchantRequests() {
    let allRequests = [];
    const statusOverrides = getStatusOverrides();
    
    // 1. Fetch from Supabase `stores` table
    try {
        if (supabase) {
            const { data: stores, error: storeErr } = await supabase
                .from('stores')
                .select('*')
                .order('created_at', { ascending: false });

            if (!storeErr && stores && Array.isArray(stores)) {
                stores.forEach(st => {
                    const phone = st.phone || st.whatsapp || '0658000000';
                    const whatsapp = st.whatsapp || st.phone || phone;
                    const sName = st.name || st.store_name || 'متجر زالو';
                    let stStatus = st.status || 'APPROVED';
                    
                    if (statusOverrides[String(st.id)] || statusOverrides[sName]) {
                        stStatus = statusOverrides[String(st.id)] || statusOverrides[sName];
                    }

                    allRequests.push({
                        id: st.id,
                        store_id: st.id,
                        user_id: st.merchant_id,
                        store_name: sName,
                        owner_name: st.merchant_name || st.owner_name || st.name || 'تاجر زالو',
                        email: st.email || st.merchant_email || (st.name ? `${st.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'merchant'}@zalo.dz` : ''),
                        phone: phone,
                        whatsapp: whatsapp,
                        wilaya: st.wilaya || '58 المنيعة',
                        commune: st.commune || 'المنيعة',
                        category: st.category || 'عام',
                        store_type: st.store_type || (st.rc_number ? 'سجل تجاري نظامي' : 'نشاط تجاري معتمد'),
                        rc_number: st.rc_number || `RC-5800${st.id}`,
                        status: stStatus,
                        logo: st.logo || null,
                        created_at: st.created_at || new Date().toISOString()
                    });
                });
            }
        }
    } catch (e) {
        console.warn("[admin-requests] Supabase stores query warning:", e);
    }

    // 2. Fetch from Supabase `merchant_requests` table
    try {
        if (supabase) {
            const { data: reqs, error: reqErr } = await supabase
                .from('merchant_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (!reqErr && reqs && Array.isArray(reqs)) {
                reqs.forEach(r => {
                    const existsIdx = allRequests.findIndex(x => x.id === r.id || x.store_name === (r.store_name || r.name));
                    const sName = r.store_name || r.name || 'طلب متجر جديد';
                    let reqStatus = r.status || 'PENDING';
                    if (statusOverrides[String(r.id)] || statusOverrides[sName]) {
                        reqStatus = statusOverrides[String(r.id)] || statusOverrides[sName];
                    }

                    const formatted = {
                        id: r.id,
                        user_id: r.user_id,
                        store_name: sName,
                        owner_name: r.owner_name || r.ownerName || r.name || 'تاجر جديد',
                        email: r.email || '',
                        phone: r.phone || '0658000000',
                        whatsapp: r.whatsapp || r.phone || '0658000000',
                        wilaya: r.wilaya || 'الجزائر',
                        commune: r.commune || '',
                        category: r.category || 'عام',
                        store_type: r.merchant_type || r.store_type || 'طلب تسجيل',
                        rc_number: r.rc_number || r.rcNumber || '',
                        status: reqStatus,
                        logo: r.logo || null,
                        id_front: r.id_front || null,
                        id_back: r.id_back || null,
                        rc_doc: r.rc_doc || null,
                        front_image: r.front_image || null,
                        created_at: r.created_at || new Date().toISOString()
                    };

                    if (existsIdx !== -1) {
                        allRequests[existsIdx] = { ...allRequests[existsIdx], ...formatted };
                    } else {
                        allRequests.unshift(formatted);
                    }
                });
            }
        }
    } catch (e) {
        console.warn("[admin-requests] Supabase merchant_requests query warning:", e);
    }

    // 3. Merge LocalStorage Fallback Requests
    try {
        const localSources = [
            JSON.parse(localStorage.getItem('zalo_local_merchant_requests') || '[]'),
            JSON.parse(localStorage.getItem('zalo_merchant_requests') || '[]'),
            JSON.parse(localStorage.getItem('zalo_fallback_shops') || '[]'),
            JSON.parse(localStorage.getItem('stores_list_old') || '[]')
        ];

        localSources.forEach(sourceList => {
            if (Array.isArray(sourceList)) {
                sourceList.forEach(r => {
                    if (!r) return;
                    const existsIdx = allRequests.findIndex(x => (x.id && (x.id === r.id || x.id == r.id)) || (x.store_name && (x.store_name === r.store_name || x.store_name === r.storeName || x.store_name === r.name)));
                    const sName = r.store_name || r.storeName || r.name || 'متجر محلي';
                    let localStatus = r.status || 'PENDING';
                    if (statusOverrides[String(r.id)] || statusOverrides[sName]) {
                        localStatus = statusOverrides[String(r.id)] || statusOverrides[sName];
                    }

                    const formatted = {
                        id: r.id || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                        user_id: r.user_id || r.id,
                        store_name: sName,
                        owner_name: r.owner_name || r.ownerName || r.owner || r.name || 'تاجر مسجل',
                        email: r.email || '',
                        phone: r.phone || '0658000000',
                        whatsapp: r.whatsapp || r.phone || '0658000000',
                        wilaya: r.wilaya || r.location || '58 المنيعة',
                        commune: r.commune || 'المنيعة',
                        category: r.category || 'عام',
                        store_type: r.merchant_type || r.storeType || 'طلب تسجيل',
                        rc_number: r.rc_number || r.rcNumber || '',
                        status: localStatus,
                        logo: r.logo || r.logoURL || null,
                        id_front: r.id_front || r.idFront || null,
                        id_back: r.id_back || r.idBack || null,
                        rc_doc: r.rc_doc || r.rcFile || null,
                        front_image: r.front_image || r.frontFile || null,
                        created_at: r.created_at || r.createdAt || new Date().toISOString()
                    };

                    if (existsIdx !== -1) {
                        allRequests[existsIdx] = { ...allRequests[existsIdx], ...formatted };
                    } else {
                        allRequests.unshift(formatted);
                    }
                });
            }
        });
    } catch (e) {
        console.warn("[admin-requests] Local storage merge warning:", e);
    }

    // Filter out fake test stores
    const fakeStoreNames = ["ABDELALI.PHONE", "ZaLo kids", "Nadjemi Abdelhadi", "متجري الشريك المعتمد"];
    allRequests = allRequests.filter(r => {
        const sName = r.store_name || r.name || '';
        return !fakeStoreNames.some(fn => sName.includes(fn));
    });

    // Keep stores_list_old in sync so stats and wilayas update
    try {
        const storesSync = allRequests.map(r => ({
            id: r.id,
            name: r.store_name,
            store_name: r.store_name,
            owner: r.owner_name,
            owner_name: r.owner_name,
            phone: r.phone,
            whatsapp: r.whatsapp,
            location: r.wilaya,
            wilaya: r.wilaya,
            commune: r.commune,
            category: r.category,
            status: r.status,
            rating: 5,
            isLive: true
        }));
        localStorage.setItem('stores_list_old', JSON.stringify(storesSync));
        localStorage.setItem('zalo_stores_list_old', JSON.stringify(storesSync));
    } catch(e) {}

    return allRequests;
}

export async function approveMerchantRequest(requestId) {
    try {
        let targetStoreName = '';
        const curReqs = await fetchMerchantRequests();
        const found = curReqs.find(r => r.id == requestId || r.id === requestId);
        if (found) targetStoreName = found.store_name;

        // 1. Set persistent status override
        setStatusOverride(requestId, targetStoreName, 'APPROVED');

        // 2. Mutate in-memory fallback list
        MOCK_FALLBACK_STORES = MOCK_FALLBACK_STORES.map(s => {
            if (s.id == requestId || (targetStoreName && s.store_name === targetStoreName)) {
                return { ...s, status: 'APPROVED' };
            }
            return s;
        });

        // 3. Update Supabase
        if (supabase) {
            try {
                await supabase
                    .from('merchant_requests')
                    .update({ status: 'approved', updated_at: new Date().toISOString() })
                    .eq('id', requestId);
            } catch(e){}

            try {
                await supabase
                    .from('stores')
                    .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
                    .eq('id', requestId);
            } catch(e){}
        }

        // 4. Update all local storage keys
        const updateStorageList = (key) => {
            try {
                let list = JSON.parse(localStorage.getItem(key) || '[]');
                list = list.map(item => {
                    if (item.id == requestId || item.id === requestId || (targetStoreName && (item.name === targetStoreName || item.store_name === targetStoreName || item.storeName === targetStoreName))) {
                        return { ...item, status: 'APPROVED' };
                    }
                    return item;
                });
                localStorage.setItem(key, JSON.stringify(list));
            } catch (e) {}
        };
        updateStorageList('zalo_local_merchant_requests');
        updateStorageList('zalo_merchant_requests');
        updateStorageList('zalo_fallback_shops');
        updateStorageList('stores_list_old');
        updateStorageList('zalo_stores_list_old');

        // 5. Trigger stats and tables updates if global functions exist
        if (typeof window.renderStats === 'function') window.renderStats();
        if (typeof window.renderWilayaTable === 'function') window.renderWilayaTable();
        if (typeof window.renderGlobalStoresTable === 'function') window.renderGlobalStoresTable();

        return true;
    } catch (e) {
        console.error("[admin-requests] approve error:", e);
        return false;
    }
}

export async function rejectMerchantRequest(requestId) {
    try {
        let targetStoreName = '';
        const curReqs = await fetchMerchantRequests();
        const found = curReqs.find(r => r.id == requestId || r.id === requestId);
        if (found) targetStoreName = found.store_name;

        // 1. Set persistent status override
        setStatusOverride(requestId, targetStoreName, 'SUSPENDED');

        // 2. Mutate in-memory fallback list
        MOCK_FALLBACK_STORES = MOCK_FALLBACK_STORES.map(s => {
            if (s.id == requestId || (targetStoreName && s.store_name === targetStoreName)) {
                return { ...s, status: 'SUSPENDED' };
            }
            return s;
        });

        // 3. Update Supabase
        if (supabase) {
            try {
                await supabase
                    .from('merchant_requests')
                    .update({ status: 'rejected', updated_at: new Date().toISOString() })
                    .eq('id', requestId);
            } catch(e){}

            try {
                await supabase
                    .from('stores')
                    .update({ status: 'SUSPENDED', updated_at: new Date().toISOString() })
                    .eq('id', requestId);
            } catch(e){}
        }

        // 4. Update all local storage keys
        const updateStorageList = (key) => {
            try {
                let list = JSON.parse(localStorage.getItem(key) || '[]');
                list = list.map(item => {
                    if (item.id == requestId || item.id === requestId || (targetStoreName && (item.name === targetStoreName || item.store_name === targetStoreName || item.storeName === targetStoreName))) {
                        return { ...item, status: 'SUSPENDED' };
                    }
                    return item;
                });
                localStorage.setItem(key, JSON.stringify(list));
            } catch (e) {}
        };
        updateStorageList('zalo_local_merchant_requests');
        updateStorageList('zalo_merchant_requests');
        updateStorageList('zalo_fallback_shops');
        updateStorageList('stores_list_old');
        updateStorageList('zalo_stores_list_old');

        if (typeof window.renderStats === 'function') window.renderStats();
        if (typeof window.renderWilayaTable === 'function') window.renderWilayaTable();
        if (typeof window.renderGlobalStoresTable === 'function') window.renderGlobalStoresTable();

        return true;
    } catch (e) {
        console.error("[admin-requests] reject error:", e);
        return false;
    }
}

export async function deleteMerchantRequest(requestId) {
    try {
        let targetStoreName = '';
        const curReqs = await fetchMerchantRequests();
        const found = curReqs.find(r => r.id == requestId || r.id === requestId);
        if (found) targetStoreName = found.store_name;

        // 1. Delete from Supabase
        if (supabase) {
            try {
                await supabase.from('merchant_requests').delete().eq('id', requestId);
            } catch(e){}
            try {
                await supabase.from('stores').delete().eq('id', requestId);
            } catch(e){}
            try {
                await supabase.from('products').delete().eq('store_id', requestId);
            } catch(e){}
            try {
                await supabase.from('market_posts').delete().eq('store_id', requestId);
            } catch(e){}
        }

        // 2. Remove from LocalStorage
        const removeFromList = (key) => {
            try {
                let list = JSON.parse(localStorage.getItem(key) || '[]');
                list = list.filter(item => item.id != requestId && item.id !== requestId && (!targetStoreName || (item.name !== targetStoreName && item.store_name !== targetStoreName && item.storeName !== targetStoreName)));
                localStorage.setItem(key, JSON.stringify(list));
            } catch (e) {}
        };
        removeFromList('zalo_local_merchant_requests');
        removeFromList('zalo_merchant_requests');
        removeFromList('zalo_fallback_shops');
        removeFromList('stores_list_old');
        removeFromList('zalo_stores_list_old');
        removeFromList('zalo_official_stores');

        if (typeof window.renderStats === 'function') window.renderStats();
        if (typeof window.renderWilayaTable === 'function') window.renderWilayaTable();
        if (typeof window.renderGlobalStoresTable === 'function') window.renderGlobalStoresTable();
        if (typeof window.renderRegistrations === 'function') window.renderRegistrations();

        return true;
    } catch (e) {
        console.error("[admin-requests] delete error:", e);
        return false;
    }
}



