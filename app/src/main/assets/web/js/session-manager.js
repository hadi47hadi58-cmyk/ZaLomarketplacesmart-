// ZaLo Marketplace Smart Sync Update: 2026-07-20
/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام إدارة الجلسات الذكي والتوجيه التلقائي الآمن - Smart Session Manager
 */
export class SessionManager {
  constructor() {
    this.jwtKey = 'zalo_session_jwt';
    this.roleKey = 'zalo_user_role';
    this.emailKey = 'zalo_user_email';
    this.nameKey = 'zalo_user_name';
  }

  isAuthenticated() {
    const token = localStorage.getItem(this.jwtKey);
    return !!token && token.length > 5;
  }

  getSession() {
    return {
      token: localStorage.getItem(this.jwtKey),
      role: (localStorage.getItem(this.roleKey) || '').toLowerCase(),
      email: localStorage.getItem(this.emailKey),
      name: localStorage.getItem(this.nameKey)
    };
  }

  getUserRole() {
    return (localStorage.getItem(this.roleKey) || 'CUSTOMER').toUpperCase();
  }

  handleAutoRedirection() {
    const isAuth = this.isAuthenticated();
    const role = this.getUserRole();
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

  logoutAndRedirect() {
    // Clean all session data
    const keysToRemove = [
      this.jwtKey, this.roleKey, this.emailKey, this.nameKey,
      'zalo_token', 'nestjs_token', 'zalo_active_session',
      'user_email', 'nestjs_user', 'admin_logged_in_session',
      'loggedInAdminEmail', 'loggedInAdminName', 'zalo_uid'
    ];
    
    keysToRemove.forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem('admin_logged_in_session');
    
    // Clean Supabase keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
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

  startSession(token, role, email, name, uid) {
    if (token) localStorage.setItem(this.jwtKey, token);
    if (role) localStorage.setItem(this.roleKey, role.toUpperCase());
    if (email) localStorage.setItem(this.emailKey, email);
    if (name) localStorage.setItem(this.nameKey, name);
    if (uid) localStorage.setItem('zalo_uid', uid);
    
    if (role && role.toUpperCase() === 'ADMIN') {
      sessionStorage.setItem('admin_logged_in_session', 'true');
    }
  }
}

window.sessionManagerInstance = new SessionManager();
document.addEventListener('DOMContentLoaded', () => {
  window.sessionManagerInstance.handleAutoRedirection();
});
export default window.sessionManagerInstance;
