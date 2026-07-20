const fs = require('fs');
let content = fs.readFileSync('database/schema.sql', 'utf8');

const regex = /-- 6\. نسخ البيانات في جدول Profiles للتوافق التام مع الواجهة الأمامية القديمة[\s\S]*?EXCEPTION WHEN OTHERS THEN[\s\S]*?END;/g;
if (regex.test(content)) {
    content = content.replace(regex, '-- 6. Legacy profiles table retired');
    fs.writeFileSync('database/schema.sql', content);
    console.log("Schema patched to remove profiles replication");
}
