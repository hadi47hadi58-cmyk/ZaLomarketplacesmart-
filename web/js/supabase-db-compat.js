// ZaLo Smart Marketplace - Supabase & NestJS Unified Compatibility Layer
// This file acts as a drop-in replacement for the Firebase modular SDK,
// routing all operations completely and cleanly through Supabase AND our NestJS + PostgreSQL Backend.

import { supabase } from './supabase-config.js';
import { telemetry } from './telemetry-logger.js';

export { supabase, telemetry };

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
    
    // فحص المسار الحالي للتأكد من عدم التكرار اللانهائي - مطابقة حقيقية للملفات الموجودة
    const isAlreadyOnAdmin = currentPath.endsWith('dashboard-admin.html') || currentPath.endsWith('admin.html');
    const isAlreadyOnDashboard = currentPath.endsWith('dashboard-store.html') || currentPath.endsWith('dashboard.html');
    const isAlreadyOnIndex = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');

    console.log(`[Role Routing] الدور النشط الحالي: ${role} | المسار الحالي: ${currentPath}`);

    if (role === 'ADMIN') {
        if (!isAlreadyOnAdmin) {
            console.log("[Role Routing] جاري توجيه المدير إلى صفحة لوحة التحكم الإدارية (dashboard-admin.html)...");
            window.location.replace('dashboard-admin.html');
        }
    } else if (role === 'MERCHANT') {
        if (!isAlreadyOnDashboard) {
            console.log("[Role Routing] جاري توجيه التاجر إلى صفحة لوحة التحكم التجارية (dashboard-store.html)...");
            window.location.replace('dashboard-store.html');
        }
    } else { // CUSTOMER
        if (isAlreadyOnAdmin || isAlreadyOnDashboard) {
            console.log("[Role Routing] جاري توجيه الزبون إلى الصفحة الرئيسية (index.html)...");
            window.location.replace('index.html');
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
    } else {
        // Logged out
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
    return { name: "ZaLo-Unified-Auth-Compat" };
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
            if (isSetted) {
                triggerCallback(null);
            }
        }
    });

    timeoutId = setTimeout(() => {
        if (!isSetted) {
            console.log("onAuthStateChanged: Settle timeout reached, fallback to null.");
            isSetted = true;
            triggerCallback(null);
        }
    }, maxWaitMs);

    return () => {
        if (timeoutId) clearTimeout(timeoutId);
        subscription.unsubscribe();
    };
}

export async function signOut() {
    localStorage.removeItem('nestjs_token');
    localStorage.removeItem('nestjs_user');
    return await supabase.auth.signOut();
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
                    forEach(cb) { docs.forEach(cb); }
                };
            }
        }
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
                    data = JSON.parse(raw);
                    error = null;
                    console.log(`[ZaLo Compat Engine] Used local storage fallback for ${table} after error/empty response.`);
                }
            }
        }
    } catch (timeoutErr) {
        console.warn(`[ZaLo Compat Engine] Query for ${table} timed out. Falling back to local storage...`);
        const fallbackKey = table === 'shops' ? 'zalo_fallback_shops' : (table === 'products' ? 'zalo_fallback_products' : null);
        if (fallbackKey) {
            const raw = localStorage.getItem(fallbackKey);
            if (raw) {
                data = JSON.parse(raw);
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
    const { error } = await supabase
        .from(docRef.table)
        .upsert(payload);

    if (error) {
        console.error(`setDoc error for ${docRef.table}:`, error.message);
        throw error;
    }
}

export async function updateDoc(docRef, data) {
    if (!navigator.onLine) {
        queueOfflineMutation('UPDATE', docRef.table, data, docRef.id);
        return;
    }

    const { error } = await supabase
        .from(docRef.table)
        .update(data)
        .eq('id', docRef.id);

    if (error) {
        console.error(`updateDoc error for ${docRef.table}:`, error.message);
        throw error;
    }
}

export async function deleteDoc(docRef) {
    if (!navigator.onLine) {
        queueOfflineMutation('DELETE', docRef.table, null, docRef.id);
        return;
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
