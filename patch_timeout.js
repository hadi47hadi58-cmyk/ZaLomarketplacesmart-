const fs = require('fs');
let code = fs.readFileSync('web/customer-home.html', 'utf8');
code = code.replace(
  /const { data, error } = await supabase\s*\n\s*\.from\('products'\)\s*\n\s*\.select\('\*'\);/m,
  `const fetchPromise = supabase.from('products').select('*');
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);`
);
fs.writeFileSync('web/customer-home.html', code);
