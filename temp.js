import {
  initializeApp,
  getFirestore,
  getAuth,
  onAuthStateChanged,
  collection,
  getDocs,
  doc,
  getDoc
} from "./js/supabase-db-compat.js";
import { supabase } from "./js/supabase-config.js";

// Initialize Compatibility layer
const app = initializeApp();
const db = getFirestore(app);
const auth = getAuth(app);
window._ff = { doc, getDoc, getFirestore };
window._db = db;

const state = {
  activeTab: 'home',
  loadedProducts: [],
  selectedProduct: null,
  qty: 1
};

// --- AI CHATBOT FUNCTIONALITY ---
let chatbotOpen = false;
let chatHistory = [];

window.toggleChatbot = function() {
  const drawer = document.getElementById('chatbot-drawer');
  if (!drawer) return;
  chatbotOpen = !chatbotOpen;
  if (chatbotOpen) {
    drawer.classList.add('open');
    const msgs = document.getElementById('chatbot-messages');
    if (msgs) {
      msgs.scrollTop = msgs.scrollHeight;
    }
    
    // Set dynamic name if user is logged in
    const cachedSession = localStorage.getItem('zalo_local_session');
    if (cachedSession) {
      try {
        const session = JSON.parse(cachedSession);
        const nameSpan = document.getElementById('chat-user-name');
        if (nameSpan && session.user && session.user.user_metadata) {
          nameSpan.textContent = session.user.user_metadata.full_name || session.user.email.split('@')[0];
        }
      } catch (e) {}
    }
  } else {
    drawer.classList.remove('open');
  }
};

window.handleChatbotKey = function(e) {
  if (e.key === 'Enter') {
    window.sendChatbotMessage();
  }
};

window.sendQuickMessage = function(text) {
  const input = document.getElementById('chatbot-input');
  if (input) {
    input.value = text;
    window.sendChatbotMessage();
  }
};

window.sendChatbotMessage = async function() {
  const input = document.getElementById('chatbot-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  
  // Clear input
  input.value = '';
  
  // Append user message
  appendChatMessage(text, 'user');
  
  // Show loading bot bubble
  const loadingId = appendChatMessage('مساعد ZaLo يكتب الآن... ✍️', 'bot loading');
  
  try {
    const apiKey = window.GEMINI_API_KEY || "AIzaSyC2KWJfMIQ3YZv9r-Ejp9hBWv3UYkkY_7M";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // Format current product data securely
    const productsData = (state.loadedProducts || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      store: p.store_name || "متجر ZaLo",
      desc: p.description || "",
      category: p.category || ""
    }));
    
    const systemPrompt = `أنت "مساعد ZaLo الذكي 🌴🤖"، المساعد الشخصي الذكي والودود لمنصة ZaLo للتجارة والتوصيل الفوري في 69 ولاية جزائرية.
مهمتك هي مساعدة المستخدمين في تصفح وشرح أزرار التطبيق، وفهم المنتجات، واقتراح سلع للشراء بناءً على ميزانيتهم أو متطلباتهم.

هنا دليل أزرار وشاشات التطبيق لشرحها للمستخدم عند الطلب:
1. زر "الرئيسية" 🏠: لتصفح كل المنتجات المتوفرة والعروض النشطة في التطبيق.
2. زر "الأقسام" 📂: لتصفح السلع مقسمة حسب الفئات (إلكترونيات، موضة، غذائية، إلخ).
3. زر "المفضلة" ❤️: لمشاهدة المنتجات التي قمت بحفظها للرجوع إليها لاحقاً.
4. زر "السلة" 🛒: لعرض السلع المضافة وتعبئة تفاصيل شحن طلبيتك (الاسم، الهاتف، العنوان، والولاية) لتأكيد الشراء.
5. زر "حسابي" 👤: لعرض تفاصيل حسابك وتقديم طلب شراكة تجارية لتصبح بائعاً في التطبيق وتفعيل لوحة الإدارة.
6. زر "تتبع الشحنات المباشر" 🚚: في قائمة الجانب (☰) أو تبويب الطلبات لتتبع سائق الموزع الفوري وموقعه الحالي خطوة بخطوة حتى منزلك.
7. زر "تنظيف الكاش وتحديث فوري" 🔄: في القائمة الجانبية لحل أي مشاكل مزامنة أو بطء في البيانات.

قائمة المنتجات الحالية المتاحة في المتجر هي كالتالي (محدثة ديناميكياً):
${JSON.stringify(productsData)}

عند اقتراح منتج، يرجى كتابة اسمه وسعره ومتجره بدقة، وإدراج المعرف الفريد الخاص به في نهاية الفقرة على الشكل التالي تماماً:
[PRODUCT_CARD:id]
حيث id هو المعرف الخاص بالمنتج من القائمة أعلاه. سيقوم النظام باستبدال هذا الرمز ببطاقة تفاعلية تمكن المستخدم من الشراء بضغطة زر واحدة!

الأسعار بالدينار الجزائري (دج).
تصنيف الأسعار:
- السعر المنخفض: المنتجات التي سعرها أقل من 2000 دج.
- السعر المتوسط: المنتجات التي سعرها بين 2000 دج و 10000 دج.
- السعر المرتفع: المنتجات التي سعرها أعلى من 10000 دج.

تحدث بلهجة عربية مهذبة ومرحبة (ويمكنك استخدام بعض الكلمات الجزائرية الخفيفة مثل "مرحباً بيك"، "واش تسحق"، "دج" لتبسيط التواصل). كن ذكياً وسريع الاستجابة ومباشراً!`;

    // Add user message to history
    chatHistory.push({
      role: 'user',
      parts: [{ text: text }]
    });
    
    const requestBody = {
      contents: chatHistory,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Remove loading bubble
    removeChatBubble(loadingId);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const resData = await response.json();
    let botResponse = "";
    if (resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts[0]) {
      botResponse = resData.candidates[0].content.parts[0].text;
    } else {
      botResponse = "عذراً شريكي، واجهت مشكلة في الاتصال بذكائي، هل يمكنك تكرار السؤال؟";
    }
    
    // Save response to history
    chatHistory.push({
      role: 'model',
      parts: [{ text: botResponse }]
    });
    
    // Keep history compact
    if (chatHistory.length > 20) chatHistory.shift();
    
    // Render bot message with product parsing
    appendChatMessage(botResponse, 'bot');
    
  } catch (err) {
    console.error("Gemini Error:", err);
    removeChatBubble(loadingId);
    // Intelligent local offline fallback
    handleLocalOfflineFallback(text);
  }
};

