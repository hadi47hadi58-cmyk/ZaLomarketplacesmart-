import re

with open('web/customer-home.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"window\.applyForMerchant = function\(\) \{\s*document\.getElementById\('merchantModal'\)\.style\.display = 'block';\s*\};"
replacement = "window.applyForMerchant = function() { window.location.href = 'register-step1.html'; };"

content = re.sub(pattern, replacement, content)

with open('web/customer-home.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated applyForMerchant in customer-home.html")
