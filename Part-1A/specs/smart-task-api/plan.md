# Technical Plan: Smart Task & Todo REST API

## 1. Architectural Design & Separation of Concerns
The application follows a clean 3-tier modular architecture using Node.js standard library:
- **`src/models/task.js`**: Pure domain entity containing constructor, field sanitization, validation rules, state-transition rules, and JSON serialization.
- **`src/storage/json-storage.js`**: Persistence layer managing disk I/O, atomic file writes (`fs.writeFileSync` to temporary file followed by `fs.renameSync`), and in-memory cache indexing.
- **`src/controllers/task-controller.js`**: Request handling, query parsing, validation error formatting, status code setting, and response dispatching.
- **`src/server.js`**: Native HTTP server with URL router, JSON body parser, and error boundary handling. Exports the server instance for test harness portability.

## 2. Directory Structure
```
Part-1A/
├── .harness/
│   ├── lint-guard.js
│   ├── security-guard.js
│   ├── test-guard.js
│   └── harness-runner.js
├── evidence/
│   ├── initial-generation/
│   ├── final-generation/
│   ├── harness-results/
│   └── harness-log.md
├── specs/smart-task-api/
│   ├── constitution.md
│   ├── spec.md
│   ├── clarify.md
│   ├── plan.md
│   ├── tasks.md
│   └── analyze.md
├── src/
│   ├── controllers/
│   │   └── task-controller.js
│   ├── models/
│   │   └── task.js
│   ├── storage/
│   │   └── json-storage.js
│   ├── server.js
│   └── index.js
├── tests/
│   └── task.test.js
└── package.json
```

## 3. Storage & Concurrency Strategy
- Storage writes are serialized in a persistent file (e.g. `data/tasks.json`).
- In test environments, an ephemeral in-memory storage path or isolated test file is used to guarantee test idempotency and zero side-effects.

## 4. Test Strategy
- Framework: Native `node:test` and `node:assert/strict` (zero external dependencies).
- Scope:
  - Unit tests for Model validation and Status Transition Matrix.
  - Contract & Integration tests for all HTTP endpoints with real ephemeral port binding.
  - Negative test cases: Malformed JSON, missing mandatory fields, invalid enums, non-existent IDs, illegal status transitions.
