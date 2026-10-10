const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.22,.61,.21,1)';

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initReveal();
  initScrollEffects();
  initRoleTabs();
  initStepNav();
  if (window.EORCFigures) EORCFigures.init();
  initContact();
  initCopyButtons();
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

// ---------- scroll-driven effects: hero parallax, [data-zoom] ----------
function initScrollEffects() {
  const hero = document.querySelector('[data-hero-content]');
  const zooms = Array.from(document.querySelectorAll('[data-zoom]'));

  if (REDUCED_MOTION || (!hero && !zooms.length)) return;

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
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
}

// ---------- step progress bar (Technology page): [data-step-nav] ----------
// Index of the last step whose top has scrolled above `line`, or -1 before the
// first step and once the closing CTA is half way up the viewport.
function activeStep(stepTops, endTop, viewportHeight, line = 200) {
  if (endTop < viewportHeight * 0.5) return -1;
  let active = -1;
  stepTops.forEach((top, i) => { if (top < line) active = i; });
  return active;
}

function initStepNav() {
  const nav = document.querySelector('[data-step-nav]');
  const end = document.getElementById('get-started');
  if (!nav || !end) return;

  const links = Array.from(nav.querySelectorAll('a[data-step]'));
  const steps = links.map(a => document.getElementById(a.dataset.step));
  if (steps.some(s => !s)) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const active = activeStep(steps.map(s => s.getBoundingClientRect().top), end.getBoundingClientRect().top, innerHeight);
    nav.classList.toggle('is-visible', active >= 0);
    links.forEach((a, i) => {
      a.classList.toggle('is-active', i === active);
      a.classList.toggle('is-done', i < active);
      if (i === active) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
}

// ---------- tabs: every [role="tablist"] (role selector, example steps) ----------
// Panels ship visible so the copy reads without JavaScript; from here on only
// the selected one is shown.
function initRoleTabs() {
  document.querySelectorAll('[role="tablist"]').forEach(initTabList);
}

// Tabs that carry data-stage (Technology section) also light up the matching
// stage of the pipeline diagram that sits beside them.
function highlightStage(list, activeTab) {
  const scope = list.closest('[data-tech]');
  if (!scope) return;
  scope.querySelectorAll('.tech-stage').forEach(stage => {
    stage.classList.toggle('is-active', stage.dataset.stage === activeTab.dataset.stage);
  });
}

function initTabList(list) {
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));

  const select = i => {
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
      if (panels[k]) panels[k].hidden = k !== i;
    });
    highlightStage(list, tabs[i]);
    list.dispatchEvent(new CustomEvent('tabchange', { detail: { tab: tabs[i] } }));
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', e => {
      const n = tabs.length;
      const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i + n - 1) % n, Home: 0, End: n - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(to);
      tabs[to].focus();
    });
  });

  const wrap = panels[0] && panels[0].parentElement;
  if (wrap) wrap.classList.add('is-stacked');

  select(0);
}

// ---------- contact: intent + role tabs build the email ----------
// The site is static, so "sending" is a mailto link in the visitor's own mail
// client. The subject and body are prefilled from the intent and role chosen, so
// an enquiry arrives with the details we need. The static href in contact.html is
// the no-JavaScript fallback for the default (demo) intent.
const CONTACT_EMAIL = 'info@eorc.uk';

const CONTACT_INTENTS = {
  demo: {
    cta: 'Email us to book a demo',
    subject: 'Demo request — EORC platform',
    fields: ['Your organisation and role', 'The system or portfolio, and the energy carriers involved', "The decision you're facing", 'A preferred time for a call']
  },
  question: {
    cta: 'Email us your question',
    subject: 'Enquiry — EORC',
    fields: ['Your organisation and role', 'Your question']
  }
};

const CONTACT_ROLES = {
  'asset-owner': 'Energy asset owner',
  'system-operator': 'System operator',
  'market-analyst': 'Power market analyst',
  other: 'Something else'
};

