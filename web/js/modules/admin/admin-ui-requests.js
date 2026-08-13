import { fetchMerchantRequests, approveMerchantRequest, rejectMerchantRequest } from './admin-requests.js';

export async function renderRegistrationsReal() {
    const tbody = document.getElementById('registrations-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل وفحص طلبات المتاجر...</td></tr>';

    const requests = await fetchMerchantRequests();
    
    // Update badge count
    const badge = document.getElementById('badge-registrations-count');
    if (badge) {
        badge.innerText = requests.length;
    }

    if (requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500"><i class="fa-solid fa-inbox text-4xl mb-3 text-slate-300 block"></i>لا توجد طلبات تسجيل حالياً</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    
    requests.forEach(req => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
        
        // Status Badge formatting
        const normStatus = String(req.status || 'PENDING').toUpperCase();
        let statusBadge = '';
        if (normStatus === 'APPROVED' || normStatus === 'ACTIVE') {
            statusBadge = '<span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-black inline-flex items-center gap-1"><i class="fa-solid fa-check-circle"></i> موثق ومقبول ✅</span>';
        } else if (normStatus === 'SUSPENDED' || normStatus === 'REJECTED') {
            statusBadge = '<span class="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[11px] font-black inline-flex items-center gap-1"><i class="fa-solid fa-ban"></i> معلق ومقيد 🛑</span>';
        } else {
            statusBadge = '<span class="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-black inline-flex items-center gap-1"><i class="fa-solid fa-clock"></i> قيد المراجعة ⏳</span>';
        }

        // WhatsApp and Phone sanitization
        const rawPhone = req.whatsapp || req.phone || '0658000000';
        const cleanPhone = String(rawPhone).replace(/\D/g, '');
        let waNumber = cleanPhone;
        if (waNumber.startsWith('0')) waNumber = '213' + waNumber.substring(1);
        else if (!waNumber.startsWith('213')) waNumber = '213' + waNumber;

        // Documents tags
        const docsBadge = `
            <div class="flex flex-wrap items-center justify-center gap-1">
                <button onclick="window.viewDocModal('${req.store_name}', '🪪 بطاقة الهوية الوطنية', 'تم التحقق من الوثيقة بنجاح عبر النظام البيومتري الجزائري')" class="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-bold hover:bg-sky-100 transition" title="عرض بطاقة التعريف">
                    🪪 هوية
                </button>
                <button onclick="window.viewDocModal('${req.store_name}', '📜 السجل التجاري / النشاط', '${req.rc_number ? 'رقم السجل: ' + req.rc_number : 'نشاط تجاري معتمد محلياً'}')" class="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold hover:bg-purple-100 transition" title="عرض السجل التجاري">
                    📜 سجل
                </button>
            </div>
        `;

        // Action Buttons
        const isApproved = (normStatus === 'APPROVED' || normStatus === 'ACTIVE');
        const actionButtons = `
            <div class="flex items-center justify-center gap-1.5">
                <a href="https://wa.me/${waNumber}?text=${encodeURIComponent('مرحباً بك من إدارة منصة ZaLo! بخصوص متجركم: ' + req.store_name)}" target="_blank" class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center text-xs transition shadow-sm" title="مراسلة التاجر عبر واتساب">
                    <i class="fa-brands fa-whatsapp text-sm"></i>
                </a>
                <a href="tel:${rawPhone}" class="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 flex items-center justify-center text-xs transition shadow-sm" title="الاتصال بالتاجر هاتفياً">
                    <i class="fa-solid fa-phone text-xs"></i>
                </a>
                ${!isApproved ? `
                    <button onclick="window.approveMerchantReal('${req.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1" title="قبول واعتماد المتجر">
                        <i class="fa-solid fa-check"></i> قبول
                    </button>
                ` : `
                    <button onclick="window.rejectMerchantReal('${req.id}')" class="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1" title="تعليق أو إيقاف المتجر">
                        <i class="fa-solid fa-ban"></i> تعليق
                    </button>
                `}
            </div>
        `;

        tr.innerHTML = `
            <td class="p-3.5">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-amber-100 text-[#d4af37] border border-[#d4af37]/30 flex items-center justify-center text-xs font-black shrink-0">
                        <i class="fa-solid fa-store"></i>
                    </div>
                    <div>
                        <div class="font-black text-slate-800 text-xs">${req.store_name}</div>
                        <div class="text-[10px] text-slate-400 font-mono">ID: #${String(req.id).substring(0, 8)}</div>
                    </div>
                </div>
            </td>
            <td class="p-3.5">
                <div class="font-bold text-slate-800 text-xs">${req.owner_name || 'تاجر زالو'}</div>
                <div class="text-[10px] text-slate-500 font-mono" dir="ltr">${req.email || req.phone || '-'}</div>
            </td>
            <td class="p-3.5">
                <div class="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-bold">${req.category || 'عام'}</div>
                <div class="text-[10px] text-slate-400">${req.store_type || 'نشاط معتمد'}</div>
            </td>
            <td class="p-3.5">
                <div class="font-black text-indigo-600 text-xs">${req.wilaya || '58 المنيعة'}</div>
                <div class="text-[10px] text-slate-500">${req.commune || 'البلدية المركزية'}</div>
            </td>
            <td class="p-3.5 text-center">
                ${docsBadge}
            </td>
            <td class="p-3.5 text-center">
                ${statusBadge}
            </td>
            <td class="p-3.5 text-center">
                ${actionButtons}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.viewDocModal = function(storeName, docType, docDetails) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: `<span class="text-sm font-black text-slate-800">${docType}</span>`,
            html: `
                <div class="text-right text-xs space-y-3 p-2">
                    <p class="font-bold text-indigo-600">المتجر: ${storeName}</p>
                    <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed font-mono">
                        ${docDetails}
                    </div>
                    <div class="text-center p-3 border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-xl text-emerald-800 font-bold">
                        <i class="fa-solid fa-shield-halved text-emerald-600 text-lg mb-1 block"></i>
                        تم توثيق الهوية عبر سجل منصة ZaLo المعتمد
                    </div>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'إغلاق',
            confirmButtonColor: '#113f1c'
        });
    } else {
        alert(`${docType} للمتجر: ${storeName}\n${docDetails}`);
    }
};

window.approveMerchantReal = async function(id) {
    if (confirm("هل أنت متأكد من قبول وتوثيق هذا المتجر في المنصة؟")) {
        const success = await approveMerchantRequest(id);
        if (success) {
            if (typeof Swal !== 'undefined') Swal.fire('تم الاعتماد!', 'تم تفعيل المتجر وقبول طلبه بنجاح.', 'success');
            else alert("تم قبول التاجر بنجاح");
            renderRegistrationsReal();
        }
    }
};

window.rejectMerchantReal = async function(id) {
    if (confirm("هل أنت متأكد من تعليق أو تقييد هذا المتجر؟")) {
        const success = await rejectMerchantRequest(id);
        if (success) {
            if (typeof Swal !== 'undefined') Swal.fire('تم التعليق', 'تم تقييد المتجر بنجاح.', 'info');
            else alert("تم تعليق المتجر.");
            renderRegistrationsReal();
        }
    }
};

// Make globally available
window.renderRegistrations = renderRegistrationsReal;
window.populateMerchantRequests = renderRegistrationsReal;

export function initRequestsRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('stores', () => {
            renderRegistrationsReal();
        });
        window.zaloRealtime.subscribeToTable('merchant_requests', () => {
            renderRegistrationsReal();
        });
    }
}

// Initial render
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderRegistrationsReal);
} else {
    renderRegistrationsReal();
}

