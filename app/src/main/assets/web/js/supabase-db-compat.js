// ZaLo Marketplace Smart Sync Update: 2026-07-16
// ZaLo Smart Marketplace - Supabase & NestJS Unified Compatibility Layer
// This file acts as a drop-in compatibility replacement module,
// routing all operations completely and cleanly through Supabase AND our NestJS + PostgreSQL Backend.

import { supabase } from './supabase-config.js';
import { telemetry } from './telemetry-logger.js';

export { supabase, supabase as supabaseClient, telemetry };

// --- Automated Role-Based Routing & Session Integration ---
// دالة التحقق والتوجيه التلقائي للمستخدم بناءً على رتبته (ADMIN, MERCHANT, CUSTOMER)
// تجلب هذه الدالة الدور مباشرة من جدول public.users مع فحص القائمة البيضاء للمشرفين
window.handleUserRedirect = async function() {
    console.log("[Role Routing] بدء التحقق من دور المستخدم وتوجيهه...");
    
    // 1. جلب الجلسة الحالية بشكل آمن
    let session = null;
    try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        session = currentSession;
    } catch (e) {
        console.warn("[Role Routing] فشل في جلب الجلسة النشطة فوريًا:", e.message);
    }

    if (!session || !session.user) {
        console.log("[Role Routing] لم يتم العثور على جلسة مستخدم نشطة. إلغاء توجيه المسار.");
        return;
    }

    const user = session.user;
    const email = user.email ? user.email.toLowerCase().trim() : '';
    
    // 2. فحص فوري لقائمة المشرفين البيضاء (Admin Whitelist Check)
    const AD_LIST = [
      'zinzinochop@gmail.com',
      'zinochop2024@gmail.com',
      'hadi47hadi58@gmail.com',
      'admin@zalo.dz',
      'admin@zalo.com',
      'manager@zalo.dz',
      'manager@zalo.com'
    ];

    let role = null;

    if (AD_LIST.includes(email) || email.endsWith('@zalo-admin.com')) {
        role = 'ADMIN';
    } else {
        // 3. محاولة جلب الدور من جدول public.users مع إمكانية التكرار في حال تأخر الاستجابة
        let retries = 4;
        while (retries > 0 && !role) {
            try {
                // محاولة القراءة من جدول المستخدمين الرئيسي (public.users) المرتبط عبر supabase_uid
                const { data: dbUser, error: dbError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('supabase_uid', user.id)
                    .maybeSingle();

                if (dbUser && dbUser.role) {
                    role = dbUser.role.toUpperCase();
                    console.log(`[Role Routing] تم جلب الدور بنجاح من جدول المستخدمين الرئيسي: ${role}`);
                    break;
                }

                // خطة احتياطية للتوافق: جلب الدور من جدول Profiles القديم
                const { data: profileUser, error: profError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileUser && profileUser.role) {
                    role = profileUser.role.toUpperCase();
                    console.log(`[Role Routing] تم جلب الدور بنجاح من جدول الملفات التعريفي الاحتياطي: ${role}`);
                    break;
                }
            } catch (err) {
                console.warn("[Role Routing] خطأ أثناء الاستعلام عن الرتبة في قاعدة البيانات:", err);
            }

            retries--;
            if (!role && retries > 0) {
                console.log(`[Role Routing] لم يكتمل تحديد الرتبة بعد. جاري إعادة المحاولة خلال 500ms... (المتبقي ${retries} محاولات)`);
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }

    // تعيين الدور الافتراضي كزبون في حال تعذر الحصول على الرتبة من الجداول
    if (!role) {
        role = 'CUSTOMER';
        console.log("[Role Routing] تعذر حل الرتبة من قاعدة البيانات. الدور الافتراضي: CUSTOMER");
    }

    // 4. حفظ الدور بأمان في التخزين المحلي لتسهيل استخدامه في الواجهة الأمامية
    localStorage.setItem('zalo_user_role', role);
    if (role === 'ADMIN') {
        sessionStorage.setItem('admin_logged_in_session', 'true');
    }

    // 4b. مزامنة الجلسة النشطة بالكامل مع محرك التطبيق المحلي (Shared Engine Sync)
    const activeSessionUser = {
        uid: user.id,
        email: email,
        name: user.user_metadata?.full_name || email.split('@')[0],
        phone: "0555" + Math.floor(100000 + Math.random() * 900000),
        role: role.toLowerCase(), // "admin", "merchant", "customer"
        status: "ACTIVE"
    };
    localStorage.setItem('zalo_active_session', JSON.stringify(activeSessionUser));

    // 5. التوجيه الذكي لمنع التكرار اللانهائي (Smart Non-Looping Redirects)
    const currentPath = window.location.pathname;
    
    // فحص المسار الحالي للتأكد من عدم التكرار اللانهائي - مطابقة حقيقية للملفات القديمة الفعالة
    const isAlreadyOnAdmin = currentPath.endsWith('dashboard-admin.html');
    const isAlreadyOnDashboard = currentPath.endsWith('dashboard-store.html');
    const isAlreadyOnCustomer = currentPath.endsWith('customer-home.html');

    console.log(`[Role Routing] الدور النشط الحالي: ${role} | المسار الحالي: ${currentPath}`);

    if (role === 'ADMIN') {
        if (!isAlreadyOnAdmin) {
            console.log("[Role Routing] جاري توجيه المدير إلى صفحة لوحة التحكم الإدارية النهائية (dashboard-admin.html)...");
            window.location.replace('dashboard-admin.html');
        }
    } else if (role === 'MERCHANT') {
        if (!isAlreadyOnDashboard) {
            console.log("[Role Routing] جاري توجيه التاجر إلى صفحة لوحة التحكم التجارية (dashboard-store.html)...");
            window.location.replace('dashboard-store.html');
        }
    } else { // CUSTOMER
        if (!isAlreadyOnCustomer) {
            console.log("[Role Routing] جاري توجيه الزبون إلى لوحة وبوابة العميل (customer-home.html)...");
            window.location.replace('customer-home.html');
        }
    }
};

// للحفاظ على التوافق الكامل مع أي أجزاء أخرى تستدعي checkRoleAndRedirect
window.checkRoleAndRedirect = async function() {
    console.log("[Role Routing] استدعاء مواءمة checkRoleAndRedirect عبر دالة handleUserRedirect الموحدة...");
    await window.handleUserRedirect();
};

// --- Global Auto-Sync Hook to keep NestJS, local tokens, and Supabase 100% in Sync ---
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("[Global Sync] Supabase Auth event changed:", event);
    if (session) {
        const token = session.access_token;
        localStorage.setItem('nestjs_token', token);
        localStorage.setItem('zalo_session_jwt', token);
        localStorage.setItem('zalo_user_email', session.user.email);
        
        const userObj = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''
        };
        localStorage.setItem('nestjs_user', JSON.stringify(userObj));

        // Immediately trigger automated role check and redirection
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await window.handleUserRedirect();
        }
    } else if (event === 'SIGNED_OUT') {
        // Logged out
        console.log("[Global Sync] Explicit SIGNED_OUT event. Cleaning up storage...");
        localStorage.removeItem('nestjs_token');
        localStorage.removeItem('zalo_session_jwt');
        localStorage.removeItem('nestjs_user');
        localStorage.removeItem('zalo_user_role');
        localStorage.removeItem('zalo_active_session');
        sessionStorage.removeItem('admin_logged_in_session');
    }
});

