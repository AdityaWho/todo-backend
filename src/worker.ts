import { Hono } from 'hono';
import { cors } from 'hono/cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Import models
import User from './models/User';
import Todo from './models/Todo';

// Environment type
type Bindings = {
  MONGODB_URI: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware - allow localhost and all pages.dev domains
app.use('/*', cors({
  origin: (origin) => {
    // Allow localhost for development
    if (origin === 'http://localhost:4200') {
      return origin;
    }
    // Allow all Cloudflare Pages domains
    if (origin && origin.endsWith('.pages.dev')) {
      return origin;
    }
    // For preflight requests without origin
    return 'http://localhost:4200';
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// MongoDB connection helper
let isConnected = false;

async function connectDB(mongoUri: string) {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Auth middleware
const authenticateToken = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return c.json({ message: 'Access token required' }, 401);
  }

  try {
    const secret = c.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as { username: string };
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ message: 'Invalid or expired token' }, 403);
  }
};

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'OK', message: 'Worker is running' });
});

// Welcome endpoint
app.get('/api/hello-world/:param', (c) => {
  const param = c.req.param('param');
  return c.json({ message: `Hello World, ${param}!` });
});

// Authentication - Signup
app.post('/api/signup', async (c) => {
  try {
    await connectDB(c.env.MONGODB_URI);

    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ message: 'Username and password required' }, 400);
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return c.json({ message: 'Username already exists' }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { username: user.username },
      c.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return c.json({
      message: 'User created successfully',
      token,
      username: user.username
    }, 201);
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Authentication - Login
app.post('/api/authenticate', async (c) => {
  try {
    await connectDB(c.env.MONGODB_URI);

    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ message: 'Username and password required' }, 400);
    }

    const user = await User.findOne({ username });
    if (!user) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    const token = jwt.sign(
      { username: user.username },
      c.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return c.json({ token, username: user.username });
  } catch (error: any) {
    console.error('Authentication error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Get all todos
app.get('/api/users/:username/todos', authenticateToken, async (c) => {
  try {
    await connectDB(c.env.MONGODB_URI);

    const username = c.req.param('username');
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const todos = await Todo.find({ username }).sort({ id: 1 });
    return c.json(todos);
  } catch (error: any) {
    console.error('Get todos error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Get specific todo
app.get('/api/users/:username/todos/:id', authenticateToken, async (c) => {
  try {
    await connectDB(c.env.MONGODB_URI);

    const username = c.req.param('username');
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const todo = await Todo.findOne({ username, id });
    if (!todo) {
      return c.json({ message: 'Todo not found' }, 404);
    }

    return c.json(todo);
  } catch (error: any) {
    console.error('Get todo error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Create todo
app.post('/api/users/:username/todos', authenticateToken, async (c) => {
  try {
    await connectDB(c.env.MONGODB_URI);

    const username = c.req.param('username');
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const { description, targetDate, done } = await c.req.json();

    const lastTodo = await Todo.findOne({ username }).sort({ id: -1 });
    const nextId = lastTodo ? lastTodo.id + 1 : 1;

    const todo = new Todo({
      id: nextId,
      username,
      description,
      targetDate: new Date(targetDate),
      done: done || false
    });

    await todo.save();
    return c.json(todo, 201);
  } catch (error: any) {
    console.error('Create todo error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Update todo
app.put('/api/users/:username/todos/:id', authenticateToken, async (c) => {
  try {
    await connectDB(c.env.MONGODB_URI);

    const username = c.req.param('username');
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const { description, targetDate, done } = await c.req.json();

    const todo = await Todo.findOneAndUpdate(
      { username, id },
      { description, targetDate: new Date(targetDate), done },
      { new: true, runValidators: true }
    );

    if (!todo) {
      return c.json({ message: 'Todo not found' }, 404);
    }

    return c.json(todo);
  } catch (error: any) {
    console.error('Update todo error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Delete todo
app.delete('/api/users/:username/todos/:id', authenticateToken, async (c) => {
  try {
    await connectDB(c.env.MONGODB_URI);

    const username = c.req.param('username');
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const todo = await Todo.findOneAndDelete({ username, id });

    if (!todo) {
      return c.json({ message: 'Todo not found' }, 404);
    }

    return c.json({ message: 'Todo deleted successfully' });
  } catch (error: any) {
    console.error('Delete todo error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

export default app;
