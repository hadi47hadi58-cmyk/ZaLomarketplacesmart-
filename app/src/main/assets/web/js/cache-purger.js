// ZaLo Marketplace Smart Sync Update: 2026-07-16
// ZaLo Smart Marketplace - Client-Side Cache Purger & Auto-Updater (cache-purger.js)
// Implements a self-healing version check to eliminate ghost sessions and cached HTML/JS lag.

(function() {
  const LOCAL_VERSION_KEY = 'zalo_app_version';

  // 1. Fetch current version from server with cache-busting to prevent stale responses
  async function checkForUpdates() {
    try {
      const response = await fetch(`./version.json?cb=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) return;

      const data = await response.json();
      const serverVersion = data.version;
      const clientVersion = localStorage.getItem(LOCAL_VERSION_KEY);

      if (clientVersion && clientVersion !== serverVersion) {
        console.warn(`[Auto-Updater] Version mismatch detected! Server: ${serverVersion}, Client: ${clientVersion}. Triggering self-healing purge...`);
        await performHardPurge(serverVersion);
      } else if (!clientVersion) {
        // First run initialization
        localStorage.setItem(LOCAL_VERSION_KEY, serverVersion);
        console.log(`[Auto-Updater] Initialized application version to: ${serverVersion}`);
      }
    } catch (err) {
      console.error("[Auto-Updater] Error checking for version updates:", err);
    }
  }

  // 2. Perform extreme browser cache cleansing and force-reload
  async function performHardPurge(newVersion) {
    try {
      // Clear Cache Storage API caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => {
            console.log(`[Auto-Updater] Purging Cache Storage cache: ${name}`);
            return caches.delete(name);
          })
        );
      }

      // Unregister all Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(reg => {
            console.log(`[Auto-Updater] Unregistering Service Worker`);
            return reg.unregister();
          })
        );
      }

      // Clear sessionStorage to discard lingering ghost UI states
      sessionStorage.clear();

      // Update stored version
      localStorage.setItem(LOCAL_VERSION_KEY, newVersion);

      // Force refresh with cache-bypass
      console.log(`[Auto-Updater] Hard purging complete. Refreshing UI now...`);
      
      // Add a query param to reload to bypass proxy caches if any
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('u_cb', Date.now());
      window.location.replace(currentUrl.href);
    } catch (purgeErr) {
      console.error("[Auto-Updater] Hard purge failed: ", purgeErr);
      window.location.reload();
    }
  }

  // 3. Register Service Worker on modern browsers safely
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(registration => {
            console.log('[Service Worker] Registered successfully with scope:', registration.scope);
            
            // Check for updates periodically
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[Service Worker] New content is available; please refresh.');
                  }
                });
              }
            });
          })
          .catch(error => {
            console.error('[Service Worker] Registration failed:', error);
          });
      });
    }
  }

  // Execute
  checkForUpdates().then(() => {
    registerServiceWorker();
  });
})();
