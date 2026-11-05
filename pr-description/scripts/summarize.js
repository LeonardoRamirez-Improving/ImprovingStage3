#!/usr/bin/env node
/**
 * Per-test and per-metric summary of a promptfoo JSON result file.
 *
 *   node scripts/summarize.js evidence/eval-v1-run1.json
 *   node scripts/summarize.js evidence/eval-v1-run1.json --failures
 *
 * Reads only what promptfoo already wrote; it does not re-run anything.
 */

const fs = require('node:fs');

const file = process.argv[2];
const showFailures = process.argv.includes('--failures');
if (!file) {
  console.error('usage: node scripts/summarize.js <results.json> [--failures]');
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = data?.results?.results;
if (!Array.isArray(rows)) {
  console.error(`${file}: no results.results array`);
  process.exit(1);
}

const byTest = new Map();
const metricTotals = new Map();

for (const row of rows) {
  const description = row.testCase?.description || '(no description)';
  if (!byTest.has(description)) byTest.set(description, []);
  byTest.get(description).push(row);

  for (const component of row.gradingResult?.componentResults || []) {
    const metric = component.assertion?.metric;
    if (!metric) continue;
    if (!metricTotals.has(metric)) metricTotals.set(metric, { pass: 0, total: 0 });
    const entry = metricTotals.get(metric);
    entry.total += 1;
    if (component.pass) entry.pass += 1;
  }
}

console.log(`File: ${file}`);
console.log(`Rows: ${rows.length}\n`);

console.log('Per test');
for (const [description, testRows] of byTest) {
  const passed = testRows.filter(row => row.success).length;
  console.log(`  ${passed}/${testRows.length}  ${description}`);
}

console.log('\nPer metric');
for (const [metric, entry] of [...metricTotals].sort()) {
  const pct = ((entry.pass / entry.total) * 100).toFixed(0);
  console.log(`  ${String(entry.pass).padStart(2)}/${String(entry.total).padEnd(2)} ${pct.padStart(3)}%  ${metric}`);
}

if (showFailures) {
  console.log('\nFailures');
  for (const row of rows) {
    for (const component of row.gradingResult?.componentResults || []) {
      if (component.pass) continue;
      const metric = component.assertion?.metric || component.assertion?.type || 'assert';
      console.log(`  [${row.testCase?.description || '?'}] ${metric}: ${component.reason}`);
    }
  }
}
