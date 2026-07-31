/**
 * ZaLo Market - IndexedDB Advanced Offline Cache Engine
 * Provides offline caching for products, product attributes, store metadata, and cart state.
 */

(function(window) {
  'use strict';

  const DB_NAME = 'ZaLoOfflineDB';
  const DB_VERSION = 1;

  let dbInstance = null;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (dbInstance) {
        resolve(dbInstance);
        return;
      }

      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not supported in this browser environment.');
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function(event) {
        const db = event.target.result;

        // Products Store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('storeId', 'storeId', { unique: false });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Cart Store
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart', { keyPath: 'id' });
        }

        // Product Attributes & Variants Store
        if (!db.objectStoreNames.contains('product_attributes')) {
          db.createObjectStore('product_attributes', { keyPath: 'id' });
        }

        // Store Profiles Cache
        if (!db.objectStoreNames.contains('stores')) {
          db.createObjectStore('stores', { keyPath: 'id' });
        }
      };

      request.onsuccess = function(event) {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = function(event) {
        console.error('IndexedDB error opening database:', event.target.error);
        resolve(null);
      };
    });
  }

  const ZaLoDB = {
    async init() {
      return await openDatabase();
    },

    /**
     * Cache array of products & their attributes to IndexedDB
     */
    async saveProducts(products) {
      const db = await openDatabase();
      if (!db || !Array.isArray(products)) return false;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction(['products', 'product_attributes'], 'readwrite');
          const productStore = tx.objectStore('products');
          const attrStore = tx.objectStore('product_attributes');

          const now = Date.now();

          products.forEach(p => {
            if (!p || (!p.id && !p.productId)) return;
            const productId = String(p.id || p.productId);
            const normalized = {
              id: productId,
              productId: productId,
              name: p.name || p.productName || 'سلعة ZaLo',
              productName: p.productName || p.name || 'سلعة ZaLo',
              price: Number(p.price) || 0,
              stock: Number(p.stock) || 0,
              category: p.category || 'عام',
              description: p.description || p.desc || '',
              image: p.image || p.imageUrl || p.logoImg || 'assets/icon-192.svg',
              storeId: p.storeId || p.store_id || 'direct',
              storeName: p.storeName || p.store_name || 'متجر معتمد',
              wilaya: p.wilaya || 'الجزائر',
              phone: p.phone || '',
              status: p.status || 'active',
              updatedAt: now
            };

            // Save to products store
            productStore.put(normalized);

            // Save extended attributes (variants, details, specifications)
            const attributes = {
              id: productId,
              color: p.color || p.colors || [],
              size: p.size || p.sizes || [],
              weight: p.weight || '',
              warranty: p.warranty || 'ضمان ZaLo المحلي',
              tags: p.tags || [p.category || 'عام'],
              specifications: p.specifications || p.specs || {},
              storeDetails: {
                id: p.storeId || 'direct',
                name: p.storeName || 'متجر معتمد',
                phone: p.phone || ''
              },
              updatedAt: now
            };
            attrStore.put(attributes);
          });

          tx.oncomplete = function() {
            // Backup copy in localStorage as fallback
            try {
              localStorage.setItem('zalo_idb_products_backup', JSON.stringify(products.slice(0, 50)));
            } catch (e) {}
            resolve(true);
          };

          tx.onerror = function(e) {
            console.warn('Transaction error saving products to IndexedDB:', e);
            resolve(false);
          };
        } catch (err) {
          console.error('Failed to save products to IndexedDB:', err);
          resolve(false);
        }
      });
    },

    /**
     * Retrieve all cached products from IndexedDB
     */
    async getProducts() {
      const db = await openDatabase();
      if (!db) {
        try {
          const raw = localStorage.getItem('zalo_idb_products_backup');
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      }

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('products', 'readonly');
          const store = tx.objectStore('products');
          const request = store.getAll();

          request.onsuccess = function() {
            const results = request.result || [];
            if (results.length > 0) {
              resolve(results);
            } else {
              // Try fallback from localStorage
              try {
                const raw = localStorage.getItem('zalo_idb_products_backup');
                resolve(raw ? JSON.parse(raw) : []);
              } catch (e) {
                resolve([]);
              }
            }
          };

          request.onerror = function() {
            resolve([]);
          };
        } catch (err) {
          console.error('Failed to get products from IndexedDB:', err);
          resolve([]);
        }
      });
    },

    /**
     * Save cart items & detailed product attributes to IndexedDB
     */
    async saveCart(cartItems) {
      const db = await openDatabase();
      if (!Array.isArray(cartItems)) return false;

      // Always sync to localStorage as immediate mirror
      try {
        localStorage.setItem('zalo_cart', JSON.stringify(cartItems));
      } catch (e) {}

      if (!db) return false;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('cart', 'readwrite');
          const store = tx.objectStore('cart');
          
          // Clear current store first
          const clearReq = store.clear();
          clearReq.onsuccess = function() {
            cartItems.forEach(item => {
              if (item && item.id) {
                store.put({
                  id: String(item.id),
                  name: item.name || 'سلعة ZaLo',
                  price: Number(item.price) || 0,
                  img: item.img || item.image || '',
                  emoji: item.emoji || '📦',
                  storeId: item.storeId || 'direct',
                  storeName: item.storeName || 'محل ZaLo شريك',
                  qty: Number(item.qty) || 1,
                  attributes: item.attributes || {},
                  updatedAt: Date.now()
                });
              }
            });
          };

          tx.oncomplete = function() {
            resolve(true);
          };

          tx.onerror = function(e) {
            console.warn('Error saving cart to IndexedDB:', e);
            resolve(false);
          };
        } catch (err) {
          console.error('Failed to save cart to IndexedDB:', err);
          resolve(false);
        }
      });
    },

    /**
     * Retrieve cart items from IndexedDB
     */
    async getCart() {
      const db = await openDatabase();
      if (!db) {
        try {
          const raw = localStorage.getItem('zalo_cart');
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      }

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('cart', 'readonly');
          const store = tx.objectStore('cart');
          const request = store.getAll();

          request.onsuccess = function() {
            const results = request.result || [];
            if (results.length > 0) {
              resolve(results);
            } else {
              try {
                const raw = localStorage.getItem('zalo_cart');
                resolve(raw ? JSON.parse(raw) : []);
              } catch (e) {
                resolve([]);
              }
            }
          };

          request.onerror = function() {
            try {
              const raw = localStorage.getItem('zalo_cart');
              resolve(raw ? JSON.parse(raw) : []);
            } catch (e) {
              resolve([]);
            }
          };
        } catch (err) {
          console.error('Failed to get cart from IndexedDB:', err);
          resolve([]);
        }
      });
    },

    /**
     * Get product attributes by product ID
     */
    async getProductAttributes(productId) {
      const db = await openDatabase();
      if (!db || !productId) return null;

      return new Promise((resolve) => {
        try {
          const tx = db.transaction('product_attributes', 'readonly');
          const store = tx.objectStore('product_attributes');
          const request = store.get(String(productId));

          request.onsuccess = function() {
            resolve(request.result || null);
          };

          request.onerror = function() {
            resolve(null);
          };
        } catch (err) {
          resolve(null);
        }
      });
    }
  };

  // Expose to global window scope
  window.ZaLoDB = ZaLoDB;

  // Auto initialize on script load
  ZaLoDB.init().then(() => {
    console.log('✅ ZaLo IndexedDB Offline Cache Engine Ready.');
  });

})(window);
