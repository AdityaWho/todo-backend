# Todo Backend API

A RESTful API backend for the Todo Angular application, built with Node.js, Express, TypeScript, and MongoDB.

## Features

- JWT Authentication
- Basic Authentication support
- CRUD operations for todos
- MongoDB database
- TypeScript support
- CORS enabled

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
```
PORT=8080
MONGODB_URI=mongodb://localhost:27017/todo-app
JWT_SECRET=your-secret-key
```

## Running the Application

### Development mode (with auto-reload):
```bash
npm run dev
```

### Build and run production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/authenticate` - JWT login
- `POST /api/signup` - User registration
- `GET /api/basicauth` - Basic authentication check

### Todos
- `GET /api/users/:username/todos` - Get all todos for user
- `GET /api/users/:username/todos/:id` - Get specific todo
- `POST /api/users/:username/todos` - Create new todo
- `PUT /api/users/:username/todos/:id` - Update todo
- `DELETE /api/users/:username/todos/:id` - Delete todo

### Other
- `GET /api/hello-world/:param` - Welcome message
- `GET /health` - Health check endpoint

## Project Structure

```
todo-backend/
├── src/
│   ├── models/          # MongoDB models
│   │   ├── User.ts
│   │   └── Todo.ts
│   ├── routes/          # API routes
│   │   ├── auth.ts
│   │   ├── todos.ts
│   │   └── welcome.ts
│   ├── middleware/      # Express middleware
│   │   └── auth.ts
│   └── server.ts        # Main application file
├── dist/                # Compiled JavaScript
├── .env.example         # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Authentication

The API uses JWT tokens for authentication. After logging in, include the token in subsequent requests:

```
Authorization: Bearer <your-jwt-token>
```

## MongoDB Setup

### Local Development
Make sure MongoDB is running locally or update the `MONGODB_URI` in your `.env` file to point to your MongoDB instance.

### MongoDB Atlas Setup (for Cloud Deployment)

When deploying to Render or other cloud platforms with MongoDB Atlas:

1. **Get your MongoDB Atlas connection string:**
   - Go to your MongoDB Atlas cluster
   - Click "Connect" → "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

2. **Whitelist IP addresses:**
   - In MongoDB Atlas, go to "Network Access"
   - Click "Add IP Address"
   - For Render deployment, you have two options:
     - **Option A (Recommended for development):** Click "Allow Access from Anywhere" (0.0.0.0/0)
     - **Option B (More secure):** Add specific Render IP ranges (check Render documentation for current IPs)

3. **Add environment variable in Render:**
   - In your Render dashboard, go to your service
   - Navigate to "Environment" tab
   - Add `MONGODB_URI` with your Atlas connection string
   - Add `JWT_SECRET` with a secure random string

**Note:** The server now includes automatic retry logic and will continue running even if MongoDB connection fails initially. Check the `/health` endpoint to monitor MongoDB connection status.

## Deployment on Render

1. Connect your GitHub repository to Render
2. Set environment variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - A secure random string for JWT tokens
   - `NODE_ENV` - Set to `production`
3. Build command: `npm install --include=dev && npm run build`
4. Start command: `npm start`

The server includes connection retry logic and will attempt to reconnect if the initial connection fails.

## Development

The project uses TypeScript. The source files are in the `src/` directory, and compiled files go to `dist/`.

- `npm run dev` - Run with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for TypeScript compilation

## Troubleshooting

### MongoDB Connection Issues

If you see "Could not connect to any servers in your MongoDB Atlas cluster":

1. **Check IP Whitelist:** Ensure your deployment platform's IP addresses are whitelisted in MongoDB Atlas Network Access
2. **Verify Connection String:** Make sure the `MONGODB_URI` environment variable is set correctly
3. **Check Credentials:** Ensure the username and password in the connection string are correct
4. **Cluster Status:** Verify your MongoDB Atlas cluster is running

The server will retry the connection automatically and display helpful error messages in the logs.
