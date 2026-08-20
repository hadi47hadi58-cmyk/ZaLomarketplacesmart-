import { addProductToSupabase, addStoryToSupabase } from './dashboard-store-supabase.js';
import { deleteProductFromSupabase, deleteStoryFromSupabase } from './dashboard-store-supabase-del.js';

window.unifiedMediaData = { type: 'none', url: '', isVideo: false };

window.previewUnifiedImg = function(input) {
    if (!input.files || input.files.length === 0) return;
    window.unifiedMediaData = { type: 'images', urls: [], isVideo: false };
    
    let loadedCount = 0;
    const totalFiles = input.files.length;
    
    for (let i = 0; i < totalFiles; i++) {
        const reader = new FileReader();
        reader.onload = function(e) {
            window.unifiedMediaData.urls.push(e.target.result);
            loadedCount++;
            
            if (loadedCount === totalFiles) {
                const lbl = document.getElementById('unified-img-lbl');
                const imgPrev = document.getElementById('unified-img-preview');
                const vidPrev = document.getElementById('unified-vid-preview');
                if (lbl) {
                    lbl.innerText = `✅ تم تحديد ${totalFiles} صور`;
                    lbl.className = 'text-xs text-emerald-600 font-black';
                }
                if (imgPrev) {
                    imgPrev.src = window.unifiedMediaData.urls[0];
                    imgPrev.classList.remove('hidden');
                }
                if (vidPrev) {
                    vidPrev.classList.add('hidden');
                }
            }
        };
        reader.readAsDataURL(input.files[i]);
    }
};

window.validateAndPreviewUnifiedVid = function(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    // Create temporary video element to validate duration (max 20 seconds)
    const tempVid = document.createElement('video');
    tempVid.preload = 'metadata';
    tempVid.onloadedmetadata = function() {
        window.URL.revokeObjectURL(tempVid.src);
        if (tempVid.duration > 20.5) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'مدة الفيديو تتجاوز 20 ثانية! ⏱️',
                    text: `مدة الفيديو المختار ${Math.round(tempVid.duration)} ثانية. يرجى اختيار مقطع فيديو لا يتجاوز 20 ثانية للبث المباشر والقصص اللحظية.`,
                    confirmButtonText: 'حسناً'
                });
            } else {
                alert(`مدة الفيديو المختار ${Math.round(tempVid.duration)} ثانية. الحد الأقصى المسموح به هو 20 ثانية للبث اللحظي!`);
            }
            input.value = '';
            return;
        }

        // Read video DataURL
        const reader = new FileReader();
        reader.onload = function(e) {
            window.unifiedMediaData = { type: 'video', url: e.target.result, isVideo: true };
            const vidLbl = document.getElementById('unified-vid-lbl');
            const vidPrev = document.getElementById('unified-vid-preview');
            const imgPrev = document.getElementById('unified-img-preview');
            if (vidLbl) {
                vidLbl.innerText = `✅ فيديو (${Math.round(tempVid.duration)}ثا)`;
                vidLbl.className = 'text-xs text-emerald-600 font-black';
            }
            if (vidPrev) {
                vidPrev.src = e.target.result;
                vidPrev.classList.remove('hidden');
            }
            if (imgPrev) {
                imgPrev.classList.add('hidden');
            }
            const imgLbl = document.getElementById('unified-img-lbl');
            if (imgLbl) {
                imgLbl.innerText = 'اختيار صورة';
                imgLbl.className = 'text-xs text-sky-600 font-bold flex flex-col items-center gap-1';
            }
        };
        reader.readAsDataURL(file);
    };
    tempVid.src = URL.createObjectURL(file);
};

