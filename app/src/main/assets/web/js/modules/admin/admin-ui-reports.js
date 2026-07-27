import { fetchAdminReports } from './admin-reports.js';

export async function renderFinancialReportsReal() {
    const tbody = document.getElementById('global-reports-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل التقارير...</td></tr>';
    
    const orders = await fetchAdminReports();
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-500">لا توجد حركات مالية مسجلة</td></tr>';
        return;
    }
    
    let totalSales = 0;
    tbody.innerHTML = '';
    
    orders.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
        
        let statusBadge = '';
        if (o.status === 'pending') statusBadge = '<span class="text-amber-500 font-bold">قيد الانتظار</span>';
        else if (o.status === 'delivered') statusBadge = '<span class="text-green-500 font-bold">مكتمل</span>';
        else if (o.status === 'cancelled') statusBadge = '<span class="text-red-500 font-bold">ملغى</span>';
        else statusBadge = `<span class="text-slate-500 font-bold">${o.status}</span>`;
        
        const storeName = o.stores?.store_name || o.stores?.name || 'متجر غير معروف';
        
        tr.innerHTML = `
            <td class="p-4 text-slate-500">#${o.id.substring(0,8).toUpperCase()}</td>
            <td class="p-4">${new Date(o.created_at).toLocaleDateString('ar-DZ')}</td>
            <td class="p-4 font-bold text-indigo-700">${storeName}</td>
            <td class="p-4 font-bold text-emerald-600">${o.total_amount} د.ج</td>
            <td class="p-4">${(o.total_amount * 0.05).toFixed(2)} د.ج</td> <!-- 5% fee assumption -->
            <td class="p-4">${statusBadge}</td>
        `;
        tbody.appendChild(tr);
        
        if (o.status === 'delivered') totalSales += parseFloat(o.total_amount);
    });
    
    // Update summary headers
    const revEl = document.getElementById('report-total-revenue');
    const feeEl = document.getElementById('report-total-fees');
    if (revEl) revEl.innerText = totalSales.toLocaleString('ar-DZ') + ' د.ج';
    if (feeEl) feeEl.innerText = (totalSales * 0.05).toLocaleString('ar-DZ') + ' د.ج';
}

window.renderFinancialReports = renderFinancialReportsReal;

export function initReportsRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('orders', () => {
            renderFinancialReportsReal();
        });
    }
}

// Call on load
renderFinancialReportsReal();
