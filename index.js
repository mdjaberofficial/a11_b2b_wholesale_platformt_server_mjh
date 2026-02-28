// index.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// 1. Initialize Firebase Admin
// Inside index.js
const admin = require('./utils/keyConvert'); // This now automatically handles the Base64 decoding

const app = express();
const port = process.env.PORT || 3000;

// 2. Global Middleware
app.use(cors());
app.use(express.json());

// 3. MongoDB Connection Setup
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

    // Set up Database and Collections here
    const db = client.db("myApplicationDB");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");

    // ==========================================
    // API ROUTES GO HERE
    // ==========================================

    // Basic Health Check Route
    app.get('/', (req, res) => {
      res.send('Server is up and running...');
    });

    // Example Route: Get all users
    app.get('/api/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

  } finally {
    // Keep the connection open for persistent backend
    // await client.close(); 
  }
}

// Run the MongoDB connection function
run().catch(console.dir);

// 4. Start the Express Server
app.listen(port, () => {
  console.log(`🚀 Server is listening on port ${port}`);
});