window.merchantUnifiedAddProduct = async function(e) {
  window.addProductToSupabase = addProductToSupabase;
  window.addStoryToSupabase = addStoryToSupabase;
    if (e) e.preventDefault();
    
    let storeId = localStorage.getItem('zalo_current_store_id') || localStorage.getItem('zalo_uid') || 'default_store';
    const isPaused = localStorage.getItem('zalo_publishing_paused_' + storeId) === 'true';
    const isVerified = localStorage.getItem('zalo_merchant_verified_' + storeId) === 'true';
    
    let existingProducts = [];
    try {
        existingProducts = JSON.parse(localStorage.getItem('zalo_products') || '[]');
    } catch(e) {}
    
    let existingStories = [];
    try {
        existingStories = JSON.parse(localStorage.getItem('zalo_live_stories') || '[]');
    } catch(e) {}

    // Check 3 to 5 products limit for unverified merchants or if paused
    if (isPaused || (!isVerified && (existingProducts.length >= 5 || existingStories.length >= 5))) {
        const msgTitle = isPaused ? 'النشر موقوف من قبل الإدارة! 🛑' : 'تم الوصول لحد النشر التجريبي (5 معروضات)! ⚠️';
        const limitBanner = document.getElementById('merchant-publishing-limit-banner');
        if (limitBanner) limitBanner.classList.remove('hidden');

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: msgTitle,
                html: `
                    <div class="text-right space-y-3">
                        <p class="text-xs text-slate-700 font-bold leading-relaxed">
                            لقد استوفيت باقة التجربة المجانية (5 معروضات). لاستكمال نشر باقي السلع وتفعيل القصص والبث المباشر اللاحدودي، يرجى استكمال وثائق محلك ودفع اشتراك التاجر.
                        </p>
                        <div class="pt-2 text-center">
                            <a href="https://wa.me/213658000000?text=${encodeURIComponent('مرحباً إدارة ZaLo، أود استكمال وثائق المتجر ودفع الاشتراك لفتح النشر المباشر اللاحدودي.')}" target="_blank" class="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition">
                                <i class="fa-brands fa-whatsapp text-sm"></i>
                                <span>تواصل عبر الواتساب لتفعيل الاشتراك الآن 💬</span>
                            </a>
                        </div>
                    </div>
                `,
                confirmButtonText: 'حسناً'
            });
        } else {
            alert(msgTitle + '\nيرجى التواصل مع الإدارة عبر الواتساب لتفعيل الاشتراك الكامل.');
        }
        return;
    }

    const btn = document.getElementById('btn-merchant-unified-add');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري النشر...';
    }

    const prodName = document.getElementById('prod-name').value.trim();
    const prodPrice = parseFloat(document.getElementById('prod-price').value) || 0;
    const prodStock = parseInt(document.getElementById('prod-stock').value) || 1;
    const prodSku = document.getElementById('prod-sku').value.trim() || ('SKU-' + Math.floor(1000 + Math.random() * 9000));
    const prodWeight = parseFloat(document.getElementById('prod-weight').value) || 0.25;
    const prodMinOrder = parseInt(document.getElementById('prod-min-order').value) || 1;
    const prodDesc = document.getElementById('prod-desc').value.trim();
    const mainCat = document.getElementById('prod-main-category')?.value || 'عام';
    const subCat = document.getElementById('prod-sub-category')?.value || '';

    // Prevent duplicate submission based on name and price
    if (!window.editingProductId && existingProducts.some(p => p.name === prodName && p.price == prodPrice)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'warning', title: 'المنتج مكرر!', text: 'لقد قمت بإضافة هذا المنتج مسبقاً.' });
        } else {
            alert('المنتج موجود مسبقاً!');
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> حفظ ونشر السلعة بالمتجر 🚀';
        }
        return;
    }

    // Retrieve active store profile details
    let currentStoreSettings = {};
    try {
        currentStoreSettings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || localStorage.getItem('merchant_store_settings') || '{}');
    } catch(e) {}

    const realStoreName = currentStoreSettings.storeName || currentStoreSettings.name || localStorage.getItem('zalo_active_store') || sessionStorage.getItem('merchant_store_name') || 'متجر ZaLo المعتمد';
    const realWilaya = currentStoreSettings.wilaya || localStorage.getItem('zalo_merchant_wilaya') || localStorage.getItem('zalo_selected_wilaya') || 'المنيعة (58)';
    const realPhone = currentStoreSettings.phone || localStorage.getItem('zalo_merchant_phone') || '0658000000';
    const realLogo = currentStoreSettings.logoImg || localStorage.getItem('zalo_merchant_logo') || 'assets/icon-192.svg';

    const mediaObj = window.unifiedMediaData || { url: '', urls: [], isVideo: false };
    let pMedia = mediaObj.url || 'assets/icon-192.svg';
    if (mediaObj.type === 'images' && mediaObj.urls.length > 0) {
        pMedia = mediaObj.urls.length === 1 ? mediaObj.urls[0] : JSON.stringify(mediaObj.urls);
    }
    const isVideo = mediaObj.isVideo || false;

    const pId = 'p_' + Date.now();
    
    // Retain existing image if editing and no new media selected
    if (window.editingProductId && (!mediaObj.type || mediaObj.type === 'none')) {
        let dbProds = [];
        try { dbProds = JSON.parse(localStorage.getItem('zalo_products') || '[]'); } catch(e){}
        const oldP = dbProds.find(p => String(p.id) === String(window.editingProductId));
        if (oldP) {
            pMedia = oldP.image || oldP.image_url || oldP.imageUrl || pMedia;
        }
    }

    const newProduct = {
        productId: pId,
        id: pId,
        productName: prodName,
        name: prodName,
        price: prodPrice,
        stock: prodStock,
        sku: prodSku,
        weight: prodWeight,
        minOrder: prodMinOrder,
        category: mainCat,
        subcategory: subCat,
        description: prodDesc,
        image: pMedia,
        imageUrl: pMedia,
        image_url: pMedia,
        video: isVideo ? pMedia : '',
        isVideo: isVideo,
        storeId: storeId,
        store_id: storeId,
        storeName: realStoreName,
        store_name: realStoreName,
        wilaya: realWilaya,
        phone: realPhone,
        created_at: new Date().toISOString()
    };

    // 1. Save to local products DB
    let dbProducts = [];
    try {
        dbProducts = JSON.parse(localStorage.getItem('zalo_products') || '[]');
    } catch(e) {}
    
    // Safety check: Limit local products cache to 50 items to avoid QuotaExceededError
    if (dbProducts.length > 50) {
        dbProducts = dbProducts.slice(0, 45);
    }
    
    if (window.editingProductId) {
        newProduct.id = window.editingProductId;
        newProduct.productId = window.editingProductId;
        const idx = dbProducts.findIndex(p => String(p.id) === String(window.editingProductId));
        if (idx >= 0) {
            dbProducts[idx] = { ...dbProducts[idx], ...newProduct };
        } else {
            dbProducts.unshift(newProduct);
        }
    } else {
        dbProducts.unshift(newProduct);
    }
    
    try {
        localStorage.setItem('zalo_products', JSON.stringify(dbProducts));
    } catch (quotaErr) {
        if (quotaErr.name === 'QuotaExceededError' || quotaErr.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            // If quota exceeded, try saving with a placeholder image instead of large DataURL
            newProduct.image = 'assets/icon-192.svg';
            newProduct.imageUrl = 'assets/icon-192.svg';
            if (window.editingProductId) {
                const idx = dbProducts.findIndex(p => String(p.id) === String(window.editingProductId));
                if(idx >= 0) dbProducts[idx] = newProduct;
            } else {
                dbProducts[0] = newProduct;
            }
            localStorage.setItem('zalo_products', JSON.stringify(dbProducts));
            console.warn('Storage quota reached, product saved without large image.');
        } else {
            throw quotaErr;
        }
    }

    // Also sync with legacy DB key
    try {
        if (typeof setDB === 'function') {
            let legacyProds = (typeof getDB === 'function') ? getDB('products', []) : [];
            if (legacyProds.length > 50) legacyProds = legacyProds.slice(0, 45);
            if (window.editingProductId) {
                const lIdx = legacyProds.findIndex(p => String(p.id) === String(window.editingProductId));
                if(lIdx >= 0) legacyProds[lIdx] = { ...legacyProds[lIdx], ...newProduct };
                else legacyProds.unshift(newProduct);
            } else {
                legacyProds.unshift(newProduct);
            }
            setDB('products', legacyProds);
        }
    } catch(e) {}

    // 3. Sync to Supabase products table if connected
    try {
        if (window.addProductToSupabase && !window.editingProductId) {
             const prodData = {
                name: prodName,
                productName: prodName,
                price: prodPrice,
                stock: prodStock,
                sku: prodSku,
                weight: prodWeight,
                minOrder: prodMinOrder,
                category: mainCat,
                subcategory: subCat,
                description: prodDesc,
                image: pMedia,
                image_url: pMedia,
                store_id: storeId,
                store_name: realStoreName,
                wilaya: realWilaya,
                phone: realPhone,
                status: 'active',
                id: pId,
                productId: pId
            };
            window.addProductToSupabase(prodData);
        }
    } catch (err) {
        console.warn('Supabase product sync notice:', err);
    }
    // 4. UNIFIED LIVE BROADCAST: Automatically sync as an active Live Story as well
    try {
        let stories = JSON.parse(localStorage.getItem('zalo_live_stories') || '[]');
        const storyObj = {
            id: pId,
            author: realStoreName,
            name: realStoreName,
            store_name: realStoreName,
            storeId: storeId,
            wilaya: realWilaya,
            category: mainCat,
            subcategory: subCat,
            price: prodPrice,
            caption: prodName + (prodDesc ? ' - ' + prodDesc : ''),
            title: prodName,
            image: pMedia,
            video: isVideo ? pMedia : '',
            isVideo: isVideo,
            logo: 'assets/icon-192.svg',
            phone: realPhone,
            time: 'الآن',
            likes: 1,
            created_at: new Date().toISOString()
        };

        stories = stories.filter(s => String(s.id) !== String(pId));
        stories.unshift(storyObj);
        localStorage.setItem('zalo_live_stories', JSON.stringify(stories));

        if (window.supabaseClient) {
            window.supabaseClient.from('market_posts').upsert({
                id: pId,
                author: realStoreName,
                author_name: realStoreName,
                store_name: realStoreName,
                wilaya: realWilaya,
                category: mainCat,
                price: prodPrice,
                caption: prodName + (prodDesc ? ' - ' + prodDesc : ''),
                image_url: pMedia,
                video_url: isVideo ? pMedia : null,
                is_video: isVideo,
                phone: realPhone,
                is_active: true
            }).then().catch(e => console.warn('Supabase story sync note:', e));
        }
    } catch(storyErr) {
        console.warn('Auto story sync notice:', storyErr);
    }

    // Clear form and reset media preview
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-sku').value = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('prod-desc').value = '';
    
    window.unifiedMediaData = { type: 'none', url: '', isVideo: false };
    const imgPrev = document.getElementById('unified-img-preview');
    if (imgPrev) { imgPrev.src = ''; imgPrev.classList.add('hidden'); }
    const vidPrev = document.getElementById('unified-vid-preview');
    if (vidPrev) { vidPrev.src = ''; vidPrev.classList.add('hidden'); }
    const imgLbl = document.getElementById('unified-img-lbl');
    if (imgLbl) { imgLbl.innerText = 'اختيار صورة'; imgLbl.className = 'text-xs text-sky-600 font-bold flex flex-col items-center gap-1'; }
    const vidLbl = document.getElementById('unified-vid-lbl');
    if (vidLbl) { vidLbl.innerText = 'فيديو (أقصاه 20ثا)'; vidLbl.className = 'text-xs text-rose-600 font-bold flex flex-col items-center gap-1'; }

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: window.editingProductId ? 'تم تحديث السلعة بنجاح! 🚀' : 'تم نشر السلعة والبث المباشر بنجاح! 🚀',
            text: window.editingProductId ? 'تم تطبيق التعديلات.' : 'أصبحت السلعة متاحة للزبائن فوراً في المعرض الرقمي وسوق الجزائر الموحد وبطاقات فيسبوك.',
            confirmButtonText: 'ممتاز'
        });
    } else {
        alert(window.editingProductId ? 'تم التحديث بنجاح!' : 'تم نشر وإضافة السلعة بنجاح في المعرض وسوق الجزائر! 🎉');
    }

    window.editingProductId = null; // reset editing state
    
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> نشر العرض الآن (نشر فوري)';
    }

    if (typeof renderMerchantProducts === 'function') {
        renderMerchantProducts();
    }
    if (typeof updateCounters === 'function') {
        updateCounters();
    }
};

