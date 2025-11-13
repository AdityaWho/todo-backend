import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Environment type
type Bindings = {
  MONGODB_DATA_API_URL: string;
  MONGODB_DATA_API_KEY: string;
  MONGODB_DATABASE: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware - allow localhost and all pages.dev domains
app.use('/*', cors({
  origin: (origin) => {
    if (origin === 'http://localhost:4200') {
      return origin;
    }
    if (origin && origin.endsWith('.pages.dev')) {
      return origin;
    }
    return 'http://localhost:4200';
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Helper: Call MongoDB Data API
async function mongoDBRequest(env: Bindings, action: string, collection: string, data: any) {
  const url = `${env.MONGODB_DATA_API_URL}/action/${action}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.MONGODB_DATA_API_KEY,
    },
    body: JSON.stringify({
      dataSource: 'Cluster0',
      database: env.MONGODB_DATABASE,
      collection,
      ...data,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('MongoDB Data API Error:', error);
    throw new Error(`MongoDB API error: ${response.status}`);
  }

  return response.json();
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
  return c.json({ status: 'OK', message: 'Worker is running with MongoDB Data API' });
});

// Welcome endpoint
app.get('/api/hello-world/:param', (c) => {
  const param = c.req.param('param');
  return c.json({ message: `Hello World, ${param}!` });
});

// Signup
app.post('/api/signup', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ message: 'Username and password required' }, 400);
    }

    // Check if user exists
    const existingUser = await mongoDBRequest(c.env, 'findOne', 'users', {
      filter: { username },
    });

    if (existingUser.document) {
      return c.json({ message: 'Username already exists' }, 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await mongoDBRequest(c.env, 'insertOne', 'users', {
      document: {
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      },
    });

    // Generate token
    const token = jwt.sign(
      { username },
      c.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return c.json({
      message: 'User created successfully',
      token,
      username,
    }, 201);
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Login
app.post('/api/authenticate', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ message: 'Username and password required' }, 400);
    }

    // Find user
    const result = await mongoDBRequest(c.env, 'findOne', 'users', {
      filter: { username },
    });

    if (!result.document) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, result.document.password);
    if (!isPasswordValid) {
      return c.json({ message: 'Invalid credentials' }, 401);
    }

    // Generate token
    const token = jwt.sign(
      { username },
      c.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return c.json({ token, username });
  } catch (error: any) {
    console.error('Authentication error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Get all todos
app.get('/api/users/:username/todos', authenticateToken, async (c) => {
  try {
    const username = c.req.param('username');
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const result = await mongoDBRequest(c.env, 'find', 'todos', {
      filter: { username },
      sort: { id: 1 },
    });

    return c.json(result.documents || []);
  } catch (error: any) {
    console.error('Get todos error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Get specific todo
app.get('/api/users/:username/todos/:id', authenticateToken, async (c) => {
  try {
    const username = c.req.param('username');
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const result = await mongoDBRequest(c.env, 'findOne', 'todos', {
      filter: { username, id },
    });

    if (!result.document) {
      return c.json({ message: 'Todo not found' }, 404);
    }

    return c.json(result.document);
  } catch (error: any) {
    console.error('Get todo error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Create todo
app.post('/api/users/:username/todos', authenticateToken, async (c) => {
  try {
    const username = c.req.param('username');
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const { description, targetDate, done } = await c.req.json();

    // Get next ID
    const lastTodo = await mongoDBRequest(c.env, 'find', 'todos', {
      filter: { username },
      sort: { id: -1 },
      limit: 1,
    });

    const nextId = lastTodo.documents && lastTodo.documents.length > 0
      ? lastTodo.documents[0].id + 1
      : 1;

    const todo = {
      id: nextId,
      username,
      description,
      targetDate: new Date(targetDate).toISOString(),
      done: done || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await mongoDBRequest(c.env, 'insertOne', 'todos', {
      document: todo,
    });

    return c.json(todo, 201);
  } catch (error: any) {
    console.error('Create todo error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Update todo
app.put('/api/users/:username/todos/:id', authenticateToken, async (c) => {
  try {
    const username = c.req.param('username');
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const { description, targetDate, done } = await c.req.json();

    const updateFields: any = {
      updatedAt: new Date().toISOString(),
    };
    if (description !== undefined) updateFields.description = description;
    if (targetDate !== undefined) updateFields.targetDate = new Date(targetDate).toISOString();
    if (done !== undefined) updateFields.done = done;

    const result = await mongoDBRequest(c.env, 'updateOne', 'todos', {
      filter: { username, id },
      update: { $set: updateFields },
    });

    if (result.matchedCount === 0) {
      return c.json({ message: 'Todo not found' }, 404);
    }

    // Fetch updated document
    const updated = await mongoDBRequest(c.env, 'findOne', 'todos', {
      filter: { username, id },
    });

    return c.json(updated.document);
  } catch (error: any) {
    console.error('Update todo error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

// Delete todo
app.delete('/api/users/:username/todos/:id', authenticateToken, async (c) => {
  try {
    const username = c.req.param('username');
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (user.username !== username) {
      return c.json({ message: 'Access denied' }, 403);
    }

    const result = await mongoDBRequest(c.env, 'deleteOne', 'todos', {
      filter: { username, id },
    });

    if (result.deletedCount === 0) {
      return c.json({ message: 'Todo not found' }, 404);
    }

    return c.json({ message: 'Todo deleted successfully' });
  } catch (error: any) {
    console.error('Delete todo error:', error);
    return c.json({ message: 'Internal server error', error: error.message }, 500);
  }
});

export default app;
