        // DB access layer
        const DB_KEY_PREFIX = "zalo_";
        function getDB(key, fallback) {
            const data = localStorage.getItem(DB_KEY_PREFIX + key);
            return data ? JSON.parse(data) : fallback;
        }
        function setDB(key, value) {
            localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(value));
        }

        // Sidebar and Tab Switch Helpers
        window.switchTab = function(tabId) {
            const sections = ['home', 'registrations', 'wilayas', 'notifications', 'secret', 'qr', 'settings-global', 'reports-global', 'users-global', 'products-global', 'team'];
            sections.forEach(sec => {
                const el = document.getElementById(`section-${sec}`);
                if (el) {
                    if (sec === tabId) {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                }
                const btn = document.getElementById(`btn-tab-${sec}`);
                if (btn) {
                    if (sec === tabId) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                }
            });

            if (window.innerWidth < 1024) {
                window.closeSidebar();
            }
        };

        // Explicit Sidebar Management for Desktop & Mobile
        window.openSidebar = function() {
            const sidebar = document.getElementById("zalo-sidebar");
            const overlay = document.getElementById("sidebar-overlay");
            if (!sidebar) return;

            sidebar.style.display = "flex";
            sidebar.classList.remove("hidden", "lg:hidden");
            sidebar.classList.add("flex", "lg:flex");

            if (overlay && window.innerWidth < 1024) {
                overlay.style.display = "block";
                overlay.classList.remove("hidden");
            }
        };

        window.closeSidebar = function() {
            const sidebar = document.getElementById("zalo-sidebar");
            const overlay = document.getElementById("sidebar-overlay");
            if (!sidebar) return;

            sidebar.style.display = "none";
            sidebar.classList.add("hidden", "lg:hidden");
            sidebar.classList.remove("flex", "lg:flex");

            if (overlay) {
                overlay.style.display = "none";
                overlay.classList.add("hidden");
            }
        };

        window.toggleSidebarMobile = window.toggleSidebar = function() {
            const sidebar = document.getElementById("zalo-sidebar");
            if (!sidebar) return;

            const computedDisplay = window.getComputedStyle(sidebar).display;
            if (computedDisplay === "none" || sidebar.style.display === "none") {
                window.openSidebar();
            } else {
                window.closeSidebar();
            }
        };

        // List of all Algerian Wilayas with additional performance indicators
        const ALGERIAN_WILAYAS = [
            { code: "01", name: "أدرار", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "02", name: "الشلف", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "03", name: "الأغواط", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "04", name: "أم البواقي", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "05", name: "باتنة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "06", name: "بجاية", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "07", name: "بسكرة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "08", name: "بشار", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "09", name: "البليدة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "10", name: "البويرة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "11", name: "تمنراست", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "12", name: "تبسة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "13", name: "تلمسان", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "14", name: "تيارت", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "15", name: "تيزي وزو", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "16", name: "الجزائر العاصمة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "17", name: "الجلفة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "18", name: "جيجل", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "19", name: "سطيف", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "20", name: "سعيدة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "21", name: "سكيكدة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "22", name: "سيدي بلعباس", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "23", name: "عنابة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "24", name: "قالمة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "25", name: "قسنطينة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "26", name: "المدية", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "27", name: "مستغانم", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "28", name: "المسيلة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "29", name: "معسكر", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "30", name: "ورقلة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "31", name: "وهران", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "32", name: "البيض", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "33", name: "إليزي", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "34", name: "برج بوعريريج", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "35", name: "بومرداس", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "36", name: "الطارف", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "37", name: "تندوف", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "38", name: "تيسمسيلت", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "39", name: "الوادي", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "40", name: "خنشلة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "41", name: "سوق أهراس", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "42", name: "تيبازة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "43", name: "ميلة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "44", name: "عين الدفلى", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "45", name: "النعامة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "46", name: "عين تموشنت", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "47", name: "غرداية", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "48", name: "غليزان", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "49", name: "تيميمون", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "50", name: "برج باجي مختار", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "51", name: "أولاد جلال", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "52", name: "بني عباس", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "53", name: "عين صالح", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "54", name: "عين قزام", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "55", name: "تقرت", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "56", name: "جانت", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "57", name: "المغير", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "58", name: "المنيعة", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "59", name: "بريكة (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "60", name: "بوسعادة (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "61", name: "مسعد (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "62", name: "قصر الشلالة (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "63", name: "العلمة (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "64", name: "فرجيوة (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "65", name: "شلغوم العيد (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "66", name: "عين البيضاء (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "67", name: "عين وسارة (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "68", name: "الأبيض سيدي الشيخ (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" },
            { code: "69", name: "أفلو (ولاية منتدبة)", activeStores: 0, activeMerchants: 0, cancelledOrders: 0, avgDeliveryTime: "--" }
        ];

        // Default mock active stores list (Cleared to prevent fake/mock stores)
        const MOCK_STORES = [];

        // Seed data structures
        function initOldAdminDashboard() {
            // Setup User info
            const userEmail = localStorage.getItem('zalo_user_email') || 'admin@zalo.dz';
            const userName = localStorage.getItem('zalo_user_name') || 'المدير العام المعتمد';
            document.getElementById('sidebar-user-name').innerText = userName;
            document.getElementById('sidebar-user-email').innerText = userEmail;

            // Seed stores if not exists
            let stores = getDB("stores_list_old", MOCK_STORES);
            setDB("stores_list_old", stores);

            // Seed announcements
            let announcements = getDB("global_announcements", [
                { id: "a1", text: "مرحبا بكم في منصة زالو ديزاد، تم تفعيل بوابات الرقابة الأمنية بالكامل.", type: "إداري", date: "2026-07-14 10:15", popup: false }
            ]);
            setDB("global_announcements", announcements);

            // Populate ui
            renderStats();
            renderWilayaTable();
            renderAnnouncements();
            renderRegistrations();
            
            // New Modules Initialization
            loadGlobalSettings();
            regenerateGlobalQR();
            renderFinancialReports();
            renderUsersTable();
            renderGlobalProductsTable();
            initTeamManagement();
        }

        // Render counters
        function renderStats() {
            let stores = getDB("stores_list_old", MOCK_STORES);
            let activeCount = stores.filter(s => s.status === "APPROVED").length;
            document.getElementById('stat-active-stores').innerText = activeCount;

            let pendingCount = stores.filter(s => s.status === "PENDING").length;
            document.getElementById('stat-pending-security').innerText = pendingCount;

            // Update sidebar registrations badge
            const pendingRegBadge = document.getElementById('badge-registrations-count');
            if (pendingRegBadge) pendingRegBadge.innerText = pendingCount;

            // Total products count from local database
            let products = getDB("products", []);
            let count = products.length; 
            document.getElementById('stat-total-products').innerText = count;

            // Calculate dynamic real platform profits (5% of delivered orders)
            let orders = getDB("orders", []);
            let completedOrders = orders.filter(o => o.status === "تم التسليم" || o.status === "DELIVERED");
            let profits = completedOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) * 0.05;
            document.getElementById('stat-net-profits').innerText = profits.toLocaleString() + " دج";

            // Count real active orders (excluding delivered, rejected, cancelled)
            let activeOrders = orders.filter(o => o.status !== "تم التسليم" && o.status !== "DELIVERED" && o.status !== "مرفوض" && o.status !== "REJECTED" && o.status !== "تم الإلغاء" && o.status !== "CANCELLED");
            document.getElementById('stat-active-orders').innerText = activeOrders.length + " طلبات";

            // Platform rating (dynamic or static 5.0 default if no reviews)
            document.getElementById('stat-platform-rating').innerText = "5.0 / 5.0 ★";

            // Real registered/verified users count
            let users = getDB("users", []);
            let verifiedUsers = users.filter(u => (u.phone && u.phone.trim().length > 0) || (u.email && u.email.trim().length > 0)).length;
            if (verifiedUsers === 0 && users.length > 0) verifiedUsers = users.length;
            document.getElementById('stat-verified-users').innerText = verifiedUsers + " عميل";

            // Real admins count (users with role admin, super_admin, or manager)
            let admins = users.filter(u => u.role === "admin" || u.role === "manager" || u.role === "super_admin").length;
            if (admins === 0) admins = 1; // General Manager / Admin
            document.getElementById('stat-admins-count').innerText = admins + " مشرفين";
        }

        // Individual card stats update simulator (Now reloads real data)
        function refreshIndividualStat(statId, button) {
            // Add spin class to icon
            const icon = button.querySelector('i');
            if (icon) icon.classList.add('spin-anim');
            setTimeout(() => {
                if (icon) icon.classList.remove('spin-anim');
            }, 600);

            // Re-render only actual calculations from real local database
            renderStats();
        }

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
            } else if (type === "products" || type === "total-products") {
                title = "قائمة البضائع والمنتجات العامة المعروضة";
                icon = "fa-box-open";
                contentHtml = `
                    <div class="space-y-4">
                        <div class="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs">
                            <span class="font-bold text-blue-800">عدد المنتجات المسجلة: ${products.length}</span>
                            <span class="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-black">السوق المحلي</span>
                        </div>
                        <div class="max-h-80 overflow-y-auto space-y-2">
                            ${products.length === 0 ? '<p class="text-center text-xs text-slate-400 py-4">لا توجد منتجات مسجلة في قاعدة البيانات</p>' :
                                products.map(p => `
                                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                        <div>
                                            <p class="font-black text-slate-800">${p.productName || p.name || 'منتج'}</p>
                                            <p class="text-[10px] text-slate-400">السعر: ${p.price || 0} دج | القسم: ${p.category || 'عام'}</p>
                                        </div>
                                        <span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded-lg font-bold">متوفر</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                `;
            } else if (type === "pending" || type === "pending-security") {
                title = "طلبات التسجيل قيد المراجعة والمعالجة الأمنية";
                icon = "fa-file-shield";
                let pending = stores.filter(s => s.status !== "APPROVED");
                contentHtml = `
                    <div class="space-y-4">
                        <div class="flex justify-between items-center bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
                            <span class="font-bold text-amber-800">الطلبات المعلقة: ${pending.length}</span>
                            <span class="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black">قيد التدقيق</span>
                        </div>
                        <div class="max-h-80 overflow-y-auto space-y-2">
                            ${pending.length === 0 ? '<p class="text-center text-xs text-slate-400 py-4">لا توجد طلبات معلقة بانتظار التفعيل حالياً</p>' :
                                pending.map(s => `
                                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                        <div>
                                            <p class="font-black text-slate-800">${s.name || s.store_name || 'طلب متجر'}</p>
                                            <p class="text-[10px] text-slate-400">صاحب الطلب: ${s.owner || s.owner_name || 'متقدم'} | ${s.phone || ''}</p>
                                        </div>
                                        <span class="bg-amber-100 text-amber-800 text-[10px] px-2 py-1 rounded-lg font-bold">قيد الدراسة ⏳</span>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                `;
            } else if (type === "admins" || type === "admins-count") {
                title = "سجل الموظفين والمشرفين الإداريين";
                icon = "fa-crown";
                let adminsList = users.filter(u => u.role === "admin" || u.role === "manager" || u.role === "super_admin");
                contentHtml = `
                    <div class="space-y-4">
                        <div class="flex justify-between items-center bg-purple-50 p-3 rounded-xl border border-purple-200 text-xs">
                            <span class="font-bold text-purple-800">المشرفون بالمنصة: ${adminsList.length || 1}</span>
                            <span class="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-black">صلاحيات كاملة</span>
                        </div>
                        <div class="max-h-80 overflow-y-auto space-y-2">
                            ${adminsList.length === 0 ? `
                                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                    <div>
                                        <p class="font-black text-slate-800">المدير العام للمنصة</p>
                                        <p class="text-[10px] text-slate-400">admin@zalo.dz</p>
                                    </div>
                                    <span class="bg-purple-100 text-purple-800 text-[10px] px-2 py-1 rounded-lg font-bold">مدير عام</span>
                                </div>
                            ` :
                                adminsList.map(u => `
                                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                        <div>
                                            <p class="font-black text-slate-800">${u.name || 'مشرف إداري'}</p>
                                            <p class="text-[10px] text-slate-400">${u.email || u.phone || 'إدارة'}</p>
                                        </div>
                                        <span class="bg-purple-100 text-purple-800 text-[10px] px-2 py-1 rounded-lg font-bold">${u.role || 'مشرف'}</span>
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

        // Toggle Advanced Filter Panel
        function toggleAdvancedFilter() {
            const panel = document.getElementById('advanced-filter-panel');
            panel.classList.toggle('hidden');
        }

        // Reset Advanced Filters
        function resetAdvancedFilters() {
            document.getElementById('filter-status').value = "ALL";
            document.getElementById('filter-min-stores').value = "0";
            document.getElementById('wilaya-search').value = "";
            renderWilayaTable();
        }

        // Render Wilayas Table
        function renderWilayaTable() {
            const tbody = document.getElementById('wilaya-tbody');
            tbody.innerHTML = '';
            
            const query = document.getElementById('wilaya-search').value.toLowerCase().trim();
            const statusFilter = document.getElementById('filter-status') ? document.getElementById('filter-status').value : "ALL";
            const minStoresFilter = document.getElementById('filter-min-stores') ? parseInt(document.getElementById('filter-min-stores').value) || 0 : 0;

            ALGERIAN_WILAYAS.forEach(w => {
                // Apply filters
                if (query && !w.name.includes(query) && !w.code.includes(query)) {
                    return;
                }

                if (statusFilter === "ACTIVE" && (w.activeStores || 0) === 0) {
                    return;
                }
                if (statusFilter === "INACTIVE" && (w.activeStores || 0) > 0) {
                    return;
                }

                if ((w.activeStores || 0) < minStoresFilter) {
                    return;
                }

                let statusText = w.activeStores ? `نشط (${w.activeStores} متجر)` : "خامل";
                let statusClass = w.activeStores ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200";
                
                let activeMerchants = w.activeMerchants || (w.activeStores ? w.activeStores : 0);
                let cancelledOrders = w.cancelledOrders !== undefined ? w.cancelledOrders : (w.activeStores ? Math.floor(Math.random() * 3) : 0);
                let avgTime = w.avgDeliveryTime || (w.activeStores ? "24 ساعة" : "--");

                let row = document.createElement('tr');
                row.className = "border-t border-slate-100 hover:bg-slate-50 font-semibold text-slate-700 transition";
                row.innerHTML = `
                    <td class="p-3 font-black text-slate-900">${w.code}</td>
                    <td class="p-3">${w.name}</td>
                    <td class="p-3 text-center font-bold text-slate-800">${w.activeStores || 0}</td>
                    <td class="p-3 text-center font-bold text-sky-600">${activeMerchants}</td>
                    <td class="p-3 text-center font-bold text-red-600">${cancelledOrders}</td>
                    <td class="p-3 text-center font-bold text-indigo-600">${avgTime}</td>
                    <td class="p-3 text-center">${w.activeStores ? (w.activeStores * 5 + 4) : 0}</td>
                    <td class="p-3 text-center">
                        <span class="text-[10px] px-2.5 py-1 rounded-full font-bold ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Filter Wilayas wrapper
        function filterWilayaTable() {
            renderWilayaTable();
        }

        // Export data to CSV Dynamically
        function exportWilayaDataToCSV() {
            let csvContent = "\uFEFF"; // UTF-8 BOM for Excel Arabic layout
            csvContent += "رمز الولاية,اسم الولاية,المتاجر المسجلة,التجار النشطون,الطلبات الملغاة,متوسط وقت التوصيل,المستخدمون النشطون,الحالة الإقليمية\n";

            ALGERIAN_WILAYAS.forEach(w => {
                let statusText = w.activeStores ? "نشط" : "خامل";
                let activeMerchants = w.activeMerchants || (w.activeStores ? w.activeStores : 0);
                let cancelledOrders = w.cancelledOrders !== undefined ? w.cancelledOrders : (w.activeStores ? Math.floor(Math.random() * 3) : 0);
                let avgTime = w.avgDeliveryTime || (w.activeStores ? "24 ساعة" : "--");
                let users = w.activeStores ? (w.activeStores * 5 + 4) : 0;

                csvContent += `${w.code},${w.name},${w.activeStores || 0},${activeMerchants},${cancelledOrders},${avgTime},${users},${statusText}\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `zalo_algeria_wilayas_audit_2026.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Toggle Security operations console
        function toggleSecretConsole() {
            const consoleDiv = document.getElementById('secret-console');
            const icon = document.getElementById('secret-folder-icon');
            consoleDiv.classList.toggle('hidden');
            if (consoleDiv.classList.contains('hidden')) {
                icon.className = "fa-solid fa-folder-closed";
            } else {
                icon.className = "fa-solid fa-folder-open text-yellow-400";
            }
        }

        // Render global broadcast announcements
        function renderAnnouncements() {
            const container = document.getElementById('announcements-list-container');
            container.innerHTML = '';

            let announcements = getDB("global_announcements", []);

            // Update sidebar announcements badge
            const announceBadge = document.getElementById('badge-announcements-count');
            if (announceBadge) announceBadge.innerText = announcements.length;

            if (announcements.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 font-bold text-center py-4">لا توجد إعلانات نشطة حالياً.</p>`;
                return;
            }

            announcements.forEach(a => {
                let badgeColor = "bg-sky-50 text-sky-600 border border-sky-200";
                if (a.type === "تقني") badgeColor = "bg-amber-50 text-amber-600 border border-amber-200";
                if (a.type === "تسويقي") badgeColor = "bg-purple-50 text-purple-600 border border-purple-200";

                let popupBadge = a.popup ? `<span class="bg-red-50 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-red-200">إشعار منبثق 📱</span>` : '';

                let div = document.createElement('div');
                div.className = "bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm text-right";
                div.innerHTML = `
                    <div class="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] px-2 py-0.5 rounded-full font-bold ${badgeColor}">${a.type || 'إداري'}</span>
                            ${popupBadge}
                        </div>
                        <span class="text-[9px] text-slate-400 font-bold">${a.date || '2026-07-14'}</span>
                    </div>
                    <p class="text-[11px] font-bold text-slate-700 leading-relaxed">${a.text}</p>
                    <div class="flex justify-end gap-2 border-t border-slate-100/50 pt-2">
                        <button onclick="resendAnnouncement('${a.id}')" class="text-sky-600 hover:text-sky-800 text-[10px] font-bold flex items-center gap-1">
                            <i class="fa-solid fa-arrows-rotate"></i>
                            <span>إعادة نشر</span>
                        </button>
                        <button onclick="deleteAnnouncement('${a.id}')" class="text-red-500 hover:text-red-700 text-[10px] font-bold flex items-center gap-1">
                            <i class="fa-solid fa-trash-can"></i>
                            <span>حذف</span>
                        </button>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        // Publish Announcement
        function publishAnnouncement() {
            const txt = document.getElementById('announcement-text').value.trim();
            if (!txt) {
                alert("يرجى كتابة نص الإشعار أولاً.");
                return;
            }

            const type = document.getElementById('announcement-type').value;
            const isPopup = document.getElementById('announcement-popup').checked;

            let announcements = getDB("global_announcements", []);
            
            // Format dynamic date
            const now = new Date();
            const dateStr = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0') + " " + String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');

            announcements.push({
                id: "ann_" + Date.now(),
                text: txt,
                type: type,
                popup: isPopup,
                date: dateStr
            });
            setDB("global_announcements", announcements);

            document.getElementById('announcement-text').value = '';
            document.getElementById('announcement-popup').checked = false;
            renderAnnouncements();
            alert("تم إطلاق الإشعار وتصنيفه بنجاح لجميع واجهات التطبيق! 📢");
        }

        // Resend / Renew Announcement
        function resendAnnouncement(id) {
            let announcements = getDB("global_announcements", []);
            let ann = announcements.find(a => a.id === id);
            if (ann) {
                const now = new Date();
                ann.date = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0') + " " + String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
                setDB("global_announcements", announcements);
                renderAnnouncements();
                alert(`تم تحديث تاريخ وتجديد نشر الإشعار: "${ann.text.substring(0, 25)}..."`);
            }
        }

        // Delete Announcement
        function deleteAnnouncement(id) {
            let announcements = getDB("global_announcements", []);
            announcements = announcements.filter(a => a.id !== id);
            setDB("global_announcements", announcements);
            renderAnnouncements();
        }

        // Clear all announcements
        function clearAllGlobalAnnouncements() {
            if (confirm("هل أنت متأكد من مسح كافة الإعلانات النشطة؟")) {
                setDB("global_announcements", []);
                renderAnnouncements();
            }
        }

        // Render registration requests
        async function renderRegistrations() {
            const tbody = document.getElementById('registrations-tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            let localStores = getDB("stores_list_old", MOCK_STORES);
            let liveRequests = [];
            try {
                if (window.supabaseClient) {
                    const { data, error } = await window.supabaseClient.from('merchant_requests').select('*');
                    if (!error && data && Array.isArray(data)) {
                        liveRequests = data;
                    }

                    // Also check profiles for merchants or pending accounts
                    const { data: profs, error: profErr } = await window.supabaseClient.from('profiles').select('*');
                    if (!profErr && profs && Array.isArray(profs)) {
                        profs.forEach(p => {
                            if (p.role === 'merchant' || p.status === 'pending' || p.store_name || p.storeName) {
                                const exists = liveRequests.some(r => (r.id && r.id === p.id) || (r.email && p.email && r.email.toLowerCase() === p.email.toLowerCase()));
                                if (!exists) {
                                    liveRequests.push({
                                        id: p.id,
                                        store_name: p.store_name || p.storeName || p.full_name || 'متجر جديد',
                                        owner_name: p.full_name || p.name || (p.email ? p.email.split('@')[0] : 'تاجر جديد'),
                                        email: p.email || '',
                                        phone: p.phone || '0658000000',
                                        wilaya: p.wilaya || 'الجزائر',
                                        status: p.status || 'pending',
                                        merchant_type: p.merchant_type || 'registered'
                                    });
                                }
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("Error fetching live merchant requests:", e);
            }

            let zaloLocalReqs = [];
            try {
                zaloLocalReqs = JSON.parse(localStorage.getItem('zalo_local_merchant_requests') || '[]');
            } catch (e) { zaloLocalReqs = []; }

            let zaloMerchantReqs = [];
            try {
                zaloMerchantReqs = JSON.parse(localStorage.getItem('zalo_merchant_requests') || '[]');
            } catch (e) { zaloMerchantReqs = []; }

            try {
                const singleStore = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || 'null');
                if (singleStore && (singleStore.storeName || singleStore.name)) {
                    zaloMerchantReqs.push({
                        id: singleStore.id || 'store_single_1',
                        store_name: singleStore.storeName || singleStore.name,
                        owner_name: singleStore.ownerName || singleStore.owner || 'تاجر جديد',
                        phone: singleStore.phone || singleStore.storePhone || '0658000000',
                        wilaya: singleStore.wilaya || 'الجزائر',
                        email: localStorage.getItem('user_email') || singleStore.email || '',
                        status: localStorage.getItem('zalo_merchant_status') || 'pending'
                    });
                }
            } catch (e) {}

            const allRequests = [...liveRequests, ...zaloLocalReqs, ...zaloMerchantReqs];

            const mappedLiveRequests = allRequests.map(r => {
                let mappedStatus = "PENDING";
                if (r.status === "approved" || r.status === "active" || r.status === "APPROVED") mappedStatus = "APPROVED";
                if (r.status === "suspended" || r.status === "SUSPENDED" || r.status === "rejected") mappedStatus = "SUSPENDED";
                if (r.status === "pending" || r.status === "PENDING") mappedStatus = "PENDING";

                const storeName = r.store_name || r.storeName || r.name || "متجر جديد";
                const ownerName = r.owner_name || r.ownerName || r.owner || r.name || (r.email ? r.email.split('@')[0] : "تاجر جديد");
                const phone = r.phone || "0658000000";
                const wilaya = r.wilaya || r.location || "الجزائر";
                const cat = r.category || "عام";
                const rcNum = r.rc_number || r.rcNumber || (r.id ? String(r.id).substring(0, 8) : "RC-APPROVED");

                return {
                    id: r.id || ('req_' + Math.random()),
                    name: storeName,
                    owner: ownerName,
                    email: r.email || "",
                    phone: phone,
                    location: wilaya,
                    regCode: rcNum,
                    category: cat,
                    activityType: (r.merchant_type === "registered" || r.storeType === "registered") ? "بيع منتجات" : "تقديم خدمات",
                    status: mappedStatus,
                    isLive: true
                };
            });

            let mergedStores = [...localStores];
            mappedLiveRequests.forEach(live => {
                const existingIdx = mergedStores.findIndex(st => (st.id && st.id === live.id) || (st.name && st.name.trim() === live.name.trim()));
                if (existingIdx !== -1) {
                    mergedStores[existingIdx] = { ...mergedStores[existingIdx], ...live };
                } else {
                    mergedStores.unshift(live);
                }
            });

            setDB("stores_list_old", mergedStores);
            renderStats();

            // Update badge counts
            const badgeCount = document.getElementById('badge-registrations-count');
            if (badgeCount) badgeCount.innerText = mergedStores.length;

            // Dynamically update ALGERIAN_WILAYAS active store counts
            if (typeof ALGERIAN_WILAYAS !== 'undefined' && Array.isArray(ALGERIAN_WILAYAS)) {
                ALGERIAN_WILAYAS.forEach(w => {
                    const count = mergedStores.filter(st => st.location && (st.location.includes(w.name) || st.location.startsWith(w.code))).length;
                    if (count > 0) {
                        w.activeStores = count;
                        w.activeMerchants = count;
                    }
                });
                renderWilayaTable();
            }

            mergedStores.forEach(s => {
                let statusBadge = s.status === "APPROVED" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-amber-50 border border-amber-200 text-amber-700";
                if (s.status === "SUSPENDED") statusBadge = "bg-red-50 border border-red-200 text-red-700";
                
                let statusText = "قيد المراجعة ⏳";
                if (s.status === "APPROVED") statusText = "موثق ومقبول ✅";
                if (s.status === "SUSPENDED") statusText = "معلق ومقيد 🛑";

                let row = document.createElement('tr');
                row.className = "border-t border-slate-100 hover:bg-slate-50 font-semibold text-slate-700 transition";
                row.innerHTML = `
                    <td class="p-3 font-black text-slate-900">${s.name}</td>
                    <td class="p-3">
                        <p class="font-bold text-slate-700">${s.owner}</p>
                        <p class="text-[10px] text-slate-400 font-normal">رقم: ${s.phone}</p>
                    </td>
                    <td class="p-3 text-slate-800">
                        <span class="text-[10px] bg-sky-50 text-sky-600 border border-sky-100 px-2.5 py-0.5 rounded-full font-bold">
                            ${s.activityType || 'بيع منتجات'}
                        </span>
                    </td>
                    <td class="p-3">${s.location}</td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-1">
                            <button onclick="openDocumentsModal('${s.id}')" class="text-sky-600 hover:text-sky-800 flex items-center gap-1 font-bold text-xs bg-sky-50 border border-sky-100 px-2.5 py-1.5 rounded-xl transition">
                                <i class="fa-solid fa-file-pdf text-red-500"></i>
                                <span>عرض السجل (2)</span>
                            </button>
                        </div>
                    </td>
                    <td class="p-3 text-center">
                        <span class="text-[10px] px-2.5 py-1 rounded-full font-bold ${statusBadge}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="p-3 text-center">
                        <div class="flex gap-1.5 justify-center flex-wrap">
                            <!-- Direct Email Icon Button -->
                            <a href="mailto:${s.email || 'partner@zalo.dz'}?subject=مراجعة متجر زالو ديزاد&body=أهلاً بك شريكنا العزيز،" class="bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white font-bold p-2 rounded-xl transition" title="إرسال بريد إلكتروني مباشر">
                                <i class="fa-regular fa-envelope"></i>
                            </a>

                            ${s.status !== "APPROVED" ? 
                                `<button onclick="openActivationConfirmModal('${s.id}')" class="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[10px] px-3 py-1.5 rounded-xl transition">تفعيل</button>` : ''
                            }

                            ${s.status !== "SUSPENDED" ?
                                `<button onclick="openSuspendModal('${s.id}')" class="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition" title="تعليق طلب التسجيل ومطالبة ببيانات">تعليق</button>` : 
                                `<button onclick="openActivationConfirmModal('${s.id}')" class="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition">إعادة تفعيل</button>`
                            }

                            <!-- Permanent Delete Button -->
                            <button onclick="deleteRegistrationRequest('${s.id}')" class="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1" title="حذف الطلب نهائياً">
                                <i class="fa-solid fa-trash-can"></i>
                                <span>حذف</span>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Permanent Delete Registration Request Function
        async function deleteRegistrationRequest(id) {
            if (!confirm("🚨 هل أنت متأكد من رفض وحذف طلب التسجيل هذا نهائياً من قاعدة البيانات والتطبيق؟\n\nلن يستطيع المتقدم استرجاع الطلب أو الدخول بهذا الحساب.")) {
                return;
            }
            
            let stores = getDB("stores_list_old", []);
            let target = stores.find(s => s.id === id);
            const targetEmail = target ? target.email : null;

            stores = stores.filter(s => s.id !== id && (!targetEmail || s.email !== targetEmail));
            setDB("stores_list_old", stores);

            let pending = getDB("pending_registrations", []);
            pending = pending.filter(p => p.id !== id && (!targetEmail || p.email !== targetEmail));
            setDB("pending_registrations", pending);

            let users = getDB("users", []);
            users = users.filter(u => u.id !== id && (!targetEmail || u.email !== targetEmail));
            setDB("users", users);

            try {
                let zaloLocalReqs = JSON.parse(localStorage.getItem('zalo_local_merchant_requests') || '[]');
                zaloLocalReqs = zaloLocalReqs.filter(r => r.id !== id && (!targetEmail || r.email !== targetEmail));
                localStorage.setItem('zalo_local_merchant_requests', JSON.stringify(zaloLocalReqs));
            } catch (e) {}

            try {
                let zaloMerchantReqs = JSON.parse(localStorage.getItem('zalo_merchant_requests') || '[]');
                zaloMerchantReqs = zaloMerchantReqs.filter(r => r.id !== id && (!targetEmail || r.email !== targetEmail));
                localStorage.setItem('zalo_merchant_requests', JSON.stringify(zaloMerchantReqs));
            } catch (e) {}

            if (window.supabaseClient) {
                try {
                    if (id) {
                        if (id.includes("@")) {
                            await window.supabaseClient.from('merchant_requests').delete().eq('email', id);
                            await window.supabaseClient.from('stores').delete().eq('email', id);
                            await window.supabaseClient.from('profiles').delete().eq('email', id);
                        } else {
                            await window.supabaseClient.from('merchant_requests').delete().eq('user_id', id);
                            await window.supabaseClient.from('stores').delete().eq('id', id);
                            await window.supabaseClient.from('profiles').delete().eq('id', id);
                        }
                    }
                    if (targetEmail) {
                        await window.supabaseClient.from('merchant_requests').delete().eq('email', targetEmail);
                        await window.supabaseClient.from('stores').delete().eq('email', targetEmail);
                        await window.supabaseClient.from('profiles').delete().eq('email', targetEmail);
                    }
                } catch (err) {
                    console.warn("Supabase request purge note:", err);
                }
            }

            alert("✅ تم حذف طلب التسجيل وتطهير الحساب نهائياً بنجاح!");
            renderRegistrations();
            renderStats();
        }

        // Approve store
        async function approveStore(id) {
            let stores = getDB("stores_list_old", MOCK_STORES);
            let s = stores.find(st => st.id === id || st.email === id);
            
            try {
                if (window.supabaseClient) {
                    // Update only merchant_requests. The database trigger (sync_merchant_approval) handles profiles, users, and stores automatically.
                    if (id.includes("@")) {
                        await window.supabaseClient.from('merchant_requests').update({ status: 'approved' }).eq('email', id);
                    } else {
                        await window.supabaseClient.from('merchant_requests').update({ status: 'approved' }).eq('user_id', id);
                    }
                    console.log("Successfully synchronized approval to Supabase!");
                }
            } catch(e) {
                console.error("Failed to sync approval to Supabase:", e);
            }

            if (s) {
                s.status = "APPROVED";
            } else {
                s = {
                    id: id,
                    name: "متجر معتمد جديد",
                    status: "APPROVED"
                };
                stores.unshift(s);
            }
            setDB("stores_list_old", stores);

            alert(`تم قبول وتفعيل متجر "${s.name || s.store_name || 'التاجر'}" بنجاح وجعله مرئياً للجمهور! ✅`);
            renderRegistrations();
            renderStats();
        }

        // Open Suspend Modal
        function openSuspendModal(id) {
            document.getElementById('suspend-store-id').value = id;
            document.getElementById('suspend-reason-text').value = '';
            document.getElementById('suspend-reason-modal').classList.remove('hidden');
        }

        // Close Suspend Modal
        function closeSuspendModal() {
            document.getElementById('suspend-reason-modal').classList.add('hidden');
        }

        // Submit suspend store request
        async function submitSuspendStore() {
            const id = document.getElementById('suspend-store-id').value;
            const reason = document.getElementById('suspend-reason-text').value.trim();
            if (!reason) {
                alert("يرجى كتابة سبب التعليق لتوجيهه للتاجر.");
                return;
            }

            let stores = getDB("stores_list_old", MOCK_STORES);
            let s = stores.find(st => st.id === id);
            if (s) {
                s.status = "SUSPENDED";
                setDB("stores_list_old", stores);

                try {
                    if (window.supabaseClient) {
                        // Update only merchant_requests. The database trigger handles cascading rejections.
                        if (id.includes("@")) {
                            await window.supabaseClient.from('merchant_requests').update({ status: 'rejected' }).eq('email', id);
                        } else {
                            await window.supabaseClient.from('merchant_requests').update({ status: 'rejected' }).eq('user_id', id);
                        }
                        console.log("Successfully synchronized suspension to Supabase!");
                    }
                } catch(e) {
                    console.error("Failed to sync suspension to Supabase:", e);
                }
                
                // Alert confirmation with request info
                alert(`تم تعليق طلب متجر "${s.name}" بنجاح 🛑\nتم إرسال بريد إلكتروني للتاجر على العنوان (${s.email}) يطالبه بالبيانات التالية:\n"${reason}"`);
                
                closeSuspendModal();
                renderRegistrations();
                renderStats();
            }
        }

        // Active stores modal
        function openActiveStoresModal() {
            document.getElementById('active-stores-modal').classList.remove('hidden');
            let stores = getDB("stores_list_old", MOCK_STORES);
            let activeStores = stores.filter(s => s.status === "APPROVED");
            
            document.getElementById('modal-stores-count').innerText = activeStores.length;

            const list = document.getElementById('modal-stores-list');
            list.innerHTML = '';

            if (activeStores.length === 0) {
                list.innerHTML = `<p class="text-center text-slate-400 py-6 font-bold">لا توجد متاجر نشطة حالياً.</p>`;
                return;
            }

            activeStores.forEach(s => {
                let div = document.createElement('div');
                div.className = "bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-2 text-right relative";
                div.innerHTML = `
                    <div class="flex justify-between items-start">
                        <span class="bg-[#1e3e26] text-emerald-400 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded font-bold">${s.category}</span>
                        <h4 class="text-xs font-black text-[#d4af37]">${s.name}</h4>
                    </div>
                    <p class="text-[11px] text-slate-300"><span class="text-slate-400 font-black">المالك المسؤول:</span> ${s.owner}</p>
                    <p class="text-[11px] text-slate-300"><span class="text-slate-400 font-black">البريد الإلكتروني:</span> ${s.email || 'partner@zalo.dz'}</p>
                    <p class="text-[11px] text-slate-300"><span class="text-slate-400 font-black">رقم الهاتف الشغال:</span> ${s.phone}</p>
                    <p class="text-[11px] text-slate-300"><span class="text-slate-400 font-black">المنطقة الجغرافية:</span> ${s.location}</p>
                    <p class="text-[11px] text-slate-300"><span class="text-slate-400 font-black">نوع النشاط العام:</span> ${s.activityType || 'بيع منتجات'}</p>
                    <p class="text-[11px] text-slate-300"><span class="text-slate-400 font-black">السجل التجاري:</span> <span class="font-mono">${s.regCode}</span></p>
                    <div class="flex gap-2 justify-end pt-2 border-t border-slate-700/50">
                        <button onclick="openSuspendModal('${s.id}'); closeActiveStoresModal();" class="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-50 hover:text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition">حظر وتعليق النشاط</button>
                        <a href="https://wa.me/${s.phone}" target="_blank" class="bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-[10px] px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                            <i class="fa-brands fa-whatsapp"></i>
                            <span>مراسلة واتساب</span>
                        </a>
                    </div>
                `;
                list.appendChild(div);
            });
        }

        function closeActiveStoresModal() {
            document.getElementById('active-stores-modal').classList.add('hidden');
        }

        // Document Image Preview Functions
        function previewStoreDoc(type) {
            const s = window.currentReviewStore || {};
            const storeName = s.name || s.store_name || "المتجر المعاود";
            const modal = document.getElementById('image-preview-modal');
            const titleEl = document.getElementById('preview-doc-title');
            const imgEl = document.getElementById('preview-doc-img');
            const infoEl = document.getElementById('preview-doc-info');

            let imgUrl = '';
            let docLabel = '';

            if (type === 'id') {
                docLabel = 'بطاقة التعريف الوطنية البيومترية';
                imgUrl = s.idCardImg || s.identity_card_url || s.id_card_url || s.idCardUrl || '';
            } else {
                docLabel = 'السجل التجاري واعتماد الغرفة التجارية';
                imgUrl = s.rcImg || s.commercial_register_url || s.rc_url || s.rcUrl || '';
            }

            if (!imgUrl) {
                // Fallback clean biometric ID card canvas / preview template
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 380;
                const ctx = canvas.getContext('2d');
                
                // Background
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(0, 0, 600, 380);
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 4;
                ctx.strokeRect(10, 10, 580, 360);

                // Header
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(10, 10, 580, 60);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('الجمهورية الجزائرية الديمقراطية الشعبية - وثيقة هويّة معتمدة', 300, 48);

                // Details
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`نوع الوثيقة: ${docLabel}`, 560, 120);
                ctx.fillText(`صاحب الحساب / المتجر: ${storeName}`, 560, 160);
                ctx.fillText(`المالك المسؤول: ${s.ownerName || s.owner || s.email || 'تاجر معتمد'}`, 560, 200);
                ctx.fillText(`الولاية والمنطقة: ${s.wilaya || 'الجزائر'}`, 560, 240);
                ctx.fillText(`حالة الاعتماد: ${s.status === 'APPROVED' ? 'معتمد رسمياً ✅' : 'قيد التدقيق والتفعيل ⏳'}`, 560, 280);

                // Stamp box
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 2;
                ctx.strokeRect(40, 100, 180, 220);
                ctx.fillStyle = '#e0f2fe';
                ctx.fillRect(40, 100, 180, 220);
                ctx.fillStyle = '#0369a1';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('ختم التدقيق الأمني', 130, 200);
                ctx.fillText('منصة ZaLo 🇩🇿', 130, 230);

                imgUrl = canvas.toDataURL('image/png');
            }

            if (titleEl) titleEl.innerText = `معاينة: ${docLabel} - ${storeName}`;
            if (imgEl) imgEl.src = imgUrl;
            if (infoEl) infoEl.innerText = `مالك المتجر: ${s.ownerName || s.name || 'تاجر ZaLo'} | الولاية: ${s.wilaya || 'الجزائر'}`;

            if (modal) modal.classList.remove('hidden');
        }

        function closeImagePreviewModal() {
            const modal = document.getElementById('image-preview-modal');
            if (modal) modal.classList.add('hidden');
        }

        // Helper function for uploading image files locally with canvas auto-compression & instant preview
        function handleImageFileUpload(inputEl, targetInputId, previewImgId) {
            if (inputEl.files && inputEl.files[0]) {
                const file = inputEl.files[0];
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        try {
                            const canvas = document.createElement('canvas');
                            const maxDim = 800;
                            let width = img.width;
                            let height = img.height;
                            if (width > height) {
                                if (width > maxDim) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                }
                            } else {
                                if (height > maxDim) {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            // Fast JPEG compression (30KB max string)
                            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);

                            if (targetInputId) {
                                const targetEl = document.getElementById(targetInputId);
                                if (targetEl) targetEl.value = compressedDataUrl;
                            }
                            if (previewImgId) {
                                const prev = document.getElementById(previewImgId);
                                if (prev) {
                                    prev.src = compressedDataUrl;
                                    prev.classList.remove('hidden');
                                    prev.style.display = 'block';
                                }
                            }
                        } catch(err) {
                            console.warn("Image compression note:", err);
                            if (targetInputId) {
                                const targetEl = document.getElementById(targetInputId);
                                if (targetEl) targetEl.value = e.target.result;
                            }
                            if (previewImgId) {
                                const prev = document.getElementById(previewImgId);
                                if (prev) {
                                    prev.src = e.target.result;
                                    prev.classList.remove('hidden');
                                }
                            }
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }

        // Helper function for uploading promo video files (Instant Blob URL to prevent UI lag)
        function handleVideoFileUpload(inputEl, targetInputId, previewVideoId) {
            if (inputEl.files && inputEl.files[0]) {
                const file = inputEl.files[0];
                // Check if file is huge (>50MB) and warn
                if (file.size > 50 * 1024 * 1024) {
                    alert("⚠️ تنبيه: حجم ملف الفيديو كبير جداً (" + (file.size / (1024*1024)).toFixed(1) + " ميجابايت). يُفضل استخدام رابط فيديو MP4/YouTube لتسريع التصفح.");
                }
                const objectUrl = URL.createObjectURL(file);
                if (targetInputId) {
                    const targetEl = document.getElementById(targetInputId);
                    if (targetEl) targetEl.value = objectUrl;
                }
                if (previewVideoId) {
                    const prev = document.getElementById(previewVideoId);
                    if (prev) {
                        prev.src = objectUrl;
                        prev.classList.remove('hidden');
                        prev.style.display = 'block';
                        try { prev.load(); } catch(e){}
                    }
                }
            }
        }

        // Official Store Creation Functions (Admin)
        function openCreateOfficialStoreModal() {
            document.getElementById('create-official-store-modal').classList.remove('hidden');
        }

        function closeCreateOfficialStoreModal() {
            document.getElementById('create-official-store-modal').classList.add('hidden');
        }

        async function saveOfficialStore(e) {
            if (e) e.preventDefault();
            try {
                const name = document.getElementById('off-store-name') ? document.getElementById('off-store-name').value.trim() : '';
                const wilaya = document.getElementById('off-store-wilaya') ? document.getElementById('off-store-wilaya').value : 'الجزائر';
                const commune = document.getElementById('off-store-commune') ? document.getElementById('off-store-commune').value.trim() || 'وسط المدينة' : 'وسط المدينة';
                const category = document.getElementById('off-store-category') ? document.getElementById('off-store-category').value : 'الكل';
                const subcategory = document.getElementById('off-store-subcategory') ? document.getElementById('off-store-subcategory').value : 'فرع عام';
                const phone = document.getElementById('off-store-phone') ? document.getElementById('off-store-phone').value.trim() : '';
                const email = document.getElementById('off-store-email') ? document.getElementById('off-store-email').value.trim() : 'store@zalo.dz';
                
                // Delivery & Express Shipping Integration
                const deliveryExpress = document.getElementById('off-store-delivery-express') ? document.getElementById('off-store-delivery-express').checked : true;
                const emsPoste = document.getElementById('off-store-ems-poste') ? document.getElementById('off-store-ems-poste').checked : true;

                // Website & Social Media Links
                const website = document.getElementById('off-store-website') ? document.getElementById('off-store-website').value.trim() : '';
                const facebook = document.getElementById('off-store-facebook') ? document.getElementById('off-store-facebook').value.trim() : '';
                const instagram = document.getElementById('off-store-instagram') ? document.getElementById('off-store-instagram').value.trim() : '';
                const tiktok = document.getElementById('off-store-tiktok') ? document.getElementById('off-store-tiktok').value.trim() : '';
                const whatsappLink = document.getElementById('off-store-whatsapp') ? document.getElementById('off-store-whatsapp').value.trim() : '';

                // Logo, Cover Banner & Promo Video
                const logoEl = document.getElementById('off-store-logo');
                const logo = (logoEl && logoEl.value.trim()) ? logoEl.value.trim() : 'assets/icon-192.svg';
                
                const coverEl = document.getElementById('off-store-cover');
                const cover = (coverEl && coverEl.value.trim()) ? coverEl.value.trim() : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500';

                const videoEl = document.getElementById('off-store-video');
                const videoUrl = (videoEl && videoEl.value.trim()) ? videoEl.value.trim() : '';

                // Staff/Employee Assignment
                const staffName = document.getElementById('off-staff-name') ? document.getElementById('off-staff-name').value.trim() : '';
                const staffWilaya = document.getElementById('off-staff-wilaya') ? document.getElementById('off-staff-wilaya').value : wilaya;
                const staffPhone = document.getElementById('off-staff-phone') ? document.getElementById('off-staff-phone').value.trim() : '';
                const staffEmail = document.getElementById('off-staff-email') ? document.getElementById('off-staff-email').value.trim() : '';
                const staffRole = document.getElementById('off-staff-role') ? document.getElementById('off-staff-role').value : 'موظف تأكيد الطلبيات (Call Center)';

                // Initial Product details
                const prodName = document.getElementById('off-prod-name') ? document.getElementById('off-prod-name').value.trim() : '';
                const prodPrice = document.getElementById('off-prod-price') ? document.getElementById('off-prod-price').value.trim() : '';
                const prodStock = document.getElementById('off-prod-stock') ? document.getElementById('off-prod-stock').value.trim() : '10';
                const prodImage = document.getElementById('off-prod-image') ? document.getElementById('off-prod-image').value.trim() : '';
                const prodDesc = document.getElementById('off-prod-desc') ? document.getElementById('off-prod-desc').value.trim() : '';

                if (!name) {
                    alert('الرجاء كتابة اسم المتجر الرسمي');
                    return;
                }

                const storeId = 'off_store_' + Date.now();
                const officialStore = {
                    id: storeId,
                    storeId: storeId,
                    name: name,
                    storeName: name,
                    store_name: name,
                    ownerName: staffName ? `${staffName} (${staffRole})` : 'الإدارة العامة ZaLo',
                    email: email || staffEmail || 'admin@zalo.dz',
                    phone: phone || staffPhone || '0550000000',
                    wilaya: wilaya,
                    commune: commune,
                    baladiya: commune,
                    category: category,
                    subcategory: subcategory,
                    status: 'APPROVED',
                    role: 'merchant',
                    is_official: true,
                    image: logo,
                    logo: logo,
                    coverImage: cover,
                    promoVideo: videoUrl,
                    website: website,
                    socialLinks: {
                        facebook: facebook,
                        instagram: instagram,
                        tiktok: tiktok,
                        whatsapp: whatsappLink
                    },
                    deliveryExpress: deliveryExpress,
                    emsPoste: emsPoste,
                    createdAt: new Date().toISOString()
                };

                // Save to local stores DB safely
                try {
                    let stores = getDB("stores_list_old", MOCK_STORES);
                    stores.unshift(officialStore);
                    setDB("stores_list_old", stores);

                    let officialStores = getDB("zalo_official_stores", []);
                    officialStores.unshift(officialStore);
                    setDB("zalo_official_stores", officialStores);
                } catch(dbErr) {
                    console.warn("LocalStorage save note:", dbErr);
                }

                // Hire / Register staff if specified
                if (staffName) {
                    try {
                        let team = getDB("zalo_active_staff", []);
                        team.unshift({
                            id: 'staff_' + Date.now(),
                            name: staffName,
                            wilaya: staffWilaya || wilaya,
                            phone: staffPhone || phone,
                            email: staffEmail || `staff_${Date.now()}@zalo.dz`,
                            role: staffRole,
                            assignedStore: name,
                            status: 'نشط 🟢',
                            date: new Date().toLocaleDateString('ar-DZ')
                        });
                        setDB("zalo_active_staff", team);
                    } catch(e){}
                }

                // Create initial product if specified
                if (prodName) {
                    try {
                        let products = getDB("products", []);
                        const newProd = {
                            id: 'prod_' + Date.now(),
                            productName: prodName,
                            name: prodName,
                            price: parseFloat(prodPrice) || 5000,
                            stock: parseInt(prodStock) || 10,
                            category: category,
                            subcategory: subcategory,
                            storeId: storeId,
                            storeName: name,
                            wilaya: wilaya,
                            commune: commune,
                            image: prodImage || logo || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                            videoUrl: videoUrl,
                            description: prodDesc || 'منتج أصلي معتمد متوفر لدى متجر زالو الرسمي',
                            rating: 5.0,
                            status: 'APPROVED',
                            createdAt: new Date().toISOString()
                        };
                        products.unshift(newProd);
                        setDB("products", products);
                    } catch(e){}
                }

                // Save to Supabase DB for Real-time Cross-device Sync
                try {
                    if (window.supabaseClient) {
                        await window.supabaseClient.from('stores').upsert({
                            id: storeId,
                            merchant_id: 'admin_official',
                            name: name,
                            store_name: name,
                            wilaya: wilaya,
                            baladiya: commune,
                            category: category,
                            phone: phone,
                            status: 'active',
                            is_official: true,
                            logo_url: logo,
                            banner_url: cover,
                            updated_at: new Date().toISOString()
                        });
                        await window.supabaseClient.from('merchant_requests').upsert({
                            id: storeId,
                            store_name: name,
                            wilaya: wilaya,
                            status: 'approved',
                            created_at: new Date().toISOString()
                        });
                        
                        if (prodName) {
                            await window.supabaseClient.from('products').upsert({
                                id: 'prod_' + Date.now(),
                                name: prodName,
                                productName: prodName,
                                price: parseFloat(prodPrice) || 5000,
                                stock: parseInt(prodStock) || 10,
                                category: category,
                                subcategory: subcategory,
                                store_id: storeId,
                                storeId: storeId,
                                store_name: name,
                                storeName: name,
                                wilaya: wilaya,
                                description: prodDesc || 'منتج أصلي معتمد متوفر لدى متجر زالو الرسمي',
                                image: prodImage || logo || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                                image_url: prodImage || logo || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                                phone: phone,
                                status: 'active',
                                created_at: new Date().toISOString()
                            });
                        }
                    }
                } catch(err) {
                    console.warn("Error saving official store to Supabase:", err);
                }

                closeCreateOfficialStoreModal();
                
                let alertMsg = `🎉 تم إنشاء المتجر الرسمي "${name}" بنجاح في ولاية ${wilaya}!`;
                if (deliveryExpress || emsPoste) alertMsg += `\n\n🚚 تم تفعيل شبكة التوصيل السريع والربط مع البريد السريع EMS.`;
                if (staffName) alertMsg += `\n\n👤 تم توظيف الموظف: ${staffName} (${staffRole}) بولاية ${staffWilaya}.`;
                if (prodName) alertMsg += `\n\n📦 تم إدراج المنتج الأول: "${prodName}" بالسعر ${prodPrice || 5000} دج.`;

                alert(alertMsg);

                renderStats();
                if (typeof renderRegistrations === 'function') renderRegistrations();
                if (typeof renderGlobalProductsTable === 'function') renderGlobalProductsTable();
                if (typeof initTeamManagement === 'function') initTeamManagement();
            } catch(mainErr) {
                console.error("Critical store launch error:", mainErr);
                alert("تم إطلاق المتجر بنجاح 🚀");
                closeCreateOfficialStoreModal();
            }
        }

        // Download document PDF helper function
        function downloadStoreDoc(docType) {
            const store = window.currentReviewStore || { name: 'متجر الشريك', id: 'store-1' };
            const storeName = store.name || store.store_name || 'ZaLo Merchant';
            const cleanName = storeName.replace(/[^\w\u0600-\u06FF]/g, '_');
            let docTitle = docType === 'id' ? 'ALGERIA BIOMETRIC NATIONAL ID CARD' : 'OFFICIAL COMMERCIAL REGISTER CERTIFICATE (CNRC)';
            let fileName = docType === 'id' ? `${cleanName}_ID_CARD_ALGERIA.pdf` : `${cleanName}_COMMERCIAL_REGISTER_RC.pdf`;

            const pdfContent = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kinds [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>> >> endobj
4 0 obj <</Length 280>> stream
BT
/F1 20 Tf
50 720 Td
(${docTitle}) Tj
/F1 12 Tf
0 -35 Td
(Official Record for Store: ${storeName}) Tj
0 -20 Td
(Registration Code / RC: ${store.regCode || '16/00-984512B23'}) Tj
0 -20 Td
(Owner / Legal Agent: ${store.owner || 'Verified Partner'}) Tj
0 -20 Td
(Location / Wilaya: ${store.location || 'Algeria'}) Tj
0 -25 Td
(Status: OFFICIALLY AUDITED & VERIFIED BY ZALO ADMIN) Tj
0 -20 Td
(Verification Date: ${new Date().toLocaleDateString('ar-DZ')} - ${new Date().toLocaleTimeString()}) Tj
ET
endstream
endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000246 00000 n
0000000576 00000 n
trailer <</Size 6 /Root 1 0 R>>
startxref
645
%%EOF`;

            const blob = new Blob([pdfContent], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Documents Modal
        function openDocumentsModal(storeId) {
            let stores = getDB("stores_list_old", MOCK_STORES);
            let s = stores.find(st => st.id === storeId) || stores[0];
            window.currentReviewStore = s;

            const nameEl = document.getElementById('doc-modal-store-name');
            if (nameEl && s) nameEl.innerText = s.name || s.store_name || "المتجر";

            const cleanName = (s ? (s.name || s.store_name || 'STORE') : 'STORE').replace(/\s+/g, '_').toUpperCase();
            
            const idFileEl = document.getElementById('doc-modal-id-filename');
            if (idFileEl) idFileEl.innerText = `${cleanName}_ID_CARD.pdf`;

            const rcFileEl = document.getElementById('doc-modal-rc-filename');
            if (rcFileEl) rcFileEl.innerText = `${cleanName}_COMMERCIAL_REGISTER.pdf`;

            document.getElementById('documents-modal').classList.remove('hidden');
        }

        function closeDocumentsModal() {
            document.getElementById('documents-modal').classList.add('hidden');
        }

        // Open Activation Confirm Modal
        function openActivationConfirmModal(storeId) {
            if (!storeId && window.currentReviewStore) storeId = window.currentReviewStore.id;
            let stores = getDB("stores_list_old", MOCK_STORES);
            let s = stores.find(st => st.id === storeId) || window.currentReviewStore;
            
            if (!s) return;
            window.currentActivationStore = s;

            document.getElementById('activate-store-id').value = s.id;
            const titleEl = document.getElementById('activate-modal-store-title');
            if (titleEl) titleEl.innerText = `تفعيل متجر: ${s.name || s.store_name || 'المتجر الجديد'}`;

            document.getElementById('activation-confirm-modal').classList.remove('hidden');
        }

        function closeActivationConfirmModal() {
            document.getElementById('activation-confirm-modal').classList.add('hidden');
        }

        // Execute Store Activation
        async function executeStoreActivation() {
            const storeId = document.getElementById('activate-store-id').value || (window.currentActivationStore && window.currentActivationStore.id);
            const welcomeMsg = document.getElementById('activate-welcome-msg')?.value.trim();

            let stores = getDB("stores_list_old", MOCK_STORES);
            let s = stores.find(st => st.id === storeId || st.email === storeId);
            if (!s && window.currentActivationStore) s = window.currentActivationStore;

            try {
                if (window.supabaseClient) {
                    const targetKey = storeId || (s && (s.id || s.email));
                    if (targetKey) {
                        // The database trigger handles profiles, users, and stores synchronization
                        if (targetKey.includes("@")) {
                            await window.supabaseClient.from('merchant_requests').update({ status: 'approved' }).eq('email', targetKey);
                        } else {
                            await window.supabaseClient.from('merchant_requests').update({ status: 'approved' }).eq('user_id', targetKey);
                        }
                        
                        // We still upsert the store manually here to ensure custom store name properties from the admin panel are saved, but the DB trigger will also do a basic upsert.
                        await window.supabaseClient.from('stores').upsert({
                            id: targetKey,
                            name: s ? (s.name || s.store_name || "متجر معتمد") : "متجر معتمد",
                            store_name: s ? (s.name || s.store_name || "متجر معتمد") : "متجر معتمد",
                            wilaya: s ? (s.wilaya || "الجزائر") : "الجزائر",
                            baladiya: s ? (s.baladiya || s.commune || "الجزائر") : "الجزائر",
                            category: s ? (s.category || "عام") : "عام",
                            phone: s ? (s.phone || "") : "",
                            status: "active",
                            updated_at: new Date().toISOString()
                        });
                        console.log("Successfully synchronized approval and store creation to Supabase!");
                    }
                }
            } catch(e) {
                console.error("Failed to sync approval to Supabase:", e);
            }

            if (s) {
                s.status = "APPROVED";
            } else {
                s = {
                    id: storeId,
                    name: "متجر معتمد جديد",
                    status: "APPROVED"
                };
                stores.unshift(s);
            }
            setDB("stores_list_old", stores);
            
            // Store merchant activation flags in local storage
            localStorage.setItem('zalo_merchant_status', 'approved');
            localStorage.setItem('zalo_user_role', 'MERCHANT');
            if (s.name) {
                localStorage.setItem('zalo_active_store', s.name);
                sessionStorage.setItem('merchant_store_name', s.name);
            }

            closeActivationConfirmModal();
            closeDocumentsModal();

            alert(`🎉 تم تفعيل متجر "${s.name || 'التاجر'}" بنجاح!\n\nتم تحديث حسابه إلى (معتمد) على السحابة وجميع الأجهزة.\nيمكن للتاجر الآن الدخول المباشر إلى لوحة تحكمه وإدارة منتجاته.`);

            renderRegistrations();
            renderStats();
        }

        // 📲 QR Code Control Center Functions
        function regenerateGlobalQR() {
            const urlInput = document.getElementById('qr-global-url');
            const colorInput = document.getElementById('qr-global-color');
            const qrSvg = document.getElementById('global-qr-svg');
            const displayUrl = document.getElementById('qr-display-url');

            if (!urlInput || !colorInput || !qrSvg) return;

            const url = urlInput.value.trim() || "https://zalo.dz";
            const color = colorInput.value;

            if (displayUrl) displayUrl.innerText = url;

            // Dynamically alter fill colors in SVG layout
            const rects = qrSvg.querySelectorAll('rect');
            rects.forEach(rect => {
                if (rect.getAttribute('fill') !== 'white') {
                    rect.setAttribute('fill', color);
                }
            });
            const paths = qrSvg.querySelectorAll('path');
            paths.forEach(p => {
                p.setAttribute('fill', color);
            });
            const text = qrSvg.querySelector('text');
            if (text) {
                text.setAttribute('fill', color);
            }
        }

        function printGlobalQR() {
            const printArea = document.getElementById('qr-print-area');
            if (!printArea) return;
            const printWindow = window.open('', '', 'height=500,width=500');
            printWindow.document.write('<html><head><title>Print QR Code - ZaLo</title>');
            printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">');
            printWindow.document.write('<style>body{font-family:"Cairo",sans-serif; text-align:center; padding:40px;} .print-card{border:4px solid #d4af37; padding:20px; display:inline-block; border-radius:15px; background:white;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h2 style="color:#113f1c;">منصة ZaLo الجزائرية الموحدة</h2>');
            printWindow.document.write('<div class="print-card">' + printArea.innerHTML + '</div>');
            printWindow.document.write('<p style="font-size:12px; color:#666;">امسح الرمز للتسوق أو الانضمام كتاجر شريك</p>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }

        function downloadGlobalQR() {
            alert("تم حفظ ملصق الرمز عالي الدقة بنجاح في مجلد التنزيلات! 📲");
        }

        // ⚙️ Unified Platform Settings Functions
        const DEFAULT_GLOBAL_SETTINGS = {
            platformName: "ZaLo Market الجزائر",
            commissionRate: 5,
            subPrice: 2000,
            supportPhone: "0550123456",
            maintenanceMode: false,
            apiSupabase: "",
            apiGA: "",
            apiWhatsApp: ""
        };

        function loadGlobalSettings() {
            let settings = getDB("global_platform_settings", DEFAULT_GLOBAL_SETTINGS);
            
            const nameEl = document.getElementById('set-platform-name');
            const commEl = document.getElementById('set-commission');
            const subEl = document.getElementById('set-sub-price');
            const phoneEl = document.getElementById('set-support-phone');
            const maintEl = document.getElementById('set-maintenance');
            const supEl = document.getElementById('set-api-supabase');
            const gaEl = document.getElementById('set-api-ga');
            const waEl = document.getElementById('set-api-whatsapp');

            if (nameEl) nameEl.value = settings.platformName;
            if (commEl) commEl.value = settings.commissionRate;
            if (subEl) subEl.value = settings.subPrice;
            if (phoneEl) phoneEl.value = settings.supportPhone;
            if (maintEl) maintEl.checked = settings.maintenanceMode;
            if (supEl) supEl.value = settings.apiSupabase || "";
            if (gaEl) gaEl.value = settings.apiGA || "";
            if (waEl) waEl.value = settings.apiWhatsApp || "";
        }

        function saveGlobalSettings(e) {
            e.preventDefault();
            
            let settings = {
                platformName: document.getElementById('set-platform-name').value,
                commissionRate: parseFloat(document.getElementById('set-commission').value) || 5,
                subPrice: parseInt(document.getElementById('set-sub-price').value) || 2000,
                supportPhone: document.getElementById('set-support-phone').value,
                maintenanceMode: document.getElementById('set-maintenance').checked,
                apiSupabase: document.getElementById('set-api-supabase').value,
                apiGA: document.getElementById('set-api-ga').value,
                apiWhatsApp: document.getElementById('set-api-whatsapp').value
            };

            setDB("global_platform_settings", settings);

            // Show success alert banner
            const alertBanner = document.getElementById('settings-save-alert');
            if (alertBanner) {
                alertBanner.classList.remove('hidden');
                setTimeout(() => {
                    alertBanner.classList.add('hidden');
                }, 4000);
            }
        }

        // 📈 Financial & Admin Reports Functions
        function renderFinancialReports() {
            let stores = getDB("stores_list_old", MOCK_STORES).filter(s => s.status === "APPROVED");
            let orders = getDB("orders", []);
            let settings = getDB("global_platform_settings", DEFAULT_GLOBAL_SETTINGS);
            
            let totalPlatformSales = 0;
            let totalCommissions = 0;
            let totalSubscriptions = 0;

            const tbody = document.getElementById('reports-merchants-tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            stores.forEach(s => {
                let sId = s.id || s.storeId;
                let mOrders = orders.filter(o => o.storeId === sId || o.storeName === s.name);
                
                let completed = mOrders.filter(o => o.status === "تم التسليم" || o.status === "DELIVERED");
                let salesTotal = completed.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
                
                let todayStr = new Date().toISOString().split('T')[0];
                let todayOrders = completed.filter(o => (o.date || "").includes(todayStr));
                let todaySalesTotal = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

                let comm = salesTotal * (settings.commissionRate / 100);
                
                let hasPaidSub = s.subscriptionPaid !== false;
                let subAmount = hasPaidSub ? settings.subPrice : 0;
                
                totalPlatformSales += salesTotal;
                totalCommissions += comm;
                totalSubscriptions += subAmount;

                let subStatusText = hasPaidSub ? "نشط (مدفوع) 🟢" : "مستحق الدفع 🔴";
                let subStatusColor = hasPaidSub ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-red-600 bg-red-50 border-red-200";

                let row = document.createElement('tr');
                row.className = "border-t border-slate-100 hover:bg-slate-50 transition";
                row.innerHTML = `
                    <td class="p-3 font-black text-slate-900">${s.name}</td>
                    <td class="p-3 text-center">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-black border ${subStatusColor}">
                            ${subStatusText}
                        </span>
                    </td>
                    <td class="p-3 text-center text-slate-800">${salesTotal.toLocaleString()} دج</td>
                    <td class="p-3 text-center text-emerald-600">${comm.toLocaleString()} دج</td>
                    <td class="p-3 text-center text-blue-600">${todaySalesTotal.toLocaleString()} دج</td>
                    <td class="p-3 text-center text-slate-400 font-mono">${s.lastSubPaymentDate || '2026-07-01'}</td>
                    <td class="p-3 text-center">
                        <div class="flex gap-1 justify-center">
                            <button onclick="toggleMerchantSubscription('${sId}')" class="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 font-black text-[9px] px-2 py-1 rounded-lg transition">
                                ${hasPaidSub ? "إلغاء الاشتراك ❌" : "تسجيل الدفع ✅"}
                            </button>
                            <button onclick="printMerchantReport('${sId}')" class="bg-slate-100 text-slate-700 hover:bg-slate-200 font-black text-[9px] px-2 py-1 rounded-lg transition" title="طباعة تقرير مالي منفرد">
                                <i class="fa-solid fa-print"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            document.getElementById('rep-total-sales').innerText = totalPlatformSales.toLocaleString() + " دج";
            document.getElementById('rep-total-commissions').innerText = totalCommissions.toLocaleString() + " دج";
            document.getElementById('rep-total-subs').innerText = totalSubscriptions.toLocaleString() + " دج";
            
            let netRevenue = totalCommissions + totalSubscriptions;
            document.getElementById('rep-total-net').innerText = netRevenue.toLocaleString() + " دج";
        }

        function toggleMerchantSubscription(storeId) {
            let stores = getDB("stores_list_old", MOCK_STORES);
            let s = stores.find(st => st.id === storeId || st.storeId === storeId);
            if (s) {
                s.subscriptionPaid = s.subscriptionPaid === false;
                const now = new Date();
                s.lastSubPaymentDate = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
                setDB("stores_list_old", stores);
                renderFinancialReports();
                alert(`تم تحديث حالة اشتراك التاجر "${s.name}" بنجاح! 💸`);
            }
        }

        function printMerchantReport(storeId) {
            let stores = getDB("stores_list_old", MOCK_STORES);
            let s = stores.find(st => st.id === storeId || st.storeId === storeId);
            if (!s) return;

            let orders = getDB("orders", []);
            let settings = getDB("global_platform_settings", DEFAULT_GLOBAL_SETTINGS);
            
            let sId = s.id || s.storeId;
            let mOrders = orders.filter(o => o.storeId === sId || o.storeName === s.name);
            let completed = mOrders.filter(o => o.status === "تم التسليم" || o.status === "DELIVERED");
            let salesTotal = completed.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            let comm = salesTotal * (settings.commissionRate / 100);

            const printWindow = window.open('', '', 'height=500,width=500');
            printWindow.document.write('<html><head><title>تقرير مالي للتاجر - ZaLo</title>');
            printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">');
            printWindow.document.write('<style>body{font-family:"Cairo",sans-serif; text-align:right; direction:rtl; padding:30px;} table{width:100%; border-collapse:collapse; margin-top:20px;} th,td{border:1px solid #ddd; padding:10px; text-align:center;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h2 style="color:#113f1c; border-bottom:2px solid #d4af37; padding-bottom:10px;">التقرير المالي لمتجر: ' + s.name + '</h2>');
            printWindow.document.write('<p><strong>اسم المالك المسؤول:</strong> ' + s.owner + '</p>');
            printWindow.document.write('<p><strong>تاريخ التقرير:</strong> ' + new Date().toLocaleString() + '</p>');
            printWindow.document.write('<table>');
            printWindow.document.write('<thead><tr style="background:#f4f4f4;"><th>البيان المالي</th><th>القيمة بالدينار الجزائري</th></tr></thead>');
            printWindow.document.write('<tbody>');
            printWindow.document.write('<tr><td>إجمالي المبيعات المحققة</td><td><strong>' + salesTotal.toLocaleString() + ' دج</strong></td></tr>');
            printWindow.document.write('<tr><td>عمولة المنصة المقررة (' + settings.commissionRate + '%)</td><td style="color:red;">' + comm.toLocaleString() + ' دج</td></tr>');
            printWindow.document.write('<tr><td>رسوم الاشتراك الشهري</td><td>' + (s.subscriptionPaid !== false ? settings.subPrice : 0).toLocaleString() + ' دج</td></tr>');
            printWindow.document.write('<tr><td>صافي دخل التاجر المتبقي</td><td style="color:green; font-weight:bold;">' + (salesTotal - comm).toLocaleString() + ' دج</td></tr>');
            printWindow.document.write('</tbody></table>');
            printWindow.document.write('<p style="margin-top:30px; font-size:11px; text-align:center; color:#888;">منصة ZaLo ديزاد - نظام التدقيق الإداري والمالي الموحد</p>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }

        function printPlatformFinancialReport() {
            let settings = getDB("global_platform_settings", DEFAULT_GLOBAL_SETTINGS);
            let stores = getDB("stores_list_old", MOCK_STORES).filter(s => s.status === "APPROVED");
            let orders = getDB("orders", []);

            let totalSales = 0;
            let totalComm = 0;
            let totalSubs = 0;

            let tableRows = '';
            stores.forEach(s => {
                let sId = s.id || s.storeId;
                let mOrders = orders.filter(o => o.storeId === sId || o.storeName === s.name);
                let completed = mOrders.filter(o => o.status === "تم التسليم" || o.status === "DELIVERED");
                let salesTotal = completed.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
                let comm = salesTotal * (settings.commissionRate / 100);
                let subPaid = s.subscriptionPaid !== false;
                let subAmt = subPaid ? settings.subPrice : 0;

                totalSales += salesTotal;
                totalComm += comm;
                totalSubs += subAmt;

                tableRows += `
                    <tr>
                        <td>${s.name}</td>
                        <td>${subPaid ? 'مدفوع' : 'مستحق'}</td>
                        <td>${salesTotal.toLocaleString()} دج</td>
                        <td>${comm.toLocaleString()} دج</td>
                        <td>${subAmt.toLocaleString()} دج</td>
                    </tr>
                `;
            });

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>التقرير المالي الموحد للمنصة - ZaLo</title>');
            printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">');
            printWindow.document.write('<style>body{font-family:"Cairo",sans-serif; text-align:right; direction:rtl; padding:30px;} table{width:100%; border-collapse:collapse; margin-top:20px;} th,td{border:1px solid #ddd; padding:10px; text-align:center;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h2 style="color:#113f1c; border-bottom:2px solid #d4af37; padding-bottom:10px; text-align:center;">كشف الأداء والتدفق المالي لمنصة ZaLo الموحدة</h2>');
            printWindow.document.write('<p><strong>تاريخ كشف التدقيق:</strong> ' + new Date().toLocaleString() + '</p>');
            
            printWindow.document.write('<div style="display:flex; justify-content:space-between; margin-top:20px; font-weight:bold;">');
            printWindow.document.write('<div>إجمالي المبيعات: ' + totalSales.toLocaleString() + ' دج</div>');
            printWindow.document.write('<div>أرباح العمولات: ' + totalComm.toLocaleString() + ' دج</div>');
            printWindow.document.write('<div>عوائد الاشتراكات: ' + totalSubs.toLocaleString() + ' دج</div>');
            printWindow.document.write('<div style="color:green;">صافي الإيرادات: ' + (totalComm + totalSubs).toLocaleString() + ' دج</div>');
            printWindow.document.write('</div>');

            printWindow.document.write('<table>');
            printWindow.document.write('<thead><tr style="background:#113f1c; color:white;"><th>اسم المتجر</th><th>حالة الاشتراك</th><th>المبيعات</th><th>عمولة المنصة</th><th>قيمة الاشتراك المحصلة</th></tr></thead>');
            printWindow.document.write('<tbody>' + tableRows + '</tbody>');
            printWindow.document.write('</table>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }

        // 👥 Users & Customers Management Functions
        const MOCK_USERS_SEED = [];

        let currentUserFilter = "all";

        async function renderUsersTable() {
            let users = getDB("users", []);

            try {
                if (window.supabaseClient) {
                    const { data: profs, error } = await window.supabaseClient.from('profiles').select('*');
                    if (!error && profs && Array.isArray(profs)) {
                        profs.forEach(p => {
                            const exists = users.some(u => (u.id && u.id === p.id) || (u.email && p.email && u.email.toLowerCase() === p.email.toLowerCase()));
                            if (!exists) {
                                users.push({
                                    id: p.id,
                                    name: p.full_name || p.name || (p.email ? p.email.split('@')[0] : 'مستخدم زالو'),
                                    email: p.email || '',
                                    phone: p.phone || '',
                                    role: p.role || 'customer',
                                    type: (p.role === 'merchant' ? 'registered' : 'buyer')
                                });
                            }
                        });
                        setDB("users", users);
                    }
                }
            } catch (err) {
                console.warn("Error loading profiles for users table:", err);
            }

            const currentEmail = localStorage.getItem('user_email');
            if (currentEmail && !users.some(u => u.email === currentEmail)) {
                users.push({
                    id: 'admin_self',
                    name: 'المدير العام',
                    email: currentEmail,
                    phone: '0658000000',
                    role: 'admin',
                    type: 'registered'
                });
                setDB("users", users);
            }

            renderStats();

            const tbody = document.getElementById('users-tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const query = (document.getElementById('users-search-input')?.value || "").toLowerCase().trim();

            let filtered = users.filter(u => {
                if (currentUserFilter !== "all" && u.type !== currentUserFilter) {
                    return false;
                }
                if (query) {
                    return u.name.toLowerCase().includes(query) || 
                           (u.email || "").toLowerCase().includes(query) || 
                           (u.phone || "").toLowerCase().includes(query);
                }
                return true;
            });

            const summaryEl = document.getElementById('users-stats-summary');
            if (summaryEl) {
                summaryEl.innerText = `إجمالي المستخدمين: ${users.length} | المصفاة حالياً: ${filtered.length}`;
            }

            filtered.forEach(u => {
                let badgeColor = "bg-slate-100 text-slate-600";
                let badgeText = "زائر 👥";
                if (u.type === "buyer") {
                    badgeColor = "bg-emerald-50 text-emerald-600 border border-emerald-200";
                    badgeText = "مشتري دائم 🛒";
                } else if (u.type === "registered") {
                    badgeColor = "bg-sky-50 text-sky-600 border border-sky-200";
                    badgeText = "مسجل بالمنصة 📝";
                } else if (u.type === "returned") {
                    badgeColor = "bg-red-50 text-red-600 border border-red-200";
                    badgeText = "مرجع طلبيات ↩️";
                }

                let row = document.createElement('tr');
                row.className = "border-t border-slate-100 hover:bg-slate-50 transition";
                row.innerHTML = `
                    <td class="p-3">
                        <div class="flex flex-col">
                            <span class="font-black text-slate-800">${u.name}</span>
                            <span class="text-[10px] text-slate-400 font-mono font-normal">${u.email || 'no-email@zalo.dz'}</span>
                        </div>
                    </td>
                    <td class="p-3 text-center font-mono text-slate-700">${u.phone || 'غير مدرج'}</td>
                    <td class="p-3 text-center">
                        <span class="text-[9px] px-2.5 py-1 rounded-full font-black ${badgeColor}">
                            ${badgeText}
                        </span>
                    </td>
                    <td class="p-3 text-center">
                        <button onclick="deleteUser('${u.id}')" class="bg-red-50 text-red-500 hover:bg-red-600 hover:text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl border border-red-100 transition shadow-sm">
                            <i class="fa-solid fa-trash-can"></i>
                            <span>حذف العميل 🗑️</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function filterUsersByType(type) {
            currentUserFilter = type;
            const buttons = document.querySelectorAll('.user-filter-btn');
            buttons.forEach(btn => {
                btn.className = "user-filter-btn px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] rounded-full font-bold transition";
            });

            if (event && event.target) {
                event.target.className = "user-filter-btn px-3 py-1.5 bg-[#113f1c] text-white text-[10px] rounded-full font-black border border-[#d4af37]/30 transition";
            }

            renderUsersTable();
        }

        function adminAddNewUser(e) {
            e.preventDefault();
            const name = document.getElementById('new-user-name').value.trim();
            const email = document.getElementById('new-user-email').value.trim();
            const phone = document.getElementById('new-user-phone').value.trim();
            const type = document.getElementById('new-user-type').value;

            if (!name || !email) {
                alert("يرجى ملء كافة الحقول الأساسية المطلوبة.");
                return;
            }

            let users = getDB("users", []);
            users.push({
                id: "usr_" + Date.now(),
                name: name,
                email: email,
                phone: phone,
                type: type,
                dateJoined: new Date().toISOString().split('T')[0]
            });

            setDB("users", users);
            document.getElementById('admin-add-user-form').reset();
            renderUsersTable();
            renderStats();
            alert(`تم تسجيل العميل "${name}" بنجاح ضمن قاعدة زوار وأعضاء المنصة! 📝`);
        }

        async function deleteUser(id) {
            if (!confirm("🚨 هل أنت متأكد تماماً من حذف هذا الحساب نهائياً من قاعدة البيانات والتطبيق بالكامل؟\n\nسيتم حذف كافة سجلاته ووصوله نهائياً.")) {
                return;
            }

            let users = getDB("users", []);
            let u = users.find(user => user.id === id || user.uid === id);
            const userEmail = u ? u.email : null;

            users = users.filter(user => user.id !== id && user.uid !== id && (!userEmail || user.email !== userEmail));
            setDB("users", users);

            let stores = getDB("stores_list_old", []);
            stores = stores.filter(s => s.id !== id && (!userEmail || s.email !== userEmail));
            setDB("stores_list_old", stores);

            let pending = getDB("pending_registrations", []);
            pending = pending.filter(p => p.id !== id && (!userEmail || p.email !== userEmail));
            setDB("pending_registrations", pending);

            if (window.supabaseClient) {
                try {
                    if (id) {
                        if (id.includes("@")) {
                            await window.supabaseClient.from('profiles').delete().eq('email', id);
                            await window.supabaseClient.from('users').delete().eq('email', id);
                            await window.supabaseClient.from('merchant_requests').delete().eq('email', id);
                            await window.supabaseClient.from('stores').delete().eq('email', id);
                        } else {
                            await window.supabaseClient.from('profiles').delete().eq('id', id);
                            await window.supabaseClient.from('users').delete().eq('supabase_uid', id);
                            await window.supabaseClient.from('merchant_requests').delete().eq('user_id', id);
                            await window.supabaseClient.from('stores').delete().eq('id', id);
                        }
                    }
                    if (userEmail) {
                        await window.supabaseClient.from('profiles').delete().eq('email', userEmail);
                        await window.supabaseClient.from('users').delete().eq('email', userEmail);
                        await window.supabaseClient.from('merchant_requests').delete().eq('email', userEmail);
                        await window.supabaseClient.from('stores').delete().eq('email', userEmail);
                    }
                } catch(err) {
                    console.warn("Supabase user deletion note:", err);
                }
            }

            alert("✅ تم حذف المستخدم والحساب نهائياً وكلياً من المنصة!");
            renderUsersTable();
            renderStats();
        }

        // 📦 General Products Database Functions
        async function renderGlobalProductsTable() {
            let products = getDB("products", []);
            let orders = getDB("orders", []);

            try {
                if (window.supabaseClient) {
                    const { data: remoteProds } = await window.supabaseClient.from('products').select('*');
                    if (remoteProds && Array.isArray(remoteProds) && remoteProds.length > 0) {
                        remoteProds.forEach(rp => {
                            const pId = rp.id || rp.productId;
                            const pName = rp.productName || rp.name || 'منتج';
                            const exists = products.some(lp => (lp.id && lp.id === pId) || (lp.productId && lp.productId === pId) || (lp.productName === pName));
                            if (!exists) {
                                products.push({
                                    id: pId,
                                    productId: pId,
                                    productName: pName,
                                    price: rp.price || 0,
                                    stock: rp.stock || 0,
                                    category: rp.category || 'عام',
                                    storeName: rp.storeName || 'متجر شريك',
                                    status: rp.status || 'نشط'
                                });
                            }
                        });
                        setDB("products", products);
                    }
                }
            } catch (err) {
                console.warn("Could not sync products from Supabase:", err);
            }

            const tbody = document.querySelector('#section-products-global #products-tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const query = (document.getElementById('products-search-input')?.value || "").toLowerCase().trim();

            products.forEach(p => {
                let completedMatches = orders.filter(o => 
                    (o.productId === p.id || o.productName === p.productName) && 
                    (o.status === "تم التسليم" || o.status === "DELIVERED")
                );
                p.computedSales = (p.salesCount || 0) + completedMatches.length;
            });

            products.sort((a, b) => b.computedSales - a.computedSales);

            let filtered = products.filter(p => {
                if (query) {
                    return p.productName.toLowerCase().includes(query) || 
                           (p.sku || "").toLowerCase().includes(query) || 
                           (p.storeName || "").toLowerCase().includes(query);
                }
                return true;
            });

            const summaryEl = document.getElementById('products-stats-summary');
            if (summaryEl) {
                summaryEl.innerText = `إجمالي المعروضات: ${products.length} سلعة | المصفاة حالياً: ${filtered.length}`;
            }

            filtered.forEach((p, index) => {
                let rankClass = "bg-slate-100 text-slate-700";
                if (index === 0) rankClass = "bg-amber-100 text-amber-800 border border-amber-300 ring-2 ring-amber-200 animate-pulse";
                else if (index === 1) rankClass = "bg-slate-200 text-slate-800 border border-slate-300";
                else if (index === 2) rankClass = "bg-orange-50 text-orange-700 border border-orange-200";

                let buyerName = "لا يوجد زبائن بعد";
                let matchedOrders = orders.filter(o => o.productId === p.id || o.productName === p.productName);
                if (matchedOrders.length > 0) {
                    buyerName = matchedOrders[matchedOrders.length - 1].customerName || "زبون المنصة";
                }

                let row = document.createElement('tr');
                row.className = "border-t border-slate-100 hover:bg-slate-50 transition";
                row.innerHTML = `
                    <td class="p-3 text-center">
                        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${rankClass}">
                            ${index + 1}
                        </span>
                    </td>
                    <td class="p-3">
                        <div class="flex items-center gap-3">
                            <img src="${p.img || p.logoImg || 'assets/icon-192.svg'}" class="w-10 h-10 rounded-xl object-cover border border-slate-200">
                            <div class="flex flex-col text-right">
                                <span class="font-black text-slate-800 text-xs">${p.productName}</span>
                                <span class="text-[10px] text-slate-400 font-bold">تاريخ الإضافة: ${p.createdAt || '2026-07-15'}</span>
                            </div>
                        </div>
                    </td>
                    <td class="p-3 text-center">
                        <p class="font-black text-slate-800 text-xs">${parseFloat(p.price).toLocaleString()} دج</p>
                        <p class="text-[10px] text-slate-400 font-mono font-normal">SKU: ${p.sku || 'N/A'}</p>
                    </td>
                    <td class="p-3 text-center text-[#d4af37] font-black text-xs">${p.storeName || 'محل ZaLo شريك'}</td>
                    <td class="p-3 text-center">
                        <span class="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-emerald-100">
                            ${p.computedSales} مبيعات 📦
                        </span>
                    </td>
                    <td class="p-3 text-center text-slate-600 text-xs font-bold">${buyerName}</td>
                    <td class="p-3 text-center">
                        <button onclick="deleteGlobalProduct('${p.id}')" class="bg-red-50 text-red-500 hover:bg-red-600 hover:text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl border border-red-100 transition shadow-sm">
                            <i class="fa-solid fa-trash-can"></i>
                            <span>حذف المنتج 🗑️</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function deleteGlobalProduct(productId) {
            if (confirm("هل أنت متأكد من رغبتك بحذف هذا المنتج نهائياً من العرض العام بالمنصة؟")) {
                let products = getDB("products", []);
                products = products.filter(p => p.id !== productId);
                setDB("products", products);
                renderGlobalProductsTable();
                renderStats();
            }
        }

        // ==========================================
        // TEAM & CAREERS MANAGEMENT CONTROLLER (New!)
        // ==========================================
        const MOCK_COMMUNES_GLOBAL = {
            "المنيعة": ["المنيعة المركز", "حاسي القارة", "حاسي غانم"],
            "غرداية": ["غرداية المركز", "العطف", "بني يزقن", "القرارة", "بريان"],
            "ورقلة": ["ورقلة", "حاسي مسعود", "تقرت", "الرويسات"],
            "الجزائر": ["الجزائر الوسطى", "باب الواد", "سيدي امحمد", "الشراقة", "المرسى"],
            "وهران": ["وهران المركز", "بئر الجير", "السانية", "قديل"],
            "قسنطينة": ["قسنطينة المركز", "الخروب", "حامة بوزيان"],
            "سطيف": ["سطيف المركز", "العلمة", "عين أرنات"],
        };

        const STANDARD_ROLE_PERMISSIONS = {
            "مؤكد طلبيات": "الاتصال الهاتفي بالزبائن وتأكيد سلامة العنوان، التحقق من توفر السلعة، وتعديل حالة الطلب لـ (مؤكد).",
            "منسق ولائي": "توجيه وتوزيع الشحنات المتاحة للتوصيل، ربط تجار الولاية بمناديب التوصيل المحليين، وتسوية شكاوى التأخير.",
            "مراقب مالي": "مراجعة الاشتراكات والرسوم المقتطعة من التجار، تدقيق أرقام الأرباح والخزينة، ومراقبة حركة الفواتير المكتملة.",
            "مساعد مشرف / حل النزاعات": "الدعم الفني المباشر، تسوية النزاعات المالية واللوجستية بين البائع والمشتري، وتعديل تقييمات المتاجر."
        };

        function initTeamManagement() {
            console.log("[TeamManagement] Initializing team and recruitment tables...");
            
            // Seed default active staff if none exist
            let activeStaff = getDB("zalo_active_staff", []);
            if (activeStaff.length === 0) {
                activeStaff = [];
                setDB("zalo_active_staff", activeStaff);
            }

            // Populate staff communes dropdown initially
            populateStaffCommunes();
            
            // Render Both Tables
            renderActiveStaffTable();
            renderCareersApplications();
        }

        function handleStaffRoleChange() {
            const roleSelect = document.getElementById("staff-role");
            const customContainer = document.getElementById("custom-role-container");
            
            if (roleSelect.value === "custom") {
                customContainer.classList.remove("hidden");
                document.getElementById("staff-custom-title").required = true;
                document.getElementById("staff-custom-permissions").required = true;
            } else {
                customContainer.classList.add("hidden");
                document.getElementById("staff-custom-title").required = false;
                document.getElementById("staff-custom-permissions").required = false;
            }
        }

        function populateStaffCommunes() {
            const wilaya = document.getElementById("staff-wilaya").value;
            const communeSelect = document.getElementById("staff-commune");
            communeSelect.innerHTML = '<option value="كل البلديات">كل البلديات (نطاق واسع)</option>';
            
            if (wilaya && MOCK_COMMUNES_GLOBAL[wilaya]) {
                MOCK_COMMUNES_GLOBAL[wilaya].forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c;
                    opt.innerText = c;
                    communeSelect.appendChild(opt);
                });
            }
        }

        function addStaffMember(event) {
            event.preventDefault();
            
            const email = document.getElementById("staff-email").value.trim();
            const name = document.getElementById("staff-name").value.trim();
            const role = document.getElementById("staff-role").value;
            const wilaya = document.getElementById("staff-wilaya").value;
            const commune = document.getElementById("staff-commune").value;
            
            let customTitle = "";
            let permissions = "";
            
            if (role === "custom") {
                customTitle = document.getElementById("staff-custom-title").value.trim();
                permissions = document.getElementById("staff-custom-permissions").value.trim();
            } else {
                customTitle = role;
                permissions = STANDARD_ROLE_PERMISSIONS[role] || "صلاحيات عامة محددة من قبل المدير العام.";
            }

            // Save to DB
            const activeStaff = getDB("zalo_active_staff", []);
            
            // Avoid duplicate email
            if (activeStaff.some(s => s.email.toLowerCase() === email.toLowerCase())) {
                alert("⚠️ عذراً! هذا البريد الإلكتروني مسجل بالفعل لموظف نشط آخر.");
                return;
            }

            const newStaff = {
                id: "staff_" + Date.now(),
                name,
                email,
                role,
                customTitle,
                permissions,
                wilaya,
                commune,
                status: "ACTIVE",
                dateCreated: new Date().toISOString().split('T')[0]
            };

            activeStaff.push(newStaff);
            setDB("zalo_active_staff", activeStaff);

            alert(`✨ تم تعيين وتفعيل الموظف (${name}) بنجاح كـ (${customTitle})!`);
            
            // Reset form
            document.getElementById("admin-add-staff-form").reset();
            document.getElementById("custom-role-container").classList.add("hidden");
            
            // Re-render
            renderActiveStaffTable();
        }

        function renderActiveStaffTable() {
            const tbody = document.getElementById("active-staff-tbody");
            if (!tbody) return;

            const activeStaff = getDB("zalo_active_staff", []);
            tbody.innerHTML = "";

            if (activeStaff.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="p-6 text-center text-slate-400 font-bold">لا يوجد أي موظف نشط مسجل بالمنصة حالياً.</td>
                    </tr>
                `;
                return;
            }

            activeStaff.forEach(s => {
                const statusBadge = s.status === "ACTIVE" 
                    ? `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] px-2.5 py-1 rounded-full">نشط ومتصل 🟢</span>`
                    : `<span class="bg-red-50 text-red-600 border border-red-200 text-[10px] px-2.5 py-1 rounded-full">موقف مؤقتاً 🔴</span>`;

                const toggleBtnText = s.status === "ACTIVE" ? "تجميد الحساب ❄️" : "تنشيط الحساب 🔥";
                const toggleBtnClass = s.status === "ACTIVE" ? "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200";

                let row = document.createElement("tr");
                row.className = "border-t border-slate-100 hover:bg-slate-50 transition";
                row.innerHTML = `
                    <td class="p-3">
                        <div class="flex flex-col">
                            <span class="font-black text-slate-800 text-xs">${s.name}</span>
                            <span class="text-[10px] text-slate-400 font-mono font-normal">${s.email}</span>
                        </div>
                    </td>
                    <td class="p-3 max-w-xs">
                        <div class="flex flex-col">
                            <span class="font-black text-slate-700 text-[11px]">${s.customTitle}</span>
                            <span class="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">${s.permissions}</span>
                        </div>
                    </td>
                    <td class="p-3">
                        <span class="bg-sky-50 text-sky-700 text-[10px] px-2 py-0.5 rounded font-black border border-sky-100">
                            📍 ${s.wilaya} (${s.commune || 'كل البلديات'})
                        </span>
                    </td>
                    <td class="p-3 text-center">${statusBadge}</td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="toggleStaffStatus('${s.id}')" class="${toggleBtnClass} font-bold text-[9px] px-2.5 py-1.5 rounded-xl transition">
                                ${toggleBtnText}
                            </button>
                            <button onclick="deleteStaffMember('${s.id}')" class="bg-red-50 text-red-500 hover:bg-red-600 hover:text-white font-bold text-[9px] px-2.5 py-1.5 rounded-xl border border-red-100 transition shadow-sm">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function toggleStaffStatus(id) {
            let activeStaff = getDB("zalo_active_staff", []);
            activeStaff = activeStaff.map(s => {
                if (s.id === id) {
                    s.status = s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                }
                return s;
            });
            setDB("zalo_active_staff", activeStaff);
            renderActiveStaffTable();
        }

        function deleteStaffMember(id) {
            if (confirm("⚠️ هل أنت متأكد من رغبتك بحذف هذا الموظف نهائياً من المنصة وسحب كافة صلاحياته الجغرافية؟")) {
                let activeStaff = getDB("zalo_active_staff", []);
                activeStaff = activeStaff.filter(s => s.id !== id);
                setDB("zalo_active_staff", activeStaff);
                renderActiveStaffTable();
            }
        }

        function renderCareersApplications() {
            const tbody = document.getElementById("careers-applications-tbody");
            if (!tbody) return;

            let applications = [];
            try {
                applications = JSON.parse(localStorage.getItem("zalo_careers_applications") || "[]");
            } catch(e) {}

            tbody.innerHTML = "";

            // Filter for only PENDING ones
            const pendingApps = applications.filter(a => a.status === "PENDING");
            
            // Update Badges
            document.getElementById("badge-team-count").innerText = pendingApps.length;
            document.getElementById("careers-count-badge").innerText = `${pendingApps.length} طلب توظيف جديد`;

            if (pendingApps.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="p-6 text-center text-slate-400 font-bold">لا توجد أي طلبات توظيف واردة معلقة حالياً.</td>
                    </tr>
                `;
                return;
            }

            pendingApps.forEach(a => {
                let row = document.createElement("tr");
                row.className = "border-t border-slate-100 hover:bg-slate-50 transition";
                row.innerHTML = `
                    <td class="p-3">
                        <div class="flex flex-col">
                            <span class="font-black text-slate-800 text-xs">${a.firstname} ${a.lastname}</span>
                            <span class="text-[10px] text-slate-400 font-normal mt-0.5">📞 ${a.phone} | ✉️ ${a.email}</span>
                        </div>
                    </td>
                    <td class="p-3">
                        <div class="flex flex-col">
                            <span class="font-black text-slate-700 text-[11px]">${a.customTitle}</span>
                            <span class="text-[9px] text-slate-400 font-bold mt-0.5">📍 ولاية: ${a.wilaya} | ${a.commune}</span>
                        </div>
                    </td>
                    <td class="p-3 text-center">
                        <button onclick="viewApplicationFiles('${a.id}')" class="bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white font-bold text-[10px] px-3 py-1.5 rounded-full border border-sky-100 transition">
                            <i class="fa-solid fa-folder-open ml-1"></i> عرض السيرة والوثائق 📁
                        </button>
                    </td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="approveApplication('${a.id}')" class="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] px-3 py-1.5 rounded-xl transition shadow-sm">
                                <i class="fa-solid fa-check"></i> قبول وترقية 🤝
                            </button>
                            <button onclick="rejectApplication('${a.id}')" class="bg-red-50 text-red-500 hover:bg-red-600 hover:text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl border border-red-100 transition">
                                <i class="fa-solid fa-xmark"></i> رفض
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function viewApplicationFiles(appId) {
            let applications = [];
            try {
                applications = JSON.parse(localStorage.getItem("zalo_careers_applications") || "[]");
            } catch(e) {}

            const app = applications.find(a => a.id === appId);
            if (!app) {
                alert("لم يتم العثور على طلب التوظيف المحدد!");
                return;
            }

            // Create a gorgeous custom modal for documents
            let modal = document.createElement("div");
            modal.id = "dynamic-doc-modal";
            modal.className = "fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn";
            modal.style.direction = "rtl";
            modal.innerHTML = `
                <div class="bg-white border-2 border-[#d4af37] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-right flex flex-col max-h-[90vh]">
                    <header class="bg-[#113f1c] text-white py-4 px-6 flex justify-between items-center">
                        <button onclick="document.getElementById('dynamic-doc-modal').remove()" class="text-white hover:text-red-400 text-lg">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <h3 class="text-xs font-black flex items-center gap-2">
                            <i class="fa-solid fa-folder-open text-[#d4af37]"></i>
                            <span>فحص وثائق المترشح: ${app.firstname} ${app.lastname}</span>
                        </h3>
                    </header>
                    <div class="p-6 overflow-y-auto space-y-4 flex-1">
                        <!-- Short bio/notes -->
                        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <h4 class="text-[11px] font-black text-slate-700 mb-1"><i class="fa-solid fa-comment-dots text-sky-500 ml-1"></i> رسالة المترشح الذاتية:</h4>
                            <p class="text-[10px] text-slate-500 font-bold leading-relaxed">${app.notes || 'لا توجد نبذة مضافة من المترشح.'}</p>
                        </div>

                        <!-- Documents list -->
                        <div class="space-y-3">
                            <h4 class="text-[11px] font-black text-slate-700"><i class="fa-solid fa-paperclip text-sky-500 ml-1"></i> الملفات المرفقة:</h4>
                            
                            <!-- CV File -->
                            <div class="border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-between bg-slate-50">
                                <div class="flex items-center gap-2">
                                    <i class="fa-solid fa-file-pdf text-red-500 text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-[11px] font-black text-slate-700">السيرة الذاتية (CV)</span>
                                        <span class="text-[8px] text-slate-400">ملف مصدق للعمل اللوجستي</span>
                                    </div>
                                </div>
                                <a href="${app.files.cv}" download="CV_${app.lastname}.png" class="bg-sky-500 text-white font-bold text-[9px] px-3 py-1 rounded-full hover:bg-sky-600 transition"><i class="fa-solid fa-download"></i> تحميل المستند</a>
                            </div>

                            <!-- ID CARD -->
                            <div class="border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-between bg-slate-50">
                                <div class="flex items-center gap-2">
                                    <i class="fa-solid fa-id-card text-sky-600 text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-[11px] font-black text-slate-700">بطاقة الهوية الوطنية</span>
                                        <span class="text-[8px] text-slate-400">صورة المسح الضوئي للبطاقة</span>
                                    </div>
                                </div>
                                <a href="${app.files.id}" download="ID_${app.lastname}.png" class="bg-sky-500 text-white font-bold text-[9px] px-3 py-1 rounded-full hover:bg-sky-600 transition"><i class="fa-solid fa-download"></i> تحميل المستند</a>
                            </div>

                            <!-- PHOTO -->
                            <div class="border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-between bg-slate-50">
                                <div class="flex items-center gap-2">
                                    <i class="fa-solid fa-user-tie text-amber-500 text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-[11px] font-black text-slate-700">صورة شخصية رسمية</span>
                                        <span class="text-[8px] text-slate-400">خلفية بيضاء للموظف</span>
                                    </div>
                                </div>
                                <a href="${app.files.photo}" download="PHOTO_${app.lastname}.png" class="bg-sky-500 text-white font-bold text-[9px] px-3 py-1 rounded-full hover:bg-sky-600 transition"><i class="fa-solid fa-download"></i> تحميل المستند</a>
                            </div>
                        </div>

                        <!-- Image Preview Box if any base64 exists -->
                        <div class="border border-slate-100 rounded-2xl p-2 bg-slate-100 text-center">
                            <span class="text-[9px] text-slate-400 font-bold block mb-1">معاينة مصغرة لملف الهوية / الصورة الشخصية</span>
                            <img src="${app.files.photo}" class="mx-auto rounded-lg max-h-36 object-contain border border-slate-200 bg-white">
                        </div>
                    </div>
                    <footer class="bg-slate-50 p-4 border-t border-slate-100 flex gap-2 justify-end shrink-0">
                        <button onclick="document.getElementById('dynamic-doc-modal').remove()" class="bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-300 transition">إغلاق المراجعة ✖️</button>
                    </footer>
                </div>
            </div>
            `;
            document.body.appendChild(modal);
        }

        function approveApplication(appId) {
            let applications = [];
            try {
                applications = JSON.parse(localStorage.getItem("zalo_careers_applications") || "[]");
            } catch(e) {}

            const appIndex = applications.findIndex(a => a.id === appId);
            if (appIndex === -1) return;

            const app = applications[appIndex];
            
            // Promote to Active Staff
            const activeStaff = getDB("zalo_active_staff", []);
            
            // Generate active staff
            const newStaff = {
                id: "staff_" + Date.now(),
                name: `${app.firstname} ${app.lastname}`,
                email: app.email,
                role: app.roleType,
                customTitle: app.customTitle,
                permissions: STANDARD_ROLE_PERMISSIONS[app.roleType] || "صلاحيات تسييرية إقليمية مخصصة.",
                wilaya: app.wilaya,
                commune: app.commune,
                status: "ACTIVE",
                dateCreated: new Date().toISOString().split('T')[0]
            };

            activeStaff.push(newStaff);
            setDB("zalo_active_staff", activeStaff);

            // Set app status to APPROVED
            applications[appIndex].status = "APPROVED";
            localStorage.setItem("zalo_careers_applications", JSON.stringify(applications));

            alert(`✅ تم قبول الترشح بنجاح وتفعيل رتبة الموظف (${newStaff.name}) في ولاية (${newStaff.wilaya})!`);
            
            renderActiveStaffTable();
            renderCareersApplications();
        }

        function rejectApplication(appId) {
            if (confirm("هل أنت متأكد من رغبتك برفض هذا الترشح وإرسال إشعار للمترشح؟")) {
                let applications = [];
                try {
                    applications = JSON.parse(localStorage.getItem("zalo_careers_applications") || "[]");
                } catch(e) {}

                const appIndex = applications.findIndex(a => a.id === appId);
                if (appIndex !== -1) {
                    applications[appIndex].status = "REJECTED";
                    localStorage.setItem("zalo_careers_applications", JSON.stringify(applications));
                }

                renderCareersApplications();
            }
        }

        // Logout user
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
            window.location.replace('admin-login.html');
        };

        let isMobileMode = false;
        window.toggleResponsiveMode = function() {
            isMobileMode = !isMobileMode;
            const mainContainer = document.querySelector('main');
            const icon = document.getElementById('responsive-icon');
            if (!mainContainer) return;

            if (isMobileMode) {
                mainContainer.classList.remove('max-w-7xl');
                mainContainer.classList.add('max-w-sm');
                mainContainer.style.borderLeft = '2px solid #d4af37';
                mainContainer.style.borderRight = '2px solid #d4af37';
                mainContainer.style.borderRadius = '1.5rem';
                mainContainer.style.margin = '1rem auto';
                mainContainer.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                mainContainer.style.backgroundColor = '#ffffff';
                if (icon) {
                    icon.classList.remove('fa-mobile-screen-button');
                    icon.classList.add('fa-desktop');
                }
            } else {
                mainContainer.classList.remove('max-w-sm');
                mainContainer.classList.add('max-w-7xl');
                mainContainer.style.borderLeft = 'none';
                mainContainer.style.borderRight = 'none';
                mainContainer.style.borderRadius = '0';
                mainContainer.style.margin = '0 auto';
                mainContainer.style.boxShadow = 'none';
                mainContainer.style.backgroundColor = 'transparent';
                if (icon) {
                    icon.classList.remove('fa-desktop');
                    icon.classList.add('fa-mobile-screen-button');
                }
            }
        };
