// ZaLo Marketplace Smart Sync Update: 2026-07-16
// ZaLo Smart Marketplace - JavaScript Shared Engine (app.js)
// Implements 100% Client-Side Firestore Database Replica using localStorage
// Fully localized in Arabic with support for 69 Algerian Wilayas and custom Southern Municipalities

// --- Seed Databases ---
const SEED_MUNICIPALITIES = [
    { id: "el-menia", name: "بلدية المنيعة", image: "https://images.unsplash.com/photo-1547814181-79b8c08ecfe8?auto=format&fit=crop&w=600&q=80" },
    { id: "hassi-el-fhal", name: "بلدية حاسي الفحل", image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80" },
    { id: "hassi-gara", name: "بلدية حاسي القارة", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" }
];

const SEED_USERS = [
    { uid: "user_hadi", email: "zinzinochop@gmail.com", name: "الزبون الجزائري الذكي", phone: "0666112233", role: "customer", status: "ACTIVE" },
    { uid: "user_merchant", email: "merchant@zalo.dz", name: "أحمد بن زكري (تاجر السلام)", phone: "0555334455", role: "merchant", status: "ACTIVE" },
    { uid: "user_admin", email: "admin@zalo.dz", name: "مسؤول المراجعة والتدقيق", phone: "0770559988", role: "admin", status: "ACTIVE" },
    { uid: "user_manager", email: "manager@zalo.dz", name: "المدير العام للنظام", phone: "0660447711", role: "manager", status: "ACTIVE" }
];

const SEED_STORES = [];

const SEED_CATEGORIES = [
    { categoryId: "cat_phones", storeId: "store_salam", categoryName: "هواتف" },
    { categoryId: "cat_electronic", storeId: "store_salam", categoryName: "إلكترونيات" },
    { categoryId: "cat_parts", storeId: "store_salam", categoryName: "قطع غيار" },
    { categoryId: "cat_food", storeId: "store_salam", categoryName: "مواد غذائية" },
    { categoryId: "cat_clothes", storeId: "store_salam", categoryName: "ملابس" },
    { categoryId: "cat_services", storeId: "store_salam", categoryName: "خدمات" }
];

const SEED_PRODUCTS = [];

const SEED_ORDERS = [];

const SEED_MESSAGES = [];

// --- State Database Controller (Simulating Firestore Observers & Live Mutation) ---
class DB {
    static get(key, def) {
        let val = localStorage.getItem("zalo_" + key);
        if (!val) {
            localStorage.setItem("zalo_" + key, JSON.stringify(def));
            return def;
        }
        return JSON.parse(val);
    }
    static set(key, data) {
        localStorage.setItem("zalo_" + key, JSON.stringify(data));
    }
    static init() {
        this.get("users", SEED_USERS);
        this.get("municipalities", SEED_MUNICIPALITIES);
        this.get("stores", SEED_STORES);
        this.get("categories", SEED_CATEGORIES);
        this.get("products", SEED_PRODUCTS);
        this.get("orders", SEED_ORDERS);
        this.get("messages", SEED_MESSAGES);
        this.get("active_session", null);
        this.get("selected_municipality", "");
    }
}

DB.init();

// --- Auth Utilities ---
function getCurrentUser() {
    return DB.get("active_session", null);
}

function loginUser(email, password, role) {
    let users = DB.get("users", SEED_USERS);
    let user = users.find(u => u.email === email && u.role === role);
    if (!user) {
        let newUser = {
            uid: "user_" + Date.now(),
            email: email,
            name: email.split("@")[0],
            phone: "0555" + Math.floor(100000 + Math.random() * 900000),
            role: role,
            status: "ACTIVE"
        };
        users.push(newUser);
        DB.set("users", users);
        user = newUser;
    }
    DB.set("active_session", user);
    return user;
}

function logoutUser() {
    console.log("[ZaLo App] Logging out user and clearing all local/session storage...");
    
    // Clear all Supabase related keys in localStorage (starting with sb-)
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                localStorage.removeItem(key);
            }
        }
    } catch (e) {
        console.warn("Error clearing Supabase local storage keys:", e);
    }

    // Call Supabase signOut if available
    if (window.supabase && window.supabase.auth && typeof window.supabase.auth.signOut === 'function') {
        window.supabase.auth.signOut().catch(err => console.warn("Supabase signOut error:", err));
    }

    // Clear all LocalStorage session-related keys
    const keysToRemove = [
        'zalo_session_jwt', 'zalo_token',
        'zalo_user_role', 'zalo_role',
        'zalo_user_email', 'zalo_user_name',
        'zalo_active_session', 'user_email',
        'loggedInAdminEmail', 'loggedInAdminName',
        'nestjs_token', 'nestjs_user'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Clear all SessionStorage keys
    const sessionKeysToRemove = [
        'admin_logged_in_session', 'admin_security_unlocked',
        'zalo_admin_role', 'user_logged_in'
    ];
    sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));

    // Also clear our DB cache for active session
    if (typeof DB !== 'undefined' && DB.set) {
        DB.set("active_session", null);
    }
    
    window.location.href = "login.html";
}

