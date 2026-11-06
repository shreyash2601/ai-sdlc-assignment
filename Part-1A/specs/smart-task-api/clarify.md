# Specification Clarifications: Smart Task & Todo REST API

## Clarification Session 1: Edge Cases & Ambiguities Resolved

### Question 1: What should happen if `dueDate` is passed in the past during creation?
- **Decision:** Past `dueDate` is permitted (e.g., retroactively recording a completed or overdue task), but the computed virtual property `isOverdue` will immediately evaluate to `true` unless the initial status is set to `completed` or `cancelled`.

### Question 2: Can a completed or cancelled task be edited directly via `PUT /tasks/:id`?
- **Decision:** Yes, metadata fields (title, description, tags, dueDate) may be updated, but the `status` field cannot be modified via `PUT`. Status transitions MUST occur exclusively through `PATCH /tasks/:id/status` to enforce state-machine integrity.

### Question 3: How should tags with mixed casing and spaces be handled?
- **Decision:** All tags are trimmed, lowercased, and deduplicated. For example, `["Work", " work ", "DEV"]` normalizes to `["work", "dev"]`. Empty tag strings are discarded.

### Question 4: What is the tie-breaker for priority sorting?
- **Decision:** When two tasks share the same priority level, tie-breaking sorts by `createdAt` in descending order (newer tasks first).

### Question 5: How are invalid JSON payloads handled in request bodies?
- **Decision:** Malformed JSON strings must be caught by request body parsing middleware and return an explicit `HTTP 400 Bad Request` with payload `{ "error": "Malformed JSON body in request." }`, preventing unhandled crashes.
