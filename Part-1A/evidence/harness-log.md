# Harness Execution & Verification Log: Part 1A (Smart Task REST API)

## 1. Specification Context & Initial Generation
- **Target Specification:** `specs/smart-task-api/spec.md`
- **Task Reference:** TASK-002 (Domain Model & Validation Logic) and TASK-007 (Deterministic Harness Engineering)
- **Approved Constraints:**
  - Mandatory title non-empty string after trimming (`spec.md` AC-2)
  - Controlled status transitions rejecting invalid state jumps (`spec.md` AC-7)
  - Pure CommonJS without external third-party dependencies (`constitution.md` §1)
  - Exact assertions: `assert.strictEqual(res.status, 201)`, `assert.strictEqual(res.status, 400)`

## 2. Harness Execution History

### Attempt 1: Initial AI Generation
- **Execution Date:** 2026-11-06T14:09:02.453Z
- **Gate 1 (Syntax & Lint):** PASSED (0 findings)
- **Gate 2 (SAST Security):** PASSED (0 findings)
- **Gate 3 (Contract & Unit Tests):** **FAILED**
- **Observed Failures in Attempt 1:**
  1. `AC-2 (POST /tasks rejects missing or blank title with 400)`: The model initially checked `title === ''`, allowing whitespace strings like `"   "` to pass through and return HTTP 201 instead of 400.
  2. `AC-7 (PATCH /tasks/:id/status rejects illegal transition with 400)`: The model allowed arbitrary status changes without consulting the transition state-machine matrix (`completed` $\rightarrow$ `in_progress` returned 200 instead of 400).
- **Harness Sensor Output:** Saved to `evidence/harness-results/sensor-report-attempt1.json`.

### Failure Evidence Fed Back to Coding Agent
```json
[
  {
    "gate": "TEST_GUARD",
    "code": "TEST_ASSERTION_FAILURE",
    "file": "tests/task.test.js",
    "message": "Automated test suite failed with exit code 1.",
    "stdout": "TAP version 13\n# Subtest: AC-1: POST /tasks creates a task with valid fields and returns 201\nok 1 - AC-1: POST /tasks creates a task with valid fields and returns 201\n  ---\n  duration_ms: 8.536416\n  type: 'test'\n  ...\n# Subtest: AC-2: POST /tasks rejects missing or blank title with 400\nnot ok 2 - AC-2: POST /tasks rejects missing or blank title with 400\n  ---\n  duration_ms: 2.906375\n  type: 'test'\n  location: '/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:110:1'\n  failureType: 'testCodeFailure'\n  error: |-\n    Expected values to be strictly equal:\n    \n    201 !== 400\n    \n  code: 'ERR_ASSERTION'\n  name: 'AssertionError'\n  expected: 400\n  actual: 201\n  operator: 'strictEqual'\n  stack: |-\n    /Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:117:12\n    process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    async withApp (/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:75:5)\n    async TestContext.<anonymous> (/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:111:3)\n    async Test.run (node:internal/test_runner/test:1054:7)\n    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)\n  ...\n# Subtest: AC-3: POST /tasks rejects invalid priority with 400\nok 3 - AC-3: POST /tasks rejects invalid priority with 400\n  ---\n  duration_ms: 1.264125\n  type: 'test'\n  ...\n# Subtest: AC-4: GET /tasks filters by tag (case-insensitive)\nok 4 - AC-4: GET /tasks filters by tag (case-insensitive)\n  ---\n  duration_ms: 3.997584\n  type: 'test'\n  ...\n# Subtest: AC-5: GET /tasks sorts by priority desc (urgent > high > medium > low)\nok 5 - AC-5: GET /tasks sorts by priority desc (urgent > high > medium > low)\n  ---\n  duration_ms: 3.825167\n  type: 'test'\n  ...\n# Subtest: AC-6: PATCH /tasks/:id/status transitions from pending to in_progress with 200\nok 6 - AC-6: PATCH /tasks/:id/status transitions from pending to in_progress with 200\n  ---\n  duration_ms: 2.302\n  type: 'test'\n  ...\n# Subtest: AC-7: PATCH /tasks/:id/status rejects illegal transition with 400\nnot ok 7 - AC-7: PATCH /tasks/:id/status rejects illegal transition with 400\n  ---\n  duration_ms: 2.401042\n  type: 'test'\n  location: '/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:203:1'\n  failureType: 'testCodeFailure'\n  error: |-\n    Expected values to be strictly equal:\n    \n    200 !== 400\n    \n  code: 'ERR_ASSERTION'\n  name: 'AssertionError'\n  expected: 400\n  actual: 200\n  operator: 'strictEqual'\n  stack: |-\n    /Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:225:12\n    process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    async withApp (/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:75:5)\n    async TestContext.<anonymous> (/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:204:3)\n    async Test.run (node:internal/test_runner/test:1054:7)\n    async Test.processPendingSubtests (node:internal/test_runner/test:744:7)\n  ...\n# Subtest: AC-8: GET /tasks/:id with unknown ID returns 404\nok 8 - AC-8: GET /tasks/:id with unknown ID returns 404\n  ---\n  duration_ms: 0.369541\n  type: 'test'\n  ...\n# Subtest: AC-9: DELETE /tasks/:id deletes task and subsequent GET returns 404\nok 9 - AC-9: DELETE /tasks/:id deletes task and subsequent GET returns 404\n  ---\n  duration_ms: 2.30075\n  type: 'test'\n  ...\n# Subtest: AC-10: Persistence reloads tasks from JSON file after recreation\nok 10 - AC-10: Persistence reloads tasks from JSON file after recreation\n  ---\n  duration_ms: 1.799708\n  type: 'test'\n  ...\n# Subtest: Edge: Malformed JSON body returns 400\nok 11 - Edge: Malformed JSON body returns 400\n  ---\n  duration_ms: 0.596791\n  type: 'test'\n  ...\n# Subtest: Edge: Dynamic overdue flag calculation\nok 12 - Edge: Dynamic overdue flag calculation\n  ---\n  duration_ms: 1.940417\n  type: 'test'\n  ...\n1..12\n# tests 12\n# suites 0\n# pass 10\n# fail 2\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 104.234666\n",
    "stderr": ""
  }
]
```

### Attempt 2: Bounded Self-Healing Repair
- **Repair Actions Applied:**
  1. Updated `Task.validateTitle()` in `src/models/task.js` to evaluate `typeof title !== 'string' || title.trim() === ''`.
  2. Implemented `ALLOWED_TRANSITIONS` matrix enforcement in `Task.transitionStatus()`:
     - `completed` $\rightarrow$ can only transition back to `pending` (re-opening). Direct transitions to `in_progress` or `cancelled` throw an explicit error returning HTTP 400.
- **Gate 1 (Syntax & Lint):** PASSED (0 findings)
- **Gate 2 (SAST Security):** PASSED (0 findings)
- **Gate 3 (Contract & Unit Tests):** **PASSED** (12/12 tests passing)
- **Harness Sensor Output:** Saved to `evidence/harness-results/sensor-report.json`.

## 3. Human Review & Acceptance Decision
- **Final Decision:** **ACCEPT**
- **Justification:** The implementation satisfies 100% of the binary acceptance criteria (AC-1 through AC-10). The failure in Attempt 1 was resolved without weakening assertions or changing the specification. Zero security vulnerabilities or unhandled exceptions detected.
- **Known Limitations & Residual Risks:**
  - File-based JSON persistence does not support distributed horizontal scaling across multiple servers (single-process locking only).
  - High concurrency bursts may encounter file write serialization latency.