// ?intent= picks the tab and ?role= the pill; a role on its own means a demo
// request (the home page role panels link here that way). Unknown values are ignored.
function parseContactParams(search) {
  const q = new URLSearchParams(search);
  const role = Object.hasOwn(CONTACT_ROLES, q.get('role')) ? q.get('role') : null;
  const asked = q.get('intent');
  const intent = Object.hasOwn(CONTACT_INTENTS, asked) ? asked : 'demo';
  return { intent, role };
}

function buildEmail(intentKey, roleKey) {
  const intent = CONTACT_INTENTS[Object.hasOwn(CONTACT_INTENTS, intentKey) ? intentKey : 'demo'];
  const roleLabel = Object.hasOwn(CONTACT_ROLES, roleKey) ? CONTACT_ROLES[roleKey] : null;

  // the role pill already answers half of the first field
  const lines = ['Hi EORC team,', ''];
  if (roleLabel) lines.push('I work as: ' + roleLabel);
  intent.fields.forEach(f => {
    lines.push(roleLabel && f === 'Your organisation and role' ? 'Organisation:' : f + ':');
  });

  const subject = intent.subject;
  const body = lines.join('\r\n');
  const enc = encodeURIComponent;
  // encodeURIComponent rather than URLSearchParams: the latter writes spaces as
  // "+", which only decodes back to a space in form-encoded readers
  return {
    cta: intent.cta,
    mailto: `mailto:${CONTACT_EMAIL}?subject=${enc(subject)}&body=${enc(body)}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(CONTACT_EMAIL)}&su=${enc(subject)}&body=${enc(body)}`,
    outlook: `https://outlook.office.com/mail/deeplink/compose?to=${enc(CONTACT_EMAIL)}&subject=${enc(subject)}&body=${enc(body)}`
  };
}

function initContact() {
  const tabs = Array.from(document.querySelectorAll('[role="tab"][data-intent]'));
  const mailto = document.querySelector('[data-mailto]');
  if (!tabs.length || !mailto) return;

  const params = parseContactParams(location.search);
  const state = { intent: params.intent, role: params.role };
  const pills = Array.from(document.querySelectorAll('[data-role-pick]'));
  const webmail = Array.from(document.querySelectorAll('[data-mail-web]'));

  const render = () => {
    const email = buildEmail(state.intent, state.role);
    mailto.href = email.mailto;
    mailto.textContent = email.cta;
    webmail.forEach(a => { a.href = email[a.dataset.mailWeb]; });
    document.querySelectorAll('[data-for-intent]').forEach(el => {
      el.hidden = el.dataset.forIntent !== state.intent;
    });
    pills.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rolePick === state.role)));
  };

  tabs[0].closest('[role="tablist"]').addEventListener('tabchange', e => {
    state.intent = e.detail.tab.dataset.intent;
    render();
  });

  // clicking the pressed pill again clears the role
  pills.forEach(b => b.addEventListener('click', () => {
    state.role = state.role === b.dataset.rolePick ? null : b.dataset.rolePick;
    render();
  }));

  // role pills and the "nothing opened?" row are hidden until there is JS to drive them
  document.querySelectorAll('[data-roles], [data-mail-fallback]').forEach(el => { el.hidden = false; });

  const initial = tabs.find(t => t.dataset.intent === state.intent);
  if (initial) initial.click(); // selects the tab and renders
  else render();
}

// ---------- copy to clipboard: [data-copy] ----------
function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach(btn => {
    let timer;
    btn.dataset.label = btn.textContent;
    btn.addEventListener('click', async () => {
      const copied = await copyText(btn.dataset.copy);
      // on failure show the address itself, so it can still be selected by hand
      btn.textContent = copied ? 'Copied' : btn.dataset.copy;
      clearTimeout(timer);
      timer = setTimeout(() => { btn.textContent = btn.dataset.label; }, 2000);
    });
  });
}

// navigator.clipboard needs a secure context; fall back to a throwaway selection
// so the button still works over plain http.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed; top:0; opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* nothing else to try */ }
    ta.remove();
    return ok;
  }
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
