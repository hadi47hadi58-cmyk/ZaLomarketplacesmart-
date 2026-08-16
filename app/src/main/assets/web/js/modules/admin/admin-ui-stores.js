import { fetchActiveStores, suspendStore } from './admin-stores.js';

export async function openActiveStoresModalReal() {
    const modal = document.getElementById('active-stores-modal');
    const tbody = document.getElementById('modal-active-stores-tbody');
    
    if (modal) modal.classList.remove('hidden');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل المتاجر...</td></tr>';
        
        const stores = await fetchActiveStores();
        
        if (stores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">لا يوجد متاجر نشطة</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        stores.forEach(s => {
            const isPaused = localStorage.getItem('zalo_publishing_paused_' + s.id) === 'true' || s.publishing_paused === true;
            const phone = s.whatsapp || s.phone || '0658000000';
            const cleanPhone = String(phone).replace(/\D/g, '');
            let waNumber = cleanPhone;
            if (waNumber.startsWith('0')) waNumber = '213' + waNumber.substring(1);
            else if (!waNumber.startsWith('213')) waNumber = '213' + waNumber;

            const tr = document.createElement('tr');
            tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
            tr.innerHTML = `
                <td class="p-4">
                    <div class="font-bold text-slate-800">${s.store_name || s.name || 'متجر غير مسمى'}</div>
                    <div class="text-xs text-slate-500">${s.store_type || 'غير محدد'} • 📱 ${phone}</div>
                </td>
                <td class="p-4 font-bold text-indigo-600">${s.wilaya || '-'}</td>
                <td class="p-4">
                    ${isPaused ? 
                        '<span class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black inline-flex items-center gap-1"><i class="fa-solid fa-hand"></i> النشر موقوف (حد 3 منتجات)</span>' : 
                        '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black inline-flex items-center gap-1"><i class="fa-solid fa-check-circle"></i> معتمد ونشر مفتوح</span>'}
                </td>
                <td class="p-4 flex items-center gap-1.5 flex-wrap">
                    <button onclick="window.toggleStorePublishingReal('${s.id}', '${(s.store_name || s.name || 'المتجر').replace(/'/g, "\\'")}', ${isPaused})" class="${isPaused ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'} px-2.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1" title="${isPaused ? 'تفعيل النشر المباشر' : 'إيقاف/تقييد نشر السلع'}">
                        <i class="fa-solid ${isPaused ? 'fa-play' : 'fa-pause'}"></i>
                        <span>${isPaused ? 'تفعيل النشر' : 'إيقاف النشر'}</span>
                    </button>
                    <a href="https://wa.me/${waNumber}?text=${encodeURIComponent('مرحباً متجر ' + (s.store_name || s.name || '') + '، يرجى استكمال رفع وثائق المحل ودفع الاشتراك لتفعيل نشر المنتجات المباشر بأسواق الجزائر على منصة ZaLo.')}" target="_blank" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1" title="مراسلة التاجر عبر واتساب للتفعيل والوثائق">
                        <i class="fa-brands fa-whatsapp text-sm"></i>
                        <span>واتساب</span>
                    </a>
                    <button onclick="window.suspendStoreReal('${s.id}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition" title="إيقاف المتجر كلياً"><i class="fa-solid fa-ban"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

window.toggleStorePublishingReal = async function(storeId, storeName, isCurrentlyPaused) {
    const newPausedState = !isCurrentlyPaused;
    const actionName = newPausedState ? 'إيقاف نشر المنتجات وتقييده بـ 3 منتجات' : 'فتح وتفعيل النشر اللاحدودي';
    if (confirm(`هل أنت متأكد من ${actionName} لمتجر "${storeName}"؟`)) {
        try {
            localStorage.setItem('zalo_publishing_paused_' + storeId, newPausedState ? 'true' : 'false');
            if (window.supabase) {
                await window.supabase.from('stores').update({ publishing_paused: newPausedState }).eq('id', storeId);
            }
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'تم التحديث بنجاح 🚀',
                    text: `تم ${actionName} لمتجر "${storeName}"`,
                    confirmButtonText: 'ممتاز'
                });
            } else {
                alert(`تم ${actionName} لمتجر "${storeName}"`);
            }
            openActiveStoresModalReal();
        } catch (e) {
            console.error("Failed to toggle store publishing:", e);
        }
    }
};

window.suspendStoreReal = async function(id) {
    if (confirm("هل أنت متأكد من إيقاف هذا المتجر؟")) {
        const success = await suspendStore(id);
        if (success) {
            if (typeof Swal !== 'undefined') Swal.fire('تم', 'تم إيقاف المتجر بنجاح', 'success');
            else alert("تم الإيقاف");
            openActiveStoresModalReal();
            if (window.renderStats) window.renderStats(); // refresh stats
        } else {
            if (window.zaloErrorHandler) window.zaloErrorHandler.showError("فشل في إيقاف المتجر");
        }
    }
};

// Replace legacy function
window.openActiveStoresModal = openActiveStoresModalReal;

export function initStoresRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('stores', () => {
            if (!document.getElementById('active-stores-modal')?.classList.contains('hidden')) {
                openActiveStoresModalReal();
            }
        });
    }
}
