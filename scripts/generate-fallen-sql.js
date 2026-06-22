'use strict';

const fs = require('fs');
const path = require('path');

const data = require('../scraps/fallen-import.json');
const items = data.items.slice().sort(function (a, b) {
  return a.name.localeCompare(b.name, 'he');
});

items.forEach(function (item, index) {
  item.sort_order = index + 1;
});

function esc(value) {
  return String(value == null ? '' : value).replace(/'/g, "''");
}

const values = items.map(function (item) {
  var image = item.image_url ? "'" + esc(item.image_url) + "'" : 'NULL';
  return "('" + esc(item.name) + "','" + esc(item.fall_date) + "'," + image + ",'" + esc(item.memorial_url) + "'," + item.sort_order + ',true)';
}).join(',\n');

const sql = [
  'DELETE FROM public.fallen_soldiers;',
  'INSERT INTO public.fallen_soldiers (name, fall_date, image_url, memorial_url, sort_order, is_published) VALUES',
  values + ';'
].join('\n');

const out = path.join(__dirname, '..', 'scraps', 'fallen-import.sql');
fs.writeFileSync(out, sql, 'utf8');
console.log('Wrote', out, 'with', items.length, 'rows');
