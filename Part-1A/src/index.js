const { createApp } = require('./server');
const { Task } = require('./models/task');
const { JsonStorage } = require('./storage/json-storage');
const { TaskController } = require('./controllers/task-controller');

module.exports = {
  createApp,
  Task,
  JsonStorage,
  TaskController
};
