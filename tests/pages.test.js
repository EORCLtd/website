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

test('technology: figure hooks that js/figures.js drives are all still present', () => {
  const html = read('product.html');
  ['data-fig="inputs"', 'data-fig="horizon"', 'data-fig="network"', 'data-fig="bars"', 'data-fig="fan"',
    'data-horizon-controls', 'data-net-controls', 'data-net-links', 'data-net-flows', 'data-net-nodes',
    'data-fan="outer"', 'data-fan="median"', 'data-spark="demand"']
    .forEach(hook => assert.ok(html.includes(hook), `missing ${hook}`));
});
