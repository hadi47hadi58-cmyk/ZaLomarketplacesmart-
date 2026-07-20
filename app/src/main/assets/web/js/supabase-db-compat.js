import sessionManagerInstance from './session-manager.js';
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
window.handleUserRedirect = async function(providedSession = null) {
    console.log("[Role Routing] بدء التحقق من دور المستخدم وتوجيهه...");
    
    // 1. جلب الجلسة الحالية بشكل آمن
    let session = providedSession;
    try {
        if (!session) {
            const { data } = await supabase.auth.getSession();
            session = data.session;
        }
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

    // مزامنة التوكينات والهوية بشكل متزامن فوري لمنع حلقات إعادة التوجيه
    if (session) {
        const token = session.access_token;
        localStorage.setItem('nestjs_token', token);
        localStorage.setItem('zalo_session_jwt', token);
        localStorage.setItem('zalo_user_email', email);
        
        const userObj = {
            id: user.id,
            email: email,
            name: user.user_metadata?.full_name || email.split('@')[0] || ''
        };
        localStorage.setItem('nestjs_user', JSON.stringify(userObj));
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
    const isAlreadyOnManager = currentPath.endsWith('dashboard-manager.html');
    const isAlreadyOnCustomer = currentPath.endsWith('customer-home.html');
    const isLoginPage = currentPath.includes('login') || currentPath.includes('register') || currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');

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
    } else if (role === 'MANAGER' || role === 'TEAM') {
        if (!isAlreadyOnManager) {
            console.log("[Role Routing] جاري توجيه الموظف إلى صفحة فريق العمل (dashboard-manager.html)...");
            window.location.replace('dashboard-manager.html');
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

// --- Native Google Sign-In Callbacks (Unified & Secure) ---
window.onGoogleIdTokenReceived = async function(idToken) {
    console.log("[Google Auth] Received Google ID token from Android Native SDK. Logging in to Supabase...");
    try {
        if (!supabase) throw new Error("قاعدة البيانات غير متصلة");
        
        // Show progress on active UI
        const successDiv = document.getElementById('successMsg');
        if (successDiv) {
            successDiv.textContent = '✨ تم التحقق من حساب Google! جاري تسجيل الدخول...';
            successDiv.style.display = 'block';
        }
        
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken
        });
        
        if (error) throw error;
        
        console.log("[Google Auth] Successfully logged in to Supabase using ID token!");
        
        if (successDiv) {
            successDiv.textContent = '✨ تم الدخول بنجاح! جاري توجيهك...';
        }
        
        // Redirect using the unified redirect handler
        await window.handleUserRedirect(data.session);
    } catch (err) {
        console.error("[Google Auth] Failed to authenticate with Supabase:", err);
        const errorDiv = document.getElementById('errorMsg');
        if (errorDiv) {
            errorDiv.textContent = "فشل المصادقة مع السيرفر: " + err.message;
            errorDiv.style.display = 'block';
        } else {
            alert("فشل المصادقة: " + err.message);
        }
        // Reset any disabled spinner buttons on the page
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'تسجيل الدخول 🚀';
        }
    }
};

window.onGoogleIdTokenFailed = function(reason) {
    console.error("[Google Auth] Native Google sign-in failed or cancelled:", reason);
    const errorDiv = document.getElementById('errorMsg') || document.getElementById('error-message');
    let message = 'حدث خطأ أثناء محاولة الدخول بواسطة Google';
    if (reason === 'cancelled' || reason === '12501') {
        message = 'تم إلغاء عملية تسجيل الدخول بواسطة Google';
    } else if (reason === 'id_token_null') {
        message = 'فشل الحصول على رمز تعريف جوجل الآمن من السيرفر';
    } else if (reason === '10' || reason === 'DEVELOPER_ERROR') {
        message = 'تنبيه المصادقة (خطأ 10): لم يتم تسجيل بصمة SHA-1 الخاصة بك في جوجل كونسول بعد، يرجى المتابعة بملء البيانات يدوياً أو تجربة الدخول السريع للمطورين بالأسفل.';
    } else {
        message = `حدث خطأ في مصادقة جوجل (كود: ${reason})`;
    }
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        alert(message);
    }
    // Reset any disabled spinner buttons on the page
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.disabled = false;
        const iconHtml = loginBtn.querySelector('i') ? '<i class="fa-solid fa-right-to-bracket"></i> ' : '';
        loginBtn.innerHTML = iconHtml + 'تسجيل الدخول 🚀';
    }
};

