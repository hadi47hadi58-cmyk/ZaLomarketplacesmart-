// ZaLo Marketplace Smart Sync Update: 2026-07-16
/**
 * ZaLo Smart - Performance Optimization & Advanced UI Animations (performance-animations.js)
 * أدوات تسريع وتحسين الأداء ومعالجة الحركة المتطورة لضمان استجابة وتجربة مستخدم متميزة
 */

export const PerformanceAnimations = {
  /**
   * Simple debounce wrapper to limit trigger frequency.
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Simple throttle wrapper to guarantee steady interval executions.
   */
  throttle(func, limit) {
    let inThrottle;
    return functionExecuted(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Initializes lazy loading of images for optimized network usage (Performance).
   */
  initLazyImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imgObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      });
      images.forEach(img => imgObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      });
    }
  },

  /**
   * Creates organic, beautiful card entrance animations using intersection observer (Advanced Animations).
   */
  animateCardsOnScroll() {
    const cards = document.querySelectorAll('.card, .pcard, .prod-card, .glassmorphic-card');
    
    // Create base animation CSS dynamically if not present
    if (!document.getElementById('zalo-card-entrance-style')) {
      const style = document.createElement('style');
      style.id = 'zalo-card-entrance-style';
      style.innerHTML = `
        .zalo-entrance-hidden {
          opacity: 0 !important;
          transform: translateY(20px) scale(0.96) !important;
          transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .zalo-entrance-visible {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }
      `;
      document.head.appendChild(style);
    }

    if ('IntersectionObserver' in window) {
      const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('zalo-entrance-visible');
            cardObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      cards.forEach(card => {
        card.classList.add('zalo-entrance-hidden');
        cardObserver.observe(card);
      });
    } else {
      cards.forEach(card => card.classList.remove('zalo-entrance-hidden'));
    }
  },

  /**
   * Initializes performance optimizations.
   */
  init() {
    console.log("[PerformanceAnimations] Initializing...");
    this.initLazyImages();
    this.animateCardsOnScroll();
  }
};

window.PerformanceAnimations = PerformanceAnimations;

document.addEventListener('DOMContentLoaded', () => {
  PerformanceAnimations.initLazyImages();
  PerformanceAnimations.animateCardsOnScroll();
});

export default PerformanceAnimations;
