'use strict';

const API = 'https://egoz.org.il/wp-json/wp/v2/benefits?per_page=50&_embed';

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

(async () => {
  const res = await fetch(API);
  const posts = await res.json();
  posts.forEach(function (p, i) {
    const title = stripHtml(p.title?.rendered);
    const content = stripHtml(p.content?.rendered);
    const img = p._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
    console.log(JSON.stringify({
      i: i + 1,
      slug: p.slug,
      title,
      content: content.slice(0, 200),
      img,
      link: p.link
    }, null, 2));
    console.log('---');
  });
})();
