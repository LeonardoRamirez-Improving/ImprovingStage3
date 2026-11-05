/**
 * Deterministic assertions for the pr-description prompt evaluation.
 *
 * Every function reads its expectations from the test's vars, so one function
 * serves all five fixtures:
 *   expected_types / forbidden_types / expected_migration / expected_sql_token
 *   must_mention / must_not_mention / allowed_paths / max_words
 *
 * Returns { pass, score, reason }.
 */

const FIELDS = [
  'what is this change',
  'type of change',
  'why',
  'how',
  'requires manual database migration',
  'anything else',
];

function normalise(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*/g, '');
}

// "### 1. What is this change?" -> "what is this change"
function normaliseHeading(raw) {
  return raw
    .toLowerCase()
    .replace(/^\s*\d+[.)]\s*/, '')
    .replace(/[?:]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSections(output) {
  const sections = [];
  let current = null;

  for (const line of normalise(output).split('\n')) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.*)$/);
    if (heading) {
      current = { heading: normaliseHeading(heading[1]), body: [] };
      sections.push(current);
    } else if (current) {
      current.body.push(line);
    }
  }

  for (const section of sections) {
    section.body = section.body.join('\n').trim();
  }
  return sections;
}

function sectionBody(output, name) {
  const found = splitSections(output).find(s => s.heading === name);
  return found ? found.body : null;
}

function result(pass, reason) {
  return { pass, score: pass ? 1 : 0, reason };
}

function words(text) {
  return String(text || '').split(/\s+/).filter(Boolean).length;
}