// 1. Core / Initializers
export function initializeApp() {
    return { name: "ZaLo-Unified-Compat" };
}

export function getAuth() {
    return { 
        name: "ZaLo-Unified-Auth-Compat",
        signOut: async () => { return await signOut(); }
    };
}

export function getFirestore() {
    return { name: "ZaLo-Unified-Db-Compat" };
}

export const serverTimestamp = () => new Date().toISOString();

// Dummy Auth Provider for import compatibility
export class GoogleAuthProvider {
    static credential(token) { return { token }; }
}

// NestJS Configuration
const NESTJS_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : (window.location.hostname.endsWith('run.app') || window.location.hostname.includes('google.com')
     ? `${window.location.origin}/api`
     : 'https://zalo-smart-backend-service-api.run.app/api');

window.NESTJS_BASE_URL = NESTJS_BASE_URL;

console.log(`[ZaLo Compat Engine] Bridge initialized. NestJS API Endpoint: ${NESTJS_BASE_URL}`);

// Helper to make fetch calls to NestJS
async function callNestApi(endpoint, method = 'GET', body = null, token = null) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const options = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${NESTJS_BASE_URL}/${endpoint}`, options);
        if (response.ok) {
            return await response.json();
        }
        console.warn(`[ZaLo Compat Engine] NestJS responded with code ${response.status} for ${endpoint}`);
        return null;
    } catch (e) {
        console.warn(`[ZaLo Compat Engine] NestJS endpoint ${endpoint} unreachable:`, e.message);
        return null;
    }
}

// 2. Auth State and Actions
let lastStateValue = undefined;

export function onAuthStateChanged(auth, callback) {
    let isSetted = false;
    let timeoutId = null;

    const triggerCallback = (user) => {
        const stateId = user ? user.id : null;
        if (stateId === lastStateValue) {
            console.log("onAuthStateChanged: Suppressing duplicate state trigger:", stateId);
            return;
        }
        lastStateValue = stateId;
        callback(user);
    };

    const hasHashToken = window.location.hash.includes("access_token=") || window.location.search.includes("access_token=");
    const maxWaitMs = hasHashToken ? 2000 : 3500;

    console.log(`onAuthStateChanged: Initiating patient session check (Wait up to ${maxWaitMs}ms)...`);

    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                if (timeoutId) clearTimeout(timeoutId);
                isSetted = true;
                const user = {
                    uid: session.user.id,
                    id: session.user.id,
                    email: session.user.email,
                    ...session.user
                };
                triggerCallback(user);
                return true;
            }
        } catch (e) {
            console.warn("Patient session check error:", e);
        }

        // Fallback for local session / NestJS token
        const localToken = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token');
        const localEmail = localStorage.getItem('zalo_user_email') || localStorage.getItem('loggedInAdminEmail');
        if (localToken && localEmail) {
            console.log("[ZaLo Compat Engine] Local/NestJS session fallback detected for:", localEmail);
            if (timeoutId) clearTimeout(timeoutId);
            isSetted = true;
            const fallbackUser = {
                uid: localStorage.getItem('zalo_uid') || 'local-user-id-' + localEmail.split('@')[0],
                id: localStorage.getItem('zalo_uid') || 'local-user-id-' + localEmail.split('@')[0],
                email: localEmail,
                email_confirmed_at: new Date().toISOString(),
                user_metadata: {
                    full_name: localStorage.getItem('zalo_user_name') || localStorage.getItem('loggedInAdminName') || localEmail.split('@')[0],
                    role: localStorage.getItem('zalo_user_role') || localStorage.getItem('zalo_role') || 'CUSTOMER'
                }
            };
            triggerCallback(fallbackUser);
            return true;
        }
        return false;
    };

    checkSession().then(found => {
        if (!found) {
            const startTime = Date.now();
            const interval = setInterval(async () => {
                const foundNow = await checkSession();
                if (foundNow || (Date.now() - startTime >= maxWaitMs)) {
                    clearInterval(interval);
                    if (!foundNow && !isSetted) {
                        isSetted = true;
                        triggerCallback(null);
                    }
                }
            }, 50);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("onAuthStateChanged: Supabase Auth event received:", event);
        if (session) {
            isSetted = true;
            if (timeoutId) clearTimeout(timeoutId);
            const user = {
                uid: session.user.id,
                id: session.user.id,
                email: session.user.email,
                ...session.user
            };
            triggerCallback(user);
        } else {
            // Check if local token/session is still active before declaring null
            const localToken = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token');
            const localEmail = localStorage.getItem('zalo_user_email') || localStorage.getItem('loggedInAdminEmail');
            if (localToken && localEmail) {
                const fallbackUser = {
                    uid: localStorage.getItem('zalo_uid') || 'local-user-id-' + localEmail.split('@')[0],
                    id: localStorage.getItem('zalo_uid') || 'local-user-id-' + localEmail.split('@')[0],
                    email: localEmail,
                    email_confirmed_at: new Date().toISOString(),
                    user_metadata: {
                        full_name: localStorage.getItem('zalo_user_name') || localStorage.getItem('loggedInAdminName') || localEmail.split('@')[0],
                        role: localStorage.getItem('zalo_user_role') || localStorage.getItem('zalo_role') || 'CUSTOMER'
                    }
                };
                triggerCallback(fallbackUser);
            } else if (isSetted) {
                triggerCallback(null);
            }
        }
    });

    timeoutId = setTimeout(() => {
        if (!isSetted) {
            console.log("onAuthStateChanged: Settle timeout reached, checking local fallback.");
            const localToken = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token');
            const localEmail = localStorage.getItem('zalo_user_email') || localStorage.getItem('loggedInAdminEmail');
            if (localToken && localEmail) {
                isSetted = true;
                const fallbackUser = {
                    uid: localStorage.getItem('zalo_uid') || 'local-user-id-' + localEmail.split('@')[0],
                    id: localStorage.getItem('zalo_uid') || 'local-user-id-' + localEmail.split('@')[0],
                    email: localEmail,
                    email_confirmed_at: new Date().toISOString(),
                    user_metadata: {
                        full_name: localStorage.getItem('zalo_user_name') || localStorage.getItem('loggedInAdminName') || localEmail.split('@')[0],
                        role: localStorage.getItem('zalo_user_role') || localStorage.getItem('zalo_role') || 'CUSTOMER'
                    }
                };
                triggerCallback(fallbackUser);
            } else {
                isSetted = true;
                triggerCallback(null);
            }
        }
    }, maxWaitMs);

    return () => {
        if (timeoutId) clearTimeout(timeoutId);
        subscription.unsubscribe();
    };
}

export async function signOut() {
    console.log("[ZaLo Compat Engine] Comprehensive signOut triggered. Clearing all session data...");
    
    // Clear all LocalStorage session-related keys
    const keysToRemove = [
        'nestjs_token', 'nestjs_user',
        'zalo_session_jwt', 'zalo_token',
        'zalo_user_role', 'zalo_role',
        'zalo_user_email', 'zalo_user_name',
        'zalo_active_session', 'user_email',
        'loggedInAdminEmail', 'loggedInAdminName',
        'user_uid', 'zalo_uid', 'zalo_local_session'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Clear all Supabase related keys in localStorage (starting with sb-)
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('zalo_local_session'))) {
                localStorage.removeItem(key);
            }
        }
    } catch (e) {
        console.warn("[ZaLo Compat Engine] Error clearing Supabase local storage keys:", e);
    }

    // Clear all SessionStorage keys
    const sessionKeysToRemove = [
        'admin_logged_in_session', 'admin_security_unlocked',
        'zalo_admin_role', 'user_logged_in'
    ];
    sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
    sessionStorage.clear();

    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.warn("[ZaLo Compat Engine] Supabase signOut error (ignoring):", e.message);
    }
    return { success: true };
}

export async function signInWithEmailAndPassword(auth, email, password) {
    // 1. First attempt login with NestJS backend (PostgreSQL database integration)
    console.log("[ZaLo Compat Engine] Registering login session with NestJS backend...");
    const nestResult = await callNestApi('auth/login', 'POST', { email, password });
    if (nestResult && nestResult.access_token) {
        localStorage.setItem('nestjs_token', nestResult.access_token);
        localStorage.setItem('nestjs_user', JSON.stringify(nestResult.user));
        console.log("[ZaLo Compat Engine] NestJS Auth successful.");
    }

    // 2. Perform regular Supabase auth flow
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return {
        user: {
            uid: data.user.id,
            id: data.user.id,
            email: data.user.email,
            ...data.user
        }
    };
}

export async function createUserWithEmailAndPassword(auth, email, password) {
    // 1. Register with NestJS backend as well for unified database mapping
    console.log("[ZaLo Compat Engine] Registering account on NestJS backend...");
    await callNestApi('auth/register', 'POST', {
        name: email.split('@')[0],
        email,
        password,
        role: 'CUSTOMER',
        wilaya: 'الجزائر',
        commune: 'المرسى'
    });

    // 2. Create in Supabase
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return {
        user: {
            uid: data.user.id,
            id: data.user.id,
            email: data.user.email,
            ...data.user
        }
    };
}

// 3. Firestore Query Builder Mimicry
export class FirestoreDocRef {
    constructor(table, id) {
        this.table = table;
        this.id = id;
    }
}

export class FirestoreColRef {
    constructor(table) {
        this.table = table;
    }
}

export class FirestoreQuery {
    constructor(colRef, filters = [], orderByFields = [], limitCount = null) {
        this.table = colRef.table;
        this.filters = filters;
        this.orderByFields = orderByFields;
        this.limitCount = limitCount;
    }
}

export const doc = (db, table, id) => new FirestoreDocRef(table, id);
export const collection = (db, table) => new FirestoreColRef(table);

export const query = (colRef, ...conditions) => {
    const filters = conditions.filter(c => c && c.type === 'where');
    const orderBys = conditions.filter(c => c && c.type === 'orderBy');
    const limits = conditions.filter(c => c && c.type === 'limit');
    
    return new FirestoreQuery(
        colRef,
        filters,
        orderBys,
        limits.length > 0 ? limits[0].value : null
    );
};

export const where = (field, op, val) => {
    let mappedField = field;
    if (field === 'uid') mappedField = 'id';
    return { type: 'where', field: mappedField, op, val };
};

export const limit = (n) => ({ type: 'limit', value: n });
export const orderBy = (field, direction = 'asc') => ({ type: 'orderBy', field, direction });

// Helper for queries with timeout
async function withTimeout(promise, ms = 3500) {
    return new Promise((resolve, reject) => {
        const id = setTimeout(() => reject(new Error("Timeout")), ms);
        promise.then(
            (res) => { clearTimeout(id); resolve(res); },
            (err) => { clearTimeout(id); reject(err); }
        );
    });
}

// 4. Data Operations (getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc)
export async function getDoc(docRef) {
    // If querying specific profile, first try getting profile from NestJS
    if (docRef.table === 'profiles') {
        const token = localStorage.getItem('nestjs_token');
        if (token) {
            const nestProfile = await callNestApi('users/profile', 'GET', null, token);
            if (nestProfile && nestProfile.data) {
                return {
                    exists: true,
                    exists() { return true; },
                    id: docRef.id,
                    data: () => nestProfile.data
                };
            }
        }
    }

    let data = null;
    let error = null;
    try {
        const { data: resData, error: resErr } = await withTimeout(
            supabase.from(docRef.table).select('*').eq('id', docRef.id).maybeSingle(),
            3500
        );
        data = resData;
        error = resErr;
    } catch (e) {
        console.warn(`getDoc timeout or error for ${docRef.table}:`, e.message);
    }

    return {
        exists: !!data,
        exists() { return !!data; },
        id: docRef.id,
        data: () => data
    };
}

export async function getDocs(queryObj) {
    const table = queryObj.table || queryObj;

    // 1. Try unified NestJS API routing for products catalog
    if (table === 'products') {
        console.log("[ZaLo Compat Engine] Fetching products via NestJS REST API...");
        const nestProducts = await callNestApi('products');
        if (nestProducts && nestProducts.data) {
            const docs = nestProducts.data.map(prod => ({
                id: prod.id,
                exists: true,
                exists() { return true; },
                data: () => ({
                    id: prod.id,
                    title: prod.name,
                    price: prod.price,
                    category: prod.category,
                    desc: prod.description,
                    stock: prod.stock,
                    url: prod.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
                    isApproved: true,
                    storeID: "101",
                    storeName: "متجر النور للإلكترونيات"
                })
            }));
            return {
                empty: docs.length === 0,
                docs: docs,
                size: docs.length,
                forEach(cb) { docs.forEach(cb); }
            };
        }
    }

    // 2. Try NestJS routing for orders list
    if (table === 'orders') {
        console.log("[ZaLo Compat Engine] Fetching orders via NestJS REST API...");
        const token = localStorage.getItem('nestjs_token');
        if (token) {
            const nestOrders = await callNestApi('orders', 'GET', null, token);
            if (nestOrders) {
                const list = Array.isArray(nestOrders) ? nestOrders : (nestOrders.data || []);
                const docs = list.map(ord => ({
                    id: ord.id,
                    exists: true,
                    exists() { return true; },
                    data: () => ({
                        id: ord.id,
                        customerName: ord.customerName || "زبون متجر زالو",
                        total: ord.totalAmount,
                        paymentMethod: ord.paymentMethod,
                        paymentStatus: ord.paymentStatus,
                        status: ord.status === 'SHIPPING' ? 'في الطريق' : ord.status === 'DELIVERED' ? 'تم التسليم' : 'قيد المراجعة',
                        address: ord.address,
                        wilaya: ord.wilaya,
                        commune: ord.commune,
                        trackingNumber: ord.trackingNumber || "DZ-ZALO-MOCK",
                        timestamp: ord.timestamp || Date.now()
                    })
                }));
                return {
                    empty: docs.length === 0,
                    docs: docs,
                    size: docs.length,
                    forEach(cb) { docs.forEach(cb); }
                };
            }
        }
    }

    // Resilient Fallback for merchant_requests
    if (table === 'merchant_requests') {
        let reqs = [];
        // 1. Try fetching from Supabase table merchant_requests
        try {
            const { data: remoteReqs, error: err } = await withTimeout(supabase.from('merchant_requests').select('*'), 2500);
            if (!err && remoteReqs) {
                reqs = reqs.concat(remoteReqs);
            }
        } catch (e) {
            console.warn("Resilient fetch from merchant_requests table failed:", e);
        }

        // 2. Query profiles for merchants who are pending/active/approved to reconstruct requests
        try {
            const { data: profiles, error: pErr } = await withTimeout(supabase.from('profiles').select('*'), 2500);
            if (!pErr && profiles) {
                profiles.forEach(p => {
                    const isMerchantOrPending = p.role === 'merchant' || p.status === 'pending' || p.status === 'approved' || p.status === 'rejected';
                    if (isMerchantOrPending) {
                        const exists = reqs.some(r => r.id === p.id);
                        if (!exists) {
                            reqs.push({
                                id: p.id,
                                storeName: p.name || 'متجر جديد',
                                ownerName: p.name || p.email?.split('@')[0] || 'تاجر جديد',
                                email: p.email || '',
                                phone: p.phone || '',
                                whatsapp: p.phone || '',
                                wilaya: p.wilaya || 'غير محدد',
                                commune: p.commune || 'غير محدد',
                                category: 'عام',
                                storeType: 'registered',
                                status: p.status || 'pending',
                                createdAt: p.createdAt || p.created_at || new Date().toISOString()
                            });
                        }
                    }
                });
            }
        } catch (e) {
            console.warn("Resilient fetch from profiles for merchant_requests fallback failed:", e);
        }

        // 3. Merge with localStorage requests
        try {
            const localReqs = JSON.parse(localStorage.getItem('zalo_local_merchant_requests') || '[]');
            localReqs.forEach(p => {
                const idx = reqs.findIndex(r => r.id === p.id);
                if (idx === -1) {
                    reqs.push(p);
                } else {
                    // Update status if local is newer or contains more data
                    reqs[idx] = { ...reqs[idx], ...p };
                }
            });
        } catch (e) {
            console.warn("Resilient fetch from localStorage for merchant_requests fallback failed:", e);
        }

        const docs = reqs.map(row => ({
            id: row.id || row.uid || '',
            exists: true,
            exists() { return true; },
            data: () => row
        }));

        return {
            empty: docs.length === 0,
            docs: docs,
            size: docs.length,
            forEach(cb) { docs.forEach(cb); }
        };
    }

    // Standard Supabase Fallback
    let q = supabase.from(table).select('*');
    
    if (queryObj.filters && queryObj.filters.length > 0) {
        for (const filter of queryObj.filters) {
            const { field, op, val } = filter;
            if (op === '==') {
                q = q.eq(field, val);
            } else if (op === '>=') {
                q = q.gte(field, val);
            } else if (op === '<=') {
                q = q.lte(field, val);
            } else if (op === 'in') {
                q = q.in(field, val);
            } else if (op === '!=') {
                q = q.neq(field, val);
            }
        }
    }

    if (queryObj.orderByFields && queryObj.orderByFields.length > 0) {
        for (const o of queryObj.orderByFields) {
            q = q.order(o.field, { ascending: o.direction !== 'desc' });
        }
    }

    if (queryObj.limitCount) {
        q = q.limit(queryObj.limitCount);
    }

    let data = null;
    let error = null;

    try {
        const result = await withTimeout(q, 3500);
        data = result.data;
        error = result.error;
        
        if (error || !data || data.length === 0) {
            if (error) console.error(`getDocs error or empty for ${table}:`, error.message);
            const fallbackKey = table === 'shops' ? 'zalo_fallback_shops' : (table === 'products' ? 'zalo_fallback_products' : null);
            if (fallbackKey) {
                const raw = localStorage.getItem(fallbackKey);
                if (raw) {
                    let parsedData = JSON.parse(raw);
                    if (queryObj.filters && queryObj.filters.length > 0) {
                        parsedData = parsedData.filter(item => {
                            for (const filter of queryObj.filters) {
                                const { field, op, val } = filter;
                                const itemVal = item[field];
                                if (op === '==') {
                                    if (itemVal !== val) return false;
                                } else if (op === '>=') {
                                    if (itemVal < val) return false;
                                } else if (op === '<=') {
                                    if (itemVal > val) return false;
                                } else if (op === '!=') {
                                    if (itemVal === val) return false;
                                } else if (op === 'in') {
                                    if (!Array.isArray(val) || !val.includes(itemVal)) return false;
                                }
                            }
                            return true;
                        });
                    }
                    data = parsedData;
                    error = null;
                    console.log(`[ZaLo Compat Engine] Used local storage fallback for ${table} after error/empty response with active filters.`, data);
                }
            }
        }
    } catch (timeoutErr) {
        console.warn(`[ZaLo Compat Engine] Query for ${table} timed out. Falling back to local storage...`);
        const fallbackKey = table === 'shops' ? 'zalo_fallback_shops' : (table === 'products' ? 'zalo_fallback_products' : null);
        if (fallbackKey) {
            const raw = localStorage.getItem(fallbackKey);
            if (raw) {
                let parsedData = JSON.parse(raw);
                if (queryObj.filters && queryObj.filters.length > 0) {
                    parsedData = parsedData.filter(item => {
                        for (const filter of queryObj.filters) {
                            const { field, op, val } = filter;
                            const itemVal = item[field];
                            if (op === '==') {
                                if (itemVal !== val) return false;
                            } else if (op === '>=') {
                                if (itemVal < val) return false;
                            } else if (op === '<=') {
                                if (itemVal > val) return false;
                            } else if (op === '!=') {
                                if (itemVal === val) return false;
                            } else if (op === 'in') {
                                if (!Array.isArray(val) || !val.includes(itemVal)) return false;
                            }
                        }
                        return true;
                    });
                }
                data = parsedData;
                error = null;
            }
        }
    }

    const docs = (data || []).map(row => ({
        id: row.id || row.uid || '',
        exists: true,
        exists() { return true; },
        data: () => row
    }));

    return {
        empty: docs.length === 0,
        docs: docs,
        size: docs.length,
        forEach(cb) { docs.forEach(cb); }
    };
}

// --- Offline Queue & Sync Engine ---
const OFFLINE_QUEUE_KEY = 'zalo_offline_queue';
const ID_MAPPINGS_KEY = 'zalo_offline_id_mappings';

/**
 * دالة مساعدة لحفظ عملية تعديل في طابور العمليات غير المتصلة (Offline Queue)
 */
function queueOfflineMutation(type, table, data, id = null) {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    const tempId = id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const mutation = {
        tempId,
        type, // 'INSERT', 'UPDATE', 'DELETE', 'UPSERT'
        table,
        data,
        timestamp: Date.now()
    };
    
    queue.push(mutation);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    
    telemetry.logWarning(`[Offline Engine] تم حفظ العملية محلياً لعدم توفر شبكة. النوع: ${type} الجدول: ${table}`, mutation);
    return tempId;
}

/**
 * محرك المزامنة التلقائية وقمع التعارضات عند استعادة الاتصال بالإنترنت
 */
export async function syncOfflineQueue() {
    if (!navigator.onLine) return;
    
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;
    
    console.log(`%c[Offline Sync] تم اكتشاف ${queue.length} عملية معلقة محلياً. بدء المزامنة مع خادم PostgreSQL...`, 'color: #00FF00; font-weight: bold;');
    telemetry.logInfo(`[Offline Sync] بدء مزامنة ${queue.length} عملية معلقة.`);

    const idMappings = JSON.parse(localStorage.getItem(ID_MAPPINGS_KEY) || '{}');
    const remainingQueue = [];

    for (const mutation of queue) {
        try {
            let { type, table, data, tempId, timestamp } = mutation;
            
            // 1. حل تعارض المعرفات والعلاقات (Id & Relational Integrity Conflict Resolution)
            // إذا كانت البيانات تحتوي على معرفات مؤقتة تم حلها سابقاً من السيرفر، نقوم باستبدالها
            const dataStr = JSON.stringify(data);
            let updatedDataStr = dataStr;
            for (const [tempKey, serverRealId] of Object.entries(idMappings)) {
                if (updatedDataStr.includes(tempKey)) {
                    updatedDataStr = updatedDataStr.split(tempKey).join(serverRealId);
                }
            }
            data = JSON.parse(updatedDataStr);

            // 2. فحص صراع التعديل المتأخر (Last-Write-Wins Conflict Resolution)
            // نقوم بجلب حالة السجل الحالية من السيرفر للتأكد من أننا لا نمسح تعديلاً أحدث منه
            if ((type === 'UPDATE' || type === 'UPSERT') && !tempId.startsWith('temp_')) {
                const { data: currentServerRecord } = await supabase
                    .from(table)
                    .select('updated_at, timestamp')
                    .eq('id', tempId)
                    .maybeSingle();

                if (currentServerRecord) {
                    const serverTime = new Date(currentServerRecord.updated_at || currentServerRecord.timestamp).getTime();
                    if (serverTime > timestamp) {
                        console.warn(`[Offline Sync] تم قمع التعديل على السجل ${tempId} في الجدول ${table} لوجود نسخة أحدث على السيرفر.`);
                        telemetry.logWarning(`[Offline Sync] تم قمع التعديل (Last-Write-Wins) على السجل ${tempId} لتفادي الكتابة فوق بيانات أحدث.`);
                        continue; // تخطي هذه المزامنة بسلام لأن السيرفر يمتلك بيانات أحدث
                    }
                }
            }

            // 3. تنفيذ العملية الفعلية على قاعدة بيانات السيرفر
            if (type === 'INSERT') {
                // إزالة المعرف المؤقت لتوليد UUID حقيقي من PostgreSQL
                const cleanInsertData = { ...data };
                delete cleanInsertData.id;
                delete cleanInsertData.tempId;

                const { data: insertedRecord, error } = await supabase
                    .from(table)
                    .insert(cleanInsertData)
                    .select()
                    .single();

                if (error) throw error;
                
                // تسجيل وتحديث خريطة المعرفات للحفاظ على العلاقات بين الجداول
                if (insertedRecord && insertedRecord.id) {
                    idMappings[tempId] = insertedRecord.id;
                    localStorage.setItem(ID_MAPPINGS_KEY, JSON.stringify(idMappings));
                    console.log(`[Offline Sync] تم إدخال السجل بنجاح ومواءمة المعرف ${tempId} -> ${insertedRecord.id}`);
                }
            } 
            else if (type === 'UPDATE') {
                const realId = idMappings[tempId] || tempId;
                const { error } = await supabase
                    .from(table)
                    .update(data)
                    .eq('id', realId);

                if (error) throw error;
            } 
            else if (type === 'UPSERT') {
                const realId = idMappings[tempId] || tempId;
                const upsertPayload = { id: realId, ...data };
                const { error } = await supabase
                    .from(table)
                    .upsert(upsertPayload);

                if (error) throw error;
            } 
            else if (type === 'DELETE') {
                const realId = idMappings[tempId] || tempId;
                const { error } = await supabase
                    .from(table)
                    .delete()
                    .eq('id', realId);

                if (error) throw error;
            }

        } catch (err) {
            console.error(`[Offline Sync] فشلت مزامنة العملية في الجدول ${mutation.table}:`, err.message);
            telemetry.logError(`[Offline Sync] خطأ في مزامنة السجل في الجدول ${mutation.table}`, err);
            // في حال حدوث خطأ شبكة عابر، نحتفظ بالعملية لإعادة المحاولة لاحقاً
            remainingQueue.push(mutation);
        }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    if (remainingQueue.length === 0) {
        console.log("%c[Offline Sync] تم الانتهاء من مزامنة جميع البيانات المعلقة بنجاح!", "color: #00FF00; font-weight: bold;");
        telemetry.logInfo("[Offline Sync] تم إكمال جميع المزامنات وتفريغ الطابور.");
    } else {
        telemetry.logWarning(`[Offline Sync] تبقى ${remainingQueue.length} عمليات لم تُزامن بعد بسبب أخطاء.`);
    }
}

// الاستماع لعودة الإنترنت للمزامنة الفورية تلقائياً
window.addEventListener('online', () => {
    console.log("[Network] تم استعادة الاتصال بالإنترنت! جاري إطلاق محرك المزامنة...");
    syncOfflineQueue();
});

// محاولة المزامنة الدورية كل 15 ثانية في الخلفية لضمان سلامة البيانات
setInterval(syncOfflineQueue, 15000);


export async function addDoc(colRef, data) {
    if (!navigator.onLine) {
        const tempId = queueOfflineMutation('INSERT', colRef.table, data);
        return {
            id: tempId,
            data: () => ({ id: tempId, ...data })
        };
    }

    // Intercept checkout to create order in NestJS + PostgreSQL
    if (colRef.table === 'orders') {
        const token = localStorage.getItem('nestjs_token');
        if (token) {
            console.log("[ZaLo Compat Engine] Routing Order creation to NestJS API...");
            const orderPayload = {
                items: [
                    {
                        productId: parseInt(data.productID) || 1001,
                        productName: data.productName || "سلعة زالو الرائعة",
                        price: parseFloat(data.price) || data.total,
                        quantity: parseInt(data.qty) || 1
                    }
                ],
                address: data.address || "غير محدد",
                wilaya: data.wilaya || "الجزائر",
                commune: data.commune || "المرسى",
                paymentMethod: data.paymentMethod === 'BaridiMob' ? 'BARIDIMOB' : data.paymentMethod === 'CCP' ? 'CCP' : 'COD'
            };
            const result = await callNestApi('orders', 'POST', orderPayload, token);
            if (result) {
                console.log("[ZaLo Compat Engine] Order created on NestJS successfully:", result.id);
            }
        }
    }

    const cleanData = { ...data };
    const { data: inserted, error } = await supabase
        .from(colRef.table)
        .insert(cleanData)
        .select()
        .single();

    if (error) {
        console.error(`addDoc error for ${colRef.table}:`, error.message);
        throw error;
    }

    return {
        id: inserted ? (inserted.id || inserted.uid) : null,
        data: () => inserted
    };
}

export async function setDoc(docRef, data, options) {
    if (!navigator.onLine) {
        queueOfflineMutation('UPSERT', docRef.table, data, docRef.id);
        return;
    }

    const payload = { id: docRef.id, ...data };

    // Resilient fallback for shops
    if (docRef.table === 'shops') {
        try {
            const fallbackShops = JSON.parse(localStorage.getItem('zalo_fallback_shops') || '[]');
            const idx = fallbackShops.findIndex(s => s.id === docRef.id);
            if (idx === -1) {
                fallbackShops.push(payload);
            } else {
                fallbackShops[idx] = { ...fallbackShops[idx], ...payload };
            }
            localStorage.setItem('zalo_fallback_shops', JSON.stringify(fallbackShops));
        } catch (e) {
            console.warn("Failed to update shops in local storage:", e);
        }

        // Keep PostgreSQL stores table in sync
        try {
            const { data: dbUser } = await supabase.from('users').select('id').eq('supabase_uid', docRef.id).maybeSingle();
            if (dbUser) {
                const storePayload = {
                    merchant_id: dbUser.id,
                    name: data.storeName || '',
                    description: data.description || '',
                    phone: data.phone || '',
                    whatsapp: data.whatsapp || '',
                    wilaya: data.wilaya || '',
                    commune: data.commune || '',
                    category: data.category || 'عام',
                    status: 'APPROVED'
                };
                const { data: existingStore } = await supabase.from('stores').select('id').eq('merchant_id', dbUser.id).maybeSingle();
                if (existingStore) {
                    await supabase.from('stores').update(storePayload).eq('id', existingStore.id);
                } else {
                    await supabase.from('stores').insert(storePayload);
                }
            }
        } catch (e) {
            console.warn("Failed to sync stores table in setDoc:", e);
        }

        return; // Return early for nonexistent table
    }

    // Resilient fallback for merchant_requests
    if (docRef.table === 'merchant_requests') {
        try {
            const localReqs = JSON.parse(localStorage.getItem('zalo_local_merchant_requests') || '[]');
            const idx = localReqs.findIndex(r => r.id === docRef.id);
            if (idx === -1) {
                localReqs.push(payload);
            } else {
                localReqs[idx] = { ...localReqs[idx], ...payload };
            }
            localStorage.setItem('zalo_local_merchant_requests', JSON.stringify(localReqs));
        } catch (e) {
            console.warn("Failed to update merchant_requests in local storage:", e);
        }

        // Keep profiles table role, status, and wilaya perfectly in sync with the merchant request!
        try {
            const profilePayload = {
                id: docRef.id,
                name: data.storeName || data.ownerName || '',
                email: data.email || '',
                phone: data.phone || '',
                wilaya: data.wilaya || '',
                role: 'merchant',
                status: data.status || 'pending',
                updatedAt: new Date().toISOString()
            };
            await supabase.from('profiles').upsert(profilePayload);
            console.log("[ZaLo Compat Engine] Synchronized merchant profile state successfully:", profilePayload);
        } catch (e) {
            console.warn("Failed to synchronize merchant profile state:", e);
        }
    }

    const { error } = await supabase
        .from(docRef.table)
        .upsert(payload);

    if (error) {
        console.error(`setDoc error for ${docRef.table}:`, error.message);
        if (docRef.table === 'merchant_requests') {
            console.log("[ZaLo Compat Engine] Ignored missing/permission table error for merchant_requests since profile sync is complete.");
            return; // Ignore missing table errors for requests
        }
        throw error;
    }
}

export async function updateDoc(docRef, data) {
    if (!navigator.onLine) {
        queueOfflineMutation('UPDATE', docRef.table, data, docRef.id);
        return;
    }

    // Resilient fallback for shops
    if (docRef.table === 'shops') {
        try {
            const fallbackShops = JSON.parse(localStorage.getItem('zalo_fallback_shops') || '[]');
            const idx = fallbackShops.findIndex(s => s.id === docRef.id);
            if (idx !== -1) {
                fallbackShops[idx] = { ...fallbackShops[idx], ...data };
                localStorage.setItem('zalo_fallback_shops', JSON.stringify(fallbackShops));
            }
        } catch (e) {
            console.warn("Failed to update shops in local storage:", e);
        }

        // Keep PostgreSQL stores table in sync
        try {
            const { data: dbUser } = await supabase.from('users').select('id').eq('supabase_uid', docRef.id).maybeSingle();
            if (dbUser) {
                const storeUpdate = {};
                if (data.storeName) storeUpdate.name = data.storeName;
                if (data.description) storeUpdate.description = data.description;
                if (data.phone) storeUpdate.phone = data.phone;
                if (data.whatsapp) storeUpdate.whatsapp = data.whatsapp;
                if (data.wilaya) storeUpdate.wilaya = data.wilaya;
                if (data.commune) storeUpdate.commune = data.commune;
                if (data.category) storeUpdate.category = data.category;
                if (data.status) storeUpdate.status = data.status === 'active' ? 'APPROVED' : 'PENDING_APPROVAL';
                
                await supabase.from('stores').update(storeUpdate).eq('merchant_id', dbUser.id);
            }
        } catch (e) {
            console.warn("Failed to sync stores table in updateDoc:", e);
        }

        return; // Return early for nonexistent table
    }

    // Resilient fallback for merchant_requests
    if (docRef.table === 'merchant_requests') {
        try {
            const localReqs = JSON.parse(localStorage.getItem('zalo_local_merchant_requests') || '[]');
            const idx = localReqs.findIndex(r => r.id === docRef.id);
            if (idx !== -1) {
                localReqs[idx] = { ...localReqs[idx], ...data };
                localStorage.setItem('zalo_local_merchant_requests', JSON.stringify(localReqs));
            }
        } catch (e) {}

        // Call NestJS backend for approval if status is 'approved'
        if (data.status === 'approved') {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session ? session.access_token : null;
                const res = await callNestApi(`merchant-requests/${docRef.id}/approve`, 'PATCH', {}, token);
                if (res) {
                    console.log("[ZaLo Compat Engine] Successfully processed merchant approval through NestJS backend:", res);
                }
            } catch (e) {
                console.warn("[ZaLo Compat Engine] Failed to invoke NestJS backend for approval, falling back to direct db update:", e);
            }
        }

        // Also update profiles status and role
        try {
            const pUpdate = { updatedAt: new Date().toISOString() };
            if (data.status) {
                pUpdate.status = data.status;
                if (data.status === 'approved') {
                    pUpdate.role = 'merchant';
                    pUpdate.status = 'active';
                } else if (data.status === 'rejected') {
                    pUpdate.role = 'customer';
                    pUpdate.status = 'active';
                }
            }
            if (data.wilaya) pUpdate.wilaya = data.wilaya;
            await supabase.from('profiles').update(pUpdate).eq('id', docRef.id);
            console.log("[ZaLo Compat Engine] Updated profile based on request status:", pUpdate);
        } catch (e) {}
    }

    const { error } = await supabase
        .from(docRef.table)
        .update(data)
        .eq('id', docRef.id);

    if (error) {
        console.error(`updateDoc error for ${docRef.table}:`, error.message);
        if (docRef.table === 'merchant_requests') {
            console.log("[ZaLo Compat Engine] Ignored missing/permission table error for merchant_requests updateDoc.");
            return; // Ignore missing table errors for requests
        }
        throw error;
    }
}

export async function deleteDoc(docRef) {
    if (!navigator.onLine) {
        queueOfflineMutation('DELETE', docRef.table, null, docRef.id);
        return;
    }

    // Resilient fallback for shops
    if (docRef.table === 'shops') {
        try {
            const fallbackShops = JSON.parse(localStorage.getItem('zalo_fallback_shops') || '[]');
            const filtered = fallbackShops.filter(s => s.id !== docRef.id);
            localStorage.setItem('zalo_fallback_shops', JSON.stringify(filtered));
        } catch (e) {}

        // Keep PostgreSQL stores table in sync
        try {
            const { data: dbUser } = await supabase.from('users').select('id').eq('supabase_uid', docRef.id).maybeSingle();
            if (dbUser) {
                await supabase.from('stores').delete().eq('merchant_id', dbUser.id);
            }
        } catch (e) {}

        return; // Return early
    }

    const { error } = await supabase
        .from(docRef.table)
        .delete()
        .eq('id', docRef.id);

    if (error) {
        console.error(`deleteDoc error for ${docRef.table}:`, error.message);
        throw error;
    }
}

// 5. Reactive Listener (onSnapshot)
export function onSnapshot(queryOrDoc, callback, errCallback) {
    let active = true;
    let isFirstTrigger = true;
    let previousDocs = new Map(); // id -> stringified data
    
    const trigger = async () => {
        if (!active) return;
        try {
            if (queryOrDoc instanceof FirestoreDocRef) {
                const docSnap = await getDoc(queryOrDoc);
                if (active) callback(docSnap);
            } else {
                const docsSnap = await getDocs(queryOrDoc);
                const currentDocs = docsSnap.docs || [];
                
                let docChangesList = [];
                
                if (isFirstTrigger) {
                    // Initial load: all current docs are 'added'
                    docChangesList = currentDocs.map(d => ({ type: 'added', doc: d }));
                    // Save to previousDocs map
                    currentDocs.forEach(d => {
                        const dataVal = d.data ? d.data() : {};
                        previousDocs.set(d.id, JSON.stringify(dataVal));
                    });
                    isFirstTrigger = false;
                } else {
                    // Subsequent ticks: compare with previousDocs
                    const currentDocsMap = new Map();
                    
                    currentDocs.forEach(d => {
                        const dataVal = d.data ? d.data() : {};
                        const dataStr = JSON.stringify(dataVal);
                        currentDocsMap.set(d.id, dataStr);
                        
                        if (!previousDocs.has(d.id)) {
                            // Document is newly added
                            docChangesList.push({ type: 'added', doc: d });
                        } else {
                            // Document existed, check if modified
                            const prevDataStr = previousDocs.get(d.id);
                            if (prevDataStr !== dataStr) {
                                docChangesList.push({ type: 'modified', doc: d });
                            }
                        }
                    });
                    
                    // Check for removed documents
                    for (const [prevId, prevDataStr] of previousDocs.entries()) {
                        if (!currentDocsMap.has(prevId)) {
                            // Construct a dummy removed doc
                            docChangesList.push({ 
                                type: 'removed', 
                                doc: { 
                                    id: prevId, 
                                    exists: false, 
                                    exists() { return false; }, 
                                    data: () => JSON.parse(prevDataStr) 
                                } 
                            });
                        }
                    }
                    
                    // Update previousDocs to the current state
                    previousDocs = currentDocsMap;
                }
                
                const snap = {
                    empty: docsSnap.empty,
                    docs: docsSnap.docs,
                    docChanges: () => docChangesList,
                    forEach(cb) { docsSnap.docs.forEach(cb); }
                };
                if (active) callback(snap);
            }
        } catch (err) {
            if (active && errCallback) errCallback(err);
        }
    };

    trigger();

    // Clean and performant interval polling every 4 seconds for immediate updates
    const intervalId = setInterval(trigger, 4000);

    return () => {
        active = false;
        clearInterval(intervalId);
    };
}
