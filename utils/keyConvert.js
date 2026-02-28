// keyConvert.js
const admin = require("firebase-admin");
require("dotenv").config();

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64 in .env file.");
  }

  // Decode Base64 to UTF-8 String
  const decodedKeyString = Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 
    'base64'
  ).toString('utf8');
  
  // Parse to JSON
  const serviceAccount = JSON.parse(decodedKeyString);

  // Initialize Firebase Admin (preventing duplicate initialization)
  if (!admin.apps.length) { 
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  console.log("🔥 Firebase Admin Initialized via Base64");
} catch (error) {
  console.error("❌ Firebase Admin Error:", error.message);
}

module.exports = admin;