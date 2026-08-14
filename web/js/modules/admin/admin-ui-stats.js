import { fetchAdminDashboardStats } from './admin-stats.js';

export async function renderStatsReal() {
    const stats = await fetchAdminDashboardStats();
    
    const activeEl = document.getElementById('stat-active-stores');
    const pendingSecEl = document.getElementById('stat-pending-security');
    const waitReqEl = document.getElementById('stat-waiting-requests');
    const newReqEl = document.getElementById('stat-new-requests');
    const verifiedUsersEl = document.getElementById('stat-verified-users');
    const totalProdEl = document.getElementById('stat-total-products');
    const netProfitsEl = document.getElementById('stat-net-profits');
    const activeOrdersEl = document.getElementById('stat-active-orders');
    const ratingEl = document.getElementById('stat-platform-rating');
    const adminsCountEl = document.getElementById('stat-admins-count');
    const badgeRegEl = document.getElementById('badge-registrations-count');

    if (activeEl) activeEl.innerText = stats.activeStores;
    if (pendingSecEl) pendingSecEl.innerText = stats.pendingRequests;
    if (waitReqEl) waitReqEl.innerText = stats.pendingRequests;
    if (newReqEl) newReqEl.innerText = stats.pendingRequests;
    if (badgeRegEl) badgeRegEl.innerText = stats.pendingRequests;
    
    if (verifiedUsersEl) verifiedUsersEl.innerText = stats.verifiedUsers + " عميل";
    if (totalProdEl) totalProdEl.innerText = stats.totalProducts;
    if (netProfitsEl) netProfitsEl.innerText = stats.netProfits.toLocaleString('ar-DZ') + ' دج';
    if (activeOrdersEl) activeOrdersEl.innerText = stats.activeOrders + ' طلبات';
    if (ratingEl) ratingEl.innerText = stats.rating || "5.0 / 5.0 ★";
    if (adminsCountEl) adminsCountEl.innerText = (stats.adminsCount || 1) + " مشرفين";
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
        window.zaloRealtime.subscribeToTable('products', () => {
            renderStatsReal();
        });
    }
}
renderStatsReal();

