import re
import os

files = ['web/dashboard-store.html', 'web/dashboard-admin.html', 'web/dashboard-manager.html']

for fpath in files:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = content.replace("async function logoutUser() {", "window.logoutUser = async function() {")
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Exposed logoutUser to window")
