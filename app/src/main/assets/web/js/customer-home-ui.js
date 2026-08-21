
// Early Global Standalone Handlers for Live Offers & Stories
window.liveFeedStoriesCache = [];

window.getMergedStoriesList = function() {
  let stories = [];
  try {
    stories = JSON.parse(localStorage.getItem('zalo_live_stories') || '[]');
  } catch(e) {}
  if (!stories.length && window.liveStoriesList && window.liveStoriesList.length) {
    stories = window.liveStoriesList;
  }
  
  const fakeStoryKeywords = [];
  stories = (stories || []).filter(st => {
    if (!st || !st.id) return false;
    let cap = (st.caption || st.title || st.author || st.id || '').toLowerCase();
    return !fakeStoryKeywords.some(kw => cap.includes(kw));
  });

  if (!stories.length) {
    // Try products from window.allSources or localStorage
    let prods = window.allSources || [];
    if (!prods.length) {
      try { prods = JSON.parse(localStorage.getItem('zalo_products') || '[]'); } catch(e) {}
    }
    if (prods.length) {
      stories = prods.slice(0, 10).map((p, idx) => ({
        id: p.id || ('st_' + idx),
        author: p.storeName || p.store_name || 'Zalo all service',
        storeId: p.storeId || p.store_id || 'store_zalo_all',
        wilaya: p.wilaya || '58 - المنيعة',
        category: p.category || 'عرض حصري',
        subcategory: p.subcategory || '',
        price: p.price || 0,
        caption: (p.name || p.productName || 'عرض خاص') + (p.description ? ' - ' + p.description : ''),
        title: p.name || p.productName || 'عرض خاص',
        image: p.image || p.image_url || 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80',
        logo: 'assets/icon-192.svg',
        phone: p.phone || '0698694010',
        time: 'الآن',
        likes: 12 + idx
      }));
    }
  }
  return stories;
};

