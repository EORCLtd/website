// Run with: node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');

const AI_SEARCH = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'];
const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];
const SHARED_RULES = [['allow', '/'], ['disallow', '/tests/'], ['disallow', '/README.md']];

// Non-comment, non-blank lines as [field, value] pairs.
const rules = robots
  .split('\n')
  .map(line => line.replace(/#.*/, '').trim())
  .filter(Boolean)
  .map(line => {
    const colon = line.indexOf(':');
    return [line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim()];
  });

// RFC 9309 groups: one or more user-agent lines, then the allow/disallow rules that apply to them.
const groups = rules.reduce((acc, [field, value]) => {
  const last = acc[acc.length - 1];
  if (field === 'user-agent') {
    if (last && last.rules.length === 0) last.agents.push(value);
    else acc.push({ agents: [value], rules: [] });
  } else if (field === 'allow' || field === 'disallow') {
    last.rules.push([field, value]);
  }
  return acc;
}, []);

const groupFor = agent => groups.find(group => group.agents.includes(agent));

test('robots.txt: is plain ASCII text', () => {
  assert.match(robots, /^[\x09\x0A\x0D\x20-\x7E]*$/);
});

test('robots.txt: every line is a known "field: value" rule', () => {
  rules.forEach(([field]) => assert.ok(['user-agent', 'allow', 'disallow', 'sitemap'].includes(field), `unknown field: ${field}`));
});

test('robots.txt: has a group for all user agents', () => {
  assert.ok(groupFor('*'));
});

test('robots.txt: names every AI search and training crawler explicitly', () => {
  [...AI_SEARCH, ...AI_TRAINING].forEach(agent => assert.ok(groupFor(agent), `no group for ${agent}`));
});

test('robots.txt: names each user agent only once', () => {
  const agents = groups.flatMap(group => group.agents);
  assert.equal(new Set(agents).size, agents.length);
});

test('robots.txt: every group allows the public pages and blocks repo-only files', () => {
  groups.forEach(group => assert.deepEqual(group.rules, SHARED_RULES, `rules differ for ${group.agents.join(', ')}`));
});

test('robots.txt: every disallowed path exists in the repo', () => {
  rules
    .filter(([field]) => field === 'disallow')
    .forEach(([, value]) => assert.ok(fs.existsSync(path.join(root, value)), `missing ${value}`));
});

test('robots.txt: points at the sitemap with an absolute URL', () => {
  assert.deepEqual(rules.filter(([field]) => field === 'sitemap'), [['sitemap', 'https://eorc.uk/sitemap.xml']]);
});
