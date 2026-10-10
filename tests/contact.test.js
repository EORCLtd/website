// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// main.js is a plain browser script: run it with a stub DOM and pull out the
// two pure functions the contact page is built on.
const matchMedia = () => ({ matches: false });
const sandbox = {
  window: { matchMedia },
  matchMedia,
  URLSearchParams,
  encodeURIComponent,
  document: { addEventListener() { }, querySelectorAll: () => [], querySelector: () => null }
};
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8') +
  '\n;this.__exports = { buildEmail, parseContactParams };',
  sandbox
);
const { buildEmail, parseContactParams } = sandbox.__exports;

const decode = url => {
  const u = new URL(url);
  return { subject: u.searchParams.get('subject') ?? u.searchParams.get('su'), body: u.searchParams.get('body') };
};

test('parseContactParams: defaults to demo with no role', () => {
  assert.deepEqual({ ...parseContactParams('') }, { intent: 'demo', role: null });
});

test('parseContactParams: reads a valid intent and role', () => {
  assert.deepEqual({ ...parseContactParams('?intent=question&role=other') }, { intent: 'question', role: 'other' });
});

test('parseContactParams: a role on its own means a demo request', () => {
  assert.deepEqual({ ...parseContactParams('?role=system-operator') }, { intent: 'demo', role: 'system-operator' });
});

test('parseContactParams: unknown values, including prototype names, are ignored', () => {
  assert.deepEqual({ ...parseContactParams('?intent=waitlist&role=nope') }, { intent: 'demo', role: null });
  assert.deepEqual({ ...parseContactParams('?intent=constructor&role=__proto__') }, { intent: 'demo', role: null });
});

test('buildEmail: demo without a role lists every field', () => {
  const { mailto } = buildEmail('demo', null);
  const { subject, body } = decode(mailto);
  assert.equal(subject, 'Demo request — EORC platform');
  assert.equal(body, [
    'Hi EORC team,', '',
    'Your organisation and role:',
    'The system or portfolio, and the energy carriers involved:',
    "The decision you're facing:",
    'A preferred time for a call:'
  ].join('\r\n'));
});

test('buildEmail: a role adds a line and shortens the first field to Organisation', () => {
  const { body } = decode(buildEmail('demo', 'asset-owner').mailto);
  const lines = body.split('\r\n');
  assert.equal(lines[2], 'I work as: Energy asset owner');
  assert.equal(lines[3], 'Organisation:');
  assert.ok(!body.includes('Your organisation and role'));
});

test('buildEmail: question intent has its own subject and fields', () => {
  const { subject, body } = decode(buildEmail('question', null).mailto);
  assert.equal(subject, 'Enquiry — EORC');
  assert.ok(body.endsWith('Your question:'));
});

test('buildEmail: unknown intent falls back to demo, unknown role is dropped', () => {
  const email = buildEmail('waitlist', 'nope');
  assert.deepEqual(decode(email.mailto), decode(buildEmail('demo', null).mailto));
  assert.equal(email.cta, 'Email us to book a demo');
});

test('buildEmail: webmail links carry the same subject and body, with spaces as %20', () => {
  const email = buildEmail('demo', 'market-analyst');
  const mail = decode(email.mailto);
  assert.deepEqual(decode(email.gmail), mail);
  assert.deepEqual(decode(email.outlook), mail);
  assert.ok(!email.mailto.includes('+') && email.mailto.includes('%20'));
  assert.ok(email.gmail.startsWith('https://mail.google.com/mail/?view=cm&fs=1&to=info%40eorc.uk'));
});