window.openLiveOffersFeedModal = function() {
  window.switchHomeFeedView('stories');
  const feedEl = document.getElementById('home-live-stories-section');
  if (feedEl) feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.switchHomeFeedView = function(view) {
  const btnDirectory = document.getElementById('home-view-toggle-directory');
  const btnStories = document.getElementById('home-view-toggle-stories');
  const secDirectory = document.getElementById('home-directory-section');
  const secStories = document.getElementById('home-live-stories-section');

  if (view === 'stories') {
    if (btnDirectory) {
      btnDirectory.style.background = 'transparent';
      btnDirectory.style.color = '#64748b';
      btnDirectory.style.boxShadow = 'none';
      btnDirectory.style.fontWeight = '800';
    }
    if (btnStories) {
      btnStories.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
      btnStories.style.color = '#ffffff';
      btnStories.style.boxShadow = '0 2px 10px rgba(2,132,199,0.3)';
      btnStories.style.fontWeight = '900';
    }
    if (secDirectory) secDirectory.style.display = 'none';
    if (secStories) secStories.style.display = 'block';
    
    window.renderInlineLiveStoriesFeed();
  } else {
    // Directory view
    if (btnDirectory) {
      btnDirectory.style.background = '#ffffff';
      btnDirectory.style.color = '#0284c7';
      btnDirectory.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      btnDirectory.style.fontWeight = '900';
    }
    if (btnStories) {
      btnStories.style.background = 'transparent';
      btnStories.style.color = '#64748b';
      btnStories.style.boxShadow = 'none';
      btnStories.style.fontWeight = '800';
    }
    if (secDirectory) secDirectory.style.display = 'block';
    if (secStories) secStories.style.display = 'none';

    // Render the directory
    if (window.renderStoresDirectory) {
      window.renderStoresDirectory();
    }
  }
};

window.renderStoresDirectory = async function() {
  const container = document.getElementById('directory-wilayas-container');
  if (!container) return;
  
  const storesMap = new Map();

  // 1. First prioritize fetching live from Supabase stores table if client available
  try {
    const sb = window.supabase || window.supabaseClient;
    if (sb && sb.from) {
      const { data: dbStores, error } = await sb.from('stores').select('*').order('wilaya', { ascending: true });
      if (!error && dbStores && Array.isArray(dbStores)) {
        dbStores.forEach(s => {
          const sName = (s.name || s.store_name || '').trim();
          if (sName) {
            const sId = String(s.id || ('store_' + encodeURIComponent(sName)));
            storesMap.set(sId, {
              id: sId,
              name: sName,
              wilaya: s.wilaya || '58 - المنيعة',
              phone: s.phone || '0698694010',
              logo: s.logo_url || s.logo || 'assets/icon-192.svg',
              productCount: 0
            });
          }
        });
      }
    }
  } catch(e) {
    console.warn("Direct Supabase fetch for directory:", e);
  }

  // 2. Collect from window.officialStores
  if (window.officialStores && Array.isArray(window.officialStores)) {
    window.officialStores.forEach(s => {
      const sName = (s.name || s.store_name || '').trim();
      if (sName) {
        const sId = String(s.id || ('store_' + encodeURIComponent(sName)));
        if (!storesMap.has(sId)) {
          storesMap.set(sId, {
            id: sId,
            name: sName,
            wilaya: s.wilaya || '58 - المنيعة',
            phone: s.phone || '0698694010',
            logo: s.logo || s.logo_url || 'assets/icon-192.svg',
            productCount: 0
          });
        }
      }
    });
  }

  // 3. Collect from localStorage official stores
  try {
    const locStores = JSON.parse(localStorage.getItem('zalo_official_stores') || '[]');
    locStores.forEach(s => {
      const sName = (s.name || s.store_name || '').trim();
      if (sName) {
        const sId = String(s.id || ('store_' + encodeURIComponent(sName)));
        if (!storesMap.has(sId)) {
          storesMap.set(sId, {
            id: sId,
            name: sName,
            wilaya: s.wilaya || '58 - المنيعة',
            phone: s.phone || '0698694010',
            logo: s.logo || s.logo_url || 'assets/icon-192.svg',
            productCount: 0
          });
        }
      }
    });
  } catch(e) {}

  // 4. Collect from localStorage merchant store settings
  try {
    const mSettings = JSON.parse(localStorage.getItem('zalo_merchant_store_settings') || '{}');
    if (mSettings.storeName || mSettings.name) {
      const msName = (mSettings.storeName || mSettings.name).trim();
      const msId = String(mSettings.id || 'merchant_self');
      if (!storesMap.has(msId)) {
        storesMap.set(msId, {
          id: msId,
          name: msName,
          wilaya: mSettings.wilaya || '58 - المنيعة',
          phone: mSettings.phone || '0698694010',
          logo: mSettings.logoImg || 'assets/icon-192.svg',
          productCount: 0
        });
      }
    }
  } catch(e) {}

  // 5. Collect from all products (state.loadedProducts, window.allSources & localStorage)
  let allProds = window.allSources || [];
  if (typeof state !== 'undefined' && state?.loadedProducts && state.loadedProducts.length) {
    allProds = state.loadedProducts;
  }
  if (!allProds.length) {
    try { allProds = JSON.parse(localStorage.getItem('zalo_products') || '[]'); } catch(e) {}
  }
  
  allProds.forEach(p => {
    if (p.deleted === true || p.status === 'deleted') return;
    const sName = (p.storeName || p.store_name || '').trim();
    if (sName) {
      const sId = String(p.storeId || p.store_id || ('store_' + encodeURIComponent(sName)));
      const pLogo = p.logo || p.storeLogo || p.image || 'assets/icon-192.svg';
      if (!storesMap.has(sId)) {
        storesMap.set(sId, {
          id: sId,
          name: sName,
          wilaya: p.wilaya || '58 - المنيعة',
          phone: p.phone || '0698694010',
          logo: pLogo,
          productCount: 0
        });
      } else if (pLogo && !pLogo.includes('icon-192.svg') && storesMap.get(sId).logo.includes('icon-192.svg')) {
        storesMap.get(sId).logo = pLogo;
      }
      storesMap.get(sId).productCount++;
    }
  });

  // 6. Collect from live stories feed
  const feedStories = window.liveStoriesList || [];
  feedStories.forEach(st => {
    const sName = (st.author || st.store_name || '').trim();
    if (sName) {
      const sId = String(st.storeId || ('store_' + encodeURIComponent(sName)));
      const sLogo = st.logo || st.image || 'assets/icon-192.svg';
      if (!storesMap.has(sId)) {
        storesMap.set(sId, {
          id: sId,
          name: sName,
          wilaya: st.wilaya || '58 - المنيعة',
          phone: st.phone || '0698694010',
          logo: sLogo,
          productCount: 1
        });
      } else if (sLogo && !sLogo.includes('icon-192.svg')) {
        storesMap.get(sId).logo = sLogo;
      }
    }
  });

  // Ensure default official store if empty
  if (storesMap.size === 0) {
    storesMap.set('store_zalo_all', {
      id: 'store_zalo_all',
      name: 'Zalo all service',
      wilaya: '58 - المنيعة',
      phone: '0698694010',
      logo: 'assets/icon-192.svg',
      productCount: (allProds.length || 3)
    });
  }

  // Exclude nothing, include all stores dynamically
  const stores = Array.from(storesMap.values());
  
  // Sort stores by Wilaya number (1 to 69) safely
  stores.sort((a, b) => {
    const strA = String(a.wilaya || '58 - المنيعة');
    const strB = String(b.wilaya || '58 - المنيعة');
    const matchA = strA.match(/\d+/);
    const matchB = strB.match(/\d+/);
    const numA = parseInt(matchA ? matchA[0] : '999', 10);
    const numB = parseInt(matchB ? matchB[0] : '999', 10);
    return numA - numB;
  });

  if (stores.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; font-weight: 700;">لا توجد متاجر متاحة حالياً.</div>';
    return;
  }

  let html = '';
  stores.forEach(store => {
    const initial = (store.name || 'M').charAt(0).toUpperCase();
    const strWilaya = String(store.wilaya || '58 - المنيعة');
    const matchW = strWilaya.match(/\d+/);
    const wilayaNum = matchW ? matchW[0] : '';
    const wilayaName = strWilaya.replace(/^\d+\s*-\s*/, '');
    const safeStoreId = String(store.id || '').replace(/'/g, "\\'");
    const safeStoreName = String(store.name || '').replace(/'/g, "\\'");
    
    html += `
      <div onclick="if(typeof window.openStoreView==='function'){ window.openStoreView('${safeStoreId}', '${safeStoreName}'); } else { window.showToast('جاري فتح صفحة المتجر...'); }" style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.03); margin-bottom: 8px;" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#38bdf8';" onmouseout="this.style.background='#ffffff'; this.style.borderColor='#e2e8f0';">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);">
            ${initial}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <h4 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0;">${store.name}</h4>
              <i class="fa-solid fa-circle-check" style="color: #0284c7; font-size: 12px;" title="متجر معتمد"></i>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="font-size: 11px; color: #64748b; font-weight: 700; background: #f1f5f9; padding: 2px 8px; border-radius: 10px; display: flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-location-dot" style="color: #ef4444;"></i> ولاية ${wilayaName} ${wilayaNum ? '('+wilayaNum+')' : ''}
              </span>
              <span style="font-size: 10.5px; color: #059669; font-weight: 800; background: #ecfdf5; padding: 2px 8px; border-radius: 10px;">${store.productCount > 0 ? store.productCount + ' منتجات' : 'متجر نشط'}</span>
            </div>
          </div>
        </div>
        <div style="width: 32px; height: 32px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #0284c7;">
          <i class="fa-solid fa-chevron-left" style="font-size: 12px;"></i>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
};

window.renderInlineLiveStoriesFeed = function() {
  const container = document.getElementById('inline-live-stories-container');
  if (!container) return;

  const stories = window.getMergedStoriesList();
  window.liveFeedStoriesCache = stories;

  if (stories.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; background:#fff; border-radius:20px; border:1px solid #e2e8f0; font-size:13px; color:#64748b; font-weight:700;">
        <i class="fa-solid fa-store-slash" style="font-size:36px; color:#38bdf8; margin-bottom:12px; display:block;"></i>
        لا توجد عروض لحظية منشورة حالياً. كن أول تاجر ينشر عرضاً لحظياً وسيشاهده كافة الزبائن مباشرة! 🚀
      </div>
    `;
    return;
  }

  let userLikes = [];
  try {
    userLikes = JSON.parse(localStorage.getItem('zalo_user_likes_list') || '[]');
  } catch(e) {}

  container.innerHTML = stories.map((st, idx) => {
    const cleanPhone = (st.phone || '0550000000').replace(/[^0-9]/g, '');
    const finalWa = cleanPhone.startsWith('0') ? '213' + cleanPhone.substring(1) : (cleanPhone.startsWith('213') ? cleanPhone : '213' + cleanPhone);
    const isLiked = userLikes.includes(st.id);
    const priceTxt = (st.price && parseFloat(st.price) > 0) ? (parseFloat(st.price).toLocaleString() + ' دج') : 'سعر تنافسي';

    return `
      <div style="background:#ffffff; border-radius:22px; border:1.5px solid #e2e8f0; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.06); display:flex; flex-direction:column; text-align:right;">
        <!-- Store Header -->
        <div style="padding:14px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; background:#f8fafc;">
          <div style="display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="if(typeof window.openStoreView==='function') window.openStoreView('${st.storeId || 'store_' + encodeURIComponent(st.author || '')}', '${(st.author || 'متجر معتمد').replace(/'/g, "\\'")}');">
            <div style="position:relative; width:44px; height:44px; flex-shrink:0;">
              <img src="${st.logo || st.image || 'assets/icon-192.svg'}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; border:2px solid #0284c7;" onerror="this.src='assets/icon-192.svg'">
              <span class="live-badge-dot" style="bottom:0; right:0; width:12px; height:12px;"></span>
            </div>
            <div>
              <div style="font-size:13.5px; font-weight:900; color:#0f172a; display:flex; align-items:center; gap:6px;">
                <span>${st.author || 'متجر معتمد'}</span>
                <i class="fa-solid fa-circle-check" style="color:#0284c7; font-size:12px;"></i>
              </div>
              <div style="font-size:11px; color:#64748b; font-weight:700; display:flex; align-items:center; gap:6px; margin-top:2px;">
                <span><i class="fa-solid fa-location-dot" style="color:#0284c7;"></i> ${st.wilaya || 'الجزائر'}</span>
                <span>•</span>
                <span>${st.time || 'الآن'}</span>
              </div>
            </div>
          </div>
          <span style="font-size:11px; font-weight:800; color:#0369a1; background:#e0f2fe; padding:4px 10px; border-radius:10px;">
            ${st.category || 'عرض لحظي'}
          </span>
        </div>

        <!-- Media Image -->
        <div style="position:relative; width:100%; height:280px; background:#0f172a; cursor:pointer;" onclick="if(typeof window.openStoryViewer==='function') window.openStoryViewer('${st.id}')">
          <img src="${st.image || 'images/wilaya-thumb.jpg'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='images/wilaya-thumb.jpg'">
          <div style="position:absolute; bottom:12px; right:12px; background:rgba(0,0,0,0.8); backdrop-filter:blur(6px); color:#facc15; font-size:14px; font-weight:900; padding:6px 12px; border-radius:12px; border:1px solid rgba(250,204,21,0.4); display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-tag"></i>
            <span>${priceTxt}</span>
          </div>
        </div>

        <!-- Caption & Action Toolbar -->
        <div style="padding:14px 16px;">
          <p style="font-size:13px; font-weight:700; color:#1e293b; margin:0 0 12px; line-height:1.6;">${st.caption || st.title || ''}</p>
          
          <div style="display:grid; grid-template-columns: 1.1fr 1.1fr 0.9fr 0.7fr; gap:6px; margin-top:8px;">
            <a href="https://wa.me/${finalWa}?text=${encodeURIComponent('مرحباً، أود الطلب بخصوص عرضكم اللحظي: ' + (st.caption || st.title || ''))}" target="_blank" style="height:40px; background:linear-gradient(135deg, #25D366, #128C7E); color:white; border-radius:12px; font-weight:900; font-size:11.5px; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 2px 8px rgba(37,211,102,0.25);">
              <i class="fa-brands fa-whatsapp" style="font-size:14px;"></i> واتساب
            </a>
            <button onclick="window.quickOrderFromFeedIndex(${idx})" style="height:40px; background:linear-gradient(135deg, #0284c7, #0369a1); color:white; border:none; border-radius:12px; font-weight:900; font-size:11.5px; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 2px 8px rgba(2,132,199,0.25); cursor:pointer;">
              <i class="fa-solid fa-bolt-lightning" style="color:#fef08a;"></i> طلب مباشر
            </button>
            <button onclick="window.addStoryToCartFromFeedIndex(${idx})" style="height:40px; background:var(--brand-gold, #D4AF37); color:var(--navy, #0c4a6e); border:none; border-radius:12px; font-weight:900; font-size:11.5px; display:flex; align-items:center; justify-content:center; gap:5px; box-shadow:0 2px 8px rgba(212,175,55,0.2); cursor:pointer;">
              <i class="fa-solid fa-cart-plus"></i> سلة
            </button>
            <button onclick="window.toggleLikeFromFeedIndex(${idx})" style="height:40px; background:${isLiked ? '#fef3c7' : '#f8fafc'}; border:1.5px solid ${isLiked ? '#f59e0b' : '#e2e8f0'}; border-radius:12px; color:#f59e0b; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-size:11.5px; font-weight:800;">
              <span>⭐</span>
              <span>${st.likes || 1}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.openStoryViewer = function(storyId) {
  const modal = document.getElementById('storyViewerModal');
  if (!modal) return;

  const stories = window.getMergedStoriesList();
  let story = stories.find(s => String(s.id) === String(storyId));
  if (!story && storyId) {
    story = stories.find(s => (s.author && s.author.includes(storyId)) || (s.storeId && s.storeId.includes(storyId)));
  }
  if (!story && stories.length > 0) {
    story = stories[0];
  }
  if (!story) return;

  window.currentActiveStory = story;

  const authorEl = document.getElementById('sv-author');
  if (authorEl) authorEl.textContent = story.author || story.store_name || 'متجر ZaLo';

  const wilayaEl = document.getElementById('sv-wilaya');
  if (wilayaEl) wilayaEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${story.wilaya || 'الجزائر'}`;

  const catEl = document.getElementById('sv-category');
  if (catEl) {
    catEl.textContent = (story.subcategory && story.subcategory !== 'عام' && story.subcategory !== 'تخصص عام') ? `${story.category || ''} • ${story.subcategory}` : (story.category || 'عرض لحظي');
  }

  const timeEl = document.getElementById('sv-time');
  if (timeEl) timeEl.textContent = story.time || 'الآن';

  const imgEl = document.getElementById('sv-image');
  if (imgEl) imgEl.src = story.image || 'images/wilaya-thumb.jpg';

  const capEl = document.getElementById('sv-caption');
  if (capEl) capEl.textContent = story.caption || story.title || '';

  const priceEl = document.getElementById('sv-price');
  if (priceEl) priceEl.textContent = (story.price && parseFloat(story.price) > 0) ? `${parseFloat(story.price).toLocaleString()} دج` : '';

  const avatarEl = document.getElementById('sv-avatar');
  if (avatarEl) {
    avatarEl.src = story.logo || story.image || 'assets/icon-192.svg';
    avatarEl.onerror = () => { avatarEl.src = 'assets/icon-192.svg'; };
  }

  const likesCountEl = document.getElementById('sv-likes-count');
  if (likesCountEl) likesCountEl.textContent = story.likes || 1;

  const cleanPhone = (story.phone || '0550000000').replace(/[^0-9]/g, '');
  const finalWa = cleanPhone.startsWith('0') ? '213' + cleanPhone.substring(1) : (cleanPhone.startsWith('213') ? cleanPhone : '213' + cleanPhone);
  
  const waBtn = document.getElementById('sv-whatsapp-btn');
  if (waBtn) {
    waBtn.href = `https://wa.me/${finalWa}?text=${encodeURIComponent('مرحباً، أود الاستفسار والطلب بخصوص منشوركم اللحظي في ZaLo: ' + (story.caption || story.title || ''))}`;
  }

  modal.style.display = 'flex';
  modal.style.zIndex = '999999';
};

window.openStoreFromCurrentStory = function() {
  if (!window.currentActiveStory) return;
  const s = window.currentActiveStory;
  const storyModal = document.getElementById('storyViewerModal');
  if (storyModal) storyModal.style.display = 'none';
  const liveModal = document.getElementById('liveOffersFeedModal');
  if (liveModal) liveModal.style.display = 'none';
  
  const sId = s.storeId || s.store_id || s.userId || ('store_' + encodeURIComponent(s.author || ''));
  const sName = s.author || s.store_name || 'متجر معتمد';
  if (typeof window.openStoreView === 'function') {
    window.openStoreView(sId, sName);
  }
};

// switchTab is defined in customer-home-logic.js with full functionality

