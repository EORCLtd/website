// Run with: node --test tests/*.test.js
// Each public page has a Markdown copy for agents. These tests catch the copy drifting from the page.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const PAGES = ['index.html', 'product.html', 'about.html', 'contact.html'];

// Decorative hints such as "Click to explore →" are hidden from screen readers, so they are not page copy.
const HIDDEN_SPAN = /<span[^>]*aria-hidden="true">[^<]*(?:<span>[^<]*<\/span>)?[^<]*<\/span>/g;
const ENTITIES = { '&amp;': '&', '&nbsp;': ' ', '&lt;': '<', '&gt;': '>' };

const toText = html => html
  .replace(HIDDEN_SPAN, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&(?:amp|nbsp|lt|gt);/g, entity => ENTITIES[entity])
  .replace(/\s+/g, ' ')
  .trim();

const htmlHeadings = html => Array.from(html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g), m => toText(m[2]));
const markdownHeadings = md => Array.from(md.matchAll(/^#{1,6} (.+)$/gm), m => m[1].trim());
const frontmatterField = (md, field) => (md.match(new RegExp(`^${field}: (.+)$`, 'm')) || [])[1];

PAGES.forEach(file => {
  const mdFile = file.replace(/\.html$/, '.md');
  const html = read(file);

  test(`${file}: links its Markdown copy from the head`, () => {
    const link = html.indexOf(`<link rel="alternate" type="text/markdown" href="${mdFile}">`);
    assert.ok(link > -1);
    assert.ok(link < html.indexOf('</head>'));
  });

  test(`${mdFile}: exists and opens with YAML frontmatter`, () => {
    assert.ok(fs.existsSync(path.join(root, mdFile)), `missing ${mdFile}`);
    assert.match(read(mdFile), /^---\n[\s\S]+?\n---\n/);
  });

  test(`${mdFile}: title and description match the page`, () => {
    const md = read(mdFile);
    assert.equal(frontmatterField(md, 'title'), toText(html.match(/<title>([^<]*)<\/title>/)[1]));
    assert.equal(frontmatterField(md, 'description'), html.match(/<meta name="description"\s+content="([^"]*)"/)[1]);
  });

  test(`${mdFile}: has a heading for every heading on the page`, () => {
    const mdHeadings = markdownHeadings(read(mdFile));
    htmlHeadings(html).forEach(heading => assert.ok(mdHeadings.includes(heading), `${mdFile} missing heading: ${heading}`));
  });
});

test('toText: drops hidden hints, tags and entities', () => {
  const html = '<button><span>Asset &amp; Owners</span>\n <span class="hint" aria-hidden="true">Click <span>→</span></span></button>';
  assert.equal(toText(html), 'Asset & Owners');
});
