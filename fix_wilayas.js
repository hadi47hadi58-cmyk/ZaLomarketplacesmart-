const fs = require('fs');

let html = fs.readFileSync('web/customer-home.html', 'utf8');

// Replace the CSS for wilaya-thumb-square
html = html.replace(
    /\.wilaya-thumb-square \{[\s\S]*?\}/,
    `.wilaya-thumb-square {
  width: 58px !important;
  height: 58px !important;
  border-radius: 50% !important;
  overflow: hidden !important;
  background: linear-gradient(135deg, #0ea5e9, #0284c7) !important;
  position: relative !important;
  border: 2px solid rgba(14, 165, 233, 0.3) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: white !important;
  font-weight: 900 !important;
  font-size: 22px !important;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.3) !important;
}`
);

// Add a specific active state gradient
html = html.replace(
    /\.wilaya-card-square\.active-state \{[\s\S]*?\}/,
    `.wilaya-card-square.active-state {
  border-color: #0ea5e9 !important;
  background: rgba(14, 165, 233, 0.08) !important;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.3) !important;
}
.wilaya-card-square.active-state .wilaya-thumb-square {
  background: linear-gradient(135deg, var(--brand-gold), #eab308) !important;
  border-color: var(--brand-gold) !important;
}`
);

// Replace the rendering logic to use the number instead of img
html = html.replace(
    /<div class="wilaya-thumb-square">[\s\S]*?<\/div>/,
    `<div class="wilaya-thumb-square">
          \${w.id}
        </div>`
);

fs.writeFileSync('web/customer-home.html', html);
console.log('Fixed wilaya thumb rendering!');
