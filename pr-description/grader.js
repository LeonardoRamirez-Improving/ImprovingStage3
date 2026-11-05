#!/usr/bin/env node
/**
 * Retry wrapper around ../devin.js, used only as the rubric grader.
 *
 * The Devin CLI occasionally returns an empty stdout for a grader call, which
 * promptfoo records as a failed assertion ("No output"). The judgment itself is
 * fine on a retry, so this wrapper retries an empty/failed call instead of
 * turning a transport hiccup into a false failure.
 *
 * It is deliberately NOT used as the model under test: retrying a generation
 * would hide real instability in the prompt.
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const [prompt, options] = process.argv.slice(2);
const target = path.join(__dirname, '..', 'devin.js');
const MAX_ATTEMPTS = 3;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = spawnSync(process.execPath, [target, prompt, options], { encoding: 'utf8' });
  const out = (result.stdout || '').trim();

  if (result.status === 0 && out) {
    process.stdout.write(result.stdout);
    process.exit(0);
  }

  if (attempt === MAX_ATTEMPTS) {
    process.stderr.write(
      result.stderr || `grader returned empty output after ${MAX_ATTEMPTS} attempts\n`,
    );
    process.exit(result.status || 1);
  }
}
