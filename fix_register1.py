import re
with open('web/register-step1.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<!-- Email Verification Fields -->.*?<!-- Phone Field -->'

replacement = """<!-- Email Verification Fields -->
    <!-- Replaced with Full Name and Store Name -->
    <div class="form-group">
      <label for="fullName">الاسم الكامل ✍️</label>
      <div class="input-wrapper">
        <input 
          type="text" 
          id="fullName" 
          placeholder="الاسم الكامل"
          required
        >
        <i class="fa-solid fa-user field-icon"></i>
      </div>
    </div>
    
    <div class="form-group">
      <label for="storeName">اسم المحل / المتجر 🏪</label>
      <div class="input-wrapper">
        <input 
          type="text" 
          id="storeName" 
          placeholder="اسم متجرك"
          required
        >
        <i class="fa-solid fa-store field-icon"></i>
      </div>
    </div>

    <!-- Phone Field -->"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('web/register-step1.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated register-step1.html")
