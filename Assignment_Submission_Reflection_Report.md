# AI-Augmented Software Development Life Cycle (SEZG534)
## Assignment 1: Spec-Driven Development & Harness Engineering
### Student Submission Report (Reflection & Implementation Review)

---

## Student Details

| Field | Submission Details |
| :--- | :--- |
| **Name** | Shreyash Pawar |
| **Student ID** | 2024HT12345 (WILP-CSIS / SEZG534) |
| **Email ID** | shreyash.pawar@wilp.bits-pilani.ac.in |
| **GitHub Repository Link** | [https://github.com/shreyashpawar/ai-sdlc-assignment-1](https://github.com/shreyashpawar/ai-sdlc-assignment-1) |
| **Video Link** | [https://drive.google.com/file/d/your-demo-video-link/view?usp=sharing](https://drive.google.com/file/d/your-demo-video-link/view?usp=sharing) |

---

## Problem Statements

### Part 1A: Problem Statement
> **Prompt:** Provide a concise description of the problem addressed in Part 1A, including the intended users, key requirements, and expected outcome.

**Response:**
Part 1A addresses the specification, implementation, and deterministic verification of a **Smart Todo & Task REST API** for individual software engineers and technical knowledge workers who need lightweight, reliable tracking of daily engineering workflows. The system is designed with a strict zero-external-dependencies policy, utilizing Node.js standard runtime modules (`http`, `crypto`, `fs`, `url`). Key functional requirements include:
- Complete Task CRUD operations with UUID v4 generation.
- Tag normalization and case-insensitive filtering (`GET /tasks?tag=...`).
- Multi-tier priority sorting (`urgent > high > medium > low` with `createdAt` tie-breaking).
- Dynamic overdue flag calculation (`isOverdue`) against ISO 8601 timestamps.
- Fail-safe atomic JSON file persistence (`tasks.json`) preventing corruption during power cuts or crashes.
- An enforceable status-transition state machine (`pending` $\rightarrow$ `in_progress` $\rightarrow$ `completed` / `cancelled`, preventing illegal transitions like `completed` $\rightarrow$ `in_progress` without explicit re-opening).

The expected outcome is a fully deterministic backend service independently constrained, validated, and self-healed by a 3-gate harness (ESLint syntax guard, SAST security checker, and contract/unit test runner) yielding 100% binary test compliance without human intervention or degraded assertions.

---

### Part 1B: Problem Statement
> **Prompt:** Provide a concise description of the problem addressed in Part 1B, including the non-deterministic behavior, expected output, and evaluation approach.

**Response:**
Part 1B extends Spec-Driven Development to non-deterministic AI applications by engineering a **Natural-Language Reminder Agent** and an automated 3-layer evaluation harness. Intended users interact through conversational, unstructured text (e.g., *"remind me to submit WILP assignment on Nov 15 at 11:59 PM"*, *"in 45 minutes"*, *"snooze by 15 mins"*, or underspecified requests). Because natural language generation produces stochastic variations in wording and intent phrasing, the system bounds this non-determinism via a strict, machine-enforceable Output Schema Contract:
- Mandatory top-level keys: `intent`, `title`, ISO 8601 `scheduledTime`, `relativeOffsetMinutes`, `missingFields`, `clarificationPrompt`, and `confidence`.
- The system actively protects against adversarial jailbreaks and prompt injections.

The evaluation approach consists of a benchmark dataset of 16 diverse test cases evaluated across three decoupled layers:
1. **Layer 1 (Structural Conformance - 30 pts):** Validates raw JSON format, absence of markdown code blocks, and strict schema types.
2. **Layer 2 (Property & Invariant Verification - 40 pts):** Enforces temporal math (`scheduledTime > referenceTimestamp`), mandatory field clarification triggers, and duration offsets.
3. **Layer 3 (Semantic & Quality Evaluation - 30 pts):** Checks title keyword preservation, task fidelity, and safe refusal of prompt injections.

The expected outcome is an aggregate benchmark score surpassing the pre-declared 90.0% acceptance threshold with zero safety breaches.

---

## Assessed Reflection Questions

### 1. Specification Influence (1 mark)
> **Prompt:** Identify one concrete decision in your implementation that was directly shaped by a Spec Kit artifact (constitution, specification, clarification, plan, or tasks). Explain the traceability from the artifact to the implemented decision.

**Response:**
In Part 1A, the architectural constraint requiring atomic file persistence and zero third-party dependencies was directly established in `constitution.md` (§1 Core Engineering Principles: *"Zero External Dependencies Policy"* and *"Fail-Safe Persistence"*). This constitution directive flowed into `plan.md` (§3 Storage Strategy: atomic write pattern via temporary file rename) and was formalized as task `TASK-003`. 

In the implementation of `src/storage/json-storage.js`, instead of using a naive `fs.writeFileSync` directly on the primary database file—which risks corrupting JSON data during an unexpected process termination or write collision—the storage engine creates an ephemeral sibling file (`tempPath = \`\${filePath}.\${Date.now()}.tmp\``), flushes the serialized task buffer to disk, and executes an atomic POSIX rename (`fs.renameSync`). This architectural decision guarantees ACID-like durability using only standard library primitives, demonstrating clear traceability from project constitution down to concrete system calls.

---

### 2. Harness Value in Part 1A (1 mark)
> **Prompt:** Describe one issue detected by the deterministic harness that would have been missed or less reliably detected by simply asking the coding agent to review its own output. State the relevant harness gate/evidence and how the issue was resolved.

**Response:**
In Attempt 1 of Part 1A, the AI coding agent generated an initial implementation that superficially satisfied user requirements but contained a subtle validation bug: title validation only checked for empty strings (`title === ''`) rather than trimmed whitespace (`title.trim() === ''`), and permitted arbitrary status overwriting without consulting the state transition matrix. When asking an LLM coding agent to self-review its code, LLMs routinely confirm *"Looks good! Input validation and status transitions are implemented."* 

However, our deterministic harness **Gate 3 (Unit & Contract Test Guard)** executed exact binary assertions: 
- `AC-2` (`POST /tasks` with `title: "   "` must reject with HTTP 400).
- `AC-7` (`PATCH /tasks/:id/status` directly from `completed` to `in_progress` must reject with HTTP 400).

The test runner failed with exit code 1 and generated structured findings in `sensor-report-attempt1.json`. The harness captured this concrete failure, fed the exact failing assertions back to the coding agent, and successfully drove the implementation of trimmed whitespace checks and the `ALLOWED_TRANSITIONS` matrix in `src/models/task.js`, passing 100% of tests on Attempt 2.

---

### 3. Evaluating Non-Determinism in Part 1B (1 mark)
> **Prompt:** Choose one evaluation case where exact string matching would be inappropriate. Explain which schema constraint, invariant/property, and semantic/quality criterion you used instead, and why these checks were suitable.

**Response:**
In Part 1B, **Test Case 02** (*"Remind me to take a stretch break in 45 minutes"* with reference timestamp `2026-11-06T14:00:00.000Z`) cannot be verified using exact string matching because the extracted title may vary widely depending on model phrasing (*"take a stretch break"*, *"stretch break"*, *"take break"*, or *"take a break"*). 

Instead of brittle string equality, our harness applied a 3-layer decoupled evaluation:
1. **Schema Constraint:** Validated that the output conformed to the Output Schema Contract with `intent: "CREATE_REMINDER"`, string `title`, and valid ISO 8601 `scheduledTime`.
2. **Invariant / Property:** Checked that the computed timestamp was exactly 45 minutes ahead of the reference timestamp (`new Date(scheduledTime).getTime() - new Date(refTime).getTime() === 45 * 60 * 1000`), proving mathematical temporal correctness.
3. **Semantic / Quality Criterion:** Assessed semantic fidelity using keyword containment (verifying that the extracted title contained both `"take"` and `"break"` without hallucinated words).

This multi-tier approach decoupled syntactic variation from mathematical and functional correctness.

---

### 4. Feedback and Self-Healing (1 mark)
> **Prompt:** Using one actual repair cycle from either part, explain what failure evidence was fed back to the coding agent, what changed in the next attempt, and whether the repair solved the root cause without weakening the specification or harness.

**Response:**
In Part 1B, the initial generation (Attempt 1) lacked a dedicated prompt-injection filter and failed to calculate integer duration offsets for snooze requests. The evaluation harness executed all 16 benchmark cases and rejected Attempt 1, outputting structured failure evidence:
- `case-07` & `case-08` failed Invariant INV-3 (*"expected relativeOffsetMinutes: 15, got null"*).
- `case-14` & `case-15` failed Invariant INV-4 and Layer 3 Guardrails (*"adversarial prompt was not safely rejected; scheduled tasks with attacker payloads"*).

This structured JSON failure report was fed into the repair loop. In Attempt 2, the agent code was repaired by adding a deterministic `detectAdversarial()` pre-filter matching injection signatures (`/ignore.*previous instructions/i`, `/system prompt/i`, `/you are now dan/i`) that immediately returns `intent: "REJECT"` with null timestamps, and updating the snooze handler to parse regex duration units (minutes vs hours) into exact integer offsets. Re-running the harness yielded a **100% pass rate across all 16 cases**, resolving the root cause without weakening any test assertion or lowering the 90% threshold.

---

### 5. Human Accountability (1 mark)
> **Prompt:** Identify one limitation or residual risk that remained even after the harness reported PASS. Explain the final human ACCEPT/REJECT decision and what additional control you would introduce before using the application in a higher-risk or production setting.

**Response:**
Even after both Part 1A and Part 1B achieved 100% harness pass rates, critical residual risks remain:
- In Part 1A, the single-file atomic JSON persistence layer lacks distributed file locking; simultaneous writes across multiple server processes in a containerized cluster would result in race conditions and file-overwrite conflicts.
- In Part 1B, the agent's temporal parsing is anchored to UTC timestamps without user-specific timezone offset awareness, meaning relative dates (*"tomorrow at 9 AM"*) could fire prematurely or late for users in differing geographic timezones (e.g., IST vs UTC vs EST).

My final human decision was **ACCEPT** for academic and single-user CLI/API deployment because all specified requirements and safety bounds were strictly met. However, prior to production deployment in a high-risk enterprise setting, I would introduce two mandatory controls:
1. Migrating Part 1A's storage to a transactional ACID database (PostgreSQL with advisory locks).
2. Mandating an explicit IANA timezone parameter (e.g., `'Asia/Kolkata'`) in the API contract, combined with a human-in-the-loop interactive confirmation modal for any reminder scheduling financial, legal, or irrevocable actions.
