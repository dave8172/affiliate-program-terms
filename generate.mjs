// Regenerate README.md from the affterms dataset.
//
// This repo mirrors the free tier of https://affiliateprogramterms.com and only
// the free tier. The free-tier rule is read from the source data rather than
// restated here, so the two cannot drift apart and no record can be published
// by accident.
//
//   node generate.mjs            reads ../affterms/data, writes README.md

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = process.env.AFFTERMS_DATA || '../affterms/data';
const SITE = 'https://affiliateprogramterms.com';

const rows = JSON.parse(readFileSync(`${SRC}/programs.json`, 'utf8'));
const tier = JSON.parse(readFileSync(`${SRC}/free-tier.json`, 'utf8'));

const byslug = new Map(rows.map(r => [r.slug, r]));
// A hard cap since 2026-09-15 (it had been a share of the directory). Read, never restated.
const n = tier.cap;
if (!Number.isInteger(n) || n < 1) throw new Error(`free-tier.json has no usable cap: ${tier.cap}`);
const free = tier.order.filter(s => byslug.has(s)).slice(0, n).map(s => byslug.get(s));

const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
// "not stated" is a finding, not a gap — the site says so and so must this.
const cell = v => (v === null || v === undefined || v === '' ? '*not stated*' : esc(v));
const recurring = r => (r.recurring === true
  ? (r.recurringMonths === 0 ? 'yes, for life' : r.recurringMonths ? `yes, ${r.recurringMonths} mo` : 'yes')
  : r.recurring === false ? 'one-time' : '*not stated*');

const table = free.map(r => [
  `[${esc(r.name)}](${SITE}/program/${r.slug}/)`,
  cell(r.commission),
  recurring(r),
  // 0 is the vendor saying attribution never expires; only null is silence.
  r.cookieDays === 0 ? 'never expires' : r.cookieDays != null ? `${r.cookieDays} d` : '*not stated*',
  cell(r.payoutMin),
  `[source](${r.source}) · ${r.checkedOn}`,
].join(' | ')).map(l => `| ${l} |`).join('\n');

// Every figure below is computed, never typed — a count a human retypes is a
// count that goes stale the next time a record is added, silently and with no
// check anywhere that catches it.
const count = f => free.filter(f).length;
const stat = {
  recurring: count(r => r.recurring === true),
  onetime:   count(r => r.recurring === false),
  recUnknown:count(r => r.recurring === null || r.recurring === undefined),
  noCookie:  count(r => r.cookieDays == null),
  noPayout:  count(r => r.payoutMin == null),
  noRate:    count(r => r.commission == null),
};

const checked = free.map(r => r.checkedOn).sort();
const md = readFileSync('README.template.md', 'utf8')
  .replaceAll('{{TABLE}}', table)
  .replaceAll('{{FREE}}', String(free.length))
  .replaceAll('{{TOTAL}}', String(rows.length))
  .replaceAll('{{PAID}}', String(rows.length - free.length))
  .replaceAll('{{RECURRING}}', String(stat.recurring))
  .replaceAll('{{ONETIME}}', String(stat.onetime))
  .replaceAll('{{RECUNKNOWN}}', String(stat.recUnknown))
  .replaceAll('{{NOCOOKIE}}', String(stat.noCookie))
  .replaceAll('{{NOPAYOUT}}', String(stat.noPayout))
  .replaceAll('{{NORATE}}', String(stat.noRate))
  .replaceAll('{{OLDEST}}', checked[0])
  .replaceAll('{{NEWEST}}', checked[checked.length - 1]);

writeFileSync('README.md', md);
console.log(`README.md written — ${free.length} free of ${rows.length}, checked ${checked[0]}..${checked[checked.length - 1]}`);

// The same free set as a CSV, for dataset hosts (Kaggle, Hugging Face). Column
// names are the dataset's own field names; an empty cell means the vendor does
// not state it, and 0 in recurringMonths / cookieDays means "for life" / "never
// expires", exactly as in the source schema.
const COLS = ['slug', 'name', 'category', 'commission', 'recurring', 'recurringMonths',
  'cookieDays', 'payoutMin', 'payoutMethod', 'network', 'notes', 'url', 'programUrl',
  'source', 'checkedOn'];
const q = v => (v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`);
mkdirSync('data', { recursive: true });
writeFileSync('data/affiliate-program-terms-free.csv',
  COLS.join(',') + '\n' + free.map(r => COLS.map(k => q(r[k])).join(',')).join('\n') + '\n');
console.log(`data/affiliate-program-terms-free.csv written — ${free.length} rows`);
