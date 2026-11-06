const { PRIORITY_WEIGHTS } = require('../models/task');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

class TaskController {
  constructor(storage) {
    this.storage = storage;
  }

  createTask(req, res, body) {
    try {
      if (!body || typeof body !== 'object') {
        return sendJson(res, 400, { error: 'Request body must be a valid JSON object.' });
      }
      const task = this.storage.create(body);
      return sendJson(res, 201, task.toJSON());
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  listTasks(req, res, query = {}) {
    let tasks = this.storage.getAll();

    // Filter by tag
    if (query.tag) {
      const targetTag = String(query.tag).toLowerCase().trim();
      tasks = tasks.filter(t => t.tags.includes(targetTag));
    }

    // Filter by status
    if (query.status) {
      const targetStatus = String(query.status).toLowerCase().trim();
      tasks = tasks.filter(t => t.status === targetStatus);
    }

    // Filter by priority
    if (query.priority) {
      const targetPriority = String(query.priority).toLowerCase().trim();
      tasks = tasks.filter(t => t.priority === targetPriority);
    }

    // Sorting
    const sortField = query.sort || 'createdAt';
    const order = (query.order || 'desc').toLowerCase();

    tasks.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'priority') {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 0;
        comparison = weightA - weightB;
        if (comparison === 0) {
          // Tie-breaker: createdAt descending
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      } else if (sortField === 'dueDate') {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : (order === 'asc' ? Infinity : -Infinity);
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : (order === 'asc' ? Infinity : -Infinity);
        comparison = timeA - timeB;
      } else {
        // Default sort by createdAt
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        comparison = timeA - timeB;
      }
      return order === 'asc' ? comparison : -comparison;
    });

    return sendJson(res, 200, {
      tasks: tasks.map(t => t.toJSON()),
      count: tasks.length
    });
  }

  getTask(req, res, id) {
    const task = this.storage.getById(id);
    if (!task) {
      return sendJson(res, 404, { error: 'Task not found.' });
    }
    return sendJson(res, 200, task.toJSON());
  }

  updateTask(req, res, id, body) {
    const task = this.storage.getById(id);
    if (!task) {
      return sendJson(res, 404, { error: 'Task not found.' });
    }
    if (!body || typeof body !== 'object') {
      return sendJson(res, 400, { error: 'Request body must be a valid JSON object.' });
    }
    if (body.status !== undefined) {
      return sendJson(res, 400, {
        error: "Status cannot be updated via PUT /tasks/:id. Use PATCH /tasks/:id/status for state transitions."
      });
    }
    try {
      task.update(body);
      this.storage.update(task);
      return sendJson(res, 200, task.toJSON());
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  transitionStatus(req, res, id, body) {
    const task = this.storage.getById(id);
    if (!task) {
      return sendJson(res, 404, { error: 'Task not found.' });
    }
    if (!body || typeof body.status !== 'string') {
      return sendJson(res, 400, { error: 'Field status is required and must be a string.' });
    }
    try {
      task.transitionStatus(body.status);
      this.storage.update(task);
      return sendJson(res, 200, task.toJSON());
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  deleteTask(req, res, id) {
    const deleted = this.storage.delete(id);
    if (!deleted) {
      return sendJson(res, 404, { error: 'Task not found.' });
    }
    res.writeHead(204);
    res.end();
  }
}

module.exports = { TaskController, sendJson };
