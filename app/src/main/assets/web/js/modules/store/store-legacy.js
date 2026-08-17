        // Global Tab switching logic
        window.switchTab = function(tabId) {
            const sections = ['home', 'settings', 'products', 'orders', 'qr', 'reports'];
            sections.forEach(s => {
                const secEl = document.getElementById('section-' + s);
                if (secEl) secEl.classList.add('hidden');
            });

            const activeSec = document.getElementById('section-' + tabId);
            if (activeSec) {
                activeSec.classList.remove('hidden');
            }

            sections.forEach(s => {
                const btnEl = document.getElementById('btn-tab-' + s);
                if (btnEl) btnEl.classList.remove('active');
            });
            const activeBtn = document.getElementById('btn-tab-' + tabId);
            if (activeBtn) activeBtn.classList.add('active');

            if (window.innerWidth < 1024) {
                window.closeSidebar();
            }
        };

        // Explicit Sidebar Management for Desktop & Mobile
        window.openSidebar = function() {
            const sidebar = document.getElementById('zalo-sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (!sidebar) return;

            sidebar.style.display = 'flex';
            sidebar.classList.remove('hidden');
            sidebar.classList.add('flex');

            if (overlay && window.innerWidth < 1024) {
                overlay.style.display = 'block';
                overlay.classList.remove('hidden');
            }
        };

        window.closeSidebar = function() {
            const sidebar = document.getElementById('zalo-sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (!sidebar) return;

            if (window.innerWidth < 1024) {
                sidebar.style.display = 'none';
                sidebar.classList.add('hidden');
                sidebar.classList.remove('flex');
            } else {
                sidebar.style.display = 'flex';
                sidebar.classList.remove('hidden');
                sidebar.classList.add('flex');
            }

            if (overlay) {
                overlay.style.display = 'none';
                overlay.classList.add('hidden');
            }
        };

        window.toggleSidebarMobile = window.toggleSidebar = function() {
            const sidebar = document.getElementById('zalo-sidebar');
            if (!sidebar) return;

            const computedDisplay = window.getComputedStyle(sidebar).display;
            if (computedDisplay === 'none' || sidebar.style.display === 'none' || sidebar.classList.contains('hidden')) {
                window.openSidebar();
            } else {
                if (window.innerWidth < 1024) {
                    window.closeSidebar();
                }
            }
        };

        // DB keys
        const DB_KEY_PREFIX = "zalo_";
        function getDB(key, fallback) {
            const data = localStorage.getItem(DB_KEY_PREFIX + key);
            return data ? JSON.parse(data) : fallback;
        }
        function setDB(key, value) {
            localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(value));
        }

        // Default local merchant settings seed
        const DEFAULT_MERCHANT_SETTINGS = {
            storeName: "",
            phone: "",
            category: "cat_phones",
            wilaya: "",
            commune: "",
            fb: "",
            ig: "",
            tiktok: "",
            tg: "",
            logoImg: "assets/icon-192.svg",
            coverImg: "assets/icon-192.svg",
            workingHours: "08:00 - 22:00",
            vatNumber: "198273615243000"
        };

        // Complete 69 Algerian Wilayas list for Merchant Settings
        const STORE_WILAYAS_69 = [
            "01 - أدرار", "02 - الشلف", "03 - الأغواط", "04 - أم البواقي", "05 - باتنة",
            "06 - بجاية", "07 - بسكرة", "08 - بشار", "09 - البليدة", "10 - البويرة",
            "11 - تمنراست", "12 - تبسة", "13 - تلمسان", "14 - تيارت", "15 - تيزي وزو",
            "16 - الجزائر", "17 - الجلفة", "18 - جيجل", "19 - سطيف", "20 - سعيدة",
            "21 - سكيكدة", "22 - سيدي بلعباس", "23 - عنابة", "24 - قالمة", "25 - قسنطينة",
            "26 - المدية", "27 - مستغانم", "28 - المسيلة", "29 - معسكر", "30 - ورقلة",
            "31 - وهران", "32 - البيض", "33 - إليزي", "34 - برج بوعريريج", "35 - بومرداس",
            "36 - الطارف", "37 - تندوف", "38 - تيسمسيلت", "39 - الوادي", "40 - خنشلة",
            "41 - سوق أهراس", "42 - تيبازة", "43 - ميلة", "44 - عين الدفلى", "45 - النعامة",
            "46 - عين تموشنت", "47 - غرداية", "48 - غليزان", "49 - تيميمون", "50 - برج باجي مختار",
            "51 - أولاد جلال", "52 - بني عباس", "53 - عين صالح", "54 - عين قزام", "55 - تقرت",
            "56 - جانت", "57 - المغير", "58 - المنيعة", "59 - بريكة", "60 - بوسعادة",
            "61 - مسعد", "62 - قصر الشلالة", "63 - العلمة", "64 - فرجيوة", "65 - شلغوم العيد",
            "66 - عين البيضاء", "67 - عين وسارة", "68 - الأبيض سيدي الشيخ", "69 - أفلو"
        ];

        const STORE_BALADIYAS = {
            "أدرار": ["أدرار", "تيميمون", "رقان", "تسابيت", "أولف", "زاوية كنتة"],
            "الشلف": ["الشلف", "تنس", "بوقادير", "المرسى", "عين مران"],
            "الأغواط": ["الأغواط", "أفلو", "حاسي الرمل", "قصر الحيران"],
            "أم البواقي": ["أم البواقي", "عين البيضاء", "عين مليلة", "مسكيانة"],
            "باتنة": ["باتنة", "أريس", "بريكة", "عين التوتة", "مروانة", "تيمقاد"],
            "بجاية": ["بجاية", "أقبو", "القصر", "تيشي", "سيدي عيش", "خراطة"],
            "بسكرة": ["بسكرة", "طولقة", "سيدي عقبة", "أولاد جلال", "زريبة الوادي"],
            "بشار": ["بشار", "تاغيت", "بني عباس", "القنادسة", "العبادلة"],
            "البليدة": ["البليدة", "بوفاريك", "العفرون", "موزاية", "الشبلي", "الشريعة"],
            "البويرة": ["البويرة", "سور الغزلان", "الأخضرية", "تيكجدة", "عين بسام"],
            "تمنراست": ["تمنراست", "عين صالح", "عين قزام", "أبالسا"],
            "تبسة": ["تبسة", "بئر العاتر", "الشريعة", "الوانزة"],
            "تلمسان": ["تلمسان", "مغنية", "الغزوات", "سبدو", "منصورة", "الرمشي"],
            "تيارت": ["تيارت", "السوقر", "فرندة", "قصر الشلالة"],
            "تيزي وزو": ["تيزي وزو", "عزازقة", "ذراع بن خدة", "عين الحمام", "أزفون", "تيقزيرت"],
            "الجزائر": ["الجزائر الوسطى", "باب الواد", "الحراش", "بئر مراد رايس", "سيدي امحمد", "القبة", "درارية", "الشراقة", "الرويبة", "زرالدة"],
            "الجلفة": ["الجلفة", "عين وسارة", "مسعد", "حاسي بحبح", "الشارف"],
            "جيجل": ["جيجل", "الطاهير", "الميلية", "العوانة", "زيامة منصورية"],
            "سطيف": ["سطيف", "العلمة", "عين أرنات", "بوقاعة", "عين ولمان", "جميلة"],
            "سعيدة": ["سعيدة", "عين الحجر", "يوب", "الحساسنة"],
            "سكيكدة": ["سكيكدة", "عزابة", "الحروش", "القُل", "تمالوس"],
            "سيدي بلعباس": ["سيدي بلعباس", "تلاغ", "سفيزف", "عين البرد", "ابن باديس"],
            "عنابة": ["عنابة", "البوني", "الحجار", "برحال", "سرايدي"],
            "قالمة": ["قالمة", "وادي الزناتي", "بوشقوف", "هليوبوليس"],
            "قسنطينة": ["قسنطينة", "الخروب", "حامة بوزيان", "زيغود يوسف", "عين سمارة", "علي منجلي"],
            "المدية": ["المدية", "البرواقية", "قصر البخاري", "تابلاط", "عزيز"],
            "مستغانم": ["مستغانم", "عين تدلس", "حاسي ماماش", "سيدي علي", "مقطع دوز"],
            "المسيلة": ["المسيلة", "بوسعادة", "مقرة", "سيدي عيسى", "حمام ضلع"],
            "معسكر": ["معسكر", "سيق", "محمدية", "تيغنيف", "غريس"],
            "ورقلة": ["ورقلة", "حاسي مسعود", "تقرت", "الرويسات", "الأنقوسة"],
            "وهران": ["وهران", "بئر الجير", "السانية", "أرزيو", "قديل", "عين الترك", "بطيوة"],
            "البيض": ["البيض", "بوقطب", "بريزينة", "الأبيض سيدي الشيخ"],
            "إليزي": ["إليزي", "جانت", "إن أمناس", "برج الحواس"],
            "برج بوعريريج": ["برج بوعريريج", "رأس الوادي", "مجانة", "برج زمورة"],
            "بومرداس": ["بومرداس", "دلس", "برج منايل", "خميس الخشنة", "يسر", "الثنية"],
            "الطارف": ["الطارف", "القالة", "بوثلجة", "الذرعان", "بن مهيدي"],
            "تندوف": ["تندوف", "أم العسل"],
            "تيسمسيلت": ["تيسمسيلت", "ثنية الحد", "برج بونعامة", "خميستي"],
            "الوادي": ["الوادي", "قمار", "الدبيلة", "جامعة", "المغير", "الرقيبة"],
            "خنشلة": ["خنشلة", "ششار", "قايس", "بوحمامة", "أولاد رشاش"],
            "سوق أهراس": ["سوق أهراس", "سدراتة", "مداوروش", "تاورة", "المشروحة"],
            "تيبازة": ["تيبازة", "شرشال", "القليعة", "حجوط", "بوسماعيل", "فوكة"],
            "ميلة": ["ميلة", "شلغوم العيد", "تاجنانت", "فرجيوة", "قرارم قوقة"],
            "عين الدفلى": ["عين الدفلى", "خميس مليانة", "العطاف", "مليانة", "جليدة"],
            "النعامة": ["النعامة", "مشرية", "عين الصفراء", "مكمن بن عمار"],
            "عين تموشنت": ["عين تموشنت", "بني صاف", "حمام بوحجر", "العامرية"],
            "غرداية": ["غرداية", "بني يزقن", "بونورة", "القرارة", "متليلي", "العطف"],
            "غليزان": ["غليزان", "وادي ارهيو", "مازونة", "زمورة", "المطمر"],
            "تيميمون": ["تيميمون", "أوقروت", "شروين"],
            "برج باجي مختار": ["برج باجي مختار", "تيمياوين"],
            "أولاد جلال": ["أولاد جلال", "سيدي خالد", "رأس الميعاد"],
            "بني عباس": ["بني عباس", "كرزاز", "الواتة", "طبلبالة"],
            "عين صالح": ["عين صالح", "إينغر", "فقارة الزاوية"],
            "عين قزام": ["عين قزام", "تين زواتين"],
            "تقرت": ["تقرت", "النزلة", "تبسبست", "المقارين"],
            "جانت": ["جانت", "برج الحواس"],
            "المغير": ["المغير", "جامعة", "أم الطيور"],
            "المنيعة": ["المنيعة", "حاسي القارة", "حاسي الفحل"],
            "بريكة": ["بريكة", "أولاد دراج", "الجزار"],
            "بوسعادة": ["بوسعادة", "سيدي عيسى", "الهامل"],
            "مسعد": ["مسعد", "فيض البطمة", "دلدول"],
            "قصر الشلالة": ["قصر الشلالة", "زمالة الأمير عبد القادر"],
            "العلمة": ["العلمة", "بئر العرش", "بازر سكرة"],
            "فرجيوة": ["فرجيوة", "بوحاتم", "عين البيضاء أحريش"],
            "شلغوم العيد": ["شلغوم العيد", "تاجنانت", "وادي العثمانية"],
            "عين البيضاء": ["عين البيضاء", "بريش", "فكرينة"],
            "عين وسارة": ["عين وسارة", "بيرين", "القرنيني"],
            "الأبيض سيدي الشيخ": ["الأبيض سيدي الشيخ", "بريزينة", "البنود"],
            "أفلو": ["أفلو", "سبقاق", "سيدي بوزيد"],
            "default": ["مركز البلدية الرئيسي", "حي السوق المركزي", "المنطقة التجارية"]
        };

        window.handleStoreWilayaChange = function(wilayaVal) {
            const communeSelect = document.getElementById('settings-commune');
            const customInput = document.getElementById('settings-custom-commune');
            if (!communeSelect) return;

            let cleanName = wilayaVal.replace(/^[0-9]+\s*-\s*/, '').trim();
            cleanName = cleanName.replace(/\s*\(.*\)/, '').trim();

            const baladiyas = STORE_BALADIYAS[cleanName] || STORE_BALADIYAS[wilayaVal] || STORE_BALADIYAS["default"];
            
            communeSelect.innerHTML = '';
            baladiyas.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b;
                opt.textContent = b;
                communeSelect.appendChild(opt);
            });

            // Add other option
            const otherOpt = document.createElement('option');
            otherOpt.value = "بلدية أخرى (اكتبها في العنوان)";
            otherOpt.textContent = "✍️ بلدية أخرى (كتابة يدوية)";
            communeSelect.appendChild(otherOpt);

            if (customInput) {
                customInput.classList.add('hidden');
                customInput.value = '';
            }
        };

        window.handleStoreCommuneChange = function(communeVal) {
            const customInput = document.getElementById('settings-custom-commune');
            if (!customInput) return;

            if (communeVal && (communeVal.includes('أخرى') || communeVal.includes('اكتبها') || communeVal.includes('يدوية'))) {
                customInput.classList.remove('hidden');
                customInput.focus();
            } else {
                customInput.classList.add('hidden');
            }
        };

        window.initOldMerchantDashboard = function() {
            // Read active store details from registration session or local storage
            const activeStoreName = sessionStorage.getItem('reg_storeName') || localStorage.getItem('zalo_active_store') || sessionStorage.getItem('merchant_store_name') || "";
            const activePhone = sessionStorage.getItem('reg_phone') || "";
            const activeWilaya = sessionStorage.getItem('reg_wilaya') || "";
            const activeCommune = sessionStorage.getItem('reg_commune') || "";
            const activeOwner = sessionStorage.getItem('reg_fullName') || "";

            let settings = getDB("merchant_store_settings", DEFAULT_MERCHANT_SETTINGS);

            if (activeStoreName) settings.storeName = activeStoreName;
            if (activePhone) settings.phone = activePhone;
            if (activeWilaya) settings.wilaya = activeWilaya;
            if (activeCommune) settings.commune = activeCommune;

            if (!settings.storeName) settings.storeName = "متجر ZaLo";
            if (!settings.wilaya) settings.wilaya = "16 - الجزائر";

            setDB("merchant_store_settings", settings);

            // Populate settings-wilaya with all 69 Algerian Wilayas
            const inputWilaya = document.getElementById('settings-wilaya');
            if (inputWilaya) {
                inputWilaya.innerHTML = '';
                STORE_WILAYAS_69.forEach(w => {
                    const opt = document.createElement('option');
                    opt.value = w;
                    opt.textContent = w;
                    if (settings.wilaya && (settings.wilaya === w || w.includes(settings.wilaya) || settings.wilaya.includes(w))) {
                        opt.selected = true;
                    }
                    inputWilaya.appendChild(opt);
                });
            }

            // Populate Baladiyas for active wilaya
            window.handleStoreWilayaChange(inputWilaya ? inputWilaya.value : (settings.wilaya || '16 - الجزائر'));

            const inputCommune = document.getElementById('settings-commune');
            const customCommuneInput = document.getElementById('settings-custom-commune');
            if (inputCommune && settings.commune) {
                let matched = false;
                for (let i = 0; i < inputCommune.options.length; i++) {
                    if (inputCommune.options[i].value === settings.commune) {
                        inputCommune.selectedIndex = i;
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    inputCommune.value = "بلدية أخرى (اكتبها في العنوان)";
                    if (customCommuneInput) {
                        customCommuneInput.classList.remove('hidden');
                        customCommuneInput.value = settings.commune;
                    }
                }
            }

            // Set input values
            const inputName = document.getElementById('settings-store-name');
            if (inputName) inputName.value = settings.storeName;
            const inputPhone = document.getElementById('settings-phone');
            if (inputPhone) inputPhone.value = settings.phone;
            const inputCat = document.getElementById('settings-category');
            if (inputCat) inputCat.value = settings.category || "";

            const inputFb = document.getElementById('settings-fb');
            if (inputFb) inputFb.value = settings.fb || '';
            const inputIg = document.getElementById('settings-ig');
            if (inputIg) inputIg.value = settings.ig || '';
            const inputTiktok = document.getElementById('settings-tiktok');
            if (inputTiktok) inputTiktok.value = settings.tiktok || '';
            const inputTg = document.getElementById('settings-tg');
            if (inputTg) inputTg.value = settings.tg || '';
            
            const inputHours = document.getElementById('settings-hours');
            if (inputHours) inputHours.value = settings.workingHours || "08:00 - 22:00";
            const inputVat = document.getElementById('settings-vat');
            if (inputVat) inputVat.value = settings.vatNumber || "198273615243000";
            
            // Shareable store URL
            const storeUrlInput = document.getElementById('settings-store-url');
            if (storeUrlInput) {
                const cleanName = settings.storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
                storeUrlInput.value = `https://zalo.dz/store/${cleanName || 'zalo'}`;
            }

            // Image previews
            if (settings.logoImg) {
                const logoPrev = document.getElementById('logo-preview');
                if (logoPrev) logoPrev.src = settings.logoImg;
                const profImg = document.getElementById('profile-store-image');
                if (profImg) profImg.src = settings.logoImg;
                const sidebarLogo = document.getElementById('sidebar-store-logo-preview');
                if (sidebarLogo) sidebarLogo.src = settings.logoImg;
            }
            if (settings.coverImg) {
                const coverPrev = document.getElementById('cover-preview');
                if (coverPrev) coverPrev.src = settings.coverImg;
            }

            const profileName = document.getElementById('profile-store-name');
            if (profileName) profileName.innerText = settings.storeName;

            const profileWilaya = document.getElementById('profile-store-wilaya');
            if (profileWilaya) profileWilaya.innerText = "المركز الاقتصادي: " + settings.wilaya + (settings.commune ? (" - " + settings.commune) : "");

            const sidebarName = document.getElementById('sidebar-user-name');
            if (sidebarName) sidebarName.innerText = settings.storeName;

            const invName = document.getElementById('inv-store-name');
            if (invName) invName.innerText = settings.storeName;

            const invInfo = document.getElementById('inv-store-info');
            if (invInfo) invInfo.innerText = `العنوان: ${settings.wilaya}، الجزائر | هاتف: ${settings.phone || '0658000000'}`;

            const sidebarEmail = document.getElementById('sidebar-user-email');
            if (sidebarEmail && activeOwner) sidebarEmail.innerText = activeOwner;

            // Initialize dynamic categories and subcategories
            if (typeof setupDynamicCategorySelects === 'function') {
                setupDynamicCategorySelects('settings-category', 'settings-subcategory', settings.category, settings.subcategory);
                setupDynamicCategorySelects('prod-main-category', 'prod-sub-category');
            }

            updateCounters();
            renderMerchantProducts();
            renderMerchantOrders();
            initMerchantQR();
            renderMerchantFinancialReports();
        };

        // Live image previews with canvas compression & Cloud Storage CDN upload
        function previewImage(input, previewId) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
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
                            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);

                            const prevEl = document.getElementById(previewId);
                            if (prevEl) prevEl.src = compressedDataUrl;
                            
                            let settings = getDB("merchant_store_settings", DEFAULT_MERCHANT_SETTINGS);
                            if (previewId === 'logo-preview') {
                                settings.logoImg = compressedDataUrl;
                                const pLogo = document.getElementById('profile-store-image');
                                if (pLogo) pLogo.src = compressedDataUrl;
                                const sidebarLogo = document.getElementById('sidebar-store-logo-preview');
                                if (sidebarLogo) sidebarLogo.src = compressedDataUrl;
                            } else {
                                settings.coverImg = compressedDataUrl;
                            }
                            setDB("merchant_store_settings", settings);

                            // Direct Cloud Storage CDN Upload
                            if (window.supabaseClient && window.supabaseClient.storage) {
                                canvas.toBlob(async (blob) => {
                                    if (!blob) return;
                                    const filePath = `stores/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                                    const { data, error } = await window.supabaseClient.storage
                                        .from('stores')
                                        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });
                                    if (!error && data) {
                                        const { data: pubData } = window.supabaseClient.storage.from('stores').getPublicUrl(filePath);
                                        if (pubData && pubData.publicUrl) {
                                            const cdnUrl = pubData.publicUrl;
                                            if (prevEl) prevEl.src = cdnUrl;
                                            if (previewId === 'logo-preview') {
                                                settings.logoImg = cdnUrl;
                                            } else {
                                                settings.coverImg = cdnUrl;
                                            }
                                            setDB("merchant_store_settings", settings);
                                            console.log("Store image uploaded to Supabase Storage CDN:", cdnUrl);
                                        }
                                    }
                                }, 'image/jpeg', 0.75);
                            }
                        } catch(err) {
                            console.warn("Store image compression/upload note:", err);
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        }

        // Preview multi angle product images
        window.uploadedAnglesPreview = [];
        window.uploadedProductImage = null;
        let uploadedAnglesPreview = [];
        function previewProductAngles(input) {
            if (input.files && input.files[0]) {
                window.uploadedAnglesPreview = [];
                uploadedAnglesPreview = [];
                const files = Array.from(input.files);
                let loadedCount = 0;
                
                files.forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const raw = e.target.result;
                        const img = new Image();
                        img.onload = function() {
                            const canvas = document.createElement('canvas');
                            const maxDim = 800;
                            let w = img.width, h = img.height;
                            if (w > maxDim || h > maxDim) {
                                if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                                else { w = Math.round((w * maxDim) / h); h = maxDim; }
                            }
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, w, h);
                            const compressed = canvas.toDataURL('image/jpeg', 0.85);
                            
                            window.uploadedAnglesPreview.push(compressed);
                            uploadedAnglesPreview.push(compressed);
                            window.uploadedProductImage = compressed;
                            
                            loadedCount++;
                            if (loadedCount === files.length) {
                                const lbl = document.getElementById('angles-upload-lbl');
                                if (lbl) {
                                    lbl.innerText = `تم رفع وتجهيز (${files.length}) صور بنجاح ✓`;
                                    lbl.className = "text-emerald-500 font-bold";
                                }
                                const prevBox = document.getElementById('angles-preview');
                                if (prevBox) {
                                    prevBox.innerHTML = window.uploadedAnglesPreview.map(src => `<img src="${src}" class="w-12 h-12 rounded-lg object-cover border-2 border-emerald-400 shadow-sm inline-block mr-1">`).join('');
                                }
                            }
                        };
                        img.src = raw;
                    };
                    reader.readAsDataURL(file);
                });
            }
        }
        window.previewProductAngles = previewProductAngles;

        // Preview product video upload
        let uploadedVideoFile = null;
        function previewProductVideo(input) {
            if (input.files && input.files[0]) {
                uploadedVideoFile = input.files[0].name;
                document.getElementById('video-upload-lbl').innerText = `مرفق: ${uploadedVideoFile.substring(0, 10)}...`;
                document.getElementById('video-upload-lbl').className = "text-emerald-500 font-bold";
            }
        }

        // Copy Store URL helper
        function copyStoreURL() {
            const urlInput = document.getElementById('settings-store-url');
            urlInput.select();
            urlInput.setSelectionRange(0, 99999); 
            navigator.clipboard.writeText(urlInput.value);
            showPermissionAudit({
                actionName: 'مشاركة ونشر الرابط التجاري لمتجرك المباشر',
                allowedRoles: ['merchant', 'admin'],
                currentRole: 'merchant',
                status: 'GRANTED',
                description: 'بصفتك تاجراً معتمداً، لديك الصلاحية الكاملة لتوليد ومشاركة رابط متجرك المباشر مع الزبائن والجمهور عبر منصات التواصل (فيسبوك، إنستغرام) لتلقي الطلبات مباشرة وبدء عمليات البيع والشحن الفوري!'
            });
        }

        // Save settings handler
        async function saveStoreSettings(e) {
            e.preventDefault();

            let logoImg = document.getElementById('logo-preview').src;
            let coverImg = document.getElementById('cover-preview').src;

            let selectedCommune = document.getElementById('settings-commune').value;
            const customCommuneVal = document.getElementById('settings-custom-commune') ? document.getElementById('settings-custom-commune').value.trim() : '';
            if ((selectedCommune.includes('أخرى') || selectedCommune.includes('اكتبها') || selectedCommune.includes('يدوية')) && customCommuneVal) {
                selectedCommune = customCommuneVal;
            }

            const selectedWilaya = document.getElementById('settings-wilaya').value;
            const selectedCat = document.getElementById('settings-category').value;
            const selectedSubCat = document.getElementById('settings-subcategory') ? document.getElementById('settings-subcategory').value : '';

            let settings = {
                storeName: document.getElementById('settings-store-name').value.trim(),
                phone: document.getElementById('settings-phone').value.trim(),
                category: selectedCat,
                subcategory: selectedSubCat,
                wilaya: selectedWilaya,
                commune: selectedCommune,
                fb: document.getElementById('settings-fb').value.trim(),
                ig: document.getElementById('settings-ig').value.trim(),
                tiktok: document.getElementById('settings-tiktok').value.trim(),
                tg: document.getElementById('settings-tg').value.trim(),
                logoImg: logoImg,
                coverImg: coverImg,
                workingHours: document.getElementById('settings-hours').value.trim(),
                vatNumber: document.getElementById('settings-vat').value.trim()
            };

            setDB("merchant_store_settings", settings);

            // Update profile card details live
            document.getElementById('profile-store-name').innerText = settings.storeName;
            document.getElementById('profile-store-wilaya').innerText = "المركز الاقتصادي: " + settings.wilaya + (settings.commune ? (" - " + settings.commune) : "");
            document.getElementById('profile-store-image').src = settings.logoImg;

            // Sync with sidebar
            const sidebarLogo = document.getElementById('sidebar-store-logo-preview');
            if (sidebarLogo) sidebarLogo.src = settings.logoImg;
            const sidebarName = document.getElementById('sidebar-user-name');
            if (sidebarName) sidebarName.innerText = settings.storeName;

            // Update local stores array
            let stores = getDB("stores", []);
            let store = stores.find(s => s.storeId === "store_salam" || s.storeName === settings.storeName);
            if (store) {
                store.storeName = settings.storeName;
                store.phone = settings.phone;
                store.address = settings.commune + "، " + settings.wilaya;
                store.image = settings.logoImg;
                store.coverImage = settings.coverImg;
                setDB("stores", stores);
            }

            // Sync to Supabase stores table if available
            try {
                if (window.supabaseClient) {
                    const userUid = localStorage.getItem('zalo_uid') || localStorage.getItem('user_uid');
                    if (userUid) {
                        await window.supabaseClient.from('stores').upsert({
                            owner_id: userUid,
                            name: settings.storeName,
                            phone: settings.phone,
                            wilaya: settings.wilaya,
                            commune: settings.commune,
                            category: settings.category,
                            logo_url: settings.logoImg,
                            cover_url: settings.coverImg,
                            status: 'approved',
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'owner_id' });
                    }
                }
            } catch(err) {
                console.warn('Supabase store update:', err);
            }

            // Show success banner
            const banner = document.getElementById('settings-success-banner');
            if (banner) {
                banner.classList.remove('hidden');
                banner.scrollIntoView({ behavior: 'smooth', block: 'center' });

                setTimeout(() => {
                    banner.classList.add('hidden');
                }, 5000);
            }
        }

        // Overrides and custom renders for local dashboard with custom fields
        async function renderMerchantProducts() {
            let list = document.getElementById("merchant-product-list");
            if (!list) return;

            let currentStoreSettings = {};
            try {
                currentStoreSettings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || '{}');
            } catch(e) {}

            const realStoreName = currentStoreSettings.storeName || currentStoreSettings.name || localStorage.getItem('zalo_active_store') || sessionStorage.getItem('merchant_store_name') || '';
            const realStoreId = currentStoreSettings.id || localStorage.getItem('zalo_uid') || localStorage.getItem('user_uid') || '';

            let products = getDB("products", []);
            
            // Sync with Supabase products
            try {
                if (window.supabaseClient) {
                    const { data: sbProds } = await window.supabaseClient.from('products').select('*');
                    if (sbProds && Array.isArray(sbProds)) {
                        sbProds.forEach(sp => {
                            const pId = sp.id || sp.productId;
                            const pName = sp.name || sp.productName || 'منتج';
                            const exists = products.some(lp => (lp.productId && lp.productId === pId) || (lp.id && lp.id === pId) || (lp.productName === pName));
                            if (!exists) {
                                products.push({
                                    productId: pId,
                                    id: pId,
                                    productName: pName,
                                    price: sp.price || 0,
                                    stock: sp.stock || sp.stock_quantity || 0,
                                    category: sp.category || 'عام',
                                    subcategory: sp.subcategory || '',
                                    description: sp.description || '',
                                    sku: sp.sku || `ZL-${pId}`,
                                    weight: sp.weight || 0.1,
                                    minOrder: sp.minOrder || 1,
                                    image: sp.image_url || sp.image || 'assets/icon-192.svg',
                                    storeName: sp.store_name || sp.storeName || realStoreName,
                                    storeId: sp.store_id || sp.storeId || realStoreId
                                });
                            }
                        });
                        setDB("products", products);
                    }
                }
            } catch (err) {
                console.warn("Could not sync products from Supabase:", err);
            }

            list.innerHTML = "";

            // Filter for current merchant
            let merchantProds = products.filter(p => {
                if (!realStoreName && !realStoreId) return true;
                const matchId = realStoreId && (p.storeId === realStoreId || p.store_id === realStoreId);
                const matchName = realStoreName && (p.storeName === realStoreName || p.store_name === realStoreName);
                return matchId || matchName;
            });

            if (merchantProds.length === 0 && products.length > 0 && !realStoreName) {
                merchantProds = products;
            }

            if (merchantProds.length === 0) {
                list.innerHTML = `
                    <tr>
                        <td colspan="4" class="p-8 text-center text-slate-500">
                            <div class="flex flex-col items-center justify-center gap-2">
                                <i class="fa-solid fa-box-open text-3xl text-slate-300"></i>
                                <p class="font-bold text-slate-600 text-sm">لا توجد منتجات مسجلة في متجرك حالياً</p>
                                <p class="text-xs text-slate-400">أضف منتجك الأول من النموذج الجانبي لتظهر سلعك للزبائن</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            merchantProds.forEach(p => {
                let skuLabel = p.sku ? `<span class="text-[9px] text-slate-400 font-mono">الباركود: ${p.sku}</span>` : '';
                let weightLabel = p.weight ? `<span class="text-[9px] text-slate-400">الوزن: ${p.weight} كغ</span>` : '';
                let minOrderLabel = p.minOrder ? `<span class="text-[9px] text-amber-600 font-bold">أقل كمية: ${p.minOrder}</span>` : '';
                let catLabel = p.category ? `<span class="text-[9px] bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded font-bold">${p.category}${p.subcategory ? ' - ' + p.subcategory : ''}</span>` : '';
                let pImg = p.image || p.image_url || p.img || 'assets/icon-192.svg';

                let item = document.createElement("tr");
                item.className = "border-t border-slate-100 hover:bg-slate-50 transition";
                item.innerHTML = `
                    <td class="p-3 text-right">
                        <div class="flex items-center gap-3">
                            <img src="${pImg}" class="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm" onerror="this.src='assets/icon-192.svg'">
                            <div>
                                <p class="font-bold text-slate-800 text-xs">${p.productName || p.name}</p>
                                <div class="flex flex-wrap gap-1.5 mt-1 items-center">
                                    ${catLabel}
                                    ${skuLabel}
                                    ${weightLabel}
                                    ${minOrderLabel}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="p-3 text-right font-black text-slate-800 text-xs">${parseFloat(p.price || 0).toLocaleString()} دج</td>
                    <td class="p-3 text-right text-slate-600 font-bold text-xs">${p.stock || 0} قطعة</td>
                    <td class="p-3 text-center">
                        <div class="flex gap-1 justify-center">
                            <button class="bg-[#113f1c] hover:bg-[#1a4f26] text-white text-[10px] px-2.5 py-1 rounded-lg font-bold transition" onclick="duplicateProduct('${p.productId || p.id}')" title="نسخ وتكرار المنتج لتسريع العمل">تكرار</button>
                            <button class="bg-amber-500 hover:bg-amber-600 text-slate-900 text-[10px] px-2.5 py-1 rounded-lg font-bold transition" onclick="openVariantsModal('${p.productId || p.id}')">خيارات</button>
                            <button class="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold transition" onclick="deleteMerchantProduct('${p.productId || p.id}')">حذف</button>
                        </div>
                    </td>
                `;
                list.appendChild(item);
            });
        }

        // Custom duplicate product helper
        function duplicateProduct(productId) {
            let products = getDB("products", []);
            let original = products.find(p => p.productId === productId);
            if (original) {
                // Pre-fill form fields
                document.getElementById('prod-name').value = original.productName + " - نسخة";
                document.getElementById('prod-price').value = original.price;
                document.getElementById('prod-stock').value = original.stock;
                document.getElementById('prod-category').value = original.category || "cat_phones";
                document.getElementById('prod-desc').value = original.description || "";
                document.getElementById('prod-sku').value = (original.sku || "SKU") + "-COPY";
                document.getElementById('prod-weight').value = original.weight || 0.1;
                document.getElementById('prod-min-order').value = original.minOrder || 1;

                document.getElementById('prod-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
                alert(`تم ملء بيانات المنتج من "${original.productName}" لتسهيل النشر والتكرار! 🚀`);
            }
        }

        // Add Product with dynamic customized attributes
        async function merchantAddProduct(e) {
            e.preventDefault();

            let products = getDB("products", []);
            
            // Get current active store details
            let currentStoreSettings = {};
            try {
                currentStoreSettings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || '{}');
            } catch(e) {}

            const realStoreName = currentStoreSettings.storeName || currentStoreSettings.name || localStorage.getItem('zalo_active_store') || sessionStorage.getItem('merchant_store_name') || 'متجر معتمد';
            
            let realStoreId = currentStoreSettings.id || localStorage.getItem('zalo_uid') || localStorage.getItem('user_uid');
            if (!realStoreId) {
                realStoreId = 'store_' + Date.now();
                localStorage.setItem('zalo_uid', realStoreId); // Save it so they own it
            }

            const realWilaya = currentStoreSettings.wilaya || currentStoreSettings.location || localStorage.getItem('zalo_selected_wilaya') || 'الجزائر';
            const realPhone = currentStoreSettings.phone || currentStoreSettings.storePhone || '';

            const pId = "p_" + Date.now();
            
            let pImg = "assets/icon-192.svg"; // fallback default
            if (window.uploadedAnglesPreview && window.uploadedAnglesPreview.length > 0) {
                pImg = window.uploadedAnglesPreview[0];
            } else if (uploadedAnglesPreview && uploadedAnglesPreview.length > 0) {
                pImg = uploadedAnglesPreview[0];
            } else if (window.uploadedProductImage) {
                pImg = window.uploadedProductImage;
            }

            const mainCatVal = document.getElementById('prod-main-category')?.value || document.getElementById('prod-category')?.value || 'عام';
            const subCatVal = document.getElementById('prod-sub-category')?.value || '';

            const newProd = {
                productId: pId,
                id: pId,
                productName: document.getElementById('prod-name').value.trim(),
                name: document.getElementById('prod-name').value.trim(),
                price: parseFloat(document.getElementById('prod-price').value),
                stock: parseInt(document.getElementById('prod-stock').value),
                category: mainCatVal,
                subcategory: subCatVal,
                description: document.getElementById('prod-desc').value.trim(),
                sku: document.getElementById('prod-sku').value.trim(),
                weight: parseFloat(document.getElementById('prod-weight').value) || 0.1,
                minOrder: parseInt(document.getElementById('prod-min-order').value) || 1,
                storeId: realStoreId,
                store_id: realStoreId,
                storeName: realStoreName,
                store_name: realStoreName,
                wilaya: realWilaya,
                phone: realPhone,
                variants: "",
                image: pImg,
                image_url: pImg,
                imageUrl: pImg
            };

            products.unshift(newProd);
            setDB("products", products);

            // Also keep zalo_products synced directly (avoiding DB_KEY_PREFIX bug)
            try {
                let zp = JSON.parse(localStorage.getItem("zalo_products") || "[]");
                zp.unshift(newProd);
                localStorage.setItem("zalo_products", JSON.stringify(zp));
            } catch(e) {}

            // Write to Supabase table products if active
            try {
                if (window.supabaseClient) {
                    const sbPayload = {
                        id: pId,
                        productId: pId,
                        name: newProd.productName,
                        productName: newProd.productName,
                        price: newProd.price,
                        stock: newProd.stock,
                        category: mainCatVal,
                        subcategory: subCatVal,
                        description: newProd.description,
                        sku: newProd.sku,
                        weight: newProd.weight,
                        minOrder: newProd.minOrder,
                        store_id: realStoreId,
                        storeId: realStoreId,
                        store_name: realStoreName,
                        storeName: realStoreName,
                        wilaya: realWilaya,
                        phone: realPhone,
                        image: newProd.image,
                        image_url: newProd.image,
                        status: 'active'
                    };
                    await window.supabaseClient.from('products').insert(sbPayload);
                    console.log("Successfully inserted product to Supabase products table.");
                }
            } catch (err) {
                console.error("Failed to sync new product to Supabase:", err);
            }

            // Clear inputs
            document.getElementById('prod-name').value = '';
            document.getElementById('prod-price').value = '';
            document.getElementById('prod-sku').value = 'SKU-' + Math.floor(1000 + Math.random() * 9000);
            document.getElementById('prod-weight').value = '';
            document.getElementById('prod-min-order').value = '1';
            document.getElementById('prod-desc').value = '';

            // Reset image/video uploads labels
            document.getElementById('angles-upload-lbl').innerText = "اضغط لرفع صور (0)";
            document.getElementById('angles-upload-lbl').className = "text-sky-500 font-bold";
            document.getElementById('video-upload-lbl').innerText = "اضغط لرفع فيديو";
            document.getElementById('video-upload-lbl').className = "text-sky-500 font-bold";

            alert("تم عرض وإضافة سلعتك الجديدة بنجاح بالباركود والمواصفات! 🚀");
            renderMerchantProducts();
            updateCounters();
        }

        // Delete Product
        window.deleteMerchantProduct = function(productId) {
            const doDelete = () => {
                // 1. Delete from getDB / setDB legacy store
                let products = getDB("products", []);
                let filtered = products.filter(p => String(p.productId || p.id) !== String(productId));
                setDB("products", filtered);

                // 2. Delete from zalo_products direct storage
                try {
                    let zp = JSON.parse(localStorage.getItem("zalo_products") || "[]");
                    zp = zp.filter(p => String(p.id || p.productId) !== String(productId));
                    localStorage.setItem("zalo_products", JSON.stringify(zp));
                } catch(e) {}

                // 3. Delete from zalo_live_stories if it was posted as a story
                try {
                    let stories = JSON.parse(localStorage.getItem("zalo_live_stories") || "[]");
                    stories = stories.filter(s => String(s.productId) !== String(productId) && String(s.id) !== String(productId));
                    localStorage.setItem("zalo_live_stories", JSON.stringify(stories));
                } catch(e) {}

                // 4. Delete from Supabase if connected
                if (window.supabaseClient) {
                    window.supabaseClient.from('products').delete().eq('id', productId).then(() => {}).catch(() => {});
                    window.supabaseClient.from('market_posts').delete().eq('id', productId).then(() => {}).catch(() => {});
                }

                renderMerchantProducts();
                if (typeof renderMerchantStories === 'function') {
                    renderMerchantStories();
                }
                updateCounters();

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'تم حذف السلعة بنجاح! 🗑️',
                        text: 'تمت إزالة السلعة من المتجر والمعرض الرقمي وقصص السوق.',
                        confirmButtonText: 'حسناً',
                        timer: 2000
                    });
                } else {
                    alert("تم حذف السلعة بنجاح من متجرك والمعرض الرقمي! 🗑️");
                }
            };

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'هل أنت متأكد من حذف هذه السلعة؟',
                    text: 'سيتم حذف السلعة نهائياً من متجرك ولن تظهر للزبائن بعد الآن.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'نعم، احذف السلعة 🗑️',
                    cancelButtonText: 'إلغاء'
                }).then((result) => {
                    if (result.isConfirmed) {
                        doDelete();
                    }
                });
            } else {
                if (confirm("هل أنت متأكد من حذف هذه السلعة من المتجر نهائياً؟")) {
                    doDelete();
                }
            }
        }

        // Open variants modal
        function openVariantsModal(productId) {
            document.getElementById('variant-product-id').value = productId;
            
            let products = getDB("products", []);
            let p = products.find(prod => prod.productId === productId);
            document.getElementById('variant-values-input').value = p ? (p.variants || '') : '';

            document.getElementById('variants-modal').classList.remove('hidden');
        }

        function closeVariantsModal() {
            document.getElementById('variants-modal').classList.add('hidden');
        }

        // Save product variants
        function saveProductVariants() {
            const prodId = document.getElementById('variant-product-id').value;
            const vals = document.getElementById('variant-values-input').value.trim();

            let products = getDB("products", []);
            let p = products.find(prod => prod.productId === prodId);
            if (p) {
                p.variants = vals;
                setDB("products", products);
                alert("تم تحديث متغيرات وخيارات السلعة بنجاح! ✅");
                closeVariantsModal();
                renderMerchantProducts();
            }
        }

        // Custom render merchant orders list
        async function renderMerchantOrders() {
            let container = document.getElementById("merchant-orders-list");
            if (!container) return;

            container.innerHTML = "";
            let orders = getDB("orders", []);
            let zaloOrders = getDB("zalo_orders", []);
            let allOrders = [...orders, ...zaloOrders];

            let currentStoreSettings = {};
            try {
                currentStoreSettings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || localStorage.getItem('merchant_store_settings') || '{}');
            } catch(e) {}

            const realStoreName = (currentStoreSettings.storeName || currentStoreSettings.name || localStorage.getItem('zalo_active_store') || sessionStorage.getItem('merchant_store_name') || '').trim().toLowerCase();
            const realStoreId = (currentStoreSettings.id || localStorage.getItem('zalo_uid') || localStorage.getItem('user_uid') || '').toString().toLowerCase();

            // Try fetching live orders from Supabase if connected
            if (window.supabaseClient) {
                try {
                    const { data: sbOrders, error: sbErr } = await window.supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
                    if (!sbErr && sbOrders && Array.isArray(sbOrders)) {
                        sbOrders.forEach(sbo => {
                            const oId = sbo.id || sbo.order_id || sbo.orderId;
                            const exists = allOrders.some(lo => (lo.id && lo.id === oId) || (lo.orderId && lo.orderId === oId));
                            if (!exists) {
                                allOrders.unshift({
                                    id: oId,
                                    orderId: oId,
                                    productName: sbo.product_name || sbo.productName || (sbo.items && sbo.items[0]?.name) || 'طلب متجر',
                                    total: parseFloat(sbo.total_amount || sbo.total || 0),
                                    address: sbo.shipping_address || sbo.address || (sbo.wilaya ? sbo.wilaya + (sbo.commune ? ' - ' + sbo.commune : '') : 'الجزائر'),
                                    customerName: sbo.customer_name || sbo.customerName || 'زبون زالو',
                                    customerPhone: sbo.customer_phone || sbo.customerPhone || sbo.phone || '',
                                    status: sbo.status || 'قيد المراجعة',
                                    paymentMethod: sbo.payment_method || 'الدفع عند الاستلام (COD)',
                                    storeId: sbo.store_id || sbo.storeId || '',
                                    storeName: sbo.store_name || sbo.storeName || ''
                                });
                            }
                        });
                    }
                } catch(e) {
                    console.warn("Orders live sync:", e);
                }
            }

            let merchantOrders = allOrders.filter(o => {
                const oStoreId = (o.storeId || o.store_id || "").toString().toLowerCase();
                const oStoreName = (o.storeName || o.store_name || "").trim().toLowerCase();
                if (!realStoreName && !realStoreId) return true;
                return (realStoreId && oStoreId === realStoreId) || 
                       (realStoreName && oStoreName === realStoreName) ||
                       (!o.storeId && !o.store_id);
            });

            // Unique orders by ID
            const uniqueOrders = [];
            const seenIds = new Set();
            merchantOrders.forEach(o => {
                const id = o.orderId || o.id;
                if (!seenIds.has(id)) {
                    seenIds.add(id);
                    uniqueOrders.push(o);
                }
            });

            if (uniqueOrders.length === 0) {
                container.innerHTML = `<p class="text-center text-slate-400 font-bold py-6">لا توجد طلبات جارية للمراجعة.</p>`;
                return;
            }

            uniqueOrders.forEach(o => {
                let badgeColor = "bg-amber-50 text-amber-600 border border-amber-200";
                if (o.status === "جاري الشحن" || o.status === "shipping") badgeColor = "bg-sky-50 text-sky-600 border border-sky-200";
                if (o.status === "تم التسليم" || o.status === "delivered") badgeColor = "bg-emerald-50 text-emerald-600 border border-emerald-200";

                let card = document.createElement("div");
                card.className = "bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-right space-y-3";
                card.innerHTML = `
                    <div class="flex justify-between items-center pb-2 border-b border-slate-100 flex-wrap gap-2">
                        <span class="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">معاملة: ${o.orderId || o.id}</span>
                        <span class="text-[10px] px-2.5 py-1 rounded-full font-black ${badgeColor}">${o.status || 'قيد المراجعة'}</span>
                    </div>
                    <p class="text-xs font-black text-slate-800"><i class="fa-solid fa-cart-arrow-down text-sky-500 ml-1"></i> السلعة المطلوبة: ${o.productName || 'منتج'}</p>
                    <p class="text-xs font-bold text-slate-600"><i class="fa-solid fa-sack-dollar text-[#d4af37] ml-1"></i> القيمة المستحقة: ${parseFloat(o.total || 0).toLocaleString()} دج</p>
                    <p class="text-xs font-bold text-slate-600"><i class="fa-solid fa-user text-slate-500 ml-1"></i> العميل: ${o.customerName || 'زبون'} ${o.customerPhone ? `(${o.customerPhone})` : ''}</p>
                    <p class="text-xs font-bold text-slate-600"><i class="fa-solid fa-map-location-dot text-red-500 ml-1"></i> عنوان التوصيل: ${o.address || 'العنوان غير محدد'}</p>
                    <p class="text-xs font-bold text-slate-600"><i class="fa-solid fa-credit-card text-emerald-500 ml-1"></i> طريقة الدفع: <span class="text-emerald-700">${o.paymentMethod || 'الدفع عند الاستلام (COD)'}</span></p>

                    <div class="flex gap-2 justify-end pt-3 border-t border-slate-100 flex-wrap">
                        <button onclick="printOrderInvoice('${o.orderId || o.id}')" class="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200 text-[10px] px-3 py-1.5 rounded-xl font-black transition flex items-center gap-1">
                            <i class="fa-solid fa-print"></i>
                            <span>طباعة الفاتورة</span>
                        </button>
                        <button onclick="updateMerchantOrderStatus('${o.orderId || o.id}', 'جاري الشحن')" class="bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white border border-sky-200 text-[10px] px-3 py-1.5 rounded-xl font-black transition">
                            شحن الطلب 🚚
                        </button>
                        <button onclick="updateMerchantOrderStatus('${o.orderId || o.id}', 'تم التسليم')" class="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 text-[10px] px-3 py-1.5 rounded-xl font-black transition">
                            تأكيد التسليم ✓
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // Update Order Status locally and remotely
        async function updateMerchantOrderStatus(orderId, val) {
            if (!val) return;
            let orders = getDB("orders", []);
            let ord = orders.find(o => (o.orderId && o.orderId === orderId) || (o.id && o.id === orderId));
            if (ord) {
                ord.status = val;
                setDB("orders", orders);
            }
            try {
                let zo = getDB("zalo_orders", []);
                let zOrd = zo.find(o => (o.orderId && o.orderId === orderId) || (o.id && o.id === orderId));
                if (zOrd) {
                    zOrd.status = val;
                    setDB("zalo_orders", zo);
                }
            } catch(e) {}

            if (window.supabaseClient) {
                try {
                    await window.supabaseClient.from('orders').update({ status: val }).eq('id', orderId);
                } catch(e) {
                    console.warn("Supabase order status update:", e);
                }
            }

            alert(`تم تحديث حالة طلب الزبون بنجاح إلى "${val}"! ✅`);
            renderMerchantOrders();
            updateCounters();
        }

        // Print order invoice modal launcher
        function printOrderInvoice(orderId) {
            let orders = getDB("orders", []);
            let zaloOrders = getDB("zalo_orders", []);
            let all = [...orders, ...zaloOrders];
            let ord = all.find(o => (o.orderId && o.orderId === orderId) || (o.id && o.id === orderId));
            let settings = getDB("merchant_store_settings", DEFAULT_MERCHANT_SETTINGS);

            if (ord) {
                document.getElementById('inv-store-name').innerText = settings.storeName;
                document.getElementById('inv-store-info').innerText = `المقر: ${settings.commune}، ${settings.wilaya} | هاتف الدعم: ${settings.phone}`;
                
                document.getElementById('inv-order-id').innerText = ord.orderId || ord.id;
                document.getElementById('inv-customer-address').innerText = ord.address || 'العنوان غير متوفر';
                document.getElementById('inv-payment-method').innerText = ord.paymentMethod || 'الدفع عند الاستلام (COD)';
                
                document.getElementById('inv-item-name').innerText = ord.productName || 'طلب منتج';
                document.getElementById('inv-item-price').innerText = parseFloat(ord.total || 0).toLocaleString() + " دج";
                document.getElementById('inv-total-price').innerText = parseFloat(ord.total || 0).toLocaleString() + " دج";

                document.getElementById('invoice-modal').classList.remove('hidden');
            }
        }

        function closeInvoiceModal() {
            document.getElementById('invoice-modal').classList.add('hidden');
        }

        // Preview Store Mockup Modal
        function previewMyStore() {
            let settings = getDB("merchant_store_settings", DEFAULT_MERCHANT_SETTINGS);
            
            document.getElementById('prev-modal-cover').src = settings.coverImg;
            document.getElementById('prev-modal-logo').src = settings.logoImg;
            document.getElementById('prev-modal-name').innerText = settings.storeName;
            document.getElementById('prev-modal-category').innerText = settings.category === 'cat_phones' ? 'هواتف وإلكترونيات' : 'نشاط تجاري عام';
            document.getElementById('prev-modal-phone').innerText = settings.phone;
            document.getElementById('prev-modal-address').innerText = `${settings.commune}، ${settings.wilaya}`;
            document.getElementById('prev-modal-hours').innerText = settings.workingHours || "08:00 - 22:00";
            document.getElementById('prev-modal-vat').innerText = settings.vatNumber || "198273615243000";

            // Render mock preview products
            const prodList = document.getElementById('prev-modal-products-list');
            prodList.innerHTML = '';
            
            let products = getDB("products", []);
            let currentStoreSettings = {};
            try {
                currentStoreSettings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || '{}');
            } catch(e) {}
            const realStoreName = (currentStoreSettings.storeName || currentStoreSettings.name || '').trim().toLowerCase();
            const realStoreId = (currentStoreSettings.id || '').toString().toLowerCase();

            let merchantProds = products.filter(p => {
                const pStoreId = (p.storeId || p.store_id || "").toString().toLowerCase();
                const pStoreName = (p.storeName || p.store_name || "").trim().toLowerCase();
                if (!realStoreName && !realStoreId) return true;
                return (realStoreId && pStoreId === realStoreId) || (realStoreName && pStoreName === realStoreName) || (!p.storeId && !p.store_id);
            });

            if (merchantProds.length === 0) {
                prodList.innerHTML = `<p class="col-span-2 text-center text-slate-400 py-3">لا توجد منتجات منشورة حالياً بالمتجر.</p>`;
            } else {
                merchantProds.forEach(p => {
                    let div = document.createElement('div');
                    div.className = "bg-white border border-slate-100 rounded-xl p-3 flex flex-col justify-between shadow-sm text-right";
                    div.innerHTML = `
                        <h6 class="font-black text-slate-800 text-[11px]">${p.productName || p.name}</h6>
                        <p class="text-[10px] text-slate-400 mt-1 line-clamp-1">${p.description || ''}</p>
                        <div class="flex justify-between items-center mt-3 border-t border-slate-50 pt-2 flex-wrap">
                            <span class="text-[10px] font-black text-[#d4af37]">${parseFloat(p.price || 0).toLocaleString()} دج</span>
                            <span class="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">متاح: ${p.stock || 0}</span>
                        </div>
                    `;
                    prodList.appendChild(div);
                });
            }

            document.getElementById('preview-store-modal').classList.remove('hidden');
        }

        function closeStorePreview() {
            document.getElementById('preview-store-modal').classList.add('hidden');
        }

        // Live dialog contact customer simulation
        function simulateMerchantChat(userId) {
            let msg = prompt("اكتب رسالة للزبون لمناقشة التوصيل ومطابقة الوثاق:");
            if (!msg) return;
            alert(`تم إرسال رسالتك: "${msg}" بنجاح للزبون! 💬`);
        }

        // Dynamic Counters update helper
        async function updateCounters() {
            let currentStoreSettings = {};
            try {
                currentStoreSettings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || localStorage.getItem('merchant_store_settings') || '{}');
            } catch(e) {}

            const realStoreName = (currentStoreSettings.storeName || currentStoreSettings.name || localStorage.getItem('zalo_active_store') || sessionStorage.getItem('merchant_store_name') || '').trim().toLowerCase();
            const realStoreId = (currentStoreSettings.id || localStorage.getItem('zalo_uid') || localStorage.getItem('user_uid') || '').toString().toLowerCase();

            // 1. Get products count
            let products = getDB("products", []);
            let zaloProducts = getDB("zalo_products", []);
            let allProds = [...products, ...zaloProducts];

            let merchantProds = allProds.filter(p => {
                const pStoreId = (p.storeId || p.store_id || "").toString().toLowerCase();
                const pStoreName = (p.storeName || p.store_name || "").trim().toLowerCase();
                if (!realStoreName && !realStoreId) return true;
                return (realStoreId && pStoreId === realStoreId) || (realStoreName && pStoreName === realStoreName) || (!p.storeId && !p.store_id);
            });

            const uniqueProds = [];
            const seenPIds = new Set();
            merchantProds.forEach(p => {
                const id = p.productId || p.id || p.productName || p.name;
                if (!seenPIds.has(id)) {
                    seenPIds.add(id);
                    uniqueProds.push(p);
                }
            });

            const prodCountEl = document.getElementById('stat-merchant-products');
            if (prodCountEl) {
                prodCountEl.innerText = uniqueProds.length;
            }

            // 2. Get orders count
            let orders = getDB("orders", []);
            let zaloOrders = getDB("zalo_orders", []);
            let allOrders = [...orders, ...zaloOrders];

            let merchantOrders = allOrders.filter(o => {
                const oStoreId = (o.storeId || o.store_id || "").toString().toLowerCase();
                const oStoreName = (o.storeName || o.store_name || "").trim().toLowerCase();
                if (!realStoreName && !realStoreId) return true;
                return (realStoreId && oStoreId === realStoreId) || (realStoreName && oStoreName === realStoreName) || (!o.storeId && !o.store_id);
            });

            const uniqueOrders = [];
            const seenOIds = new Set();
            merchantOrders.forEach(o => {
                const id = o.orderId || o.id;
                if (!seenOIds.has(id)) {
                    seenOIds.add(id);
                    uniqueOrders.push(o);
                }
            });

            let pendingCount = uniqueOrders.filter(o => {
                const st = (o.status || '').toLowerCase();
                return st === 'قيد المراجعة' || st === 'pending' || st === 'new';
            }).length;

            const pendingEl = document.getElementById('stat-pending-orders');
            if (pendingEl) {
                pendingEl.innerText = pendingCount;
            }

            // Sync pendingCount with sidebar tab badge
            const sidebarBadge = document.getElementById('badge-store-orders-count');
            if (sidebarBadge) {
                sidebarBadge.innerText = pendingCount;
            }

            // Compute total revenue
            let revenue = uniqueOrders
                .filter(o => {
                    const st = (o.status || '').toLowerCase();
                    return st === 'تم التسليم' || st === 'delivered' || st === 'completed';
                })
                .reduce((acc, o) => acc + parseFloat(o.total || o.total_amount || 0), 0);
            
            const revenueEl = document.getElementById('stat-revenue');
            if (revenueEl) {
                revenueEl.innerText = revenue > 0 ? revenue.toLocaleString() : "0";
            }
        }
        window.updateCounters = updateCounters;

        // 📲 Merchant Custom QR Code Logic
        function initMerchantQR() {
            const settings = getDB("merchant_store_settings", DEFAULT_MERCHANT_SETTINGS);
            const qrUrlInput = document.getElementById('merchant-qr-url');
            
            if (qrUrlInput) {
                const cleanName = (settings.storeName || "shop").toLowerCase().replace(/[^a-z0-9]/g, '');
                const url = `https://zalo.dz/store/${cleanName || 'my-shop'}`;
                qrUrlInput.value = url;
            }
            regenerateMerchantQR();
        }

        function regenerateMerchantQR() {
            const qrUrlInput = document.getElementById('merchant-qr-url');
            const qrColorSelect = document.getElementById('merchant-qr-color');
            const qrSvg = document.getElementById('merchant-qr-svg');
            const displayUrl = document.getElementById('merchant-qr-display-url');

            if (!qrUrlInput || !qrColorSelect || !qrSvg) return;

            const url = qrUrlInput.value || "https://zalo.dz";
            const color = qrColorSelect.value;

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

        function printMerchantQR() {
            const settings = getDB("merchant_store_settings", DEFAULT_MERCHANT_SETTINGS);
            const printArea = document.getElementById('merchant-qr-print-area');
            if (!printArea) return;

            const printWindow = window.open('', '', 'height=500,width=500');
            printWindow.document.write('<html><head><title>Print QR Poster - ' + settings.storeName + '</title>');
            printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">');
            printWindow.document.write('<style>body{font-family:"Cairo",sans-serif; text-align:center; padding:30px;} .print-card{border:6px double #d4af37; padding:25px; display:inline-block; border-radius:20px; background:white; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h1 style="color:#113f1c; margin-bottom:5px;">تسوق الآن في متجرنا</h1>');
            printWindow.document.write('<h2 style="color:#d4af37; font-size:18px; margin-top:0; margin-bottom:25px;">' + settings.storeName + '</h2>');
            printWindow.document.write('<div class="print-card">' + printArea.innerHTML + '</div>');
            printWindow.document.write('<p style="font-size:13px; color:#555; margin-top:25px; font-weight:bold;">امسح رمز الاستجابة السريعة (QR) بهاتفك لمشاهدة السلع والطلب مباشرة!</p>');
            printWindow.document.write('<p style="font-size:11px; color:#999; margin-top:50px;">طلبك يصلك مباشرة لباب منزلك - منصة ZaLo الجزائرية الموحدة</p>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }

        function downloadMerchantQR() {
            alert("تم حفظ ملصق رمز الاستجابة لمتجرك بنجاح بجودة عالية! 📲");
        }

        // 📈 Merchant Personal Financial Reports Logic
        function renderMerchantFinancialReports() {
            const settings = getDB("merchant_store_settings", DEFAULT_MERCHANT_SETTINGS);
            const storeName = settings.storeName;

            let orders = getDB("orders", []);
            let storeId = localStorage.getItem('zalo_store_id') || "store_salam";

            // Filter for this merchant's orders
            let merchantOrders = orders.filter(o => o.storeId === storeId || o.storeName === storeName);
            let completed = merchantOrders.filter(o => o.status === "تم التسليم" || o.status === "DELIVERED");

            let totalSales = completed.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            let commissionRate = 5; // Default platform rate
            let totalCommission = totalSales * (commissionRate / 100);
            let netProfit = totalSales - totalCommission;

            // Update stats layout
            document.getElementById('m-total-sales').innerText = totalSales.toLocaleString() + " دج";
            document.getElementById('m-total-commissions').innerText = totalCommission.toLocaleString() + " دج";
            document.getElementById('m-total-net').innerText = netProfit.toLocaleString() + " دج";

            // Update subscription paid status from global store record
            let storesList = getDB("stores_list_old", []);
            let currentStoreRecord = storesList.find(s => s.id === storeId || s.name === storeName);
            let hasPaidSub = currentStoreRecord ? currentStoreRecord.subscriptionPaid !== false : true;
            document.getElementById('m-sub-status').innerHTML = hasPaidSub ? "نشط (مدفوع) 🟢" : "مستحق الدفع 🔴";

            const tbody = document.getElementById('m-reports-tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (merchantOrders.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="p-6 text-center text-slate-400 font-bold">
                            لا يوجد طلبيات مسجلة لمتجرك حتى الآن في كشف الحساب المالي.
                        </td>
                    </tr>
                `;
                return;
            }

            merchantOrders.forEach(o => {
                let comm = (parseFloat(o.total) || 0) * (commissionRate / 100);
                let badgeColor = "bg-slate-100 text-slate-600";
                if (o.status === "تم التسليم" || o.status === "DELIVERED") {
                    badgeColor = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                } else if (o.status === "قيد المراجعة" || o.status === "PENDING") {
                    badgeColor = "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse";
                } else if (o.status === "قيد الشحن" || o.status === "SHIPPED") {
                    badgeColor = "bg-sky-50 text-sky-600 border border-sky-100";
                } else if (o.status === "ملغى" || o.status === "CANCELED") {
                    badgeColor = "bg-red-50 text-red-600 border border-red-100";
                }

                let row = document.createElement('tr');
                row.className = "border-t border-slate-100 hover:bg-slate-50 transition";
                row.innerHTML = `
                    <td class="p-3 text-slate-900 font-mono text-[11px]">${o.orderId || o.id}</td>
                    <td class="p-3">
                        <div class="flex flex-col">
                            <span class="font-black text-slate-800 text-[11px]">${o.customerName}</span>
                            <span class="text-[9px] text-slate-400 font-normal font-mono">${o.customerPhone || 'غير مدرج'} - ${o.address || o.customerAddress || 'الجزائر'}</span>
                        </div>
                    </td>
                    <td class="p-3 text-center text-slate-500 text-[10px] font-mono">${o.date || '2026-07-16'}</td>
                    <td class="p-3 text-center text-slate-800 font-bold">${parseFloat(o.total).toLocaleString()} دج</td>
                    <td class="p-3 text-center text-red-500 font-bold">${comm.toLocaleString()} دج</td>
                    <td class="p-3 text-center">
                        <span class="text-[9px] px-2 py-0.5 rounded-full font-black ${badgeColor}">
                            ${o.status}
                        </span>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function printPersonalFinancialReport() {
            const settings = getDB("merchant_store_settings", DEFAULT_MERCHANT_SETTINGS);
            const storeName = settings.storeName;

            let orders = getDB("orders", []);
            let storeId = localStorage.getItem('zalo_store_id') || "store_salam";

            let merchantOrders = orders.filter(o => o.storeId === storeId || o.storeName === storeName);
            let completed = merchantOrders.filter(o => o.status === "تم التسليم" || o.status === "DELIVERED");

            let totalSales = completed.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
            let commissionRate = 5;
            let totalCommission = totalSales * (commissionRate / 100);
            let netProfit = totalSales - totalCommission;

            let tableRows = '';
            merchantOrders.forEach(o => {
                let comm = (parseFloat(o.total) || 0) * (commissionRate / 100);
                tableRows += `
                    <tr>
                        <td>${o.orderId || o.id}</td>
                        <td>${o.customerName}</td>
                        <td>${o.date || '2026-07-16'}</td>
                        <td>${parseFloat(o.total).toLocaleString()} دج</td>
                        <td>${comm.toLocaleString()} دج</td>
                        <td>${o.status}</td>
                    </tr>
                `;
            });

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>كشف الحساب المالي - ' + storeName + '</title>');
            printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">');
            printWindow.document.write('<style>body{font-family:"Cairo",sans-serif; text-align:right; direction:rtl; padding:30px;} table{width:100%; border-collapse:collapse; margin-top:20px;} th,td{border:1px solid #ddd; padding:10px; text-align:center;} h1,h3{text-align:center; color:#113f1c;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h1>كشف الحساب والتقرير المالي التفصيلي</h1>');
            printWindow.document.write('<h3>متجر: ' + storeName + '</h3>');
            printWindow.document.write('<p><strong>تاريخ التدقيق المالي المطبوع:</strong> ' + new Date().toLocaleString() + '</p>');
            
            printWindow.document.write('<div style="display:flex; justify-content:space-around; margin:30px 0; background:#f8fafc; padding:15px; border-radius:12px; font-weight:black; border:2px solid #e2e8f0;">');
            printWindow.document.write('<div>إجمالي مبيعات المتجر: ' + totalSales.toLocaleString() + ' دج</div>');
            printWindow.document.write('<div style="color:red;">عمولات المنصة المستقطعة (5%): ' + totalCommission.toLocaleString() + ' دج</div>');
            printWindow.document.write('<div style="color:green;">صافي أرباح المتجر: ' + netProfit.toLocaleString() + ' دج</div>');
            printWindow.document.write('</div>');

            printWindow.document.write('<table>');
            printWindow.document.write('<thead><tr style="background:#113f1c; color:white;"><th>رقم الطلب</th><th>الزبون</th><th>التاريخ والوقت</th><th>القيمة الكلية</th><th>العمولة</th><th>حالة الطلب</th></tr></thead>');
            printWindow.document.write('<tbody>' + (tableRows || '<tr><td colspan="6">لا يوجد طلبيات حتى الآن</td></tr>') + '</tbody>');
            printWindow.document.write('</table>');
            
            printWindow.document.write('<p style="margin-top:40px; font-size:11px; text-align:center; color:#888;">منصة ZaLo ديزاد - نظام مراجعة المبيعات الموحد للشركاء</p>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }

        // Logout
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
            window.location.replace('store-login.html');
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
        window.openAddBranchModal = function() {
            const parentStore = localStorage.getItem('zalo_active_store') || sessionStorage.getItem('merchant_store_name') || 'المتجر الرئيسي';
            const input = document.getElementById('branchParentStore');
            if (input) input.value = parentStore;
            const modal = document.getElementById('addBranchModal');
            if (modal) modal.classList.remove('hidden');
        };

        window.closeAddBranchModal = function() {
            const modal = document.getElementById('addBranchModal');
            if (modal) modal.classList.add('hidden');
        };

        window.handleSaveBranch = async function(e) {
            e.preventDefault();
            const parentStore = document.getElementById('branchParentStore').value;
            const branchName = document.getElementById('branchName').value.trim();
            const category = document.getElementById('branchCategory').value;
            const wilaya = document.getElementById('branchWilaya').value.trim();
            const commune = document.getElementById('branchCommune').value.trim();
            const phone = document.getElementById('branchPhone').value.trim();
            const manager = document.getElementById('branchManager').value.trim();

            const branchData = {
                id: 'branch_' + Date.now(),
                parent_store: parentStore,
                store_name: branchName,
                category: category,
                wilaya: wilaya,
                commune: commune,
                phone: phone,
                manager: manager,
                status: 'APPROVED',
                created_at: new Date().toISOString()
            };

            try {
                if (typeof supabase !== 'undefined' && supabase.from) {
                    await supabase.from('merchant_requests').insert({
                        store_name: branchName + " (" + parentStore + ")",
                        category: category,
                        wilaya: wilaya,
                        commune: commune,
                        status: 'APPROVED',
                        merchant_type: 'branch'
                    });
                }
            } catch(err) {
                console.warn("Branch save error:", err);
            }

            let branches = JSON.parse(localStorage.getItem('zalo_store_branches') || '[]');
            branches.push(branchData);
            localStorage.setItem('zalo_store_branches', JSON.stringify(branches));

            alert("✅ تم إضافة الفرع / السلسلة (" + branchName + ") بنجاح للتاجر الرئيسي!");
            closeAddBranchModal();
        };

        // Safety fallback initialization on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (typeof window.initOldMerchantDashboard === 'function') {
                    window.initOldMerchantDashboard();
                }
            });
        } else {
            setTimeout(() => {
                if (typeof window.initOldMerchantDashboard === 'function') {
                    window.initOldMerchantDashboard();
                }
            }, 100);
        }
