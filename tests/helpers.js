// Shared by the tests: the pages ship without copy, so text-based assertions
// run against the page with lang/en.json applied, the way a browser shows it.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const en = JSON.parse(fs.readFileSync(path.join(root, 'lang', 'en.json'), 'utf8'));

const escapeText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const get = key => {
  if (!Object.hasOwn(en, key)) throw new Error(`lang/en.json has no key "${key}"`);
  return en[key];
};

// Fills data-i18n / data-i18n-html / data-i18n-attr from en.json, then drops
// those attributes and the <i18n-t> wrappers so the result reads like the
// original, hand-written markup.
function render(html) {
  return html
    .replace(/(<([a-z][a-z0-9-]*)\b[^>]*\sdata-i18n(-html)?="([^"]+)"[^>]*>)(<\/\2>)/g,
      (m, open, tag, isHtml, key, close) => open + (isHtml ? get(key) : escapeText(get(key))) + close)
    .replace(/<[a-z][^>]*\sdata-i18n-attr="([^"]+)"[^>]*>/g, (tag, pairs) => {
      pairs.split(';').forEach(pair => {
        const i = pair.indexOf(':');
        tag = tag.replace(`${pair.slice(0, i)}=""`, `${pair.slice(0, i)}="${escapeAttr(get(pair.slice(i + 1)))}"`);
      });
      return tag;
    })
    .replace(/\sdata-i18n(?:-html|-attr)?="[^"]*"/g, '')
    .replace(/<\/?i18n-t>/g, '');
}

module.exports = { en, render, t: get };
