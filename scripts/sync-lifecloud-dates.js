#!/usr/bin/env node
'use strict';

/**
 * Sync fall_date from LifeCloud profiles for fallen with egoz.org.il links
 * that redirect to lifecloud-qr.com.
 *
 * Format: DD.MM.YYYY - DD.MM.YYYY | City
 *
 * Usage:
 *   node scripts/sync-lifecloud-dates.js           # preview
 *   node scripts/sync-lifecloud-dates.js --apply   # write SQL file only
 *   node scripts/sync-lifecloud-dates.js --json    # write preview JSON
 */

const fs = require('fs');
const path = require('path');

const API = 'https://api.lifecloud-qr.com/api/profiles';
const DELAY_MS = 120;

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatIsoDate(iso) {
  if (!iso) return '';
  var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  var year = m[1];
  if (year.startsWith('000') && year.length === 4) {
    year = '2' + year.slice(1);
  }
  return pad2(m[3]) + '.' + pad2(m[2]) + '.' + year;
}

function formatFallDate(profile) {
  var birth = formatIsoDate(profile.birthDate);
  var death = formatIsoDate(profile.deathDate);
  var city = String(profile.city || '').trim();
  if (!birth && !death) return '';
  var dates = birth && death ? birth + ' - ' + death : (birth || death);
  return city ? dates + ' | ' + city : dates;
}

function escSql(value) {
  return String(value || '').replace(/'/g, "''");
}

async function resolveLifecloudUrl(egozUrl) {
  var res = await fetch(egozUrl, { redirect: 'manual' });
  var loc = res.headers.get('location') || '';
  if (res.status >= 300 && res.status < 400 && loc) {
    if (!loc.startsWith('http')) loc = 'https://egoz.org.il' + loc;
    if (loc.includes('lifecloud-qr.com')) {
      if (!loc.includes('www.')) loc = loc.replace('https://lifecloud-qr.com', 'https://www.lifecloud-qr.com');
      return loc.replace(/\/$/, '');
    }
    var res2 = await fetch(loc, { redirect: 'manual' });
    var loc2 = res2.headers.get('location') || '';
    if (loc2.includes('lifecloud-qr.com')) {
      if (!loc2.includes('www.')) loc2 = loc2.replace('https://lifecloud-qr.com', 'https://www.lifecloud-qr.com');
      return loc2.replace(/\/$/, '');
    }
  }
  return '';
}

function profileIdFromUrl(url) {
  var m = String(url || '').match(/\/profile\/([a-f0-9]+)/i);
  return m ? m[1] : '';
}

async function fetchProfile(id) {
  var res = await fetch(API + '/' + id);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  var json = await res.json();
  return json && json.data && json.data.data ? json.data.data : null;
}

async function loadFallenList() {
  var jsonPath = path.join(__dirname, '..', 'scraps', 'fallen-import.json');
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8')).items.map(function (item) {
      return { name: item.name, memorial_url: item.memorial_url, fall_date: item.fall_date || '' };
    });
  }
  throw new Error('Missing scraps/fallen-import.json');
}

async function main() {
  var apply = process.argv.includes('--apply');
  var writeJson = process.argv.includes('--json') || !apply;
  var fallen = await loadFallenList();
  var results = [];
  var updates = [];

  for (var i = 0; i < fallen.length; i++) {
    var item = fallen[i];
    var row = {
      name: item.name,
      memorial_url: item.memorial_url,
      previous_fall_date: item.fall_date || '',
      lifecloud_url: '',
      fall_date: '',
      status: 'pending',
    };

    try {
      row.lifecloud_url = await resolveLifecloudUrl(item.memorial_url);
      if (!row.lifecloud_url) {
        row.status = 'no-lifecloud';
        results.push(row);
        await sleep(DELAY_MS);
        continue;
      }

      var id = profileIdFromUrl(row.lifecloud_url);
      if (!id) {
        row.status = 'bad-url';
        results.push(row);
        continue;
      }

      var profile = await fetchProfile(id);
      if (!profile) {
        row.status = 'no-profile';
        results.push(row);
        continue;
      }

      row.fall_date = formatFallDate(profile);
      row.status = row.fall_date ? 'ok' : 'empty-profile';
      if (row.fall_date && row.fall_date !== row.previous_fall_date) {
        updates.push(row);
      }
    } catch (err) {
      row.status = 'error';
      row.error = err.message;
    }

    results.push(row);
    process.stdout.write('\r' + (i + 1) + '/' + fallen.length + ' ' + item.name.slice(0, 20));
    await sleep(DELAY_MS);
  }

  console.log('\n');
  var ok = results.filter(function (r) { return r.status === 'ok'; });
  var noLc = results.filter(function (r) { return r.status === 'no-lifecloud'; });
  console.log('LifeCloud profiles:', ok.length);
  console.log('No LifeCloud redirect:', noLc.length);
  console.log('Updates needed:', updates.length);

  var outDir = path.join(__dirname, '..', 'scraps');
  if (writeJson) {
    fs.writeFileSync(path.join(outDir, 'lifecloud-dates.json'), JSON.stringify({ results: results, updates: updates }, null, 2), 'utf8');
    console.log('Wrote scraps/lifecloud-dates.json');
  }

  if (updates.length) {
    var sql = [
      '-- Sync fall_date from LifeCloud profiles',
      'BEGIN;',
    ];
    updates.forEach(function (row) {
      sql.push(
        "UPDATE public.fallen_soldiers SET fall_date = '" + escSql(row.fall_date) + "', updated_at = now()" +
        " WHERE memorial_url = '" + escSql(row.memorial_url) + "';"
      );
    });
    sql.push('COMMIT;');
    fs.writeFileSync(path.join(outDir, 'lifecloud-dates.sql'), sql.join('\n') + '\n', 'utf8');
    console.log('Wrote scraps/lifecloud-dates.sql (' + updates.length + ' updates)');
  }

  if (apply) {
    console.log('Use Supabase MCP or run SQL from scraps/lifecloud-dates.sql');
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
