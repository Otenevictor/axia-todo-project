const Task = require('../models/task.model');

// Create a task
const createTask = async (req, res) => {
  try {
    const { title, description, category, dueDate, completed, priority } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    let finalDueDate = null;

    if (dueDate) {
      // User sends only "YYYY-MM-DD"
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        // Grab current time (hours/minutes/seconds/ms)
        const now = new Date();
        parsed.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        finalDueDate = parsed;
      }
    }

    const task = await Task.create({
      user: req.user.id,
      title: title.trim(),
      description: description?.trim() || '',
      category: category?.trim() || 'general',
      dueDate: finalDueDate,
      completed: !!completed,
      priority: priority || 'medium',
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Something went wrong while creating the task.' });
  }
};


// Get tasks (user-specific) + filtering/pagination/sorting
const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      search,           // string
      category,         // string
      status,           // "completed" | "incomplete"
      dueBefore,        // ISO date string
      dueAfter,         // ISO date string
      priority,         // "low" | "medium" | "high"
      sort = '-createdAt', // e.g. "dueDate" or "-dueDate" or "title"
      page = 1,
      limit = 20,
    } = req.query;

    const q = { user: userId };

    if (category) q.category = category;
    if (priority) q.priority = priority;

    if (status === 'completed') q.completed = true;
    if (status === 'incomplete') q.completed = false;

    if (dueBefore || dueAfter) {
      q.dueDate = {};
      if (dueBefore) q.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) q.dueDate.$gte = new Date(dueAfter);
    }

    if (search) {
      q.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Task.find(q).sort(sort).skip(skip).limit(Number(limit)),
      Task.countDocuments(q),
    ]);

    return res.status(200).json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Something went wrong while fetching tasks.' });
  }
};

// Get single task (ensure ownership)
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    return res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return res.status(500).json({ message: 'Something went wrong while fetching the task.' });
  }
};

// Update task (ensure ownership)
const updateTask = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.title) updates.title = updates.title.trim();
    if (updates.description) updates.description = updates.description.trim();
    if (updates.category) updates.category = updates.category.trim();

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true }
    );

    if (!task) return res.status(404).json({ message: 'Task not found.' });
    return res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ message: 'Something went wrong while updating the task.' });
  }
};

// Toggle completion
const toggleComplete = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    task.completed = !task.completed;
    await task.save();
    return res.status(200).json(task);
  } catch (error) {
    console.error('Error toggling completion:', error);
    return res.status(500).json({ message: 'Something went wrong while toggling completion.' });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ message: 'Something went wrong while deleting the task.' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  toggleComplete,
  deleteTask,
};
