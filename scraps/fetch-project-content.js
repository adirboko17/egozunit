'use strict';

const API = 'https://egoz.org.il/wp-json/wp/v2/projects?per_page=20&_embed';

const SLUG_MAP = {
  leaders: 'leaders',
  'catching-direction-bat-yam': 'catching-direction',
  'pleasat-release': 'release',
  'egoz-embassadors': 'ambassadors',
  'mutal-help': 'mutual-help',
  networking: 'networking'
};

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function pickGallery(html, featured) {
  const re = /https?:\/\/egoz\.org\.il\/wp-content\/uploads\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)/gi;
  const found = html.match(re) || [];
  const seen = new Set();
  const out = [];
  found.forEach(function (url) {
    const clean = url.split('?')[0];
    if (seen.has(clean)) return;
    if (featured && clean === featured.split('?')[0]) return;
    if (/100x100|300x81|768x208|1024x277|1536x416|600x163|cropped-egoz-icon|elementor\/thumbs|amuta_logo/i.test(clean)) return;
    seen.add(clean);
    out.push(clean);
  });
  return out.slice(0, 4);
}

(async () => {
  const res = await fetch(API);
  const posts = await res.json();
  for (const post of posts) {
    const slug = SLUG_MAP[post.slug];
    if (!slug) continue;
    const page = await fetch('https://egoz.org.il/projects/' + post.slug + '/');
    const html = await page.text();
    const featured = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
    const body = stripHtml(post.content?.rendered || html);
    const gallery = pickGallery(html, featured);
    console.log(JSON.stringify({ slug, bodyLen: body.length, gallery }, null, 2));
  }
})();
