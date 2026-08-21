// ZaLo Marketplace Smart Sync Update: 2026-07-27
/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام إدارة الجلسات الذكي والتوجيه التلقائي الآمن - Smart Session Manager
 */

export class SessionManager {
  constructor() {}

  async getSupabaseSession() {
    if (!window.supabaseClient && !window.supabase) return null;
    const client = window.supabaseClient || window.supabase;
    try {
      const { data: { session }, error } = await client.auth.getSession();
      if (error) {
          console.warn("Session Error:", error.message);
          return null;
      }
      return session;
    } catch(e) {
      return null;
    }
  }

  async isAuthenticated() {
    const session = await this.getSupabaseSession();
    if (session && session.user) return true;

    // Check local session tokens and admin/merchant login state
    const localToken = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('zalo_token') || localStorage.getItem('zalo_uid');
    const localRole = localStorage.getItem('zalo_role');
    const localEmail = localStorage.getItem('zalo_user_email');
    const adminSession = sessionStorage.getItem('admin_logged_in_session');
    const path = window.location.pathname;

    if (path.includes('dashboard-admin.html') && (adminSession === 'true' || localRole === 'ADMIN' || localRole === 'SUPER_ADMIN' || localToken || localEmail)) {
      return true;
    }
    if (path.includes('dashboard-store.html') && (localRole === 'MERCHANT' || localToken || localEmail)) {
      return true;
    }
    if (path.includes('dashboard-manager.html') && (localRole === 'MANAGER' || localRole === 'TEAM' || localToken || localEmail)) {
      return true;
    }
    if (localToken && (localRole || localEmail)) {
      return true;
    }

    return false;
  }

  async getSessionData() {
    const session = await this.getSupabaseSession();
    const role = await this.getUserRole();
    return {
      token: session?.access_token || localStorage.getItem('zalo_session_jwt') || null,
      role: role.toLowerCase(),
      email: session?.user?.email || localStorage.getItem('zalo_user_email') || null,
      name: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || localStorage.getItem('zalo_user_name') || ''
    };
  }

  async getUserRole() {
    const path = window.location.pathname;
    const localRole = localStorage.getItem('zalo_role');

    // Contextual role per page
    if (path.includes('dashboard-admin.html')) return 'ADMIN';
    if (path.includes('dashboard-store.html')) return 'MERCHANT';
    if (path.includes('dashboard-manager.html')) return 'MANAGER';

    const session = await this.getSupabaseSession();
    if (!session || !session.user) return (localRole || 'CUSTOMER').toUpperCase();

    // 1. Check token metadata for role
    let role = session.user.app_metadata?.role || session.user.user_metadata?.role;

    // 2. Fetch role from Supabase profiles table
    if (!role) {
        try {
            const client = window.supabaseClient || window.supabase;
            if (client && client.from) {
                const { data: profile } = await client
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .maybeSingle();
                
                if (profile && profile.role) {
                    role = profile.role;
                }
            }
        } catch (error) {
            console.error("Error fetching user role from Supabase profiles:", error);
        }
    }

    if (!role && localRole) role = localRole;

    return (role || 'CUSTOMER').toUpperCase();
  }

  async handleAutoRedirection() {
    const path = window.location.pathname;
    const isGuestPage = path.includes('-login.html') || path.includes('register');
    const isProtectedPage = path.includes('dashboard');

    if (isProtectedPage) {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        console.warn(`[SessionManager] Unauthenticated user on protected page. Redirecting to login.`);
        this.logoutAndRedirect();
      }
      return;
    }

    const isAuth = await this.isAuthenticated();
    const role = isAuth ? await this.getUserRole() : null;

    if (isAuth && isGuestPage) {
      console.log(`[SessionManager] Authenticated user on guest page. Redirecting to appropriate home.`);
      this.redirectToHome(role);
    }
  }

  redirectToHome(role) {
    const cleanRole = (role || 'CUSTOMER').toUpperCase();
    const currentPath = window.location.pathname;

    if (currentPath.includes('dashboard-admin.html') && (cleanRole === 'ADMIN' || cleanRole === 'SUPER_ADMIN')) return;
    if (currentPath.includes('dashboard-store.html') && cleanRole === 'MERCHANT') return;
    if (currentPath.includes('dashboard-manager.html') && (cleanRole === 'MANAGER' || cleanRole === 'TEAM')) return;
    if (currentPath.includes('customer-home.html') && cleanRole === 'CUSTOMER') return;

    if (cleanRole === 'ADMIN' || cleanRole === 'SUPER_ADMIN') {
      if (!currentPath.includes('dashboard-admin.html')) window.location.replace('dashboard-admin.html');
    } else if (cleanRole === 'MERCHANT') {
      if (!currentPath.includes('dashboard-store.html')) window.location.replace('dashboard-store.html');
    } else if (cleanRole === 'MANAGER' || cleanRole === 'TEAM') {
      if (!currentPath.includes('dashboard-manager.html')) window.location.replace('dashboard-manager.html');
    } else {
      if (!currentPath.includes('customer-home.html')) window.location.replace('customer-home.html');
    }
  }

  async logoutAndRedirect() {
    try {
      if (window.supabaseClient && window.supabaseClient.auth) {
        await window.supabaseClient.auth.signOut().catch(() => {});
      }
    } catch(e){}
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch(e){}

    const currentPath = window.location.pathname;
    let targetLogin = 'customer-login.html';
    if (currentPath.includes('dashboard-admin')) targetLogin = 'admin-login.html';
    else if (currentPath.includes('dashboard-store')) targetLogin = 'store-login.html';
    else if (currentPath.includes('dashboard-manager')) targetLogin = 'staff-login.html';

    if (!currentPath.includes('-login.html')) {
      window.location.replace(targetLogin);
    }
  }
}

window.sessionManagerInstance = new SessionManager();

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.location.hash.includes('access_token=')) {
      await window.sessionManagerInstance.handleAutoRedirection();
  }
});

export default window.sessionManagerInstance;
