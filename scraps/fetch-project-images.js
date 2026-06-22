'use strict';

const urls = [
  { slug: 'leaders', url: 'https://egoz.org.il/projects/leaders/' },
  { slug: 'catching-direction', url: 'https://egoz.org.il/projects/catching-direction-bat-yam/' },
  { slug: 'release', url: 'https://egoz.org.il/projects/pleasat-release/' },
  { slug: 'ambassadors', url: 'https://egoz.org.il/projects/egoz-embassadors/' },
  { slug: 'mutual-help', url: 'https://egoz.org.il/projects/mutal-help/' },
  { slug: 'networking', url: 'https://egoz.org.il/projects/networking/' }
];

function pickImage(html) {
  const og = html.match(/property="og:image"\s+content="([^"]+)"/i);
  if (og) return og[1];

  const twitter = html.match(/name="twitter:image"\s+content="([^"]+)"/i);
  if (twitter) return twitter[1];

  const uploads = html.match(/https?:\/\/egoz\.org\.il\/wp-content\/uploads\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)/gi);
  if (uploads && uploads.length) return uploads[0];

  return null;
}

(async () => {
  for (const item of urls) {
    const res = await fetch(item.url);
    const html = await res.text();
    const image = pickImage(html);
    console.log(JSON.stringify({ slug: item.slug, url: item.url, image }));
  }
})();
