const fs = require('fs');

function fixTrigger(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/user_phone := COALESCE\(.*?\);/s, "user_phone := NULLIF(COALESCE(new.raw_user_meta_data->>'phone', new.phone), '');");
    fs.writeFileSync(filePath, content);
}

fixTrigger('database/trigger_role_routing.sql');
fixTrigger('database/schema.sql');
console.log("Triggers fixed");
