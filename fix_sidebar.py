import re

with open('web/dashboard-store.html', 'r', encoding='utf-8') as f:
    content = f.read()

bad_btn = r'<button onclick="showPermissionAudit[^"]*" class="sidebar-tab-btn">\s*<i class="fa-solid fa-store text-\[#d4af37\]"></i>\s*<span class="font-bold">افتح متجراً الآن</span>\s*</button>'
good_btn = r"""<button onclick="window.location.href='register-step1.html'" class="sidebar-tab-btn">
                <i class="fa-solid fa-store text-[#d4af37]"></i>
                <span class="font-bold">تسجيل كتاجر</span>
            </button>"""

content = re.sub(bad_btn, good_btn, content)

with open('web/dashboard-store.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed sidebar button")
