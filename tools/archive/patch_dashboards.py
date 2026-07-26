import os
import re

files = [
    'web/dashboard-store.html',
    'web/dashboard-manager.html',
    'web/dashboard-admin.html'
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Change sidebar width from w-80 to w-56
    content = re.sub(r'class="(w-80\s+bg-white[^"]*)"', r'class="w-56 bg-white border-l border-slate-200 flex-col shrink-0 z-50 fixed lg:sticky top-0 h-screen hidden lg:flex transition-all duration-300"', content)

    # 2. Add 'Return' button under the logo inside sidebar
    logo_block_pattern = r'(<div class="flex flex-col text-right">\s*<span[^>]*>ZaLo</span>\s*<span[^>]*>.*?</span>\s*</div>\s*</div>)'
    return_btn_html = r'\1\n            <div class="w-full mt-4 flex flex-col gap-2">\n                <button onclick="window.location.href=\'customer-home.html\'" class="bg-slate-100 text-slate-600 hover:bg-slate-200 w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"><i class="fa-solid fa-arrow-right"></i> العودة للوحة التحكم</button>\n                <button onclick="window.location.href=\'customer-home.html\'" class="bg-sky-50 text-sky-600 hover:bg-sky-100 w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"><i class="fa-solid fa-eye"></i> معاينة كزبون</button>\n            </div>'
    
    # Wait, if we add it there, it might break flex layout if the header isn't flex-col. 
    # The header is: <div class="p-6 border-b border-slate-100 flex items-center justify-between">
    # Wait! In the sidebar, the logo is inside a flex row with the close button.
    # Let's replace the whole sidebar header.
