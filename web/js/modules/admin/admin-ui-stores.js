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
            const tr = document.createElement('tr');
            tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
            tr.innerHTML = `
                <td class="p-4">
                    <div class="font-bold text-slate-800">${s.store_name || s.name || 'متجر غير مسمى'}</div>
                    <div class="text-xs text-slate-500">${s.store_type || 'غير محدد'}</div>
                </td>
                <td class="p-4 font-bold text-indigo-600">${s.wilaya || '-'}</td>
                <td class="p-4">
                    <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold"><i class="fa-solid fa-check-circle mr-1"></i> معتمد ومفعل</span>
                </td>
                <td class="p-4 flex gap-2">
                    <button onclick="window.suspendStoreReal('${s.id}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition" title="إيقاف المتجر مؤقتاً"><i class="fa-solid fa-ban"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

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
}

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