function removeChatBubble(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function appendChatMessage(text, senderClass) {
  const msgs = document.getElementById('chatbot-messages');
  if (!msgs) return "";
  const bubbleId = 'bubble-' + Date.now() + '-' + Math.floor(Math.random()*1000);
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${senderClass}`;
  msgDiv.id = bubbleId;
  
  let htmlContent = "";
  if (senderClass.includes('bot') && !senderClass.includes('loading')) {
    htmlContent = formatBotResponse(text);
  } else {
    htmlContent = `<div class="chat-msg-text">${escapeHTML(text)}</div>`;
  }
  
  msgDiv.innerHTML = htmlContent;
  msgs.appendChild(msgDiv);
  msgs.scrollTop = msgs.scrollHeight;
  return bubbleId;
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatBotResponse(text) {
  let formatted = text.replace(/\n/g, '<br>');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  const cardRegex = /\[PRODUCT_CARD:([a-zA-Z0-9_-]+)\]/g;
  let matches = [...formatted.matchAll(cardRegex)];
  
  let cardsHtml = "";
  if (matches.length > 0) {
    matches.forEach(match => {
      const pId = match[1];
      const prod = (state.loadedProducts || []).find(p => p.id === pId);
      if (prod) {
        const prodImg = prod.image_url ? `<img src="${prod.image_url}">` : (prod.emoji || "🛍️");
        cardsHtml += `
          <div class="ai-product-card">
            <div class="ai-product-img">${prodImg}</div>
            <div class="ai-product-details">
              <div class="ai-product-title">${prod.name}</div>
              <div class="ai-product-price">${prod.price} دج</div>
              <div class="ai-product-store">🏬 ${prod.store_name || "متجر ZaLo"}</div>
            </div>
            <button class="ai-product-buy-btn" onclick="window.aiBuyDirect('${prod.id}', '${prod.name.replace(/'/g, "\\'")}', ${prod.price}, '${prod.image_url || ""}', '${prod.emoji || "🛍️"}', '${prod.store_id || ""}', '${(prod.store_name || "متجر ZaLo").replace(/'/g, "\\'")}')">شراء فوري 🛒</button>
          </div>
        `;
      }
      formatted = formatted.replace(match[0], '');
    });
  }
  
  return `<div class="chat-msg-text">${formatted}</div>${cardsHtml}`;
}

window.aiBuyDirect = function(id, name, price, img, emoji, storeId, storeName) {
  window.addToCartDirect(id, name, price, img, emoji, storeId, storeName, 1);
  window.switchTab('cart');
  window.toggleChatbot();
};

function handleLocalOfflineFallback(query) {
  let fallbackText = "";
  const queryLower = query.toLowerCase();
  
  let matchedProds = [];
  const prods = state.loadedProducts || [];
  
  if (queryLower.includes("منخفض") || queryLower.includes("رخيص") || queryLower.includes("رخيصة")) {
    matchedProds = prods.filter(p => p.price < 2000).slice(0, 3);
    fallbackText = "لقد عثرت لك على المنتجات التالية ذات الأسعار المنخفضة (أقل من 2000 دج) في متجرنا: 👇";
  } else if (queryLower.includes("متوسط") || queryLower.includes("متوسطة")) {
    matchedProds = prods.filter(p => p.price >= 2000 && p.price <= 10000).slice(0, 3);
    fallbackText = "هذه هي السلع ذات الفئة السعرية المتوسطة (بين 2000 دج و 10000 دج) المتوفرة لدينا: 👇";
  } else if (queryLower.includes("مرتفع") || queryLower.includes("غال") || queryLower.includes("مرتفعة")) {
    matchedProds = prods.filter(p => p.price > 10000).slice(0, 3);
    fallbackText = "إليك باقة من أرقى المنتجات ذات القيمة المرتفعة (أكثر من 10000 دج) المتوفرة الآن: 👇";
  } else {
    const priceNum = parseInt(query.replace(/[^0-9]/g, ''));
    if (!isNaN(priceNum)) {
      matchedProds = prods.filter(p => Math.abs(p.price - priceNum) <= priceNum * 0.35).slice(0, 3);
      fallbackText = `لقد قمت بالبحث عن منتجات بحدود سعر ${priceNum} دج، وإليك أفضل المقترحات المقاربة: 👇`;
    } else {
      matchedProds = prods.filter(p => p.name.includes(query) || (p.description && p.description.includes(query))).slice(0, 3);
      if (matchedProds.length > 0) {
        fallbackText = `إليك ما وجدته في المتجر بخصوص "${query}": 👇`;
      } else {
        fallbackText = "أهلاً بك شريكي! لم أتمكن من فهم طلبك بدقة أو الاتصال بالخادم، جرب اختيار أحد الخيارات السريعة المتاحة بالأسفل أو كتابة ميزانية معينة!";
      }
    }
  }
  
  let cardsHtml = "";
  matchedProds.forEach(prod => {
    const prodImg = prod.image_url ? `<img src="${prod.image_url}">` : (prod.emoji || "🛍️");
    cardsHtml += `
      <div class="ai-product-card">
        <div class="ai-product-img">${prodImg}</div>
        <div class="ai-product-details">
          <div class="ai-product-title">${prod.name}</div>
          <div class="ai-product-price">${prod.price} دج</div>
          <div class="ai-product-store">🏬 ${prod.store_name || "متجر ZaLo"}</div>
        </div>
        <button class="ai-product-buy-btn" onclick="window.aiBuyDirect('${prod.id}', '${prod.name.replace(/'/g, "\\'")}', ${prod.price}, '${prod.image_url || ""}', '${prod.emoji || "🛍️"}', '${prod.store_id || ""}', '${(prod.store_name || "متجر ZaLo").replace(/'/g, "\\'")}')">شراء فوري 🛒</button>
      </div>
    `;
  });
  
  const msgs = document.getElementById('chatbot-messages');
  if (msgs) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg bot`;
    msgDiv.innerHTML = `<div class="chat-msg-text">${fallbackText}</div>${cardsHtml}`;
    msgs.appendChild(msgDiv);
    msgs.scrollTop = msgs.scrollHeight;
  }
}

