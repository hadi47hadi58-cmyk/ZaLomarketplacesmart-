/**
 * ZaLo — real-time in-app notifications (Supabase Realtime only, no Firebase).
 *
 * Listens for new rows in public.notifications addressed to the signed-in user
 * (rows are created automatically by the database triggers on `orders`), then:
 *   - shows a toast at the top of the screen (tap = open the notification center)
 *   - bumps the bell badge (#notif-badge-count) when the page has one
 *   - vibrates briefly / plays a soft chime where the device allows it
 *   - fires a `zalo:notification` DOM event for any page that wants to react
 *
 * Fully self-contained and failure-safe: if anything here throws, the page
 * carries on exactly as before. Realtime respects the table's RLS policy, so a
 * user can only ever receive their own notifications.
 *
 * Note: without a push service this works while the app is open or alive in the
 * background; it cannot wake a fully closed app (an Android OS limitation).
 */
import { supabase } from './supabase-config.js';

(function () {
  if (window.__zaloNotifBoot) return;
  window.__zaloNotifBoot = true;

  let channel = null;
  let currentUid = null;
  let unread = 0;

  function setBadge(n) {
    unread = Math.max(0, n);
    const el = document.getElementById('notif-badge-count');
    if (!el) return;
    if (unread > 0) {
      el.textContent = unread > 99 ? '99+' : String(unread);
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  }

  function ensureStyles() {
    if (document.getElementById('zalo-toast-style')) return;
    const s = document.createElement('style');
    s.id = 'zalo-toast-style';
    s.textContent =
      '#zalo-toast-stack{position:fixed;top:12px;left:12px;right:12px;z-index:2147483000;display:flex;flex-direction:column;gap:8px;pointer-events:none;direction:rtl;padding-top:env(safe-area-inset-top,0px)}' +
      '.zalo-toast{pointer-events:auto;background:#fff;border:1.5px solid #1F8A4C;border-radius:16px;padding:12px 14px;box-shadow:0 12px 30px rgba(15,23,42,.18);font-family:"Cairo",sans-serif;display:flex;gap:10px;align-items:flex-start;transform:translateY(-20px);opacity:0;transition:transform .25s cubic-bezier(.4,0,.2,1),opacity .25s;max-width:480px;width:100%;margin:0 auto;cursor:pointer}' +
      '.zalo-toast.show{transform:translateY(0);opacity:1}' +
      '.zalo-toast .zt-dot{width:8px;height:8px;border-radius:50%;background:#d4af37;margin-top:5px;flex-shrink:0}' +
      '.zalo-toast .zt-title{font-size:13px;font-weight:800;color:#0f172a;margin-bottom:2px}' +
      '.zalo-toast .zt-msg{font-size:12px;font-weight:600;color:#64748b;line-height:1.5}';
    document.head.appendChild(s);
  }

  function chime() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 600);
    } catch (e) { /* autoplay policy / unsupported: silently skip */ }
  }

  function showToast(row) {
    try {
      ensureStyles();
      let stack = document.getElementById('zalo-toast-stack');
      if (!stack) {
        stack = document.createElement('div');
        stack.id = 'zalo-toast-stack';
        document.body.appendChild(stack);
      }
      const toast = document.createElement('div');
      toast.className = 'zalo-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');

      const dot = document.createElement('span');
      dot.className = 'zt-dot';
      const box = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'zt-title';
      title.textContent = row.title || 'إشعار جديد';
      const msg = document.createElement('div');
      msg.className = 'zt-msg';
      msg.textContent = row.message || '';
      box.appendChild(title);
      box.appendChild(msg);
      toast.appendChild(dot);
      toast.appendChild(box);
      stack.appendChild(toast);

      function dismiss() {
        toast.classList.remove('show');
        setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
      }
      toast.addEventListener('click', function () {
        dismiss();
        if (typeof window.openNotificationsModal === 'function') {
          try { window.openNotificationsModal(); } catch (e) {}
        }
      });
      requestAnimationFrame(function () { toast.classList.add('show'); });
      setTimeout(dismiss, 6000);
    } catch (e) { console.warn('[Notifications] toast failed:', e); }
  }

  function onNew(row) {
    if (!row) return;
    setBadge(unread + 1);
    showToast(row);
    chime();
    try { if (navigator.vibrate) navigator.vibrate(80); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('zalo:notification', { detail: row })); } catch (e) {}
  }

  async function resolveUserId(user) {
    const email = (user.email || '').toLowerCase().trim();
    const { data } = await supabase
      .from('users')
      .select('id')
      .or('supabase_uid.eq.' + user.id + ',email.eq.' + email)
      .maybeSingle();
    return data ? data.id : null;
  }

  function stop() {
    if (channel) {
      try { supabase.removeChannel(channel); } catch (e) {}
      channel = null;
    }
    currentUid = null;
  }

  async function start(session) {
    try {
      if (!session || !session.user) return;
      const uid = await resolveUserId(session.user);
      if (!uid || uid === currentUid) return;
      stop();
      currentUid = uid;

      const res = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('is_read', false);
      setBadge(res && res.count ? res.count : 0);

      channel = supabase
        .channel('zalo-notifications-' + uid)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + uid },
          function (payload) { onNew(payload && payload.new); }
        )
        .subscribe();
    } catch (e) {
      console.warn('[Notifications] start failed:', e);
    }
  }

  try {
    supabase.auth.getSession().then(function (r) { start(r && r.data && r.data.session); });
    supabase.auth.onAuthStateChange(function (event, session) {
      // Deferred on purpose: calling other supabase methods synchronously
      // inside this callback can deadlock supabase-js.
      setTimeout(function () {
        if (event === 'SIGNED_OUT') { stop(); setBadge(0); }
        else if (session) { start(session); }
      }, 0);
    });
  } catch (e) {
    console.warn('[Notifications] init failed:', e);
  }
})();
