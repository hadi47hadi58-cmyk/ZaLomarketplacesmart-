// ZaLo Marketplace Smart Sync Update: 2026-07-16
/**
 * ZaLo Smart Algerian Multivendor Marketplace
 * أداة التحقق من قوة وصحة كلمة المرور - Password Strength Validator
 */

class PasswordValidator {
  /**
   * Assesses a password's strength and returns details.
   * @param {string} password 
   * @returns {object} { score: 0-4, feedback: string, checks: object }
   */
  static evaluate(password) {
    const checks = {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password)
    };

    let score = 0;
    if (password.length > 0) {
      if (checks.length) score++;
      if (checks.hasUpper && checks.hasLower) score++;
      if (checks.hasNumber) score++;
      if (checks.hasSpecial) score++;
    }

    let label = 'ضعيفة جداً 🔴';
    let color = '#ef4444';
    if (score === 2) {
      label = 'متوسطة القوة 🟡';
      color = '#f59e0b';
    } else if (score === 3) {
      label = 'قوية 🟢';
      color = '#10b981';
    } else if (score === 4) {
      label = 'آمنة وممتازة للغاية 🛡️✨';
      color = '#047857';
    }

    return {
      score,
      label,
      color,
      checks
    };
  }

  /**
   * Attaches visual feedback indicators to an input element and a container.
   * @param {HTMLInputElement} inputEl 
   * @param {HTMLElement} feedbackContainerEl 
   */
  static attachFeedback(inputEl, feedbackContainerEl) {
    if (!inputEl || !feedbackContainerEl) return;

    inputEl.addEventListener('input', (e) => {
      const password = e.target.value;
      if (!password) {
        feedbackContainerEl.innerHTML = '';
        return;
      }

      const result = this.evaluate(password);
      
      feedbackContainerEl.innerHTML = `
        <div style="margin-top: 8px; font-size: 13px; font-family: Cairo, sans-serif; direction: rtl;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>مستوى أمان كلمة المرور:</span>
            <span style="color: ${result.color}; font-weight: bold;">${result.label}</span>
          </div>
          <div style="height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; display: flex; gap: 2px;">
            <div style="flex: 1; background: ${result.score >= 1 ? result.color : '#e5e7eb'}; transition: background 0.3s;"></div>
            <div style="flex: 1; background: ${result.score >= 2 ? result.color : '#e5e7eb'}; transition: background 0.3s;"></div>
            <div style="flex: 1; background: ${result.score >= 3 ? result.color : '#e5e7eb'}; transition: background 0.3s;"></div>
            <div style="flex: 1; background: ${result.score >= 4 ? result.color : '#e5e7eb'}; transition: transition: background 0.3s;"></div>
          </div>
          <ul style="margin-top: 6px; padding-right: 18px; list-style-type: none; line-height: 1.5; color: #6b7280; font-size: 11px;">
            <li style="color: ${result.checks.length ? '#10b981' : '#ef4444'};">
              ${result.checks.length ? '✓' : '✗'} 8 أحرف على الأقل
            </li>
            <li style="color: ${result.checks.hasUpper && result.checks.hasLower ? '#10b981' : '#ef4444'};">
              ${result.checks.hasUpper && result.checks.hasLower ? '✓' : '✗'} تحتوي على أحرف كبيرة وصغيرة (A-z)
            </li>
            <li style="color: ${result.checks.hasNumber ? '#10b981' : '#ef4444'};">
              ${result.checks.hasNumber ? '✓' : '✗'} تحتوي على أرقام (0-9)
            </li>
            <li style="color: ${result.checks.hasSpecial ? '#10b981' : '#ef4444'};">
              ${result.checks.hasSpecial ? '✓' : '✗'} تحتوي على رمز خاص (@, #, $, إلخ.)
            </li>
          </ul>
        </div>
      `;
    });
  }
}

window.PasswordValidator = PasswordValidator;
export default PasswordValidator;
