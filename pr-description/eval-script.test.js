/**
 * Self-check for eval-script.js. No framework: `node eval-script.test.js`.
 *
 * Two goals:
 *  1. a well-formed PR description passes every assertion
 *  2. each failure mode the suite claims to catch actually fails
 *
 * Run it after editing eval-script.js, before spending model calls.
 */

const assert = require('node:assert/strict');
const m = require('./eval-script.js');

const good = `### What is this change?
Adds a PATCH endpoint so support agents can mark an order as Shipped, and records when the status changed.

### Type of change?
- New feature (non-breaking change which adds functionality)

### Why?
Support handles about 400 manual status updates a week over email, each taking 20-40 minutes.

### How?
- Added UpdateStatus endpoint on OrdersController with the Support role.
- Added the UpdateOrderStatusRequest DTO.
- Added UpdateStatusAsync to OrderService.
- Added the StatusUpdatedAt column through a SQL script.
- Added a controller test.

### Requires Manual Database Migration?
Yes.

\`\`\`sql
ALTER TABLE Orders ADD StatusUpdatedAt datetime2 NULL;
\`\`\`

### Anything Else?
None.`;

const ctx = {
  vars: {
    expected_types: '["New feature"]',
    forbidden_types: '["Bug fix","Refactoring","Breaking change","Configuration change"]',
    expected_migration: 'yes',
    expected_sql_token: 'ALTER TABLE',
    must_mention: '["UpdateOrderStatusRequest","PATCH","StatusUpdatedAt"]',
    must_not_mention: '["Redis","Kafka","Dockerfile","appsettings.json"]',
    allowed_paths:
      '["OrdersController.cs","UpdateOrderStatusRequest.cs","OrderService.cs","20261101_add_status_updated_at.sql","OrdersControllerTests.cs"]',
    max_words: 60,
  },
};

let failures = 0;
function check(label, actual, expectedPass) {
  const ok = actual.pass === expectedPass;
  if (!ok) failures += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(34)} ${actual.pass ? 'PASS' : 'FAIL'} — ${actual.reason}`,
  );
}

// --- the happy path passes everything -------------------------------------
check('structure: good output', m.hasStructure(good), true);
check('conciseness: good output', m.conciseWhat(good, ctx), true);
check('type: good output', m.typeOfChange(good, ctx), true);
check('migration: good output', m.migrationDecision(good, ctx), true);
check('grounding: good output', m.grounding(good, ctx), true);

// --- each declared failure mode actually fails ----------------------------
check('structure: title before fields', m.hasStructure(`# PR Description\n\n${good}`), false);
check('structure: field missing', m.hasStructure(good.replace('### Why?\n', '')), false);
check('structure: prose only', m.hasStructure('I added an endpoint and a test.'), false);

check(
  'conciseness: over the limit',
  m.conciseWhat(good.replace(/(Adds a PATCH[\s\S]*?)\n\n### Type/, `${'word '.repeat(61)}\n\n### Type`), ctx),
  false,
);

check(
  'type: full menu kept',
  m.typeOfChange(good.replace('- New feature (non-breaking change which adds functionality)', '- New feature\n- Bug fix\n- Refactoring'), ctx),
  false,
);
check(
  'type: wrong option',
  m.typeOfChange(good.replace('- New feature (non-breaking change which adds functionality)', '- Bug fix'), ctx),
  false,
);

check('migration: No but SQL present', m.migrationDecision(good.replace('Yes.', 'No.'), ctx), false);
check(
  'migration: Yes but no block',
  m.migrationDecision(good.replace(/```sql[\s\S]*?```/, ''), ctx),
  false,
);
check(
  'migration: path inside the block',
  m.migrationDecision(good.replace('ALTER TABLE Orders', '-- src/Infrastructure/x.sql\nALTER TABLE Orders'), ctx),
  false,
);
check(
  'migration: wrong SQL token',
  m.migrationDecision(good.replace('ALTER TABLE Orders', 'DROP TABLE Orders'), ctx),
  false,
);

check('grounding: invented file', m.grounding(`${good}\nAlso updated appsettings.json.`, ctx), false);
check('grounding: invented service', m.grounding(`${good}\nAlso added Redis caching.`, ctx), false);
check('grounding: missing expected token', m.grounding(good.replace('PATCH', 'PUT'), ctx), false);

check('missing-story: asks correctly', m.missingStory('Please provide the User Story for these changes.'), true);
check('missing-story: invents fields', m.missingStory(good), false);
check('missing-story: silent', m.missingStory('Done.'), false);

const breaking = good.replace(
  '### Anything Else?\nNone.',
  '### Anything Else?\nExisting integrations must update to the new field name.',
);
check('breaking-note: consumer impact', m.breakingNote(breaking), true);
check('breaking-note: empty', m.breakingNote(good), false);
check(
  'breaking-note: says compatibility',
  m.breakingNote(good.replace('### Anything Else?\nNone.', '### Anything Else?\nNo backwards compatibility.')),
  true,
);

console.log(failures === 0 ? '\nall checks behaved as expected' : `\n${failures} check(s) did not behave as expected`);
process.exit(failures === 0 ? 0 : 1);
