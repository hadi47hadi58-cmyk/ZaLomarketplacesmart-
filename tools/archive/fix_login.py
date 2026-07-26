import os

files = ['web/admin-login.html', 'web/store-login.html', 'web/staff-login.html', 'web/customer-login.html']

replacement = """  window.handleGoogleLogin = async function() {
    try {
      if (!supabaseClient) throw new Error("خدمة المصادقة غير متاحة حالياً");
      showSuccess("جاري التحويل إلى Google...");
      const redirectUrl = window.location.origin + window.location.pathname;
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl }
      });
      if (error) throw error;
    } catch (err) {
      console.error("[Login] Google Auth Error:", err);
      showError(err.message || 'حدث خطأ أثناء محاولة الدخول بواسطة Google');
    }
  }

  // الاستماع التلقائي لحدث تغيير حالة المصادقة من Supabase عند العودة من Google
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      showSuccess('✨ تم تأكيد تسجيل الدخول! جاري التوجيه...');
      if (typeof window.handleUserRedirect === 'function') {
        await window.handleUserRedirect();
      } else {
        const path = window.location.pathname;
        let target = 'customer-home.html';
        if (path.includes('admin-login')) target = 'dashboard-admin.html';
        else if (path.includes('store-login')) target = 'dashboard-store.html';
        else if (path.includes('staff-login')) target = 'dashboard-manager.html';
        window.location.replace(target);
      }
    }
  });

  function showError(msg) {
"""

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()
    
    start_str = "  window.handleGoogleLogin = async function() {"
    end_str = "  function showError(msg) {"
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str, start_idx)
    
    if start_idx != -1 and end_idx != -1:
        new_content = content[:start_idx] + replacement + content[end_idx + len(end_str):]
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")
    else:
        print(f"Could not find markers in {file_path}")

