#!/usr/bin/env node
'use strict';

/**
 * Import fallen soldiers from https://egoz.org.il/memorial/
 * Uses the public WordPress REST API (post type: fallen).
 *
 * Usage:
 *   node scripts/import-fallen-from-egoz.js              # preview only
 *   node scripts/import-fallen-from-egoz.js --apply      # write to Supabase (needs SUPABASE_SERVICE_ROLE_KEY in .env)
 *   node scripts/import-fallen-from-egoz.js --apply --upload-images   # also copy images to Supabase storage
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const API_BASE = 'https://egoz.org.il/wp-json/wp/v2/fallen';
const PER_PAGE = 100;

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(function (line) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (!m) return;
    out[m[1]] = m[2].trim();
  });
  return out;
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function formatDate(match) {
  if (!match) return '';
  return padDatePart(match[1]) + '.' + padDatePart(match[2]) + '.' + match[3];
}

function extractFallDate(html) {
  var text = decodeHtml(html);
  var birth = '';
  var death = '';
  var location = '';

  var bornIdx = text.indexOf('נולד');
  if (bornIdx !== -1) {
    var bornChunk = text.slice(bornIdx, bornIdx + 220);
    var birthMatch = bornChunk.match(/\((\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})\)/);
    birth = formatDate(birthMatch);
  }

  var fallMatches = [];
  var re = /נפל[\s\S]{0,500}?\((\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})\)/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    fallMatches.push(m);
  }
  if (fallMatches.length) {
    death = formatDate(fallMatches[fallMatches.length - 1]);
  }

  var locMatch = text.match(/בית[- ]הקברות ב([\u0590-\u05FF\-]+?)(?:\s|\.|ערב)/);
  if (locMatch) {
    location = locMatch[1].replace(/-/g, ' ').trim();
  } else {
    var cityMatch = text.match(/השתקעו ב([\u0590-\u05FF\-]+?)\s/);
    if (cityMatch) location = cityMatch[1].replace(/-/g, ' ').trim();
  }

  if (birth && death) {
    return birth + ' - ' + death + (location ? ' | ' + location : '');
  }
  if (death) return death + (location ? ' | ' + location : '');
  return '';
}

function getFeaturedImage(post) {
  var media = post._embedded && post._embedded['wp:featuredmedia'];
  if (!media || !media[0]) return '';
  return media[0].source_url || '';
}

async function fetchAllFallen() {
  var page = 1;
  var all = [];

  while (true) {
    var url = API_BASE + '?per_page=' + PER_PAGE + '&page=' + page + '&_embed=1';
    var res = await fetch(url);
    if (!res.ok) {
      if (res.status === 400 && page > 1) break;
      throw new Error('API error ' + res.status + ' for page ' + page);
    }
    var batch = await res.json();
    if (!Array.isArray(batch) || !batch.length) break;
    all = all.concat(batch);
    var totalPages = Number(res.headers.get('x-wp-totalpages') || 1);
    if (page >= totalPages) break;
    page += 1;
  }

  return all;
}

function mapPosts(posts) {
  return posts.map(function (post, index) {
    var content = post.content && post.content.rendered ? post.content.rendered : '';
    return {
      name: decodeHtml(post.title && post.title.rendered),
      fall_date: extractFallDate(content),
      image_url: getFeaturedImage(post),
      memorial_url: post.link || '',
      sort_order: index + 1,
      is_published: true
    };
  }).filter(function (item) {
    return item.name && item.memorial_url;
  });
}

async function downloadBuffer(url) {
  var res = await fetch(url);
  if (!res.ok) throw new Error('Download failed: ' + url);
  return Buffer.from(await res.arrayBuffer());
}

function guessExt(url, contentType) {
  if (contentType && contentType.indexOf('png') !== -1) return 'png';
  if (contentType && contentType.indexOf('webp') !== -1) return 'webp';
  if (contentType && contentType.indexOf('gif') !== -1) return 'gif';
  var ext = (url.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].indexOf(ext) === -1) return 'jpg';
  return ext === 'jpeg' ? 'jpg' : ext;
}

async function uploadImagesToSupabase(items, env) {
  var url = env.SUPABASE_URL;
  var key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY required for --upload-images');

  var bucket = 'shop-products';
  var folder = 'yizkor';

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (!item.image_url || item.image_url.indexOf('supabase.co') !== -1) continue;

    process.stdout.write('Uploading ' + (i + 1) + '/' + items.length + ': ' + item.name + '...\r');

    var res = await fetch(item.image_url);
    if (!res.ok) {
      console.warn('\nSkip image (download failed): ' + item.name);
      continue;
    }
    var buf = Buffer.from(await res.arrayBuffer());
    var ext = guessExt(item.image_url, res.headers.get('content-type'));
    var objectPath = folder + '/' + crypto.randomUUID() + '.' + ext;

    var uploadRes = await fetch(url + '/storage/v1/object/' + bucket + '/' + objectPath, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        apikey: key,
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'x-upsert': 'true'
      },
      body: buf
    });

    if (!uploadRes.ok) {
      console.warn('\nSkip image (upload failed): ' + item.name + ' — ' + (await uploadRes.text()));
      continue;
    }

    item.image_url = url + '/storage/v1/object/public/' + bucket + '/' + objectPath;
  }
  console.log('\nImage upload pass complete.');
}

async function applyToSupabase(items, env) {
  var url = env.SUPABASE_URL;
  var key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env for --apply');
  }

  var res = await fetch(url + '/rest/v1/fallen_soldiers?select=memorial_url', {
    headers: {
      Authorization: 'Bearer ' + key,
      apikey: key
    }
  });
  if (!res.ok) throw new Error('Failed to read existing rows: ' + res.status);
  var existing = await res.json();
  var byUrl = {};
  existing.forEach(function (row) {
    if (row.memorial_url) byUrl[row.memorial_url.replace(/\/$/, '')] = true;
  });

  var inserted = 0;
  var updated = 0;

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var normalizedUrl = item.memorial_url.replace(/\/$/, '');
    var exists = byUrl[normalizedUrl];

    var payload = {
      name: item.name,
      fall_date: item.fall_date,
      image_url: item.image_url || null,
      memorial_url: item.memorial_url,
      sort_order: item.sort_order,
      is_published: true
    };

    var method = exists ? 'PATCH' : 'POST';
    var endpoint = url + '/rest/v1/fallen_soldiers';
    if (exists) endpoint += '?memorial_url=eq.' + encodeURIComponent(normalizedUrl + '/');

    var writeRes = await fetch(endpoint, {
      method: method,
      headers: {
        Authorization: 'Bearer ' + key,
        apikey: key,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!writeRes.ok) {
      var errText = await writeRes.text();
      throw new Error('Write failed for ' + item.name + ': ' + writeRes.status + ' ' + errText);
    }

    if (exists) updated += 1;
    else inserted += 1;
  }

  return { inserted: inserted, updated: updated, total: items.length };
}

async function main() {
  var args = process.argv.slice(2);
  var apply = args.indexOf('--apply') !== -1;
  var uploadImages = args.indexOf('--upload-images') !== -1;
  var env = loadEnv();

  console.log('Fetching fallen list from egoz.org.il ...');
  var posts = await fetchAllFallen();
  console.log('Found ' + posts.length + ' records.');

  var items = mapPosts(posts);
  var outPath = path.join(__dirname, '..', 'scraps', 'fallen-import.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ imported_at: new Date().toISOString(), count: items.length, items: items }, null, 2), 'utf8');
  console.log('Preview saved to scraps/fallen-import.json');

  var missingDates = items.filter(function (i) { return !i.fall_date; }).length;
  var missingImages = items.filter(function (i) { return !i.image_url; }).length;
  console.log('With dates: ' + (items.length - missingDates) + '/' + items.length);
  console.log('With images: ' + (items.length - missingImages) + '/' + items.length);
  console.log('Sample:', JSON.stringify(items[0], null, 2));

  if (uploadImages) {
    await uploadImagesToSupabase(items, env);
  }

  if (!apply) {
    console.log('\nDry run only. To import into Supabase, run:');
    console.log('  node scripts/import-fallen-from-egoz.js --apply');
    console.log('Optional: add --upload-images (requires SUPABASE_SERVICE_ROLE_KEY)');
    return;
  }

  var result = await applyToSupabase(items, env);
  console.log('Import complete:', result);
}

main().catch(function (err) {
  console.error(err.message || err);
  process.exit(1);
});
