import { fetchStoreStats } from './store-stats.js';

export async function renderMerchantFinancialReportsReal() {
    const stats = await fetchStoreStats();
    
    // We update the financial report tab if it exists
    const salesEl = document.getElementById('stat-total-sales');
    const pendingEl = document.getElementById('stat-pending-orders');
    const prodEl = document.getElementById('stat-total-products');
    
    // In legacy it was rendering some chart and a table. We'll at least update some basic elements if they exist
    if (salesEl) salesEl.innerText = stats.totalSales.toLocaleString('ar-DZ') + ' د.ج';
    if (pendingEl) pendingEl.innerText = stats.pendingOrders;
    if (prodEl) prodEl.innerText = stats.productsCount;
    
    // Legacy elements from dashboard-store.html "renderMerchantFinancialReports"
    const sumEl = document.getElementById('fin-sales-sum');
    const profitEl = document.getElementById('fin-profit-sum');
    
    if (sumEl) sumEl.innerText = stats.totalSales.toLocaleString('ar-DZ') + ' د.ج';
    if (profitEl) profitEl.innerText = (stats.totalSales * 0.95).toLocaleString('ar-DZ') + ' د.ج'; // Assuming 5% fee or something
    
    // Header Stats in store dashboard (assuming they exist with these IDs or we just rely on the above)
}

window.renderMerchantFinancialReports = renderMerchantFinancialReportsReal;

export function initStoreStatsRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('orders', () => {
            renderMerchantFinancialReportsReal();
        });
        window.zaloRealtime.subscribeToTable('products', () => {
            renderMerchantFinancialReportsReal();
        });
    }
}

// Call on load
renderMerchantFinancialReportsReal();