// Global Toasts helper
window.showToast = function(msg) {
  const t = document.createElement('div');
  t.className = 'toast show';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 3200);
};

// Sidebar Handlers
window.openSide = function() {
  document.getElementById('sidemenu').classList.add('open');
  document.getElementById('overlay').classList.add('show');
};
window.closeSide = function() {
  document.getElementById('sidemenu').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
};

// Routing contacts
window.openLink = function(url) {
  window.open(url, '_blank');
};
window.openWA = function(num, msg) {
  const n = num.replace(/\D/g,'');
  const i = n.startsWith('0') ? '213' + n.slice(1) : n;
  window.open('https://wa.me/' + i + '?text=' + encodeURIComponent(msg), '_blank');
};

// Clear Cache & Reload
window.forceUpdateApp = function() {
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let r of registrations) r.unregister();
      });
    }
    if (window.caches) {
      caches.keys().then(names => {
        for (let name of names) caches.delete(name);
      });
    }
    localStorage.clear();
    sessionStorage.clear();
    window.showToast("🧹 تم تنظيف الكاش وتحديث التطبيق فورا!");
    setTimeout(() => window.location.reload(), 1000);
  } catch(e) {
    window.location.reload();
  }
};

// Auth and Page Guard
onAuthStateChanged(auth, async (user) => {
  const localToken = localStorage.getItem('zalo_session_jwt') || localStorage.getItem('nestjs_token') || localStorage.getItem('zalo_token');
  const localEmail = localStorage.getItem('zalo_user_email') || localStorage.getItem('user_email');
  
  if (!user) {
    if (localToken && localEmail) {
      user = {
        id: localStorage.getItem('zalo_uid') || localStorage.getItem('user_uid') || 'zalo-customer-id',
        email: localEmail
      };
    } else {
      console.warn("PageGuard: Session not found, acting as Guest...");
      user = { id: 'guest', email: 'زائر' };
      
    }
  }

  window.currentUser = user;
  
  // Set customer profile UI details
  document.getElementById('customer-email').textContent = user.email || 'مستخدم ZaLo';
  document.getElementById('customer-id-tag').textContent = user.id.slice(0, 8);
  document.getElementById('drawer-user-email').textContent = user.email || 'مستخدم ZaLo';
  document.getElementById('drawer-user-id').textContent = user.id.slice(0, 8);
  
  // Sync request statuses
  syncMerchantRequestStatus(user);
  
  // Load initial content
  populateCheckoutWilayas();
  loadProducts();
  loadCartItems();
  loadFavorites();
  loadCustomerOrders();
  updateNotificationBadge();
});

// Logout handler (Anti-loop secure logout)
window.handleLogout = async function() {
  try {
    console.log("Logout: Clearing all tokens...");
    localStorage.removeItem('zalo_local_session');
    localStorage.removeItem('zalo_token');
    localStorage.removeItem('zalo_session_jwt');
    localStorage.removeItem('zalo_user_role');
    localStorage.removeItem('zalo_user_email');
    localStorage.removeItem('zalo_active_session');
    localStorage.removeItem('nestjs_token');
    localStorage.removeItem('nestjs_user');
    localStorage.removeItem('user_uid');
    localStorage.removeItem('user_email');
    localStorage.removeItem('zalo_uid');
    localStorage.removeItem('zalo_user_name');
    localStorage.removeItem('zalo_role');
    
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          localStorage.removeItem(key);
        }
      }
    } catch(e) {}
    
    sessionStorage.clear();
    await supabase.auth.signOut();
  } catch(e) {
    console.error("signOut error:", e);
  } finally {
    user = { id: 'guest', email: 'زائر' };
  }
};

// Sync Merchant request status
async function syncMerchantRequestStatus(user) {
  const btn = document.getElementById('apply-merchant-btn');
  const container = document.getElementById('application-status-container');
  if (!btn || !container) return;

  try {
    const { data: requests, error } = await supabase
      .from('merchant_requests')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (requests) {
      if (requests.status === 'pending') {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> طلبك قيد المراجعة...`;
        container.style.display = 'block';
        container.style.color = '#d4af37';
        container.innerHTML = '⏳ تم إيداع طلب الشراكة بنجاح وهو قيد الدراسة والتدقيق من قبل الإدارة العليا.';
      } else if (requests.status === 'approved' || requests.status === 'active') {
        localStorage.setItem('zalo_user_role', 'MERCHANT');
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> شريك معتمد`;
        container.style.display = 'block';
        container.style.color = '#16a34a';
        container.innerHTML = `
          <div style="margin-bottom: 8px;">✅ حسابك نشط ومعتمد كتاجر!</div>
          <button onclick="window.location.href='dashboard-store.html'" class="btn-p" style="background:#1d9bf0; font-size:12px; height:38px;">
            <i class="fa-solid fa-gauge"></i> الدخول للوحة التحكم 📦
          </button>
        `;
      }
    } else {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-briefcase"></i> تقديم طلب انضمام كتاجر شريك`;
      container.style.display = 'none';
    }
  } catch(e) {
    console.warn("Could not sync requests status:", e);
  }
}

// Open merchant modal
window.applyForMerchant = function() {
  document.getElementById('merchantModal').style.display = 'block';
};

