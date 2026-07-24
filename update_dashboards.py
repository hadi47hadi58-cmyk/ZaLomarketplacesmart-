import os
import re

files = {
    'web/dashboard-store.html': 'بوابة التاجر',
    'web/dashboard-manager.html': 'بوابة الفرع',
    'web/dashboard-admin.html': 'بوابة الإدارة'
}

responsive_script = """
        let isMobileMode = false;
        function toggleResponsiveMode() {
            isMobileMode = !isMobileMode;
            const mainContainer = document.querySelector('main');
            const icon = document.getElementById('responsive-icon');
            if (!mainContainer || !icon) return;
            if (isMobileMode) {
                mainContainer.classList.remove('max-w-7xl');
                mainContainer.classList.add('max-w-md');
                mainContainer.style.borderLeft = '1px solid #e2e8f0';
                mainContainer.style.borderRight = '1px solid #e2e8f0';
                mainContainer.style.margin = '0 auto';
                mainContainer.style.backgroundColor = '#ffffff';
                icon.classList.remove('fa-mobile-screen-button');
                icon.classList.add('fa-desktop');
            } else {
                mainContainer.classList.remove('max-w-md');
                mainContainer.classList.add('max-w-7xl');
                mainContainer.style.borderLeft = 'none';
                mainContainer.style.borderRight = 'none';
                mainContainer.style.backgroundColor = 'transparent';
                icon.classList.remove('fa-desktop');
                icon.classList.add('fa-mobile-screen-button');
            }
        }
"""

logout_script_fixed = """        function logoutUser() {
            localStorage.clear();
            window.location.href = 'customer-login.html';
        }"""

