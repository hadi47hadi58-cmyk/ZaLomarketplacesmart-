// ZaLo Marketplace Smart Sync Update: 2026-07-16
/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام الربط وتسجيل الدخول عبر الشبكات الاجتماعية - Google & Facebook OAuth Handler
 */

export class OAuthHandler {
  constructor(googleBtnId, facebookBtnId) {
    this.googleBtn = document.getElementById(googleBtnId);
    this.facebookBtn = document.getElementById(facebookBtnId);

    if (this.googleBtn) {
      this.googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
    }
    if (this.facebookBtn) {
      this.facebookBtn.addEventListener('click', () => this.handleFacebookSignIn());
    }
  }

  /**
   * Handles safe login with Google
   */
  async handleGoogleSignIn() {
    console.log('[OAuthHandler] Initiating Google Sign-In...');
    
    // Check if running inside native Android wrapper
    if (window.AndroidInterface && typeof window.AndroidInterface.requestGoogleSignIn === 'function') {
      try {
        window.AndroidInterface.requestGoogleSignIn();
        return;
      } catch (err) {
        console.warn('Native Google Sign-In failed, falling back to Web OAuth:', err);
      }
    }

    // Standard Web OAuth redirection
    this.redirectToProvider('google');
  }

  /**
   * Handles safe login with Facebook
   */
  async handleFacebookSignIn() {
    console.log('[OAuthHandler] Initiating Facebook Sign-In...');
    
    // Native hook check for Android wrapper
    if (window.AndroidInterface && typeof window.AndroidInterface.requestFacebookSignIn === 'function') {
      try {
        window.AndroidInterface.requestFacebookSignIn();
        return;
      } catch (err) {
        console.warn('Native Facebook Sign-In failed, falling back to Web OAuth:', err);
      }
    }

    this.redirectToProvider('facebook');
  }

  /**
   * Redirection logic to OAuth provider endpoints via Supabase or Direct API
   */
  static async redirectToProvider(provider) {
    try {
      // Import config dynamically if needed
      const { supabase } = await import('./supabase-config.js');
      
      let redirectUrl = window.location.origin + window.location.pathname.replace('login.html', 'index.html');
      
      console.log(`[OAuthHandler] Redirecting to ${provider} via Supabase...`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error(`[OAuthHandler] ${provider} Web OAuth redirection failed:`, err);
      alert(`عذراً، لم نتمكن من الاتصال بمزود الخدمة ${provider} حالياً. يرجى استخدام تسجيل الدخول المباشر.`);
    }
  }
}

// Export initialization function
window.initOAuthHandler = (googleBtnId, facebookBtnId) => {
  return new OAuthHandler(googleBtnId, facebookBtnId);
};

export default OAuthHandler;
