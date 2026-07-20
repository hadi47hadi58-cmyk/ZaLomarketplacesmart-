const fs = require('fs');

const files = [
    'web/dashboard-admin.html',
    'web/dashboard-store.html',
    'web/dashboard-manager.html',
    'web/customer-home.html' // check if it has one
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    const regex = /function logoutUser\(\)\s*\{[\s\S]*?\n\s*\}/g;
    if (regex.test(content)) {
        content = content.replace(regex, `function logoutUser() {
            if (window.sessionManagerInstance) {
                window.sessionManagerInstance.logoutAndRedirect();
            } else if (typeof window.logoutUser === 'function') {
                window.logoutUser();
            } else {
                localStorage.clear();
                window.location.href = 'customer-login.html';
            }
        }`);
        fs.writeFileSync(file, content);
        console.log(`Patched logoutUser in ${file}`);
    }
}