// Submit partner application
document.getElementById('merchantRequestForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...`;

  const user = window.currentUser;
  if (!user) return;

  const storeName = document.getElementById('storeName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const rc = document.getElementById('commercialRegister').value.trim();
  const wilaya = document.getElementById('merchantWilaya').value;
  const desc = document.getElementById('description').value.trim();

  const payload = {
    id: user.id,
    storeName: storeName,
    ownerName: user.email ? user.email.split('@')[0] : 'تاجر ZaLo',
    email: user.email,
    phone: phone,
    whatsapp: phone,
    wilaya: wilaya,
    commune: 'غير محدد',
    category: 'عام',
    storeType: 'registered',
    rcNumber: rc,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from('merchant_requests').upsert(payload);
    await supabase.from('profiles').upsert({
      id: user.id,
      name: storeName,
      email: user.email,
      phone: phone,
      wilaya: wilaya,
      role: 'merchant',
      status: 'pending',
      updatedAt: new Date().toISOString()
    });

    // Save locally to stores_list_old so Admin Dashboard can see it instantly
    try {
      const dbKey = "zalo_stores_list_old";
      let localStores = [];
      const raw = localStorage.getItem(dbKey);
      if (raw) {
        localStores = JSON.parse(raw);
      }
      
      const newLocalStore = {
        id: user.id,
        name: storeName,
        owner: user.email ? user.email.split('@')[0] : 'تاجر ZaLo',
        email: user.email,
        phone: phone,
        location: wilaya,
        regCode: rc || "RC-" + Math.floor(100000 + Math.random() * 900000),
        category: "عام",
        activityType: "بيع منتجات",
        status: "PENDING"
      };

      const existsIdx = localStores.findIndex(s => s.id === user.id);
      if (existsIdx !== -1) {
        localStores[existsIdx] = newLocalStore;
      } else {
        localStores.unshift(newLocalStore);
      }
      localStorage.setItem(dbKey, JSON.stringify(localStores));
    } catch(e) {
      console.warn("Local storage sync for store requests failed:", e);
    }

    document.getElementById('merchantModal').style.display = 'none';
    window.showToast("✨ تم تقديم طلب انضمامك للشبكة بنجاح!");
    syncMerchantRequestStatus(user);
  } catch(err) {
    console.error(err);
    window.showToast("❌ حدث قصور أثناء رفع الطلب.");
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> إرسال طلب الشراكة للإدارة`;
  }
});

// Scroll to merchant partner section
window.scrollToMerchantSection = function() {
  switchTab('profile');
  setTimeout(() => {
    const card = document.getElementById('merchant-partner-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
};

// Tab Navigator Switcher
window.switchTab = function(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.bnav-btn-mockup').forEach(el => el.classList.remove('active'));
  
  const targetScreen = document.getElementById(`screen-${tabId}`);
  if (targetScreen) targetScreen.classList.add('active');

  const bnavBtn = document.getElementById(`bnav-${tabId}`);
  if (bnavBtn) {
    bnavBtn.classList.add('active');
  }

  if (tabId === 'cart') {
    loadCartItems();
  } else if (tabId === 'favs') {
    loadFavorites();
  } else if (tabId === 'orders') {
    loadCustomerOrders();
  }
};

// Fetch and render products on screen-home
async function loadProducts() {
  const grid = document.getElementById('home-pgrid');
  if (!grid) return;
  
  let localProds = [];
  try {
    const rawLocal = localStorage.getItem('zalo_products');
    if (rawLocal) {
      localProds = JSON.parse(rawLocal);
    }
  } catch (e) {
    console.error("Failed to parse local products:", e);
  }

  let remoteProds = [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (!error && data) {
      remoteProds = data;
    }
  } catch (e) {
    console.warn("Failed to fetch remote products:", e);
  }

  const unifiedRemote = remoteProds.map(p => ({
    id: p.id || p.productId,
    productId: p.productId || p.id,
    name: p.name || p.productName || 'سلعة ZaLo',
    productName: p.productName || p.name || 'سلعة ZaLo',
    price: p.price || 0,
    stock: p.stock || 0,
    category: p.category || 'عام',
    description: p.description || p.desc || '',
    image: p.image || p.imageUrl || p.image_url || p.imageURL || '',
    storeId: p.storeId || 'direct',
    storeName: p.storeName || 'محل ZaLo شريك',
    status: p.status || 'active'
  }));

  const unifiedLocal = localProds.map(p => {
    let sName = p.storeName || 'محل ZaLo شريك';
    try {
      const ms = localStorage.getItem('zalo_merchant_store_settings');
      if (ms) {
        const settings = JSON.parse(ms);
        if (settings && settings.storeName) {
          sName = settings.storeName;
        }
      }
    } catch (err) {}

    return {
      id: p.productId || p.id,
      productId: p.productId || p.id,
      name: p.productName || p.name || 'سلعة ZaLo',
      productName: p.productName || p.name || 'سلعة ZaLo',
      price: parseFloat(p.price) || 0,
      stock: parseInt(p.stock) || 0,
      category: p.category || 'عام',
      description: p.description || p.desc || '',
      image: p.image || p.logoImg || p.coverImg || 'assets/icon-192.svg',
      storeId: p.storeId || 'direct',
      storeName: sName,
      status: p.status || 'active'
    };
  });

  let merged = [...unifiedRemote];
  unifiedLocal.forEach(lp => {
    const exists = merged.some(rp => rp.id === lp.id || rp.name.trim() === lp.name.trim());
    if (!exists) {
      merged.push(lp);
    }
  });

  state.loadedProducts = merged;
  applyActiveWilayaFilter();
}

function renderProductsList(list) {
  const grid = document.getElementById('home-pgrid');
  if (!grid) return;
  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: span 2;">
        <i class="fa-solid fa-box-open"></i>
        <p>لا توجد سلع معروضة حالياً بهذا القسم!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  list.forEach(p => {
    if (p.deleted === true || p.status === 'deleted') return;
    const pName = p.name || p.productName || '';
    const imgUrl = p.image || p.imageURL || p.imageUrl || p.image_url || p.url || '';
    const price = p.price || 0;
    const storeId = p.storeId || 'direct';
    const storeName = p.storeName || p.shopName || 'محل ZaLo شريك';

    grid.innerHTML += `
      <div class="pcard">
        <div class="pcard-img-container" onclick="openProd('${p.id}','${pName.replace(/'/g,"\\'")}',${price},'${imgUrl}','${p.emoji||'📦'}','${storeId}','${storeName.replace(/'/g,"\\'")}')">
          ${imgUrl ? `<img src="${imgUrl}" class="pcard-img-tag" alt="${pName}">` : `<span class="pcard-emoji-span">${p.emoji||'📦'}</span>`}
        </div>
        <div class="pcard-info-box">
          <div class="pcard-rating-row"><span class="pcard-rating-star">⭐</span> 4.7</div>
          <div class="pcard-title-text" onclick="openProd('${p.id}','${pName.replace(/'/g,"\\'")}',${price},'${imgUrl}','${p.emoji||'📦'}','${storeId}','${storeName.replace(/'/g,"\\'")}')">${pName}</div>
          <div class="pcard-price-row">
            <span class="pcard-price-value">${price.toLocaleString()} دج</span> <span class="pcard-coin-emoji">💰</span>
          </div>
          <button class="pcard-add-btn" onclick="event.stopPropagation(); window.addToCartDirect('${p.id}','${pName.replace(/'/g,"\\'")}',${price},'${imgUrl}','${p.emoji||'📦'}','${storeId}','${storeName.replace(/'/g,"\\'")}')">
            <i class="fa-solid fa-cart-shopping"></i> إضافة للسلة
          </button>
        </div>
      </div>
    `;
  });
}

// Category and Search Filtering
window.filterHomeProducts = function(category, element) {
  const items = document.querySelectorAll('.category-item-mockup');
  const isActive = element.classList.contains('active');
  items.forEach(el => el.classList.remove('active'));

  if (isActive) {
    renderProductsList(state.loadedProducts);
  } else {
    element.classList.add('active');
    const filtered = state.loadedProducts.filter(p => {
      const cat = (p.category || '').toLowerCase();
      if (category === 'هواتف وإلكترونيات') {
        return cat.includes('الكترون') || cat.includes('هاتف');
      }
      if (category === 'ملابس وأزياء') {
        return cat.includes('ملابس') || cat.includes('موضة') || cat.includes('أزياء');
      }
      if (category === 'مواد غذائية') {
        return cat.includes('غذائي') || cat.includes('طعام');
      }
      if (category === 'أثاث ومنزل') {
        return cat.includes('منزل') || cat.includes('أثاث');
      }
      if (category === 'كتب ومستلزمات') {
        return cat.includes('كتب') || cat.includes('مكتب') || cat.includes('مستلزمات');
      }
      return cat.includes(category.toLowerCase());
    });
    renderProductsList(filtered);
  }
};

window.filterCatAndSwitch = function(category) {
  switchTab('home');
  // Find category item element
  const items = document.querySelectorAll('.category-item-mockup');
  items.forEach(item => {
    const label = item.querySelector('.category-label-mockup').textContent;
    let match = false;
    if (category.includes('إلكترون') && label.includes('الكترون')) match = true;
    else if (category.includes('ملابس') && label.includes('موضة')) match = true;
    else if (category.includes('غذائي') && label.includes('غذا')) match = true;
    else if (category.includes('منزل') && label.includes('منزل')) match = true;
    else if (category.includes('كتب') && label.includes('كتب')) match = true;
    
    if (match || label.includes(category.substring(0, 3))) {
      window.filterHomeProducts(category, item);
    }
  });
};

window.handleHomeSearch = function(e) {
  if (e.key === 'Enter') executeHomeSearch();
};

window.executeHomeSearch = function() {
  const query = document.getElementById('homeSearchInp').value.trim().toLowerCase();
  if (!query) {
    renderProductsList(state.loadedProducts);
    
  }
  const filtered = state.loadedProducts.filter(p => 
    (p.name || p.productName || '').toLowerCase().includes(query) ||
    (p.category || '').toLowerCase().includes(query)
  );
  renderProductsList(filtered);
};

// Product detail modal
window.openProd = function(id, name, price, img, emoji, storeId, storeName) {
  state.selectedProduct = { id, name, price, img, emoji, storeId, storeName };
  state.qty = 1;

  document.getElementById('pd-modal-title').textContent = "تفاصيل السلعة المعروضة";
  document.getElementById('pd-name').textContent = name;
  document.getElementById('pd-price').textContent = price.toLocaleString() + ' دج';
  document.getElementById('pd-store').textContent = `🏪 توفير: ${storeName || 'محل شريك معتمد'}`;
  document.getElementById('qty-v').textContent = '1';
  
  const imgWrap = document.getElementById('pd-img-wrap');
  imgWrap.innerHTML = img ? `<img src="${img}" style="max-width:100%; max-height:100%; object-fit:contain;">` : `<span style="font-size:72px;">${emoji||'📦'}</span>`;

  // Check if saved as favorite
  const favs = JSON.parse(localStorage.getItem('zalo_favorites') || '[]');
  const isFav = favs.some(f => f.id === id);
  const heart = document.getElementById('modal-fav-heart');
  heart.style.color = isFav ? '#ef4444' : 'var(--gray)';

  document.getElementById('productModal').style.display = 'flex';
};

window.chQty = function(delta) {
  state.qty = Math.max(1, state.qty + delta);
  document.getElementById('qty-v').textContent = state.qty;
};

// Add to cart from modal
window.addToCartFromModal = function() {
  if (!state.selectedProduct) return;
  const item = state.selectedProduct;
  addToCartDirect(item.id, item.name, item.price, item.img, item.emoji, item.storeId, item.storeName, state.qty);
  document.getElementById('productModal').style.display = 'none';
};

window.addToCartDirect = function(id, name, price, img, emoji, storeId, storeName, customQty = 1) {
  const cart = JSON.parse(localStorage.getItem('zalo_cart') || '[]');
  const item = {
    id: id,
    name: name,
    price: Number(price),
    img: img || '',
    emoji: emoji || '📦',
    storeId: storeId || 'direct',
    storeName: storeName || 'محل ZaLo شريك',
    qty: customQty
  };

  const idx = cart.findIndex(c => c.id === id);
  if (idx !== -1) {
    cart[idx].qty += customQty;
  } else {
    cart.push(item);
  }

  localStorage.setItem('zalo_cart', JSON.stringify(cart));
  window.showToast("✔️ تم إضافة المنتج بنجاح لسلة المشتريات! 🛒");
  updateCartBadge();
};

window.updateCartBadge = function() {
  const cart = JSON.parse(localStorage.getItem('zalo_cart') || '[]');
  const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
  const badge = document.getElementById('cart-badge-count');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
};

// Favorites operations
window.toggleFavFromModal = function() {
  if (!state.selectedProduct) return;
  const p = state.selectedProduct;
  const favs = JSON.parse(localStorage.getItem('zalo_favorites') || '[]');
  const idx = favs.findIndex(f => f.id === p.id);
  
  const heart = document.getElementById('modal-fav-heart');

  if (idx !== -1) {
    favs.splice(idx, 1);
    heart.style.color = 'var(--gray)';
    window.showToast("❌ تمت الإزالة من قائمتك المفضلة.");
  } else {
    favs.push(p);
    heart.style.color = '#ef4444';
    window.showToast("❤️ تم حفظ السلعة في المفضلة!");
  }
  localStorage.setItem('zalo_favorites', JSON.stringify(favs));
  loadFavorites();
};

window.loadFavorites = function() {
  const container = document.getElementById('favorites-items-container');
  if (!container) return;
  const favs = JSON.parse(localStorage.getItem('zalo_favorites') || '[]');

  if (favs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-heart-broken"></i>
        <p>لا توجد منتجات محفوظة في قائمتك المفضلة بعد!</p>
      </div>
    `;
    
  }

  container.innerHTML = '';
  favs.forEach(item => {
    container.innerHTML += `
      <div class="fav-item-card">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <span style="font-size:28px;">${item.emoji || '📦'}</span>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:800; color:var(--navy);">${item.name}</div>
            <div style="font-size:11px; color:var(--metallic-gold); font-weight:800;">${Number(item.price || 0).toLocaleString()} دج</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button onclick="openProd('${item.id}','${item.name.replace(/'/g,"\\'")}',${item.price},'${item.img}','${item.emoji}','${item.storeId}','${item.storeName.replace(/'/g,"\\'")}')" class="btn-s" style="padding: 6px 10px; width:36px; height:36px;">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button onclick="removeFromFav('${item.id}')" class="btn-s" style="color:var(--red); padding: 6px 10px; width:36px; height:36px;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });
};

window.removeFromFav = function(id) {
  let favs = JSON.parse(localStorage.getItem('zalo_favorites') || '[]');
  favs = favs.filter(f => f.id !== id);
  localStorage.setItem('zalo_favorites', JSON.stringify(favs));
  loadFavorites();
  window.showToast("❌ تمت إزالة المنتج من المفضلة.");
};

// Cart Display and Operations
window.loadCartItems = function() {
  const container = document.getElementById('cart-items-container');
  const form = document.getElementById('cart-checkout-form-container');
  if (!container || !form) return;

  const cart = JSON.parse(localStorage.getItem('zalo_cart') || '[]');
  updateCartBadge();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-shopping-basket"></i>
        <p>سلة المشتريات الحالية فارغة!</p>
        <p style="font-size:11px; font-weight:normal; margin-top:4px;">اذهب للرئيسية واختر منتجاتك المفضلة للطلب.</p>
      </div>
    `;
    form.style.display = 'none';
    
  }

  container.innerHTML = '';
  form.style.display = 'flex';

  let total = 0;
  cart.forEach(item => {
    total += (item.price * item.qty);
    container.innerHTML += `
      <div class="cart-item-card">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <span style="font-size:28px;">${item.emoji || '📦'}</span>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:800; color:var(--navy);">${item.name}</div>
            <div style="font-size:10px; color:var(--gray);"><i class="fa-solid fa-store" style="color:var(--brand-gold);"></i> ${item.storeName || 'محل محلي'}</div>
          </div>
          <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color:var(--red); cursor:pointer; font-size:14px; padding:6px;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        <div style="border-top:1px dashed var(--bd); padding-top:8px; display:flex; justify-content:space-between; align-items:center; font-size:12px;">
          <div>
            <span style="color:var(--gray);">الكمية:</span>
            <span style="font-weight:bold; background:#f1f5f9; padding:2px 8px; border-radius:6px; margin-right:4px;">${item.qty}</span>
          </div>
          <div>
            <span style="color:var(--gray);">المجموع:</span>
            <span style="color:var(--metallic-gold); font-weight:bold;">${(item.price * item.qty).toLocaleString()} دج</span>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML += `
    <div style="background:rgba(212,175,55,0.05); border:1.5px solid var(--metallic-gold); border-radius:12px; padding:14px; display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:800;">
      <span style="color:var(--gray);">القيمة الإجمالية للسلة (${cart.length} أصناف):</span>
      <span style="color:var(--metallic-gold); font-size:15px; font-weight:900;">${total.toLocaleString()} دج</span>
    </div>
  `;
};

window.removeFromCart = function(id) {
  let cart = JSON.parse(localStorage.getItem('zalo_cart') || '[]');
  cart = cart.filter(c => c.id !== id);
  localStorage.setItem('zalo_cart', JSON.stringify(cart));
  loadCartItems();
  window.showToast("❌ تم إزالة المنتج من سلة المشتريات.");
};

// Checkout
window.checkoutCart = async function() {
  const cart = JSON.parse(localStorage.getItem('zalo_cart') || '[]');
  if (cart.length === 0) {
    window.showToast("⚠️ سلتك فارغة حالياً!"); return;
    
  }

  const name = document.getElementById('cart-name').value.trim();
  const phone = document.getElementById('cart-phone').value.trim();
  const addr = document.getElementById('cart-addr').value.trim();
  const wilaya = document.getElementById('cart-wil').value;
  const pay = document.getElementById('cart-pay').value;

  if (!name || !phone || !addr || !wilaya) {
    window.showToast("⚠️ يرجى تعبئة كافة الحقول المطلوبة للتسليم!"); return;
    
  }

  // Segment by storeId
  const groups = {};
  cart.forEach(item => {
    const sId = item.storeId || 'direct';
    if (!groups[sId]) groups[sId] = [];
    groups[sId].push(item);
  });

  const customerId = window.currentUser ? window.currentUser.id : 'anonymous';
  let successfulOrders = 0;
  const localOrders = JSON.parse(localStorage.getItem('zalo_local_orders') || '[]');

  for (const storeId in groups) {
    const groupItems = groups[storeId];
    const storeName = groupItems[0].storeName || 'محل شريك';
    const subtotal = groupItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const orderId = 'ord_' + Math.random().toString(36).substring(2, 11);

    const orderPayload = {
      id: orderId,
      customer_id: customerId,
      customerName: name,
      customerPhone: phone,
      address: addr,
      wilaya: wilaya,
      commune: 'غير محدد',
      storeId: storeId,
      storeName: storeName,
      totalAmount: subtotal,
      paymentMethod: pay,
      paymentStatus: 'pending',
      status: 'pending',
      items: JSON.stringify(groupItems),
      createdAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('orders').insert(orderPayload);
      if (error) throw error;
      successfulOrders++;
    } catch(err) {
      console.warn("Direct online order submission failed, storing offline:", err);
      localOrders.push(orderPayload);
      successfulOrders++;
    }
  }

  if (successfulOrders > 0) {
    localStorage.setItem('zalo_local_orders', JSON.stringify(localOrders));
    localStorage.removeItem('zalo_cart');
    window.showToast(`✨ تم إرسال ${successfulOrders} طلبيات للمتاجر المعنية بنجاح!`);
    
    // Redirect to orders tab
    switchTab('orders');
  } else {
    window.showToast("❌ فشل تأكيد الطلبات، يرجى تكرار المحاولة.");
  }
};

// Customer Orders list
window.loadCustomerOrders = async function() {
  const container = document.getElementById('customer-orders-list');
  const tracker = document.getElementById('live-driver-tracker-container');
  if (!container || !tracker) return;

  if (!window.currentUser) {
    container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--gray);">لم يتم تفعيل جلسة المستخدم.</div>';
    
  }

  try {
    let orders = [];
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', window.currentUser.id);
      if (!error && data) orders = data;
    } catch(e) {}

    // Add offline orders
    try {
      const offline = JSON.parse(localStorage.getItem('zalo_local_orders') || '[]');
      offline.forEach(o => {
        if (!orders.some(x => x.id === o.id)) orders.push(o);
      });
    } catch(e) {}

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-box-open"></i>
          <p>ليس لديك أي طلبيات شراء مسجلة حالياً!</p>
          <p style="font-size:11px; font-weight:normal; margin-top:4px;">ابدأ بالتسوق واختيار منتجاتك المفضلة من السوق الذكي.</p>
        </div>
      `;
      tracker.style.display = 'none';
      
    }

    orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = '';
    let shippingOrder = null;

    orders.forEach(ord => {
      const status = (ord.status || 'pending').toLowerCase();
      let badgeClass = 'badge-pending';
      let statusText = 'قيد المراجعة';

      if (status === 'processing' || status === 'approved') {
        badgeClass = 'badge-processing';
        statusText = 'قيد التجهيز';
      } else if (status === 'shipping' || status === 'shipped') {
        badgeClass = 'badge-shipping';
        statusText = 'في الطريق للتوصيل 🚚';
        shippingOrder = ord;
      } else if (status === 'delivered') {
        badgeClass = 'badge-delivered';
        statusText = 'تم التسليم بنجاح';
      }

      let items = [];
      try {
        items = typeof ord.items === 'string' ? JSON.parse(ord.items) : (ord.items || []);
      } catch(e) {}

      let itemsHtml = items.map(it => `
        <div style="display:flex; justify-content:space-between; font-size:12px; border-bottom:1px solid rgba(0,0,0,0.03); padding:4px 0;">
          <span style="color:var(--navy);">${it.emoji||'📦'} ${it.name} <span style="color:var(--gray);">x${it.qty}</span></span>
          <span style="color:var(--metallic-gold); font-weight:800;">${(it.price * it.qty).toLocaleString()} دج</span>
        </div>
      `).join('');

      container.innerHTML += `
        <div class="order-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:var(--gray);">رقم الطلب: #${String(ord.id).slice(0, 8)}</span>
            <span class="badge ${badgeClass}">${statusText}</span>
          </div>
          <div style="border-top:1.5px solid var(--bd); border-bottom:1.5px solid var(--bd); padding:8px 0; display:flex; flex-direction:column; gap:4px;">
            ${itemsHtml}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
            <span style="color:var(--gray);">الموفر:</span>
            <span style="font-weight:700;"><i class="fa-solid fa-store" style="color:var(--metallic-gold);"></i> ${ord.storeName || 'شريك معتمد'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:900;">
            <span style="color:var(--navy);">المجموع شامل التوصيل:</span>
            <span style="color:var(--metallic-gold);">${Number(ord.totalAmount || 0).toLocaleString()} دج</span>
          </div>
        </div>
      `;
    });

    // Render Live tracker if shipping order exists
    if (shippingOrder) {
      tracker.style.display = 'block';
      tracker.innerHTML = `
        <div class="driver-tracker-card" style="margin-bottom: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="color:var(--metallic-gold); font-size:13px; font-weight:900; margin:0; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-motorcycle"></i> تتبع شاحنة الموزع الفوري
            </h4>
            <span class="badge badge-shipping">في الطريق للتوصيل</span>
          </div>
          
          <div style="display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.06); border-radius:12px; padding:10px;">
            <div style="width:38px; height:38px; border-radius:50%; background:rgba(212,175,55,0.2); display:flex; align-items:center; justify-content:center; color:var(--metallic-gold); font-size:16px;">
              <i class="fa-solid fa-user-ninja"></i>
            </div>
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:800; color:#fff;">أمين الودود (سائق معتمد)</div>
              <div style="font-size:10px; color:rgba(255,255,255,0.7);">دراجة نارية • الشحنة #${String(shippingOrder.id).slice(0, 8)}</div>
            </div>
            <a href="tel:0555123456" style="background:var(--metallic-gold); width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#070a08; text-decoration:none; font-size:12px;">
              <i class="fa-solid fa-phone"></i>
            </a>
          </div>

          <div class="tracker-steps">
            <div class="tracker-progress-line" style="width: 70%;"></div>
            
            <div class="tracker-step active">
              <div class="tracker-icon-circle"><i class="fa-solid fa-check"></i></div>
              <span class="tracker-step-title">تم التأكيد</span>
            </div>
            <div class="tracker-step active">
              <div class="tracker-icon-circle"><i class="fa-solid fa-box-open"></i></div>
              <span class="tracker-step-title">تم التجهيز</span>
            </div>
            <div class="tracker-step active">
              <div class="tracker-icon-circle"><i class="fa-solid fa-motorcycle"></i></div>
              <span class="tracker-step-title">في الطريق</span>
            </div>
            <div class="tracker-step">
              <div class="tracker-icon-circle"><i class="fa-solid fa-house"></i></div>
              <span class="tracker-step-title">الاستلام</span>
            </div>
          </div>
          
          <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:4px;">
            🏍️ الموزع على بعد <span style="color:var(--metallic-gold); font-weight:bold;">1.2 كم</span> (الوصول التقريبي خلال 8 دقائق)
          </div>
        </div>
      `;
    } else {
      tracker.style.display = 'none';
    }

  } catch(e) {
    console.error(e);
    container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--gray);">فشل تحميل الفواتير.</div>';
  }
};

