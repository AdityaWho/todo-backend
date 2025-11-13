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

Make sure MongoDB is running locally or update the `MONGODB_URI` in your `.env` file to point to your MongoDB instance (e.g., MongoDB Atlas).

## Development

The project uses TypeScript. The source files are in the `src/` directory, and compiled files go to `dist/`.

- `npm run dev` - Run with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for TypeScript compilation
