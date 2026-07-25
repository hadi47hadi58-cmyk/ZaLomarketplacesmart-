// ZaLo Marketplace Smart Sync Update: 2026-07-21
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
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    return session;
  }

  async isAuthenticated() {
    const session = await this.getSupabaseSession();
    const hasLocalSession = !!localStorage.getItem('user_uid') || 
                            !!localStorage.getItem('zalo_user_role') || 
                            !!localStorage.getItem('zalo_role') || 
                            sessionStorage.getItem('user_logged_in') === 'true' || 
                            sessionStorage.getItem('admin_logged_in_session') === 'true';
    return (!!session && !!session.user) || hasLocalSession;
  }

  async getSessionData() {
    const session = await this.getSupabaseSession();
    const role = await this.getUserRole();
    return {
      token: session?.access_token || 'local_session',
      role: role.toLowerCase(),
      email: session?.user?.email || localStorage.getItem('user_email') || 'merchant@zalo.dz',
      name: session?.user?.user_metadata?.full_name || localStorage.getItem('zalo_active_store') || ''
    };
  }

  async getUserRole() {
    const session = await this.getSupabaseSession();
    const localRole = localStorage.getItem('zalo_user_role') || localStorage.getItem('zalo_role');
    let role = session?.user?.app_metadata?.role || session?.user?.user_metadata?.role || localRole;
    if (!role) {
      const path = window.location.pathname;
      if (path.includes('dashboard-store') || path.includes('store-login')) role = 'MERCHANT';
      else if (path.includes('dashboard-admin') || path.includes('admin-login')) role = 'ADMIN';
      else if (path.includes('dashboard-manager') || path.includes('staff-login')) role = 'MANAGER';
      else role = 'CUSTOMER';
    }
    return role.toUpperCase();
  }

  async handleAutoRedirection() {
    const isAuth = await this.isAuthenticated();
    const role = await this.getUserRole();
    const path = window.location.pathname;

    const isGuestPage = path.includes('-login.html') || path.includes('register');
    const isProtectedPage = path.includes('dashboard');

    if (isAuth && isGuestPage) {
      console.log(`[SessionManager] Authenticated user on guest page. Redirecting to appropriate home.`);
      this.redirectToHome(role);
    } else if (!isAuth && isProtectedPage) {
      console.warn(`[SessionManager] Unauthenticated user on protected page. Redirecting to login.`);
      this.logoutAndRedirect();
    }
  }

  redirectToHome(role) {
    const cleanRole = (role || 'CUSTOMER').toUpperCase();
    const currentPath = window.location.pathname;

    // Prevent redirect loop if user is already on a dashboard matching their intended section
    if (currentPath.includes('dashboard-admin.html') && cleanRole === 'ADMIN') return;
    if (currentPath.includes('dashboard-store.html') && (cleanRole === 'MERCHANT' || localStorage.getItem('zalo_user_role') === 'merchant')) return;
    if (currentPath.includes('dashboard-manager.html') && (cleanRole === 'MANAGER' || cleanRole === 'TEAM')) return;
    if (currentPath.includes('customer-home.html') && cleanRole === 'CUSTOMER') return;

    if (cleanRole === 'ADMIN') {
      if (!currentPath.includes('dashboard-admin.html')) window.location.replace('dashboard-admin.html');
    } else if (cleanRole === 'MERCHANT' || localStorage.getItem('zalo_user_role') === 'merchant') {
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
  await window.sessionManagerInstance.handleAutoRedirection();
});
export default window.sessionManagerInstance;
