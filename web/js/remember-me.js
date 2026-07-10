/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام تذكر البيانات والتعبئة التلقائية الآمنة - Client Remember Me Module
 */

export class RememberMe {
  static EMAIL_STORAGE_KEY = 'zalo_remembered_email';
  static PREFERENCE_STORAGE_KEY = 'zalo_remember_preference';

  /**
   * Pre-fills the email field if remember me preference was set.
   * @param {HTMLInputElement} emailInputEl 
   * @param {HTMLInputElement} checkboxEl 
   */
  static loadPreference(emailInputEl, checkboxEl) {
    if (!emailInputEl) return;

    const savedEmail = localStorage.getItem(this.EMAIL_STORAGE_KEY);
    const preference = localStorage.getItem(this.PREFERENCE_STORAGE_KEY) === 'true';

    if (preference && savedEmail) {
      emailInputEl.value = savedEmail;
      if (checkboxEl) {
        checkboxEl.checked = true;
      }
      console.log('[RememberMe] Successfully pre-filled saved credentials.');
    }
  }

  /**
   * Saves or clears the remember me credentials based on checkbox state.
   * @param {string} email 
   * @param {boolean} isChecked 
   */
  static savePreference(email, isChecked) {
    if (isChecked && email) {
      localStorage.setItem(this.EMAIL_STORAGE_KEY, email);
      localStorage.setItem(this.PREFERENCE_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(this.EMAIL_STORAGE_KEY);
      localStorage.setItem(this.PREFERENCE_STORAGE_KEY, 'false');
    }
  }

  /**
   * Stores a remembered token.
   */
  static storeToken(token) {
    localStorage.setItem('zalo_remembered_token', token);
  }

  /**
   * Retrieves the remembered token.
   */
  static retrieveToken() {
    return localStorage.getItem('zalo_remembered_token');
  }
}

window.RememberMe = RememberMe;
export default RememberMe;
