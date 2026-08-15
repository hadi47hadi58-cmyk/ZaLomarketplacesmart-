with open('web/customer-home.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
pattern = r'function\s+renderProductsInGrid\s*\(.*?\)\s*\{.*?\n\}'
match = re.search(pattern, text, re.DOTALL)

if match:
    old_func = match.group(0)
    print('Found function, length:', len(old_func))
    
    new_func = '''function renderProductsInGrid(prods, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!prods || prods.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 40px 20px; background: white; border-radius: 20px; border: 1px solid #e2e8f0; margin: 10px 0;">
        <i class="fa-solid fa-box-open" style="font-size: 38px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
        <h3 style="font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 6px;">لا توجد معروضات حالياً في هذا الفرع بـ ${state.selectedBaladiya || state.selectedWilaya || 'هذه المنطقة'}</h3>
        <p style="font-size: 12px; color: #64748b; line-height: 1.6; max-width: 320px; margin: 0 auto 16px;">
          إذا كنت تاجرًا أو مزود خدمات في هذه المنطقة، يمكنك تسجيل متجرك وإضافة معروضاتك بسهولة لتظهر للزبائن هنا.
        </p>
        <button onclick="applyForMerchant()" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-shop"></i> انضم كتاجر الآن
        </button>
      </div>
    `;
    return;
  }
  // Facebook / Instagram / TikTok Social Feed Style Feed
  container.innerHTML = prods.map(p => {
    const pId = p.id || p.productId;
    const pName = p.name || p.productName || 'سلعة معتمدة';
    const pPrice = parseFloat(p.price) || 0;
    const pDesc = p.description || p.desc || 'عرض مميز حصري على منصة ZaLo';
    const pImg = p.image || p.image_url || p.imageUrl || 'assets/icon-192.svg';
    const storeName = p.store_name || p.storeName || 'متجر معتمد';
    const storeWilaya = p.wilaya || state.selectedWilaya || 'الجزائر';
    
    return `
      <div class="fb-post-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); overflow: hidden;">
        <!-- Post Header (Facebook / Instagram style) -->
        <div style="padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #f0f9ff; border: 1px solid #bae6fd; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #0284c7; overflow: hidden;">
              <i class="fa-solid fa-store" style="font-size: 16px;"></i>
            </div>
            <div>
              <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 4px;">
                ${storeName} <span style="background: #0284c7; color: white; font-size: 9px; padding: 1px 6px; border-radius: 6px; font-weight: 700;">مُعتمد ✓</span>
              </div>
              <div style="font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                <i class="fa-solid fa-location-dot" style="color: #ef4444; font-size: 10px;"></i> ولاية ${storeWilaya} • منذ لحظات ⚡
              </div>
            </div>
          </div>
          <div style="background: #f8fafc; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 900; color: #0284c7; border: 1px solid #e2e8f0;">
            ${pPrice.toLocaleString()} دج
          </div>
        </div>

        <!-- Post Caption / Description -->
        <div style="padding: 12px 16px; font-size: 13px; color: #334155; line-height: 1.5; font-weight: 600;">
          <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">${pName}</div>
          <div>${pDesc}</div>
        </div>

        <!-- Post Image (Facebook Feed Post Format) -->
        <div onclick="window.openProductDetails('${pId}')" style="width: 100%; height: 280px; background: #0f172a; cursor: pointer; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
          <img src="${pImg}" alt="${pName}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;">
          <div style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); color: white; padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 700;">
            🔍 انقر للمعاينة والتفاصيل
          </div>
        </div>

        <!-- Facebook Style Interaction Bar (Like, Comments, Share, Order) -->
        <div style="padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #f1f5f9; background: #fafafa;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <button onclick="window.toggleLikeProduct && window.toggleLikeProduct('${pId}')" style="background: none; border: none; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer;">
              <i class="fa-regular fa-heart" style="color: #ef4444; font-size: 15px;"></i> إعجاب
            </button>
            <button onclick="window.openProductDetails('${pId}')" style="background: none; border: none; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer;">
              <i class="fa-regular fa-comment" style="color: #0284c7; font-size: 15px;"></i> تعليق
            </button>
          </div>
          <button onclick="window.openProductDetails('${pId}')" style="background: linear-gradient(135deg, #0284c7, #0369a1); color: white; border: none; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(2,132,199,0.2);">
            <i class="fa-solid fa-cart-shopping"></i> اطلب الآن
          </button>
        </div>
      </div>
    `;
  }).join('');
}'''

    text = text.replace(old_func, new_func)
    with open('web/customer-home.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("SUCCESS")
else:
    print("PATTERN NOT FOUND")
