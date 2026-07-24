import re
import os

files = ['web/dashboard-store.html', 'web/dashboard-admin.html', 'web/dashboard-manager.html']

for fpath in files:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # we can replace localStorage.clear(); with a more robust clearing if needed.
        # or maybe the issue is that it doesn't log out from supabase?
        # Let's add sessionStorage.clear(); and supabase.auth.signOut(); (if supabase exists)
        
        replacement = """                async function logoutUser() {
            localStorage.clear();
            sessionStorage.clear();
            if (typeof supabase !== 'undefined' && supabase.auth) {
                try {
                    await supabase.auth.signOut();
                } catch(e){}
            }
            window.location.href = 'customer-login.html';
        }"""
        
        pattern = r"function logoutUser\(\) \{\s*localStorage\.clear\(\);\s*window\.location\.href = '[^']+';\s*\}"
        content = re.sub(pattern, replacement, content)
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Updated logouts in dashboards")
