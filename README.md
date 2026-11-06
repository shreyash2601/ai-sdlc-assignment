# AI-Augmented Software Development Life Cycle (SEZG534)
## Assignment 1: Spec-Driven Development & Harness Engineering

**Student:** Shreyash Pawar  
**Program:** M.Tech Software Engineering (WILP-CSIS), BITS Pilani  
**Module:** AI-Augmented Software Development Life Cycle (SEZG534)  

---

## Executive Summary
This repository contains the complete, verified submission for **Assignment 1: Spec-Driven Development (SDD) & Harness Engineering**. The project demonstrates how formal specification artifacts produced through the GitHub Spec Kit lifecycle constrain and govern AI coding agents, and how deterministic and multi-layer evaluation harnesses independently sense defects, capture structured evidence, enforce bounded self-healing repairs, and maintain rigorous human accountability.

---

## Repository Structure

```
.
├── Assignment_Submission_Reflection_Report.docx   # Formatted Word submission report (for LMS)
├── Assignment_Submission_Reflection_Report.md     # Markdown mirror of reflection report
├── README.md                                      # Project overview & reproduction guide
├── .gitignore                                     # Secrets and temporary file exclusions
│
├── Part-1A/                                       # Deterministic Application (10 Marks)
│   ├── package.json                               # Scripts for test & harness execution
│   ├── specs/smart-task-api/                      # Spec Kit SDD Artifacts
│   │   ├── constitution.md                        # Architecture principles, zero-deps, security
│   │   ├── spec.md                                # CRUD, tag filtering, sorting, state transitions
│   │   ├── clarify.md                             # Ambiguity resolution & edge-case decisions
│   │   ├── plan.md                                # Modular 3-tier technical architecture
│   │   ├── tasks.md                               # Atomic task traceability matrix
│   │   └── analyze.md                             # Specification consistency analysis
│   ├── src/                                       # Production Source Code (Zero Dependencies)
│   │   ├── models/task.js                         # Task domain model & transition state machine
│   │   ├── storage/json-storage.js                # Atomic file persistence (temp write + rename)
│   │   ├── controllers/task-controller.js         # HTTP controller, filtering & sorting logic
│   │   ├── server.js                              # Native HTTP server & URL router
│   │   └── index.js                               # Module exports
│   ├── tests/
│   │   └── task.test.js                           # Contract & unit test suite (AC-1 to AC-10)
│   ├── .harness/                                  # Deterministic Harness Gates
│   │   ├── lint-guard.js                          # Gate 1: Syntax & code style verification
│   │   ├── security-guard.js                      # Gate 2: SAST security & anti-injection scanner
│   │   ├── test-guard.js                          # Gate 3: Contract test executor
│   │   └── harness-runner.js                      # Unified runner & bounded self-healing loop
│   └── evidence/                                  # Audit & Verification Evidence
│       ├── initial-generation/                    # Attempt 1 source (with captured defect)
│       ├── final-generation/                      # Attempt 2 source (fully repaired & verified)
│       ├── harness-results/                       # sensor-report.json & attempt-log.json
│       └── harness-log.md                         # Detailed markdown execution log
│
└── Part-1B/                                       # Non-Deterministic AI Application (10 Marks)
    ├── package.json                               # Scripts for test & 3-layer evals
    ├── specs/reminder-agent/                      # Spec Kit SDD Artifacts
    │   ├── constitution.md                        # Non-deterministic boundaries, safety guardrails
    │   ├── spec.md                                # Output Schema Contract, Invariants, Rubrics
    │   ├── clarify.md                             # Temporal parsing conventions & injection policy
    │   ├── plan.md                                # Agent pipeline & 3-layer evaluation harness
    │   ├── tasks.md                               # Implementation milestones
    │   └── analyze.md                             # Consistency & boundary analysis
    ├── prompts/
    │   ├── system-prompt.md                       # Feedforward system prompt & JSON contract
    │   └── repair-prompt.md                       # Structured failure repair prompt template
    ├── src/
    │   ├── reminder-agent.js                      # Natural-language reminder parser & agent
    │   └── schema.js                              # Output Schema Contract validator
    ├── evals/
    │   └── dataset.json                           # 16 diverse test cases (normal, boundary, adversarial)
    ├── tests/
    │   └── agent.test.js                          # Unit tests for schema, intents & guardrails
    ├── .harness/                                  # 3-Layer Evaluation Pipeline
    │   ├── layer1-structural.js                   # Layer 1: JSON schema & type conformance (30 pts)
    │   ├── layer2-invariant.js                    # Layer 2: Deterministic invariants & math (40 pts)
    │   ├── layer3-semantic.js                     # Layer 3: Semantic quality & safe refusal (30 pts)
    │   └── eval-runner.js                         # Unified benchmark runner & self-healing cycle
    └── evidence/                                  # Audit & Verification Evidence
        ├── initial-generation/                    # Attempt 1 agent code (failing adversarial/snooze)
        ├── final-generation/                      # Attempt 2 agent code (repaired, 100% score)
        ├── harness-results/                       # eval-results-attempt1.json
        ├── eval-results.json                      # Final 16-case benchmark results
        └── harness-log.md                         # Detailed evaluation & audit log
```

