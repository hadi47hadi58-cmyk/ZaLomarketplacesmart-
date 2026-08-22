with open('web/customer-home.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove add story button from renderHomeStories
old_render = '''window.renderHomeStories = function() {  const container = document.getElementById('home-stories-container');  if (!container) return;  const stories = window.liveStoriesList || [];    let html = `    <!-- Add Story Button (Facebook Stories Style) -->    <div class=\"story-card-item\" onclick=\"openCreateStoryModal()\">      <div class=\"story-avatar-wrap\" style=\"background:linear-gradient(135deg, #0284c7, #38bdf8); display:flex; align-items:center; justify-content:center;\">        <i class=\"fa-solid fa-plus\" style=\"font-size:24px; color:#ffffff;\"></i>      </div>      <div class=\"story-label\" style=\"font-weight:900; color:#0284c7;\">+ أنشر عرضك</div>    </div>  `;  html += stories.map('''

new_render = '''window.renderHomeStories = function() {  const container = document.getElementById('home-stories-container');  if (!container) return;  const stories = window.liveStoriesList || [];    let html = stories.map('''

if old_render in text:
    text = text.replace(old_render, new_render)
    print('Successfully updated renderHomeStories')
else:
    print('old_render not found exactly')

# 2. Insert stories section wrap below Promo Banner
banner_target = '''    <!-- Promo Banner -->
    <div class="banner-mockup" style="margin: 0 16px 12px 16px;">
      <div class="banner-text-content">
        عرض خاص: خصم 20% على كل المنتجات 🎉
      </div>
    </div>'''

stories_feed_html = '''    <!-- Promo Banner -->
    <div class="banner-mockup" style="margin: 0 16px 12px 16px;">
      <div class="banner-text-content">
        عرض خاص: خصم 20% على كل المنتجات 🎉
      </div>
    </div>

    <!-- Facebook Stories & Live Posts Feed Section (Below Promo Banner) -->
    <div class="stories-section-wrap" style="margin: 0 16px 12px 16px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); background: #ffffff; padding: 12px 16px 8px;">
      <div class="stories-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <h3 style="font-size: 13px; font-weight: 800; color: var(--navy); display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-bolt" style="color: #0284c7;"></i> قصص ومنشورات السوق اللحظية
        </h3>
        <span style="font-size: 11px; color: #64748b; font-weight: 700;">فيديو وصور ⚡</span>
      </div>
      <div class="stories-scroll" id="home-stories-container" style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px;">
        <!-- Dynamically rendered stories -->
      </div>
    </div>'''

if banner_target in text:
    text = text.replace(banner_target, stories_feed_html)
    print('Successfully inserted stories feed below promo banner')
else:
    print('banner_target not found')

with open('web/customer-home.html', 'w', encoding='utf-8') as f:
    f.write(text)
