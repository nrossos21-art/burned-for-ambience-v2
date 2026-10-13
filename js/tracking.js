/* Burned for Ambience - advertising & analytics layer
   Loads Meta Pixel, Google tag (GA4 + Google Ads) only after consent,
   captures UTM parameters for Shopify attribution, and exposes
   window.BFA_TRACK(event, data) which app.js calls at every conversion step.

   FILL THESE IN BEFORE LAUNCH (leave blank to disable a platform): */
window.BFA_ADS = {
  metaPixelId: '',              // Meta Events Manager > Data sources > Pixel ID (15–16 digits)
  ga4Id: '',                    // Google Analytics 4 measurement ID, e.g. G-XXXXXXXXXX
  googleAdsId: '',              // Google Ads conversion ID, e.g. AW-XXXXXXXXXX
  googleAdsLabels: {            // Google Ads > Goals > Conversions > tag setup
    add_to_cart: '', begin_checkout: '', generate_lead: '',
  },
  tiktokPixelId: '',            // optional
  currency: 'EUR',
  consentCookieDays: 180,
};

(function () {
  'use strict';
  const A = window.BFA_ADS;
  const KEY = 'bfa_consent';
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch { /* private mode */ } },
  };

  /* ---- UTM capture: keep the first touch for 30 days, pass it to Shopify checkout ---- */
  (function captureUtm() {
    const q = new URLSearchParams(location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid'];
    const found = {};
    keys.forEach(k => { if (q.get(k)) found[k] = q.get(k); });
    if (Object.keys(found).length) {
      found._ts = Date.now();
      try { localStorage.setItem('bfa_utm', JSON.stringify(found)); } catch { /* ignore */ }
    }
  })();
  window.BFA_UTM = function () {
    try {
      const u = JSON.parse(localStorage.getItem('bfa_utm') || 'null');
      if (!u || Date.now() - u._ts > 30 * 864e5) return '';
      const p = new URLSearchParams();
      Object.keys(u).forEach(k => { if (k !== '_ts') p.set(k, u[k]); });
      return p.toString();
    } catch { return ''; }
  };

  /* ---- Loaders (run only after consent) ---- */
  let loaded = false;
  function loadPixels() {
    if (loaded) return; loaded = true;
    if (A.metaPixelId) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', A.metaPixelId);
      window.fbq('track', 'PageView');
    }
    if (A.ga4Id || A.googleAdsId) {
      const id = A.ga4Id || A.googleAdsId;
      const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' });
      if (A.ga4Id) window.gtag('config', A.ga4Id);
      if (A.googleAdsId) window.gtag('config', A.googleAdsId, { allow_enhanced_conversions: true });
    }
    if (A.tiktokPixelId) {
      !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']; ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.load = function (e) { var r = 'https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; var n = d.createElement('script'); n.async = !0; n.src = r + '?sdkid=' + e + '&lib=' + t; var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(n, a); }; ttq.load(A.tiktokPixelId); ttq.page(); }(window, document, 'ttq');
    }
    flush();
  }

  /* ---- Event bridge: one call fans out to every platform ---- */
  const queue = [];
  const META_MAP = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', search: 'Search', generate_lead: 'Lead', view_item_list: null };
  function send(ev, d) {
    d = d || {};
    const items = (d.items || []).map(i => ({ item_id: String(i.id), item_name: i.name, item_category: i.category, item_variant: i.variant, price: i.price, quantity: i.qty || 1 }));
    const value = d.value != null ? Number(d.value.toFixed ? d.value.toFixed(2) : d.value) : undefined;
    if (window.gtag) {
      window.gtag('event', ev, { currency: A.currency, value, items, search_term: d.query, item_list_name: d.list });
      const label = A.googleAdsId && A.googleAdsLabels[ev];
      if (label) window.gtag('event', 'conversion', { send_to: A.googleAdsId + '/' + label, value, currency: A.currency });
    }
    if (window.fbq && META_MAP[ev]) {
      window.fbq('track', META_MAP[ev], {
        content_ids: items.map(i => i.item_id), content_type: 'product', content_name: items[0]?.item_name,
        contents: items.map(i => ({ id: i.item_id, quantity: i.quantity })), value, currency: A.currency, search_string: d.query,
      });
    }
    if (window.ttq && META_MAP[ev]) {
      window.ttq.track(META_MAP[ev] === 'Lead' ? 'SubmitForm' : META_MAP[ev], { contents: items.map(i => ({ content_id: i.item_id, content_name: i.item_name, quantity: i.quantity, price: i.price })), value, currency: A.currency });
    }
  }
  function flush() { while (queue.length) { const [e, d] = queue.shift(); send(e, d); } }
  window.BFA_TRACK = function (ev, d) {
    if (store.get() === 'all' && loaded) send(ev, d); else queue.push([ev, d]);
    if (queue.length > 50) queue.shift();
  };

  /* ---- Consent banner ---- */
  function banner() {
    const choice = store.get();
    if (choice === 'all') { loadPixels(); return; }
    if (choice === 'essential') return;
    const b = document.createElement('div');
    b.className = 'consent'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookies');
    b.innerHTML = `<div class="consent__text"><b>Cookies.</b> Essential ones remember your bag. Ad cookies only if you accept.</div>
      <div class="consent__btns"><button class="btn btn--ghost btn--sm" id="consent-min">Essential only</button><button class="btn btn--primary btn--sm" id="consent-all">Accept all</button></div>`;
    document.body.appendChild(b);
    b.querySelector('#consent-all').onclick = () => { store.set('all'); b.remove(); loadPixels(); };
    b.querySelector('#consent-min').onclick = () => { store.set('essential'); b.remove(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner); else banner();
})();