window.switchProductSubTab = function(tab) {
    const pBtn = document.getElementById('subtab-btn-products');
    const sBtn = document.getElementById('subtab-btn-stories');
    const pView = document.getElementById('subview-products');
    const sView = document.getElementById('subview-stories');

    if (tab === 'stories') {
        if (pView) pView.classList.add('hidden');
        if (sView) sView.classList.remove('hidden');
        if (sBtn) {
            sBtn.className = 'px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm transition flex items-center gap-2';
        }
        if (pBtn) {
            pBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-2';
        }
        renderMerchantStories();
    } else {
        if (sView) sView.classList.add('hidden');
        if (pView) pView.classList.remove('hidden');
        if (pBtn) {
            pBtn.className = 'px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-sky-500 to-[#0284c7] text-white shadow-sm transition flex items-center gap-2';
        }
        if (sBtn) {
            sBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-2';
        }
        if (typeof renderMerchantProducts === 'function') {
            renderMerchantProducts();
        }
    }
};

window.storyMediaData = { url: '', isVideo: false };

window.previewStoryMedia = function(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();

    reader.onload = function(e) {
        window.storyMediaData = {
            url: e.target.result,
            isVideo: isVideo
        };
        const placeholder = document.getElementById('story-upload-placeholder');
        const imgPrev = document.getElementById('story-file-preview-img');
        const vidPrev = document.getElementById('story-file-preview-vid');

        if (placeholder) placeholder.classList.add('hidden');

        if (isVideo) {
            if (imgPrev) imgPrev.classList.add('hidden');
            if (vidPrev) {
                vidPrev.src = e.target.result;
                vidPrev.classList.remove('hidden');
            }
        } else {
            if (vidPrev) vidPrev.classList.add('hidden');
            if (imgPrev) {
                imgPrev.src = e.target.result;
                imgPrev.classList.remove('hidden');
            }
        }
    };
    reader.readAsDataURL(file);
};

