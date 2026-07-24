with open('web/register-step1.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the whole script from "window.handleNextStep = async function" to the end of the function.
start_str = "window.handleNextStep = async function(event) {"
end_str = "};\n\n  // Run on load"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    new_func = """window.handleNextStep = async function(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const storeName = document.getElementById('storeName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const wilaya = document.getElementById('wilaya').value;
    const commune = document.getElementById('commune').value.trim();
    
    if (!fullName || !storeName || !phone || !wilaya || !commune) {
      window.showStatus("يرجى ملء جميع الحقول الإلزامية واختيار الولاية.", "error");
      return;
    }
    
    const cleanPhone = phone.replace(/[\\s\\-()]/g, '');
    if (!/^(05|06|07|02|03|04|09|\\+213)[0-9]{8,11}$/.test(cleanPhone)) {
      window.showStatus("يرجى إدخال رقم هاتف جزائري صالح.", "error");
      return;
    }

    const nextBtn = document.getElementById('next-step-btn') || document.getElementById('nextBtn');
    if (nextBtn) {
      nextBtn.disabled = true;
      const span = nextBtn.querySelector('span');
      if (span) span.textContent = 'جاري الحفظ...';
    }
    
    try {
      if (typeof currentUser !== 'undefined' && currentUser) {
        const profileData = {
          id: currentUser.id,
          phone: cleanPhone,
          wilaya: wilaya,
          commune: commune,
          updated_at: new Date().toISOString()
        };
        const { error: upsertError } = await supabase.from('profiles').upsert(profileData);
        if (upsertError) console.warn("Profile update warning:", upsertError);
      }
      
      // Save to sessionStorage
      sessionStorage.setItem('reg_fullName', fullName);
      sessionStorage.setItem('reg_storeName', storeName);
      sessionStorage.setItem('reg_phone', cleanPhone);
      sessionStorage.setItem('reg_wilaya', wilaya);
      sessionStorage.setItem('reg_commune', commune);
      
      window.showStatus("تم حفظ بيانات الخطوة الأولى بنجاح! جاري تحويلك...", "success");
      setTimeout(() => {
        window.location.href = 'register-step2.html';
      }, 1000);
      
    } catch (err) {
      console.error("Step 1 Error:", err);
      window.showStatus("فشل حفظ البيانات.", "error");
      if (nextBtn) {
        nextBtn.disabled = false;
        const span = nextBtn.querySelector('span');
        if (span) span.textContent = 'التالي';
      }
    }
  """
    content = content[:start_idx] + new_func + content[end_idx:]
    with open('web/register-step1.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("handleNextStep replaced")
else:
    print("Boundaries not found")
