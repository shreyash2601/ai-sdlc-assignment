# Project Constitution: Smart Task & Todo REST API

## 1. Core Engineering Principles
- **Separation of Concerns:** Strict decoupling between HTTP routing/controllers, business domain logic (Task entity, status state machine), and storage/persistence adapters.
- **RESTful Compliance:** Use standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with exact status codes:
  - `200 OK`: Successful retrieval or update.
  - `201 Created`: Successful resource creation with `Location` header or resource payload.
  - `204 No Content`: Successful deletion without response body.
  - `400 Bad Request`: Validation failure or illegal state transition.
  - `404 Not Found`: Target task ID does not exist.
  - `405 Method Not Allowed`: Unsupported HTTP verb on an endpoint.
- **Contract-First Immutability:** The specification and API schema serve as the authoritative single source of truth. Implementation must strictly conform to the spec; code changes cannot bypass or dilute defined criteria.
- **Zero External Dependencies Policy:** Core implementation uses Node.js standard runtime modules (`http`, `fs`, `path`, `crypto`, `url`) to guarantee zero supply-chain risk and high runtime portability.
- **Fail-Safe Persistence:** JSON file storage must use atomic write patterns (`write to temp file + rename`) to prevent partial corruption on system failure.
- **Strict Input Validation & Security:**
  - Reject prototype pollution (`__proto__`, `constructor`, `prototype`).
  - Strip leading/trailing whitespace and sanitize string inputs.
  - Never expose internal stack traces or machine paths in error payloads.
  - All responses must explicitly declare `Content-Type: application/json; charset=utf-8`.

## 2. Measurable Quality Standards
- **Test Coverage:** 100% of defined acceptance criteria mapped to automated binary tests.
- **Static Analysis:** Zero ESLint / syntax errors; zero detected SAST security warnings.
- **Harness Compliance:** All generated artifacts must pass the three deterministic harness gates (Lint, SAST, Unit/Contract) before human acceptance.