function applySavedTheme() {
    let mode = localStorage.getItem("zalo_theme_mode") || "luxury";
    const rootEl = document.documentElement;
    if (mode === "skyblue") {
        rootEl.classList.add("theme-skyblue");
        document.body.style.backgroundColor = "#F5F5F5";
        document.body.style.color = "#333333";
    } else {
        rootEl.classList.remove("theme-skyblue");
        document.body.style.backgroundColor = "#0b1528";
        document.body.style.color = "#f3f4f6";
    }
}

function toggleThemeMode() {
    let currentMode = localStorage.getItem("zalo_theme_mode") || "luxury";
    let newMode = currentMode === "luxury" ? "skyblue" : "luxury";
    localStorage.setItem("zalo_theme_mode", newMode);
    applySavedTheme();
    location.reload();
}

const styleElem = document.createElement("style");
styleElem.innerHTML = `
:root {
    --color-primary: #00AEEF;
    --color-bg-light: #F5F5F5;
    --color-gold: #D4AF37;
}
.theme-skyblue .zalo-header {
    background-color: #FFFFFF !important;
    border-bottom: 1px solid #E5E7EB !important;
    color: #1F2937 !important;
}
.theme-skyblue .zalo-header h1 {
    color: #00AEEF !important;
}
.theme-skyblue .zalo-button-primary {
    background-color: #00AEEF !important;
    color: #FFFFFF !important;
}
.theme-skyblue .zalo-button-primary:hover {
    background-color: #008cc0 !important;
}
.theme-skyblue .zalo-card {
    background-color: #FFFFFF !important;
    border: 1px solid #E5E7EB !important;
    color: #1F2937 !important;
}
.theme-skyblue .zalo-text-gold {
    color: #D4AF37 !important;
}
`;
document.head.appendChild(styleElem);
applySavedTheme();


document.addEventListener("DOMContentLoaded", () => {
    let path = window.location.pathname;
    let file = path.substring(path.lastIndexOf('/') + 1);
    
    let accountNameSpan = document.getElementById("header-user-name");
    let currentUser = getCurrentUser();
    if (accountNameSpan && currentUser) {
        accountNameSpan.innerText = currentUser.name + ` (${getRoleArabic(currentUser.role)})`;
    }

    let toggleThemeBtn = document.getElementById("btn-toggle-theme");
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener("click", toggleThemeMode);
    }

    if (file === "" || file === "index.html") {
        initIndexPage();
    } else if (file === "login.html") {
        initLoginPage();
    } else if (file === "products.html") {
        initProductsPage();
    } else if (file === "product-details.html") {
        initProductDetailsPage();
    } else if (file === "dashboard-store.html") {
        initStoreDashboardPage();
    } else if (file === "dashboard-admin.html") {
        initAdminDashboardPage();
    } else if (file === "dashboard-manager.html") {
        initManagerDashboardPage();
    }
});

function getRoleArabic(role) {
    switch (role) {
        case "customer": return "زبون";
        case "merchant": return "تاجر";
        case "admin": return "إدارة";
        case "manager": return "مدير النظام";
        default: return role;
    }
}

