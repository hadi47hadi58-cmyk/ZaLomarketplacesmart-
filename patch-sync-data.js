const fs = require('fs');
let content = fs.readFileSync('web/dashboard-admin.html', 'utf8');

const syncStart = content.indexOf('async function initDashboard() {');
if (syncStart !== -1) {
    const replacement = `async function initDashboard() {
            try {
                const { data: storesData } = await supabaseClient.from('stores').select('*');
                if (storesData) localStorage.setItem('stores_list_old', JSON.stringify(storesData));

                const { data: productsData } = await supabaseClient.from('products').select('*');
                if (productsData) localStorage.setItem('products', JSON.stringify(productsData));

                const { data: ordersData } = await supabaseClient.from('orders').select('*');
                if (ordersData) localStorage.setItem('orders', JSON.stringify(ordersData));

                const { data: complaintsData } = await supabaseClient.from('complaints').select('*');
                if (complaintsData) localStorage.setItem('complaints', JSON.stringify(complaintsData));
            } catch (err) {
                console.error("Failed to sync dashboard data", err);
            }
`;
    content = content.replace('async function initDashboard() {', replacement);
    fs.writeFileSync('web/dashboard-admin.html', content);
    console.log("Patched initDashboard in dashboard-admin.html");
}
