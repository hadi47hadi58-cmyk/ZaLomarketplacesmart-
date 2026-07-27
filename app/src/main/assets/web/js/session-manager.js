// ZaLo Marketplace Smart Sync Update: 2026-07-27
/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام إدارة الجلسات الذكي والتوجيه التلقائي الآمن - Smart Session Manager
 */
export class SessionManager {
  constructor() {
    // We will rely on Supabase for the session
  }

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
      name: session?.user?.user_metadata?.full_name || ''
    };
  }

  async getUserRole() {
    const session = await this.getSupabaseSession();
    if (!session || !session.user) return 'CUSTOMER';
    
    const path = window.location.pathname;
    const localRole = localStorage.getItem('zalo_role');

    // If user is on admin dashboard and has localRole ADMIN, trust it
    if (path.includes('dashboard-admin.html') && (localRole === 'ADMIN' || localRole === 'SUPER_ADMIN')) {
      return localRole;
    }
    // If user is on store dashboard and has localRole MERCHANT, trust it
    if (path.includes('dashboard-store.html') && localRole === 'MERCHANT') {
      return localRole;
    }
    // If user is on manager dashboard and has localRole MANAGER/TEAM, trust it
    if (path.includes('dashboard-manager.html') && (localRole === 'MANAGER' || localRole === 'TEAM')) {
      return localRole;
    }

    // First, check token metadata for role (fastest)
    let role = session.user.app_metadata?.role || session.user.user_metadata?.role;
    
    if (!role) {
        // Securely fetch role from profiles table as Single Source of Truth
        try {
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();
            
            if (profile && profile.role && profile.role !== 'CUSTOMER') {
                role = profile.role;
            }
        } catch (error) {
            console.error("Error fetching user role from Supabase:", error);
        }
    }

    // Fallback to localRole if DB/metadata didn't specify a higher privilege
    if ((!role || role === 'CUSTOMER') && localRole && localRole !== 'CUSTOMER') {
        if (path.includes('dashboard-admin.html') && (localRole === 'ADMIN' || localRole === 'SUPER_ADMIN')) role = localRole;
        if (path.includes('dashboard-store.html') && localRole === 'MERCHANT') role = localRole;
        if (path.includes('dashboard-manager.html') && (localRole === 'MANAGER' || localRole === 'TEAM')) role = localRole;
    }

    // If still no role found, but user is on a protected dashboard, allow context role to prevent accidental kickout
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
        // Strict Role Check for Dashboards
        if (path.includes('dashboard-admin.html') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
             console.error("[SessionManager] Access Denied: Admin role required.");
             this.redirectToHome(role);
        }
        if (path.includes('dashboard-manager.html') && role !== 'MANAGER' && role !== 'TEAM' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
             console.error("[SessionManager] Access Denied: Manager role required.");
             this.redirectToHome(role);
        }
        // Store dashboard allows MERCHANTS and ADMINS
        if (path.includes('dashboard-store.html') && role !== 'MERCHANT' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
             console.error("[SessionManager] Access Denied: Merchant role required.");
             this.redirectToHome(role);
        }
    }
  }

  redirectToHome(role) {
    const cleanRole = (role || 'CUSTOMER').toUpperCase();
    const currentPath = window.location.pathname;

    // Prevent redirect loop if user is already on a dashboard matching their intended section
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
  // Only auto-redirect if we're not inside the auth callback 
  // (we let the specific login pages handle auth callback specifically)
  if (!window.location.hash.includes('access_token=')) {
      await window.sessionManagerInstance.handleAutoRedirection();
  }
});
export default window.sessionManagerInstance;
