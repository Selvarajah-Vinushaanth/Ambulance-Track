# MongoDB Atlas Setup Instructions

## 🌐 MongoDB Atlas (Cloud Database - Free)

### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Create your account

### Step 2: Create Cluster
1. Choose "Build a Database"
2. Select "M0 Sandbox" (FREE tier)
3. Choose your preferred region
4. Click "Create Cluster"

### Step 3: Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username/password (save these!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

### Step 4: Allow Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. It looks like: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ambulance-app

### Step 6: Update .env file
Replace your MONGODB_URI with the Atlas connection string:
```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/ambulance-app
```

## 🔧 Local MongoDB Installation

### Windows:
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will start automatically as a service

### Start/Stop MongoDB Service:
```bash
# Start
net start MongoDB

# Stop  
net stop MongoDB
```

### Connection String for Local:
```
MONGODB_URI=mongodb://localhost:27017/ambulance-app
```

## 🐳 Docker Option (Alternative)

If you have Docker installed:
```bash
# Run MongoDB in Docker
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Connection string
MONGODB_URI=mongodb://localhost:27017/ambulance-app
```

## ✅ Test Connection

After setting up MongoDB, test your connection:
```bash
cd d:\ambulance\server
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ambulance-app')
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => console.error('❌ MongoDB connection failed:', err));
"
```
