const fs = require('fs');
const path = require('path');
const { Task } = require('../models/task');

class JsonStorage {
  constructor(filePath = null) {
    this.filePath = filePath || path.join(__dirname, '../../data/tasks.json');
    this.tasks = new Map();
    this.ensureDirectory();
    this.load();
  }

  ensureDirectory() {
    if (!this.filePath) return;
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  load() {
    if (!this.filePath || !fs.existsSync(this.filePath)) {
      return;
    }
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      if (!raw.trim()) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        this.tasks.clear();
        for (const item of data) {
          const task = new Task(item);
          this.tasks.set(task.id, task);
        }
      }
    } catch (err) {
      // In case of read/parse error, preserve in-memory state
    }
  }

  save() {
    if (!this.filePath) return;
    const arrayData = Array.from(this.tasks.values()).map(t => t.toJSON());
    const content = JSON.stringify(arrayData, null, 2);
    // Atomic write pattern: write to .tmp file then rename
    const tempPath = `${this.filePath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, this.filePath);
  }

  getAll() {
    return Array.from(this.tasks.values());
  }

  getById(id) {
    return this.tasks.get(id) || null;
  }

  create(taskData) {
    const task = new Task(taskData);
    this.tasks.set(task.id, task);
    this.save();
    return task;
  }

  update(task) {
    if (!this.tasks.has(task.id)) {
      return null;
    }
    this.tasks.set(task.id, task);
    this.save();
    return task;
  }

  delete(id) {
    if (!this.tasks.has(id)) {
      return false;
    }
    this.tasks.delete(id);
    this.save();
    return true;
  }

  clear() {
    this.tasks.clear();
    if (this.filePath && fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }
}

module.exports = { JsonStorage };
