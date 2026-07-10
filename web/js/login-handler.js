/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * معالج تسجيل الدخول المتقدم والربط مع الواجهة الخلفية - Advanced Login Handler
 */

import { nestjsLogin } from './nestjs-bridge.js';

export class LoginHandler {
  constructor(formId, emailInputId, passwordInputId, errorElId, submitBtnId) {
    this.form = document.getElementById(formId);
    this.emailInput = document.getElementById(emailInputId);
    this.passwordInput = document.getElementById(passwordInputId);
    this.errorEl = document.getElementById(errorElId);
    this.submitBtn = document.getElementById(submitBtnId);

    if (this.form) {
      this.initFormListener();
    }
  }

  showError(message) {
    if (this.errorEl) {
      this.errorEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>${message}</span>
        </div>
      `;
      this.errorEl.style.display = 'block';
      this.errorEl.style.animation = 'shake 0.3s ease';
      setTimeout(() => {
        this.errorEl.style.animation = '';
      }, 300);
    } else {
      alert(message);
    }
  }

  setLoading(isLoading) {
    if (!this.submitBtn) return;
    if (isLoading) {
      this.submitBtn.disabled = true;
      this.submitBtn.style.opacity = '0.7';
      this.submitBtn.innerHTML = `
        <span>جاري التحقق الآمن والمصادقة...</span>
        <i class="fa-solid fa-shield-halved fa-spin" style="color: var(--gold2);"></i>
      `;
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.style.opacity = '1';
      this.submitBtn.innerHTML = `
        <span>تأكيد وتسجيل الدخول الموحد</span> <i class="fa-solid fa-arrow-left"></i>
      `;
    }
  }

  initFormListener() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.errorEl) this.errorEl.style.display = 'none';

      const email = this.emailInput.value.trim().toLowerCase();
      const password = this.passwordInput.value;

      this.setLoading(true);

      try {
        // Collect Device Fingerprint if available
        const fingerprint = window.DeviceFingerprint 
          ? window.DeviceFingerprint.get() 
          : 'unknown-web-client';

        // Call our unified NestJS API Bridge with secure backoff
        const response = await nestjsLogin(email, password);

        if (response && response.access_token) {
          // Store securely
          localStorage.setItem('zalo_session_jwt', response.access_token);
          localStorage.setItem('zalo_user_role', response.user.role);
          localStorage.setItem('zalo_user_email', response.user.email);
          localStorage.setItem('zalo_user_name', response.user.name);
          localStorage.setItem('zalo_device_fingerprint', fingerprint);

          // Route based on role
          this.routeUser(response.user.role);
        } else {
          throw new Error('لم يتم استلام توكن أمني صالح من الخادم.');
        }

      } catch (err) {
        console.error('[LoginHandler] Error during authentication:', err);
        this.showError(err.message || 'فشل الاتصال بالخادم، يرجى التحقق من الشبكة وإعادة المحاولة.');
        this.setLoading(false);
      }
    });
  }

  routeUser(role) {
    const cleanRole = role.toUpperCase();
    console.log(`[LoginHandler] Redirecting user based on role: ${cleanRole}`);

    // Store in SessionStorage for fallback compatibility
    if (cleanRole === 'ADMIN') {
      sessionStorage.setItem('admin_logged_in_session', 'true');
      window.location.href = 'admin.html';
    } else if (cleanRole === 'MERCHANT') {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'customer-home.html';
    }
  }

  /**
   * Static authenticate method to support main-login-bootstrap.js flow.
   */
  static async authenticate({ email, password }) {
    try {
      const { nestjsLogin } = await import('./nestjs-bridge.js');
      const response = await nestjsLogin(email, password);
      if (response && response.access_token) {
        return {
          success: true,
          token: response.access_token,
          role: response.user?.role || 'CUSTOMER',
          email: response.user?.email || email,
          name: response.user?.name || '',
          redirectUrl: (response.user?.role || 'CUSTOMER').toUpperCase() === 'ADMIN' ? 'admin.html' : ((response.user?.role || 'CUSTOMER').toUpperCase() === 'MERCHANT' ? 'dashboard.html' : 'customer-home.html')
        };
      }
      return { success: false, message: 'لم يتم استلام توكن أمني صالح من الخادم.' };
    } catch (err) {
      console.warn('[LoginHandler] Primary authentication failed, using local failover bypass:', err);
      try {
        const { supabase } = await import('./supabase-config.js');
        const res = await supabase.auth.signInWithPassword({ email, password });
        if (res && !res.error) {
          const user = res.data.user;
          const session = res.data.session;
          const role = user?.user_metadata?.role || localStorage.getItem('zalo_user_role') || 'CUSTOMER';
          return {
            success: true,
            token: session?.access_token || 'mock-token',
            role: role,
            email: user?.email || email,
            name: user?.user_metadata?.full_name || '',
            redirectUrl: role.toUpperCase() === 'ADMIN' ? 'admin.html' : (role.toUpperCase() === 'MERCHANT' ? 'dashboard.html' : 'customer-home.html')
          };
        }
        return { success: false, message: res.error?.message || err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' };
      } catch (bypassErr) {
        return { success: false, message: bypassErr.message || err.message || 'فشل الاتصال بالخادم.' };
      }
    }
  }
}

// Add CSS Shake Animation style for error messages dynamically
if (!document.getElementById('shake-keyframes-style')) {
  const style = document.createElement('style');
  style.id = 'shake-keyframes-style';
  style.innerHTML = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-6px); }
      75% { transform: translateX(6px); }
    }
  `;
  document.head.appendChild(style);
}

window.LoginHandler = LoginHandler;
export default LoginHandler;
