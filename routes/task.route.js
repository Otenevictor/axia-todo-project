const express = require('express');
const { authentication } = require('../auth.middleware/auth.middleware.js');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  toggleComplete,
  deleteTask,
} = require('../controllers/task.controller');

const router = express.Router();

// All task routes are user-protected
router.use(authentication);

// Create
router.post('/task', createTask);

// Read (list)
router.get('/task', getTasks);

// Read (single)
router.get('/task/:id', getTaskById);

// Update
router.put('/task/:id', updateTask);

// Toggle complete
router.patch('/task/:id/toggle', toggleComplete);

// Delete
router.delete('/task/:id', deleteTask);

module.exports = router;
