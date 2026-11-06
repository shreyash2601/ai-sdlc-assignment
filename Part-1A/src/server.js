const http = require('http');
const { URL } = require('url');
const { JsonStorage } = require('./storage/json-storage');
const { TaskController, sendJson } = require('./controllers/task-controller');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        return resolve({});
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        const parseErr = new Error('Malformed JSON body in request.');
        parseErr.statusCode = 400;
        reject(parseErr);
      }
    });
    req.on('error', err => reject(err));
  });
}

function createApp(storage = new JsonStorage()) {
  const controller = new TaskController(storage);

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      const method = req.method.toUpperCase();

      // Query params object
      const query = Object.fromEntries(parsedUrl.searchParams.entries());

      // Route: /tasks collection
      if (pathname === '/tasks') {
        if (method === 'GET') {
          return controller.listTasks(req, res, query);
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          return controller.createTask(req, res, body);
        }
        return sendJson(res, 405, { error: `Method ${method} not allowed on /tasks.` });
      }

      // Route: /tasks/:id/status
      const statusMatch = pathname.match(/^\/tasks\/([a-zA-Z0-9_-]+)\/status$/);
      if (statusMatch) {
        const id = statusMatch[1];
        if (method === 'PATCH') {
          const body = await parseBody(req);
          return controller.transitionStatus(req, res, id, body);
        }
        return sendJson(res, 405, { error: `Method ${method} not allowed on /tasks/:id/status.` });
      }

      // Route: /tasks/:id
      const idMatch = pathname.match(/^\/tasks\/([a-zA-Z0-9_-]+)$/);
      if (idMatch) {
        const id = idMatch[1];
        if (method === 'GET') {
          return controller.getTask(req, res, id);
        }
        if (method === 'PUT') {
          const body = await parseBody(req);
          return controller.updateTask(req, res, id, body);
        }
        if (method === 'DELETE') {
          return controller.deleteTask(req, res, id);
        }
        return sendJson(res, 405, { error: `Method ${method} not allowed on /tasks/:id.` });
      }

      // Root ping
      if (pathname === '/' && method === 'GET') {
        return sendJson(res, 200, {
          service: 'Smart Task API',
          version: '1.0.0',
          endpoints: ['/tasks', '/tasks/:id', '/tasks/:id/status']
        });
      }

      // Unknown route
      return sendJson(res, 404, { error: 'Route not found.' });
    } catch (err) {
      const status = err.statusCode || 500;
      return sendJson(res, status, { error: err.message || 'Internal Server Error' });
    }
  });

  return { server, storage, controller };
}

module.exports = { createApp };

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const { server } = createApp();
  server.listen(PORT, () => {
    console.log(`Smart Task API running on http://127.0.0.1:${PORT}`);
  });
}
