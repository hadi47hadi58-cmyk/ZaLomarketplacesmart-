        function getDB(key, fallback) {
            try {
                const val = localStorage.getItem(key);
                return val ? JSON.parse(val) : fallback;
            } catch (e) {
                return fallback;
            }
        }

        const FAKE_STORE_NAMES = ["ABDELALI.PHONE", "ZaLo kids", "Nadjemi Abdelhadi", "متجري الشريك المعتمد", "متجر الشريك"];
        const FAKE_PROD_NAMES = ["حامل الهواتف المحمولة", "ساعة ذكية", "طقم أواني", "حامل الدفتر الصحي", "حامل دفاتر الصحي", "فراش تغيير ملابس"];

        function purgeAllManagerFakeData() {
            try {
                let stores = JSON.parse(localStorage.getItem("stores_list_old") || "[]");
                stores = stores.filter(s => !FAKE_STORE_NAMES.some(fn => (s.name || s.store_name || s.storeName || '').includes(fn)));
                localStorage.setItem("stores_list_old", JSON.stringify(stores));
            } catch(e) {}

            try {
                let stores = JSON.parse(localStorage.getItem("stores") || "[]");
                stores = stores.filter(s => !FAKE_STORE_NAMES.some(fn => (s.name || s.store_name || s.storeName || '').includes(fn)));
                localStorage.setItem("stores", JSON.stringify(stores));
            } catch(e) {}

            try {
                let stores = JSON.parse(localStorage.getItem("zalo_stores") || "[]");
                stores = stores.filter(s => !FAKE_STORE_NAMES.some(fn => (s.name || s.store_name || s.storeName || '').includes(fn)));
                localStorage.setItem("zalo_stores", JSON.stringify(stores));
            } catch(e) {}

            try {
                let prods = JSON.parse(localStorage.getItem("products") || "[]");
                prods = prods.filter(p => !FAKE_PROD_NAMES.some(fn => (p.name || p.productName || '').includes(fn)));
                localStorage.setItem("products", JSON.stringify(prods));
            } catch(e) {}

            try {
                let prods = JSON.parse(localStorage.getItem("zalo_products") || "[]");
                prods = prods.filter(p => !FAKE_PROD_NAMES.some(fn => (p.name || p.productName || '').includes(fn)));
                localStorage.setItem("zalo_products", JSON.stringify(prods));
            } catch(e) {}
        }

        // Run immediately
        purgeAllManagerFakeData();

        function renderManagerStats() {
            purgeAllManagerFakeData();

            let users = getDB("users", []);
            let verifiedUsers = users.filter(u => (u.phone && u.phone.trim().length > 0) || (u.email && u.email.trim().length > 0)).length;
            const elUsers = document.getElementById("mgr-stat-users");
            if (elUsers) elUsers.innerText = verifiedUsers;

            let orders = getDB("orders", []);
            let completedOrders = orders.filter(o => o.status === "تم التسليم" || o.status === "DELIVERED");
            let totalVal = completedOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            const elSales = document.getElementById("mgr-stat-sales");
            if (elSales) elSales.innerText = totalVal.toLocaleString() + " دج";

            let stores = getDB("stores_list_old", []);
            stores = stores.filter(s => !FAKE_STORE_NAMES.some(fn => (s.name || s.store_name || s.storeName || '').includes(fn)));
            let activeStores = stores.filter(s => s.status === "APPROVED" || s.status === "approved" || s.status === "ACTIVE").length;
            const elStores = document.getElementById("mgr-stat-stores");
            if (elStores) elStores.innerText = activeStores + " متجر";

            const elOrders = document.getElementById("mgr-stat-orders");
            if (elOrders) elOrders.innerText = completedOrders.length + " طلبية";
        }

        function toggleManagerUsersList() {
            const container = document.getElementById("manager-users-container");
            const btn = document.getElementById("btn-toggle-mgr-users");
            if (!container) return;
            if (container.classList.contains("hidden")) {
                container.classList.remove("hidden");
                if (btn) btn.innerHTML = `<i class="fa-solid fa-chevron-up"></i> <span>إخفاء القائمة (تخصيص المساحة)</span>`;
            } else {
                container.classList.add("hidden");
                if (btn) btn.innerHTML = `<i class="fa-solid fa-users-viewfinder"></i> <span>عرض قائمة المستخدمين (تخصيص المساحة) 👥</span>`;
            }
        }

        window.toggleManagerStoresList = function() {
            const container = document.getElementById("manager-stores-container");
            const btn = document.getElementById("btn-toggle-mgr-stores");
            if (!container) return;
            if (container.classList.contains("hidden")) {
                container.classList.remove("hidden");
                if (btn) btn.innerHTML = `<i class="fa-solid fa-chevron-up"></i> <span>إخفاء القائمة</span>`;
                renderManagerStores();
            } else {
                container.classList.add("hidden");
                if (btn) btn.innerHTML = `<i class="fa-solid fa-eye"></i> <span>عرض قائمة المتاجر 🏪</span>`;
            }
        };

        window.toggleManagerProductsList = function() {
            const container = document.getElementById("manager-products-container");
            const btn = document.getElementById("btn-toggle-mgr-products");
            if (!container) return;
            if (container.classList.contains("hidden")) {
                container.classList.remove("hidden");
                if (btn) btn.innerHTML = `<i class="fa-solid fa-chevron-up"></i> <span>إخفاء القائمة</span>`;
                renderManagerProducts();
            } else {
                container.classList.add("hidden");
                if (btn) btn.innerHTML = `<i class="fa-solid fa-boxes-stacked"></i> <span>عرض قائمة المنتجات 📦</span>`;
            }
        };

        window.renderManagerStores = async function() {
            purgeAllManagerFakeData();
            const tbody = document.getElementById('manager-stores-tbody');
            if (!tbody) return;
            
            let stores = [];

            // 1. Fetch live from Supabase
            if (window.supabaseClient) {
                try {
                    const { data, error } = await window.supabaseClient.from('stores').select('*');
                    if (!error && Array.isArray(data)) {
                        stores = data.map(s => ({
                            id: s.id,
                            storeId: s.id,
                            name: s.name || s.store_name || 'متجر',
                            storeName: s.name || s.store_name || 'متجر',
                            location: s.wilaya || s.location || 'الجزائر',
                            wilaya: s.wilaya || 'الجزائر',
                            category: s.category || 'عام',
                            owner: s.owner_name || s.merchant_name || 'تاجر',
                            phone: s.phone || '-',
                            status: s.status || (s.is_verified ? 'APPROVED' : 'PENDING'),
                            image: s.logo_url || s.image || 'assets/icon-192.svg'
                        }));
                    }
                } catch (e) {
                    console.warn("[ManagerStores] Supabase fetch error:", e);
                }
            }

            // 2. Fallback to LocalStorage (Filtered)
            let localStores = getDB("stores_list_old", []);
            const localStores2 = getDB("stores", []);
            localStores = [...localStores, ...localStores2];

            localStores.forEach(ls => {
                const sId = ls.id || ls.storeId;
                const sName = ls.name || ls.storeName;
                const exists = stores.some(s => s.id == sId || (s.name && s.name === sName));
                if (!exists && !FAKE_STORE_NAMES.some(fn => (sName || '').includes(fn))) {
                    stores.push(ls);
                }
            });

            // Filter out any fake names strictly
            stores = stores.filter(s => !FAKE_STORE_NAMES.some(fn => (s.name || s.storeName || s.store_name || '').includes(fn)));

            // Update stats
            const elStores = document.getElementById("mgr-stat-stores");
            if (elStores) elStores.innerText = stores.length + " متجر";

            if (stores.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-400 font-bold">لا توجد متاجر مسجلة حالياً</td></tr>';
                return;
            }

            tbody.innerHTML = stores.map(s => {
                const safeId = String(s.id || s.storeId || '');
                const safeName = (s.name || s.storeName || 'متجر').replace(/'/g, "\\'");
                const isPaused = localStorage.getItem('zalo_publishing_paused_' + safeId) === 'true';

                return `
                <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td class="py-3 px-2">
                        <div class="flex items-center gap-2">
                            <img src="${s.image || s.logo_url || s.logo || 'assets/icon-192.svg'}" class="w-8 h-8 rounded-lg object-cover border border-slate-200">
                            <span class="font-bold text-slate-800">${s.name || s.storeName || 'متجر'}</span>
                        </div>
                    </td>
                    <td class="py-3 px-2">
                        <p class="font-bold text-sky-600">${s.location || s.wilaya || 'غير محدد'}</p>
                        <p class="text-[10px] text-slate-400">${s.category || 'عام'}</p>
                    </td>
                    <td class="py-3 px-2">
                        <p class="font-bold text-slate-700">${s.owner || s.owner_name || 'تاجر'}</p>
                        <p class="text-[10px] text-slate-400">${s.phone || '-'}</p>
                    </td>
                    <td class="py-3 px-2 text-center">
                        <div class="flex justify-center gap-1">
                            <button onclick="deleteManagerStore('${safeId}', '${safeName}')" class="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition font-bold shadow-sm">حذف</button>
                            <button onclick="toggleManagerStorePause('${safeId}')" class="${isPaused ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} px-2 py-1 rounded-md hover:opacity-80 transition font-bold">
                                ${isPaused ? 'استئناف' : 'إيقاف'}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            }).join('');
        };

        window.renderManagerProducts = async function() {
            purgeAllManagerFakeData();
            const tbody = document.getElementById('manager-products-tbody');
            if (!tbody) return;
            
            let products = [];

            // 1. Fetch live from Supabase
            if (window.supabaseClient) {
                try {
                    const { data, error } = await window.supabaseClient.from('products').select('*, stores(name)').order('created_at', { ascending: false });
                    if (!error && Array.isArray(data)) {
                        products = data.map(p => ({
                            id: p.id,
                            productId: p.id,
                            name: p.name,
                            productName: p.name,
                            price: p.price || 0,
                            storeName: p.stores?.name || p.store_name || 'متجر',
                            image: p.image_url || 'assets/icon-192.svg'
                        }));
                    }
                } catch(e) {
                    console.warn("[ManagerProducts] Supabase fetch error:", e);
                }
            }

            // 2. Fallback to LocalStorage (Filtered)
            let localProds = getDB("products", []);
            const localProds2 = getDB("zalo_products", []);
            localProds = [...localProds, ...localProds2];

            localProds.forEach(lp => {
                const pId = lp.id || lp.productId;
                const pName = lp.name || lp.productName;
                const exists = products.some(p => p.id == pId || (p.name && p.name === pName));
                if (!exists && !FAKE_PROD_NAMES.some(fn => (pName || '').includes(fn))) {
                    products.push(lp);
                }
            });

            // Filter out fake products strictly
            products = products.filter(p => !FAKE_PROD_NAMES.some(fn => (p.name || p.productName || '').includes(fn)));

            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-slate-400 font-bold">لا توجد منتجات منشورة حالياً</td></tr>';
                return;
            }

            tbody.innerHTML = products.map(p => {
                const safeId = String(p.id || p.productId || '');
                const safeName = (p.productName || p.name || 'منتج').replace(/'/g, "\\'");

                return `
                <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td class="py-3 px-2">
                        <div class="flex items-center gap-2">
                            <img src="${p.image || p.imageUrl || p.img || 'assets/icon-192.svg'}" class="w-8 h-8 rounded-lg object-cover border border-slate-200">
                            <span class="font-bold text-slate-800">${p.productName || p.name || 'منتج'}</span>
                        </div>
                    </td>
                    <td class="py-3 px-2">
                        <p class="font-bold text-emerald-600">${p.price || 0} دج</p>
                        <p class="text-[10px] text-slate-400">بواسطة: ${p.storeName || p.store_name || 'تاجر'}</p>
                    </td>
                    <td class="py-3 px-2 text-center">
                        <button onclick="deleteManagerProduct('${safeId}', '${safeName}')" class="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white transition font-bold shadow-sm">حذف المنتج</button>
                    </td>
                </tr>
            `;
            }).join('');
        };

        window.deleteManagerStore = async function(id, storeName) {
            if (!confirm('🚨 هل أنت متأكد من حذف هذا المتجر وجميع معروضاته نهائياً من قاعدة البيانات والتطبيق؟')) return;
            
            // 1. Remove from all local arrays
            let stores = getDB("stores_list_old", []);
            stores = stores.filter(s => s.id != id && s.storeId != id && (!storeName || (s.name !== storeName && s.storeName !== storeName)));
            localStorage.setItem("stores_list_old", JSON.stringify(stores));

            let stores2 = getDB("stores", []);
            stores2 = stores2.filter(s => s.id != id && s.storeId != id && (!storeName || (s.name !== storeName && s.storeName !== storeName)));
            localStorage.setItem("stores", JSON.stringify(stores2));

            let stores3 = getDB("zalo_stores", []);
            stores3 = stores3.filter(s => s.id != id && s.storeId != id && (!storeName || (s.name !== storeName && s.storeName !== storeName)));
            localStorage.setItem("zalo_stores", JSON.stringify(stores3));

            // Also remove products of this store locally
            let prods = getDB("products", []);
            prods = prods.filter(p => p.store_id != id && p.storeId != id && (!storeName || (p.storeName !== storeName && p.store_name !== storeName)));
            localStorage.setItem("products", JSON.stringify(prods));

            // 2. Supabase deletion
            if (window.supabaseClient) {
                try {
                    if (id && id !== 'undefined' && id !== 'null') {
                        await window.supabaseClient.from('products').delete().eq('store_id', id);
                        await window.supabaseClient.from('market_posts').delete().eq('store_id', id);
                        await window.supabaseClient.from('stores').delete().eq('id', id);
                        await window.supabaseClient.from('merchant_requests').delete().eq('user_id', id);
                    }
                    if (storeName) {
                        await window.supabaseClient.from('stores').delete().eq('name', storeName);
                        await window.supabaseClient.from('merchant_requests').delete().eq('store_name', storeName);
                    }
                } catch(e) {
                    console.warn("[Manager] Supabase delete store note:", e);
                }
            }

            alert("✅ تم حذف المتجر ومسح كافة بياناته بنجاح!");
            await window.renderManagerStores();
            await window.renderManagerProducts();
            if (typeof renderManagerStats === 'function') renderManagerStats();
            if (typeof renderWilayaTable === 'function') renderWilayaTable();
        };

        window.toggleManagerStorePause = function(id) {
            const isPaused = localStorage.getItem('zalo_publishing_paused_' + id) === 'true';
            const nextState = !isPaused;
            localStorage.setItem('zalo_publishing_paused_' + id, nextState);
            alert(nextState ? 'تم إيقاف المتجر عن النشر مؤقتاً 🛑' : 'تم تفعيل المتجر واستئناف النشر بنجاح ✅');
            window.renderManagerStores();
        };

        window.deleteManagerProduct = async function(id, prodName) {
            if (!confirm('🚨 هل أنت متأكد من حذف هذا المنتج نهائياً من قاعدة البيانات والتطبيق؟')) return;
            
            // 1. LocalStorage filter
            let products = getDB("products", []);
            products = products.filter(p => p.id != id && p.productId != id && (!prodName || (p.name !== prodName && p.productName !== prodName)));
            localStorage.setItem("products", JSON.stringify(products));
            
            let products2 = getDB("zalo_products", []);
            products2 = products2.filter(p => p.id != id && p.productId != id && (!prodName || (p.name !== prodName && p.productName !== prodName)));
            localStorage.setItem("zalo_products", JSON.stringify(products2));

            // 2. Supabase deletion
            if (window.supabaseClient) {
                try {
                    if (id && id !== 'undefined' && id !== 'null') {
                        await window.supabaseClient.from('products').delete().eq('id', id);
                        await window.supabaseClient.from('market_posts').delete().eq('id', id);
                    }
                    if (prodName) {
                        await window.supabaseClient.from('products').delete().eq('name', prodName);
                        await window.supabaseClient.from('market_posts').delete().eq('name', prodName);
                    }
                } catch(e) {
                    console.warn("[Manager] Supabase delete product note:", e);
                }
            }
            
            alert("✅ تم حذف المنتج نهائياً بنجاح!");
            await renderManagerProducts();
            if (typeof renderManagerStats === 'function') renderManagerStats();
        };

        function openStatDetailModal(type) {
            let modal = document.getElementById("stat-detail-modal");
            if (!modal) {
                modal = document.createElement("div");
                modal.id = "stat-detail-modal";
                modal.className = "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-sans";
                modal.setAttribute("dir", "rtl");
                document.body.appendChild(modal);
            }

            let title = "تفاصيل الإحصائيات";
            let icon = "fa-chart-pie";
            let contentHtml = "";

            const users = getDB("users", []);
            const stores = getDB("stores_list_old", []);
            const products = getDB("products", []);
            const orders = getDB("orders", []);

            if (type === "users" || type === "verified-users") {
                title = "بيانات وإحصائيات المستخدمين المسجلين";
                icon = "fa-users";
                contentHtml = `
                    <div class="space-y-4">
                        <div class="flex justify-between items-center bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs">
                            <span class="font-bold text-sky-800">إجمالي الحسابات المقيدة بالنظام: ${users.length}</span>
                            <span class="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full font-black">محدث آلياً</span>
                        </div>
                        <div class="max-h-80 overflow-y-auto space-y-2">
                            ${users.length === 0 ? '<p class="text-center text-xs text-slate-400 py-4">لا يوجد مستخدمون حالياً في النظام</p>' : 
                                users.map(u => `
                                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                        <div>
                                            <p class="font-black text-slate-800">${u.name || 'مستخدم'}</p>
                                            <p class="text-[10px] text-slate-400">${u.email || u.phone || 'بدون بريد'}</p>
                                        </div>
                                        <span class="bg-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded-lg font-bold">${u.role || 'زبون'}</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                `;
            } else if (type === "sales" || type === "profits" || type === "net-profits") {
                title = "تفاصيل المبيعات والأرباح المالية المحققة";
                icon = "fa-sack-dollar";
                let completed = orders.filter(o => o.status === "تم التسليم" || o.status === "DELIVERED");
                let totalVal = completed.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
                contentHtml = `
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-right">
                                <span class="text-[10px] text-emerald-600 font-bold block">إجمالي القيمة المسلمة</span>
                                <span class="text-sm font-black text-emerald-800">${totalVal.toLocaleString()} دج</span>
                            </div>
                            <div class="bg-amber-50 p-3 rounded-xl border border-amber-200 text-right">
                                <span class="text-[10px] text-amber-600 font-bold block">عمولة المنصة الصافية (5%)</span>
                                <span class="text-sm font-black text-amber-800">${(totalVal * 0.05).toLocaleString()} دج</span>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500 font-bold">الطلبات المكتملة حديثاً (${completed.length} طلبية):</p>
                        <div class="max-h-60 overflow-y-auto space-y-2">
                            ${completed.length === 0 ? '<p class="text-center text-xs text-slate-400 py-4">لا توجد مبيعات مكتملة مسجلة بعد</p>' :
                                completed.map(o => `
                                    <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                        <div>
                                            <p class="font-bold text-slate-800">طلب #${(o.id || '').substring(0,8)}</p>
                                            <p class="text-[10px] text-slate-400">${o.customer || 'زبون'}</p>
                                        </div>
                                        <span class="font-black text-emerald-700">${o.total || 0} دج</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                `;
            } else if (type === "stores" || type === "active-stores") {
                title = "سجل المتاجر والمحلات الرسمية المعتمدة";
                icon = "fa-store";
                let active = stores.filter(s => s.status === "APPROVED");
                contentHtml = `
                    <div class="space-y-4">
                        <div class="flex justify-between items-center bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
                            <span class="font-bold text-amber-800">المتاجر المعتمدة المفتوحة: ${active.length}</span>
                            <span class="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black">69 ولاية</span>
                        </div>
                        <div class="max-h-80 overflow-y-auto space-y-2">
                            ${active.length === 0 ? '<p class="text-center text-xs text-slate-400 py-4">لا توجد متاجر نشطة حالياً</p>' :
                                active.map(s => `
                                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                        <div>
                                            <p class="font-black text-slate-800">${s.name || s.store_name || 'متجر'}</p>
                                            <p class="text-[10px] text-slate-400">المالك: ${s.owner || s.owner_name || 'تاجر'} | الولاية: ${s.location || s.wilaya || 'الجزائر'}</p>
                                        </div>
                                        <span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded-lg font-bold">نشط 🟢</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                `;
            } else if (type === "orders" || type === "active-orders") {
                title = "جدول وتفاصيل طلبات الشحن والتوصيل";
                icon = "fa-box";
                contentHtml = `
                    <div class="space-y-4">
                        <div class="flex justify-between items-center bg-purple-50 p-3 rounded-xl border border-purple-200 text-xs">
                            <span class="font-bold text-purple-800">إجمالي الطلبات بالمنصة: ${orders.length}</span>
                            <span class="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-black">تحديث مباشر</span>
                        </div>
                        <div class="max-h-80 overflow-y-auto space-y-2">
                            ${orders.length === 0 ? '<p class="text-center text-xs text-slate-400 py-4">لا توجد طلبيات جارية حالياً</p>' :
                                orders.map(o => `
                                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                        <div>
                                            <p class="font-black text-slate-800">طلب #${(o.id || o.orderId || '').substring(0,8)}</p>
                                            <p class="text-[10px] text-slate-400">الزبون: ${o.customer || o.customerName || 'زبون'} | ${o.phone || ''}</p>
                                        </div>
                                        <span class="bg-sky-100 text-sky-800 text-[10px] px-2 py-1 rounded-lg font-bold">${o.status || 'قيد الشحن'}</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                `;
            } else {
                title = "تفاصيل الإحصائيات الشاملة";
                icon = "fa-chart-line";
                contentHtml = `<p class="text-xs text-slate-600 font-bold leading-relaxed">توضح هذه الكارت الإحصائية المؤشرات الميدانية المحدثة آلياً بناءً على عمليات الشراء والتسجيلات الفعلية بجميع الولايات الـ 69.</p>`;
            }

            modal.innerHTML = `
                <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border-2 border-amber-400 space-y-5 animate-in fade-in zoom-in duration-200 text-right">
                    <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-base">
                                <i class="fa-solid ${icon}"></i>
                            </div>
                            <h3 class="text-sm font-black text-slate-800">${title}</h3>
                        </div>
                        <button onclick="closeStatDetailModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    ${contentHtml}
                    <div class="pt-2 text-left">
                        <button onclick="closeStatDetailModal()" class="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition">
                            إغلاق النافذة
                        </button>
                    </div>
                </div>
            `;
            modal.classList.remove("hidden");
        }

        function closeStatDetailModal() {
            const modal = document.getElementById("stat-detail-modal");
            if (modal) modal.classList.add("hidden");
        }

        function initManagerDashboardPage() {
            console.log("[ManagerDashboard] Running dynamic role-based workspace personalization...");
            renderManagerStats();
            renderManagerStores();
            renderManagerProducts();
            
            const email = localStorage.getItem('zalo_user_email') || 'manager@zalo.dz';
            const activeStaff = getDB("zalo_active_staff", []);
            const currentStaff = activeStaff.find(s => s.email.toLowerCase() === email.toLowerCase());

            if (currentStaff) {
                // Check Suspended state
                if (currentStaff.status === "SUSPENDED") {
                    const mainContainer = document.querySelector('main');
                    mainContainer.innerHTML = `
                        <div class="bg-red-50 border-2 border-red-300 rounded-3xl p-8 text-center max-w-2xl mx-auto my-12 space-y-4">
                            <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm">
                                <i class="fa-solid fa-user-slash"></i>
                            </div>
                            <h2 class="text-xl font-black text-red-800">⚠️ تم تجميد حسابك الإداري مؤقتاً!</h2>
                            <p class="text-xs text-red-600 font-bold leading-relaxed">
                                نأسف لإبلاغك بأن المدير العام لمنصة ZaLo قد قام بتعليق وتجميد حسابك الإداري والرقابي مؤقتاً لأسباب تتعلق بالتدقيق الأمني.
                            </p>
                            <p class="text-[11px] text-slate-500 font-semibold">
                                يرجى مراجعة الإدارة العليا للتحقق من الصلاحيات الجغرافية المسندة إليك وإعادة تفعيل الحساب.
                            </p>
                            <button onclick="logoutUser()" class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition">
                                <i class="fa-solid fa-power-off ml-1"></i> تسجيل الخروج والعودة
                            </button>
                        </div>
                    `;
                    return;
                }

                // Customize UI with current staff info
                document.getElementById("header-user-name").innerText = `${currentStaff.name} (${currentStaff.customTitle}) 💼`;
                
                // Customize welcome description
                const welcomeDesc = document.querySelector(".text-right.space-y-1 p");
                if (welcomeDesc) {
                    welcomeDesc.innerHTML = `<span class="bg-sky-50 text-sky-700 px-2.5 py-1 rounded border border-sky-100 font-black">📍 نطاق صلاحيتك الجغرافي: ولاية ${currentStaff.wilaya} (${currentStaff.commune})</span><br><span class="text-[11px] text-slate-400 block mt-1">🔑 المهام: ${currentStaff.permissions}</span>`;
                }

                // Customize Welcome header text
                const welcomeTitle = document.querySelector(".text-right.space-y-1 span");
                if (welcomeTitle) welcomeTitle.innerText = `مرحباً بك عضواً في الكادر التنفيذي المعتمد`;

                // Customize complaints section header
                const complaintsHeader = document.querySelector(".p-6.bg-white.border h3");
                if (complaintsHeader) complaintsHeader.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red-500 ml-1"></i> مركز الشكاوى والبلاغات الجارية في (${currentStaff.wilaya})`;

                // Filter or customize stats slightly to reflect regional role
                const statsLabels = document.querySelectorAll(".grid-cols-2 p.text-[10px]");
                if (statsLabels.length >= 4) {
                    statsLabels[0].innerText = "المستخدمين النشطين بالولاية";
                    statsLabels[1].innerText = `مبيعات تجار ولاية ${currentStaff.wilaya}`;
                    statsLabels[2].innerText = `المحلات المعتمدة بـ ${currentStaff.wilaya}`;
                    statsLabels[3].innerText = "طلبيات التوصيل بالولاية";
                }
            }

            // Load users list using app.js function
            if (typeof renderManagerUsers === 'function') {
                renderManagerUsers();
            }
        }

        function managerTrackOrders() {
            const val = document.getElementById('managerSearchInput').value.trim().toLowerCase();
            const res = document.getElementById('manager-tracking-result');
            if (!val) {
                res.innerHTML = '';
                return;
            }
            // Search in local storage DB falls
            let orders = [];
            try {
                orders = JSON.parse(localStorage.getItem('DB_orders') || '[]');
            } catch(e) {}
            
            // Filter
            const filtered = orders.filter(o => {
                const id = (o.id || o.orderId || '').toLowerCase();
                const name = (o.customer || o.customerName || '').toLowerCase();
                const phone = o.phone || '';
                return id.includes(val) || name.includes(val) || phone.includes(val);
            });
            
            if (filtered.length > 0) {
                res.innerHTML = filtered.map(o => `
                    <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-right">
                        <div class="flex justify-between text-[11px]">
                            <span class="text-sky-600 font-bold">رقم الشحنة: #${(o.id || o.orderId || '').substring(0,8)}</span>
                            <span class="text-slate-500 font-bold">الولاية: ${o.wilaya || '69 الجزائر'}</span>
                        </div>
                        <p class="text-xs text-slate-800 font-bold"><strong>الزبون:</strong> ${o.customer || o.customerName || 'مشتري وفير'}</p>
                        <p class="text-xs text-slate-600"><strong>حالة الشحنة:</strong> ${o.status === 'delivered' ? '📦 تم التسليم كلياً' : '⏳ قيد الشحن والتوصيل المباشر'}</p>
                    </div>
                `).join('');
            } else {
                res.innerHTML = `
                    <div class="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center text-xs font-bold">
                        ⚠️ لا توجد شحنة مسجلة تطابق مدخلات البحث حالياً في سجلات المنصة.
                    </div>
                `;
            }
        }

        window.logoutUser = window.handleLogout = async function() {
            try {
                if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient.auth) {
                    await window.supabaseClient.auth.signOut().catch(() => {});
                } else if (typeof supabase !== 'undefined' && supabase.auth) {
                    await supabase.auth.signOut().catch(() => {});
                }
            } catch(e){}
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch(e){}
            window.location.replace('staff-login.html');
        };

        let isMobileMode = false;
        window.toggleResponsiveMode = function() {
            isMobileMode = !isMobileMode;
            const mainContainer = document.querySelector('main');
            const icon = document.getElementById('responsive-icon');
            if (!mainContainer || !icon) return;
            if (isMobileMode) {
                mainContainer.classList.remove('max-w-7xl');
                mainContainer.classList.add('max-w-md');
                mainContainer.style.borderLeft = '1px solid #e2e8f0';
                mainContainer.style.borderRight = '1px solid #e2e8f0';
                mainContainer.style.margin = '0 auto';
                mainContainer.style.backgroundColor = '#ffffff';
                icon.classList.remove('fa-mobile-screen-button');
                icon.classList.add('fa-desktop');
            } else {
                mainContainer.classList.remove('max-w-md');
                mainContainer.classList.add('max-w-7xl');
                mainContainer.style.borderLeft = 'none';
                mainContainer.style.borderRight = 'none';
                mainContainer.style.backgroundColor = 'transparent';
                icon.classList.remove('fa-desktop');
                icon.classList.add('fa-mobile-screen-button');
            }
        };
