// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// The site scripts are plain browser scripts, so load them into a context with
// just enough of a DOM for their top level to run.
function load(file, extra = {}) {
  const sandbox = {
    window: {},
    matchMedia: () => ({ matches: false }),
    document: { addEventListener() {}, querySelectorAll: () => [], querySelector: () => null },
    ...extra
  };
  sandbox.window.matchMedia = sandbox.matchMedia;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8') + '\n;this.__exports = { activeStep: typeof activeStep === "function" ? activeStep : undefined, buildEmail: typeof buildEmail === "function" ? buildEmail : undefined, parseContactParams: typeof parseContactParams === "function" ? parseContactParams : undefined };', sandbox);
  return sandbox;
}

const figures = load('figures.js').window.EORCFigures.geometry;
const { activeStep } = load('main.js').__exports;

const numbers = d => d.match(/-?\d+(\.\d+)?/g).map(Number);

test('line: samples steps+1 points from x0 to x1', () => {
  const d = figures.line(() => 0.5, 0, 100, 4, 200, 100);
  assert.equal(d.match(/[ML]/g).length, 5);
  assert.match(d, /^M0\.0 150\.0/);
  assert.match(d, /L100\.0 150\.0$/);
});

test('band: closes, and returns to the start of the upper curve edge', () => {
  const d = figures.band(() => 0.2, () => 0.8, 0, 100, 2, 200, 100);
  assert.ok(d.startsWith('M0.0 120.0'));
  assert.ok(d.endsWith('Z'));
  assert.equal(d.match(/M/g).length, 1);
  // 3 upper points + 3 lower points
  assert.equal(numbers(d).length, 12);
});

test('band: lower curve is walked right to left', () => {
  const xs = numbers(figures.band(() => 0.2, () => 0.8, 0, 100, 2, 200, 100)).filter((_, i) => i % 2 === 0);
  assert.deepEqual(xs, [0, 50, 100, 100, 50, 0]);
});

test('band: zero width has identical upper and lower points', () => {
  const pts = numbers(figures.band(t => t, t => t, 0, 10, 2, 100, 10));
  const pairs = [];
  for (let i = 0; i < pts.length; i += 2) pairs.push(pts[i] + ',' + pts[i + 1]);
  assert.deepEqual(pairs.slice(0, 3), pairs.slice(3).reverse());
});

test('fanPaths: median starts at the left edge, forecast is a straight 3-point line', () => {
  const p = figures.fanPaths();
  assert.ok(p.median.startsWith('M4.0 '));
  assert.equal(p.forecast.match(/[ML]/g).length, 3);
  assert.ok(p.outer.endsWith('Z') && p.inner.endsWith('Z'));
});

test('fanPaths: likely range sits inside the full range', () => {
  const p = figures.fanPaths();
  const ys = d => numbers(d).filter((_, i) => i % 2 === 1);
  assert.ok(Math.min(...ys(p.inner)) > Math.min(...ys(p.outer)));
  assert.ok(Math.max(...ys(p.inner)) < Math.max(...ys(p.outer)));
});

test('HORIZONS: every horizon has a non-negative band half-width over [0,1]', () => {
  Object.entries(figures.HORIZONS).forEach(([key, h]) => {
    for (let i = 0; i <= 20; i++) assert.ok(h.w(i / 20) >= 0, key + ' @' + i);
  });
});

test('project: more northern is higher up, more eastern is further right', () => {
  const lisbon = figures.project(38.72, -9.14);
  const helsinki = figures.project(60.17, 24.94);
  assert.ok(helsinki.y < lisbon.y);
  assert.ok(helsinki.x > lisbon.x);
});

test('activeStep: -1 before the first step', () => {
  assert.equal(activeStep([900, 1700, 2500], 9000, 800), -1);
});

test('activeStep: picks the last step above the line', () => {
  assert.equal(activeStep([-1200, -300, 150, 900, 1700], 4000, 800), 2);
});

test('activeStep: -1 once the closing CTA is half way up the viewport', () => {
  assert.equal(activeStep([-3000, -2000, -1000, -500, -100], 399, 800), -1);
  assert.equal(activeStep([-3000, -2000, -1000, -500, -100], 400, 800), 4);
});

test('activeStep: no steps means nothing active', () => {
  assert.equal(activeStep([], 4000, 800), -1);
});
