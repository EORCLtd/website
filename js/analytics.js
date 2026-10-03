/**
 * EORC — analytics (PostHog Cloud EU)
 * ---------------------------------------------------------------
 * Page views, clicks, scroll depth, heatmaps and session replay,
 * plus a few named events for the things that matter (see README.md).
 * No cookies: the visit id lives in sessionStorage and is gone when
 * the tab closes.
 *
 * Runs only on the production host, so local previews and the
 * github.io URL stay out of the data; append ?ph_debug=1 to any URL
 * to force it on while testing.
 * ---------------------------------------------------------------
 */
(() => {
  // Project API key from PostHog → Settings → Project. Public and write-only,
  // so it is fine in the repo.
  const POSTHOG_KEY = 'phc_rFVNbCqPMxm9r7bcAmKbusx2Ui9NevsdtdJ8nggzVMr2';
  const POSTHOG_HOST = 'https://eu.i.posthog.com';
  const LIVE_HOSTS = ['eorc.uk', 'www.eorc.uk'];

  const debug = new URLSearchParams(location.search).has('ph_debug');
  if (POSTHOG_KEY.includes('REPLACE')) return;
  if (!debug && !LIVE_HOSTS.includes(location.hostname)) return;

  // Official PostHog loader snippet, unmodified (posthog.com/docs/libraries/js)
  !function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.crossOrigin = "anonymous", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], Object.defineProperty(u, "toString", { configurable: !0, enumerable: !0, writable: !0, value: function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e } }), Object.defineProperty(u.people, "toString", { configurable: !0, enumerable: !0, writable: !0, value: function () { return u.toString(1) + ".people (stub)" } }), o = "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: '2026-05-30',
    // sessionStorage rather than memory: this is a multi-page site, and an
    // in-memory id would start a new visitor on every page navigation
    persistence: 'sessionStorage',
    person_profiles: 'identified_only',
    autocapture: true,
    enable_heatmaps: true,
    session_recording: { maskAllInputs: true }
  });
  if (debug) posthog.debug();

  // A role-panel CTA lands on contact.html?role=…; keep the role for the rest of
  // the visit so contact_intent carries it too.
  const role = new URLSearchParams(location.search).get('role');
  if (role) posthog.register_for_session({ role });

  // ---------- named events ----------
  // Keyed on attributes the markup already carries, so main.js and figures.js
  // need no knowledge of analytics.
  const track = (event, props) => {
    try { posthog.capture(event, props); } catch { /* never break the page */ }
  };

  const text = el => el.textContent.trim().replace(/\s+/g, ' ');

  const ctaLocation = a =>
    a.closest('.site-header') ? 'nav' :
      a.closest('footer') ? 'footer' :
        a.closest('.role-panel') ? 'role-panel' :
          a.closest('[data-hero-content]') ? 'hero' : 'section';

  document.addEventListener('click', e => {
    const el = e.target.closest('a, button');
    if (!el) return;

    // the conversion: there is no form, reaching the mailbox is the goal
    if (el.matches('[data-mailto]')) return track('contact_intent', { method: 'mailto' });
    if (el.matches('[data-mail-web]')) return track('contact_intent', { method: el.dataset.mailWeb });
    if (el.matches('[data-copy]')) return track('contact_intent', { method: 'copy' });

    if (el.matches('[role="tab"]')) {
      const name = el.querySelector('.role-name');
      return track('role_tab_selected', { role: text(name || el) });
    }

    const controls = el.closest('[data-net-controls], [data-horizon-controls]');
    if (controls) {
      return track('figure_control_used', {
        figure: controls.closest('[data-fig]')?.dataset.fig,
        value: el.dataset.value
      });
    }

    if (el.matches('a[href*="contact.html"]')) {
      track('demo_cta_clicked', {
        location: ctaLocation(el),
        label: text(el),
        role: el.closest('[data-role]')?.dataset.role
      });
    }
  });
})();
