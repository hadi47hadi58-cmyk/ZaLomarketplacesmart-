const fs = require('fs');
let content = fs.readFileSync('web/dashboard-admin.html', 'utf8');

const startIdx = content.indexOf('function renderStats() {');
const endIdx = content.indexOf('function initSecurityMatrix()', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newRenderStats = `async function renderStats() {
            try {
                // Fetch from Supabase
                const { count: activeStoresCount } = await supabaseClient.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED');
                document.getElementById('stat-active-stores').innerText = activeStoresCount || 0;

                const { count: pendingStoresCount } = await supabaseClient.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
                document.getElementById('stat-pending-security').innerText = pendingStoresCount || 0;
                
                const pendingRegBadge = document.getElementById('badge-registrations-count');
                if (pendingRegBadge) pendingRegBadge.innerText = pendingStoresCount || 0;

                const { count: productsCount } = await supabaseClient.from('products').select('*', { count: 'exact', head: true });
                document.getElementById('stat-total-products').innerText = productsCount || 0;

                const { data: orders } = await supabaseClient.from('orders').select('total_amount').in('status', ['تم التسليم', 'DELIVERED', 'delivered']);
                let profits = 0;
                if (orders && orders.length > 0) {
                    profits = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) * 0.05;
                }
                
                const profitsEl = document.getElementById('stat-platform-profits');
                if (profitsEl) {
                    profitsEl.innerText = profits.toLocaleString() + ' دج';
                }
            } catch (err) {
                console.error('Error fetching stats from Supabase', err);
            }
        }

        `;
    
    content = content.substring(0, startIdx) + newRenderStats + content.substring(endIdx);
    fs.writeFileSync('web/dashboard-admin.html', content);
    console.log("Patched renderStats in dashboard-admin.html");
}
