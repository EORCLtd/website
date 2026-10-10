// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'about.html'), 'utf8');

const all = (re, group = 1) => Array.from(html.matchAll(re), m => m[group]);

test('shows the three pillars', () => {
  assert.equal(all(/class="about-pillar"/g, 0).length, 3);
});

test('shows the three team members, each with email and LinkedIn', () => {
  assert.equal(all(/class="team-member"/g, 0).length, 3);
  assert.equal(all(/href="mailto:[^"]+"/g, 0).length, 3);
  const linkedin = all(/<a href="https:\/\/www\.linkedin\.com\/[^"]*"([^>]*)>/g);
  assert.equal(linkedin.length, 3);
  linkedin.forEach(attrs => assert.match(attrs, /rel="noopener"/));
});

test('"Meet the team" link targets an existing #team anchor', () => {
  assert.match(html, /href="#team"/);
  assert.match(html, /id="team"/);
});

test('every <use> references a symbol defined in <defs>', () => {
  const defined = new Set(all(/<g id="([^"]+)"/g));
  const used = all(/<use href="#([^"]+)"/g);
  assert.ok(used.length > 0);
  used.forEach(id => assert.ok(defined.has(id), `missing #${id}`));
});

test('every local href/src resolves to an existing file', () => {
  const refs = all(/(?:href|src)="([^"#:]+?)(?:\?[^"]*)?"/g)
    .filter(ref => !ref.startsWith('//'));
  assert.ok(refs.length > 0);
  refs.forEach(ref => assert.ok(fs.existsSync(path.join(root, ref)), `missing file ${ref}`));
});

test('call-to-action links to the technology page', () => {
  assert.match(html, /href="product\.html"[^>]*>Explore the technology/);
});
