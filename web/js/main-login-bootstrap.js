/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام التشغيل والدمج المركزي المتكامل - Main Login Bootstrap Script
 */

import sessionManager from '/js/session-manager.js';
import loginHandler from '/js/login-handler.js';
import twoFactorAuth from '/js/two-factor-auth.js';
import passwordValidator from '/js/password-validator.js';
import biometricAuth from '/js/biometric-auth.js';
import oauthHandler from '/js/oauth-handler.js';
import passwordReset from '/js/password-reset.js';
import rememberMe from '/js/remember-me.js';
import loginSecurity from '/js/login-security.js';
import designSystem from '/js/design-system.js';
import performanceAnimations from '/js/performance-animations.js';
import permissionsManager from '/js/permissions-manager.js';
import loginAnalytics from '/js/login-analytics.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c[ZaLo Bootstrap] تهيئة النظام المركزي الموحد لتسجيل الدخول...', 'color: #1a5c2a; font-weight: bold; font-size: 14px;');

  // 1. Initialize Design System & Performance Animations
  if (designSystem && typeof designSystem.init === 'function') {
    designSystem.init();
  }
  if (performanceAnimations && typeof performanceAnimations.init === 'function') {
    performanceAnimations.init();
  }

  // 2. Identify UI Elements
  const loginForm = document.getElementById('unifiedLoginForm') || document.getElementById('loginForm') || document.querySelector('form');
  const emailInput = document.getElementById('loginEmail') || document.getElementById('email') || document.querySelector('input[type="email"]');
  const passwordInput = document.getElementById('loginPass') || document.getElementById('password') || document.querySelector('input[type="password"]');
  const rememberCheckbox = document.getElementById('remember-me-checkbox') || document.getElementById('remember');
  const strengthBar = document.getElementById('password-strength-bar');
  const strengthContainer = document.getElementById('password-strength-container') || document.createElement('div');

  // Insert password strength container if needed
  if (strengthBar && strengthBar.parentNode && !document.getElementById('password-strength-container')) {
    strengthContainer.id = 'password-strength-container';
    strengthBar.parentNode.insertBefore(strengthContainer, strengthBar.nextSibling);
    strengthBar.style.display = 'none'; // Use styled埃及-Cairo feedback instead of native meter
  }

  // 3. Attach Password Strength Validator
  if (passwordInput && passwordValidator) {
    passwordValidator.attachFeedback(passwordInput, strengthContainer);
  }

  // 4. Load Remember Me Preferences
  if (rememberMe && emailInput) {
    rememberMe.loadPreference(emailInput, rememberCheckbox);
  }

  // 5. Initialize Login Analytics (Anti-Bot)
  if (loginForm && emailInput) {
    const formId = loginForm.id || 'unifiedLoginForm';
    loginForm.id = formId;
    const emailId = emailInput.id || 'loginEmail';
    emailInput.id = emailId;
    if (window.initLoginAnalytics) {
      window.initLoginAnalytics(formId, emailId);
    }
  }

  // Real-time detection badge logic
  const roleBadge = document.getElementById('roleBadge');
  const badgeIcon = document.getElementById('badgeIcon');
  const badgeText = document.getElementById('badgeText');

  const AD_LIST = [
    'zinzinochop@gmail.com',
    'zinochop2024@gmail.com',
    'hadi47hadi58@gmail.com',
    'admin@zalo.dz',
    'admin@zalo.com',
    'manager@zalo.dz',
    'manager@zalo.com'
  ];

  function updateBadge(role) {
    if (!roleBadge) return;
    roleBadge.className = 'detected-badge';
    if (role === 'admin') {
      roleBadge.classList.add('badge-admin');
      if (badgeIcon) badgeIcon.className = 'fa-solid fa-user-shield';
      if (badgeText) badgeText.innerHTML = '🛡️ حساب إداري (المدير المعتمد)';
    } else if (role === 'merchant') {
      roleBadge.classList.add('badge-merchant');
      if (badgeIcon) badgeIcon.className = 'fa-solid fa-store';
      if (badgeText) badgeText.innerHTML = '🏪 حساب تاجر وشريك معتمد';
    } else {
      roleBadge.classList.add('badge-customer');
      if (badgeIcon) badgeIcon.className = 'fa-solid fa-house';
      if (badgeText) badgeText.innerHTML = 'الواجهة الرئيسية للتسوق';
    }
  }

  let queryTimer = null;
  async function performDetection(email) {
    email = email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      updateBadge('customer');
      return;
    }

    if (AD_LIST.includes(email)) {
      updateBadge('admin');
      return;
    }

    if (email.includes('merchant') || email.includes('shop') || email === 'merchant@zalo.com') {
      updateBadge('merchant');
      return;
    }

    try {
      const { supabase } = await import('/js/supabase-config.js');
      const { data: shops } = await supabase.from('shops').select('email').eq('email', email);
      if (shops && shops.length > 0) {
        updateBadge('merchant');
        return;
      }

      const { data: requests } = await supabase.from('merchant_requests').select('email').eq('email', email);
      if (requests && requests.length > 0) {
        updateBadge('merchant');
        return;
      }
    } catch (err) {
      console.warn("Supabase lookup silenced:", err);
    }

    updateBadge('customer');
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const val = emailInput.value;
      clearTimeout(queryTimer);
      queryTimer = setTimeout(() => {
        performDetection(val);
      }, 400);
    });
    
    // Initial load check
    if (emailInput.value) {
      performDetection(emailInput.value);
    }
  }

  // Manus Card fast click to focus and autofill
  const lastEmail = localStorage.getItem('user_email');
  const manusCard = document.getElementById('manusProfileCard');
  const manusAvatar = document.getElementById('manusAvatar');
  const manusEmail = document.getElementById('manusEmail');
  const manusProfileTitle = document.getElementById('manusProfileTitle');

  if (manusCard && manusAvatar && manusEmail && manusProfileTitle) {
    if (lastEmail) {
      manusEmail.textContent = lastEmail;
      manusProfileTitle.textContent = 'المتابعة كحسابك النشط المعتمد';
      const cleanName = lastEmail.split('@')[0].toUpperCase();
      manusAvatar.src = `https://ui-avatars.com/api/?name=${cleanName}&background=1a5c2a&color=fff&bold=true`;
    } else {
      manusEmail.textContent = 'تسجيل دخول سريع كمشتري زائر';
      manusProfileTitle.textContent = 'المتابعة كزبون جديد';
      manusAvatar.src = `https://ui-avatars.com/api/?name=ZaLo&background=c9a84c&color=071a0b&bold=true`;
    }

    manusCard.addEventListener('click', () => {
      if (lastEmail && emailInput) {
        emailInput.value = lastEmail;
        performDetection(lastEmail);
      }
      if (emailInput) emailInput.focus();
    });
  }

  // Session Cleanup action
  const clearBtn = document.getElementById('clearSessionBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        const { supabase } = await import('/js/supabase-config.js');
        await supabase.auth.signOut();
        alert("تم تنظيف جلسة العمل وذاكرة التخزين المؤقت بنجاح. يرجى المحاولة مجدداً.");
        window.location.reload();
      } catch (err) {
        console.error("Session cleanup failed:", err);
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    });
  }

  // Toggle Mode Sign-Up / Sign-In
  let isSignUpMode = false;
  const toggleModeBtn = document.getElementById('toggleModeBtn');
  const submitBtn = document.getElementById('submitBtn');
  if (toggleModeBtn && submitBtn) {
    toggleModeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isSignUpMode = !isSignUpMode;
      const btnSpan = submitBtn.querySelector('span') || submitBtn;
      if (isSignUpMode) {
        btnSpan.textContent = 'إنشاء حساب جديد وتأكيد الدخول';
        toggleModeBtn.textContent = 'لديك حساب بالفعل؟ سجل دخولك الآن ←';
        if (badgeText) badgeText.textContent = '✨ إنشاء حساب زبون جديد';
      } else {
        btnSpan.textContent = 'تأكيد وتسجيل الدخول الموحد';
        toggleModeBtn.textContent = 'ليس لديك حساب؟ سجل حساباً جديداً الآن ←';
        performDetection(emailInput.value);
      }
    });
  }

  // 6. Bind Biometric Auth Button
  const biometricBtn = document.getElementById('biometric-login-btn') || document.getElementById('biometricBtn');
  if (biometricBtn && biometricAuth) {
    biometricBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        designSystem.showLoadingOverlay('جاري التحقق الآمن عبر البصمة الحيوية... 🔐');
        const result = await biometricAuth.authenticate();
        designSystem.hideLoadingOverlay();

        if (result && result.success) {
          designSystem.showAlert(null, 'مرحباً بك مجدداً! تم تسجيل الدخول الآمن بالبصمة الحيوية بنجاح. 🧬✨', 'success');
          sessionManager.startSession(result);
          setTimeout(() => {
            sessionManager.redirectToHome(result.role);
          }, 1500);
        } else {
          designSystem.showAlert(null, result.message || 'فشلت عملية البصمة.', 'error');
        }
      } catch (err) {
        designSystem.hideLoadingOverlay();
        designSystem.showAlert(null, err.message || 'حدث خطأ غير متوقع أثناء البصمة.', 'error');
      }
    });
  }

  // 7. Bind Google Sign-In Button
  const googleBtn = document.getElementById('google-login-btn') || document.getElementById('googleBtn');
  if (googleBtn && oauthHandler) {
    googleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        designSystem.showAlert(null, 'جاري توجيهك بأمان إلى Google Sign-In... 🌐', 'success');
        await oauthHandler.redirectToProvider('google');
      } catch (err) {
        designSystem.showAlert(null, err.message || 'فشل الاتصال بـ Google.', 'error');
      }
    });
  }

  // 8. Bind Forgot Password Link / Button
  const forgotPasswordLink = document.getElementById('forgot-password-link') || document.getElementById('forgotBtn');
  if (forgotPasswordLink && passwordReset) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      
      const dialog = document.createElement('div');
      dialog.id = 'forgot-password-dialog-overlay';
      dialog.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(8, 14, 10, 0.9);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 30000;
        padding: 16px;
      `;
      
      const contentCard = document.createElement('div');
      contentCard.style.width = '100%';
      contentCard.style.maxWidth = '420px';
      
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '× إغلاق النافذة';
      closeBtn.style.cssText = `
        background: transparent;
        border: none;
        color: #7a9e83;
        font-family: Cairo, sans-serif;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        display: block;
        margin-right: auto;
        margin-bottom: 8px;
        text-decoration: underline;
      `;
      closeBtn.addEventListener('click', () => dialog.remove());
      
      contentCard.appendChild(closeBtn);
      const innerContainer = document.createElement('div');
      contentCard.appendChild(innerContainer);
      dialog.appendChild(contentCard);
      document.body.appendChild(dialog);
      
      passwordReset.mountWizard(innerContainer);
    });
  }

  // 9. Process Main Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      if (e.defaultPrevented) return;
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        designSystem.showAlert(null, 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.', 'error');
        return;
      }

      try {
        designSystem.showLoadingOverlay(isSignUpMode ? 'جاري إنشاء وتفعيل حسابك الجديد... 🆕' : 'جاري التحقق من الهوية الآمنة وتشفير البيانات... 🔒');
        
        let result;
        if (isSignUpMode) {
          const { supabase } = await import('/js/supabase-config.js');
          const signupRes = await supabase.auth.signUp({ email, password });
          if (signupRes.error) throw signupRes.error;
          result = {
            success: true,
            token: signupRes.data.session?.access_token || 'mock-token',
            role: 'CUSTOMER',
            email: email,
            name: email.split('@')[0]
          };
        } else {
          result = await loginHandler.authenticate({ email, password });
        }
        
        designSystem.hideLoadingOverlay();

        if (result && result.success) {
          if (!isSignUpMode && (result.twoFactorRequired || result.role === 'ADMIN')) {
            designSystem.showAlert(null, 'مطلوب إدخال رمز الأمان الثنائي (2FA)... 🛡️', 'warning');
            twoFactorAuth.showPrompt(async (code) => {
              try {
                designSystem.showLoadingOverlay('جاري التحقق من رمز الـ 2FA الثنائي... 🔑');
                const verifiedResult = await twoFactorAuth.verify(code, email);
                designSystem.hideLoadingOverlay();

                if (verifiedResult && verifiedResult.access_token) {
                  completeAuthentication(verifiedResult, email);
                } else {
                  designSystem.showAlert(null, 'رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى.', 'error');
                }
              } catch (err) {
                designSystem.hideLoadingOverlay();
                designSystem.showAlert(null, err.message || 'فشل التحقق من الرمز.', 'error');
              }
            });
          } else {
            completeAuthentication(result, email);
          }
        } else {
          designSystem.showAlert(null, result.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'error');
        }
      } catch (err) {
        designSystem.hideLoadingOverlay();
        designSystem.showAlert(null, err.message || 'فشل الاتصال بالخادم الذكي.', 'error');
      }
    });
  }

  function completeAuthentication(authResult, email) {
    if (rememberMe && emailInput) {
      const isChecked = rememberCheckbox ? rememberCheckbox.checked : false;
      rememberMe.savePreference(email, isChecked);
    }

    sessionManager.startSession(authResult);

    if (permissionsManager && typeof permissionsManager.apply === 'function') {
      permissionsManager.apply();
    }

    designSystem.showAlert(null, 'تم تسجيل الدخول والتحقق الآمن بنجاح! جاري توجيهك إلى واجهتك المخصصة... 🚀✨', 'success');
    
    setTimeout(() => {
      sessionManager.redirectToHome(authResult.role);
    }, 1500);
  }

  // Native Android Google Sign-In Callbacks (Global Scope Registration)
  window.onGoogleIdTokenReceived = async function(idToken) {
    if (designSystem) {
      designSystem.showLoadingOverlay('جاري تسجيل الدخول الآمن عبر Google... 🌐');
    }
    try {
      const { supabase } = await import('/js/supabase-config.js');
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken
      });
      if (error) throw error;
      
      const user = data.user;
      const role = user?.user_metadata?.role || localStorage.getItem('zalo_user_role') || 'CUSTOMER';
      
      if (designSystem) {
        designSystem.hideLoadingOverlay();
        designSystem.showAlert(null, 'تم التحقق وتسجيل الدخول عبر Google بنجاح! 🎉', 'success');
      }

      completeAuthentication({
        access_token: data.session?.access_token,
        role: role,
        user: user
      }, user?.email);

    } catch (error) {
      console.error("Supabase ID Token Auth failed:", error);
      if (designSystem) {
        designSystem.hideLoadingOverlay();
        designSystem.showAlert(null, "حدث خطأ أثناء الاتصال بالخادم: " + (error.message || error), 'error');
      }
    }
  };

  window.onGoogleIdTokenFailed = function(reason) {
    console.warn("Google native sign-in failed/cancelled:", reason);
    if (reason !== 'cancelled' && designSystem) {
      designSystem.showAlert(null, "فشل تسجيل الدخول باستخدام حساب جوجل: " + reason, 'error');
    }
  };
});
