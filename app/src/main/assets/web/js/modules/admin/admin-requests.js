import { supabase } from '../../supabase-config.js';

let MOCK_FALLBACK_STORES = [
    {
        id: 4,
        merchant_id: 13,
        store_name: "ABDELALI.PHONE",
        owner_name: "عبد العالي للهواتف",
        email: "abdelali.phone@zalo.dz",
        phone: "0696795160",
        whatsapp: "0696795160",
        wilaya: "58 المنيعة",
        commune: "المنيعة",
        category: "هواتف وإلكترونيات",
        store_type: "سجل تجاري إلكتروني",
        rc_number: "47/00-192837B58",
        status: "APPROVED",
        created_at: "2026-06-25T23:53:56.303Z"
    },
    {
        id: 3,
        merchant_id: 12,
        store_name: "Nadjemi Abdelhadi",
        owner_name: "نجمي عبد الهادي",
        email: "nadjemi.abdelhadi@zalo.dz",
        phone: "0698694010",
        whatsapp: "0698694010",
        wilaya: "16 الجزائر",
        commune: "الجزائر",
        category: "هواتف وإلكترونيات",
        store_type: "نشاط حر / خدمات",
        rc_number: "16/00-984726A16",
        status: "SUSPENDED",
        created_at: "2026-06-25T23:53:56.183Z"
    },
    {
        id: 2,
        merchant_id: 11,
        store_name: "ZaLo kids",
        owner_name: "أزياء الأطفال زالو",
        email: "zalo.kids@zalo.dz",
        phone: "0673544540",
        whatsapp: "0673544540",
        wilaya: "58 المنيعة",
        commune: "المنيعة",
        category: "ملابس وأزياء",
        store_type: "سجل تجاري نظامي",
        rc_number: "58/00-482910C58",
        status: "APPROVED",
        created_at: "2026-06-25T23:53:56.059Z"
    },
    {
        id: 1,
        merchant_id: 10,
        store_name: "متجري الشريك المعتمد",
        owner_name: "التاجر الشريك الأول",
        email: "partner1@zalo.dz",
        phone: "0698694010",
        whatsapp: "0698694010",
        wilaya: "58 المنيعة",
        commune: "بلدية المنيعة",
        category: "عام",
        store_type: "نشاط معتمد",
        rc_number: "58/00-001928A58",
        status: "SUSPENDED",
        created_at: "2026-06-25T23:53:55.613Z"
    }
];

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

    // 4. Ensure foundational stores exist and have overrides applied
    MOCK_FALLBACK_STORES.forEach(mock => {
        let mockStatus = mock.status;
        if (statusOverrides[String(mock.id)] || statusOverrides[mock.store_name]) {
            mockStatus = statusOverrides[String(mock.id)] || statusOverrides[mock.store_name];
        }
        mock.status = mockStatus;

        const existsIdx = allRequests.findIndex(r => r.id == mock.id || (r.store_name && r.store_name.trim() === mock.store_name.trim()));
        if (existsIdx === -1) {
            allRequests.push({ ...mock });
        } else {
            allRequests[existsIdx].status = mockStatus;
        }
    });

    // 5. Keep stores_list_old in sync so stats and wilayas update
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


