import re

with open('web/register-step3.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<!-- Docs for registered merchant -->.*?(?=<div class="fbi">📸</div>)'

replacement = """<!-- Docs sections (Collapsible) -->
      <button type="button" class="upload-btn" onclick="toggleSection('docs-container')">
        <span><i class="fa-solid fa-folder-open"></i> تحميل الوثائق التجارية (إلزامي)</span>
        <i class="fa-solid fa-chevron-down"></i>
      </button>

      <div id="docs-container" class="hidden-section">
        <!-- Docs for registered merchant -->
        <div id="docs-r">
          <div class="ibox">📋 <strong>الملف الرسمي:</strong> نسخة من السجل التجاري مع بطاقة التعريف.</div>
          
          <div class="form-group">
            <label>📄 نسخة السجل التجاري * (اختياري إن لم يتوفر حالياً)</label>
            <div class="file-box" id="fb-rc">
              <input type="file" id="f-rc" accept=".pdf,image/*" onchange="filePick(this,'fb-rc','fl-rc')">
              <div class="fbi">📄</div>
              <div class="fbl" id="fl-rc">مستند السجل التجاري</div>
            </div>
          </div>
          <div class="form-group">
            <label>🪪 بطاقة الهوية الوطنية *</label>
            <div class="file-box" id="fb-idfront">
              <input type="file" id="f-idfront" accept="image/*" onchange="filePick(this,'fb-idfront','fl-idfront')">
              <div class="fbi">🪪</div>
              <div class="fbl" id="fl-idfront">الوجه الأمامي للبطاقة</div>
            </div>
          </div>
          <div class="form-group">
            <label>🔢 رقم قيد السجل التجاري</label>
            <input type="text" id="rcNumber" placeholder="مثال: 00-12345678">
          </div>
        </div>

        <!-- Docs for free merchant -->
        <div id="docs-f" style="display: none;">
          <div class="ibox">🪪 <strong>تاجر المهن الحرة:</strong> بطاقة الهوية وتصريح شرفي.</div>
          
          <div class="form-group">
            <label>✍️ تصريح شرفي *</label>
            <div class="file-box" id="fb-honor">
              <input type="file" id="f-honor" accept=".pdf,image/*" onchange="filePick(this,'fb-honor','fl-honor')">
              <div class="fbi">✍️</div>
              <div class="fbl" id="fl-honor">رفع التصريح الشرفي</div>
            </div>
          </div>
          <div class="form-group">
            <label>🪪 بطاقة الهوية الوطنية *</label>
            <div class="file-box" id="fb-idf">
              <input type="file" id="f-idf" accept="image/*" onchange="filePick(this,'fb-idf','fl-idf')">
              <div class="fbi">🪪</div>
              <div class="fbl" id="fl-idf">الوجه الأمامي للبطاقة</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Common Assets -->
      <button type="button" class="upload-btn" onclick="toggleSection('images-container')">
        <span><i class="fa-solid fa-images"></i> رفع صورة (شعار - صورة واجهة محل)</span>
        <i class="fa-solid fa-chevron-down"></i>
      </button>

      <div id="images-container" class="hidden-section">
        <div class="form-group">
          <label>🖼️ الشعار التجاري *</label>
          <div class="file-box" id="fb-logo">
            <input type="file" id="f-logo" accept="image/*" onchange="filePick(this,'fb-logo','fl-logo')">
            <div class="fbi">🖼️</div>
            <div class="fbl" id="fl-logo">اختيار صورة الشعار</div>
          </div>
        </div>

        <div class="form-group">
          <label>📸 صورة واجهة المحل (اختياري)</label>
          <div class="file-box" id="fb-front">
            <input type="file" id="f-front" accept="image/*" onchange="filePick(this,'fb-front','fl-front')">
            """

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('web/register-step3.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced docs and assets blocks with collapsible sections.")
