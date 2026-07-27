import { fetchMerchantRequests, approveMerchantRequest, rejectMerchantRequest } from './admin-requests.js';

export async function renderRegistrationsReal() {
    const tbody = document.getElementById('registrations-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل الطلبات...</td></tr>';

    const requests = await fetchMerchantRequests();
    
    if (requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500"><i class="fa-solid fa-inbox text-4xl mb-3 text-slate-300 block"></i>لا توجد طلبات تسجيل حالياً</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    
    requests.forEach(req => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
        
        let statusBadge = '';
        if (req.status === 'pending') statusBadge = '<span class="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold"><i class="fa-solid fa-clock mr-1"></i> قيد المراجعة</span>';
        else if (req.status === 'approved') statusBadge = '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold"><i class="fa-solid fa-check mr-1"></i> معتمد</span>';
        else if (req.status === 'rejected') statusBadge = '<span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold"><i class="fa-solid fa-xmark mr-1"></i> مرفوض</span>';
        else statusBadge = `<span class="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">${req.status}</span>`;

        let actionButtons = '';
        if (req.status === 'pending') {
            actionButtons = `
                <button onclick="window.approveMerchantReal('${req.id}')" class="text-green-500 hover:text-green-700 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition" title="قبول الطلب وتفعيل المتجر"><i class="fa-solid fa-check"></i></button>
                <button onclick="window.rejectMerchantReal('${req.id}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition" title="رفض الطلب"><i class="fa-solid fa-xmark"></i></button>
            `;
        } else {
            actionButtons = '<span class="text-slate-400 text-sm">مكتمل</span>';
        }

        tr.innerHTML = `
            <td class="p-4">
                <div class="font-bold text-slate-800">${req.store_name}</div>
                <div class="text-xs text-slate-500">${req.store_type || 'غير محدد'}</div>
            </td>
            <td class="p-4">
                <div>${req.email || '-'}</div>
                <div class="text-xs text-slate-500" dir="ltr">${req.phone || '-'}</div>
            </td>
            <td class="p-4 font-bold text-indigo-600">${req.wilaya || '-'}</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 flex gap-2 justify-center">${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.approveMerchantReal = async function(id) {
    if (confirm("هل أنت متأكد من قبول هذا التاجر؟ سيتم تفعيل متجره فوراً بناءً على نظام Triggers.")) {
        const success = await approveMerchantRequest(id);
        if (success) {
            if (typeof Swal !== 'undefined') Swal.fire('تم!', 'تم قبول التاجر بنجاح.', 'success');
            else alert("تم قبول التاجر بنجاح");
            renderRegistrationsReal();
        }
    }
};

window.rejectMerchantReal = async function(id) {
    if (confirm("هل أنت متأكد من رفض طلب هذا التاجر؟")) {
        const success = await rejectMerchantRequest(id);
        if (success) {
            if (typeof Swal !== 'undefined') Swal.fire('مرفوض', 'تم رفض طلب التاجر.', 'info');
            else alert("تم رفض طلب التاجر.");
            renderRegistrationsReal();
        }
    }
};

// Make it globally available so the HTML buttons can call it or replace the old one
window.renderRegistrations = renderRegistrationsReal;

export function initRequestsRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('merchant_requests', (payload) => {
            console.log("Realtime update for merchant_requests received!", payload);
            renderRegistrationsReal();
        });
    }
}
renderRegistrationsReal();
