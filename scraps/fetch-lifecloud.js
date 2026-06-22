'use strict';
fetch('https://www.lifecloud-qr.com/profile/63b3d5c04d8d340ed536df08', {
  headers: { 'User-Agent': 'Mozilla/5.0' },
})
  .then((r) => r.text())
  .then((html) => {
    require('fs').writeFileSync('scraps/lifecloud-sample.html', html);
    console.log('len', html.length);
    const patterns = [
      /birth[^]{0,80}/gi,
      /death[^]{0,80}/gi,
      /city[^]{0,80}/gi,
      /place[^]{0,80}/gi,
      /\d{2}\.\d{2}\.\d{4}/g,
    ];
    patterns.forEach((p) => {
      const m = html.match(p);
      if (m) console.log(String(p), m.slice(0, 5));
    });
    const next = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (next) {
      const data = JSON.parse(next[1]);
      require('fs').writeFileSync('scraps/lifecloud-sample.json', JSON.stringify(data, null, 2));
      console.log('next data saved');
    }
  })
  .catch(console.error);
