const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { Readable, Writable } = require('stream');
const { createApp } = require('../src/server');
const { JsonStorage } = require('../src/storage/json-storage');

function dispatchRequest(server, options) {
  const req = new Readable({
    read() {
      if (options.body) {
        this.push(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      this.push(null);
    }
  });

  req.method = options.method || 'GET';
  req.url = options.url || '/';
  req.headers = Object.assign({ host: '127.0.0.1' }, options.headers || {});

  let statusCode = 200;
  let headers = {};
  let responseData = '';

  const res = new Writable({
    write(chunk, encoding, callback) {
      responseData += chunk.toString();
      callback();
    }
  });

  res.writeHead = (status, hdrs) => {
    statusCode = status;
    if (hdrs) headers = Object.assign(headers, hdrs);
  };
  res.setHeader = (k, v) => { headers[k.toLowerCase()] = v; };
  res.getHeader = (k) => headers[k.toLowerCase()];

  return new Promise((resolve, reject) => {
    res.on('finish', () => {
      resolve({
        status: statusCode,
        headers,
        text: () => Promise.resolve(responseData),
        json: () => Promise.resolve(JSON.parse(responseData || '{}'))
      });
    });
    res.on('error', reject);
    server.emit('request', req, res);
  });
}

function createTestClient(server) {
  return {
    async request(url, options = {}) {
      return dispatchRequest(server, {
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body
      });
    }
  };
}

async function withApp(run) {
  const testDbFile = path.join(__dirname, `test-tasks-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
  const storage = new JsonStorage(testDbFile);
  const { server } = createApp(storage);
  const client = createTestClient(server);

  try {
    await run(client, storage);
  } finally {
    storage.clear();
    if (fs.existsSync(testDbFile)) {
      try { fs.unlinkSync(testDbFile); } catch {}
    }
  }
}

test('AC-1: POST /tasks creates a task with valid fields and returns 201', async () => {
  await withApp(async client => {
    const res = await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Complete AI SDLC Lab',
        description: 'Implement Spec Kit and Harness',
        priority: 'high',
        tags: ['academic', 'WILP'],
        dueDate: '2026-11-15T23:59:59.000Z'
      })
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.id, 'Task ID should exist');
    assert.strictEqual(data.title, 'Complete AI SDLC Lab');
    assert.strictEqual(data.priority, 'high');
    assert.strictEqual(data.status, 'pending');
    assert.deepStrictEqual(data.tags, ['academic', 'wilp']);
    assert.strictEqual(data.isOverdue, false);
    assert.ok(data.createdAt);
    assert.ok(data.updatedAt);
  });
});

test('AC-2: POST /tasks rejects missing or blank title with 400', async () => {
  await withApp(async client => {
    const res = await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ', priority: 'low' })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, 'Title is required and cannot be empty.');
  });
});

test('AC-3: POST /tasks rejects invalid priority with 400', async () => {
  await withApp(async client => {
    const res = await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Valid Title', priority: 'super-urgent' })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, 'Invalid priority. Allowed values: urgent, high, medium, low.');
  });
});

test('AC-4: GET /tasks filters by tag (case-insensitive)', async () => {
  await withApp(async client => {
    await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Task 1', tags: ['Backend', 'node'] })
    });
    await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Task 2', tags: ['frontend', 'react'] })
    });

    const res = await client.request('/tasks?tag=backend');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.count, 1);
    assert.strictEqual(data.tasks[0].title, 'Task 1');
  });
});

test('AC-5: GET /tasks sorts by priority desc (urgent > high > medium > low)', async () => {
  await withApp(async client => {
    await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Low task', priority: 'low' })
    });
    await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Urgent task', priority: 'urgent' })
    });
    await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'High task', priority: 'high' })
    });

    const res = await client.request('/tasks?sort=priority&order=desc');
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const priorities = data.tasks.map(t => t.priority);
    assert.deepStrictEqual(priorities, ['urgent', 'high', 'low']);
  });
});

test('AC-6: PATCH /tasks/:id/status transitions from pending to in_progress with 200', async () => {
  await withApp(async client => {
    const createRes = await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Transition Test' })
    });
    const created = await createRes.json();

    const patchRes = await client.request(`/tasks/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' })
    });
    assert.strictEqual(patchRes.status, 200);
    const updated = await patchRes.json();
    assert.strictEqual(updated.status, 'in_progress');
  });
});

test('AC-7: PATCH /tasks/:id/status rejects illegal transition with 400', async () => {
  await withApp(async client => {
    const createRes = await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Illegal Transition Test' })
    });
    const created = await createRes.json();

    // Transition pending -> completed
    await client.request(`/tasks/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });

    // Attempt completed -> in_progress (illegal)
    const patchRes = await client.request(`/tasks/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' })
    });
    assert.strictEqual(patchRes.status, 400);
    const data = await patchRes.json();
    assert.strictEqual(data.error, "Invalid status transition from 'completed' to 'in_progress'.");
  });
});

test('AC-8: GET /tasks/:id with unknown ID returns 404', async () => {
  await withApp(async client => {
    const res = await client.request('/tasks/non-existent-uuid-1234');
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.error, 'Task not found.');
  });
});

test('AC-9: DELETE /tasks/:id deletes task and subsequent GET returns 404', async () => {
  await withApp(async client => {
    const createRes = await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'To Be Deleted' })
    });
    const created = await createRes.json();

    const delRes = await client.request(`/tasks/${created.id}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 204);

    const getRes = await client.request(`/tasks/${created.id}`);
    assert.strictEqual(getRes.status, 404);
  });
});

test('AC-10: Persistence reloads tasks from JSON file after recreation', async () => {
  const testDbFile = path.join(__dirname, `persist-test-${Date.now()}.json`);
  try {
    const storage1 = new JsonStorage(testDbFile);
    storage1.create({ title: 'Persistent Task Alpha', priority: 'urgent' });

    // Simulate server reboot by loading fresh storage instance from same file
    const storage2 = new JsonStorage(testDbFile);
    const all = storage2.getAll();
    assert.strictEqual(all.length, 1);
    assert.strictEqual(all[0].title, 'Persistent Task Alpha');
    assert.strictEqual(all[0].priority, 'urgent');
  } finally {
    if (fs.existsSync(testDbFile)) {
      try { fs.unlinkSync(testDbFile); } catch {}
    }
  }
});

test('Edge: Malformed JSON body returns 400', async () => {
  await withApp(async client => {
    const res = await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ broken json: }'
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, 'Malformed JSON body in request.');
  });
});

test('Edge: Dynamic overdue flag calculation', async () => {
  await withApp(async client => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
    const res = await client.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Overdue Task', dueDate: pastDate })
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.isOverdue, true);

    // Marking as completed makes isOverdue false
    const patchRes = await client.request(`/tasks/${data.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    });
    const updated = await patchRes.json();
    assert.strictEqual(updated.isOverdue, false);
  });
});