function parseList(value) {
  if (value === undefined || value === null || value === '') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * The six fields, in order, with nothing before the first one and no extras.
 * A title or a closing summary counts as an extra section and fails.
 */
function hasStructure(output) {
  const text = normalise(output).trim();
  if (!text) return result(false, 'empty output');

  const firstLine = text.split('\n').find(line => line.trim());
  if (!/^\s{0,3}#{1,6}\s+/.test(firstLine)) {
    return result(false, `output starts with text, not a field heading: "${firstLine.slice(0, 80)}"`);
  }

  const headings = splitSections(text).map(s => s.heading);
  if (headings.join(' | ') !== FIELDS.join(' | ')) {
    return result(
      false,
      `expected exactly the six fields in order, got: ${headings.join(' | ') || '(none)'}`,
    );
  }

  return result(true, 'all six fields present, in order, no extra sections');
}

/**
 * "What is this change?" must be 5..max_words words. Makes the prompt's
 * conciseness rule observable instead of aspirational.
 */
function conciseWhat(output, context) {
  const body = sectionBody(output, FIELDS[0]);
  if (body === null) return result(false, '"What is this change?" field missing');

  const max = Number(context.vars.max_words || 60);
  const count = words(body);
  if (count < 5) return result(false, `"What is this change?" has ${count} words, too short to be a summary`);
  if (count > max) return result(false, `"What is this change?" has ${count} words, over the ${max}-word limit`);
  return result(true, `"What is this change?" is ${count} words (limit ${max})`);
}

// "New feature (non-breaking change which adds functionality)" -> "new feature"
// Comparing whole labels, not substrings, because "non-breaking change" contains
// "breaking change" and would otherwise trip the forbidden list.
function cleanLabel(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[.:;]+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function labelMatches(label, option) {
  return label === option || label.startsWith(`${option}:`);
}

/**
 * Exactly the relevant option(s) from the Type of change list. Selecting the
 * whole menu, or an option that does not apply, fails.
 */
function typeOfChange(output, context) {
  const body = sectionBody(output, FIELDS[1]);
  if (body === null) return result(false, '"Type of change?" field missing');

  const bullets = body
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^[-*]\s+/.test(line));

  if (bullets.length === 0) return result(false, 'no option selected (expected a bullet list)');
  if (bullets.length > 2) return result(false, `${bullets.length} options selected; the menu was not pruned`);

  const labels = bullets.map(bullet => cleanLabel(bullet.replace(/^[-*]\s+/, '')));
  const expected = parseList(context.vars.expected_types).map(cleanLabel);
  const forbidden = parseList(context.vars.forbidden_types).map(cleanLabel);

  const missing = expected.filter(option => !labels.some(label => labelMatches(label, option)));
  if (missing.length) return result(false, `missing expected type(s): ${missing.join(', ')}`);

  const wrong = forbidden.filter(option => labels.some(label => labelMatches(label, option)));
  if (wrong.length) return result(false, `selected option(s) that do not apply: ${wrong.join(', ')}`);

  return result(true, `selected: ${labels.join(' / ')}`);
}

/**
 * The migration branch, both directions:
 *  yes -> "Yes" + a fenced block with the expected SQL token and no file paths
 *  no  -> "No" and no code block at all
 */
function migrationDecision(output, context) {
  const body = sectionBody(output, FIELDS[4]);
  if (body === null) return result(false, '"Requires Manual Database Migration?" field missing');

  const expected = String(context.vars.expected_migration || '').toLowerCase();
  const block = body.match(/```[a-zA-Z]*\s*\n([\s\S]*?)```/);

  if (expected === 'yes') {
    if (!/\byes\b/i.test(body)) return result(false, 'expected "Yes" but the answer is not affirmative');
    if (!block) return result(false, 'answered Yes but included no SQL code block');

    const token = String(context.vars.expected_sql_token || '').trim();
    if (token && !block[1].toLowerCase().includes(token.toLowerCase())) {
      return result(false, `SQL block does not contain "${token}"`);
    }

    const citation = block[1].match(/(?:[A-Za-z]:\\|src\/|\.cs\b|https?:\/\/)/i);
    if (citation) return result(false, `code block contains a file path or link: "${citation[0]}"`);

    return result(true, `Yes, with a SQL block containing "${token}" and no path citations`);
  }

  if (expected === 'no') {
    if (!/\bno\b/i.test(body)) return result(false, 'expected "No" but the answer is not negative');
    if (block) return result(false, 'answered No but included a code block');
    return result(true, 'No, and no code block');
  }

  return result(false, `unknown expected_migration value: "${expected}"`);
}

/**
 * Two-sided grounding:
 *  - every must_mention appears
 *  - no must_not_mention appears
 *  - every file name in the output is one of the files in the diff
 *    (catches both invented files and workspace leakage)
 */
function grounding(output, context) {
  const lower = String(output || '').toLowerCase();

  const missing = parseList(context.vars.must_mention).filter(token => !lower.includes(token.toLowerCase()));
  const invented = parseList(context.vars.must_not_mention).filter(token => lower.includes(token.toLowerCase()));

  const allowed = parseList(context.vars.allowed_paths).map(p => p.toLowerCase());
  const seen = String(output || '').match(/\b[\w.-]+\.(?:cs|sql|json|md|ya?ml|ts|js)\b/gi) || [];
  const foreign = [...new Set(seen.map(f => f.toLowerCase()))].filter(
    file => allowed.length > 0 && !allowed.some(a => a === file || a.endsWith(`/${file}`)),
  );

  const problems = [];
  if (missing.length) problems.push(`missing: ${missing.join(', ')}`);
  if (invented.length) problems.push(`mentions things absent from the diff: ${invented.join(', ')}`);
  if (foreign.length) problems.push(`files not in the diff: ${foreign.join(', ')}`);

  return problems.length ? result(false, problems.join('; ')) : result(true, 'grounded in the diff');
}

/**
 * A breaking change must say what breaks and what consumers have to do.
 * Phrase-set instead of a single keyword: "existing integrations must update"
 * is a correct answer even when the word "compatibility" never appears.
 */
function breakingNote(output) {
  const body = sectionBody(output, FIELDS[5]);
  if (body === null) return result(false, '"Anything Else?" field missing');

  const lower = body.toLowerCase();
  const signals = [
    'compatib',
    'breaking',
    'consumers',
    'integrations',
    'clients',
    'must update',
    'will break',
    'breaking change',
  ];
  const hit = signals.find(signal => lower.includes(signal));

  return hit
    ? result(true, `states the consumer impact ("${hit}")`)
    : result(false, 'does not state what breaks or what consumers must do');
}

/**
 * No User Story: ask for it, and do not emit any of the six fields.
 */
function missingStory(output) {  const text = normalise(output);
  const headings = splitSections(text).map(s => s.heading);
  const emitted = headings.filter(h => FIELDS.includes(h));

  if (emitted.length) {
    return result(false, `emitted PR field(s) without a User Story: ${emitted.join(', ')}`);
  }

  const asksForStory = /\b(user story|story)\b/i.test(text);
  const asksUser = /\b(provide|share|send|paste|need|please|can you|could you)\b/i.test(text);

  if (!asksForStory || !asksUser) {
    return result(false, 'did not ask the user for the User Story');
  }

  return result(true, 'asked for the User Story and emitted no PR fields');
}

module.exports = {
  hasStructure,
  conciseWhat,
  typeOfChange,
  migrationDecision,
  grounding,
  breakingNote,
  missingStory,
};
