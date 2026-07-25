/**
 * ZaLo Marketplace - Unified Category Taxonomy (التخصصات العامة والفروع)
 */

window.ZALO_CATEGORIES = [
  {
    id: "cat_auto",
    name: "قطع غيار وإكسسوارات المركبات",
    emoji: "🚗",
    icon: "fa-car",
    subcategories: [
      "قطع غيار تويوتا (Toyota)",
      "قطع غيار هيونداي / كيا (Hyundai/Kia)",
      "قطع غيار رونو / داسيا (Renault/Dacia)",
      "قطع غيار بيجو / سيتروين (Peugeot/Citroën)",
      "قطع غيار فولكسفاغن / أودي / سيات / سكودا (VAG)",
      "قطع غيار شيري / جيلي / سيارات صينية",
      "زيوت، سوائل وصيانة سريعة",
      "عجلات وأطواق (إطارات)",
      "كهروميكانيك وبطاريات",
      "إكسسوارات وتجهيزات السيارات",
      "قطع غيار الشاحنات والحافلات",
      "قطع غيار الدراجات النارية والرباعية"
    ]
  },
  {
    id: "cat_fashion",
    name: "ملابس، أزياء وموضة",
    emoji: "👗",
    icon: "fa-shirt",
    subcategories: [
      "ملابس نسائية",
      "ملابس رجالية",
      "ملابس أطفال ورضع",
      "ملابس رياضية",
      "أحذية نسائية ورجالية",
      "حقائب وإكسسوارات",
      "ملابس تقليدية وأثواب",
      "ساعات ونظارات"
    ]
  },
  {
    id: "cat_tech",
    name: "هواتف وإلكترونيات",
    emoji: "📱",
    icon: "fa-mobile-screen-button",
    subcategories: [
      "هواتف ذكية واكسسواراتها",
      "أجهزة كهرومنزلية (ثلاجات، غسالات...)",
      "حواسب آلي، لابتوب وملحقاتها",
      "أجهزة التلفاز والصوتيات",
      "كاميرات ومعدات تصوير",
      "ألعاب فيديو ومنصات Gaming",
      "أجهزة حماية ومراقبة وأنظمة أمان"
    ]
  },
  {
    id: "cat_food",
    name: "مواد غذائية وتموين",
    emoji: "🍎",
    icon: "fa-basket-shopping",
    subcategories: [
      "مواد غذائية أساسية وعامة",
      "خضروات وفواكه طازجة",
      "لحوم، دواجن وأسماك",
      "حليب ومأكولات ألبان",
      "حلويات، مكسرات ومشروبات",
      "منتجات المخابز والمخبوزات",
      "منتجات فلاحية ومحلية"
    ]
  },
  {
    id: "cat_home",
    name: "مستلزمات المنزل والأثاث",
    emoji: "🏠",
    icon: "fa-house",
    subcategories: [
      "أثاث صالون وغرف نوم",
      "أواني وديكورات المطبخ",
      "مفارش، سجاد وأغطية",
      "إضاءة وثريات",
      "أثاث وتجهيزات الحدائق",
      "أجهزة تنظيف ومستلزمات منزلية"
    ]
  },
  {
    id: "cat_beauty",
    name: "صحة، تجميل وعناية شخصية",
    emoji: "✨",
    icon: "fa-wand-magic-sparkles",
    subcategories: [
      "عطور وفواحات",
      "مكياج ومستحضرات تجميل",
      "العناية بالبشرة والشعر",
      "مكملات غذائية وأعشاب طبيعية",
      "أجهزة قياس وعناية صحية"
    ]
  },
  {
    id: "cat_hardware",
    name: "خردوات، بناء وتجهيزات",
    emoji: "🛠️",
    icon: "fa-wrench",
    subcategories: [
      "أدوات ومعدات يدوية وكهربائية",
      "دهانات ومواد طلاء",
      "سباكة ولوازم المياه",
      "لوازم كهربائية وإنارة",
      "مواد بناء وإنشاءات"
    ]
  },
  {
    id: "cat_books",
    name: "مكتبة، أدوات مدرسية وألعاب",
    emoji: "📚",
    icon: "fa-book",
    subcategories: [
      "أدوات مكتبية ومدرسية",
      "كتب، روايات ومصاحف",
      "ألعاب أطفال وألغاز",
      "أدوات رسم وفنون"
    ]
  },
  {
    id: "cat_handicraft",
    name: "صناعة تقليدية وحرف يدوية",
    emoji: "🎨",
    icon: "fa-palette",
    subcategories: [
      "أواني نحاسية وفخارية",
      "زربيات ومنسوجات تقليدية",
      "مجوهرات وحلي تقليدية",
      "خياطة وتطريز أرتيزان"
    ]
  }
];

/**
 * Returns all main categories
 */
window.getMainCategories = function() {
  return window.ZALO_CATEGORIES.map(c => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    icon: c.icon
  }));
};

/**
 * Returns subcategories for a given main category name or ID
 */
window.getSubcategories = function(mainCategoryNameOrId) {
  if (!mainCategoryNameOrId) return [];
  const found = window.ZALO_CATEGORIES.find(
    c => c.id === mainCategoryNameOrId || 
         c.name === mainCategoryNameOrId || 
         mainCategoryNameOrId.includes(c.name) ||
         c.name.includes(mainCategoryNameOrId)
  );
  return found ? found.subcategories : [];
};

/**
 * Populates two dynamic HTML select elements (Main Category & Subcategory)
 */
window.setupDynamicCategorySelects = function(mainSelectId, subSelectId, initialMain = '', initialSub = '') {
  const mainEl = typeof mainSelectId === 'string' ? document.getElementById(mainSelectId) : mainSelectId;
  const subEl = typeof subSelectId === 'string' ? document.getElementById(subSelectId) : subSelectId;

  if (!mainEl) return;

  // Populate Main Category options
  mainEl.innerHTML = '<option value="">-- اختر التخصص العام --</option>';
  window.ZALO_CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = `${cat.emoji} ${cat.name}`;
    if (initialMain && (initialMain === cat.name || initialMain === cat.id)) {
      opt.selected = true;
    }
    mainEl.appendChild(opt);
  });

  const updateSubcategories = () => {
    if (!subEl) return;
    const selectedMain = mainEl.value;
    subEl.innerHTML = '<option value="">-- اختر الفرع / التخصص الفرعي --</option>';
    
    if (!selectedMain) {
      subEl.disabled = true;
      return;
    }

    const subs = window.getSubcategories(selectedMain);
    if (subs.length > 0) {
      subEl.disabled = false;
      subs.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if (initialSub && initialSub === s) {
          opt.selected = true;
        }
        subEl.appendChild(opt);
      });
    } else {
      subEl.disabled = true;
    }
  };

  mainEl.addEventListener('change', updateSubcategories);
  // Initial run
  updateSubcategories();
};