function initIndexPage() {
    let btnShopNow = document.getElementById("btn-shop-now");
    let screenWelcome = document.getElementById("welcome-section");
    let screenMunicipalities = document.getElementById("municipalities-section");
    let screenStores = document.getElementById("stores-section");
    let screenCategories = document.getElementById("categories-section");

    if (screenMunicipalities) screenMunicipalities.style.display = "none";
    if (screenStores) screenStores.style.display = "none";
    if (screenCategories) screenCategories.style.display = "none";

    if (btnShopNow) {
        btnShopNow.addEventListener("click", () => {
            screenWelcome.style.display = "none";
            screenMunicipalities.style.display = "block";
            renderMunicipalitiesList();
        });
    }

    let activeMunId = localStorage.getItem("zalo_selected_municipality");
    if (activeMunId) {
        screenWelcome.style.display = "none";
        screenMunicipalities.style.display = "none";
        screenStores.style.display = "block";
        renderStoresList(activeMunId);
    }
}

function renderMunicipalitiesList() {
    let munListContainer = document.getElementById("municipalities-list");
    if (!munListContainer) return;

    munListContainer.innerHTML = "";
    let muns = DB.get("municipalities", SEED_MUNICIPALITIES);

    muns.forEach(m => {
        let card = document.createElement("div");
        card.className = "zalo-card bg-slate-800/50 border border-slate-700 rounded-3xl overflow-hidden cursor-pointer hover:border-zalo-gold hover:scale-105 transition duration-300 p-4 shrink-0 flex flex-col items-center justify-center space-y-4 shadow-xl";
        card.innerHTML = `
            <img src="${m.image}" class="w-full h-40 object-cover rounded-2xl" alt="${m.name}">
            <h3 class="text-xl font-black text-center text-white text-gold font-bold">${m.name}</h3>
        `;
        card.addEventListener("click", () => {
            localStorage.setItem("zalo_selected_municipality", m.id);
            document.getElementById("municipalities-section").style.display = "none";
            document.getElementById("stores-section").style.display = "block";
            renderStoresList(m.id);
        });
        munListContainer.appendChild(card);
    });
}

function renderStoresList(munId) {
    let storesContainer = document.getElementById("stores-list");
    let headerTitle = document.getElementById("stores-municipality-title");
    if (!storesContainer) return;

    storesContainer.innerHTML = "";
    let stores = DB.get("stores", SEED_STORES).filter(s => s.municipalityId === munId);
    
    let mun = DB.get("municipalities", SEED_MUNICIPALITIES).find(m => m.id === munId);
    if (headerTitle && mun) {
        headerTitle.innerText = mun.name;
    }

    if (stores.length === 0) {
        storesContainer.innerHTML = `
            <div class="col-span-full p-8 text-center text-slate-400">
                <i class="fa-solid fa-store-slash text-4xl mb-2"></i>
                <p>لا توجد متاجر نشطة في هذه البلدية حالياً.</p>
            </div>
        `;
        return;
    }

    stores.forEach(s => {
        let card = document.createElement("div");
        card.className = "zalo-card bg-slate-800/40 border border-slate-700/60 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-center gap-5";
        card.innerHTML = `
            <img src="${s.image}" class="w-24 h-24 object-cover rounded-2xl shrink-0" alt="${s.storeName}">
            <div class="text-right flex-1 space-y-1">
                <h4 class="text-lg font-black text-white font-bold">${s.storeName}</h4>
                <p class="text-xs text-slate-300"><i class="fa-solid fa-user-circle text-zalo-gold"></i> المسؤول: ${s.ownerName}</p>
                <p class="text-xs text-slate-300"><i class="fa-solid fa-phone text-blue-400"></i> هاتف: ${s.phone}</p>
                <p class="text-xs text-slate-400"><i class="fa-solid fa-location-dot text-red-400"></i> ${s.address}</p>
            </div>
            <button class="zalo-button-primary bg-gradient-to-tr from-amber-500 to-yellow-600 text-white font-bold text-xs px-5 py-3 rounded-full hover:to-amber-500 hover:scale-105 transition font-bold shrink-0 self-end sm:self-center">دخول المتجر <i class="fa-solid fa-arrow-left"></i></button>
        `;
        card.querySelector("button").addEventListener("click", () => {
            localStorage.setItem("zalo_current_store_id", s.storeId);
            document.getElementById("stores-section").style.display = "none";
            document.getElementById("categories-section").style.display = "block";
            renderCategoriesList(s.storeId);
        });
        storesContainer.appendChild(card);
    });
}

