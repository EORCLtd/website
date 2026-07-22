const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.22,.61,.21,1)';

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initReveal();
  initScrollEffects();
  initFanCanvas();
  document.querySelectorAll('form[data-form-type]').forEach(initForm);
});

// ---------- mobile nav ----------
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(links.classList.contains('open')));
  });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}

// ---------- reveal on scroll: [data-rv] / [data-rvd] ----------
function initReveal() {
  const els = Array.from(document.querySelectorAll('[data-rv]'));
  if (!els.length) return;

  if (REDUCED_MOTION || !('IntersectionObserver' in window)) return; // content stays visible

  els.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(26px)';
    el.style.transition = `opacity .9s ${EASE}, transform .9s ${EASE}`;
    el.style.transitionDelay = (el.getAttribute('data-rvd') || '0') + 'ms';
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'none';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  els.forEach(el => io.observe(el));
}

// ---------- scroll-driven effects: hero parallax, [data-zoom], [data-words] ----------
function initScrollEffects() {
  const hero = document.querySelector('[data-hero-content]');
  const zooms = Array.from(document.querySelectorAll('[data-zoom]'));
  const words = document.querySelector('[data-words]');

  if (REDUCED_MOTION || (!hero && !zooms.length && !words)) return;

  // split the "What we do" paragraph into word spans for the sticky highlight
  let spans = [];
  let wordsWrap = null;
  if (words) {
    const parts = words.textContent.trim().split(/\s+/);
    words.textContent = '';
    spans = parts.map(w => {
      const s = document.createElement('span');
      s.textContent = w + ' ';
      s.style.transition = 'color .3s ease';
      s.style.color = 'rgba(242,244,246,0.22)';
      words.appendChild(s);
      return s;
    });
    wordsWrap = words.closest('section');
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight, y = scrollY;

    if (hero) {
      const k = Math.min(1, y / (vh * 0.72));
      hero.style.opacity = String(1 - k * 0.96);
      hero.style.transform = 'translateY(' + (y * 0.3).toFixed(1) + 'px)';
    }

    zooms.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.85)));
      el.style.transform = 'scale(' + (0.92 + 0.08 * p).toFixed(4) + ') translateY(' + ((1 - p) * 26).toFixed(1) + 'px)';
    });

    if (spans.length && wordsWrap) {
      const r = wordsWrap.getBoundingClientRect();
      const total = r.height - vh;
      const p = Math.max(0, Math.min(1, (-r.top + vh * 0.18) / (total > 0 ? total : 1)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => { s.style.color = i < n ? '#f2f4f6' : 'rgba(242,244,246,0.22)'; });
    }
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
}

// ---------- hero canvas: fan of futures (home only) ----------
function initFanCanvas() {
  const cv = document.querySelector('[data-fan]');
  if (!cv || REDUCED_MOTION) return;

  const ctx = cv.getContext('2d');
  const N = 48;
  let w, h;

  const fit = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  fit();
  addEventListener('resize', fit);

  let t = 0;
  const draw = () => {
    t += 0.0045;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < N; i++) {
      const f = N > 1 ? i / (N - 1) : 0;
      const y0 = h * 0.52;
      const y2 = h * (0.1 + 0.8 * f) + Math.sin(t * 2 + i * 0.7) * 14;
      const y1 = y0 + (y2 - y0) * 0.42 + Math.sin(t * 3 + i * 1.3) * 30;
      ctx.beginPath();
      ctx.moveTo(-40, y0);
      ctx.quadraticCurveTo(w * 0.48, y1, w + 40, y2);
      ctx.strokeStyle = 'oklch(78% 0.13 ' + (160 + f * 75).toFixed(0) + ' / ' +
        (0.05 + 0.09 * Math.abs(Math.sin(t + i * 0.5))).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  };
  draw();
}

// ---------- generic form handling ----------
function initForm(form) {
  const formType = form.dataset.formType;
  const statusEl = form.querySelector('.form-status');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // honeypot anti-spam field (kept visually hidden in the markup)
    if (form.querySelector('input[name="website"]')?.value) {
      return; // silently drop — likely a bot
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // handle repeated fields (e.g. multiple checked checkboxes with the
    // same "name") as arrays instead of collapsing them to the last value
    const formData = new FormData(form);
    const data = {};
    for (const key of new Set(formData.keys())) {
      const values = formData.getAll(key);
      data[key] = values.length > 1 ? values : values[0];
    }
    delete data.website;

    setStatus(statusEl, '', null);
    setLoading(submitBtn, true);

    try {
      await EmailService.send(formType, data);
      showSuccess(form, statusEl);
      form.reset();
    } catch (err) {
      setStatus(statusEl, err.message || 'Something went wrong. Please try again later.', 'err');
    } finally {
      setLoading(submitBtn, false);
    }
  });
}

// Swap the form for the "Request received" panel when present,
// otherwise fall back to an inline status message.
function showSuccess(form, statusEl) {
  const card = form.closest('[data-form-card]');
  const successPanel = card && card.querySelector('[data-form-success]');
  if (successPanel) {
    form.hidden = true;
    successPanel.hidden = false;
  } else {
    setStatus(statusEl, 'Message sent. We’ll get back to you shortly.', 'ok');
  }
}

function setStatus(el, message, type) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('ok', 'err', 'show');
  if (type) el.classList.add(type, 'show');
}

function setLoading(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.dataset.label = btn.dataset.label || btn.textContent;
  btn.textContent = isLoading ? 'Sending…' : btn.dataset.label;
}
