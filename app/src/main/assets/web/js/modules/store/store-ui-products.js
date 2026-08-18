import { fetchStoreProducts } from './store-products.js';

// Video duration validator for instant posts/products (Max 20 seconds)
window.validateInstantVideo = function(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (!file.type.includes('video')) return;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        if (duration > 20.5) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'الفيديو أطول من المسموح! ⏱️',
                    text: `مدة الفيديو الحالي ${Math.round(duration)} ثانية. يرجى اختيار أو التقاط فيديو قصير لا يتعدى 20 ثانية كحد أقصى للعروض اللحظية.`,
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#ef4444'
                });
            } else {
                alert(`⚠️ مدة الفيديو ${Math.round(duration)} ثانية. الحد الأقصى المسموح به هو 20 ثانية للفيديو اللحظي!`);
            }
            input.value = '';
            const lbl = document.getElementById('video-upload-lbl');
            if (lbl) {
                lbl.innerText = '❌ الفيديو أطول من 20 ثا';
                lbl.className = 'text-red-500 font-bold';
            }
        } else {
            const lbl = document.getElementById('video-upload-lbl');
            if (lbl) {
                lbl.innerText = `✅ فيديو ممتاز (${Math.round(duration)} ثا)`;
                lbl.className = 'text-emerald-600 font-bold';
            }
        }
    };
};

