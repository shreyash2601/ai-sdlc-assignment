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
- **Execution Date:** 2026-11-11T14:30:06.577Z
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
    "stdout": "✔ AC-1: POST /tasks creates a task with valid fields and returns 201 (4.935375ms)\n✖ AC-2: POST /tasks rejects missing or blank title with 400 (1.283167ms)\n✔ AC-3: POST /tasks rejects invalid priority with 400 (1.077666ms)\n✔ AC-4: GET /tasks filters by tag (case-insensitive) (1.522834ms)\n✔ AC-5: GET /tasks sorts by priority desc (urgent > high > medium > low) (2.18575ms)\n✔ AC-6: PATCH /tasks/:id/status transitions from pending to in_progress with 200 (1.154917ms)\n✖ AC-7: PATCH /tasks/:id/status rejects illegal transition with 400 (1.182334ms)\n✔ AC-8: GET /tasks/:id with unknown ID returns 404 (0.194375ms)\n✔ AC-9: DELETE /tasks/:id deletes task and subsequent GET returns 404 (0.728417ms)\n✔ AC-10: Persistence reloads tasks from JSON file after recreation (0.397209ms)\n✔ Edge: Malformed JSON body returns 400 (0.254417ms)\n✔ Edge: Dynamic overdue flag calculation (0.778417ms)\nℹ tests 12\nℹ suites 0\nℹ pass 10\nℹ fail 2\nℹ cancelled 0\nℹ skipped 0\nℹ todo 0\nℹ duration_ms 66.002625\n\n✖ failing tests:\n\ntest at tests/task.test.js:110:1\n✖ AC-2: POST /tasks rejects missing or blank title with 400 (1.283167ms)\n  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:\n  \n  201 !== 400\n  \n      at /Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:117:12\n      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)\n      at async withApp (/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:75:5)\n      at async TestContext.<anonymous> (/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:111:3)\n      at async Test.run (node:internal/test_runner/test:1313:7)\n      at async Test.processPendingSubtests (node:internal/test_runner/test:897:7) {\n    generatedMessage: true,\n    code: 'ERR_ASSERTION',\n    actual: 201,\n    expected: 400,\n    operator: 'strictEqual',\n    diff: 'simple'\n  }\n\ntest at tests/task.test.js:203:1\n✖ AC-7: PATCH /tasks/:id/status rejects illegal transition with 400 (1.182334ms)\n  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:\n  \n  200 !== 400\n  \n      at /Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:225:12\n      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)\n      at async withApp (/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:75:5)\n      at async TestContext.<anonymous> (/Users/shreyashpawar/Myself/My Projects/ai-sdlc-assignment/Part-1A/tests/task.test.js:204:3)\n      at async Test.run (node:internal/test_runner/test:1313:7)\n      at async Test.processPendingSubtests (node:internal/test_runner/test:897:7) {\n    generatedMessage: true,\n    code: 'ERR_ASSERTION',\n    actual: 200,\n    expected: 400,\n    operator: 'strictEqual',\n    diff: 'simple'\n  }\n",
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
