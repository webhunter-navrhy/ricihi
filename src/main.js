/* Pivnice U Ričího – interakce (bez knihoven, nativní scroll) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* hlavička */
  const hdr = $('.hdr');
  const onScroll = () => hdr.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mobilní menu */
  const burger = $('.burger'), mnav = $('.mnav');
  const setMenu = open => { burger.setAttribute('aria-expanded', open); mnav.classList.toggle('is-open', open); mnav.setAttribute('aria-hidden', !open); document.body.style.overflow = open ? 'hidden' : ''; };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* rozdělení h1 na slova */
  $$('[data-split]').forEach(h => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(' '); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = t;
            inner.style.transitionDelay = (0.12 + i++ * 0.08) + 's';
            w.append(inner); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(h);
  });

  /* reveal přes IntersectionObserver */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    if (el.classList.contains('pop')) {
      const sibs = $$('.pop', el.parentElement);
      el.style.transitionDelay = (sibs.indexOf(el) % 3) * 0.12 + Math.random() * 0.15 + 's';
    }
    (el._clip || el).classList.add('in'); io.unobserve(el);
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.rv, .pop, [data-split]').forEach(el => io.observe(el));
  /* clip-path skryje prvek i pro IntersectionObserver – sledujeme proto rodiče */
  $$('.clip, .clip-x').forEach(el => { el.parentElement._clip = el; io.observe(el.parentElement); });

  /* počítadla */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0;
    const from = el.hasAttribute('data-plain') ? to - 12 : 0;
    const fmt = v => dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toString();
    if (reduce) { el.textContent = fmt(to); cio.unobserve(el); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * k);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick); cio.unobserve(el);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* sklenice se při scrollu natáčí */
  const glass = $('.glass'), fill = $('.g-fill');
  if (glass && fill) {
    let ticking = false;
    const pour = () => {
      ticking = false;
      const r = glass.getBoundingClientRect(), vh = innerHeight;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.75)));
      fill.style.setProperty('--fill', (150 - p * 136).toFixed(1) + 'px');
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(pour); } };
    const gio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { addEventListener('scroll', req, { passive: true }); req(); }
      else removeEventListener('scroll', req);
    }));
    gio.observe(glass);
    if (reduce) fill.style.setProperty('--fill', '14px');
  }

  /* magnetická tlačítka */
  if (matchMedia('(hover:hover)').matches && !reduce) {
    $$('.mag').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
  }

  /* otevírací doba – dnešek a stav (čas Prahy) */
  const H = window.HOURS || [];
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const di = (now.getDay() + 6) % 7, mins = now.getHours() * 60 + now.getMinutes();
  const toM = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const row = $(`.hours tr[data-day="${di}"]`); if (row) row.classList.add('today');
  const st = $('[data-status]'), today = H[di];
  if (today) {
    const o = toM(today.o), c = toM(today.c) || 1440, prev = H[(di + 6) % 7];
    const pc = prev ? toM(prev.c) : 0;
    const open = (mins >= o && mins < c) || (pc > 0 && pc < 360 && mins < pc);
    const td = $('[data-today]'); if (td) td.textContent = `${today.d} ${today.o}–${today.c}`;
    if (st) {
      st.classList.toggle('is-open', open);
      st.querySelector('b').textContent = open ? `Otevřeno do ${today.c}` : (mins < o ? `Zavřeno · otevíráme v ${today.o}` : `Zavřeno · zítra od ${H[(di + 1) % 7].o}`);
    }
  }

  /* ukázkový formulář */
  const form = $('form[data-demo]');
  if (form) {
    const d = form.querySelector('[name=datum]');
    if (d) { const t = new Date(); d.min = t.toISOString().slice(0, 10); t.setDate(t.getDate() + ((10 - t.getDay()) % 7 || 7)); /* nejbližší středa (kvíz) */ d.value = t.toISOString().slice(0, 10); }
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach(i => { const bad = !i.value.trim(); i.closest('.fl').classList.toggle('err', bad); if (bad) ok = false; });
      if (!ok) return;
      const msg = $('.form-ok', form); msg.hidden = false; msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* mapa */
  const initMap = () => {
    const el = $('#map'); if (!el || !window.L) return;
    const map = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(window.GEO, 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    const icon = L.divIcon({ className: '', html: '<div class="pin"><span>R</span></div>', iconSize: [46, 46], iconAnchor: [4, 50] });
    L.marker(window.GEO, { icon, title: 'Pivnice U Ričího' }).addTo(map);
  };
  const mio = new IntersectionObserver(es => { if (es[0].isIntersecting) { mio.disconnect(); const go = () => window.L ? initMap() : setTimeout(go, 200); go(); } }, { rootMargin: '400px' });
  const mapEl = $('#map'); if (mapEl) mio.observe(mapEl);
})();
