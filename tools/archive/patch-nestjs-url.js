const fs = require('fs');
let content = fs.readFileSync('web/js/supabase-db-compat.js', 'utf8');

const regex1 = /fetch\('\/api\/products'/g;
const regex2 = /fetch\('\/api\/orders'/g;

content = content.replace(regex1, "fetch((window.NESTJS_API_URL || 'http://localhost:3000/api') + '/products'");
content = content.replace(regex2, "fetch((window.NESTJS_API_URL || 'http://localhost:3000/api') + '/orders'");

fs.writeFileSync('web/js/supabase-db-compat.js', content);
console.log("Patched NestJS URLs");
