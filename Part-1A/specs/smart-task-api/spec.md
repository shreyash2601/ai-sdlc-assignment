# Feature Specification: Smart Task & Todo REST API

## 1. Problem Statement & Scope
Build a deterministic, lightweight, persistent Task & Todo REST API designed for developers and knowledge workers to track, prioritize, filter, and transition task statuses.

### Scope Inclusions:
- CRUD operations for tasks with title, description, priority, tags, and due date.
- Tag filtering (`tag=<tag_name>`).
- Priority sorting (`urgent > high > medium > low`).
- Controlled status transitions (`pending`, `in_progress`, `completed`, `cancelled`).
- JSON file persistence with atomic file writes.
- Dynamic overdue calculation (`isOverdue`).

### Scope Exclusions:
- Multi-user authentication / authorization (single-user / system token only).
- WebSocket real-time broadcast.
- Recurring recurring cron jobs.

## 2. Domain Model & Validation Rules
### Task Schema:
- `id` (string, UUID v4): Unique immutable identifier.
- `title` (string, required): 1 to 100 characters, non-empty after trimming.
- `description` (string, optional): Default `""`.
- `priority` (string, enum): `'urgent' | 'high' | 'medium' | 'low'`, default `'medium'`.
- `status` (string, enum): `'pending' | 'in_progress' | 'completed' | 'cancelled'`, default `'pending'`.
- `tags` (array of strings, optional): Lowercase normalized, duplicates deduplicated, default `[]`.
- `dueDate` (string, optional): Valid ISO 8601 date-time string (e.g., `2026-11-20T10:00:00.000Z`) or `null`.
- `createdAt` (string, ISO 8601): Timestamp of creation.
- `updatedAt` (string, ISO 8601): Timestamp of last modification.
- `isOverdue` (boolean, virtual): `true` if `dueDate !== null && new Date(dueDate) < new Date() && status !== 'completed' && status !== 'cancelled'`.

### Status Transition Matrix:
- `pending` $\rightarrow$ `in_progress`, `completed`, `cancelled`
- `in_progress` $\rightarrow$ `pending`, `completed`, `cancelled`
- `completed` $\rightarrow$ `pending` (re-open only)
- `cancelled` $\rightarrow$ `pending` (re-open only)
- Any other transition (e.g. `completed` $\rightarrow$ `in_progress` directly) is illegal and rejected with HTTP 400.

## 3. API Endpoints
1. `POST /tasks`: Create a new task.
   - Request Body: `{ title, description?, priority?, tags?, dueDate? }`
   - Response: `201 Created` with created Task object.
2. `GET /tasks`: Retrieve all tasks.
   - Query Parameters:
     - `tag`: Filter by tag name (case-insensitive).
     - `status`: Filter by status (`pending`, `in_progress`, `completed`, `cancelled`).
     - `priority`: Filter by priority.
     - `sort`: `'priority' | 'dueDate' | 'createdAt'` (default `'createdAt'`).
     - `order`: `'asc' | 'desc'` (default `'desc'`).
   - Priority Order: `urgent` (4) > `high` (3) > `medium` (2) > `low` (1).
   - Response: `200 OK` with `{ tasks: Task[], count: number }`.
3. `GET /tasks/:id`: Retrieve single task by ID.
   - Response: `200 OK` with Task object, or `404 Not Found`.
4. `PUT /tasks/:id`: Update task fields (title, description, priority, tags, dueDate).
   - Response: `200 OK` with updated Task object, or `404 Not Found`, or `400 Bad Request`.
5. `PATCH /tasks/:id/status`: Transition task status.
   - Request Body: `{ status: string }`
   - Response: `200 OK` with updated Task, `400 Bad Request` if invalid transition, `404 Not Found`.
6. `DELETE /tasks/:id`: Delete a task.
   - Response: `204 No Content` or `404 Not Found`.

## 4. Measurable Acceptance Criteria (Binary Verifiable)
- **AC-1:** Sending `POST /tasks` with valid payload returns HTTP 201 with generated UUID, default status `pending`, and timestamps.
- **AC-2:** Sending `POST /tasks` with missing or blank `title` returns HTTP 400 with `{ "error": "Title is required and cannot be empty." }`.
- **AC-3:** Sending `POST /tasks` with invalid priority returns HTTP 400 with `{ "error": "Invalid priority. Allowed values: urgent, high, medium, low." }`.
- **AC-4:** Sending `GET /tasks?tag=work` returns only tasks tagged with `work` (case-insensitive).
- **AC-5:** Sending `GET /tasks?sort=priority&order=desc` returns tasks ordered from `urgent` down to `low`.
- **AC-6:** Sending `PATCH /tasks/:id/status` from `pending` to `in_progress` returns HTTP 200 with updated status.
- **AC-7:** Sending `PATCH /tasks/:id/status` from `completed` to `in_progress` returns HTTP 400 with descriptive error.
- **AC-8:** Sending `GET /tasks/:id` with non-existent ID returns HTTP 404 with `{ "error": "Task not found." }`.
- **AC-9:** Sending `DELETE /tasks/:id` removes the task and subsequent `GET /tasks/:id` returns HTTP 404.
- **AC-10:** Persistence survives service restart by reloading stored tasks from `tasks.json`.
