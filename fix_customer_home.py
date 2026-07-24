import re

with open('web/customer-home.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the modal trigger
pattern_btn = r'onclick="document.getElementById\(\'merchantModal\'\)\.style\.display=\'flex\'"'
replacement_btn = r'onclick="window.location.href=\'register-step1.html\'"'

content = re.sub(pattern_btn, replacement_btn, content)

with open('web/customer-home.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated customer-home merchant button")
