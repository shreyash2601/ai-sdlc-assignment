const crypto = require('crypto');

const VALID_PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const PRIORITY_WEIGHTS = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

const ALLOWED_TRANSITIONS = {
  pending: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['pending', 'completed', 'cancelled'],
  completed: ['pending'],
  cancelled: ['pending']
};

class Task {
  constructor(data = {}) {
    this.id = data.id || crypto.randomUUID();
    this.title = this.validateTitle(data.title);
    this.description = typeof data.description === 'string' ? data.description.trim() : '';
    this.priority = this.validatePriority(data.priority);
    this.status = this.validateStatus(data.status);
    this.tags = this.normalizeTags(data.tags);
    this.dueDate = this.validateDueDate(data.dueDate);
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  validateTitle(title) {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new Error('Title is required and cannot be empty.');
    }
    const trimmed = title.trim();
    if (trimmed.length > 100) {
      throw new Error('Title cannot exceed 100 characters.');
    }
    return trimmed;
  }

  validatePriority(priority) {
    if (!priority) return 'medium';
    const normalized = String(priority).toLowerCase().trim();
    if (!VALID_PRIORITIES.includes(normalized)) {
      throw new Error(`Invalid priority. Allowed values: ${VALID_PRIORITIES.join(', ')}.`);
    }
    return normalized;
  }

  validateStatus(status) {
    if (!status) return 'pending';
    const normalized = String(status).toLowerCase().trim();
    if (!VALID_STATUSES.includes(normalized)) {
      throw new Error(`Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}.`);
    }
    return normalized;
  }

  normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    const set = new Set();
    for (const t of tags) {
      if (typeof t === 'string' && t.trim() !== '') {
        set.add(t.trim().toLowerCase());
      }
    }
    return Array.from(set);
  }

  validateDueDate(dueDate) {
    if (!dueDate) return null;
    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid dueDate format. Must be an ISO 8601 string.');
    }
    return parsed.toISOString();
  }

  get isOverdue() {
    if (!this.dueDate) return false;
    if (this.status === 'completed' || this.status === 'cancelled') return false;
    return new Date(this.dueDate).getTime() < Date.now();
  }

  canTransitionTo(newStatus) {
    const allowed = ALLOWED_TRANSITIONS[this.status] || [];
    return allowed.includes(newStatus);
  }

  transitionStatus(newStatus) {
    const normalized = this.validateStatus(newStatus);
    if (this.status === normalized) {
      return this;
    }
    if (!this.canTransitionTo(normalized)) {
      throw new Error(`Invalid status transition from '${this.status}' to '${normalized}'.`);
    }
    this.status = normalized;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  update(fields = {}) {
    if (fields.title !== undefined) {
      this.title = this.validateTitle(fields.title);
    }
    if (fields.description !== undefined) {
      this.description = typeof fields.description === 'string' ? fields.description.trim() : '';
    }
    if (fields.priority !== undefined) {
      this.priority = this.validatePriority(fields.priority);
    }
    if (fields.tags !== undefined) {
      this.tags = this.normalizeTags(fields.tags);
    }
    if (fields.dueDate !== undefined) {
      this.dueDate = this.validateDueDate(fields.dueDate);
    }
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      priority: this.priority,
      status: this.status,
      tags: this.tags,
      dueDate: this.dueDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isOverdue: this.isOverdue
    };
  }
}

module.exports = {
  Task,
  VALID_PRIORITIES,
  PRIORITY_WEIGHTS,
  VALID_STATUSES,
  ALLOWED_TRANSITIONS
};
