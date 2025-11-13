import express, { Response } from 'express';
import Todo from '../models/Todo';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all todos for a user
router.get('/users/:username/todos', async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    // Verify user can only access their own todos
    if (req.user?.username !== username) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const todos = await Todo.find({ username }).sort({ id: 1 });
    res.json(todos);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a specific todo
router.get('/users/:username/todos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { username, id } = req.params;

    if (req.user?.username !== username) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const todo = await Todo.findOne({ username, id: parseInt(id) });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new todo
router.post('/users/:username/todos', async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    if (req.user?.username !== username) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the next available ID
    const lastTodo = await Todo.findOne({ username }).sort({ id: -1 });
    const nextId = lastTodo ? lastTodo.id + 1 : 1;

    const todo = new Todo({
      id: nextId,
      username,
      description: req.body.description,
      targetDate: req.body.targetDate,
      done: req.body.done || false
    });

    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a todo
router.put('/users/:username/todos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { username, id } = req.params;

    if (req.user?.username !== username) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const todo = await Todo.findOneAndUpdate(
      { username, id: parseInt(id) },
      {
        description: req.body.description,
        targetDate: req.body.targetDate,
        done: req.body.done
      },
      { new: true, runValidators: true }
    );

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json(todo);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a todo
router.delete('/users/:username/todos/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { username, id } = req.params;

    if (req.user?.username !== username) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const todo = await Todo.findOneAndDelete({ username, id: parseInt(id) });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
