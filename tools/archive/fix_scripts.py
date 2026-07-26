import re

files = [
    'web/dashboard-store.html',
    'web/dashboard-manager.html',
    'web/dashboard-admin.html'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Fix the syntax error in logoutUser
    bad_logout_pattern = r'function logoutUser\(\) \{\s*localStorage\.clear\(\);\s*window\.location\.href = \'customer-login\.html\';\s*\} else \{\s*localStorage\.clear\(\);\s*window\.location\.href = \'customer-login\.html\';\s*\}\s*\}'
    good_logout = """function logoutUser() {
            localStorage.clear();
            window.location.href = 'customer-login.html';
        }"""
    content = re.sub(bad_logout_pattern, good_logout, content)

    # Insert toggleResponsiveMode if not exists, right before </script>
    responsive_script = """
        let isMobileMode = false;
        window.toggleResponsiveMode = function() {
            isMobileMode = !isMobileMode;
            const mainContainer = document.querySelector('main');
            const icon = document.getElementById('responsive-icon');
            if (!mainContainer || !icon) return;
            if (isMobileMode) {
                mainContainer.classList.remove('max-w-7xl');
                mainContainer.classList.add('max-w-md');
                mainContainer.style.borderLeft = '1px solid #e2e8f0';
                mainContainer.style.borderRight = '1px solid #e2e8f0';
                mainContainer.style.margin = '0 auto';
                mainContainer.style.backgroundColor = '#ffffff';
                icon.classList.remove('fa-mobile-screen-button');
                icon.classList.add('fa-desktop');
            } else {
                mainContainer.classList.remove('max-w-md');
                mainContainer.classList.add('max-w-7xl');
                mainContainer.style.borderLeft = 'none';
                mainContainer.style.borderRight = 'none';
                mainContainer.style.backgroundColor = 'transparent';
                icon.classList.remove('fa-desktop');
                icon.classList.add('fa-mobile-screen-button');
            }
        };
"""
    if 'toggleResponsiveMode' not in content:
        content = content.replace('</script>\n</body>', responsive_script + '</script>\n</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed syntax error and injected responsive toggle.")
