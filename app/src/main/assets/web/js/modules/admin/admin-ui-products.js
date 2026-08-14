import { fetchAllProducts } from './admin-products.js';

export async function renderGlobalProductsTableReal() {
    const tbody = document.querySelector('#section-products-global #products-tbody') || document.getElementById('products-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل وفحص قاعدة المنتجات...</td></tr>';
    
    const products = await fetchAllProducts();
    const query = (document.getElementById('products-search-input')?.value || "").toLowerCase().trim();

    let orders = [];
    try {
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
    } catch(e){}

    products.forEach(p => {
        let completedMatches = orders.filter(o => 
            (o.productId === p.id || o.productName === (p.name || p.productName)) && 
            (o.status === "تم التسليم" || o.status === "DELIVERED")
        );
        p.computedSales = (p.sales_count || p.salesCount || 0) + completedMatches.length;
    });

    products.sort((a, b) => (b.computedSales || 0) - (a.computedSales || 0));

    let filtered = products.filter(p => {
        if (!query) return true;
        const name = (p.name || p.productName || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();
        const store = (p.storeName || p.store_name || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        return name.includes(query) || sku.includes(query) || store.includes(query) || cat.includes(query);
    });

    const summaryEl = document.getElementById('products-stats-summary');
    if (summaryEl) {
        summaryEl.innerText = `إجمالي المعروضات: ${products.length} سلعة | المعروض: ${filtered.length}`;
    }

    const statCountEl = document.getElementById('stat-total-products');
    if (statCountEl) {
        statCountEl.innerText = products.length;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-slate-400 font-bold">لا توجد منتجات مطابقة لعملية البحث</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    filtered.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.className = "border-t border-slate-100 hover:bg-slate-50 transition";
        
        let rankClass = "bg-slate-100 text-slate-700";
        if (index === 0) rankClass = "bg-amber-100 text-amber-800 border border-amber-300 ring-2 ring-amber-200";
        else if (index === 1) rankClass = "bg-slate-200 text-slate-800 border border-slate-300";
        else if (index === 2) rankClass = "bg-orange-50 text-orange-700 border border-orange-200";

        let buyerName = "لا يوجد زبائن بعد";
        let matchedOrders = orders.filter(o => o.productId === p.id || o.productName === (p.name || p.productName));
        if (matchedOrders.length > 0) {
            buyerName = matchedOrders[matchedOrders.length - 1].customerName || "زبون المنصة";
        }

        const storeName = p.storeName || p.store_name || 'متجر زالو شريك';
        const priceFormatted = parseFloat(p.price || 0).toLocaleString();
        const pName = p.name || p.productName || 'منتج';
        const imgSrc = p.image_url || p.img || 'assets/icon-192.svg';

        tr.innerHTML = `
            <td class="p-3 text-center">
                <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${rankClass}">
                    ${index + 1}
                </span>
            </td>
            <td class="p-3">
                <div class="flex items-center gap-3">
                    <img src="${imgSrc}" class="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm" onerror="this.src='assets/icon-192.svg'">
                    <div class="flex flex-col text-right">
                        <span class="font-black text-slate-800 text-xs">${pName}</span>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[10px] text-slate-400 font-bold">${p.category || 'عام'}</span>
                            <span class="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">المخزون: ${p.stock || 0}</span>
                        </div>
                    </div>
                </div>
            </td>
            <td class="p-3 text-center">
                <p class="font-black text-slate-800 text-xs">${priceFormatted} دج</p>
                <p class="text-[10px] text-slate-400 font-mono font-normal">SKU: ${p.sku || 'ZL-PRD-' + p.id}</p>
            </td>
            <td class="p-3 text-center text-[#d4af37] font-black text-xs">
                <span class="px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200 inline-block">${storeName}</span>
            </td>
            <td class="p-3 text-center">
                <span class="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-emerald-100">
                    ${p.computedSales || 0} مبيعات 📦
                </span>
            </td>
            <td class="p-3 text-center text-slate-600 text-xs font-bold">${buyerName}</td>
            <td class="p-3 text-center">
                <button onclick="window.deleteGlobalProductReal('${p.id}')" class="bg-red-50 text-red-500 hover:bg-red-600 hover:text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl border border-red-100 transition shadow-sm flex items-center gap-1 mx-auto">
                    <i class="fa-solid fa-trash-can"></i>
                    <span>حذف 🗑️</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteGlobalProductReal = async function(productId) {
    if (confirm("هل أنت متأكد من رغبتك بحذف هذا المنتج نهائياً من العرض العام بالمنصة؟")) {
        try {
            if (window.supabase) {
                await window.supabase.from('products').delete().eq('id', productId);
            }
        } catch(e){}

        try {
            let products = JSON.parse(localStorage.getItem('products') || '[]');
            products = products.filter(p => p.id != productId && p.productId != productId);
            localStorage.setItem('products', JSON.stringify(products));
        } catch(e){}

        if (typeof Swal !== 'undefined') Swal.fire('تم الحذف', 'تم حذف المنتج بنجاح من قاعدة البيانات.', 'success');
        else alert("تم حذف المنتج بنجاح");

        renderGlobalProductsTableReal();
    }
};

// Global bindings
window.renderGlobalProductsTable = renderGlobalProductsTableReal;
window.deleteGlobalProduct = window.deleteGlobalProductReal;

export function initProductsRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('products', () => {
            renderGlobalProductsTableReal();
        });
    }
}

// Initial render
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderGlobalProductsTableReal);
} else {
    renderGlobalProductsTableReal();
}

