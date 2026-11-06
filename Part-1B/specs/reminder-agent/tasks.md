# Implementation Tasks: Natural-Language Reminder AI Agent

## Task Breakdown & Traceability Matrix

- [x] **TASK-B01: Spec Kit Artifacts & Non-Deterministic Boundaries**
  - Traceability: `constitution.md`, `spec.md`, `clarify.md`
  - Deliverables: Constitution, specifications, clarification notes, and evaluation threshold definitions.

- [x] **TASK-B02: Output Schema Contract & Invariant Definitions**
  - Traceability: `spec.md` Section 2 & 3
  - Deliverables: `src/schema.js` with JSON schema validation, enum restrictions, and invariant checks.

- [x] **TASK-B03: System Prompts & Guardrail Construction**
  - Traceability: `constitution.md` (Safety & Prompt-Injection Resistance), `clarify.md` Q4
  - Deliverables: `prompts/system-prompt.md` and `prompts/repair-prompt.md`.

- [x] **TASK-B04: Reminder Agent Core Implementation**
  - Traceability: `plan.md` Section 1
  - Deliverables: `src/reminder-agent.js` supporting prompt injection defense, relative time parsing, intent classification, and schema enforcement.

- [x] **TASK-B05: Benchmark Evaluation Dataset (16 Cases)**
  - Traceability: Assignment Section 4.5, `spec.md` Section 4
  - Deliverables: `evals/dataset.json` covering normal, boundary, ambiguous, missing info, snooze, and adversarial cases.

- [x] **TASK-B06: 3-Layer Evaluation Harness Pipeline**
  - Traceability: Assignment Section 4.7
  - Deliverables:
    - `.harness/layer1-structural.js`
    - `.harness/layer2-invariant.js`
    - `.harness/layer3-semantic.js`
    - `.harness/eval-runner.js`

- [x] **TASK-B07: Automated Evaluation, Self-Healing & Evidence Logging**
  - Traceability: Assignment Section 4.8, 4.9, 4.10
  - Deliverables: `evidence/initial-generation/`, `evidence/final-generation/`, `evidence/eval-results.json`, `evidence/harness-log.md`.
