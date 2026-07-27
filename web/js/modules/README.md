# ZaLo Smart Architecture Refactoring

## الهدف (Goal)
تقسيم الملفات الضخمة (Spaghetti Code) إلى وحدات برمجية (Modules) قابلة للصيانة وإعادة الاستخدام.

## الهيكلة الجديدة (New Structure)
تم إنشاء هذه المجلدات لتنظيم الكود مستقبلاً:
1. `core/` : يحتوي على الملفات الأساسية مثل `supabase-config.js`, `session-manager.js`, `error-handler.js`.
2. `components/` : يحتوي على أجزاء الواجهة المتكررة (مثل الـ Navbar، الـ Sidebar) بحيث تُكتب مرة واحدة وتُستدعى كـ Web Components أو عبر الـ JavaScript.
3. `admin/` : يحتوي على منطق لوحة تحكم الإدارة مقسماً حسب الوظيفة (مثلاً: `admin-merchants.js`, `admin-products.js`, `admin-settings.js`).
4. `store/` : يحتوي على منطق لوحة تحكم التاجر مقسماً (مثلاً: `store-orders.js`, `store-inventory.js`).

## كيفية التطبيق (How to implement)
بدلاً من كتابة كل شيء في `dashboard-admin.html`:
```html
<script type="module">
    import { initMerchants } from './js/modules/admin/admin-merchants.js';
    import { initProducts } from './js/modules/admin/admin-products.js';
    
    document.addEventListener('DOMContentLoaded', () => {
        initMerchants();
        initProducts();
    });
</script>
```
