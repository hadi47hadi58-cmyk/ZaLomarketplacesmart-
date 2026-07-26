import re
import os

files_to_scale = ['web/register-step1.html', 'web/register-step2.html', 'web/register-step3.html']

for fpath in files_to_scale:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # apply zoom to container
        if '.container {' in content:
            content = re.sub(r'(\.container \{[^}]+max-width:\s*)450px;', r'\1 320px; zoom: 0.85;', content)
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