---

## Quickstart & Reproduction Guide

### Prerequisites
- Node.js 20 or later (`node --version`)
- Python 3.9+ (used only for generating the Word `.docx` file)
- Git

### Running Part 1A (Deterministic Application)
```bash
cd Part-1A

# 1. Run unit & contract tests
npm test

# 2. Run the deterministic harness (executes Gates 1, 2, 3 and self-healing cycle)
npm run harness
```

**Expected Part 1A Outcome:**
- Attempt 1 fails contract tests (capturing whitespace title and state transition violations).
- Structured findings are captured in `Part-1A/evidence/harness-results/sensor-report-attempt1.json`.
- Attempt 2 applies the self-healing repair; Gate 1 (Lint), Gate 2 (SAST), and Gate 3 (Tests) all **PASS** (12/12 tests passing).
- Audit log is recorded in `Part-1A/evidence/harness-log.md`.

---

### Running Part 1B (Non-Deterministic AI Application)
```bash
cd Part-1B

# 1. Run unit tests
npm test

# 2. Run the 3-layer evaluation harness benchmark (16 diverse cases)
npm run eval
```

**Expected Part 1B Outcome:**
- Attempt 1 evaluates the initial generation lacking prompt injection filters and snooze duration math (Score: 90% with 4 defective cases).
- Structured findings are logged to `Part-1B/evidence/harness-results/eval-results-attempt1.json`.
- Attempt 2 repairs the agent with prompt-injection defense and relative snooze offset parsing.
- Attempt 2 scores **100.0%** (16/16 cases passing, surpassing the 90.0% acceptance threshold).
- Detailed audit evidence is written to `Part-1B/evidence/eval-results.json` and `Part-1B/evidence/harness-log.md`.

---

## Verification Matrix Summary

| Dimension | Part 1A: Smart Task API | Part 1B: Reminder AI Agent |
| :--- | :--- | :--- |
| **Problem Type** | Deterministic REST API | Non-Deterministic AI Agent |
| **Spec Kit Artifacts** | `constitution`, `spec`, `clarify`, `plan`, `tasks`, `analyze` | `constitution`, `spec`, `clarify`, `plan`, `tasks`, `analyze` |
| **Feedforward Controls** | Zero-deps policy, atomic file persistence, REST status codes | Output Schema Contract, Invariant definitions, System prompt |
| **Harness Gates** | 3 Gates (Lint Guard, SAST Security Guard, Contract Tests) | 3 Layers (Structural JSON, Invariant/Properties, Semantic Quality) |
| **Benchmark Suite** | 12 automated binary tests (`node:test`) | 16 curated evaluation cases across 6 operational categories |
| **Pre-Declared Threshold**| 100% test pass; 0 lint / security findings | Aggregate score $\ge 90.0\%$; zero safety/injection breaches |
| **Observed Initial Fail** | Whitespace title allowed; completed $\rightarrow$ in_progress allowed | Snooze duration null; prompt injection payload passed |
| **Repaired Outcome** | **100% PASS** on all 3 gates | **100% PASS** (Aggregate Score 100.0%) |
| **Human Review Decision**| **ACCEPT** | **ACCEPT** |

---

## Submission Deliverables
1. **Source Code in GitHub Repository:** Full public repository structure as outlined above.
2. **Demonstration Video:** Video showcasing both applications, test runs, and harness self-healing cycles.
3. **Reflection Report:** Uploaded to LMS using the university format:
   - Word DOCX: `Assignment_Submission_Reflection_Report.docx`
   - Markdown: `Assignment_Submission_Reflection_Report.md`
