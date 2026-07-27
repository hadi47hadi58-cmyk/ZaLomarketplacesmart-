import { fetchStoreOrders } from './store-orders.js';

export async function renderMerchantOrdersReal() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل الطلبات...</td></tr>';
    
    const orders = await fetchStoreOrders();
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-500">لا توجد طلبات حتى الآن</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    orders.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
        
        let statusBadge = '';
        if (o.status === 'pending') statusBadge = '<span class="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">قيد الانتظار</span>';
        else if (o.status === 'confirmed') statusBadge = '<span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">مؤكد - جاري التجهيز</span>';
        else if (o.status === 'shipped') statusBadge = '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">تم الشحن</span>';
        else if (o.status === 'delivered') statusBadge = '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">مكتمل</span>';
        else if (o.status === 'cancelled') statusBadge = '<span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">ملغى</span>';
        else statusBadge = `<span class="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">${o.status}</span>`;

        let customerName = o.profiles?.full_name || o.profiles?.name || 'زبون (زائر)';
        let customerPhone = o.profiles?.phone || o.phone || '-';
        let itemsCount = typeof o.items === 'string' ? JSON.parse(o.items).length : (o.items?.length || 0);

        tr.innerHTML = `
            <td class="p-4 font-bold text-slate-700">#${o.id.substring(0, 8).toUpperCase()}</td>
            <td class="p-4 text-slate-600">${new Date(o.created_at).toLocaleDateString('ar-DZ')}</td>
            <td class="p-4">
                <div class="font-bold text-slate-800">${customerName}</div>
                <div class="text-xs text-slate-500" dir="ltr">${customerPhone}</div>
            </td>
            <td class="p-4 font-bold text-indigo-600 text-center">${itemsCount}</td>
            <td class="p-4 font-bold text-emerald-600 text-center">${o.total_amount} د.ج</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-center">
                <button onclick="window.viewOrderDetailsReal('${o.id}')" class="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition" title="عرض التفاصيل">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.renderMerchantOrders = renderMerchantOrdersReal;

export function initStoreOrdersRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('orders', () => {
            renderMerchantOrdersReal();
        });
    }
}

// Call on load
renderMerchantOrdersReal();
