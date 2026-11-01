// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// main.js is a plain browser script; give it just enough of a DOM to load.
const sandbox = {
  window: { matchMedia: () => ({ matches: false }) },
  matchMedia: () => ({ matches: false }),
  document: { addEventListener() { }, querySelectorAll: () => [], querySelector: () => null }
};
vm.runInNewContext(
  fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8') + '\n;this.__exports = { carouselPosition };',
  sandbox
);
const { carouselPosition } = sandbox.__exports;

// one section of the page, so the other widgets don't count
const section = pattern => html.match(pattern)[0];
const forSection = section(/<section class="v5-section v5-for">[\s\S]*?<\/section>/);
const exampleSection = section(/<section class="v5-example" id="example">[\s\S]*?<\/section>/);
const techSection = section(/<section class="v5-section v5-tech">[\s\S]*?<\/section>/);

const all = (text, re, group = 0) => Array.from(text.matchAll(re), m => m[group]);

test('"For" has three role panels, each with a toggle that controls its body', () => {
  const panels = all(forSection, /<article class="v5-role"[\s\S]*?<\/article>/g);
  assert.equal(panels.length, 3);
  panels.forEach(panel => {
    const controls = panel.match(/class="v5-role-toggle"[^>]*aria-controls="([^"]+)"/)[1];
    assert.match(panel, new RegExp(`<div class="v5-role-body" id="${controls}">`));
  });
});

test('"For" panels ship open (aria-expanded="true"), so the copy reads without JavaScript', () => {
  const expanded = all(forSection, /class="v5-role-toggle"[^>]*aria-expanded="(true|false)"/g, 1);
  assert.deepEqual(expanded, ['true', 'true', 'true']);
});

test('"For" panels keep the data-role keys that contact.html?role= and analytics rely on', () => {
  const keys = all(forSection, /<article class="v5-role" data-role="([^"]+)"/g, 1);
  assert.deepEqual(keys, ['asset-owner', 'system-operator', 'market-analyst']);
  keys.forEach(key => assert.match(forSection, new RegExp(`href="contact\\.html\\?role=${key}"`)));
});

test('"For" toggles hold no heading, paragraph or div (invalid inside a button)', () => {
  all(forSection, /<button[^>]*v5-role-toggle[\s\S]*?<\/button>/g)
    .forEach(b => assert.doesNotMatch(b, /<(h[1-6]|p|div)[\s>]/));
});

test('example has one tablist with four tabs, the first selected', () => {
  assert.equal(all(exampleSection, /role="tablist"/g).length, 1);
  const selected = all(exampleSection, /<button[^>]*role="tab"[^>]*aria-selected="(true|false)"/g, 1);
  assert.deepEqual(selected, ['true', 'false', 'false', 'false']);
});

test('each example tab controls a panel that points back at it', () => {
  const tabs = all(exampleSection, /<button[^>]*role="tab"[^>]*>/g).map(tag => ({
    id: tag.match(/\sid="([^"]+)"/)[1],
    controls: tag.match(/aria-controls="([^"]+)"/)[1]
  }));
  assert.equal(tabs.length, 4);
  tabs.forEach(({ id, controls }) => {
    const panel = exampleSection.match(new RegExp(`<div[^>]*id="${controls}"[^>]*>`));
    assert.ok(panel, `no panel #${controls}`);
    assert.match(panel[0], /role="tabpanel"/);
    assert.match(panel[0], new RegExp(`aria-labelledby="${id}"`));
  });
});

test('technology has four cards numbered 0-3 and four stage buttons, hidden until JavaScript runs', () => {
  assert.deepEqual(all(techSection, /class="v5-tech-card" data-pos="(\d)"/g, 1), ['0', '1', '2', '3']);
  const tabs = techSection.match(/<div[^>]*data-tech-tabs[^>]*>[\s\S]*?<\/div>/)[0];
  assert.match(tabs, /\shidden>/);
  assert.equal(all(tabs, /<button/g).length, 4);
});

test('technology arrows are labelled buttons, hidden until JavaScript runs', () => {
  const arrows = techSection.match(/<div[^>]*data-tech-arrows[^>]*>[\s\S]*?<\/div>/)[0];
  assert.match(arrows, /\shidden>/);
  assert.match(arrows, /data-tech-prev[^>]*aria-label="Previous"/);
  assert.match(arrows, /data-tech-next[^>]*aria-label="Next"/);
});

