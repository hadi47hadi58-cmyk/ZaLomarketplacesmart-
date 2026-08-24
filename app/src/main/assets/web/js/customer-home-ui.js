
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
  
  stories = (stories || []).filter(st => {
    if (!st || !st.id) return false;
    return true;
  });

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

  // Helper to ingest store records into map
  const ingestStore = (s) => {
    if (!s) return;
    const sStatus = String(s.status || '').toUpperCase();
    if (sStatus === 'REJECTED' || sStatus === 'DELETED') return;

    const sName = (s.name || s.store_name || s.storeName || '').trim();
    if (!sName) return;

    const sId = String(s.id || ('store_' + encodeURIComponent(sName)));
    const existing = storesMap.get(sId) || storesMap.get(sName);

    const logo = s.logo_url || s.logo || (existing ? existing.logo : null) || 'assets/icon-192.svg';
    const banner = s.banner_url || s.cover_url || s.coverImage || (existing ? existing.banner : null) || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500';
    const wilaya = s.wilaya || (existing ? existing.wilaya : '58 - المنيعة');
    const phone = s.phone || (existing ? existing.phone : '0698694010');

    storesMap.set(sId, {
      id: sId,
      name: sName,
      wilaya: wilaya,
      phone: phone,
      logo: logo,
      banner: banner,
      productCount: existing ? existing.productCount : 0
    });
  };

  // 1. Initial preload from window/local caches for instant display
  if (window.officialStores && Array.isArray(window.officialStores)) {
    window.officialStores.forEach(ingestStore);
  }
  try {
    const cached = JSON.parse(localStorage.getItem('zalo_official_stores') || '[]');
    if (Array.isArray(cached)) cached.forEach(ingestStore);
  } catch(e) {}

  // 2. Fetch live from Supabase stores table
  try {
    const sb = window.supabase || window.supabaseClient;
    if (sb && sb.from) {
      const { data: dbStores, error } = await sb.from('stores')
        .select('*')
        .order('wilaya', { ascending: true });
        
      if (!error && dbStores && Array.isArray(dbStores)) {
        dbStores.forEach(ingestStore);
      }
    }
  } catch(e) {
    console.warn("Direct Supabase fetch for directory:", e);
  }

  // 3. Ingest stores from live stories to guarantee new stores appear immediately
  const stories = window.getMergedStoriesList ? window.getMergedStoriesList() : [];
  stories.forEach(st => {
    const sName = st.author || st.store_name || st.name;
    if (sName) {
      ingestStore({
        id: st.store_id || st.storeId || ('store_' + encodeURIComponent(sName)),
        name: sName,
        wilaya: st.wilaya,
        phone: st.phone,
        logo_url: st.logo,
        banner_url: st.coverImage
      });
    }
  });

  // 4. Count products for stores
  let allProds = window.allSources || [];
  if (typeof state !== 'undefined' && state?.loadedProducts && state.loadedProducts.length) {
    allProds = state.loadedProducts;
  }
  
  allProds.forEach(p => {
    if (p.deleted === true || p.status === 'deleted') return;
    const sId = String(p.storeId || p.store_id || '');
    const sName = (p.store || p.storeName || p.author || '').trim();
    if (storesMap.has(sId)) {
      storesMap.get(sId).productCount++;
    } else if (sName) {
      // Find by name
      for (const [key, storeObj] of storesMap.entries()) {
        if (storeObj.name.trim().toLowerCase() === sName.toLowerCase()) {
          storeObj.productCount++;
          break;
        }
      }
    }
  });

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
    container.innerHTML = '<div style="text-align: center; padding: 28px 16px; color: #94a3b8; font-size: 13px; font-weight: 700;"><i class="fa-solid fa-store-slash" style="font-size: 24px; color: #94a3b8; margin-bottom: 8px; display: block;"></i>لا توجد متاجر معتمدة حالياً.</div>';
    return;
  }

  let html = '';
  stores.forEach(store => {
    const strWilaya = String(store.wilaya || '58 - المنيعة');
    const matchW = strWilaya.match(/\d+/);
    const wilayaNum = matchW ? matchW[0] : '';
    const wilayaName = strWilaya.replace(/^\d+\s*-\s*/, '');
    const safeStoreId = String(store.id || '').replace(/'/g, "\\'");
    const safeStoreName = String(store.name || '').replace(/'/g, "\\'");
    const logoSrc = store.logo || 'assets/icon-192.svg';
    
    html += `
      <div onclick="if(typeof window.openStoreView==='function'){ window.openStoreView('${safeStoreId}', '${safeStoreName}'); } else { window.showToast('جاري فتح صفحة المتجر...'); }" style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.03); margin-bottom: 8px;" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#38bdf8';" onmouseout="this.style.background='#ffffff'; this.style.borderColor='#e2e8f0';">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: #f8fafc; border: 1.5px solid #e2e8f0; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <img src="${logoSrc}" alt="${safeStoreName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='assets/icon-192.svg';">
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <h4 style="font-size: 14px; font-weight: 900; color: #0f172a; margin: 0;">${store.name}</h4>
              <i class="fa-solid fa-circle-check" style="color: #0284c7; font-size: 13px;" title="متجر معتمد"></i>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px; flex-wrap: wrap;">
              <span style="font-size: 11px; color: #475569; font-weight: 700; background: #f1f5f9; padding: 2px 8px; border-radius: 8px; display: flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-location-dot" style="color: #ef4444; font-size: 10px;"></i> ولاية ${wilayaName} ${wilayaNum ? '('+wilayaNum+')' : ''}
              </span>
              <span style="font-size: 10.5px; color: #0284c7; font-weight: 800; background: #f0f9ff; border: 1px solid #bae6fd; padding: 2px 8px; border-radius: 8px;">${store.productCount > 0 ? store.productCount + ' منتجات' : 'متجر نشط'}</span>
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

