import re

with open('web/register-step3.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add script for toggle visibility
toggle_script = """
  function toggleSection(id) {
    const el = document.getElementById(id);
    if (el.style.display === 'none' || el.style.display === '') {
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }
"""

if 'toggleSection(id)' not in content:
    content = content.replace('</script>\n</body>', toggle_script + '\n</script>\n</body>')

# Add styling for buttons
style_btn = """
    .upload-btn {
      width: 100%;
      background: #f0f9ff;
      color: #0369a1;
      border: 1px dashed #0ea5e9;
      border-radius: 12px;
      padding: 12px;
      font-weight: 700;
      font-size: 14px;
      font-family: 'Cairo', sans-serif;
      margin-bottom: 12px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }
    .upload-btn:hover {
      background: #e0f2fe;
      transform: scale(1.02);
    }
    .hidden-section {
      display: none;
      padding: 12px;
      background: #fafafa;
      border-radius: 12px;
      border: 1px solid #eee;
      margin-bottom: 16px;
    }
"""
if '.upload-btn' not in content:
    content = content.replace('</style>', style_btn + '\n  </style>')

# Replace the docs-r, docs-f, and common assets with the new structure
# I'll find the form-group type-row block and the end of common assets.
start_marker = r'<!-- Docs for registered merchant -->'
end_marker = r'<!-- End Common Assets -->' # Oh wait, there is no End marker. Let's find the end of the form.
# The common assets are:
# <div class="form-group" style="margin-top: 12px;">
# <label>🖼️ الشعار التجاري لمتجرك الخاص * (مهم جداً)</label>
# ...
# <div class="fbl" id="fl-front">صورة تميز واجهة متجرك</div>
# </div>
# </div>

# Let's do a smart regex or just string replacement if I can capture the block.
# Actually, I can use BeautifulSoup or just regex to replace the whole block from "<!-- Docs for registered merchant -->" to the end of that container.
