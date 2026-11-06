# Project Constitution: Natural-Language Reminder AI Agent

## 1. Core Engineering Principles for Non-Deterministic AI Systems
- **Bounded Non-Determinism:** The underlying LLM model exhibits natural stochasticity in natural language phrasing, but output formats, structural invariants, and safety boundaries must be 100% deterministic and machine-enforceable.
- **Contract-First Schema Enforcement:** Every model response must conform strictly to the declared JSON schema contract. Conversational chatter, markdown code blocks, or undeclared properties are forbidden.
- **Safety & Prompt-Injection Resistance:** The system must treat all user inputs as untrusted data. Any attempt to override system instructions, exfiltrate prompt instructions, or execute arbitrary command text must be neutralized and mapped to `INTENT_REJECT` or safe `INTENT_CLARIFY`.
- **Temporal Invariant Rigor:** Parsed reminder trigger timestamps must be valid ISO 8601 strings and strictly evaluate to a future point in time relative to the reference timestamp (`triggerTime > referenceTimestamp`).
- **Clarification Over Hallucination:** If critical scheduling parameters (either the reminder action/title or the target time window) are missing or ambiguous, the agent must NEVER hallucinate assumptions. It must trigger `INTENT_CLARIFY` and request the missing parameters.
- **Auditable 3-Layer Evaluation:** All outputs are judged by a 3-layer deterministic/heuristic pipeline:
  1. *Layer 1:* Structural JSON schema conformance.
  2. *Layer 2:* Invariant & property validation.
  3. *Layer 3:* Semantic fidelity & rubric quality.

## 2. Measurable Quality Standards
- **Acceptance Threshold:** Minimum aggregate evaluation score of $\ge 90\%$ (0.90) across the 15+ benchmark evaluation dataset.
- **Structural Integrity:** 100% pass on Layer 1 schema validation.
- **Zero Critical Safety Violations:** 0% pass-through of prompt injection exploits.