function renderCategoriesList(storeId) {
    let catsContainer = document.getElementById("categories-list");
    let headerStoreTitle = document.getElementById("categories-store-title");
    if (!catsContainer) return;

    catsContainer.innerHTML = "";
    
    let store = DB.get("stores", SEED_STORES).find(s => s.storeId === storeId);
    if (headerStoreTitle && store) {
        headerStoreTitle.innerText = store.storeName;
    }

    let cats = DB.get("categories", SEED_CATEGORIES);

    const catIcons = {
        "cat_phones": "fa-solid fa-mobile-screen-button",
        "cat_electronic": "fa-solid fa-laptop",
        "cat_parts": "fa-solid fa-car-rear",
        "cat_food": "fa-solid fa-basket-shopping",
        "cat_clothes": "fa-solid fa-shirt",
        "cat_services": "fa-solid fa-handshake"
    };

    cats.forEach(c => {
        let icon = catIcons[c.categoryId] || "fa-solid fa-box";
        let card = document.createElement("div");
        card.className = "zalo-card bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center shadow-lg hover:border-zalo-gold hover:scale-105 transition duration-200 cursor-pointer flex flex-col items-center justify-center space-y-3";
        card.innerHTML = `
            <div class="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center text-zalo-gold text-2xl shadow-inner">
                <i class="${icon}"></i>
            </div>
            <h5 class="text-base font-black text-white font-bold">${c.categoryName}</h5>
        `;
        card.addEventListener("click", () => {
            window.location.href = `products.html?storeId=${storeId}&categoryId=${c.categoryId}`;
        });
        catsContainer.appendChild(card);
    });
}

function resetSelection() {
    localStorage.removeItem("zalo_selected_municipality");
    localStorage.removeItem("zalo_current_store_id");
    location.reload();
}

function initLoginPage() {
    let form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        let email = document.getElementById("login-email").value.trim();
        let role = document.getElementById("login-role").value;
        let password = document.getElementById("login-password").value;

        if (!email || !password) {
            alert("يرجى إدخال جميع الحقول!");
            return;
        }

        let user = loginUser(email, password, role);
        if (user) {
            switch (role) {
                case "customer":
                    window.location.href = "customer-home.html";
                    break;
                case "merchant":
                    window.location.href = "dashboard-store.html";
                    break;
                case "admin":
                    window.location.href = "dashboard-admin.html";
                    break;
                case "manager":
                    window.location.href = "dashboard-admin.html";
                    break;
                default:
                    window.location.href = "customer-home.html";
            }
        }
    });
}

