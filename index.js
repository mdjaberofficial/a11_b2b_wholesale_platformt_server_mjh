// index.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// 1. Initialize Firebase Admin (Handles Base64 decoding automatically)
const admin = require('./utils/keyConvert'); 

// 2. Import Custom Middleware
const verifyToken = require('./middleware/verifyToken');

const app = express();
const port = process.env.PORT || 3000;

// 3. Global Middleware
app.use(cors());
app.use(express.json());

// 4. MongoDB Connection Setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3l2kzzv.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("🍃 Successfully connected to MongoDB!");

    // Set up Database and Collections
    const db = client.db("myApplicationDB");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");

    // ==========================================
    // API ROUTES
    // ==========================================

    // Basic Health Check Route (Public)
    app.get('/', (req, res) => {
      res.send('Server is up and running securely...');
    });

    // Example Route: Get all products (Public - anyone can view products)
    app.get('/api/products', async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // Example Route: Get all users (Protected - only logged-in users can view this)
    // We insert `verifyToken` right before the async route handler
    app.get('/api/users', verifyToken, async (req, res) => {
      // Because verifyToken passed, we know the user is authenticated
      // req.user contains the decoded Firebase token payload
      console.log("Authenticated request made by:", req.user.email);
      
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

  } finally {
    // Keep the connection open for persistent backend operations
    // await client.close(); 
  }
}

// Run the MongoDB connection function
run().catch(console.dir);

// 5. Start the Express Server
app.listen(port, () => {
  console.log(`🚀 Server is listening on port ${port}`);
});