window.merchantPublishStory = async function(e) {
    if (e) e.preventDefault();

    const caption = (document.getElementById('story-caption-input')?.value || '').trim();
    const price = parseFloat(document.getElementById('story-price-input')?.value || 0) || 0;
    
    if (!caption) {
        alert('يرجى كتابة عنوان العرض أو القصة');
        return;
    }

    let mediaUrl = window.storyMediaData?.url;
    let isVideo = window.storyMediaData?.isVideo || false;

    if (!mediaUrl) {
        alert('يرجى اختيار صورة أو فيديو لنشر القصة');
        return;
    }

    const btn = document.getElementById('btn-submit-story');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري بث القصة...';
    }

    let settings = {};
    try {
        settings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || '{}');
    } catch(err) {}

    const storeName = settings.storeName || settings.name || localStorage.getItem('zalo_active_store') || 'متجر معتمد';
    const storeLogo = settings.logoImg || settings.logo || 'assets/icon-192.svg';
    const storeWilaya = settings.wilaya || 'الجزائر';
    const storePhone = settings.phone || '0555000000';

    const newStory = {
        id: 'story_' + Date.now(),
        productId: 'story_p_' + Date.now(),
        author: storeName,
        store_name: storeName,
        name: storeName,
        logo: storeLogo,
        wilaya: storeWilaya,
        phone: storePhone,
        image: mediaUrl,
        video: isVideo ? mediaUrl : '',
        isVideo: isVideo,
        caption: caption + (price > 0 ? ` | السعر: ${price.toLocaleString()} دج` : ''),
        title: caption,
        price: price,
        likes: 1,
        rating: '5.0',
        reposts: 0,
        time: 'الآن',
        created_at: new Date().toISOString()
    };

    // Save to zalo_live_stories
    try {
        let stories = JSON.parse(localStorage.getItem('zalo_live_stories') || '[]');
        stories.unshift(newStory);
        if (stories.length > 30) stories = stories.slice(0, 30);
        localStorage.setItem('zalo_live_stories', JSON.stringify(stories));
    } catch(err) {
        console.warn('Local stories save:', err);
    }

    // Publish to Supabase if connected
    const sb = window.supabaseClient || window.supabase;
    if (sb && sb.from) {
        try {
            await sb.from('market_posts').insert([{
                store_name: storeName,
                author_name: storeName,
                author: storeName,
                wilaya: storeWilaya,
                phone: storePhone,
                title: caption,
                description: caption,
                caption: caption,
                image_url: mediaUrl,
                image: mediaUrl,
                video: isVideo ? mediaUrl : '',
                price: String(price),
                status: 'active',
                post_type: 'story',
                created_at: new Date().toISOString()
            }]);
        } catch(err) {
            console.warn('Supabase story post:', err);
        }
    }

    // Reset Form
    document.getElementById('story-caption-input').value = '';
    if (document.getElementById('story-price-input')) document.getElementById('story-price-input').value = '';
    window.storyMediaData = { url: '', isVideo: false };
    
    const placeholder = document.getElementById('story-upload-placeholder');
    const imgPrev = document.getElementById('story-file-preview-img');
    const vidPrev = document.getElementById('story-file-preview-vid');
    if (placeholder) placeholder.classList.remove('hidden');
    if (imgPrev) { imgPrev.src = ''; imgPrev.classList.add('hidden'); }
    if (vidPrev) { vidPrev.src = ''; vidPrev.classList.add('hidden'); }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane text-sm"></i> <span>📸 نشر القصة فوراً في واجهة الزبائن</span>';
    }

    renderMerchantStories();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'تم نشر وبث القصة بنجاح! 🌟',
            text: 'تظهر قصتك الآن مباشرة لجميع الزبائن في شريط القصص العلوي وسوق الجزائر.',
            confirmButtonText: 'ممتاز'
        });
    } else {
        alert('تم نشر وبث القصة بنجاح في واجهة الزبائن! 🌟');
    }
};

