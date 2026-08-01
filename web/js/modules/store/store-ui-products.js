import { fetchStoreProducts } from './store-products.js';

export async function renderMerchantProductsReal() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="col-span-full text-center p-8 text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل المنتجات...</div>';
    
    const products = await fetchStoreProducts();
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full bg-white p-8 rounded-xl shadow text-center flex flex-col items-center justify-center min-h-[300px]">
                <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <i class="fa-solid fa-box-open text-3xl text-slate-300"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-700 mb-2">لا توجد منتجات بعد</h3>
                <p class="text-slate-500 max-w-md mx-auto mb-6">قم بإضافة أول منتج لمتجرك وابدأ في البيع مباشرة. يمكنك إضافة الصور، السعر، والوصف بكل سهولة.</p>
                <button onclick="window.openAddProductModal()" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-200">
                    <i class="fa-solid fa-plus ml-2"></i> أضف منتجك الأول
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = "bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition group flex flex-col relative";
        
        div.innerHTML = `
            <div class="relative w-full h-48 bg-slate-50 rounded-lg mb-4 overflow-hidden">
                <img src="${p.image_url || 'https://via.placeholder.com/400'}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                <div class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1">
                    <i class="fa-solid fa-tag text-indigo-500"></i> ${p.category || 'غير محدد'}
                </div>
                <div class="absolute top-2 left-2 px-2 py-1 bg-green-100/90 text-green-700 rounded-md text-xs font-bold shadow-sm backdrop-blur-sm">
                    ${p.stock_quantity > 0 ? 'متوفر' : 'غير متوفر'}
                </div>
            </div>
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="font-bold text-slate-800 text-lg mb-1 line-clamp-1">${p.name}</h3>
                    <p class="text-emerald-600 font-bold text-lg">${p.price} د.ج</p>
                </div>
            </div>
            <p class="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">${p.description || 'لا يوجد وصف'}</p>
            <div class="flex gap-2 mt-auto pt-4 border-t border-slate-50">
                <button onclick="window.editProductReal('${p.id}')" class="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold transition text-sm">
                    <i class="fa-solid fa-pen-to-square mr-1"></i> تعديل
                </button>
                <button onclick="window.deleteProductReal('${p.id}')" class="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition text-sm">
                    <i class="fa-solid fa-trash-can mr-1"></i> حذف
                </button>
            </div>
        `;
        grid.appendChild(div);
    });
}

window.renderMerchantProducts = renderMerchantProductsReal;

export function initStoreProductsRealtime() {
    if (window.zaloRealtime) {
        window.zaloRealtime.subscribeToTable('products', () => {
            renderMerchantProductsReal();
        });
    }
}

// Call on load
renderMerchantProductsReal();

window.merchantAddProductReal = async function(e) {
    e.preventDefault();
    if (!window.supabase) return;
    
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session?.user) throw new Error("لا توجد جلسة صالحة");
        
        let { data: store } = await window.supabase
            .from('stores')
            .select('id, name')
            .eq('merchant_id', session.user.id)
            .maybeSingle();
            
        if (!store && session.user.email) {
            const { data: storeByEmail } = await window.supabase
                .from('stores')
                .select('id, name')
                .or(`merchant_email.eq.${session.user.email},email.eq.${session.user.email}`)
                .maybeSingle();
            if (storeByEmail) {
                store = storeByEmail;
                window.supabase.from('stores').update({ merchant_id: session.user.id }).eq('id', store.id).then();
            }
        }

        if (!store) {
            const storeName = session.user.user_metadata?.store_name || session.user.email?.split('@')[0] || 'متجر معتمد';
            const { data: newStore } = await window.supabase
                .from('stores')
                .upsert({
                    merchant_id: session.user.id,
                    name: storeName,
                    merchant_email: session.user.email,
                    status: 'approved',
                    is_verified: true
                })
                .select('id, name')
                .maybeSingle();
            store = newStore || { id: session.user.id, name: storeName };
        }
        
        const name = document.getElementById('prod-name')?.value || 'منتج جديد';
        const price = document.getElementById('prod-price')?.value || 0;
        const category = document.getElementById('prod-category')?.value || 'أخرى';
        const desc = document.getElementById('prod-desc')?.value || '';
        
        // Add loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';
        }
        
        const { error } = await window.supabase
            .from('products')
            .insert({
                store_id: store.id,
                name: name,
                price: parseFloat(price),
                category: category,
                description: desc,
                stock_quantity: 1, // default
                image_url: window.uploadedAnglesPreview?.[0] || 'https://via.placeholder.com/400'
            });
            
        if (error) throw error;
        
        if (typeof Swal !== 'undefined') Swal.fire('نجاح', 'تمت إضافة المنتج بنجاح', 'success');
        else alert('تم الإضافة بنجاح');
        
        // Hide modal
        document.getElementById('add-product-modal')?.classList.add('hidden');
        e.target.reset();
        
        // Clear previews
        if (window.uploadedAnglesPreview) window.uploadedAnglesPreview = [];
        const prevCont = document.getElementById('angles-preview');
        if (prevCont) prevCont.innerHTML = '';
        
        renderMerchantProductsReal();
        
    } catch (err) {
        console.error("Error adding product:", err);
        if (window.zaloErrorHandler) window.zaloErrorHandler.showError(err.message || "فشل في إضافة المنتج");
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-check ml-2"></i> إضافة المنتج للحساب';
        }
    }
}

// Replace the legacy function
window.merchantAddProduct = window.merchantAddProductReal;

window.deleteProductReal = async function(id) {
    if (confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) {
        try {
            const { error } = await window.supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            if (typeof Swal !== 'undefined') Swal.fire('تم', 'تم الحذف بنجاح', 'success');
            else alert('تم الحذف');
            renderMerchantProductsReal();
        } catch (e) {
            console.error(e);
            if (window.zaloErrorHandler) window.zaloErrorHandler.showError("فشل الحذف");
        }
    }
}

window.editProductReal = async function(id) {
    alert("ميزة التعديل ستتوفر قريباً في الإصدار القادم.");
}
