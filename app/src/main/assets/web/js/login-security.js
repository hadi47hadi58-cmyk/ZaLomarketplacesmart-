/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام حماية الواجهات والجلسات - Client Login Security & Session Protection
 */

class LoginSecurity {
  constructor() {
    this.sessionTimeoutMs = 30 * 60 * 1000; // 30 mins session inactivity limit
    this.lastActivityTime = Date.now();
    this.initSessionInactivityTracker();
  }

  /**
   * Automatically adds CSRF and Authentication headers to fetch requests.
   * @param {string} url 
   * @param {object} options 
   */
  static async secureFetch(url, options = {}) {
    options.headers = options.headers || {};

    // 1. Inject CSRF Token from cookies if present
    const csrfToken = this.getCookie('csrf-token');
    if (csrfToken) {
      options.headers['x-csrf-token'] = csrfToken;
    }

    // 2. Inject JWT Session Token
    const jwtToken = localStorage.getItem('zalo_session_jwt');
    if (jwtToken) {
      options.headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    // Update last activity tracking
    if (window.loginSecurityInstance) {
      window.loginSecurityInstance.resetInactivityTimer();
    }

    const response = await fetch(url, options);

    // Auto-logout on unauthorized/expired status
    if (response.status === 401) {
      this.handleSessionExpired();
    }

    return response;
  }

  static getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  static handleSessionExpired() {
    localStorage.removeItem('zalo_session_jwt');
    localStorage.removeItem('zalo_user_role');
    
    // Check if not already on login page
    if (!window.location.pathname.includes('login.html')) {
      alert('انتهت صلاحية جلسة العمل الآمنة الخاصة بك أو تم تسجيل الخروج. يرجى تسجيل الدخول مجدداً 🔒');
      window.location.href = '/login.html';
    }
  }

  initSessionInactivityTracker() {
    // List of events indicating user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, () => this.resetInactivityTimer(), { passive: true });
    });

    // Run interval checks every 30 seconds
    setInterval(() => this.checkInactivity(), 30000);
  }

  resetInactivityTimer() {
    this.lastActivityTime = Date.now();
  }

  checkInactivity() {
    const inactiveDuration = Date.now() - this.lastActivityTime;
    if (inactiveDuration >= this.sessionTimeoutMs) {
      console.warn('Session inactive for too long. Initiating secure logout.');
      LoginSecurity.handleSessionExpired();
    }
  }
}

// Instantiate and attach globally
window.loginSecurityInstance = new LoginSecurity();
window.secureFetch = LoginSecurity.secureFetch.bind(LoginSecurity);
export default LoginSecurity;
