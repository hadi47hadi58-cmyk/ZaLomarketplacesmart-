const fs = require('fs');
let content = fs.readFileSync('web/js/supabase-db-compat.js', 'utf8');
content = content.replace(/if \(!session\) \{ const \{ data: \{ session: currentSession \} \} = await supabase.auth.getSession\(\); session = currentSession; \}\n        session = currentSession;/g, "if (!session) {\n            const { data } = await supabase.auth.getSession();\n            session = data.session;\n        }");
fs.writeFileSync('web/js/supabase-db-compat.js', content);