function initProductsPage() {
    let productsGrid = document.getElementById("products-grid");
    let headerTitle = document.getElementById("category-header-title");
    if (!productsGrid) return;

    let params = new URLSearchParams(window.location.search);
    let storeId = params.get("storeId");
    let catId = params.get("categoryId");
    let urlQuery = params.get("q");

    let cats = DB.get("categories", SEED_CATEGORIES);
    let chosenCat = cats.find(c => c.categoryId === catId);
    if (headerTitle) {
        if (chosenCat) {
            headerTitle.innerText = chosenCat.categoryName;
        } else if (urlQuery) {
            headerTitle.innerText = "نتائج البحث عن: " + urlQuery;
        } else {
            headerTitle.innerText = "كل المنتجات المتوفرة";
        }
    }

    // Pre-populate search query if passed from home screen
    const searchInp = document.getElementById("productSearchInp");
    if (searchInp && urlQuery) {
        searchInp.value = urlQuery;
    }

    let baseProducts = DB.get("products", SEED_PRODUCTS);
    if (storeId) {
        baseProducts = baseProducts.filter(p => p.storeId === storeId);
    }
    if (catId) {
        baseProducts = baseProducts.filter(p => p.categoryId === catId);
    }

    function renderFilteredProducts() {
        productsGrid.innerHTML = "";

        const searchQuery = (document.getElementById("productSearchInp")?.value || "").trim().toLowerCase();
        const sortValue = document.getElementById("productSortSel")?.value || "default";
        const stockValue = document.getElementById("productStockSel")?.value || "all";

        let filtered = [...baseProducts];

        // 1. Search filter
        if (searchQuery) {
            filtered = filtered.filter(p => 
                (p.productName || "").toLowerCase().includes(searchQuery) || 
                (p.description || "").toLowerCase().includes(searchQuery)
            );
        }

        // 2. Stock filter
        if (stockValue === "instock") {
            filtered = filtered.filter(p => (p.stock === undefined || p.stock > 0));
        }

        // 3. Sorting
        if (sortValue === "price-asc") {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortValue === "price-desc") {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sortValue === "name-asc") {
            filtered.sort((a, b) => (a.productName || "").localeCompare(b.productName || "", "ar"));
        } else if (sortValue === "rating-desc") {
            filtered.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
        } else if (sortValue === "date-desc") {
            filtered.sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (parseInt((a.productId || "").split('_')[1]) || 0);
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (parseInt((b.productId || "").split('_')[1]) || 0);
                return timeB - timeA;
            });
        }

        if (filtered.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full p-12 text-center text-slate-400 bg-slate-800/30 rounded-3xl border border-slate-700">
                    <i class="fa-solid fa-boxes-packing text-5xl text-slate-600 mb-3 block animate-bounce"></i>
                    <p class="font-bold">لا توجد منتجات مطابقة لخيارات الفلترة الحالية.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(p => {
            let card = document.createElement("div");
            card.className = "zalo-card bg-slate-800/50 border border-slate-700 rounded-3xl overflow-hidden p-4 shadow-xl flex flex-col h-full";
            card.innerHTML = `
                <img src="${p.images ? p.images[0] : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'}" class="w-full h-44 object-cover rounded-2xl shrink-0" alt="${p.productName}">
                <div class="py-3 flex-1 text-right flex flex-col justify-between">
                    <div>
                        <h5 class="text-base font-black text-white font-bold">${p.productName}</h5>
                        <p class="text-xs text-slate-400 mt-1 line-clamp-2">${p.description}</p>
                        ${p.stock !== undefined ? `<span class="text-[11px] font-bold mt-1 inline-block ${p.stock > 0 ? 'text-[#82e3a1]' : 'text-[#ff4d4d]'}">المخزون: ${p.stock} قطعة</span>` : ''}
                    </div>
                    <div class="mt-4 flex items-center justify-between border-t border-slate-700/50 pt-3">
                        <span class="text-base font-black text-zalo-gold font-bold">${p.price.toLocaleString()} دج</span>
                        <button class="bg-gradient-to-tr from-sky-400 to-sky-600 text-white font-bold text-xs px-4 py-2 rounded-full hover:from-sky-500 transition font-bold shadow-md">شراء المنتج</button>
                    </div>
                </div>
            `;
            card.querySelector("button").addEventListener("click", () => {
                window.location.href = `product-details.html?productId=${p.productId}`;
            });
            productsGrid.appendChild(card);
        });
    }

    // Attach listeners
    document.getElementById("productSearchInp")?.addEventListener("input", renderFilteredProducts);
    document.getElementById("productSortSel")?.addEventListener("change", renderFilteredProducts);
    document.getElementById("productStockSel")?.addEventListener("change", renderFilteredProducts);

    // Initial render
    renderFilteredProducts();
}

