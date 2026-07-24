import os
import re

auth_files = [
    'web/customer-login.html',
    'web/admin-login.html',
    'web/store-login.html',
    'web/staff-login.html',
    'web/register.html',
    'web/register-step1.html',
    'web/register-step2.html',
    'web/register-step3.html'
]

for filepath in auth_files:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} (not found)")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Remove back-btn anchor
    content = re.sub(r'<a\s+[^>]*class=["\']back-btn["\'][^>]*>.*?</a>', '', content, flags=re.DOTALL)
    
    # 2. Make logo-area clickable
    if 'class="logo-area"' in content:
        content = content.replace(
            'class="logo-area"',
            'class="logo-area" onclick="window.location.href=\'customer-home.html\'" style="cursor: pointer;" title="العودة للرئيسية"'
        )
    elif "class='logo-area'" in content:
        content = content.replace(
            "class='logo-area'",
            "class='logo-area' onclick=\"window.location.href='customer-home.html'\" style=\"cursor: pointer;\" title=\"العودة للرئيسية\""
        )
        
    # 3. Inject compact viewport CSS to prevent vertical scroll overflow
    compact_css = """
    body {
      height: 100vh !important;
      max-height: 100vh !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 4px !important;
      box-sizing: border-box !important;
    }
    .wrapper {
      max-height: 96vh !important;
      overflow-y: auto !important;
      width: 100% !important;
      max-width: 420px !important;
      margin: 0 auto !important;
      padding: 14px !important;
      box-sizing: border-box !important;
    }
    """
    if '</style>' in content and 'max-height: 100vh' not in content:
        content = content.replace('</style>', compact_css + '\n</style>')
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully patched {filepath}")

print("All auth pages patched successfully.")