// Notification badge and modal
window.updateNotificationBadge = function() {
  const badge = document.getElementById('notif-badge-count');
  if (!badge) return;
  
  // Set mock notifications list
  const list = [
    { id: "1", title: "مرحباً بك في منصة ZaLo الموحدة!", desc: "حسابك جاهز للشراء والتتبع في 69 ولاية جزائرية.", date: "الآن" },
    { id: "2", title: "ميزة تتبع الموزع", desc: "تابع شحنتك وموقع الموزع فوراً عند الشحن.", date: "أمس" }
  ];
  
  badge.textContent = "2";
  badge.style.display = "flex";
};

window.openNotificationsModal = function() {
  const modal = document.getElementById('notificationsModal');
  const body = document.getElementById('notif-modal-body');
  if (!modal || !body) return;

  const list = [
    { id: "1", title: "🎯 مرحباً بك في منصة ZaLo الموحدة!", desc: "بوابتك الموحدة مجهزة ومربوطة بأحدث تقنيات تتبع الشحنات وسلة المنتجات.", date: "الآن" },
    { id: "2", title: "🚚 ميزة تتبع السائق المباشر", desc: "يمكنك متابعة خط سير الموزع خطوة بخطوة عند شحن طلبيتك.", date: "منذ ساعة" }
  ];

  body.innerHTML = '';
  list.forEach(n => {
    body.innerHTML += `
      <div style="background:#f8fafc; border-radius:10px; border:1px solid var(--bd); padding:10px; text-align:right;">
        <div style="font-weight:800; font-size:12px; color:var(--navy); margin-bottom:2px;">${n.title}</div>
        <div style="font-size:11px; color:var(--gray); line-height:1.4;">${n.desc}</div>
        <div style="font-size:9px; color:var(--brand-gold); text-align:left; margin-top:4px;">${n.date}</div>
      </div>
    `;
  });

  modal.style.display = 'flex';
};

