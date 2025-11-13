# MongoDB Data API Setup Instructions

## Step 1: Enable Data API in MongoDB Atlas

1. Go to https://cloud.mongodb.com/
2. Select your cluster: **Cluster0**
3. Click on **"Data API"** in the left sidebar (or under Services)
4. Click **"Enable Data API"**
5. You'll get:
   - **Data API URL**: Something like `https://data.mongodb-api.com/app/<APP-ID>/endpoint/data/v1`
   - **API Key**: Create one with read/write permissions

## Step 2: Create API Key

1. In Data API settings, click **"Create API Key"**
2. Name it: `todo-worker-api-key`
3. **Copy the API Key** (you'll only see it once!)

## Step 3: Get Required Values

You'll need these 3 values:

1. **MONGODB_DATA_API_URL**: `https://data.mongodb-api.com/app/<APP-ID>/endpoint/data/v1`
2. **MONGODB_DATA_API_KEY**: The API key you just created
3. **MONGODB_DATABASE**: `todo-db` (or whatever you want to name it)

## Step 4: Set Secrets in Wrangler

Run these commands in PowerShell/CMD:

```bash
cd C:\Users\scrap\dev\vitaliy\test\todo-backend

# Set the Data API URL
wrangler secret put MONGODB_DATA_API_URL --env=""

# Set the API Key
wrangler secret put MONGODB_DATA_API_KEY --env=""

# Set the database name
wrangler secret put MONGODB_DATABASE --env=""

# JWT secret (already set, but verify)
wrangler secret put JWT_SECRET --env=""
```

When prompted, paste the corresponding values.

## Step 5: Deploy

After setting secrets, deploy the Worker:

```bash
wrangler deploy src/worker-dataapi.ts --env=""
```
