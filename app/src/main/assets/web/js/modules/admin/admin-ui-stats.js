import { fetchAdminDashboardStats } from './admin-stats.js';

export async function renderStatsReal() {
    const stats = await fetchAdminDashboardStats();
    
    const activeEl = document.getElementById('stat-active-stores');
    const newReqEl = document.getElementById('stat-new-requests');
    const waitReqEl = document.getElementById('stat-waiting-requests');
    const salesEl = document.getElementById('stat-total-sales');

    if (activeEl) activeEl.innerText = stats.activeStores;
    if (newReqEl) newReqEl.innerText = stats.newRequests;
    if (waitReqEl) waitReqEl.innerText = stats.pendingRequests;
    
    if (salesEl) {
        salesEl.innerText = stats.totalSales.toLocaleString('ar-DZ') + ' د.ج';
    }
}

// Replace the legacy function globally
window.renderStats = renderStatsReal;

export function initStatsRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('stores', () => {
            renderStatsReal();
        });
        window.zaloRealtime.subscribeToTable('merchant_requests', () => {
            renderStatsReal();
        });
    }
}
renderStatsReal();
