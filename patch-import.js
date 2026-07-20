const fs = require('fs');
let content = fs.readFileSync('web/js/supabase-db-compat.js', 'utf8');

if (!content.includes("import sessionManagerInstance from './session-manager.js';")) {
    const splitIndex = content.indexOf('\n', content.indexOf('import')) !== -1 ? content.indexOf('\n', content.indexOf('import')) : 0;
    
    // We need to find the right place to put it. It might be after other imports.
    content = `import sessionManagerInstance from './session-manager.js';\n` + content;
    fs.writeFileSync('web/js/supabase-db-compat.js', content);
    console.log("Import added.");
}
