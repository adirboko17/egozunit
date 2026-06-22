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

function extFromUrl(url) {
  const m = String(url).match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Download failed ' + res.status + ' ' + url);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return dest;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const res = await fetch(API);
  const posts = await res.json();
  const updates = [];

  for (const post of posts) {
    const localSlug = SLUG_MAP[post.slug];
    if (!localSlug) continue;

    const imgUrl = post._embedded && post._embedded['wp:featuredmedia'] &&
      post._embedded['wp:featuredmedia'][0] &&
      post._embedded['wp:featuredmedia'][0].source_url;

    if (!imgUrl) {
      console.warn('No image for', post.slug);
      continue;
    }

    const ext = extFromUrl(imgUrl);
    const filename = localSlug + '.' + ext;
    const dest = path.join(OUT_DIR, filename);
    await download(imgUrl, dest);

    updates.push({
      slug: localSlug,
      image_url: '/assets/projects/' + filename,
      title: post.title && post.title.rendered
    });

    console.log('OK', localSlug, '->', filename);
  }

  const sqlLines = updates.map(function (u) {
    return "UPDATE public.site_projects SET slug = '" + u.slug + "', image_url = '" + u.image_url + "' WHERE slug = '" + u.slug + "' OR detail_url LIKE '%#" + u.slug + "' OR detail_url LIKE '%/" + u.slug + "/%';";
  });

  const sqlPath = path.join(__dirname, '..', 'scraps', 'project-images.sql');
  fs.writeFileSync(sqlPath, sqlLines.join('\n') + '\n', 'utf8');
  console.log('\nWrote SQL:', sqlPath);
  console.log(JSON.stringify(updates, null, 2));
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
