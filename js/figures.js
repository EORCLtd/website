/* ==========================================================================
   EORC — generated figures
   Geometry ported from Claude Design project b13591e8 ("EORC Homepage").

   The drawn figures are decorative: headings, body copy, bullet lists,
   captions and legends all live in the static markup, so a visitor without
   JavaScript loses the diagrams but no information. Interactive controls are
   marked [hidden] in the markup and un-hidden here, so they never appear dead.

   The benchmark bar charts and the platform workflow are the exception: they
   are real content, built entirely in markup and CSS, and this file only
   plays their entrance.

   Each init returns early when its host element is absent, so all pages can
   load this file.
   ========================================================================== */

window.EORCFigures = (function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- small DOM helpers ----------

  function node(name, attrs) {
    const el = document.createElementNS(NS, name);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function fill(parent, children) {
    parent.textContent = '';
    children.forEach(c => parent.appendChild(c));
  }

  // Reveal a control row that was [hidden] for the no-JS case.
  function enable(host, selector) {
    const row = host.querySelector(selector);
    if (row) row.hidden = false;
    return row;
  }

  // Wire a group of [data-value] buttons as a single-choice control.
  function segmented(host, selector, initial, onPick) {
    const row = enable(host, selector);
    if (!row) return;
    const buttons = Array.from(row.querySelectorAll('button[data-value]'));
    const select = value => {
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
      onPick(value);
    };
    buttons.forEach(b => b.addEventListener('click', () => select(b.dataset.value)));
    select(initial);
  }

  // ---------- shared plotting ----------

  // Sample f over [x0,x1] into an SVG path, y measured up from y0 across span.
  function line(f, x0, x1, steps, y0, span) {
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + t * (x1 - x0);
      const y = y0 - f(t) * span;
      d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d;
  }

  // ==========================================================================
  // Hero — fan of futures
  // ==========================================================================

  // Outer envelope of the scenario fan, as a closed polygon point list.
  function fanBand(spread) {
    const up = [], lo = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const x = 300 + t * 296;
      const h = (spread / 100) * 100 * Math.pow(t, 1.3);
      up.push(x.toFixed(1) + ',' + (125 - h - 4 * Math.sin(t * 3)).toFixed(1));
      lo.push(x.toFixed(1) + ',' + (125 + h * 0.9 + 4 * Math.sin(t * 2)).toFixed(1));
    }
    return up.join(' ') + ' ' + lo.reverse().join(' ');
  }

  // One scenario trajectory, k of n, fanning out from the "today" marker.
  function fanLine(k, n, spread) {
    const dir = (k - (n - 1) / 2) / ((n - 1) / 2);
    let d = '';
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      const x = 300 + t * 296;
      const drift = dir * (spread / 100) * 88 * Math.pow(t, 1.35);
      const noise = 6 * Math.sin(t * 9 + k * 2.1) * t;
      d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + (125 - drift + noise).toFixed(1);
    }
    return d;
  }

  // Wiggle measured back from "today", so it vanishes at u = 1 and the series
  // ends exactly on the marker (300,125) where the scenario fan starts.
  const FAN_HISTORY = line(
    u => 0.5 + 0.075 * Math.sin((1 - u) * 7) + 0.05 * Math.sin((1 - u) * 13),
    6, 300, 44, 190, 130
  );

  function initFanChart() {
    const host = document.querySelector('[data-fig="fan"]');
    if (!host) return;

    const band = host.querySelector('[data-fan-band]');
    const lines = host.querySelector('[data-fan-lines]');
    const history = host.querySelector('[data-fan-history]');
    const label = host.querySelector('[data-fan-label]');
    if (!band || !lines || !history) return;

    history.setAttribute('d', FAN_HISTORY);

    const draw = spread => {
      band.setAttribute('points', fanBand(spread));
      fill(lines, [0, 1, 2, 3, 4, 5, 6].map(k => node('path', {
        d: fanLine(k, 7, spread),
        fill: 'none',
        stroke: 'oklch(0.78 0.14 170 / .45)',
        'stroke-width': '1.3'
      })));
      if (label) label.textContent = spread < 30 ? 'narrow' : spread < 70 ? 'moderate' : 'wide';
    };

    enable(host, '[data-fan-controls]');
    const input = host.querySelector('[data-fan-range]');
    if (input) input.addEventListener('input', () => draw(Number(input.value)));
    draw(input ? Number(input.value) : 45);
  }

  // ==========================================================================
  // Technology 01 — pan-European network
  // ==========================================================================

  // [name, lat, lon, weight, carriers] — real coordinates, schematic topology.
  const CITIES = [
    ['Lisbon', 38.72, -9.14, 2, 'e'], ['Madrid', 40.42, -3.7, 3, 'eg'], ['Barcelona', 41.39, 2.17, 2, 'e'],
    ['Bilbao', 43.26, -2.93, 1, 'eh'], ['Bordeaux', 44.84, -0.58, 1, 'e'], ['Paris', 48.86, 2.35, 3, 'eh'],
    ['Lyon', 45.76, 4.84, 2, 'e'], ['Marseille', 43.3, 5.37, 2, 'eg'], ['Milan', 45.46, 9.19, 2, 'eg'],
    ['Rome', 41.9, 12.5, 2, 'e'], ['Naples', 40.85, 14.27, 1, 'eg'], ['Zurich', 47.38, 8.54, 1, 'e'],
    ['Munich', 48.14, 11.58, 2, 'eh'], ['Frankfurt', 50.11, 8.68, 3, 'ehg'], ['Amsterdam', 52.37, 4.9, 3, 'ehg'],
    ['Brussels', 50.85, 4.35, 2, 'eh'], ['London', 51.51, -0.13, 3, 'ehg'], ['Manchester', 53.48, -2.24, 2, 'eh'],
    ['Glasgow', 55.86, -4.25, 2, 'eg'], ['Dublin', 53.35, -6.26, 2, 'e'], ['Copenhagen', 55.68, 12.57, 2, 'e'],
    ['Hamburg', 53.55, 9.99, 2, 'ehg'], ['Berlin', 52.52, 13.4, 3, 'eh'], ['Prague', 50.08, 14.44, 2, 'e'],
    ['Vienna', 48.21, 16.37, 2, 'eg'], ['Warsaw', 52.23, 21.01, 2, 'eg'], ['Budapest', 47.5, 19.04, 2, 'e'],
    ['Stockholm', 59.33, 18.07, 2, 'e'], ['Oslo', 59.91, 10.75, 2, 'eg'], ['Helsinki', 60.17, 24.94, 2, 'e'],
    ['Tallinn', 59.44, 24.75, 1, 'e'], ['Riga', 56.95, 24.11, 1, 'e'], ['Zagreb', 45.81, 15.98, 1, 'e'],
    ['Belgrade', 44.79, 20.45, 1, 'e'], ['Bucharest', 44.43, 26.1, 2, 'eg'], ['Sofia', 42.7, 23.32, 1, 'e'],
    ['Athens', 37.98, 23.73, 2, 'eg']
  ];

  // [a, b, carrier, flow?] — e power, h hydrogen, g oil & gas / CCS.
  const EDGES = [
    [0, 1, 'e', 0], [1, 2, 'e', 1], [1, 3, 'e', 0], [3, 4, 'h', 0], [2, 6, 'e', 1], [4, 5, 'e', 0],
    [5, 6, 'e', 1], [5, 15, 'h', 1], [6, 7, 'e', 0], [6, 11, 'e', 0], [7, 8, 'g', 0], [8, 9, 'e', 1],
    [9, 10, 'e', 0], [8, 11, 'e', 0], [11, 12, 'e', 0], [12, 13, 'h', 1], [13, 15, 'h', 0], [13, 21, 'e', 1],
    [14, 15, 'h', 1], [14, 21, 'g', 0], [16, 15, 'e', 1], [16, 17, 'e', 0], [17, 18, 'e', 1], [17, 19, 'e', 0],
    [16, 14, 'h', 1], [20, 21, 'e', 0], [21, 22, 'e', 1], [22, 23, 'e', 0], [23, 24, 'e', 0], [24, 12, 'g', 0],
    [24, 26, 'e', 0], [25, 22, 'e', 1], [25, 31, 'e', 0], [26, 32, 'e', 0], [26, 34, 'g', 0], [32, 33, 'e', 0],
    [33, 35, 'e', 0], [35, 36, 'e', 1], [34, 35, 'g', 0], [27, 20, 'e', 1], [27, 28, 'e', 0], [27, 29, 'e', 0],
    [29, 30, 'e', 0], [30, 31, 'e', 0], [28, 18, 'e', 1], [20, 22, 'e', 0], [9, 36, 'g', 0], [2, 7, 'e', 0],
    [18, 19, 'e', 0], [19, 16, 'g', 0]
  ];

  const CARRIER_COLOR = {
    e: 'oklch(0.78 0.14 170 / .55)',
    h: 'oklch(0.85 0.14 170 / .5)',
    g: 'rgba(242,244,246,.3)'
  };

  const CARRIER_CAPTION = {
    all: 'All carriers in one integrated model',
    e: 'Power network',
    h: 'Hydrogen',
    g: 'Oil, gas & CCS'
  };

  function project(lat, lon) {
    const k = 23.4;
    return { x: 24 + (lon + 10.4) * 0.655 * k, y: 20 + (61.6 - lat) * k };
  }

  function initNetworkMap() {
    const host = document.querySelector('[data-fig="network"]');
    if (!host) return;

    const linkLayer = host.querySelector('[data-net-links]');
    const flowLayer = host.querySelector('[data-net-flows]');
    const nodeLayer = host.querySelector('[data-net-nodes]');
    const caption = host.querySelector('[data-net-caption]');
    if (!linkLayer || !flowLayer || !nodeLayer) return;

    // Curve every edge slightly off the straight line so parallel routes read apart.
    const geom = EDGES.map(e => {
      const a = project(CITIES[e[0]][1], CITIES[e[0]][2]);
      const b = project(CITIES[e[1]][1], CITIES[e[1]][2]);
      const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.07;
      const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.07;
      return {
        e,
        d: 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) +
           ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) +
           ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1)
      };
    });

    // Built once — filtering only changes opacity, never the geometry.
    const links = geom.map(g => {
      const p = node('path', {
        d: g.d,
        fill: 'none',
        stroke: CARRIER_COLOR[g.e[2]],
        'stroke-width': g.e[2] === 'e' ? '1.3' : '1.8',
        'stroke-linecap': 'round',
        class: 'net-link'
      });
      return { el: p, carrier: g.e[2] };
    });
    fill(linkLayer, links.map(l => l.el));

    const flows = geom.filter(g => g.e[3]).map((g, i) => {
      const p = node('path', {
        d: g.d,
        fill: 'none',
        stroke: 'var(--accent-bright)',
        'stroke-width': '1.6',
        'stroke-linecap': 'round',
        'stroke-dasharray': '4 12',
        class: 'net-flow',
        style: 'animation-delay:' + (i * 0.21).toFixed(2) + 's'
      });
      return { el: p, carrier: g.e[2] };
    });
    fill(flowLayer, flows.map(f => f.el));

    const nodes = CITIES.map(c => {
      const p = project(c[1], c[2]);
      const circle = node('circle', {
        cx: p.x.toFixed(1),
        cy: p.y.toFixed(1),
        r: String(2.6 + c[3] * 1.5),
        fill: c[3] >= 3 ? 'var(--accent)' : 'oklch(0.78 0.14 170 / .7)',
        stroke: 'rgba(11,13,16,.9)',
        'stroke-width': '1',
        class: 'net-node'
      });
      return { el: circle, carriers: c[4] };
    });
    fill(nodeLayer, nodes.map(n => n.el));

    segmented(host, '[data-net-controls]', 'all', carrier => {
      const liveEdge = c => carrier === 'all' || c === carrier;
      links.forEach(l => { l.el.style.opacity = liveEdge(l.carrier) ? '1' : '0.1'; });
      flows.forEach(f => { f.el.style.opacity = liveEdge(f.carrier) ? '0.9' : '0'; });
      nodes.forEach(n => {
        n.el.style.opacity = (carrier === 'all' || n.carriers.includes(carrier)) ? '1' : '0.16';
      });
      if (caption) caption.textContent = CARRIER_CAPTION[carrier];
    });
  }

  // ==========================================================================
  // Technology 02 — uncertainty across horizons
  // ==========================================================================

  const HORIZONS = {
    day: {
      title: 'Short-term operational decisions',
      body: 'Resolved at high temporal resolution, inside the same model that carries the long-term plan.',
      axis: 'hours → days',
      f: t => 0.52 + 0.3 * Math.sin(t * 2 * Math.PI - 1.4) + 0.07 * Math.sin(t * 17)
    },
    year: {
      title: 'Uncertainty across multiple time horizons',
      body: 'Scenarios generated and evaluated across seasons, with trade-offs between cost, risk and system performance made comparable.',
      axis: 'seasons',
      f: t => 0.5 + 0.34 * Math.cos(t * 2 * Math.PI) + 0.05 * Math.sin(t * 9)
    },
    decade: {
      title: 'Long-term strategic planning',
      body: 'Investment, retrofit and abandonment planning, linked to short-term operational decisions rather than studied separately.',
      axis: 'decades',
      f: t => 0.24 + 0.6 * Math.pow(t, 1.5) + 0.04 * Math.sin(t * 11)
    }
  };

  function initHorizonChart() {
    const host = document.querySelector('[data-fig="horizon"]');
    if (!host) return;

    const path = host.querySelector('[data-horizon-path]');
    const area = host.querySelector('[data-horizon-area]');
    const title = host.querySelector('[data-horizon-title]');
    const body = host.querySelector('[data-horizon-body]');
    const axis = host.querySelector('[data-horizon-axis]');
    if (!path || !area) return;

    segmented(host, '[data-horizon-controls]', 'year', key => {
      const cfg = HORIZONS[key];
      if (!cfg) return;
      const d = line(cfg.f, 4, 596, 60, 200, 170);
      path.setAttribute('d', d);
      area.setAttribute('d', d + ' L596 212 L4 212 Z');
      if (title) title.textContent = cfg.title;
      if (body) body.textContent = cfg.body;
      if (axis) axis.textContent = cfg.axis;
    });
  }

  // ==========================================================================
  // Benchmark bar charts + platform workflow (Home, Technology 03 and 05)
  // ==========================================================================

  // Both are plain markup and CSS, complete without this. It only arms their
  // entrance (.is-armed hides the parts that animate) and plays it (.is-in)
  // the first time the figure is scrolled to. Nothing is armed under reduced
  // motion or without IntersectionObserver, so the figure just shows.
  function playOnFirstView(host) {
    if (REDUCED || !('IntersectionObserver' in window)) return;
    host.classList.add('is-armed');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        host.classList.add('is-in');
        io.disconnect();
      });
    }, { threshold: 0.2 });
    io.observe(host);
  }

  function initEntrances() {
    document.querySelectorAll('[data-fig="bars"], [data-fig="workflow"]').forEach(playOnFirstView);
  }

  // ==========================================================================

  function init() {
    initFanChart();
    initNetworkMap();
    initHorizonChart();
    initEntrances();
  }

  return { init: init };
})();
