const fs = require('fs');
let content = fs.readFileSync('database/trigger_role_routing.sql', 'utf8');

const regex = /-- Replicate to profiles table for frontend legacy compatibility[\s\S]*?EXCEPTION WHEN OTHERS THEN[\s\S]*?END;/g;
if (regex.test(content)) {
    content = content.replace(regex, '-- Legacy profiles table retired');
    fs.writeFileSync('database/trigger_role_routing.sql', content);
    console.log("Trigger patched to remove profiles replication");
}
