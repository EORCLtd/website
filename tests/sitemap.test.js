// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const SITE = 'https://eorc.uk/';

const sitemap = read('sitemap.xml');
const locs = Array.from(sitemap.matchAll(/<loc>([^<]*)<\/loc>/g), m => m[1]);

// Indexable pages: top-level HTML files without a noindex meta tag.
const indexablePages = fs.readdirSync(root)
  .filter(file => file.endsWith('.html'))
  .filter(file => !/<meta name="robots" content="noindex">/.test(read(file)));

const pageForLoc = loc => (loc === SITE ? 'index.html' : loc.slice(SITE.length));

test('sitemap.xml: is a sitemaps.org urlset', () => {
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.equal(sitemap.match(/<url>/g).length, sitemap.match(/<\/url>/g).length);
});

test('sitemap.xml: every URL is absolute on the site domain, with no duplicates', () => {
  assert.ok(locs.length > 0);
  locs.forEach(loc => assert.ok(loc.startsWith(SITE), `not on ${SITE}: ${loc}`));
  assert.equal(new Set(locs).size, locs.length);
});

test('sitemap.xml: lists the home page as the bare domain, not index.html', () => {
  assert.ok(locs.includes(SITE));
  assert.ok(!locs.includes(`${SITE}index.html`));
});

test('sitemap.xml: lists exactly the indexable pages', () => {
  assert.deepEqual(locs.map(pageForLoc).sort(), indexablePages.sort());
});
