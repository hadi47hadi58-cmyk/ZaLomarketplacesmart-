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
    return !!session && !!session.user;
  }

  async getSessionData() {
    const session = await this.getSupabaseSession();
    if (!session || !session.user) return null;
    
    // Extract role from app_metadata or user_metadata
    const role = session.user.app_metadata?.role || session.user.user_metadata?.role || 'CUSTOMER';
    return {
      token: session.access_token,
      role: role.toLowerCase(),
      email: session.user.email,
      name: session.user.user_metadata?.full_name || ''
    };
  }

  async getUserRole() {
    const session = await this.getSupabaseSession();
    const role = session?.user?.app_metadata?.role || session?.user?.user_metadata?.role || 'CUSTOMER';
    return role.toUpperCase();
  }

  async handleAutoRedirection() {
    const isAuth = await this.isAuthenticated();
    const role = await this.getUserRole();
    const path = window.location.pathname;

    const isGuestPage = path.includes('-login.html') || path.includes('register');
    const isProtectedPage = path.includes('dashboard') || path.includes('customer-home.html');

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

    if (cleanRole === 'ADMIN') {
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
    if (window.supabaseClient) {
      await window.supabaseClient.auth.signOut();
    }
    
    // Clear legacy keys if any
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('zalo_') || key.startsWith('sb-'))) {
            localStorage.removeItem(key);
        }
    }

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
