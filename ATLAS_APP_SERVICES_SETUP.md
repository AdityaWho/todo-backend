# MongoDB Atlas App Services Setup Guide

## Step 1: Create an App Service

1. Go to https://cloud.mongodb.com/
2. Select your project
3. Click **"App Services"** in the left sidebar (or top menu)
4. Click **"Create a New App"** or **"Build your own App"**
5. Configure:
   - **Name**: `todo-app`
   - **Linked Data Source**: Select your `Cluster0`
   - **Deployment Model**: Choose **Global** or your preferred region
6. Click **"Create App Service"**

## Step 2: Enable HTTPS Endpoints

1. In your App Service, go to **"HTTPS Endpoints"** in the left sidebar
2. Click **"Add An Endpoint"**
3. You'll create custom endpoints for each operation

**OR** (Easier option):

## Alternative: Use GraphQL API

1. In your App Service, go to **"GraphQL"** in the left sidebar
2. Click **"Enable GraphQL"**
3. Define your schema for Users and Todos
4. GraphQL endpoint will be available at:
   ```
   https://realm.mongodb.com/api/client/v2.0/app/<APP-ID>/graphql
   ```

## Step 3: Get Your App ID

1. In your App Service dashboard, look at the top
2. You'll see **"App ID"**: `todo-app-xxxxx`
3. Copy this App ID

## Step 4: Create API Key

1. Go to **"Authentication"** → **"API Keys"**
2. Click **"Create API Key"**
3. Name: `worker-api-key`
4. Copy the API Key

## Step 5: Configure Data Access Rules

1. Go to **"Rules"** in the left sidebar
2. For `users` collection:
   - Allow: Insert, Find
   - Configure permissions
3. For `todos` collection:
   - Allow: Insert, Find, Update, Delete
   - Configure permissions based on user

---

## Simpler Alternative: Use Atlas as REST API

If the above is too complex, I can help you:
1. Deploy your Express backend on **Render** (free tier)
2. Keep Cloudflare Pages for frontend
3. This way your existing Express+MongoDB code works as-is!

**Would you like me to help you with Render deployment instead?**
