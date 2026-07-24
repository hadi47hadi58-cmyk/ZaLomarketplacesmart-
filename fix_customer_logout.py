with open('web/customer-home.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add window.location.href = 'customer-login.html'; to handleLogout
# Look for "user = { id: 'guest', email: 'زائر' };"
if "user = { id: 'guest', email: 'زائر' };" in content:
    content = content.replace(
        "user = { id: 'guest', email: 'زائر' };\n  }",
        "user = { id: 'guest', email: 'زائر' };\n    window.location.href = 'customer-login.html';\n  }"
    )

with open('web/customer-home.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added redirect to handleLogout in customer-home.html")