function initProductDetailsPage() {
    let params = new URLSearchParams(window.location.search);
    let prodId = params.get("productId");

    let products = DB.get("products", SEED_PRODUCTS);
    let p = products.find(prod => prod.productId === prodId);

    if (!p) {
        document.body.innerHTML = `<div class="p-12 text-center text-white"><p class="text-lg">المنتج غير موجود!</p><a href="index.html" class="text-zalo-gold">العودة للرئيسية</a></div>`;
        return;
    }

    let title = document.getElementById("product-detail-name");
    let price = document.getElementById("product-detail-price");
    let desc = document.getElementById("product-detail-desc");
    let storeName = document.getElementById("product-detail-store-name");
    let callBtn = document.getElementById("btn-call-merchant");
    let whatsappBtn = document.getElementById("btn-whatsapp-merchant");
    let mainImg = document.getElementById("product-detail-image");
    let thumbContainer = document.getElementById("product-detail-thumbs");

    let stores = DB.get("stores", SEED_STORES);
    let store = stores.find(s => s.storeId === p.storeId);

    if (title) title.innerText = p.productName;
    if (price) price.innerText = p.price.toLocaleString() + " دج";
    if (desc) desc.innerText = p.description;
    
    if (storeName && store) {
        storeName.innerText = store.storeName;
    }

    if (mainImg && p.images && p.images.length > 0) {
        mainImg.src = p.images[0];
    }

    if (thumbContainer && p.images && p.images.length > 1) {
        thumbContainer.innerHTML = "";
        p.images.forEach(imgUrl => {
            let thumb = document.createElement("img");
            thumb.src = imgUrl;
            thumb.className = "w-16 h-16 object-cover rounded-xl border border-slate-700 cursor-pointer hover:border-zalo-gold transition";
            thumb.addEventListener("click", () => {
                mainImg.src = imgUrl;
            });
            thumbContainer.appendChild(thumb);
        });
    }

    if (store) {
        if (callBtn) {
            callBtn.href = `tel:${store.phone}`;
        }
        if (whatsappBtn) {
            whatsappBtn.href = `https://wa.me/${store.phone.replace(/[^0-9]/g, '')}`;
        }
    }

    let orderBtn = document.getElementById("btn-submit-order");
    if (orderBtn) {
        orderBtn.addEventListener("click", () => {
            let paymentOption = document.getElementById("order-payment-method").value;
            let deliveryAddress = document.getElementById("order-address").value;

            if (!deliveryAddress) {
                alert("يرجى إدخال عنوان التوصيل داخل بلدية المنيعة أو الولايات المجاورة!");
                return;
            }

            let currentUser = getCurrentUser();
            let orders = DB.get("orders", SEED_ORDERS);
            
            let newOrder = {
                orderId: "ord_" + Date.now(),
                userId: currentUser ? currentUser.uid : "guest",
                storeId: p.storeId,
                productId: p.productId,
                status: "قيد المراجعة",
                total: p.price,
                qty: 1,
                paymentMethod: paymentOption,
                address: deliveryAddress,
                receiptImage: document.getElementById("order-receipt") ? document.getElementById("order-receipt").value : "",
                timestamp: Date.now()
            };

            orders.unshift(newOrder);
            DB.set("orders", orders);

            alert("تم إرسال طلب السلعة بنجاح! سيتم مراجعته والتواصل معك هاتفياً.");
            window.location.href = "index.html";
        });
    }
}

function initStoreDashboardPage() {
    renderMerchantProducts();
    renderMerchantOrders();

    let productForm = document.getElementById("add-product-form");
    if (productForm) {
        productForm.addEventListener("submit", (e) => {
            e.preventDefault();
            let name = document.getElementById("prod-name").value;
            let price = parseFloat(document.getElementById("prod-price").value);
            let desc = document.getElementById("prod-desc").value;
            let stock = parseInt(document.getElementById("prod-stock").value);
            let cat = document.getElementById("prod-category").value;

            let products = DB.get("products", SEED_PRODUCTS);
            let store = DB.get("stores", SEED_STORES).find(s => s.ownerName.includes("أحمد") || s.storeId === "store_salam");
            let storeId = store ? store.storeId : "store_salam";

            let newProduct = {
                productId: "prod_" + Date.now(),
                storeId: storeId,
                categoryId: cat,
                productName: name,
                price: price,
                description: desc,
                images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"],
                stock: stock
            };

            products.push(newProduct);
            DB.set("products", products);
            alert("تم إدراج المنتج بنجاح!");
            renderMerchantProducts();
            productForm.reset();
        });
    }
}

function renderMerchantProducts() {
    let list = document.getElementById("merchant-product-list");
    if (!list) return;

    list.innerHTML = "";
    let products = DB.get("products", SEED_PRODUCTS);
    let store = DB.get("stores", SEED_STORES).find(s => s.ownerName.includes("أحمد") || s.storeId === "store_salam");
    let storeId = store ? store.storeId : "store_salam";

    let merchantProds = products.filter(p => p.storeId === storeId);
    
    merchantProds.forEach(p => {
        let item = document.createElement("tr");
        item.className = "border-t border-slate-700/50 text-white font-semibold";
        item.innerHTML = `
            <td class="p-3 text-right">${p.productName}</td>
            <td class="p-3 text-right">${p.price.toLocaleString()} دج</td>
            <td class="p-3 text-right">${p.stock} قطعة</td>
            <td class="p-3 text-center">
                <button class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold font-bold" onclick="merchantDeleteProduct('${p.productId}')">حذف</button>
            </td>
        `;
        list.appendChild(item);
    });
}

