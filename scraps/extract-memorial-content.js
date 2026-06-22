'use strict';
const fs = require('fs');
const path = require('path');

const pages = [
  { name: 'דוד יהודה יצחק', file: 'fallen-page-דוד-יהודה-יצחק-זל.html', url: 'https://egoz.org.il/fallen/%d7%93%d7%95%d7%93-%d7%99%d7%94%d7%95%d7%93%d7%94-%d7%99%d7%a6%d7%97%d7%a7-%d7%96%d7%9c/' },
  { name: 'איתמר אלחרר', file: 'fallen-page-איתמר-אלחרר.html', url: 'https://egoz.org.il/fallen/%d7%90%d7%99%d7%aa%d7%9e%d7%a8-%d7%90%d7%9c%d7%97%d7%a8%d7%a8/' },
  { name: 'אופק אהרון', file: 'fallen-page-אופק-אהרון.html', url: 'https://egoz.org.il/fallen/%d7%90%d7%95%d7%a4%d7%a7-%d7%90%d7%94%d7%a8%d7%95%d7%9f/' },
];

function extractAbout(html) {
  const match = html.match(/<div id="about"[^>]*>([\s\S]*?)<\/div>\s*<a class="readMore"/);
  if (!match) return '';
  let inner = match[1].trim();
  inner = inner.replace(/^<p>\s*<p>/, '<p>').replace(/<\/p>\s*<\/p>$/, '</p>');
  return inner;
}

const out = {};
for (const page of pages) {
  const html = fs.readFileSync(path.join(__dirname, page.file), 'utf8');
  out[page.url.replace(/\/$/, '')] = {
    name: page.name,
    content: extractAbout(html),
  };
  console.log(page.name, 'chars:', out[page.url.replace(/\/$/, '')].content.length);
}

fs.writeFileSync(path.join(__dirname, '..', 'js', 'yizkor-local-memorials.json'), JSON.stringify(out, null, 2), 'utf8');
