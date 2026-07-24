import re

with open('web/register-step3.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<div class="form-group">\s*<label for="storeName">.*?<input type="text" id="storeName".*?>\s*</div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('web/register-step3.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed storeName from step 3")
