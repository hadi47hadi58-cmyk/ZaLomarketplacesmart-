/**
 * ZaLo Marketplace - World-Class Offline-First Sync & Caching Engine
 * Inspired by global architectures (WhatsApp/Amazon/Instabuy):
 * - Instant local cache rendering with background Supabase PostgreSQL synchronization
 * - Optimistic UI updates with offline queuing & automatic retry
 * - Intelligent timeout & fallback protection
 */

class ZaLoSyncEngine {
  constructor() {
    this.syncInterval = null;
    this.isOnline = navigator.onLine;
    this.initListeners();
  }

  initListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log("[ZaLo Sync] Connection restored. Flushing offline queue...");
      this.flushOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.warn("[ZaLo Sync] Device offline. Operating in Offline-First Mode.");
    });
  }

  /**
   * Save data with local cache fallback
   */
  setLocalCache(key, data) {
    try {
      const payload = {
        timestamp: Date.now(),
        data: data
      };
      localStorage.setItem(`zalo_cache_${key}`, JSON.stringify(payload));
    } catch (e) {
      console.error("[ZaLo Sync] Failed to save local cache:", e);
    }
  }

  /**
   * Get data from local cache
   */
  getLocalCache(key, maxAgeMs = 24 * 60 * 60 * 1000) {
    try {
      const raw = localStorage.getItem(`zalo_cache_${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > maxAgeMs) {
        console.warn(`[ZaLo Sync] Cache expired for ${key}`);
      }
      return parsed.data;
    } catch (e) {
      console.error("[ZaLo Sync] Failed to read local cache:", e);
      return null;
    }
  }

  /**
   * Execute Supabase query with timeout & offline fallback
   */
  async safeQuery(queryFn, fallbackKey, timeoutMs = 4000) {
    if (!this.isOnline) {
      console.log(`[ZaLo Sync] Offline mode. Returning cache for ${fallbackKey}`);
      return { data: this.getLocalCache(fallbackKey), error: null, fromCache: true };
    }

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network Timeout')), timeoutMs)
      );

      const result = await Promise.race([queryFn(), timeoutPromise]);
      if (result && result.data) {
        this.setLocalCache(fallbackKey, result.data);
      }
      return { ...result, fromCache: false };
    } catch (e) {
      console.warn(`[ZaLo Sync] Query failed or timed out for ${fallbackKey}. Falling back to cache:`, e.message);
      return { data: this.getLocalCache(fallbackKey), error: e, fromCache: true };
    }
  }

  /**
   * Queue offline action for background sync
   */
  queueOfflineAction(actionType, payload) {
    try {
      const queue = JSON.parse(localStorage.getItem('zalo_offline_queue') || '[]');
      queue.push({
        id: 'act_' + Date.now() + Math.random().toString(36).substr(2, 5),
        type: actionType,
        payload: payload,
        timestamp: Date.now()
      });
      localStorage.setItem('zalo_offline_queue', JSON.stringify(queue));
      console.log(`[ZaLo Sync] Queued offline action: ${actionType}`);
    } catch (e) {
      console.error("[ZaLo Sync] Failed to queue offline action:", e);
    }
  }

  async flushOfflineQueue() {
    try {
      const queue = JSON.parse(localStorage.getItem('zalo_offline_queue') || '[]');
      if (queue.length === 0) return;

      console.log(`[ZaLo Sync] Processing ${queue.length} offline queued actions...`);
      const remaining = [];

      for (const act of queue) {
        try {
          // Process based on action type
          if (act.type === 'INSERT_ORDER' && window.supabase) {
            await window.supabase.from('orders').insert([act.payload]);
          } else if (act.type === 'INSERT_PRODUCT' && window.supabase) {
            await window.supabase.from('products').insert([act.payload]);
          }
        } catch (err) {
          console.error(`[ZaLo Sync] Failed to sync queued action ${act.type}:`, err);
          remaining.push(act);
        }
      }

      localStorage.setItem('zalo_offline_queue', JSON.stringify(remaining));
      if (remaining.length === 0) {
        console.log("[ZaLo Sync] All offline actions synced successfully.");
      }
    } catch (e) {
      console.error("[ZaLo Sync] Error flushing offline queue:", e);
    }
  }
}

export const zaloSync = new ZaLoSyncEngine();
window.zaloSync = zaloSync;