// Checkout Wilayas Population
const WILAYAS = [
  {n:"أدرار"},{n:"الشلف"},{n:"الأغواط"},{n:"أم البواقي"},{n:"باتنة"},{n:"بجاية"},{n:"بسكرة"},{n:"بشار"},{n:"البليدة"},{n:"البويرة"},
  {n:"تمنراست"},{n:"تبسة"},{n:"تلمسان"},{n:"تيارت"},{n:"تيزي وزو"},{n:"الجزائر العاصمة"},{n:"الجلفة"},{n:"جيجل"},{n:"سطيف"},{n:"سعيدة"},
  {n:"سكيكدة"},{n:"سيدي بلعباس"},{n:"عنابة"},{n:"قالمة"},{n:"قسنطينة"},{n:"المدية"},{n:"مستغانم"},{n:"المسيلة"},{n:"معسكر"},{n:"ورقلة"},
  {n:"وهران"},{n:"البيض"},{n:"إليزي"},{n:"برج بوعريريج"},{n:"بومرداس"},{n:"الطارف"},{n:"تندوف"},{n:"تيسمسيلت"},{n:"الوادي"},{n:"خنشلة"},
  {n:"سوق أهراس"},{n:"تيبازة"},{n:"ميلة"},{n:"عين الدفلى"},{n:"النعامة"},{n:"عين تموشنت"},{n:"غرداية"},{n:"غليزان"},{n:"تيميمون"},{n:"برج باجي مختار"},
  {n:"أولاد جلال"},{n:"بني عباس"},{n:"عين صالح"},{n:"عين قزام"},{n:"تقرت"},{n:"جانت"},{n:"المغير"},{n:"المنيعة"},{n:"توقرت"}
];

