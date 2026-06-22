#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const API = 'https://egoz.org.il/wp-json/wp/v2/benefits?per_page=50&_embed';
const OUT_DIR = path.join(__dirname, '..', 'assets', 'benefits');

const META = {
  'suunto-watches': { brand: 'Suunto', category: 'shop' },
  'authentic-family': { brand: 'Authentic', category: 'shop' },
  'pizza-hut': { brand: 'פיצה האט', category: 'shop' },
  village: { brand: 'אחוזת Village', category: 'travel' },
  physiotherapy: { brand: 'ליאור שניאור', category: 'health' },
  garmin: { brand: 'Garmin', category: 'shop' },
  maslolim: { brand: 'מסלולים', category: 'finance' },
  range: { brand: 'מטווח העיר', category: 'shop' },
  insurance: { brand: 'לב-אינטר', category: 'finance' },
  sabres: { brand: 'סברס', category: 'shop' },
  freefit: { brand: 'Freefit', category: 'health' },
  runzone: { brand: 'RunZone', category: 'health' }
};

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseOffer(title) {
  var t = String(title || '');
  var pct = t.match(/(\d+%)/);
  if (pct) return { offer_main: pct[1], offer_sub: ' הנחה' };
  if (/חודש ראשון חינם/.test(t)) return { offer_main: 'חודש ראשון', offer_sub: ' חינם' };
  if (/ללא עלות/.test(t)) return { offer_main: 'ללא עלות', offer_sub: '' };
  if (/^מבצע/.test(t)) return { offer_main: 'מבצע', offer_sub: ' מיוחד' };
  if (/הנחה/.test(t)) return { offer_main: 'הטבה', offer_sub: ' בלעדית' };
  return { offer_main: 'הטבה', offer_sub: '' };
}

function extFromUrl(url) {
  var m = String(url).match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

function sqlEscape(value) {
  return String(value || '').replace(/'/g, "''");
}

async function download(url, dest) {
  var res = await fetch(url);
  if (!res.ok) throw new Error('Download failed ' + res.status + ' ' + url);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  var res = await fetch(API);
  var posts = await res.json();
  var items = [];

  for (var i = 0; i < posts.length; i++) {
    var post = posts[i];
    var slug = post.slug;
    var meta = META[slug] || { brand: slug, category: 'shop' };
    var title = stripHtml(post.title && post.title.rendered);
    var body = stripHtml(post.content && post.content.rendered);
    var offer = parseOffer(title);
    var imgUrl = post._embedded && post._embedded['wp:featuredmedia'] &&
      post._embedded['wp:featuredmedia'][0] &&
      post._embedded['wp:featuredmedia'][0].source_url;

    var imageLocal = null;
    if (imgUrl) {
      var ext = extFromUrl(imgUrl);
      var filename = slug + '.' + ext;
      await download(imgUrl, path.join(OUT_DIR, filename));
      imageLocal = '/assets/benefits/' + filename;
    }

    items.push({
      slug: slug,
      brand_name: meta.brand,
      category: meta.category,
      title: title,
      offer_main: offer.offer_main,
      offer_sub: offer.offer_sub,
      description: body.slice(0, 280),
      body: body,
      image_url: imageLocal,
      redeem_url: 'benefits.html#' + slug,
      sort_order: i + 1,
      is_published: true
    });
    console.log('OK', slug);
  }

  fs.writeFileSync(
    path.join(__dirname, '..', 'scraps', 'benefits-import.json'),
    JSON.stringify(items, null, 2),
    'utf8'
  );

  var sql = "DELETE FROM public.site_benefits;\n\n";
  items.forEach(function (item) {
    sql += "INSERT INTO public.site_benefits (brand_name, category, title, offer_main, offer_sub, description, body, slug, image_url, redeem_url, sort_order, is_published) VALUES (" +
      "'" + sqlEscape(item.brand_name) + "', " +
      "'" + sqlEscape(item.category) + "', " +
      "'" + sqlEscape(item.title) + "', " +
      "'" + sqlEscape(item.offer_main) + "', " +
      "'" + sqlEscape(item.offer_sub) + "', " +
      "'" + sqlEscape(item.description) + "', " +
      "'" + sqlEscape(item.body) + "', " +
      "'" + sqlEscape(item.slug) + "', " +
      (item.image_url ? "'" + sqlEscape(item.image_url) + "'" : 'NULL') + ", " +
      "'" + sqlEscape(item.redeem_url) + "', " +
      item.sort_order + ", true);\n";
  });

  fs.writeFileSync(path.join(__dirname, '..', 'scraps', 'benefits-import.sql'), sql, 'utf8');
  console.log('\nWrote', items.length, 'benefits');
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
