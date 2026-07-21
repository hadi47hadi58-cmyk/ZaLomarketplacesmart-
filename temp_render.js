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
