#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const API = 'https://egoz.org.il/wp-json/wp/v2/projects?per_page=20&_embed';
const OUT_DIR = path.join(__dirname, '..', 'assets', 'projects');

const SLUG_MAP = {
  leaders: 'leaders',
  'catching-direction-bat-yam': 'catching-direction',
  'pleasat-release': 'release',
  'egoz-embassadors': 'ambassadors',
  'mutal-help': 'mutual-help',
  networking: 'networking'
};

const EXTRA_GALLERY = {
  leaders: ['https://egoz.org.il/wp-content/uploads/2020/08/הופמן-2-1.jpg'],
  'catching-direction': ['https://egoz.org.il/wp-content/uploads/2020/04/WhatsApp-Image-2020-04-21-at-18.44.40-2.jpeg'],
  release: ['https://egoz.org.il/wp-content/uploads/2020/04/שחרור-נעים-2-1.jpg'],
  ambassadors: [
    'https://egoz.org.il/wp-content/uploads/2020/04/קמפיין-שגרירים.jpg',
    'https://egoz.org.il/wp-content/uploads/2020/04/קמפין-שגרירים-2-1.jpg'
  ],
  networking: ['https://egoz.org.il/wp-content/uploads/2020/04/נטוורקינג-2.png']
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

function extFromUrl(url) {
  const m = String(url).match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

function sqlEscape(value) {
  return String(value || '').replace(/'/g, "''");
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Download failed ' + res.status + ' ' + url);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const res = await fetch(API);
  const posts = await res.json();
  const updates = [];

  for (const post of posts) {
    const slug = SLUG_MAP[post.slug];
    if (!slug) continue;

    const featured = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const body = stripHtml(post.content?.rendered);
    const galleryLocal = [];

    for (let i = 0; i < (EXTRA_GALLERY[slug] || []).length; i++) {
      const url = EXTRA_GALLERY[slug][i];
      const ext = extFromUrl(url);
      const filename = slug + '-gallery-' + (i + 1) + '.' + ext;
      const dest = path.join(OUT_DIR, filename);
      await download(url, dest);
      galleryLocal.push('/assets/projects/' + filename);
    }

    updates.push({ slug, body, galleryLocal });
    console.log('OK', slug, 'gallery:', galleryLocal.length);
  }

  const sql = updates.map(function (u) {
    const galleryJson = JSON.stringify(u.galleryLocal);
    return "UPDATE public.site_projects SET body = '" + sqlEscape(u.body) + "', gallery_urls = '" + sqlEscape(galleryJson) + "'::jsonb WHERE slug = '" + u.slug + "';";
  }).join('\n');

  fs.writeFileSync(path.join(__dirname, '..', 'scraps', 'project-content.sql'), sql + '\n', 'utf8');
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
