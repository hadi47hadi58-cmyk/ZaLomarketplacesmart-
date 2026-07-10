/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * نظام استعادة وتحديث كلمة المرور - Password Reset Client Module
 */

export class PasswordReset {
  /**
   * Requests a password reset link/token.
   * @param {string} email 
   */
  static async requestReset(email) {
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'تعذر معالجة طلب استعادة كلمة المرور.');
      }
      return result;
    } catch (error) {
      console.error('[Password Reset Request Error]:', error);
      throw error;
    }
  }

  /**
   * Submits the new password using the validated token.
   * @param {string} token 
   * @param {string} newPassword 
   */
  static async resetPassword(token, newPassword) {
    try {
      const response = await fetch('/api/auth/password-reset/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'فشلت عملية إعادة تعيين كلمة المرور الجديدة.');
      }
      return result;
    } catch (error) {
      console.error('[Password Reset Error]:', error);
      throw error;
    }
  }

  /**
   * Mounts a responsive password recovery wizard inside a DOM element.
   * @param {HTMLElement} containerEl 
   */
  static mountWizard(containerEl) {
    if (!containerEl) return;

    containerEl.innerHTML = `
      <div id="resetWizard" style="direction: rtl; text-align: right; font-family: Cairo, sans-serif; padding: 16px; background: var(--card, #111a14); border-radius: 16px; border: 1px solid var(--border, #1e3028);">
        <h3 style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px; text-align: center;">🛡️ استعادة حسابك المحمي</h3>
        <p style="font-size: 12px; color: var(--text2, #7a9e83); text-align: center; margin-bottom: 16px;">
          أدخل بريدك الإلكتروني وسنقوم بإرسال رمز إعادة التعيين السري فوراً.
        </p>
        
        <div class="form-group" style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; color: var(--gold2, #e8c97a); margin-bottom: 4px;">البريد الإلكتروني للذكاء الموحد</label>
          <input type="email" id="resetEmail" placeholder="example@domain.com" style="width: 100%; padding: 11px; background: rgba(0,0,0,0.3); border: 1.5px solid var(--border, #1e3028); border-radius: 10px; color: #fff; font-family: inherit; font-size: 13px;" />
        </div>

        <button id="sendResetBtn" style="width: 100%; background: var(--green, #1a5c2a); border: 1px solid var(--gold, #c9a84c); color: #fff; font-family: inherit; font-size: 13px; font-weight: 800; padding: 11px; border-radius: 10px; cursor: pointer; transition: all 0.2s;">
          إرسال رمز إعادة التعيين الموحد
        </button>
      </div>
    `;

    const sendBtn = containerEl.querySelector('#sendResetBtn');
    const emailInput = containerEl.querySelector('#resetEmail');

    if (sendBtn && emailInput) {
      sendBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        if (!email || !email.includes('@')) {
          alert('يرجى كتابة بريد إلكتروني صالح.');
          return;
        }

        sendBtn.disabled = true;
        sendBtn.innerHTML = 'جاري الإرسال الآمن... <i class="fa-solid fa-spinner fa-spin"></i>';

        try {
          await this.requestReset(email);
          
          containerEl.innerHTML = `
            <div style="direction: rtl; text-align: center; font-family: Cairo, sans-serif; padding: 20px;">
              <div style="font-size: 40px; color: #10b981; margin-bottom: 12px;">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <h4 style="font-size: 15px; font-weight: 850; color: #fff; margin-bottom: 6px;">تم إرسال الرمز بنجاح!</h4>
              <p style="font-size: 12px; color: var(--text2, #7a9e83); line-height: 1.6;">
                يرجى مراجعة بريدك الإلكتروني 📥 (${email}) لفتح الرابط وإعادة تعيين كلمة المرور بشكل آمن وسليم.
              </p>
            </div>
          `;
        } catch (err) {
          alert(err.message || 'حدث خطأ ما أثناء الإرسال.');
          sendBtn.disabled = false;
          sendBtn.innerHTML = 'إرسال رمز إعادة التعيين الموحد';
        }
      });
    }
  }
}

window.PasswordReset = PasswordReset;
export default PasswordReset;