for filepath, title in files.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Sidebar Width (w-80 to w-56)
    content = content.replace('w-80 bg-white border-l', 'w-56 bg-white border-l')

    # 2. Update Sidebar Header (Add Back & View as Customer buttons under logo)
    sidebar_header_pattern = r'<div class="p-6 border-b border-slate-100 flex items-center justify-between">.*?<button onclick="toggleSidebarMobile\(\)" class="lg:hidden text-slate-500 hover:text-slate-800 text-xl">\s*<i class="fa-solid fa-xmark"></i>\s*</button>\s*</div>'
    
    new_sidebar_header = f"""        <div class="p-4 border-b border-slate-100 flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                    <svg width="34" height="34" viewBox="0 0 100 100" style="flex-shrink: 0;">
                        <path d="M 29,13.6 A 42,42 0 1,0 71,13.6" fill="none" stroke="#d4af37" stroke-width="4.5" stroke-linecap="round" />
                        <path d="M47.5,75 L52.5,75 L52.1,68 L47.9,68 Z" fill="#d4af37" />
                        <path d="M47.9,66 L52.1,66 L51.7,59 L48.3,59 Z" fill="#d4af37" />
                        <path d="M48.3,57 L51.7,57 L51.3,50 L48.7,50 Z" fill="#d4af37" />
                        <path d="M48.7,48 L51.3,48 L51,45 L49,45 Z" fill="#d4af37" />
                        <path d="M49,46 C41,43 33,48 27,56 C35,51 43,49 49,48 Z" fill="#d4af37" />
                        <path d="M49,46 C39,37 30,39 22,45 C32,42 41,43 49,46 Z" fill="#d4af37" />
                        <path d="M49,46 C42,29 35,27 28,30 C36,31 43,37 49,44 Z" fill="#d4af37" />
                        <path d="M51,46 C59,43 67,48 73,56 C65,51 57,49 51,48 Z" fill="#d4af37" />
                        <path d="M51,46 C61,37 70,39 78,45 C68,42 59,43 51,46 Z" fill="#d4af37" />
                        <path d="M51,46 C58,29 65,27 72,30 C64,31 57,37 51,44 Z" fill="#d4af37" />
                        <path d="M50,45 C50,26 45,17 40,14 C47,19 50,31 50,45 Z" fill="#d4af37" />
                        <text x="35" y="62" font-family="'Cairo', sans-serif" font-weight="900" font-size="14" fill="#d4af37" text-anchor="middle">Z</text>
                        <text x="65" y="62" font-family="'Cairo', sans-serif" font-weight="900" font-size="14" fill="#d4af37" text-anchor="middle">L</text>
                    </svg>
                    <div class="flex flex-col text-right">
                        <span style="font-family: 'Great Vibes', cursive; font-size: 24px; color: #d4af37; line-height: 1;">ZaLo</span>
                        <span class="text-[9px] text-slate-400 font-extrabold mt-1">{title}</span>
                    </div>
                </div>
                <button onclick="toggleSidebarMobile()" class="lg:hidden text-slate-500 hover:text-slate-800 text-xl">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="flex flex-col gap-2">
                <button onclick="window.location.href='customer-home.html'" class="bg-slate-100 text-slate-600 hover:bg-slate-200 w-full py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-arrow-right"></i> العودة للوحة التحكم
                </button>
                <button onclick="window.location.href='customer-home.html'" class="bg-sky-50 text-sky-600 hover:bg-sky-100 w-full py-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-eye"></i> معاينة كزبون
                </button>
            </div>
        </div>"""
    content = re.sub(sidebar_header_pattern, new_sidebar_header, content, flags=re.DOTALL)

    # 3. Replace Top Header (Remove Return, Add Mobile Toggle, Add Logo centered)
    top_header_pattern = r'<header class="bg-white border-b border-slate-200 py-3 px-6 flex justify-between items-center lg:sticky top-0 z-30 shadow-sm shrink-0">.*?</header>'
    
    new_top_header = f"""        <header class="bg-white border-b border-slate-200 py-3 px-4 flex justify-between items-center lg:sticky top-0 z-30 shadow-sm shrink-0 relative">
            <div class="flex items-center gap-3 w-1/3">
                <button onclick="toggleSidebarMobile()" class="lg:hidden text-slate-600 hover:text-slate-800 text-xl">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <span class="hidden lg:inline-flex text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full font-bold">{title}</span>
            </div>
            
            <div class="w-1/3 flex justify-center">
                <a href="customer-home.html" class="flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" title="العودة للرئيسية">
                    <svg width="28" height="28" viewBox="0 0 100 100">
                        <path d="M 29,13.6 A 42,42 0 1,0 71,13.6" fill="none" stroke="#d4af37" stroke-width="4.5" stroke-linecap="round" />
                        <path d="M47.5,75 L52.5,75 L52.1,68 L47.9,68 Z" fill="#d4af37" />
                        <path d="M47.9,66 L52.1,66 L51.7,59 L48.3,59 Z" fill="#d4af37" />
                        <path d="M48.3,57 L51.7,57 L51.3,50 L48.7,50 Z" fill="#d4af37" />
                        <path d="M48.7,48 L51.3,48 L51,45 L49,45 Z" fill="#d4af37" />
                        <path d="M49,46 C41,43 33,48 27,56 C35,51 43,49 49,48 Z" fill="#d4af37" />
                        <path d="M49,46 C39,37 30,39 22,45 C32,42 41,43 49,46 Z" fill="#d4af37" />
                        <path d="M49,46 C42,29 35,27 28,30 C36,31 43,37 49,44 Z" fill="#d4af37" />
                        <path d="M51,46 C59,43 67,48 73,56 C65,51 57,49 51,48 Z" fill="#d4af37" />
                        <path d="M51,46 C61,37 70,39 78,45 C68,42 59,43 51,46 Z" fill="#d4af37" />
                        <path d="M51,46 C58,29 65,27 72,30 C64,31 57,37 51,44 Z" fill="#d4af37" />
                        <path d="M50,45 C50,26 45,17 40,14 C47,19 50,31 50,45 Z" fill="#d4af37" />
                        <text x="35" y="62" font-family="'Cairo', sans-serif" font-weight="900" font-size="14" fill="#d4af37" text-anchor="middle">Z</text>
                        <text x="65" y="62" font-family="'Cairo', sans-serif" font-weight="900" font-size="14" fill="#d4af37" text-anchor="middle">L</text>
                    </svg>
                </a>
            </div>
            
            <div class="flex items-center justify-end gap-2 w-1/3">
                <button onclick="toggleResponsiveMode()" class="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm" title="تغيير وضع العرض">
                    <i class="fa-solid fa-mobile-screen-button" id="responsive-icon"></i>
                </button>
                <span class="lg:hidden text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">{title.replace("بوابة ", "")}</span>
            </div>
        </header>"""
    content = re.sub(top_header_pattern, new_top_header, content, flags=re.DOTALL)

    # 4. Fix Logout Script
    broken_logout_pattern = r'function logoutUser\(\) \{.*?window\.logoutUser\(\);.*?\}'
    content = re.sub(broken_logout_pattern, logout_script_fixed, content, flags=re.DOTALL)

    # 5. Inject responsive mode script before </body>
    if 'toggleResponsiveMode()' not in content:
        content = content.replace('</body>', responsive_script + '\n</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Dashboards updated: Sidebar, Top bar, Logout fix, Responsive toggle.")
