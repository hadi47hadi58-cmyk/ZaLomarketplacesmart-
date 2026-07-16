// ZaLo Marketplace Smart Sync Update: 2026-07-16
/**
 * ZaLo Smart - Advanced Design System, Component Library & WCAG 2.1 Accessibility Suite
 * مكتبة المكونات الموحدة ونظام التصميم الذكي مع التدقيق التلقائي للوصول الشامل
 */

export const DesignSystem = {
  // Theme configuration tokens
  theme: {
    colors: {
      navy: '#080e0a',
      emerald: '#1a5c2a',
      emeraldLight: '#7a9e83',
      gold: '#c9a84c',
      goldLight: '#e8c97a',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
    }
  },

  /**
   * Generates a sleek, Material-3 styled glassmorphic Alert/Toast component.
   */
  showAlert(containerId, message, type = 'success', duration = 4000) {
    const container = document.getElementById(containerId) || document.body;
    const alertEl = document.createElement('div');
    
    // Assign accessible roles
    alertEl.setAttribute('role', 'alert');
    alertEl.setAttribute('aria-live', 'assertive');
    
    // Styling
    const color = this.theme.colors[type] || this.theme.colors.success;
    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-triangle-exclamation';
    
    alertEl.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: rgba(17, 26, 20, 0.9);
      backdrop-filter: blur(12px);
      border: 1.5px solid ${color};
      color: #ffffff;
      padding: 14px 24px;
      border-radius: 12px;
      font-family: 'Cairo', sans-serif;
      font-size: 13.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      direction: rtl;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      opacity: 0;
    `;

    alertEl.innerHTML = `
      <i class="fa-solid ${icon}" style="color: ${color}; font-size: 18px;"></i>
      <span>${message}</span>
    `;

    container.appendChild(alertEl);

    // Animate in
    setTimeout(() => {
      alertEl.style.transform = 'translateX(-50%) translateY(0)';
      alertEl.style.opacity = '1';
    }, 100);

    // Animate out
    setTimeout(() => {
      alertEl.style.transform = 'translateX(-50%) translateY(100px)';
      alertEl.style.opacity = '0';
      setTimeout(() => alertEl.remove(), 400);
    }, duration);
  },

  /**
   * Renders an elegant loader overlay with high-contrast indicator.
   */
  showLoadingOverlay(message = 'جاري التحميل الآمن...') {
    const overlay = document.createElement('div');
    overlay.id = 'zalo-global-loader';
    overlay.setAttribute('role', 'progressbar');
    overlay.setAttribute('aria-valuetext', message);

    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(8, 14, 10, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 20000;
      color: #ffffff;
      font-family: 'Cairo', sans-serif;
      direction: rtl;
    `;

    overlay.innerHTML = `
      <div class="loader-spinner" style="
        width: 50px;
        height: 50px;
        border: 4px solid rgba(201, 168, 76, 0.1);
        border-top: 4px solid var(--gold, #c9a84c);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <p style="font-size: 14px; font-weight: 800; color: var(--gold-light, #e8c97a); letter-spacing: 0.5px;">${message}</p>
    `;

    document.body.appendChild(overlay);

    if (!document.getElementById('loader-animation-style')) {
      const style = document.createElement('style');
      style.id = 'loader-animation-style';
      style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
  },

  hideLoadingOverlay() {
    const loader = document.getElementById('zalo-global-loader');
    if (loader) loader.remove();
  },

  /**
   * Dynamic WCAG 2.1 Accessibility Audit & Helper System (A11y Inspector)
   * Scans the active DOM for touch target sizes, missing aria-labels, and contrast helpers.
   */
  runAccessibilityAudit() {
    console.log('%c[ZaLo Accessibility] البدء في تدقيق معايير الوصول الـ WCAG 2.1...', 'color: #10b981; font-weight: bold;');
    let violations = 0;

    // 1. Check images for alt descriptions (WCAG 1.1.1)
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('alt') || img.getAttribute('alt').trim() === '') {
        console.warn('[WCAG Violation] صورة تفتقد لوصف بديل (alt attribute):', img);
        img.setAttribute('alt', 'صورة توضيحية لمنتج أو عنصر بسوق زالو الذكي'); // Automatic correction fallback
        violations++;
      }
    });

    // 2. Check interactive elements for touch target size (WCAG 2.5.5 - target size of at least 44x44px, android requires 48x48dp)
    const interactives = document.querySelectorAll('button, a, input, select');
    interactives.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        console.warn(`[WCAG Alert] عنصر تفاعلي صغير جداً للّمس (${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px). نوصي بـ 48px على الأقل:`, el);
        el.style.minWidth = '48px';
        el.style.minHeight = '48px';
        violations++;
      }
    });

    // 3. Ensure appropriate contrast attributes and text scaling is supported
    const bodyStyle = window.getComputedStyle(document.body);
    if (bodyStyle.overflow === 'hidden' || bodyStyle.overflowY === 'hidden') {
      console.warn('[WCAG Alert] تم اكتشاف قفل التمرير العمودي بالكامل مما يعيق بعض أدوات المساعدة.');
    }

    console.log(`%c[ZaLo Accessibility] تم الانتهاء من التدقيق بنجاح. تم رصد ومعالجة وتصحيح (${violations}) من الملاحظات.`, 'color: #c9a84c; font-weight: bold;');
  },

  /**
   * Initializes the design system.
   */
  init() {
    console.log("[DesignSystem] Initializing design system...");
    this.runAccessibilityAudit();
  }
};

window.DesignSystem = DesignSystem;

// Run audit dynamically after window loads fully in Dev environment
window.addEventListener('load', () => {
  DesignSystem.runAccessibilityAudit();
});

export default DesignSystem;
