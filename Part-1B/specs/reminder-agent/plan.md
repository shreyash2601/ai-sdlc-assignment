# Technical Plan: Natural-Language Reminder AI Agent & Evaluation Harness

## 1. System Architecture
The application consists of two decoupled subsystems:
1. **The Reminder Agent (`src/reminder-agent.js` & `src/schema.js`)**:
   - Accepts an unstructured query string and a `referenceTimestamp` (ISO 8601).
   - Sanitizes and inspects input through a pre-generation security guardrail (prompt injection detector).
   - Generates structured reminder JSON using either:
     - An offline deterministic semantic parsing engine with regex-based temporal extraction.
     - An external LLM API (Google Gemini 2.0 Flash) when `GEMINI_API_KEY` is present.
   - Enforces the Output Schema Contract before returning the payload.

2. **The 3-Layer Evaluation Harness (`.harness/`)**:
   - `layer1-structural.js`: Validates JSON schema conformance, required property keys, nullability rules, and data types.
   - `layer2-invariant.js`: Evaluates deterministic invariants (e.g. `scheduledTime > referenceTimestamp`, `CLARIFY` intent triggers on missing fields, `relativeOffsetMinutes` precision).
   - `layer3-semantic.js`: Measures semantic fidelity (keyword preservation, task title similarity, appropriate clarification prompts, safe injection refusal).
   - `eval-runner.js`: Iterates across `evals/dataset.json` (16 diverse cases), aggregates layer scores, checks against the 90% threshold, captures structured failure logs, triggers self-healing if needed, and writes evidence files.

## 2. Directory Layout
```
Part-1B/
├── .harness/
│   ├── layer1-structural.js
│   ├── layer2-invariant.js
│   ├── layer3-semantic.js
│   └── eval-runner.js
├── evidence/
│   ├── initial-generation/
│   ├── final-generation/
│   ├── eval-results.json
│   └── harness-log.md
├── evals/
│   └── dataset.json
├── prompts/
│   ├── system-prompt.md
│   └── repair-prompt.md
├── specs/reminder-agent/
│   ├── constitution.md
│   ├── spec.md
│   ├── clarify.md
│   ├── plan.md
│   ├── tasks.md
│   └── analyze.md
├── src/
│   ├── reminder-agent.js
│   └── schema.js
├── tests/
│   └── agent.test.js
└── package.json
```

## 3. Evaluation Dataset Strategy
The dataset in `evals/dataset.json` must contain 16 non-trivial test cases spanning 6 distinct operational categories:
1. Standard / Normal cases (explicit future date, time, title).
2. Relative temporal expressions ("in 45 minutes", "tomorrow at 3 PM", "next Monday at 10 AM").
3. Boundary temporal cases (end of month, leap day, midnight transition).
4. Missing critical information (missing title $\rightarrow$ CLARIFY, missing time $\rightarrow$ CLARIFY).
5. State modifications (snooze by 15 mins, reschedule meeting).
6. Adversarial / Prompt Injection attempts (malicious instructions $\rightarrow$ REJECT).
