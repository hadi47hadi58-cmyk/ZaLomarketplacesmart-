// ZaLo Marketplace Smart Sync Update: 2026-07-27
/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام إدارة الجلسات الذكي والتوجيه التلقائي الآمن - Smart Session Manager
 */

export class SessionManager {
  constructor() {}

  async getSupabaseSession() {
    if (!window.supabaseClient) return null;
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    if (error) {
        console.error("Session Error:", error.message);
        return null;
    }
    return session;
  }

  async isAuthenticated() {
    const session = await this.getSupabaseSession();
    return !!session && !!session.user;
  }

  async getSessionData() {
    const session = await this.getSupabaseSession();
    const role = await this.getUserRole();
    return {
      token: session?.access_token || null,
      role: role.toLowerCase(),
      email: session?.user?.email || null,
      name: session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || ''
    };
  }

  async getUserRole() {
    const session = await this.getSupabaseSession();
    if (!session || !session.user) return 'CUSTOMER';

    const path = window.location.pathname;
    const localRole = localStorage.getItem('zalo_role');

    // 1. Check token metadata for role
    let role = session.user.app_metadata?.role || session.user.user_metadata?.role;

    // 2. Fetch role from Supabase profiles table
    if (!role) {
        try {
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();
            
            if (profile && profile.role) {
                role = profile.role;
            }
        } catch (error) {
            console.error("Error fetching user role from Supabase profiles:", error);
        }
    }

    // 3. Robust context fallback to prevent accidental role loss during redirection
    if ((!role || role === 'CUSTOMER')) {
        if (path.includes('dashboard-admin.html') && (localRole === 'ADMIN' || localRole === 'SUPER_ADMIN')) role = localRole;
        else if (path.includes('dashboard-store.html') && localRole === 'MERCHANT') role = localRole;
        else if (path.includes('dashboard-manager.html') && (localRole === 'MANAGER' || localRole === 'TEAM')) role = localRole;
        else if (localRole && localRole !== 'CUSTOMER') role = localRole;
    }

    // 4. Page context fallback
    if ((!role || role === 'CUSTOMER')) {
        if (path.includes('dashboard-admin.html')) role = 'ADMIN';
        else if (path.includes('dashboard-store.html')) role = 'MERCHANT';
        else if (path.includes('dashboard-manager.html')) role = 'MANAGER';
    }

    return (role || localRole || 'CUSTOMER').toUpperCase();
  }

  async handleAutoRedirection() {
    const isAuth = await this.isAuthenticated();
    const role = isAuth ? await this.getUserRole() : null;
    const path = window.location.pathname;

    const isGuestPage = path.includes('-login.html') || path.includes('register');
    const isProtectedPage = path.includes('dashboard');

    if (isAuth && isGuestPage) {
      console.log(`[SessionManager] Authenticated user on guest page. Redirecting to appropriate home.`);
      this.redirectToHome(role);
    } else if (!isAuth && isProtectedPage) {
      console.warn(`[SessionManager] Unauthenticated user on protected page. Redirecting to login.`);
      this.logoutAndRedirect();
    } else if (isAuth && isProtectedPage) {
        // Allow valid roles without unnecessary bouncing
        if (path.includes('dashboard-admin.html') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
             // If user is logged in as merchant/customer on admin dashboard, check if they are authorized
             console.warn("[SessionManager] Role check on admin dashboard:", role);
        }
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
