const fs = require('fs');
let content = fs.readFileSync('web/js/supabase-db-compat.js', 'utf8');

const handleRedirectStart = content.indexOf('window.handleUserRedirect = async function');
const handleRedirectEnd = content.indexOf('// 6. Listener for session changes (Cross-tab auth sync)', handleRedirectStart);

if (handleRedirectStart !== -1 && handleRedirectEnd !== -1) {
    const replacement = `window.handleUserRedirect = async function(providedSession = null) {
    console.log("[Role Routing] بدء التحقق من دور المستخدم وتوجيهه عبر SessionManager...");
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
        console.log("[Role Routing] لم يتم العثور على جلسة مستخدم نشطة. تسجيل خروج.");
        if (window.sessionManagerInstance) window.sessionManagerInstance.logoutAndRedirect();
        return;
    }

    const user = session.user;
    const email = user.email ? user.email.toLowerCase().trim() : '';
    const name = user.user_metadata?.full_name || email.split('@')[0];
    const AD_LIST = ['zinzinochop@gmail.com','zinochop2024@gmail.com','admin@zalo.dz','admin@zalo.com','manager@zalo.dz','manager@zalo.com'];
    let role = null;

    if (AD_LIST.includes(email) || email.endsWith('@zalo-admin.com')) {
        role = 'ADMIN';
    } else {
        let retries = 4;
        while (retries > 0 && !role) {
            try {
                const { data: dbUser } = await supabase.from('users').select('role').eq('supabase_uid', user.id).maybeSingle();
                if (dbUser && dbUser.role) { role = dbUser.role.toUpperCase(); break; }
                const { data: profileUser } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
                if (profileUser && profileUser.role) { role = profileUser.role.toUpperCase(); break; }
            } catch (err) {}
            retries--;
            if (!role && retries > 0) await new Promise(r => setTimeout(r, 500));
        }
    }
    if (!role) role = 'CUSTOMER';

    if (window.sessionManagerInstance) {
        window.sessionManagerInstance.startSession(session.access_token, role, email, name, user.id);
        window.sessionManagerInstance.redirectToHome(role);
    }
};

`;
    content = content.substring(0, handleRedirectStart) + replacement + content.substring(handleRedirectEnd);
}

// Remove old logout code in supabase-db-compat as SessionManager handles it now
const logoutStart = content.indexOf('window.logoutUser = async function()');
const logoutEnd = content.indexOf('// ------------------------------------------------------------------', logoutStart);
if (logoutStart !== -1 && logoutEnd !== -1) {
    const replacement2 = `window.logoutUser = async function() {
    console.log("[Auth] جاري تسجيل الخروج...");
    try { await supabase.auth.signOut(); } catch (e) { console.warn("Supabase signout failed:", e); }
    if (window.sessionManagerInstance) window.sessionManagerInstance.logoutAndRedirect();
};

`;
    content = content.substring(0, logoutStart) + replacement2 + content.substring(logoutEnd);
}

fs.writeFileSync('web/js/supabase-db-compat.js', content);
console.log("supabase-db-compat.js patched");