function populateCheckoutWilayas() {
  const sel = document.getElementById('cart-wil');
  if (sel) {
    sel.innerHTML = '<option value="">اختر ولاية التسليم...</option>';
    WILAYAS.forEach(w => {
      const o = document.createElement('option');
      o.value = w.n;
      o.textContent = w.n;
      sel.appendChild(o);
    });
  }
}

// --- IN-APP WILAYA MODAL FUNCTIONS ---
window.openChangeWilayaModal = function() {
  const modal = document.getElementById('changeWilayaModal');
  if (modal) {
    modal.style.display = 'flex';
    renderAppWilayasGrid(WILAYAS);
  }
};

window.closeChangeWilayaModal = function() {
  const modal = document.getElementById('changeWilayaModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

function renderAppWilayasGrid(list) {
  const container = document.getElementById('app-wilayas-grid');
  if (!container) return;
  container.innerHTML = '';
  list.forEach(w => {
    const card = document.createElement('div');
    card.className = 'wilaya-card';
    card.textContent = w.n;
    card.onclick = () => selectAppWilaya(w.n);
    container.appendChild(card);
  });
}

window.filterAppWilayas = function(search) {
  const filtered = WILAYAS.filter(w => w.n.includes(search));
  renderAppWilayasGrid(filtered);
};

window.selectAppWilaya = function(wilaya) {
  localStorage.setItem('zalo_selected_wilaya', wilaya);
  closeChangeWilayaModal();
  applyActiveWilayaFilter();
};

window.applyActiveWilayaFilter = function() {
  const selected = localStorage.getItem('zalo_selected_wilaya') || 'الكل';
  const bannerText = document.getElementById('active-wilaya-name');
  if (bannerText) {
    bannerText.textContent = selected === 'الكل' ? 'الكل (توصيل لكافة الولايات)' : selected;
  }
  
  if (!state.loadedProducts) return;
  
  if (selected === 'الكل') {
    renderProductsList(state.loadedProducts);
  } else {
    const filtered = state.loadedProducts.filter(p => {
      const storeName = (p.storeName || p.store_name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const val = selected.toLowerCase();
      return storeName.includes(val) || desc.includes(val);
    });
    
    if (filtered.length === 0) {
      renderProductsList(state.loadedProducts);
      const grid = document.getElementById('home-pgrid');
      if (grid) {
        // Clear any old tips first
        const oldTip = document.getElementById('wilaya-empty-tip');
        if (oldTip) oldTip.remove();
        
        const tip = document.createElement('div');
        tip.id = 'wilaya-empty-tip';
        tip.style.cssText = 'grid-column: span 2; background: rgba(212, 175, 55, 0.08); border: 1.5px solid var(--brand-gold); border-radius: 12px; padding: 12px; text-align: center; font-size: 11.5px; font-weight: bold; color: var(--navy); margin-bottom: 12px; width: 100%;';
        tip.innerHTML = `💡 لا توجد متاجر محلية مسجلة بـ ${selected} حالياً. نعرض لك كافة المنتجات مع الشحن الفوري السريع لولايتك 🚚`;
        grid.insertBefore(tip, grid.firstChild);
      }
    } else {
      // Clear old tip if products are found now
      const oldTip = document.getElementById('wilaya-empty-tip');
      if (oldTip) oldTip.remove();
      renderProductsList(filtered);
    }
  }
};
