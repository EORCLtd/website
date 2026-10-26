// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'product.html'), 'utf8');

// figures.js is a plain browser script; give it just enough of a DOM to load.
const sandbox = {
  window: { matchMedia: () => ({ matches: false }) },
  document: { addEventListener() { }, querySelectorAll: () => [], querySelector: () => null }
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'js', 'figures.js'), 'utf8'), sandbox);
const { HORIZONS } = sandbox.window.EORCFigures.geometry;

const horizonControls = html.match(/<div class="seg" data-horizon-controls[^>]*>([\s\S]*?)<\/div>/)[1];
const buttons = Array.from(horizonControls.matchAll(/<button[^>]*data-value="([^"]+)"[^>]*aria-pressed="(true|false)"/g),
  m => ({ value: m[1], pressed: m[2] === 'true' }));

test('horizon chart: no commented-out buttons left in the controls', () => {
  assert.doesNotMatch(horizonControls, /<!--/);
});

test('horizon chart: exactly one button is pressed, the operational one', () => {
  assert.deepEqual(buttons.filter(b => b.pressed).map(b => b.value), ['day']);
});

test('horizon chart: buttons and HORIZONS entries match one to one', () => {
  assert.deepEqual(buttons.map(b => b.value).sort(), Object.keys(HORIZONS).sort());
});

test('horizon chart: no-JS fallback text matches the initially pressed horizon', () => {
  const day = HORIZONS.day;
  const text = attr => html.match(new RegExp(`<div[^>]*${attr}[^>]*>([\\s\\S]*?)</div>`))[1].replace(/\s+/g, ' ').trim();
  assert.equal(text('data-horizon-title'), day.title);
  assert.equal(text('data-horizon-body'), day.body);
  assert.equal(text('data-horizon-axis'), day.axis);
});
