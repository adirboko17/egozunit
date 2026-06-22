const fs = require('fs');
const path = require('path');

const items = JSON.parse(fs.readFileSync(path.join(__dirname, '../scraps/benefits-import.json'), 'utf8'));
const json = JSON.stringify(items);

const sql = [
  'ALTER TABLE public.site_benefits ADD COLUMN IF NOT EXISTS slug text;',
  'ALTER TABLE public.site_benefits ADD COLUMN IF NOT EXISTS image_url text;',
  'ALTER TABLE public.site_benefits ADD COLUMN IF NOT EXISTS body text;',
  'DELETE FROM public.site_benefits;',
  'INSERT INTO public.site_benefits (brand_name, category, title, offer_main, offer_sub, description, body, slug, image_url, redeem_url, sort_order, is_published)',
  'SELECT brand_name, category, title, offer_main, offer_sub, description, body, slug, image_url, redeem_url, sort_order, is_published',
  'FROM jsonb_to_recordset($json$' + json + '$json$::jsonb) AS x(',
  '  brand_name text, category text, title text, offer_main text, offer_sub text,',
  '  description text, body text, slug text, image_url text, redeem_url text,',
  '  sort_order int, is_published boolean',
  ');'
].join('\n');

fs.writeFileSync(path.join(__dirname, '../scraps/benefits-migration.sql'), sql);
console.log('Wrote benefits-migration.sql (' + sql.length + ' bytes)');
