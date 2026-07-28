'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PUBLIC_PAGES = [
  'accessibility',
  'account',
  'ambassadors',
  'benefits',
  'bylaws',
  'contact',
  'donate',
  'event',
  'events',
  'foundation',
  'heritage',
  'join',
  'login',
  'privacy',
  'projects',
  'shop',
  'support',
  'unit',
  'yizkor'
];

const ADMIN_PAGES = [
  'ambassadors',
  'benefits',
  'events',
  'index',
  'jobs',
  'login',
  'media',
  'members',
  'projects',
  'shop',
  'yizkor'
];

function collectFiles(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'scraps' || entry.name === 'node_modules' || entry.name === '.git') continue;
      collectFiles(full, acc);
      continue;
    }
    if (/\.(html|js)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function replaceAll(content, from, to) {
  if (!content.includes(from)) return content;
  return content.split(from).join(to);
}

function updateContent(content) {
  let next = content;

  next = replaceAll(next, 'href="index.html#', 'href="/#');
  next = replaceAll(next, "href='index.html#", "href='/#");
  next = replaceAll(next, 'href="./index.html#', 'href="/#');
  next = replaceAll(next, 'href="index.html"', 'href="/"');
  next = replaceAll(next, "href='index.html'", "href='/'");
  next = replaceAll(next, 'href="./index.html"', 'href="/"');

  for (const page of PUBLIC_PAGES) {
    const file = page + '.html';
    const url = page === 'index' ? '/' : '/' + page;

    next = replaceAll(next, 'href="' + file + '#', 'href="' + url + '#');
    next = replaceAll(next, 'href="' + file + '?', 'href="' + url + '?');
    next = replaceAll(next, 'href="./' + file + '"', 'href="' + url + '"');
    next = replaceAll(next, 'href="./' + file + '#', 'href="' + url + '#');
    next = replaceAll(next, 'href="./' + file + '?', 'href="' + url + '?');
    next = replaceAll(next, 'href="' + file + '"', 'href="' + url + '"');
    next = replaceAll(next, "href='" + file + "'", "href='" + url + "'");
    next = replaceAll(next, "href='" + file + "#'", "href='" + url + "#'");
    next = replaceAll(next, "href='" + file + "?'", "href='" + url + "?'");

    next = replaceAll(next, '[href="' + file + '"]', '[href="' + url + '"]');
    next = replaceAll(next, '[href="./' + file + '"]', '[href="' + url + '"]');

    next = replaceAll(next, "'" + file + "?'", "'" + url + "?'");
    next = replaceAll(next, '"' + file + '?', '"' + url + '?');
    next = replaceAll(next, "'" + file + "#'", "'" + url + "#'");
    next = replaceAll(next, '"' + file + '#', '"' + url + '#');
    next = replaceAll(next, "'" + file + "'", "'" + url + "'");
    next = replaceAll(next, '"' + file + '"', '"' + url + '"');
    next = replaceAll(next, ' ' + file + ' ', ' ' + url + ' ');
  }

  for (const page of ADMIN_PAGES) {
    const file = page + '.html';
    const fromRoot = '/admin/' + file;
    const to = page === 'index' ? '/admin' : '/admin/' + page;

    next = replaceAll(next, 'href="' + fromRoot + '"', 'href="' + to + '"');
    next = replaceAll(next, 'href="' + fromRoot + '?', 'href="' + to + '?');
    next = replaceAll(next, "href='" + fromRoot + "'", "href='" + to + "'");
    next = replaceAll(next, "href='" + fromRoot + "?'", "href='" + to + "?'");
    next = replaceAll(next, "'" + fromRoot + "'", "'" + to + "'");
    next = replaceAll(next, '"' + fromRoot + '"', '"' + to + '"');
    next = replaceAll(next, '"' + fromRoot + '?', '"' + to + '?');
    next = replaceAll(next, 'window.location.replace(' + fromRoot, 'window.location.replace(' + to);
  }

  next = replaceAll(next, "window.location.origin + '/join.html?step=2'", "window.location.origin + '/join?step=2'");
  next = replaceAll(next, 'donatePage: \'donate.html\'', "donatePage: '/donate'");
  next = replaceAll(next, 'donatePage: "donate.html"', 'donatePage: "/donate"');

  return next;
}

const files = collectFiles(ROOT, []).filter(function (file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel.startsWith('scraps/')) return false;
  if (rel.startsWith('scripts/update-clean-urls.js')) return false;
  return true;
});

let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = updateContent(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    changed += 1;
    console.log('updated', path.relative(ROOT, file));
  }
}

console.log('\nDone. Updated ' + changed + ' file(s).');
