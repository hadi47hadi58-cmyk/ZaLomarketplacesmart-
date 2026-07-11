/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام إدارة الجلسات الذكي والتوجيه التلقائي الآمن - Smart Session Manager
 */

export class SessionManager {
  constructor() {
    this.jwtKey = 'zalo_session_jwt';
    this.roleKey = 'zalo_user_role';
  }

  /**
   * Checks if user has a valid stored session token.
   */
  isAuthenticated() {
    const token = localStorage.getItem(this.jwtKey);
    return !!token && token.length > 20; // Basic check for a valid JWT format
  }

  /**
   * Retrieves the current session object.
   */
  getSession() {
    return {
      token: localStorage.getItem(this.jwtKey),
      role: (localStorage.getItem(this.roleKey) || '').toLowerCase(),
      email: localStorage.getItem('zalo_user_email'),
      name: localStorage.getItem('zalo_user_name')
    };
  }

  /**
   * Retrieves the current user's role.
   */
  getUserRole() {
    return localStorage.getItem(this.roleKey) || 'CUSTOMER';
  }

  /**
   * Auto redirects based on session presence.
   * If on a guest page (login, register) and authenticated, redirect to appropriate home.
   * If on a protected page (dashboard, profile) and NOT authenticated, redirect to login.
   */
  handleAutoRedirection() {
    const isAuth = this.isAuthenticated();
    const role = this.getUserRole();
    const path = window.location.pathname;

    const isGuestPage = path.includes('login.html') || path.includes('register-step1.html') || path.includes('register-step2.html') || path.includes('register-step3.html');
    const isProtectedPage = path.includes('dashboard') || path.includes('admin.html') || path.includes('customer-home.html');

    if (isAuth && isGuestPage) {
      console.log(`[SessionManager] Authenticated user on guest page. Redirecting to appropriate home.`);
      this.redirectToHome(role);
    } else if (!isAuth && isProtectedPage) {
      console.warn(`[SessionManager] Unauthenticated user on protected page. Redirecting to login.`);
      this.logoutAndRedirect();
    }
  }

  /**
   * Routes the user to their designated home/dashboard page.
   */
  redirectToHome(role) {
    const cleanRole = (role || 'CUSTOMER').toUpperCase();
    
    // Avoid redirecting if we are already on that target page to prevent redirection loops
    const currentPath = window.location.pathname;

    if (cleanRole === 'ADMIN') {
      if (!currentPath.includes('admin.html')) {
        window.location.href = 'admin.html';
      }
    } else if (cleanRole === 'MERCHANT') {
      if (!currentPath.includes('dashboard.html') && !currentPath.includes('dashboard-store.html')) {
        window.location.href = 'dashboard-store.html';
      }
    } else {
      if (!currentPath.includes('customer-home.html')) {
        window.location.href = 'customer-home.html';
      }
    }
  }

  /**
   * Cleans all credentials and forces redirection to the auth center.
   */
  logoutAndRedirect() {
    localStorage.removeItem(this.jwtKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem('zalo_user_email');
    localStorage.removeItem('zalo_user_name');
    
    // Clean admin session too
    sessionStorage.removeItem('admin_logged_in_session');

    if (!window.location.pathname.includes('login.html')) {
      window.location.href = 'login.html';
    }
  }

  /**
   * Starts a secure session by storing user details and token.
   */
  startSession(response) {
    if (!response) return;
    const token = response.access_token || response.token;
    const user = response.user || response;
    const role = user.role || response.role || 'CUSTOMER';
    const email = user.email || response.email || '';
    const name = user.name || response.name || '';

    if (token) {
      localStorage.setItem(this.jwtKey, token);
    }
    localStorage.setItem(this.roleKey, role.toUpperCase());
    localStorage.setItem('zalo_user_email', email);
    localStorage.setItem('zalo_user_name', name);
    localStorage.setItem('user_email', email);
    localStorage.setItem('zalo_user_role', role.toUpperCase());

    if (role.toUpperCase() === 'ADMIN') {
      sessionStorage.setItem('admin_logged_in_session', 'true');
    }
  }
}

// Instantiate and initiate auto-redirect routines
window.sessionManagerInstance = new SessionManager();

document.addEventListener('DOMContentLoaded', () => {
  window.sessionManagerInstance.handleAutoRedirection();
});

export default window.sessionManagerInstance;
