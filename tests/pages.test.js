// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const all = (text, re, group = 1) => Array.from(text.matchAll(re), m => m[group]);

const PAGES = ['index.html', 'product.html', 'about.html', 'contact.html', '404.html'];

PAGES.forEach(file => {
  const html = read(file);

  test(`${file}: loads the v5 stylesheet and marks the body`, () => {
    assert.match(html, /<link rel="stylesheet" href="css\/v5\.css">/);
    assert.match(html, /<body class="v5">/);
  });

  test(`${file}: loads the Red Hat fonts, not the old ones`, () => {
    assert.match(html, /family=Red\+Hat\+Display/);
    assert.doesNotMatch(html, /Instrument\+Sans|IBM\+Plex/);
  });

  test(`${file}: every local stylesheet, script, image and link resolves`, () => {
    const refs = all(html, /(?:href|src)="([^"#:]+?)(?:\?[^"]*)?"/g)
      .filter(ref => !ref.startsWith('//') && ref !== './' && ref !== '/');
    assert.ok(refs.length > 0);
    refs.forEach(ref => assert.ok(fs.existsSync(path.join(root, ref)), `${file}: missing ${ref}`));
  });

  test(`${file}: has no leftover line-art markup`, () => {
    assert.doesNotMatch(html, /class="(?:hero-art|bg-art)|<use href="#eo-/);
  });
});

test('404: <base> comes before any relative URL that depends on it', () => {
  const html = read('404.html');
  const base = html.indexOf('<base href="/">');
  assert.ok(base > -1);
  assert.ok(base < html.indexOf('href="css/'));
  assert.ok(base < html.indexOf('href="img/'));
});

test('404: offers a way home and a way to contact', () => {
  const html = read('404.html');
  assert.match(html, /href="\.\/"[^>]*>Back to home/);
  assert.match(html, /href="contact\.html"[^>]*>Contact us/);
});

test('request-a-demo stubs still redirect to the contact page', () => {
  assert.match(read('request-a-demo.html'), /url=contact\.html/);
  assert.match(read('request-a-demo/index.html'), /url=\.\.\/contact\.html/);
});

test('contact: keeps every hook that initContact and analytics rely on', () => {
  const html = read('contact.html');
  assert.deepEqual(all(html, /<button[^>]*role="tab"[^>]*data-intent="([^"]+)"/g), ['demo', 'question']);
  assert.deepEqual(all(html, /<button[^>]*role="tab"[^>]*aria-selected="(true|false)"/g), ['true', 'false']);
  assert.deepEqual(all(html, /data-role-pick="([^"]+)"/g),
    ['asset-owner', 'system-operator', 'market-analyst', 'other']);
  ['data-mailto', 'data-cta', 'data-mail-fallback', 'data-mail-web="gmail"', 'data-mail-web="outlook"', 'data-copy="info@eorc.uk"']
    .forEach(hook => assert.ok(html.includes(hook), `missing ${hook}`));
});

test('contact: the question copy is hidden until selected, the demo copy is not', () => {
  const html = read('contact.html');
  const blocks = all(html, /<div data-for-intent="(demo|question)"([^>]*)>/g, 0);
  assert.ok(blocks.length >= 4);
  blocks.forEach(tag => {
    if (tag.includes('"question"')) assert.match(tag, /\shidden/);
    else assert.doesNotMatch(tag, /\shidden/);
  });
});

test('contact: the no-JS mailto is the demo email', () => {
  const html = read('contact.html');
  assert.match(html, /<a data-mailto\s+href="mailto:info@eorc\.uk\?subject=Demo%20request/);
});

test('technology: five steps, each reachable from the step nav and the path cards', () => {
  const html = read('product.html');
  const sections = all(html, /<section id="(step-\d)"/g);
  assert.deepEqual(sections, ['step-1', 'step-2', 'step-3', 'step-4', 'step-5']);
  assert.deepEqual(all(html, /<a href="#step-\d" data-step="(step-\d)"/g), sections);
  sections.forEach(id => assert.ok(html.includes(`<a href="#${id}"><span class="v5-path-head">`), `no path card for ${id}`));
});

test('technology: the closing section keeps the id the step nav hides on', () => {
  assert.match(read('product.html'), /<section id="get-started"/);
});

// Sizes must be in rem so the root font size can scale the whole design.
// Breakpoints (@media lines) and hairlines (<= 2px) are allowed to stay in px.
function pxOffenders(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')
    .filter(line => !/^\s*@media/.test(line))
    .flatMap(line => Array.from(line.matchAll(/(\d*\.?\d+)px\b/g), m => m[0]))
    .filter(value => parseFloat(value) > 2);
}

test('pxOffenders: flags sizes but keeps breakpoints and hairlines', () => {
  assert.deepEqual(pxOffenders('a { padding: 40px 0; margin: -12px; }'), ['40px', '12px']);
  assert.deepEqual(pxOffenders('@media (max-width: 760px) {\n  a { border: 1px solid; outline: 1.5px solid; }\n}'), []);
  assert.deepEqual(pxOffenders('a { width: 2px; height: 2.5px; }'), ['2.5px']);
  assert.deepEqual(pxOffenders('/* drawn at\n 1920px */ a { gap: 8px; }'), ['8px']);
  assert.deepEqual(pxOffenders(''), []);
});

['css/styles.css', 'css/v5.css'].forEach(file => {
  test(`${file}: uses rem for every size`, () => {
    assert.deepEqual(pxOffenders(read(file)), []);
  });
});

PAGES.forEach(file => {
  test(`${file}: inline styles use rem for every size`, () => {
    assert.deepEqual(pxOffenders(all(read(file), /style="([^"]*)"/g).join('\n')), []);
  });
});

test('styles.css: the root size scales with the screen, with an 80% floor and a fixed mobile size', () => {
  const css = read('css/styles.css');
  assert.match(css, /html \{\s*font-size: max\(80%, calc\(100vw \/ 120\)\);/);
  assert.match(css, /@media \(max-width: 899px\) \{\s*html \{\s*font-size: 87\.5%;/);
});

test('technology: on narrow windows the step nav names only the current step, so all five fit', () => {
  const css = read('css/v5.css');
  // Other names stay readable to screen readers, only hidden visually.
  assert.match(css, /@media \(max-width: 899px\) \{[^@]*\.v5-stepnav a:not\(\.is-active\) \.v5-stepnav-name \{[^}]*clip-path: inset\(50%\)/);
  assert.match(css, /\.v5-stepnav-inner \{[^}]*scrollbar-width: none/);
});

test('technology: figure hooks that js/figures.js drives are all still present', () => {
  const html = read('product.html');
  ['data-fig="inputs"', 'data-fig="horizon"', 'data-fig="network"', 'data-fig="bars"', 'data-fig="fan"',
    'data-horizon-controls', 'data-net-controls', 'data-net-links', 'data-net-flows', 'data-net-nodes',
    'data-fan="outer"', 'data-fan="median"', 'data-spark="demand"']
    .forEach(hook => assert.ok(html.includes(hook), `missing ${hook}`));
});