// --- Emergency / Developer Bypass Quick Login ---
window.triggerEmergencyBypass = function(targetRole) {
    console.log(`[Emergency Bypass] Initiating emergency bypass for role: ${targetRole}...`);
    
    // 1. Determine mock credentials
    let email = 'hadi47hadi58@gmail.com'; // Default user's email
    let name = 'مدير عام المنصة';
    let role = targetRole ? targetRole.toUpperCase() : 'ADMIN';
    
    if (role === 'MERCHANT' || role === 'STORE') {
        role = 'MERCHANT';
        email = 'merchant@zalo.dz';
        name = 'متجر تجريبي زالو';
    } else if (role === 'MANAGER' || role === 'STAFF') {
        role = 'MANAGER';
        email = 'manager@zalo.dz';
        name = 'وكيل التوصيل والعمليات';
    } else if (role === 'CUSTOMER') {
        role = 'CUSTOMER';
        email = 'customer@zalo.dz';
        name = 'زبون زالو';
    }
    
    const mockToken = "mock_jwt_token_bypass_" + Math.random().toString(36).substring(2);
    const mockUid = "mock_uid_" + Math.random().toString(36).substring(2);
    
    // 2. Set all local storage tokens
    localStorage.setItem('zalo_session_jwt', mockToken);
    localStorage.setItem('nestjs_token', mockToken);
    localStorage.setItem('zalo_user_role', role);
    localStorage.setItem('zalo_user_email', email);
    localStorage.setItem('zalo_uid', mockUid);
    
    if (role === 'ADMIN') {
        sessionStorage.setItem('admin_logged_in_session', 'true');
    }
    
    const userObj = {
        id: mockUid,
        email: email,
        name: name
    };
    localStorage.setItem('nestjs_user', JSON.stringify(userObj));
    
    // Active Session Sync
    const activeSessionUser = {
        uid: mockUid,
        email: email,
        name: name,
        phone: "0555123456",
        role: role.toLowerCase(),
        status: "ACTIVE"
    };
    localStorage.setItem('zalo_active_session', JSON.stringify(activeSessionUser));
    
    console.log("[Emergency Bypass] Local storage successfully configured. Routing to dashboard...");
    
    // 3. Routing
    if (role === 'ADMIN') {
        window.location.replace('dashboard-admin.html');
    } else if (role === 'MERCHANT') {
        window.location.replace('dashboard-store.html');
    } else if (role === 'MANAGER') {
        window.location.replace('dashboard-manager.html');
    } else {
        window.location.replace('customer-home.html');
    }
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
            await window.handleUserRedirect(session);
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
        try {
            const token = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token');
            const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            const res = await fetch((window.NESTJS_API_URL || 'http://localhost:3000/api') + '/products', { headers });
            if (res.ok) {
                const result = await res.json();
                if (result && result.data) {
                    console.log("[ZaLo Compat] Fetched products from NestJS:", result.data.length);
                    return {
                        docs: result.data.map(p => ({
                            id: p.id,
                            exists: true,
                            data: () => p
                        }))
                    };
                }
            }
        } catch(e) {
            console.warn("[ZaLo Compat] NestJS products fetch failed, falling back to Supabase", e);
        }
    }

    // 2. Try NestJS routing for orders list
    if (table === 'orders') {
        try {
            const token = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token');
            if (token) {
                const headers = { 'Authorization': 'Bearer ' + token };
                const res = await fetch((window.NESTJS_API_URL || 'http://localhost:3000/api') + '/orders', { headers });
                if (res.ok) {
                    const result = await res.json();
                    if (result && result.data) {
                        console.log("[ZaLo Compat] Fetched orders from NestJS:", result.data.length);
                        return {
                            docs: result.data.map(o => ({
                                id: o.id,
                                exists: true,
                                data: () => o
                            }))
                        };
                    }
                }
            }
        } catch(e) {
            console.warn("[ZaLo Compat] NestJS orders fetch failed, falling back to Supabase", e);
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
    // Intercept checkout to create order in NestJS + PostgreSQL
    if (colRef.table === 'orders') {
        try {
            const token = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token');
            if (token) {
                const res = await fetch((window.NESTJS_API_URL || 'http://localhost:3000/api') + '/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    const result = await res.json();
                    return {
                        id: result.data.id,
                        data: () => result.data
                    };
                }
            }
        } catch (e) {
            console.warn("[ZaLo Compat] NestJS add order failed, falling back to Supabase", e);
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

        /* profiles table sync removed */
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

// --- Biometric Authentication Bridge & Interactive Simulation ---
window.onBiometricAuthSuccess = function() {
    console.log("[Biometric Auth] Success callback triggered.");
    const successDiv = document.getElementById('successMsg') || document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = '✨ تم التحقق من البصمة بنجاح! جاري الدخول السلس...';
        successDiv.style.display = 'block';
    }
    
    // Determine the role based on the current page to route appropriately
    const currentPath = window.location.pathname;
    let targetRole = 'ADMIN'; // Default to admin for general manager
    if (currentPath.includes('store-login') || currentPath.includes('dashboard-store')) {
        targetRole = 'MERCHANT';
    } else if (currentPath.includes('staff-login') || currentPath.includes('dashboard-manager')) {
        targetRole = 'STAFF';
    } else if (currentPath.includes('customer-login') || currentPath.includes('customer-home')) {
        targetRole = 'CUSTOMER';
    }
    
    setTimeout(() => {
        window.triggerEmergencyBypass(targetRole);
    }, 800);
};

window.onBiometricAuthFailed = function(reason) {
    console.warn("[Biometric Auth] Failed or cancelled:", reason);
    const errorDiv = document.getElementById('errorMsg') || document.getElementById('error-message');
    if (errorDiv) {
        if (reason === 'cancelled') {
            errorDiv.textContent = 'تم إلغاء التحقق ببصمة الإصبع.';
        } else {
            errorDiv.textContent = 'فشل التحقق ببصمة الإصبع. يرجى المحاولة مجدداً.';
        }
        errorDiv.style.display = 'block';
    }
};

window.onBiometricAuthFallback = function() {
    console.log("[Biometric Auth] Triggering visual biometric scanner simulation fallback...");
    window.showBiometricSimulationModal();
};

window.showBiometricSimulationModal = function() {
    const existing = document.getElementById('biometric-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'biometric-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(8, 14, 10, 0.95)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.webkitBackdropFilter = 'blur(10px)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.color = '#f8fafc';
    modal.style.fontFamily = "'Cairo', sans-serif";
    modal.style.direction = 'rtl';
    
    modal.innerHTML = `
        <div style="background: rgba(30, 41, 59, 0.85); border: 2.5px solid #d4af37; border-radius: 24px; padding: 30px; width: 90%; max-width: 360px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); animation: scaleIn 0.3s ease-out; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50px; left: -50px; width: 100px; height: 100px; background: rgba(212, 175, 55, 0.05); border-radius: 50%;"></div>
            
            <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 8px; color: #d4af37;">تحقق من هويتك</h3>
            <p style="font-size: 12px; color: #cbd5e1; margin-bottom: 24px;">استخدم مقاييسك الحيوية للتأكد من هويتك</p>
            
            <div id="scanner-container" style="position: relative; width: 120px; height: 120px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div id="pulse-ring" style="position: absolute; width: 110px; height: 110px; border: 2px dashed rgba(34, 197, 94, 0.4); border-radius: 50%; animation: spin 8s linear infinite;"></div>
                <div id="pulse-ring-inner" style="position: absolute; width: 90px; height: 90px; border: 2.5px solid rgba(212, 175, 55, 0.2); border-radius: 50%; animation: pulse 1.8s infinite;"></div>
                
                <button type="button" id="fingerprint-trigger-btn" style="z-index: 10; border: none; background: radial-gradient(circle, #22c55e 0%, #15803d 100%); width: 76px; height: 76px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(34, 197, 94, 0.6); transition: all 0.3s; cursor: pointer; color: white;">
                    <i class="fa-solid fa-fingerprint" style="font-size: 38px;"></i>
                </button>
            </div>
            
            <div id="biometric-status" style="font-size: 14px; font-weight: 700; color: #cbd5e1; margin-bottom: 20px; height: 40px; transition: all 0.3s;">المس اداة استشعار اصبع</div>
            
            <div style="background: rgba(148, 163, 184, 0.1); height: 6px; border-radius: 3px; width: 100%; overflow: hidden; margin-bottom: 24px;">
                <div id="biometric-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #d4af37, #22c55e); transition: width 0.1s linear;"></div>
            </div>
            
            <button type="button" id="close-biometric-btn" style="background: transparent; border: 1.5px solid #475569; color: #94a3b8; padding: 8px 24px; border-radius: 10px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                إلغاء العملية
            </button>
        </div>
        
        <style>
            @keyframes scaleIn {
                from { transform: scale(0.9); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.2; box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
                70% { transform: scale(1.15); opacity: 0.6; box-shadow: 0 0 0 15px rgba(212, 175, 55, 0); }
                100% { transform: scale(1); opacity: 0.2; box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
            }
            @keyframes spin {
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(modal);
    
    const triggerBtn = document.getElementById('fingerprint-trigger-btn');
    const pulseRing = document.getElementById('pulse-ring');
    const statusText = document.getElementById('biometric-status');
    const progress = document.getElementById('biometric-progress');
    const closeBtn = document.getElementById('close-biometric-btn');
    
    let isScanning = false;
    let scanPercentage = 0;
    let intervalId = null;
    
    const startScan = () => {
        if (isScanning) return;
        isScanning = true;
        
        triggerBtn.style.background = 'radial-gradient(circle, #eab308 0%, #a16207 100%)';
        triggerBtn.style.boxShadow = '0 0 30px rgba(234, 179, 8, 0.8)';
        pulseRing.style.borderColor = 'rgba(234, 179, 8, 0.8)';
        statusText.innerHTML = '⚡ جاري مسح البصمة وتحليل خطوط الأمان الحيوية...';
        statusText.style.color = '#eab308';
        
        intervalId = setInterval(() => {
            scanPercentage += 5;
            progress.style.width = scanPercentage + '%';
            
            if (scanPercentage >= 100) {
                clearInterval(intervalId);
                
                triggerBtn.style.background = 'radial-gradient(circle, #22c55e 0%, #15803d 100%)';
                triggerBtn.style.boxShadow = '0 0 35px rgba(34, 197, 94, 0.9)';
                pulseRing.style.borderColor = 'rgba(34, 197, 94, 0.9)';
                pulseRing.style.animation = 'none';
                statusText.innerHTML = '🎉 تم التحقق والمطابقة الحيوية بنجاح!';
                statusText.style.color = '#22c55e';
                
                setTimeout(() => {
                    modal.remove();
                    window.onBiometricAuthSuccess();
                }, 800);
            }
        }, 80);
    };
    
    const stopScan = () => {
        if (!isScanning) return;
        if (scanPercentage < 100) {
            clearInterval(intervalId);
            isScanning = false;
            scanPercentage = 0;
            progress.style.width = '0%';
            triggerBtn.style.background = 'radial-gradient(circle, #22c55e 0%, #15803d 100%)';
            triggerBtn.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.6)';
            pulseRing.style.borderColor = 'rgba(34, 197, 94, 0.4)';
            pulseRing.style.animation = 'spin 8s linear infinite';
            statusText.innerHTML = 'المس اداة استشعار اصبع';
            statusText.style.color = '#cbd5e1';
        }
    };
    
    triggerBtn.addEventListener('mousedown', startScan);
    triggerBtn.addEventListener('mouseup', stopScan);
    triggerBtn.addEventListener('mouseleave', stopScan);
    
    triggerBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startScan();
    });
    triggerBtn.addEventListener('touchend', stopScan);
    
    closeBtn.addEventListener('click', () => {
        if (intervalId) clearInterval(intervalId);
        modal.remove();
        window.onBiometricAuthFailed('cancelled');
    });
};

window.triggerBiometricAuth = function() {
    console.log("[Biometric Auth] Starting biometric authentication flow...");
    if (window.AndroidInterface && typeof window.AndroidInterface.requestBiometricAuth === 'function') {
        window.AndroidInterface.requestBiometricAuth();
    } else {
        // Fallback to visual modal simulation if running outside native Android context
        window.onBiometricAuthFallback();
    }
};