test('every photo placeholder is preceded by a TODO comment', () => {
  const placeholders = all(html, /<div class="v5-photo"/g).length;
  assert.equal(all(html, /<!-- TODO photo:/g).length, placeholders);
  assert.equal(placeholders, 12);
});

test('every internal link points at a file that exists', () => {
  const hrefs = new Set(all(html, /href="([^"#:]+?)(?:\?[^"]*)?"/g, 1));
  hrefs.forEach(href => {
    if (/^https?:|^css\/|^img\//.test(href)) return;
    assert.ok(fs.existsSync(path.join(root, href)), `missing ${href}`);
  });
});

test('every stylesheet and script the page loads exists', () => {
  const files = [
    ...all(html, /<link rel="stylesheet" href="([^":]+)"/g, 1),
    ...all(html, /<script src="([^":]+)"/g, 1)
  ];
  assert.ok(files.length >= 3);
  files.forEach(file => assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`));
});

test('carouselPosition: selected card is 0, next is 1, previous is 3, opposite is 2', () => {
  assert.deepEqual([0, 1, 2, 3].map(i => carouselPosition(i, 0, 4)), [0, 1, 2, 3]);
  assert.deepEqual([0, 1, 2, 3].map(i => carouselPosition(i, 1, 4)), [3, 0, 1, 2]);
});

test('carouselPosition: wraps around the last card', () => {
  assert.deepEqual([0, 1, 2, 3].map(i => carouselPosition(i, 3, 4)), [1, 2, 3, 0]);
});

// ---------- "For" panels: the whole card is clickable ----------
// A just-enough DOM: a click on the toggle bubbles to its panel, like in a browser.
function fakeRolePanels(count) {
  const clickable = tag => ({ closest: selector => (selector.split(', ').includes(tag) ? {} : null) });
  const plainTarget = { closest: () => null };

  const panels = Array.from({ length: count }, () => {
    const classes = new Set();
    const panelListeners = [];
    const toggleListeners = [];
    const toggle = { attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } };
    const panel = {
      classList: {
        contains: name => classes.has(name),
        toggle: (name, force) => (force ? classes.add(name) : classes.delete(name))
      },
      querySelector: () => toggle,
      addEventListener: (type, fn) => panelListeners.push(fn),
      click: target => panelListeners.forEach(fn => fn({ target }))
    };
    toggle.addEventListener = (type, fn) => toggleListeners.push(fn);
    toggle.click = () => {
      toggleListeners.forEach(fn => fn({ target: toggle }));
      panel.click(clickable('button'));
    };
    return { panel, toggle };
  });

  const list = { classList: { add() { } }, querySelectorAll: () => panels.map(p => p.panel) };
  const context = {
    window: { matchMedia: () => ({ matches: false }) },
    document: { addEventListener() { }, querySelector: () => list, querySelectorAll: () => [] }
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8') + '\n;initRolePanels();',
    context
  );
  const openStates = () => panels.map(p => p.panel.classList.contains('is-open'));
  return { panels, openStates, plainTarget, clickable };
}

test('"For" panels: first panel starts open', () => {
  const { openStates } = fakeRolePanels(3);
  assert.deepEqual(openStates(), [true, false, false]);
});

test('"For" panels: clicking anywhere on a collapsed card opens it and closes the others', () => {
  const { panels, openStates, plainTarget } = fakeRolePanels(3);
  panels[2].panel.click(plainTarget);
  assert.deepEqual(openStates(), [false, false, true]);
  assert.equal(panels[2].toggle.attrs['aria-expanded'], 'true');
  assert.equal(panels[0].toggle.attrs['aria-expanded'], 'false');
});

test('"For" panels: clicking the toggle still opens its panel exactly once', () => {
  const { panels, openStates } = fakeRolePanels(3);
  let opened = 0;
  panels[1].toggle.addEventListener('click', () => opened++);
  panels[1].toggle.click();
  assert.deepEqual(openStates(), [false, true, false]);
  assert.equal(opened, 1);
});

test('"For" panels: clicking a link inside a collapsed card does not open it', () => {
  const { panels, openStates, clickable } = fakeRolePanels(3);
  panels[1].panel.click(clickable('a'));
  assert.deepEqual(openStates(), [true, false, false]);
});

test('"For" panels: clicking an already open card does nothing', () => {
  const { panels, openStates, plainTarget } = fakeRolePanels(3);
  let toggled = 0;
  panels[0].toggle.addEventListener('click', () => toggled++);
  panels[0].panel.click(plainTarget);
  assert.deepEqual(openStates(), [true, false, false]);
  assert.equal(toggled, 0);
});
