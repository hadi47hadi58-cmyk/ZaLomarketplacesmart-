import re
import os

files = ['web/register-step1.html', 'web/register-step2.html', 'web/register-step3.html']

for fpath in files:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # We will add zoom: 0.75; and max-width: 320px;
        # Since different files have different max-width (460px, 450px, etc)
        content = re.sub(r'(\.container\s*\{[^}]+max-width:\s*)\d+px;', r'\1 320px; zoom: 0.85;', content)
        
        # also reduce padding
        content = re.sub(r'(padding:\s*)3\d+px\s+2\d+px;', r'\1 20px 16px;', content)
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Scaled UI in steps")
