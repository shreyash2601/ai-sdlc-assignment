# Implementation Tasks: Smart Task & Todo REST API

## Task Breakdown & Traceability Matrix

- [x] **TASK-001: Project Setup & Environment Baseline**
  - Traceability: `constitution.md` (Node.js standard library, clean project structure)
  - Deliverables: `package.json`, directory structure, `.gitignore`.

- [x] **TASK-002: Domain Model & Validation Logic**
  - Traceability: `spec.md` Section 2 (Task Schema & Status Transitions)
  - Deliverables: `src/models/task.js` with sanitization, UUID generation, priority levels, and state machine.

- [x] **TASK-003: Atomic File Persistence Layer**
  - Traceability: `constitution.md` (Fail-Safe Persistence), `plan.md` Section 3
  - Deliverables: `src/storage/json-storage.js` supporting CRUD, atomic disk sync, and isolated test configurations.

- [x] **TASK-004: HTTP Controller & Request Routing**
  - Traceability: `spec.md` Section 3 (Endpoints), `clarify.md` (JSON errors)
  - Deliverables: `src/controllers/task-controller.js`, `src/server.js` with JSON body parser and route dispatch.

- [x] **TASK-005: Query Filtering & Priority/Due Date Sorting**
  - Traceability: `spec.md` AC-4, AC-5; `clarify.md` Question 3, 4
  - Deliverables: Tag filter normalization, multi-criterion sorting (priority > createdAt).

- [x] **TASK-006: Comprehensive Contract & Unit Test Suite**
  - Traceability: `spec.md` Section 4 (AC-1 through AC-10)
  - Deliverables: `tests/task.test.js` covering all endpoints, positive paths, negative validations, and status transitions.

- [x] **TASK-007: Deterministic Harness Engineering & Validation Gates**
  - Traceability: Assignment Section 3.5 (Syntax, SAST, Unit/Contract, Bounded Repair)
  - Deliverables: `.harness/lint-guard.js`, `.harness/security-guard.js`, `.harness/test-guard.js`, `.harness/harness-runner.js`.

- [x] **TASK-008: Evidence Capture & Audit Logging**
  - Traceability: Assignment Section 3.6 & 3.7
  - Deliverables: `evidence/initial-generation/`, `evidence/final-generation/`, `evidence/harness-log.md`.
