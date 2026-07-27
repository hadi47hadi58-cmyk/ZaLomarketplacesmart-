import { fetchAllProducts } from './admin-products.js';

export async function renderGlobalProductsTableReal() {
    const tbody = document.getElementById('global-products-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل المنتجات...</td></tr>';
    
    const products = await fetchAllProducts();
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">لا توجد منتجات حالياً</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50";
        
        let storeName = p.stores?.store_name || p.stores?.name || p.store_id || 'متجر غير معروف';
        
        tr.innerHTML = `
            <td class="p-3">
                <div class="flex items-center gap-3">
                    <img src="${p.image_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded object-cover">
                    <div>
                        <div class="font-bold text-slate-700">${p.name}</div>
                        <div class="text-xs text-slate-500">${p.category || 'غير مصنف'}</div>
                    </div>
                </div>
            </td>
            <td class="p-3 text-slate-600 font-bold">${storeName}</td>
            <td class="p-3 text-emerald-600 font-bold">${p.price} د.ج</td>
            <td class="p-3">
                <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">نشط</span>
            </td>
            <td class="p-3 flex gap-2">
                <!-- Can add delete product action for admin here if needed -->
                <button class="text-slate-400 cursor-not-allowed" title="عرض فقط"><i class="fa-solid fa-eye"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Replace legacy function
window.renderGlobalProductsTable = renderGlobalProductsTableReal;

export function initProductsRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('products', () => {
            renderGlobalProductsTableReal();
        });
    }
}
renderGlobalProductsTableReal();
