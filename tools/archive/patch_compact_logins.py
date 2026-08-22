import os
import re

files = [
    'web/customer-login.html',
    'web/admin-login.html',
    'web/store-login.html',
    'web/staff-login.html'
]

compact_css = """
    html, body {
      height: 100vh !important;
      height: 100dvh !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      background: var(--bg) !important;
      font-family: 'Cairo', sans-serif !important;
      width: 100vw !important;
      box-sizing: border-box !important;
    }
    body::before {
      content: '';
      position: fixed; inset: 0;
      background:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14,165,233,0.1) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 100%, rgba(212,175,55,0.05) 0%, transparent 50%);
      pointer-events: none;
      z-index: 1;
    }
    .wrapper {
      width: 100% !important;
      max-width: 380px !important;
      padding: 0 10px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      max-height: 100vh !important;
      max-height: 100dvh !important;
      overflow: hidden !important;
      margin: 0 auto !important;
      position: relative;
      z-index: 10;
    }
    .logo-area {
      text-align: center !important;
      margin-bottom: 6px !important;
      cursor: pointer !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      transition: transform 0.2s ease !important;
      user-select: none !important;
    }
    .logo-area:hover {
      transform: scale(1.03) !important;
    }
    .logo-area svg {
      width: 40px !important;
      height: 40px !important;
      margin-bottom: 0px !important;
    }
    .card {
      background: var(--card) !important;
      border: 1.5px solid var(--border) !important;
      border-radius: 14px !important;
      padding: 10px 12px !important;
      box-shadow: 0 6px 20px rgba(0,0,0,0.04) !important;
      margin-bottom: 0 !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    .card-title {
      font-size: 13px !important;
      font-weight: 800 !important;
      color: var(--text) !important;
      margin-bottom: 6px !important;
      text-align: center !important;
    }
    .form-group {
      margin-bottom: 6px !important;
      text-align: right !important;
    }
    .form-label {
      display: block !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      color: var(--gold2) !important;
      margin-bottom: 2px !important;
    }
    .input-wrapper {
      position: relative !important;
    }
    .input-icon {
      position: absolute !important;
      right: 10px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      color: var(--text2) !important;
      font-size: 12px !important;
    }
    .form-input {
      width: 100% !important;
      background: #ffffff !important;
      border: 1px solid var(--border) !important;
      border-radius: 8px !important;
      padding: 5px 28px 5px 8px !important;
      color: var(--text) !important;
      font-family: inherit !important;
      font-size: 12px !important;
      transition: all 0.25s ease !important;
      text-align: right !important;
      box-sizing: border-box !important;
    }
    .toggle-pass {
      position: absolute !important;
      left: 8px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      color: var(--text2) !important;
      cursor: pointer !important;
      font-size: 12px !important;
      padding: 2px !important;
      z-index: 10 !important;
    }
    .submit-btn {
      width: 100% !important;
      background: var(--green) !important;
      border: 1px solid var(--gold) !important;
      color: #fff !important;
      font-family: inherit !important;
      font-size: 13px !important;
      font-weight: 800 !important;
      padding: 6px 10px !important;
      border-radius: 8px !important;
      cursor: pointer !important;
      box-shadow: 0 4px 12px rgba(14,165,233,0.2) !important;
      transition: all 0.25s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      margin-top: 2px !important;
    }
    .login-tabs {
      display: flex !important;
      background: rgba(148, 163, 184, 0.08) !important;
      border: 1px solid var(--border) !important;
      border-radius: 8px !important;
      padding: 2px !important;
      margin-bottom: 6px !important;
      gap: 3px !important;
    }
    .tab-btn {
      flex: 1 !important;
      background: transparent !important;
      border: none !important;
      padding: 4px 6px !important;
      border-radius: 6px !important;
      font-family: 'Cairo', sans-serif !important;
      font-size: 11px !important;
      font-weight: 800 !important;
      color: var(--text2) !important;
      cursor: pointer !important;
      transition: all 0.25s !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4px !important;
    }
    .tab-btn.active {
      background: rgba(14, 165, 233, 0.1) !important;
      color: var(--green) !important;
    }
    .back-btn { display: none !important; }
"""

logo_html = """<div class="logo-area" onclick="window.location.href='customer-home.html'" title="العودة للمتجر" style="text-align: center; margin-bottom: 6px; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
    <svg width="40" height="40" viewBox="0 0 100 100" style="margin-bottom: 0px;">
      <path d="M 29,13.6 A 42,42 0 1,0 71,13.6" fill="none" stroke="#d4af37" stroke-width="2.5" stroke-linecap="round" />
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
      <path d="M50,45 C50,26 55,17 60,14 C53,19 50,31 50,45 Z" fill="#d4af37" />
      <text x="35" y="62" font-family="'Cairo', sans-serif" font-weight="900" font-size="14" fill="#d4af37" text-anchor="middle">Z</text>
      <text x="65" y="62" font-family="'Cairo', sans-serif" font-weight="900" font-size="14" fill="#d4af37" text-anchor="middle">L</text>
    </svg>
    <div style="font-family: 'Great Vibes', cursive; font-size: 22px; color: #d4af37; line-height: 0.9; margin-top: -2px;">ZaLo</div>
    <div style="font-family: 'Cairo', sans-serif; font-size: 9px; font-weight: 800; color: #d4af37; letter-spacing: 0.5px;">السوق الذكي</div>
    <div style="font-size: 10px; font-weight: 800; color: var(--green); margin-top: 2px; display: inline-flex; align-items: center; gap: 4px;">
      <i class="fa-solid fa-arrow-right"></i> العودة للمتجر
    </div>
  </div>"""

for filepath in files:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} (not found)")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Remove back-btn anchors
    content = re.sub(r'<a\s+[^>]*class=["\']back-btn["\'][^>]*>.*?</a>', '', content, flags=re.DOTALL)
    
    # 2. Append compact CSS before </style>
    if '</style>' in content and 'max-height: 100vh !important' not in content:
        content = content.replace('</style>', compact_css + '\n</style>')
        
    # 3. Replace logo-area
    content = re.sub(r'<div class=["\']logo-area["\'].*?<!-- "السوق الذكي" Subtitle -->\s*<div[^>]*>.*?</div>\s*</div>', logo_html, content, flags=re.DOTALL)
    if 'title="العودة للمتجر"' not in content:
        content = re.sub(r'<div class=["\']logo-area["\'].*?</div>\s*<div class=["\']card["\']>', logo_html + '\n  <div class="card">', content, flags=re.DOTALL)
        
    # 4. Reduce inline margins & paddings inside form cards
    content = re.sub(r'style=["\']margin:\s*20px 0;', 'style="margin: 6px 0;', content)
    content = re.sub(r'style=["\']margin-top:\s*15px;', 'style="margin-top: 4px;', content)
    content = re.sub(r'style=["\']padding:\s*12px;', 'style="padding: 6px;', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {filepath}")

print("All 4 login files successfully updated.")
