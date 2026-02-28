// index.js
const express = require('express');
const cors = require('cors');
// IMPORTANT: ObjectId is required for finding specific documents by their ID
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); 
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
    const cartCollection = db.collection("cart");

    // ==========================================
    // API ROUTES
    // ==========================================

    // Basic Health Check Route (Public)
    app.get('/', (req, res) => {
      res.send('B2B Wholesale Server is up and running securely...');
    });


    // ==========================================
    // PRODUCTS MANAGEMENT ROUTES
    // ==========================================

    // 1. Get all products (Public - anyone can view products)
    app.get('/api/products', async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // 2. Get a single product by ID (Protected)
    app.get('/api/products/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // 3. Add a new product (Protected)
    app.post('/api/products', verifyToken, async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    // 4. Update an existing product (Protected)
    app.put('/api/products/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: false };
      const updatedProduct = req.body;

      const product = {
        $set: {
          name: updatedProduct.name,
          image: updatedProduct.image,
          brand: updatedProduct.brand,
          category: updatedProduct.category,
          price: updatedProduct.price,
          description: updatedProduct.description,
          rating: updatedProduct.rating,
          main_quantity: updatedProduct.main_quantity,
          minimum_selling_quantity: updatedProduct.minimum_selling_quantity,
        }
      };

      const result = await productsCollection.updateOne(filter, product, options);
      res.send(result);
    });

    // 5. Get products listed by a specific seller (Protected)
    app.get('/api/my-products', verifyToken, async (req, res) => {
      const email = req.query.email;
      
      // Ensure the JWT token email matches the requested email
      if (req.user.email !== email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }

      const query = { sellerEmail: email };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // 6. Delete a specific product (Protected)
    app.delete('/api/products/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });


    // ==========================================
    // CART & CHECKOUT ROUTES (Inventory Math)
    // ==========================================

    // 1. Add to cart & DECREMENT main_quantity
    app.post('/api/cart', verifyToken, async (req, res) => {
      const cartItem = req.body;
      
      // Step A: Insert into Cart collection
      const insertResult = await cartCollection.insertOne(cartItem);

      // Step B: Decrease stock from the main Products collection
      const filter = { _id: new ObjectId(cartItem.productId) };
      const updateDoc = {
        $inc: { main_quantity: -cartItem.purchaseQuantity } 
      };
      const updateResult = await productsCollection.updateOne(filter, updateDoc);

      res.send({ insertResult, updateResult });
    });

    // 2. Get cart items by user email
    app.get('/api/cart', verifyToken, async (req, res) => {
      const email = req.query.email;
      
      if (req.user.email !== email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }

      const query = { buyerEmail: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // 3. Delete from cart & RESTORE main_quantity
    app.delete('/api/cart/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      
      // Step A: Find the exact cart item to know how much quantity to restore
      const cartQuery = { _id: new ObjectId(id) };
      const cartItem = await cartCollection.findOne(cartQuery);
      
      if (!cartItem) {
        return res.status(404).send({ message: "Cart item not found" });
      }

      // Step B: Delete from the cart
      const deleteResult = await cartCollection.deleteOne(cartQuery);

      // Step C: Increment the stock back into the main Products collection
      const filter = { _id: new ObjectId(cartItem.productId) };
      const updateDoc = {
        $inc: { main_quantity: cartItem.purchaseQuantity }
      };
      const updateResult = await productsCollection.updateOne(filter, updateDoc);

      res.send({ deleteResult, updateResult });
    });


    // ==========================================
    // USER ROUTES
    // ==========================================

    // Example Route: Get all users (Protected)
    app.get('/api/users', verifyToken, async (req, res) => {
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

// Start the Express Server
app.listen(port, () => {
  console.log(`🚀 Server is listening on port ${port}`);
});