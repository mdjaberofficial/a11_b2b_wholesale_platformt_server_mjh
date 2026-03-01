// index.js
const express = require('express');
const cors = require('cors');
// IMPORTANT: ObjectId is required for finding specific documents by their ID
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 1. Global Middleware
app.use(cors());
app.use(express.json());

// 2. MongoDB Connection Setup
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

    // Basic Health Check Route
    app.get('/', (req, res) => {
      res.send('B2B Wholesale Server is up and running (Public Mode)...');
    });


    // ==========================================
    // PRODUCTS MANAGEMENT ROUTES
    // ==========================================

    // 1. Get all products
    app.get('/api/products', async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // 2. Get a single product by ID
    app.get('/api/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // 3. Add a new product
    app.post('/api/products', async (req, res) => {
        const product = req.body;
        // Fixed: changed productCollection to productsCollection
        const result = await productsCollection.insertOne(product);
        res.send(result);
    });

    // 4. Update an existing product
    app.put('/api/products/:id', async (req, res) => {
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

    // 5. Get products listed by a specific seller (via query param)
    app.get('/api/my-products', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: 'Email query parameter is required' });
      }
      const query = { sellerEmail: email };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // 6. Delete a specific product
    app.delete('/api/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });


    // ==========================================
    // CART & CHECKOUT ROUTES
    // ==========================================

    // 1. Add to cart & DECREMENT main_quantity
    app.post('/api/cart', async (req, res) => {
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
    app.get('/api/cart', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: 'Email query parameter is required' });
      }
      const query = { buyerEmail: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // 3. Delete from cart & RESTORE main_quantity
    app.delete('/api/cart/:id', async (req, res) => {
      const id = req.params.id;
      
      const cartQuery = { _id: new ObjectId(id) };
      const cartItem = await cartCollection.findOne(cartQuery);
      
      if (!cartItem) {
        return res.status(404).send({ message: "Cart item not found" });
      }

      const deleteResult = await cartCollection.deleteOne(cartQuery);

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

    app.get('/api/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

  } finally {
    // Keep connection open
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`🚀 Server is listening on port ${port}`);
});