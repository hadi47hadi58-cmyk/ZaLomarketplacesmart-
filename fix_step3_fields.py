import re

with open('web/register-step3.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove email, password, confirmPassword fields
pattern = r'<div class="form-group">\s*<label for="email">.*?<input\s*type="password"\s*id="confirmPassword"[^>]*>\s*</div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('web/register-step3.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed email and password from step 3")