export async function renderMerchantProductsReal() {
    const list = document.getElementById('merchant-product-list');
    const grid = document.getElementById('products-grid');
    if (!list && !grid) return;
    
    if (list) {
        list.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-400 font-bold text-xs"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل المنتجات...</td></tr>';
    }
    if (grid) {
        grid.innerHTML = '<div class="col-span-full text-center p-8 text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i> جاري تحميل المنتجات...</div>';
    }
    
    const products = await fetchStoreProducts();
    
    // Check merchant store status and publishing limit (max 3 products for trial/unverified)
    try {
        let storeId = localStorage.getItem('zalo_current_store_id') || 'default_store';
        const isPaused = localStorage.getItem('zalo_publishing_paused_' + storeId) === 'true';
        const isVerified = localStorage.getItem('zalo_merchant_verified_' + storeId) === 'true';
        
        const limitBanner = document.getElementById('merchant-publishing-limit-banner');
        if (limitBanner) {
            if (isPaused || (!isVerified && products.length >= 3)) {
                limitBanner.classList.remove('hidden');
                const textMsg = document.getElementById('publishing-limit-text');
                if (textMsg) {
                    textMsg.innerText = isPaused 
                        ? `⚠️ تم إيقاف نشر المنتجات مؤقتاً لمتجركم بواسطة الإدارة. يرجى استكمال الوثائق ودفع الاشتراك.`
                        : `⚠️ لقد وصلت للحد الأقصى للنشر التجريبي المباشر (${products.length}/3 منتجات). لاستكمال نشر بقية منتجاتك، يرجى تفعيل حساب المتجر المكتمل.`;
                }
            } else {
                limitBanner.classList.add('hidden');
            }
        }
    } catch(e) {}

    // Update table list
    if (list) {
        if (products.length === 0) {
            list.innerHTML = `
                <tr>
                    <td colspan="4" class="p-8 text-center text-slate-500">
                        <div class="flex flex-col items-center justify-center gap-2">
                            <i class="fa-solid fa-box-open text-3xl text-slate-300"></i>
                            <p class="font-black text-slate-700 text-xs">لا توجد سلع معروضة في متجرك حالياً</p>
                            <p class="text-[10px] text-slate-400">انشر أول سلعة من النموذج الجانبي لتظهر فوراً في المعرض وسوق الجزائر.</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            list.innerHTML = '';
            products.forEach(p => {
                let skuLabel = p.sku ? `<span class="text-[9px] text-slate-400 font-mono">الباركود: ${p.sku}</span>` : '';
                let catLabel = p.category ? `<span class="text-[9px] bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded font-bold">${p.category}${p.subcategory ? ' - ' + p.subcategory : ''}</span>` : '';
                let pImg = p.image_url || p.image || 'assets/icon-192.svg';
                if (pImg.startsWith('[')) {
                    try {
                        const imgs = JSON.parse(pImg);
                        if (Array.isArray(imgs) && imgs.length > 0) pImg = imgs[0];
                    } catch(e) {}
                }

                const item = document.createElement('tr');
                item.className = "border-b border-slate-100 hover:bg-slate-50 transition";
                item.innerHTML = `
                    <td class="p-3 text-right">
                        <div class="flex items-center gap-3">
                            <img src="${pImg}" class="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm" onerror="this.src='assets/icon-192.svg'">
                            <div>
                                <p class="font-black text-slate-800 text-xs">${p.productName || p.name}</p>
                                <div class="flex flex-wrap gap-1.5 mt-1 items-center">
                                    ${catLabel}
                                    ${skuLabel}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="p-3 text-right font-black text-slate-800 text-xs">${parseFloat(p.price || 0).toLocaleString()} دج</td>
                    <td class="p-3 text-right text-slate-600 font-bold text-xs">${p.stock || 0} قطعة</td>
                    <td class="p-3 text-center">
                        <div class="flex gap-1.5 justify-center">
                            <button class="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1" onclick="window.editProductReal ? window.editProductReal('${p.id || p.productId}') : null">
                                <i class="fa-solid fa-pen-to-square"></i> تعديل
                            </button>
                            <button class="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1" onclick="window.deleteProductReal ? window.deleteProductReal('${p.id || p.productId}') : (window.deleteMerchantProduct ? window.deleteMerchantProduct('${p.id || p.productId}') : null)">
                                <i class="fa-solid fa-trash-can"></i> حذف
                            </button>
                        </div>
                    </td>
                `;
                list.appendChild(item);
            });
        }
    }

    // Update cards grid if present
    if (grid) {
        if (products.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full bg-white p-8 rounded-xl shadow text-center flex flex-col items-center justify-center min-h-[250px]">
                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <i class="fa-solid fa-box-open text-2xl text-slate-300"></i>
                    </div>
                    <h3 class="text-base font-bold text-slate-700 mb-1">لا توجد منتجات بعد</h3>
                    <p class="text-xs text-slate-500 max-w-md mx-auto">قم بإضافة أول منتج لمتجرك وابدأ في البيع مباشرة.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = "bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition group flex flex-col relative";
            
            let displayImg = p.image_url || p.image || 'assets/icon-192.svg';
            if (displayImg.startsWith('[')) {
                try {
                    const imgs = JSON.parse(displayImg);
                    if (Array.isArray(imgs) && imgs.length > 0) displayImg = imgs[0];
                } catch(e) {}
            }

            div.innerHTML = `
                <div class="relative w-full h-44 bg-slate-50 rounded-lg mb-3 overflow-hidden">
                    <img src="${displayImg}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='assets/icon-192.svg'">
                    <div class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1">
                        <i class="fa-solid fa-tag text-indigo-500"></i> ${p.category || 'عام'}
                    </div>
                    <div class="absolute top-2 left-2 px-2 py-1 bg-green-100/90 text-green-700 rounded-md text-[10px] font-bold shadow-sm backdrop-blur-sm">
                        ${(p.stock !== undefined ? p.stock : 0) > 0 ? 'متوفر' : 'غير متوفر'}
                    </div>
                </div>
                <div class="flex justify-between items-start mb-1">
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm line-clamp-1">${p.name || p.productName}</h3>
                        <p class="text-emerald-600 font-black text-sm">${parseFloat(p.price || 0).toLocaleString()} د.ج</p>
                    </div>
                </div>
                <p class="text-xs text-slate-500 line-clamp-2 mb-3 flex-grow">${p.description || 'لا يوجد وصف'}</p>
                <div class="flex gap-2 mt-auto pt-3 border-t border-slate-50">
                    <button onclick="window.editProductReal('${p.id || p.productId}')" class="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold transition text-xs">
                        <i class="fa-solid fa-pen-to-square mr-1"></i> تعديل
                    </button>
                    <button onclick="window.deleteProductReal('${p.id || p.productId}')" class="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition text-xs">
                        <i class="fa-solid fa-trash-can mr-1"></i> حذف
                    </button>
                </div>
            `;
            grid.appendChild(div);
        });
    }
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
        
        // Enforce product publishing limit (3 products max for trial/unverified, or if paused by admin)
        const existingProds = await fetchStoreProducts();
        const isPaused = localStorage.getItem('zalo_publishing_paused_' + store.id) === 'true';
        const isVerified = localStorage.getItem('zalo_merchant_verified_' + store.id) === 'true' || store.is_verified === true;

        if (isPaused || (!isVerified && existingProds.length >= 3)) {
            const msgTitle = isPaused ? 'النشر موقوف من قبل الإدارة! 🛑' : 'تم الوصول للحد الأقصى للنشر التجريبي (3 منتجات)! ⚠️';
            const msgBody = isPaused 
                ? 'تم إيقاف نشر المعروضات مؤقتاً لمتجركم. يرجى التواصل مع الإدارة عبر الواتساب لتأكيد الوثائق والاشتراك.'
                : 'لقد استوفيت الحد الأقصى المسموح به للنشر التجريبي (3 منتجات). لاستكمال رفع بقية معروضات متجرك، يرجى تقديم وثائق المحل ودفع الاشتراك.';

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: msgTitle,
                    html: `
                        <div class="text-right space-y-3">
                            <p class="text-xs text-slate-700 leading-relaxed font-bold">${msgBody}</p>
                            <div class="pt-2 text-center">
                                <a href="https://wa.me/213658000000?text=${encodeURIComponent('مرحباً إدارة ZaLo، أود استكمال وثائق متجر ' + (store.name || '') + ' ودفع الاشتراك لتفعيل النشر المباشر.')}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-md">
                                    <i class="fa-brands fa-whatsapp text-sm"></i>
                                    <span>تواصل عبر الواتساب للتفعيل والوثائق 💬</span>
                                </a>
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#10b981'
                });
            } else {
                alert(`${msgTitle}\n${msgBody}`);
            }
            return;
        }

        const name = document.getElementById('prod-name')?.value || 'منتج جديد';
        const price = parseFloat(document.getElementById('prod-price')?.value || 0);
        const stock = parseInt(document.getElementById('prod-stock')?.value || 1);
        const sku = document.getElementById('prod-sku')?.value || ('SKU-' + Math.floor(1000 + Math.random() * 9000));
        const weight = parseFloat(document.getElementById('prod-weight')?.value || 0.1);
        const minOrder = parseInt(document.getElementById('prod-min-order')?.value || 1);
        const category = document.getElementById('prod-main-category')?.value || document.getElementById('prod-category')?.value || 'أخرى';
        const subcategory = document.getElementById('prod-sub-category')?.value || '';
        const desc = document.getElementById('prod-desc')?.value || '';
        
        // Add loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';
        }

        const imgUrl = (window.uploadedAnglesPreview && window.uploadedAnglesPreview.length > 0) 
            ? (window.uploadedAnglesPreview.length === 1 ? window.uploadedAnglesPreview[0] : JSON.stringify(window.uploadedAnglesPreview))
            : 'assets/icon-192.svg';

        const pId = 'p_' + Date.now();
        
        // Try inserting/updating to Supabase products table
        try {
            const productData = {
                name: name,
                price: price,
                category: category,
                subcategory: subcategory,
                description: desc,
                stock: stock,
                sku: sku,
                weight: weight,
                min_order: minOrder,
                image_url: imgUrl,
                status: 'active'
            };

            if (window.editingProductId) {
                const { error } = await window.supabase
                    .from('products')
                    .update(productData)
                    .eq('id', window.editingProductId);
                if (error) throw error;
            } else {
                const { error } = await window.supabase
                    .from('products')
                    .insert({
                        id: pId,
                        store_id: store.id,
                        ...productData
                    });
                if (error) throw error;
            }
        } catch(sbErr) {
            console.warn("Supabase sync error (offline/local fallback used):", sbErr);
        }

        // Also save to LocalStorage for instant UI refresh
        try {
            const localProducts = JSON.parse(localStorage.getItem('zalo_products') || '[]');
            if (window.editingProductId) {
                const idx = localProducts.findIndex(p => String(p.id) === String(window.editingProductId));
                if (idx >= 0) {
                    localProducts[idx] = { ...localProducts[idx], productName: name, name, price, stock, category, subcategory, description: desc, sku, weight, minOrder, image: imgUrl, image_url: imgUrl };
                }
            } else {
                localProducts.push({
                    productId: pId,
                    id: pId,
                    productName: name,
                    name: name,
                    price: price,
                    stock: stock,
                    category: category,
                    subcategory: subcategory,
                    description: desc,
                    sku: sku,
                    weight: weight,
                    minOrder: minOrder,
                    storeId: store.id,
                    storeName: store.name || 'متجري',
                    image: imgUrl,
                    image_url: imgUrl,
                    status: 'active'
                });
            }
            localStorage.setItem('zalo_products', JSON.stringify(localProducts));
        } catch(locErr) {
            console.warn("LocalStorage save error:", locErr);
        }
        
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: window.editingProductId ? 'تم تعديل السلعة بنجاح! ✏️' : 'تمت إضافة السلعة بنجاح! 🚀',
                text: window.editingProductId ? `تم تحديث "${name}" بنجاح` : `تم نشر "${name}" في متجرك وأصبحت متاحة للزبائن`,
                confirmButtonColor: '#10b981',
                confirmButtonText: 'ممتاز'
            });
        } else {
            alert(window.editingProductId ? 'تم التعديل بنجاح!' : 'تمت إضافة السلعة بنجاح! 🚀');
        }
        
        // Hide modal if open
        document.getElementById('add-product-modal')?.classList.add('hidden');
        e.target.reset();
        window.editingProductId = null; // Clear editing mode
        
        // Reset SKU with new random number
        const skuInput = document.getElementById('prod-sku');
        if (skuInput) skuInput.value = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
        
        // Reset previews
        if (window.uploadedAnglesPreview) window.uploadedAnglesPreview = [];
        const prevCont = document.getElementById('angles-preview');
        if (prevCont) prevCont.innerHTML = '';
        const anglesLbl = document.getElementById('angles-upload-lbl');
        if (anglesLbl) {
            anglesLbl.innerText = "اضغط لرفع صور (0)";
            anglesLbl.className = "text-sky-500 font-bold";
        }
        
        if (typeof renderMerchantProductsReal === 'function') {
            renderMerchantProductsReal();
        }
        if (typeof renderMerchantProducts === 'function' && renderMerchantProducts !== renderMerchantProductsReal) {
            renderMerchantProducts();
        }
        if (typeof updateCounters === 'function') {
            updateCounters();
        }
        
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
    const products = await fetchStoreProducts();
    const p = products.find(prod => String(prod.id) === String(id));
    if (!p) return;

    if(document.getElementById('prod-name')) document.getElementById('prod-name').value = p.name || '';
    if(document.getElementById('prod-price')) document.getElementById('prod-price').value = p.price || 0;
    if(document.getElementById('prod-stock')) document.getElementById('prod-stock').value = p.stock || p.stock_quantity || 0;
    if(document.getElementById('prod-sku')) document.getElementById('prod-sku').value = p.sku || '';
    if(document.getElementById('prod-weight')) document.getElementById('prod-weight').value = p.weight || 0.1;
    if(document.getElementById('prod-min-order')) document.getElementById('prod-min-order').value = p.min_order || p.minOrder || 1;
    if(document.getElementById('prod-desc')) document.getElementById('prod-desc').value = p.description || '';
    
    if (document.getElementById('prod-main-category')) {
        document.getElementById('prod-main-category').value = p.category || 'أخرى';
    } else if (document.getElementById('prod-category')) {
        document.getElementById('prod-category').value = p.category || 'أخرى';
    }

    // Set editing mode
    window.editingProductId = id;
    
    // Support unified form or old modal
    const submitBtn = document.querySelector('#add-product-modal form button[type="submit"]') || document.querySelector('#merchant-unified-form button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-save ml-2"></i> حفظ تعديلات العرض والمنتج';

    // Scroll to form if on dashboard
    if(document.getElementById('merchant-unified-form')) {
        document.getElementById('merchant-unified-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if(typeof window.openAddProductModal === 'function') {
        window.openAddProductModal();
    }
}

// Reset editing mode when modal is opened manually
const originalOpenAddProductModal = window.openAddProductModal;
window.openAddProductModal = function() {
    if (!window.editingProductId) {
        const form = document.querySelector('#add-product-modal form');
        if (form) form.reset();
        const submitBtn = document.querySelector('#add-product-modal form button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-check ml-2"></i> إضافة المنتج للحساب';
    }
    if (typeof originalOpenAddProductModal === 'function') originalOpenAddProductModal();
    else document.getElementById('add-product-modal')?.classList.remove('hidden');
};