window.merchantDeleteProduct = function(prodId) {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
        let products = DB.get("products", SEED_PRODUCTS);
        let updated = products.filter(p => p.productId !== prodId);
        DB.set("products", updated);
        renderMerchantProducts();
    }
}

function renderMerchantOrders() {
    let container = document.getElementById("merchant-orders-list");
    if (!container) return;

    container.innerHTML = "";
    let orders = DB.get("orders", SEED_ORDERS);
    let store = DB.get("stores", SEED_STORES).find(s => s.ownerName.includes("أحمد") || s.storeId === "store_salam");
    let storeId = store ? store.storeId : "store_salam";

    let storeOrders = orders.filter(o => o.storeId === storeId);

    if (storeOrders.length === 0) {
        container.innerHTML = `
            <div class="text-center p-6 text-slate-400">
                <p>لا توجد طلبات جارية لمتجرك.</p>
            </div>
        `;
        return;
    }

    let products = DB.get("products", SEED_PRODUCTS);

    storeOrders.forEach(o => {
        let p = products.find(prod => prod.productId === o.productId);
        let prodName = p ? p.productName : "منتج غير مسمى";
        let card = document.createElement("div");
        card.className = "bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 shadow-md text-right space-y-2";
        card.innerHTML = `
            <div class="flex justify-between items-center pb-2 border-b border-slate-700/40">
                <span class="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600 font-normal">رقم: ${o.orderId}</span>
                <span class="text-xs font-bold text-zalo-gold font-black">${o.status}</span>
            </div>
            <p class="text-sm font-bold text-white font-bold"><i class="fa-solid fa-cart-arrow-down text-sky-400"></i> المطلوبة: ${prodName}</p>
            <p class="text-xs text-slate-300"><i class="fa-solid fa-wallet text-zalo-gold"></i> القيمة الكلية: ${o.total.toLocaleString()} دج</p>
            <p class="text-xs text-slate-300"><i class="fa-solid fa-map-location-dot text-red-400"></i> المقاطعة: ${o.address}</p>
            <p class="text-xs text-slate-300"><i class="fa-solid fa-money-bill-transfer text-emerald-400"></i> نظام الدفع المحدد: ${o.paymentMethod || 'COD'}</p>
            
            <div class="flex gap-2 justify-end pt-2">
                <select class="bg-slate-700 border border-slate-600 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none" onchange="updateMerchantOrderStatus('${o.orderId}', this.value)">
                    <option value="">تحديث الحالة...</option>
                    <option value="قيد المراجعة">قيد المراجعة</option>
                    <option value="قيد الشحن">قيد الشحن</option>
                    <option value="تم التسليم">تم التسليم</option>
                    <option value="إلغاء المعاملة">إلغاء المعاملة</option>
                </select>
                <button class="bg-sky-500 hover:bg-sky-600 text-white text-xs px-4 py-1.5 rounded-xl font-bold font-bold" onclick="simulateMerchantChat('${o.userId}')">سؤال الزبون <i class="fa-regular fa-message"></i></button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.updateMerchantOrderStatus = function(orderId, val) {
    if (!val) return;
    let orders = DB.get("orders", SEED_ORDERS);
    let ord = orders.find(o => o.orderId === orderId);
    if (ord) {
        ord.status = val;
        DB.set("orders", orders);
        alert("تم تحديث حالة طلب الزبون بنجاح!");
        renderMerchantOrders();
    }
}

window.simulateMerchantChat = function(userId) {
    let msg = prompt("اكتب رسالة للزبون لمناقشة التوصيل ومطابقة الوثاق:");
    if (!msg) return;

    let msgs = DB.get("messages", SEED_MESSAGES);
    let newMsg = {
        messageId: "msg_" + Date.now(),
        senderId: "user_merchant",
        receiverId: userId,
        message: msg,
        timestamp: Date.now()
    };
    msgs.push(newMsg);
    DB.set("messages", msgs);
    alert("تم إرسال الرسالة بنجاح!");
}

function initAdminDashboardPage() {
    renderAdminStores();
}

function renderAdminStores() {
    let tbody = document.getElementById("admin-stores-list");
    if (!tbody) return;

    tbody.innerHTML = "";
    let stores = DB.get("stores", SEED_STORES);

    stores.forEach(s => {
        let stateText = s.status || "نشط";
        let stateBadge = stateText === "APPROVED" || stateText === "نشط" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30";
        let row = document.createElement("tr");
        row.className = "border-t border-slate-700/50 text-white font-semibold";
        row.innerHTML = `
            <td class="p-3 text-right">
                <div class="flex items-center gap-2">
                    <img src="${s.image}" class="w-10 h-10 object-cover rounded-lg shrink-0">
                    <div>
                        <p class="font-bold">${s.storeName}</p>
                        <p class="text-[10px] text-slate-400 font-normal line-clamp-1">${s.description}</p>
                    </div>
                </div>
            </td>
            <td class="p-3 text-right">${s.ownerName}</td>
            <td class="p-3 text-right">${s.phone}</td>
            <td class="p-3 text-right">
                <span class="text-xs px-2.5 py-1 rounded-full border ${stateBadge} font-bold">${stateText}</span>
            </td>
            <td class="p-3 text-center">
                <div class="flex gap-2 justify-center">
                    <button class="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold font-bold" onclick="approveStoreAdmin('${s.storeId}')">قبول</button>
                    <button class="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold font-bold" onclick="rejectStoreAdmin('${s.storeId}')">تعليق</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.approveStoreAdmin = function(storeId) {
    let stores = DB.get("stores", SEED_STORES);
    let s = stores.find(st => st.storeId === storeId);
    if (s) {
        s.status = "APPROVED";
        DB.set("stores", stores);
        alert("تمت الموافقة وتفعيل المتجر ليوجه الخدمات للزبائن!");
        renderAdminStores();
    }
}

window.rejectStoreAdmin = function(storeId) {
    let stores = DB.get("stores", SEED_STORES);
    let s = stores.find(st => st.storeId === storeId);
    if (s) {
        s.status = "SUSPENDED";
        DB.set("stores", stores);
        alert("تم تعليق المتجر وفرض قيود الرقابة.");
        renderAdminStores();
    }
}

function initManagerDashboardPage() {
    renderManagerUsers();
}

function renderManagerUsers() {
    let tbody = document.getElementById("manager-users-tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    let users = DB.get("users", SEED_USERS);

    users.forEach(u => {
        let statusBadge = u.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20";
        let row = document.createElement("tr");
        row.className = "border-t border-slate-700/50 text-white font-semibold";
        row.innerHTML = `
            <td class="p-3 text-right">
                <p class="font-bold">${u.name}</p>
                <p class="text-[10px] text-slate-400 font-normal">${u.email}</p>
            </td>
            <td class="p-3 text-right">${u.phone}</td>
            <td class="p-3 text-right">
                <span class="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-600 font-bold">${getRoleArabic(u.role)}</span>
            </td>
            <td class="p-3 text-right">
                <span class="text-xs px-2.5 py-1 rounded-full border ${statusBadge} font-bold">${u.status || 'ACTIVE'}</span>
            </td>
            <td class="p-3 text-center">
                <div class="flex gap-2 justify-center">
                    <button class="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] px-2.5 py-1 rounded-xl font-bold font-bold" onclick="changeUserRole('${u.uid}')">ترقية</button>
                    <button class="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2.5 py-1 rounded-xl font-bold font-bold" onclick="banUser('${u.uid}')">تعطيل</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.changeUserRole = function(uid) {
    let users = DB.get("users", SEED_USERS);
    let u = users.find(user => user.uid === uid);
    if (u) {
        let role = prompt("أدخل الدور الجديد (customer, merchant, admin, manager):", u.role);
        if (role) {
            u.role = role.trim();
            DB.set("users", users);
            alert("تم تغيير رتبة المستخدم وصلاحياته بنجاح!");
            renderManagerUsers();
        }
    }
}

window.banUser = function(uid) {
    let users = DB.get("users", SEED_USERS);
    let u = users.find(user => user.uid === uid);
    if (u) {
        u.status = u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
        DB.set("users", users);
        alert("تم تغيير حالة المستخدم بالمنصة بنجاح!");
        renderManagerUsers();
    }
}
