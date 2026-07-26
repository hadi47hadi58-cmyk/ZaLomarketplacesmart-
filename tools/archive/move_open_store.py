import re

filepath = 'web/dashboard-store.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the promo banner
promo_pattern = r'<!-- OPEN STORE PROMOTION BANNER -->\s*<div class="bg-gradient-to-r[^>]+>.*?</div>\s*</div> <!-- End of Section 1: Home & Stats -->'
content = re.sub(promo_pattern, r'</div> <!-- End of Section 1: Home & Stats -->', content, flags=re.DOTALL)

# 2. Add the button to the sidebar
nav_end_pattern = r'(</nav>)'
btn_html = r"""            <button onclick="showPermissionAudit({ actionName: 'إضافة فروع متعددة للمتجر الإقليمي', allowedRoles: ['admin', 'manager'], currentRole: 'merchant', status: 'RESTRICTED', description: 'صلاحية إضافة فروع إقليمية متعددة للمتاجر هي للمدير العام والمديرين التنفيذيين فقط لمراجعة السجلات ومطابقة تراخيص النشاط التجاري قبل النشر والتوسيع. دورك الحالي: تاجر معتمد بالمنصة.' })" class="sidebar-tab-btn">
                <i class="fa-solid fa-store text-[#d4af37]"></i>
                <span class="font-bold">افتح متجراً الآن</span>
            </button>
        \1"""
content = re.sub(nav_end_pattern, btn_html, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Moved 'Open Store' to sidebar.")
