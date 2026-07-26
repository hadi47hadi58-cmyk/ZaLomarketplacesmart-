import re

with open('web/register-step3.html', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace completeRegistration
# Look for: window.completeRegistration = async function(e) { ... }
start_str = "window.completeRegistration = async function(e) {"
end_str = "  };\n"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    new_script = """window.completeRegistration = async function(e) {
    e.preventDefault();
    
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');

    let storeName = sessionStorage.getItem('reg_storeName') || '';
    let category = '';
    let storeType = 'registered';
    let getB64 = id => document.getElementById(id)?.dataset?.base64 || '';
    
    let logoB64 = '';
    let frontFile = '';
    let rcFile = '';
    let idFront = '';
    let idBack = '';
    let rcnum = '';

    category = document.getElementById('category')?.value || 'عام';
    storeType = window._stype || 'registered';
    
    logoB64 = getB64('f-logo');
    frontFile = getB64('f-front');
    rcFile = storeType === 'registered' ? getB64('f-rc') : '';
    idFront = storeType === 'registered' ? getB64('f-idfront') : getB64('f-idf');
    idBack = storeType === 'free' ? getB64('f-honor') : ''; 
    rcnum = storeType === 'registered' ? document.getElementById('rcNumber')?.value.trim() : '';

    if (!logoB64) {
      errorMsg.textContent = 'شعار المتجر مطلوب لتهيئته للزبائن';
      errorMsg.classList.add('show');
      return;
    }

    submitBtn.disabled = true;
    loading.classList.add('show');
    errorMsg.classList.remove('show');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("جلسة غير صالحة. الرجاء تسجيل الدخول مجددا.");
      }
      
      const uid = session.user.id;
      const email = session.user.email;
      const fullName = sessionStorage.getItem('reg_fullName') || session.user.user_metadata?.full_name || '';
      
      // Update profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: uid,
        name: fullName,
        email: email,
        phone: phone,
        wilaya: wilaya,
        commune: commune,
        role: 'merchant',
        status: 'active',
        updated_at: new Date().toISOString()
      });

      if (profileError) console.warn("Profiles upsert warning:", profileError.message);

      const rnum = 'REG-' + Date.now().toString().slice(-6);
      
      // Save to merchant_requests
      const reqPayload = {
        user_id: uid,
        store_name: storeName,
        category: category,
        wilaya: wilaya,
        commune: commune,
        status: 'PENDING',
        rc_number: rcnum,
        logo: logoB64,
        id_front: idFront,
        id_back: idBack,
        rc_doc: rcFile,
        front_image: frontFile,
        merchant_type: storeType
      };
      
      const { error: reqError } = await supabase.from('merchant_requests').insert(reqPayload);
      if (reqError) {
        console.warn("Requests insert warning:", reqError.message);
      }
      
      window.showToast?.("تم رفع ملفك وطلبك للتاجر بنجاح!") || alert("تم بنجاح!");
      
      setTimeout(() => {
        window.location.href = 'customer-home.html';
      }, 1500);

    } catch (error) {
      console.error(error);
      errorMsg.textContent = error.message || 'حدث خطأ، الرجاء المحاولة مرة أخرى';
      errorMsg.classList.add('show');
      submitBtn.disabled = false;
    } finally {
      loading.classList.remove('show');
    }
"""
    content = content[:start_idx] + new_script + content[end_idx:]
    with open('web/register-step3.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed completeRegistration")
else:
    print("Could not find completeRegistration boundaries")
