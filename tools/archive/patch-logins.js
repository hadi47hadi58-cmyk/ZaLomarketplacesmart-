const fs = require('fs');
const files = ['web/admin-login.html', 'web/store-login.html', 'web/customer-login.html', 'web/staff-login.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the login success block
    const signinStart = content.indexOf('const { data, error } = await supabaseClient.auth.signInWithPassword');
    const catchStart = content.indexOf('} catch (err) {', signinStart);
    
    if (signinStart !== -1 && catchStart !== -1) {
        const replacement = `const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      console.log("[Login] Sign in successful. Setting tokens and redirecting...");
      showSuccess('✨ تم تسجيل الدخول بنجاح! جاري تحويلك...');

      if (typeof window.handleUserRedirect === 'function') {
        await window.handleUserRedirect(data.session);
      } else {
        window.location.reload();
      }
    `;
        content = content.substring(0, signinStart) + replacement + content.substring(catchStart);
        fs.writeFileSync(file, content);
        console.log(`Patched ${file}`);
    }
}
