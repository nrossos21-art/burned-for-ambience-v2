/* Burned for Ambience - storefront app
   Vanilla JS. Reads window.PRODUCTS (js/products.js), renders shared chrome,
   cart, search, scent finder and the page-level views. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG - edit these before launch
     ------------------------------------------------------------------ */
  const CONFIG = {
    shopDomain: 'https://burnedforambience.com',   // live Shopify store (checkout bridge)
    freeShippingThreshold: 60,                     // € - PLACEHOLDER, confirm your real policy
    welcomeCode: 'WELCOME10',                      // PLACEHOLDER, create in Shopify > Discounts
    phone: '+357 99 465 986',
    hours: 'Mon–Fri, 9:00–17:00 (Cyprus time)',
    instagram: 'https://www.instagram.com/w.burnedforambience/',
    facebook: 'https://www.facebook.com/wburnedforambience',
    announcements: [
      'Free delivery across Cyprus on orders over <b>€60</b>',
      'Refillable by design. Original refills from <b>€14</b>',
      'Handmade charms arrive <b>boxed and gift-wrapped</b>',
    ],
  };

  const P = window.PRODUCTS || [];
  const byHandle = Object.fromEntries(P.map(p => [p.handle, p]));
  const eur = n => '€' + Number(n).toFixed(2).replace('.', ',');
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };

  const CATS = {
    candles:   { name: 'Candles',        tag: 'Original, Classic, Exclusive', img: 'assets/img/original-violet-0.jpg' },
    diffusers: { name: 'Diffusers',      tag: 'Reed diffusers & sprays',      img: 'assets/img/diffusers-200ml-0.jpg' },
    refills:   { name: 'Refills',        tag: 'Candle & diffuser',            img: 'assets/img/waks-original-refills-0.png' },
    charms:    { name: 'Charms',         tag: 'Handmade, gift-boxed',         img: 'assets/img/linen-hand-stiched-charms-0.jpg' },
    gifts:     { name: 'Gifts',          tag: 'Sets & editions',              img: 'assets/img/xmas-2025-collection-gold-4-wicks-candles-0.jpg' },
    soaps:     { name: 'Soaps',          tag: 'Snob Duck',                    img: 'assets/img/coconut-0.jpg' },
  };
  const GIFT_HANDLES = ['nature-set-of-three-candles', 'santorini-porcelain-pots', 'xmas-2025-collection-✨gold-4-wicks-candles', 'xmas-2025-collection-✨silver-4-wicks-candles', 'patchouli-and-pomegranate', 'waks-x-make-a-wish-forest', 'xmas-2025-collection-✨silver-5-wicks-candles'];
  const inCat = (p, cat) => cat === 'all' ? true : cat === 'gifts' ? (GIFT_HANDLES.includes(p.handle) || p.cat === 'charms') : p.cat === cat;

  const ICON = {
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l1 13H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/></svg>',
    leaf: '<svg viewBox="0 0 24 24"><path d="M4 20c0-9 6-15 16-16-1 10-7 16-16 16z"/><path d="M4 20c4-4 7-7 10-10"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M7.5 9C5 9 5 5 7.5 5S12 9 12 9s2-4 4.5-4S19 9 16.5 9"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
    ruler: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="6" rx="1"/><path d="M7 9v3M11 9v2M15 9v3M19 9v2"/></svg>',
    weight: '<svg viewBox="0 0 24 24"><path d="M6 8h12l2 12H4z"/><circle cx="12" cy="5" r="2"/></svg>',
  };

  /* ------------------------------------------------------------------
     Shared chrome
     ------------------------------------------------------------------ */
  const NAV = [
    ['shop.html#candles', 'Candles'], ['shop.html#diffusers', 'Diffusers'], ['shop.html#refills', 'Refills'],
    ['shop.html#charms', 'Charms'], ['shop.html#gifts', 'Gifts'], ['about.html', 'Our story'],
  ];
  function renderHeader() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const host = $('#site-header'); if (!host) return;
    host.innerHTML = `
      <div class="announce" aria-live="polite"><span id="announce-text">${CONFIG.announcements[0]}</span></div>
      <header class="header">
        <div class="wrap header__bar">
          <div class="header__left">
            <button class="icon-btn burger" id="open-menu" aria-label="Open menu">${ICON.menu}</button>
            <a class="logo" href="index.html" aria-label="Burned for Ambience home">
              <img src="assets/logo.png" alt="" width="44" height="44">
              <span class="logo__word">Burned for Ambience<small>Luxury scents · Cyprus</small></span>
            </a>
          </div>
          <nav class="nav" aria-label="Main">
            ${NAV.map(([h, t]) => `<a href="${h}" ${page === h.split('#')[0] && !h.includes('#') ? 'aria-current="page"' : ''}>${t}</a>`).join('')}
          </nav>
          <div class="header__right">
            <button class="icon-btn" id="open-search" aria-label="Search">${ICON.search}</button>
            <button class="icon-btn" id="open-cart" aria-label="Open bag">${ICON.bag}<span class="cart-count" id="cart-count" data-zero>0</span></button>
          </div>
        </div>
      </header>
      <div class="drawer drawer--left" id="menu-drawer" role="dialog" aria-label="Menu">
        <div class="drawer__scrim" data-close></div>
        <div class="drawer__panel">
          <div class="drawer__head"><h3>Menu</h3><button class="icon-btn" data-close aria-label="Close">${ICON.close}</button></div>
          <div class="drawer__body">
            <div class="menu-list">
              ${Object.entries(CATS).map(([k, c]) => `<a href="shop.html#${k}">${c.name}<span>${c.tag}</span></a>`).join('')}
              <a href="shop.html#all">Shop everything</a>
              <a href="about.html">Our story</a>
              <a href="about.html#contact">Contact</a>
            </div>
          </div>
        </div>
      </div>
      <div class="drawer drawer--right" id="cart-drawer" role="dialog" aria-label="Your bag">
        <div class="drawer__scrim" data-close></div>
        <div class="drawer__panel">
          <div class="drawer__head"><h3>Your bag</h3><button class="icon-btn" data-close aria-label="Close">${ICON.close}</button></div>
          <div class="drawer__body" id="cart-body"></div>
          <div class="cart-foot" id="cart-foot"></div>
        </div>
      </div>
      <div class="drawer drawer--right" id="search-drawer" role="dialog" aria-label="Search">
        <div class="drawer__scrim" data-close></div>
        <div class="drawer__panel">
          <div class="drawer__head"><h3>Search</h3><button class="icon-btn" data-close aria-label="Close">${ICON.close}</button></div>
          <div class="drawer__body">
            <div class="search-box">${ICON.search.replace('<svg', '<svg width="20" height="20" style="stroke:currentColor;fill:none;stroke-width:1.6"')}<input id="search-input" type="search" placeholder="Try “amber”, “refill”, “charm”…" autocomplete="off"></div>
            <div class="search-results" id="search-results"></div>
          </div>
        </div>
      </div>
      <div class="toast" id="toast" role="status"></div>`;

    // announcement rotation
    let ai = 0; const at = $('#announce-text');
    if (CONFIG.announcements.length > 1) setInterval(() => {
      at.style.opacity = 0;
      setTimeout(() => { ai = (ai + 1) % CONFIG.announcements.length; at.innerHTML = CONFIG.announcements[ai]; at.style.opacity = 1; }, 400);
    }, 4500);

    $('#open-menu').addEventListener('click', () => openDrawer('menu-drawer'));
    $('#open-cart').addEventListener('click', () => openDrawer('cart-drawer'));
    $('#open-search').addEventListener('click', () => { openDrawer('search-drawer'); setTimeout(() => $('#search-input').focus(), 50); });
    $$('[data-close]').forEach(b => b.addEventListener('click', closeDrawers));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawers(); });
    $('#search-input').addEventListener('input', e => renderSearch(e.target.value));
    renderSearch('');
    renderCart();
  }
  function openDrawer(id) { closeDrawers(); $('#' + id).setAttribute('open', ''); document.body.style.overflow = 'hidden'; }
  function closeDrawers() { $$('.drawer[open]').forEach(d => d.removeAttribute('open')); document.body.style.overflow = ''; }

  function renderFooter() {
    const host = $('#site-footer'); if (!host) return;
    host.innerHTML = `
      <footer class="footer">
        <div class="wrap">
          <div class="footer__grid">
            <div class="footer__brand">
              <a class="logo" href="index.html"><img src="assets/logo.png" alt="" width="44" height="44"><span class="logo__word">Burned for Ambience</span></a>
              <p>A small concept store, open since 2016, for the little bits and pieces that set the atmosphere of your personal space. Waks candles and diffusers, handmade charms, and gifts, delivered across the Republic of Cyprus.</p>
              <p><a href="${CONFIG.instagram}" target="_blank" rel="noopener">Instagram</a> · <a href="${CONFIG.facebook}" target="_blank" rel="noopener">Facebook</a></p>
            </div>
            <div><h4>Shop</h4><ul>
              ${Object.entries(CATS).map(([k, c]) => `<li><a href="shop.html#${k}">${c.name}</a></li>`).join('')}
              <li><a href="shop.html#all">Everything</a></li></ul></div>
            <div><h4>Help</h4><ul>
              <li><a href="about.html#delivery">Delivery (Cyprus only)</a></li>
              <li><a href="about.html#delivery">Returns</a></li>
              <li><a href="about.html#care">Candle care</a></li>
              <li><a href="about.html#contact">Contact</a></li>
              <li><a href="${CONFIG.shopDomain}/account/login" target="_blank" rel="noopener">My account</a></li></ul></div>
            <div><h4>Talk to us</h4><ul>
              <li>${CONFIG.phone}</li>
              <li class="small">${CONFIG.hours}</li>
              <li class="small">We reply within 48 hours.</li></ul></div>
          </div>
          <div class="footer__bottom">
            <span>© ${new Date().getFullYear()} Burned for Ambience · Republic of Cyprus</span>
            <div class="pay"><span>VISA</span><span>Mastercard</span><span>Amex</span><span>Apple Pay</span><span>Google Pay</span><span>PayPal</span><span>Shop Pay</span></div>
          </div>
        </div>
      </footer>`;
  }

  /* ------------------------------------------------------------------
     Cart
     ------------------------------------------------------------------ */
  let cart = (store.get('bfa_cart', []) || []).filter(l => l && byHandle[l.handle]).map(l => ({ handle: l.handle, variantId: Number(l.variantId) || 0, qty: Math.min(20, Math.max(1, Number(l.qty) || 1)) })); // sanitised: storage is user-editable
  const cartSave = () => store.set('bfa_cart', cart);
  const lineInfo = (l) => { const p = byHandle[l.handle]; if (!p) return null; const v = p.variants.find(x => x.id === l.variantId) || p.variants[0]; return { p, v }; };
  const cartSubtotal = () => cart.reduce((s, l) => { const i = lineInfo(l); return i ? s + i.v.price * l.qty : s; }, 0);
  const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);

  function addToCart(handle, variantId, qty = 1) {
    const p = byHandle[handle]; if (!p) return;
    const v = p.variants.find(x => x.id === variantId) || p.variants.find(x => x.available) || p.variants[0];
    if (!v.available) { toast('Sorry, that one is sold out'); return; }
    const line = cart.find(l => l.handle === handle && l.variantId === v.id);
    if (line) line.qty += qty; else cart.push({ handle, variantId: v.id, qty });
    cartSave(); renderCart();
    window.BFA_TRACK && BFA_TRACK('add_to_cart', { value: v.price * qty, items: [{ id: v.id, name: p.name, category: p.cat, variant: v.title, price: v.price, qty }] });
    openDrawer('cart-drawer');
  }
  function setQty(idx, qty) { if (qty <= 0) cart.splice(idx, 1); else cart[idx].qty = qty; cartSave(); renderCart(); }

  function checkoutUrl() {
    // Shopify cart permalink: /cart/{variant}:{qty},{variant}:{qty}
    const parts = cart.map(l => `${l.variantId}:${l.qty}`).join(',');
    const utm = window.BFA_UTM ? BFA_UTM() : '';
    return `${CONFIG.shopDomain}/cart/${parts}${utm ? '?' + utm : ''}`;
  }
  const buyUrl = (vid, q) => { const utm = window.BFA_UTM ? BFA_UTM() : ''; return `${CONFIG.shopDomain}/cart/${vid}:${q}${utm ? '?' + utm : ''}`;
  }

  function renderCart() {
    const count = cartCount();
    const cc = $('#cart-count'); if (cc) { cc.textContent = count; if (count) cc.removeAttribute('data-zero'); else cc.setAttribute('data-zero', ''); }
    const body = $('#cart-body'), foot = $('#cart-foot'); if (!body) return;
    if (!cart.length) {
      body.innerHTML = `<div class="cart-empty">${ICON.bag.replace('<svg', '<svg width="40" height="40" style="stroke:currentColor;fill:none;stroke-width:1.2;opacity:.5"')}<p>Your bag is empty.</p><a class="btn btn--primary" href="shop.html#candles" data-close>Shop candles</a></div>`;
      foot.innerHTML = '';
      $$('[data-close]', body).forEach(b => b.addEventListener('click', closeDrawers));
      return;
    }
    const sub = cartSubtotal();
    const left = Math.max(0, CONFIG.freeShippingThreshold - sub);
    const pct = Math.min(100, Math.round(sub / CONFIG.freeShippingThreshold * 100));
    body.innerHTML = `
      <div class="ship-bar">
        <div>${left > 0 ? `Add <b>${eur(left)}</b> more for free delivery across Cyprus` : `<b>You’ve unlocked free delivery.</b>`}</div>
        <div class="ship-bar__track"><div class="ship-bar__fill" style="width:${pct}%"></div></div>
      </div>
      <div class="cart-lines" style="margin-top:20px">
        ${cart.map((l, i) => { const { p, v } = lineInfo(l); return `
          <div class="cart-line">
            <a class="cart-line__img" href="product.html#${encodeURIComponent(p.handle)}"><img src="${p.images[0] || ''}" alt=""></a>
            <div>
              <div class="cart-line__name">${esc(p.name)}</div>
              <div class="cart-line__meta">${v.title !== 'Default Title' ? esc(v.title) + ' · ' : ''}${eur(v.price)}</div>
              <div class="cart-line__row">
                <div class="qty"><button data-dec="${i}" aria-label="Decrease">−</button><output>${l.qty}</output><button data-inc="${i}" aria-label="Increase">+</button></div>
                <button class="remove" data-rm="${i}">Remove</button>
              </div>
            </div>
          </div>`; }).join('')}
      </div>
      ${renderUpsell()}`;
    foot.innerHTML = `
      <div class="cart-total"><span>Subtotal</span><span>${eur(sub)}</span></div>
      <p class="small muted">Delivery calculated at checkout. Cyprus only.</p>
      <a class="btn btn--primary btn--block" id="checkout-btn" href="${checkoutUrl()}">Checkout securely</a>
      <button class="btn btn--ghost btn--block btn--sm" data-close>Continue shopping</button>`;
    $$('[data-dec]', body).forEach(b => b.onclick = () => setQty(+b.dataset.dec, cart[+b.dataset.dec].qty - 1));
    $$('[data-inc]', body).forEach(b => b.onclick = () => setQty(+b.dataset.inc, cart[+b.dataset.inc].qty + 1));
    $$('[data-rm]', body).forEach(b => b.onclick = () => setQty(+b.dataset.rm, 0));
    $$('[data-add]', body).forEach(b => b.onclick = () => addToCart(b.dataset.add, +b.dataset.variant));
    $$('[data-close]', foot).forEach(b => b.addEventListener('click', closeDrawers));
    $('#checkout-btn', foot).onclick = () => window.BFA_TRACK && BFA_TRACK('begin_checkout', { value: sub, items: cart.map(l => { const i = lineInfo(l); return { id: i.v.id, name: i.p.name, category: i.p.cat, variant: i.v.title, price: i.v.price, qty: l.qty }; }) });
  }
  function renderUpsell() {
    const have = new Set(cart.map(l => l.handle));
    const hasCandle = cart.some(l => byHandle[l.handle]?.sub === 'Original');
    const hasDiffuser = cart.some(l => byHandle[l.handle]?.cat === 'diffusers');
    const picks = [];
    if (hasCandle && !have.has('waks-original-refills')) picks.push(['waks-original-refills', 'Refill the glass you just bought']);
    if (hasDiffuser && !have.has('diffusers-refills-200ml')) picks.push(['diffusers-refills-200ml', 'Keep it scented for months']);
    if (!have.has('room-spray-collection')) picks.push(['room-spray-collection', 'Instant atmosphere, 1,000 sprays']);
    if (!picks.length) return '';
    return `<div class="upsell"><div class="eyebrow">Often added together</div>${picks.slice(0, 2).map(([h, why]) => { const p = byHandle[h]; const v = p.variants.find(x => x.available) || p.variants[0]; return `
      <div class="upsell__item"><img src="${p.images[0]}" alt=""><div><b>${esc(p.name)}</b><small>${why} · ${eur(p.price)}</small></div><button class="btn btn--brass btn--sm" data-add="${h}" data-variant="${v.id}">Add</button></div>`; }).join('')}</div>`;
  }

  let toastT;
  function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

  /* ------------------------------------------------------------------
     Search
     ------------------------------------------------------------------ */
  function renderSearch(q) {
    const host = $('#search-results'); if (!host) return;
    q = q.trim().toLowerCase();
    if (q.length >= 3) { clearTimeout(renderSearch._t); renderSearch._t = setTimeout(() => window.BFA_TRACK && BFA_TRACK('search', { query: q }), 800); }
    let hits;
    if (!q) hits = ['waks-original-refills', 'diffusers-200ml', 'original-violet', 'original-amber', 'linen-hand-stiched-charms'].map(h => byHandle[h]).filter(Boolean);
    else hits = P.filter(p => [p.name, p.sub, p.cat, p.blurb, p.tags.join(' '), p.options.map(o => o.values.join(' ')).join(' ')].join(' ').toLowerCase().includes(q)).slice(0, 12);
    host.innerHTML = (q ? '' : '<div class="eyebrow" style="padding:4px 8px">Popular</div>') + (hits.length ? hits.map(p => `
      <a class="search-hit" href="product.html#${encodeURIComponent(p.handle)}"><img src="${p.images[0] || ''}" alt=""><div><b>${esc(p.name)}</b><small>${esc(p.sub)}</small></div><span class="price">${eur(p.price)}</span></a>`).join('')
      : `<p class="muted" style="padding:12px 8px">Nothing for “${esc(q)}”. Try a scent name like amber or basil.</p>`);
  }

  /* ------------------------------------------------------------------
     Product card
     ------------------------------------------------------------------ */
  function stockLabel(p) {
    if (!p.available) return '<span class="stock stock--out">Sold out</span>';
    if (p.options.length && p.availableCount < p.variants.length) return `<span class="stock stock--low">${p.availableCount} of ${p.variants.length} scents in stock</span>`;
    return '<span class="stock">In stock</span>';
  }
  function cardHTML(p) {
    const single = !p.options.length;
    const v = p.variants.find(x => x.available) || p.variants[0];
    const badge = !p.available ? '<span class="badge badge--out">Sold out</span>' : p.badge ? `<span class="badge ${/best/i.test(p.badge) ? 'badge--brass' : ''}">${esc(p.badge)}</span>` : '';
    const price = p.price === p.priceMax ? eur(p.price) : `<span class="from">from</span> ${eur(p.price)}`;
    const quick = !p.available ? '' : single
      ? `<button class="btn btn--primary btn--sm" data-add="${esc(p.handle)}" data-variant="${v.id}">Add to bag</button>`
      : `<a class="btn btn--primary btn--sm" href="product.html#${encodeURIComponent(p.handle)}">Choose ${esc((p.options[0].name || 'option').toLowerCase())}</a>`;
    return `
      <article class="card">
        <div class="card__visual">
        <a class="card__media ${p.available ? '' : 'card__media--soldout'}" href="product.html#${encodeURIComponent(p.handle)}">
          <img src="${p.images[0] || ''}" alt="${esc(p.name)}" loading="lazy">${badge}
        </a>
        ${quick ? `<div class="card__quick">${quick}</div>` : ''}
        </div>
        <div class="card__body">
          <span class="card__sub">${esc(p.sub)}</span>
          <a class="card__name" href="product.html#${encodeURIComponent(p.handle)}">${esc(p.name)}</a>
          <p class="card__blurb">${esc(p.blurb)}</p>
          <div class="card__price">${price}</div>
          ${stockLabel(p)}
        </div>
      </article>`;
  }
  function mountCards(host, list) {
    host.innerHTML = list.map(cardHTML).join('') || '<div class="empty">Nothing here yet. Try another filter.</div>';
    $$('[data-add]', host).forEach(b => b.addEventListener('click', e => { e.preventDefault(); addToCart(b.dataset.add, +b.dataset.variant); }));
  }

  /* ------------------------------------------------------------------
     Scent finder
     ------------------------------------------------------------------ */
  const MOODS = [
    { key: 'unwind', label: 'Unwind after work', why: 'Soft woods and resins slow the room down.', picks: [['original-sandalwood', 'Creamy, meditative wood'], ['amber-frankincense', 'Resin and incense smoke'], ['nature-set-of-three-candles', 'Geranium and chamomile, essential oils']] },
    { key: 'focus', label: 'Focus & clarity', why: 'Green herbs and citrus keep the air sharp.', picks: [['original-green-tea', 'Torn basil over citrus'], ['original-orange-grove', 'Bright orange peel'], ['waks-nature-candle-refills-1', 'Mint & Eucalyptus refill']] },
    { key: 'cosy', label: 'Cosy night in', why: 'Warm spice and embers, the fireplace effect.', picks: [['original-amber', 'Deep, spicy oriental'], ['original-apple-cinnamon', 'Baked apple and cinnamon'], ['original-oak-fire', 'Smoked oak and leather']] },
    { key: 'fresh', label: 'A fresh, clean home', why: 'Sea air and fig leaf read as “just cleaned”.', picks: [['original-saltwater', 'Sea air and driftwood'], ['original-fig-leaf', 'Green, milky fig'], ['diffusers-200ml', 'Reed diffuser, months of scent']] },
    { key: 'romance', label: 'A romantic evening', why: 'White flowers and oud, heady and warm.', picks: [['original-violet', 'Rose, saffron and oud'], ['original-jasmine', 'Night-blooming jasmine'], ['original-hyacinth', 'A spring garden']] },
    { key: 'gift', label: 'A gift that lasts', why: 'Things that get used, refilled and kept.', picks: [['xmas-2025-collection-✨gold-4-wicks-candles', 'The statement gold pot'], ['linen-hand-stiched-charms', 'Handmade charm, boxed'], ['santorini-porcelain-pots', 'Artist-made porcelain']] },
  ];
  function mountFinder(host) {
    host.innerHTML = `
      <div><span class="eyebrow">Scent finder</span><h2 style="margin-top:10px">What should the room feel like?</h2></div>
      <div class="moods" role="group" aria-label="Pick a mood">${MOODS.map(m => `<button class="mood" data-mood="${m.key}" aria-pressed="false">${m.label}</button>`).join('')}</div>
      <div class="finder__result" id="finder-result"></div>`;
    const show = (key) => {
      $$('.mood', host).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mood === key)));
      const m = MOODS.find(x => x.key === key);
      const r = $('#finder-result', host);
      r.innerHTML = `<p class="why">${m.why}</p><div class="finder__grid">${m.picks.map(([h, why]) => { const p = byHandle[h]; if (!p) return ''; const v = p.variants.find(x => x.available) || p.variants[0]; return `
        <div class="pick"><img src="${p.images[0]}" alt=""><div><b>${esc(p.name)}</b><small>${why} · ${eur(p.price)}</small>
          ${!p.available ? '<span class="stock stock--out">Sold out</span>' : p.options.length ? `<a class="btn btn--ghost" href="product.html#${encodeURIComponent(h)}">Choose scent</a>` : `<button class="btn btn--primary" data-add="${esc(h)}" data-variant="${v.id}">Add to bag</button>`}
        </div></div>`; }).join('')}</div>`;
      $$('[data-add]', r).forEach(b => b.onclick = () => addToCart(b.dataset.add, +b.dataset.variant));
    };
    $$('.mood', host).forEach(b => b.addEventListener('click', () => show(b.dataset.mood)));
    show('cosy');
  }

  /* ------------------------------------------------------------------
     Pages
     ------------------------------------------------------------------ */
  function pageHome() {
    const cats = $('#cats'); if (cats) cats.innerHTML = Object.entries(CATS).map(([k, c]) => `<a class="cat" href="shop.html#${k}"><div class="cat__img"><img src="${c.img}" alt="" loading="lazy"></div><div><b>${c.name}</b><small>${c.tag}</small></div></a>`).join('');
    const best = ['waks-original-refills', 'diffusers-200ml', 'original-violet', 'original-amber', 'original-green-tea', 'xmas-2025-collection-✨gold-4-wicks-candles', 'linen-hand-stiched-charms', 'room-spray-collection'].map(h => byHandle[h]).filter(Boolean);
    const bh = $('#bestsellers'); if (bh) mountCards(bh, best);
    const ch = $('#charm-grid'); if (ch) mountCards(ch, P.filter(p => p.cat === 'charms' && p.available).slice(0, 4));
    const fh = $('#finder'); if (fh) mountFinder(fh);
  }

  function pageShop() {
    const grid = $('#shop-grid'), count = $('#shop-count'), title = $('#shop-title'), sub = $('#shop-sub');
    const state = { cat: (location.hash || '#all').slice(1), inStock: false, sort: 'featured' };
    if (!CATS[state.cat] && state.cat !== 'all') state.cat = 'all';
    const COPY = {
      all: ['Everything', 'Candles, diffusers, refills, handmade charms and soaps. All of it ships across Cyprus.'],
      candles: ['Candles', 'Hand-poured natural wax blends with cotton wicks. The Original line burns for 45 hours and every glass takes a refill.'],
      diffusers: ['Diffusers & sprays', 'Reed diffusers in 100 ml and 200 ml, and water-based room sprays in recyclable aluminium.'],
      refills: ['Refills', 'Lift it, replace it, relight it. Candle refills from €14 and diffuser refills from €20.'],
      charms: ['Handmade charms', 'Cross-stitched linen charms with evil-eye detail, each one unique, boxed and gift-wrapped. The classic bomboniera for weddings and christenings.'],
      gifts: ['Gifts & editions', 'Limited metallic pots, the Santorini porcelain edition, the Nature set and every charm.'],
      soaps: ['Snob Duck soaps', 'Cold-process olive-oil soaps in four scents. The €8 add-on that makes a gift complete.'],
    };
    const counts = Object.fromEntries(['all', ...Object.keys(CATS)].map(k => [k, P.filter(p => inCat(p, k)).length]));
    const sideHost = $('#filters');
    const chipHost = $('#chips');
    const render = () => {
      const [t, s] = COPY[state.cat]; title.textContent = t; sub.textContent = s; document.title = `${t} · Burned for Ambience`;
      let list = P.filter(p => inCat(p, state.cat));
      if (state.inStock) list = list.filter(p => p.available);
      const sorters = {
        featured: (a, b) => (b.available - a.available) || (!!b.badge - !!a.badge) || 0,
        'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price,
        newest: (a, b) => new Date(b.created) - new Date(a.created), name: (a, b) => a.name.localeCompare(b.name),
      };
      list = list.slice().sort(sorters[state.sort]);
      mountCards(grid, list);
      window.BFA_TRACK && BFA_TRACK('view_item_list', { list: t, items: list.slice(0, 10).map(x => ({ id: x.variants[0].id, name: x.name, category: x.cat, price: x.price })) });
      count.textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
      $$('[data-cat]', document).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat)));
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    const catBtns = (cls) => ['all', ...Object.keys(CATS)].map(k => `<button class="${cls}" data-cat="${k}" aria-pressed="false">${k === 'all' ? 'Everything' : CATS[k].name}${cls === 'f' ? `<span>${counts[k]}</span>` : ''}</button>`).join('');
    sideHost.innerHTML = `<div><h4>Collection</h4><ul>${catBtns('f').replace(/<button/g, '<li><button').replace(/<\/button>/g, '</button></li>')}</ul></div>
      <div><h4>Availability</h4><label class="toggle"><input type="checkbox" id="f-stock"> In stock only</label></div>`;
    chipHost.innerHTML = catBtns('chip');
    $$('[data-cat]').forEach(b => b.addEventListener('click', () => { state.cat = b.dataset.cat; history.replaceState(null, '', '#' + state.cat); render(); }));
    $('#f-stock').addEventListener('change', e => { state.inStock = e.target.checked; render(); });
    $('#sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
    window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (CATS[h] || h === 'all') { state.cat = h; render(); } });
    render();
  }

  function pageProduct() {
    const handle = decodeURIComponent((location.hash || '').slice(1));
    const p = byHandle[handle] || byHandle['original-amber'];
    if (!p) return;
    const host = $('#pdp'); if (!host) return;
    document.title = `${p.name} · ${p.sub} · Burned for Ambience`;
    window.BFA_TRACK && BFA_TRACK('view_item', { value: p.price, items: [{ id: p.variants[0].id, name: p.name, category: p.cat, price: p.price }] });
    const ld = document.createElement('script'); ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.blurb, image: p.images.map(i => new URL(i, location.href).href), brand: { '@type': 'Brand', name: 'Waks' }, sku: p.handle, offers: { '@type': 'Offer', priceCurrency: 'EUR', price: p.price, availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: location.href, seller: { '@type': 'Organization', name: 'Burned for Ambience' } } });
    document.head.appendChild(ld);
    let variant = p.variants.find(v => v.available) || p.variants[0];
    let qty = 1;
    const pairFor = () => {
      if (p.sub === 'Original') return ['waks-original-refills', 'Pair it with a refill', 'Keep this glass, change the scent whenever you like.'];
      if (p.sub === 'Nature') return ['waks-nature-candle-refills-1', 'Pair it with a Nature refill', 'Same essential oils, same glass.'];
      if (p.cat === 'diffusers' && p.sub === 'Diffusers') return ['diffusers-refills-200ml', 'Pair it with a refill', 'When the reeds run dry, top up instead of replacing.'];
      if (p.cat === 'refills') return [p.sub === 'Diffuser refills' ? 'diffusers-200ml' : 'original-amber', 'Need the glass too?', 'Start with the full vessel, refill forever.'];
      if (p.cat === 'charms') return ['original-amber', 'Make it a gift set', 'A charm and an Original candle is the classic pairing.'];
      if (p.cat === 'soaps') return ['original-saltwater', 'Complete the bathroom', 'Saltwater candle and a Snob Duck bar.'];
      return ['room-spray-collection', 'Add instant atmosphere', 'Spray before guests arrive.'];
    };
    const care = p.cat === 'candles' || p.cat === 'refills'
      ? 'Trim the wick to 5 mm before every burn. Let the wax pool reach the edge of the glass on the first burn (about two hours) to prevent tunnelling. Never burn for more than four hours at a time, and keep away from drafts.'
      : p.cat === 'diffusers' ? 'Flip the reeds once a week for a fresh release of scent. Keep away from direct sun and heat. Wipe drips immediately; the oils can mark wood.'
      : p.cat === 'charms' ? 'Keep out of direct sun to preserve the colours. Dust gently with a soft brush. Each charm is made by hand, so small variations are part of the piece.'
      : 'Keep the bar dry between uses on a draining soap dish. It will last noticeably longer.';
    const render = () => {
      const specs = [];
      if (p.specs.net) specs.push([ICON.weight, p.specs.net + ' net']);
      if (p.specs.burn) specs.push([ICON.clock, p.specs.burn + ' h burn time']);
      if (p.specs.dims) specs.push([ICON.ruler, p.specs.dims]);
      if (p.specs.wicks) specs.push([ICON.flame, p.specs.wicks + ' wicks']);
      if (p.cat === 'candles') specs.push([ICON.leaf, 'Natural wax blend, cotton wick']);
      if (p.cat === 'refills' || p.sub === 'Original' || p.sub === 'Classic') specs.push([ICON.refresh, 'Refillable']);
      if (p.cat === 'charms') specs.push([ICON.gift, 'Boxed & gift-wrapped']);
      const hasNotes = p.notes.top || p.notes.heart || p.notes.base;
      const [pairH, pairT, pairS] = pairFor(); const pair = byHandle[pairH]; const pv = pair && (pair.variants.find(x => x.available) || pair.variants[0]);
      const related = P.filter(x => x.cat === p.cat && x.handle !== p.handle && x.available).slice(0, 4);
      host.innerHTML = `
        <div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="shop.html#${p.cat}">${CATS[p.cat]?.name || 'Shop'}</a><span>/</span><span>${esc(p.name)}</span></div>
        <div class="pdp">
          <div class="gallery">
            <div class="gallery__main"><img id="g-main" src="${p.images[0] || ''}" alt="${esc(p.name)}">${!p.available ? '<span class="badge badge--out">Sold out</span>' : p.badge ? `<span class="badge badge--brass">${esc(p.badge)}</span>` : ''}</div>
            ${p.images.length > 1 ? `<div class="gallery__thumbs">${p.images.map((src, i) => `<button data-img="${src}" aria-current="${i === 0}"><img src="${src}" alt=""></button>`).join('')}</div>` : ''}
          </div>
          <div class="buy">
            <div class="buy__title">
              <span class="eyebrow">${esc(p.sub)}</span>
              <h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(p.name)}</h1>
              <p class="lede" style="font-size:1.05rem">${esc(p.blurb)}</p>
            </div>
            <div class="buy__price"><span id="price">${eur(variant.price)}</span><small>incl. VAT</small>${p.available ? stockLabel(p) : '<span class="stock stock--out">Sold out</span>'}</div>
            ${p.options.length ? `<div class="variants"><div class="variants__label">${esc(p.options[0].name)} <span id="v-name">${esc(variant.title)}</span></div>
              <div class="swatches">${p.variants.map(v => `<button class="swatch" data-v="${v.id}" aria-pressed="${v.id === variant.id}" ${v.available ? '' : 'data-out'} title="${v.available ? '' : 'Sold out'}">${esc(v.title)}</button>`).join('')}</div></div>` : ''}
            <div class="buy__row">
              <div class="qty qty--lg"><button id="q-dec" aria-label="Decrease">−</button><output id="q-out">${qty}</output><button id="q-inc" aria-label="Increase">+</button></div>
              <button class="btn btn--primary" id="add" ${variant.available ? '' : 'disabled'}>${variant.available ? 'Add to bag' : 'Sold out'}</button>
            </div>
            ${variant.available ? `<a class="btn btn--brass" id="buy-now" href="${buyUrl(variant.id, qty)}">Buy it now</a>` : `<button class="btn btn--ghost" id="notify">Email me when it’s back</button>`}
            <div class="specs">${specs.map(([i, t]) => `<span>${i}${t}</span>`).join('')}</div>
            ${hasNotes ? `<div class="pyramid"><div><small>Top</small><b>${esc(p.notes.top || '—')}</b></div><div><small>Heart</small><b>${esc(p.notes.heart || '—')}</b></div><div><small>Base</small><b>${esc(p.notes.base || '—')}</b></div></div>` : ''}
            ${pair ? `<div class="pair"><img src="${pair.images[0]}" alt=""><div><b>${pairT}</b><small>${pairS}</small><small><strong>${esc(pair.name)}</strong> · ${eur(pair.price)}</small></div>${pair.options.length ? `<a class="btn btn--ghost btn--sm" href="product.html#${encodeURIComponent(pair.handle)}">Choose</a>` : `<button class="btn btn--primary btn--sm" data-add="${esc(pair.handle)}" data-variant="${pv.id}">Add</button>`}</div>` : ''}
            <div class="accordion">
              <details open><summary>Details</summary><div class="acc-body"><p>${esc(p.desc || p.blurb)}</p></div></details>
              <details><summary>Care</summary><div class="acc-body"><p>${care}</p></div></details>
              <details><summary>Delivery & returns</summary><div class="acc-body"><p>We deliver across the Republic of Cyprus only. Delivery cost is shown at checkout; orders over ${eur(CONFIG.freeShippingThreshold)} ship free.</p><p>Changed your mind? Contact us within 14 days of delivery for unused items in original packaging. Call ${CONFIG.phone}, ${CONFIG.hours}.</p></div></details>
            </div>
          </div>
        </div>
        ${related.length ? `<section class="section--tight"><div class="section-head"><div><span class="eyebrow">Keep exploring</span><h2 style="font-size:1.8rem">More ${CATS[p.cat]?.name.toLowerCase() || 'like this'}</h2></div><a class="link-arrow" href="shop.html#${p.cat}">See all →</a></div><div class="grid" id="related"></div></section>` : ''}
        <div class="sticky-buy" id="sticky"><div><b>${eur(variant.price)}</b><br><small class="muted">${esc(p.name)}</small></div><button class="btn btn--primary" id="add-sticky" ${variant.available ? '' : 'disabled'}>${variant.available ? 'Add to bag' : 'Sold out'}</button></div>`;
      $$('[data-img]', host).forEach(b => b.onclick = () => { $('#g-main').src = b.dataset.img; $$('[data-img]', host).forEach(x => x.setAttribute('aria-current', x === b)); });
      $$('.swatch', host).forEach(b => b.onclick = () => {
        variant = p.variants.find(v => v.id === +b.dataset.v);
        $$('.swatch', host).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        $('#v-name').textContent = variant.title;
        $('#price').textContent = eur(variant.price);
        [$('#add'), $('#add-sticky')].forEach(x => { x.disabled = !variant.available; x.textContent = variant.available ? 'Add to bag' : 'Sold out'; });
        $('#sticky b').textContent = eur(variant.price);
        const bn = $('#buy-now'); if (bn) { bn.href = buyUrl(variant.id, qty); bn.hidden = !variant.available; }
      });
      $('#q-dec').onclick = () => { qty = Math.max(1, qty - 1); $('#q-out').textContent = qty; const bn = $('#buy-now'); if (bn) bn.href = buyUrl(variant.id, qty); };
      $('#q-inc').onclick = () => { qty = Math.min(20, qty + 1); $('#q-out').textContent = qty; const bn = $('#buy-now'); if (bn) bn.href = buyUrl(variant.id, qty); };
      $('#add').onclick = () => addToCart(p.handle, variant.id, qty);
      $('#add-sticky').onclick = () => addToCart(p.handle, variant.id, qty);
      const nb = $('#notify'); if (nb) nb.onclick = () => { nb.textContent = 'Noted. Connect a back-in-stock app on Shopify to make this live.'; nb.disabled = true; };
      $$('[data-add]', host).forEach(b => b.onclick = () => addToCart(b.dataset.add, +b.dataset.variant));
      const rel = $('#related'); if (rel) mountCards(rel, related);
      // sticky bar appears once the main CTA scrolls away
      const sticky = $('#sticky'), addBtn = $('#add');
      if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => sticky.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 }).observe(addBtn);
    };
    render();
    window.addEventListener('hashchange', () => location.reload());
  }

  function pageAbout() {
    const f = $('#contact-form'); if (!f) return;
    f.addEventListener('submit', e => { e.preventDefault(); f.innerHTML = `<p style="font-size:1.1rem"><b>Thank you.</b> We reply within 48 hours. For anything urgent call ${CONFIG.phone}, ${CONFIG.hours}.</p><p class="small muted" style="margin-top:8px">Connect this form to Shopify’s contact form or Klaviyo before launch.</p>`; });
  }

  /* ------------------------------------------------------------------
     Newsletter + reveal + boot
     ------------------------------------------------------------------ */
  function bindNewsletter() {
    const f = $('#news-form'); if (!f) return;
    f.addEventListener('submit', e => {
      e.preventDefault();
      window.BFA_TRACK && BFA_TRACK('generate_lead', { value: 0 });
      f.innerHTML = `<div class="ok"><b>You’re in.</b><span>Use this at checkout for 10% off your first order:</span><code>${CONFIG.welcomeCode}</code><span class="small muted">Connect to Shopify Email or Klaviyo before launch so the code is sent automatically.</span></div>`;
    });
  }
  function reveal() {
    if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(x => x.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(x => io.observe(x));
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderHeader(); renderFooter(); bindNewsletter();
    const page = document.body.dataset.page || 'home';
    if (page === 'home') pageHome();
    if (page === 'shop') pageShop();
    if (page === 'product') pageProduct();
    if (page === 'about') pageAbout();
    reveal();
  });

  window.BFA = { addToCart, CONFIG, PRODUCTS: P };
})();
