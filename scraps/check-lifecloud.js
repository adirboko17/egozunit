'use strict';
const bad = [
  { name: 'דוד יהודה יצחק', url: 'https://egoz.org.il/fallen/%d7%93%d7%95%d7%93-%d7%99%d7%94%d7%95%d7%93%d7%94-%d7%99%d7%a6%d7%97%d7%a7-%d7%96%d7%9c/' },
  { name: 'איתמר אלחרר', url: 'https://egoz.org.il/fallen/%d7%90%d7%99%d7%aa%d7%9e%d7%a8-%d7%90%d7%9c%d7%97%d7%a8%d7%a8/' },
  { name: 'אופק אהרון', url: 'https://egoz.org.il/fallen/%d7%90%d7%95%d7%a4%d7%a7-%d7%90%d7%94%d7%a8%d7%95%d7%9f/' },
];

async function main() {
  for (const item of bad) {
    const r = await fetch(item.url);
    const html = await r.text();
    const links = [...html.matchAll(/https?:\/\/[^"'\s<>]*lifecloud[^"'\s<>]*/gi)].map((m) => m[0]);
    console.log('\n===', item.name, '===');
    console.log('status:', r.status);
    console.log('lifecloud in page:', [...new Set(links)]);
  }
}

main().catch(console.error);
