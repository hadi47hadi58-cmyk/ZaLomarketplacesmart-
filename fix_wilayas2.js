const fs = require('fs');

let html = fs.readFileSync('web/customer-home.html', 'utf8');

// Replace the hero image logic at 2614
html = html.replace(
    /<img src="\${wilayaObj\.img}.*?>/,
    `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #0f172a, #0c4a6e, #0369a1); display: flex; align-items: center; justify-content: center; opacity: 0.9;">
              <i class="fa-solid fa-map-location-dot" style="font-size: 60px; color: rgba(255, 255, 255, 0.1);"></i>
            </div>`
);

// Replace the prompt modal image logic at 2648
html = html.replace(
    /<img src="\${wilayaObj\.img}".*?>/,
    `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, var(--brand-gold), #eab308); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 24px;">
          \${wilayaObj.id}
        </div>`
);

fs.writeFileSync('web/customer-home.html', html);
console.log('Fixed more wilaya imgs!');
