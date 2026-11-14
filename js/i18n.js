/**
 * EORC — translations
 * ---------------------------------------------------------------
 * All copy lives in lang/<code>.json (flat "key": "text" objects) and is
 * written into the page from here. The markup only carries the keys:
 *
 *   data-i18n="key"                  sets textContent
 *   data-i18n-html="key"             sets innerHTML (inline <strong>/<span> only)
 *   data-i18n-attr="attr:key;..."    sets attributes (aria-label, alt, content)
 *
 * Language: ?lang=xx, then localStorage "eorc-lang", then <html lang>, then
 * "en". English is always loaded first, so a language that is only partly
 * translated falls back to English key by key.
 *
 * To add a language, copy lang/en.json to lang/<code>.json, translate the
 * values (keep the keys, set "lang.name" to the language's own name) and add
 * its code to lang/languages.json: the nav selector is built from that list.
 *
 * Load this in <head>: it hides the page until the text is in, so visitors
 * never see the empty skeleton. Other scripts wait on I18N.ready.
 * ---------------------------------------------------------------
 */
(() => {
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'eorc-lang';
  const LOADING_CLASS = 'i18n-loading';

  const root = document.documentElement;
  root.classList.add(LOADING_CLASS);

  const valid = code => typeof code === 'string' && /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(code);

  function pickLanguage() {
    const asked = new URLSearchParams(location.search).get('lang');
    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
    const code = [asked, stored, root.lang].find(valid);
    return code ? code.toLowerCase() : DEFAULT_LANG;
  }

  async function load(code) {
    const res = await fetch(`lang/${code}.json`);
    if (!res.ok) throw new Error(`lang/${code}.json: ${res.status}`);
    return res.json();
  }

  let strings = {};
  let lang = DEFAULT_LANG;

  function t(key) {
    if (Object.hasOwn(strings, key)) return strings[key];
    console.warn(`i18n: missing key "${key}"`);
    return key;
  }

  function apply(scope = document) {
    scope.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    scope.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    scope.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(';').forEach(pair => {
        const i = pair.indexOf(':');
        el.setAttribute(pair.slice(0, i), t(pair.slice(i + 1)));
      });
    });
  }

  const domReady = document.readyState === 'loading'
    ? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
    : Promise.resolve();

  const ready = (async () => {
    lang = pickLanguage();
    try {
      strings = await load(DEFAULT_LANG);
      if (lang !== DEFAULT_LANG) {
        try { strings = { ...strings, ...(await load(lang)) }; } catch (err) {
          console.warn(err.message, '- using English');
          lang = DEFAULT_LANG;
        }
      }
      await domReady;
      root.lang = lang;
      apply();
    } catch (err) {
      console.error('i18n: could not load translations', err);
    } finally {
      await domReady;
      root.classList.remove(LOADING_CLASS);
    }
  })();

  // ---------- language selector: <li data-lang-switch> in the nav ----------
  function setLanguage(code) {
    try { localStorage.setItem(STORAGE_KEY, code); } catch { /* storage blocked: fall back to ?lang= */ }
    const url = new URL(location.href);
    url.searchParams.set('lang', code);
    location.href = url.href; // reload: widgets that build text at start-up re-run in the new language
  }

  async function listLanguages() {
    const res = await fetch('lang/languages.json');
    if (!res.ok) throw new Error(`lang/languages.json: ${res.status}`);
    const codes = (await res.json()).filter(valid);
    const named = await Promise.all(codes.map(async code => {
      try { return { code, name: (await load(code))['lang.name'] || code }; } catch { return null; }
    }));
    return named.filter(Boolean);
  }

  async function initSwitcher() {
    const host = document.querySelector('[data-lang-switch]');
    if (!host) return;
    const languages = await listLanguages();
    if (languages.length < 2) return;

    const select = document.createElement('select');
    select.setAttribute('aria-label', t('nav.language.aria-label'));
    languages.forEach(({ code, name }) => {
      const option = new Option(name, code, false, code === lang);
      option.lang = code;
      select.add(option);
    });
    select.addEventListener('change', () => setLanguage(select.value));
    host.replaceChildren(select);
    host.hidden = false;
  }

  // the selector is an extra: any failure leaves the page as it is
  const languagesReady = ready.then(initSwitcher).catch(err => console.warn('i18n: language selector unavailable', err));

  window.I18N = { t, apply, ready, languagesReady, setLanguage, get lang() { return lang; } };
})();