window.deleteMerchantStory = function(storyId) {
    if (typeof deleteStoryFromSupabase === 'function') deleteStoryFromSupabase(storyId);
    const doDel = () => {
        try {
            let stories = JSON.parse(localStorage.getItem('zalo_live_stories') || '[]');
            stories = stories.filter(s => String(s.id) !== String(storyId));
            localStorage.setItem('zalo_live_stories', JSON.stringify(stories));
        } catch(e) {}

        if (window.supabaseClient) {
            window.supabaseClient.from('market_posts').delete().eq('id', storyId).then(() => {}).catch(() => {});
        }

        renderMerchantStories();

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'تم حذف القصة بنجاح! 🗑️',
                confirmButtonText: 'حسناً',
                timer: 1500
            });
        }
    };

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'هل تريد حذف هذه القصة؟',
            text: 'سيتم إيقاف عرض هذه القصة من واجهة الزبائن.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'إلغاء',
            confirmButtonText: 'نعم، حذف القصة'
        }).then(res => {
            if (res.isConfirmed) doDel();
        });
    } else {
        if (confirm('هل أنت متأكد من حذف هذه القصة؟')) doDel();
    }
};

window.renderMerchantStories = function() {
    const grid = document.getElementById('merchant-stories-grid');
    if (!grid) return;

    let settings = {};
    try {
        settings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || '{}');
    } catch(err) {}

    const storeName = settings.storeName || settings.name || localStorage.getItem('zalo_active_store') || '';
    let stories = [];
    try {
        stories = JSON.parse(localStorage.getItem('zalo_live_stories') || '[]');
    } catch(e) {}

    // Filter stories for current merchant
    let myStories = stories.filter(s => {
        if (!storeName) return true;
        return s.author === storeName || s.store_name === storeName || s.name === storeName;
    });

    if (myStories.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center p-8 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400">
                <i class="fa-solid fa-camera text-3xl text-slate-300 mb-2"></i>
                <p class="font-black text-slate-600 text-xs">لا توجد قصص منشورة لمتجرك حالياً</p>
                <p class="text-[10px] text-slate-400 mt-1">انشر قصة جديدة من النموذج الجانبي لتظهر في شريط القصص العلوي لجميع زبائن المنصة فوراً.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    myStories.forEach(s => {
        const media = s.image || s.video || 'assets/icon-192.svg';
        const isVid = s.isVideo || false;
        const priceTag = s.price ? `<span class="bg-sky-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">${parseFloat(s.price).toLocaleString()} دج</span>` : '';

        grid.innerHTML += `
            <div class="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div class="relative h-44 bg-slate-900 flex items-center justify-center">
                    ${isVid ? `<video src="${media}" controls class="w-full h-full object-cover"></video>` : `<img src="${media}" class="w-full h-full object-cover" onerror="this.src='assets/icon-192.svg'">`}
                    <div class="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-bold">
                        <i class="fa-solid fa-clock text-amber-400"></i> ${s.time || 'نشطة'}
                    </div>
                </div>
                <div class="p-3 space-y-2">
                    <p class="font-extrabold text-xs text-slate-800 line-clamp-2">${s.caption || s.title || 'عرض لحظي'}</p>
                    <div class="flex justify-between items-center pt-1 border-t border-slate-200">
                        ${priceTag}
                        <button onclick="deleteMerchantStory('${s.id}')" class="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-black px-2.5 py-1 rounded-lg transition flex items-center gap-1">
                            <i class="fa-solid fa-trash-can"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
};

window.merchantPublishInstantPost = window.merchantUnifiedAddProduct;

window.toggleStorePublishingPause = function() {
    let storeId = localStorage.getItem('zalo_current_store_id') || localStorage.getItem('zalo_uid') || 'default_store';
    const isPaused = localStorage.getItem('zalo_publishing_paused_' + storeId) === 'true';
    const nextState = !isPaused;
    localStorage.setItem('zalo_publishing_paused_' + storeId, nextState ? 'true' : 'false');
    
    updatePublishStatusUI(nextState);

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: nextState ? 'info' : 'success',
            title: nextState ? 'تم إيقاف نشر المنتجات مؤقتاً ⏸️' : 'تم استئناف نشر المنتجات بنجاح ▶️',
            text: nextState ? 'لن يتمكن المتجر من نشر سلع جديدة حتى يتم استئناف النشر أو استكمال الوثائق.' : 'يمكنك الآن مواصلة نشر وإضافة السلع في المعرض وسوق الجزائر.',
            confirmButtonText: 'حسناً'
        });
    }
};

window.updatePublishStatusUI = function(isPaused) {
    const badge = document.getElementById('sidebar-publish-status-badge');
    const btnText = document.getElementById('sidebar-pause-btn-text');
    const toggleBtn = document.getElementById('sidebar-toggle-pause-btn');

    if (badge) {
        if (isPaused) {
            badge.textContent = 'موقف مؤقتاً 🛑';
            badge.className = 'text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black';
        } else {
            badge.textContent = 'نشط (5 معروضات)';
            badge.className = 'text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black';
        }
    }
    if (btnText) {
        btnText.textContent = isPaused ? 'استئناف النشر' : 'إيقاف النشر';
    }
    if (toggleBtn) {
        toggleBtn.className = isPaused 
            ? 'h-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[10.5px] font-black flex items-center justify-center gap-1.5 transition'
            : 'h-9 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-[10.5px] font-black flex items-center justify-center gap-1.5 transition';
    }
};

window.openVerificationModal = function() {
    const modal = document.getElementById('storeVerificationModal');
    if (modal) modal.classList.remove('hidden');
};

window.closeVerificationModal = function() {
    const modal = document.getElementById('storeVerificationModal');
    if (modal) modal.classList.add('hidden');
};

window.submitStoreVerificationDocuments = function(e) {
    if (e) e.preventDefault();
    let storeId = localStorage.getItem('zalo_current_store_id') || localStorage.getItem('zalo_uid') || 'default_store';
    localStorage.setItem('zalo_merchant_verified_' + storeId, 'true');
    localStorage.setItem('zalo_publishing_paused_' + storeId, 'false');
    
    updatePublishStatusUI(false);
    const badge = document.getElementById('sidebar-publish-status-badge');
    if (badge) {
        badge.textContent = 'موثق ومعتمد 🌟 (لاحدودي)';
        badge.className = 'text-[9px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-black';
    }

    closeVerificationModal();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'تم استلام وثائق المحل وطلب التوثيق! 🎉',
            text: 'تم رفع السجل التجاري والهوية. النشر اللاحدودي مفعل لمتجرك الآن!',
            confirmButtonText: 'رائع'
        });
    }
};

async function refreshMerchantSidebarProfile() {
    try {
        const storeSettings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || '{}');
        const storeName = storeSettings.storeName || storeSettings.name || localStorage.getItem('zalo_active_store') || 'متجر ZaLo';
        const userEmail = localStorage.getItem('zalo_user_email') || 'merchant@zalo.dz';
        const logoImg = storeSettings.logoImg || localStorage.getItem('zalo_merchant_logo') || 'assets/icon-192.svg';

        const nameEl = document.getElementById('sidebar-user-name');
        const emailEl = document.getElementById('sidebar-user-email');
        const logoEl = document.getElementById('sidebar-store-logo-preview');

        if (nameEl) nameEl.textContent = storeName;
        if (emailEl) emailEl.textContent = userEmail;
        if (logoEl && logoImg) logoEl.src = logoImg;
    } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    refreshMerchantSidebarProfile();
    let storeId = localStorage.getItem('zalo_current_store_id') || localStorage.getItem('zalo_uid') || 'default_store';
    const isPaused = localStorage.getItem('zalo_publishing_paused_' + storeId) === 'true';
    const isVerified = localStorage.getItem('zalo_merchant_verified_' + storeId) === 'true';
    if (isVerified) {
        const badge = document.getElementById('sidebar-publish-status-badge');
        if (badge) {
            badge.textContent = 'موثق ومعتمد 🌟 (لاحدودي)';
            badge.className = 'text-[9px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-black';
        }
    } else {
        updatePublishStatusUI(isPaused);
    }
});
