// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// the "What we do" section, so the other tab widgets on the page don't count
const wwd = html.match(/<section class="section-dark on-dark wwd">[\s\S]*?<\/section>/)[0];

const all = (re, group = 1) => Array.from(wwd.matchAll(re), m => m[group]);

test('"What we do" has one tablist with three tabs', () => {
  assert.equal(all(/role="tablist"/g, 0).length, 1);
  assert.equal(all(/<button[^>]*role="tab"/g, 0).length, 3);
});

test('exactly one "What we do" tab is selected, the first', () => {
  const selected = all(/<button[^>]*role="tab"[^>]*aria-selected="(true|false)"/g);
  assert.deepEqual(selected, ['true', 'false', 'false']);
});

test('each "What we do" tab controls a panel that points back at it', () => {
  const tabs = all(/<button[^>]*role="tab"[^>]*>/g, 0).map(tag => ({
    id: tag.match(/\sid="([^"]+)"/)[1],
    controls: tag.match(/aria-controls="([^"]+)"/)[1]
  }));
  assert.equal(tabs.length, 3);
  tabs.forEach(({ id, controls }) => {
    const panel = wwd.match(new RegExp(`<div[^>]*id="${controls}"[^>]*>`));
    assert.ok(panel, `no panel #${controls}`);
    assert.match(panel[0], /role="tabpanel"/);
    assert.match(panel[0], new RegExp(`aria-labelledby="${id}"`));
  });
});

test('"What we do" tabs hold no heading or paragraph (invalid inside a button)', () => {
  const buttons = all(/<button[^>]*role="tab"[\s\S]*?<\/button>/g, 0);
  buttons.forEach(b => assert.doesNotMatch(b, /<(h[1-6]|p|div)[\s>]/));
});
