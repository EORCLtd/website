// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { en, render } = require('./helpers');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const PAGES = ['index.html', 'product.html', 'about.html', 'contact.html', '404.html'];

const keysIn = html => {
  const keys = [];
  for (const m of html.matchAll(/\sdata-i18n(?:-html)?="([^"]+)"/g)) keys.push(m[1]);
  for (const m of html.matchAll(/\sdata-i18n-attr="([^"]+)"/g)) m[1].split(';').forEach(pair => keys.push(pair.slice(pair.indexOf(':') + 1)));
  return keys;
};

test('en.json: every value is a non-empty string', () => {
  Object.entries(en).forEach(([key, value]) => {
    assert.equal(typeof value, 'string', key);
    assert.ok(value.length > 0, `${key} is empty`);
  });
});

PAGES.forEach(file => {
  const html = read(file);

  test(`${file}: loads js/i18n.js in the head, before main.js`, () => {
    const i18n = html.indexOf('<script src="js/i18n.js"></script>');
    assert.ok(i18n > -1 && i18n < html.indexOf('</head>'));
    assert.ok(i18n < html.indexOf('js/main.js'));
  });

  test(`${file}: every translation key exists in en.json`, () => {
    keysIn(html).forEach(key => assert.ok(Object.hasOwn(en, key), `missing key ${key}`));
  });

  test(`${file}: keeps no copy in the markup`, () => {
    const bare = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/g, ' ');
    assert.doesNotMatch(bare, /\p{L}/u, `${file} has hard-coded text: ${bare.match(/\S*\p{L}\S*/u)}`);
  });

  test(`${file}: rendering leaves no empty translated element`, () => {
    assert.doesNotMatch(render(html), /data-i18n/);
  });
});

test('en.json: every key is used by a page or a script', () => {
  const used = new Set(PAGES.flatMap(file => keysIn(read(file))));
  const js = read('js/main.js') + read('js/figures.js');
  const i18nJs = read('js/i18n.js') + "'lang.name'"; // lang.name is read by the selector, key built in code
  Object.keys(en).forEach(key => {
    const parent = key.slice(0, key.lastIndexOf('.'));
    const inI18n = i18nJs.includes(`'${key}'`);
    const inJs = inI18n || js.includes(`'${key}'`) || js.includes(`'${parent}'`) || js.includes(`'${parent}.'`);
    assert.ok(used.has(key) || inJs, `unused key ${key}`);
  });
});

// ---------- language files and the nav selector ----------
const langDir = path.join(root, 'lang');
const codes = JSON.parse(read('lang/languages.json'));
const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json') && f !== 'languages.json').map(f => f.replace(/\.json$/, ''));

test('languages.json lists exactly the language files in lang/', () => {
  assert.deepEqual([...codes].sort(), [...files].sort());
  assert.ok(codes.includes('en'));
});

codes.forEach(code => {
  const strings = JSON.parse(read(`lang/${code}.json`));

  test(`lang/${code}.json: has a display name`, () => {
    assert.ok(typeof strings['lang.name'] === 'string' && strings['lang.name'].length > 0);
  });

  test(`lang/${code}.json: only uses keys that exist in en.json`, () => {
    Object.keys(strings).forEach(key => assert.ok(Object.hasOwn(en, key), `unknown key ${key}`));
  });
});

PAGES.forEach(file => {
  test(`${file}: has the language selector placeholder inside the nav links`, () => {
    const nav = read(file).match(/<ul class="nav-links">[\s\S]*?<\/ul>/)[0];
    assert.match(nav, /<li class="lang-switch" data-lang-switch hidden><\/li>/);
  });
});
