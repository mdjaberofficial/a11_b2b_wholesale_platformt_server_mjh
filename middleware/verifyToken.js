// middleware/verifyToken.js
const admin = require('../utils/keyConvert'); // Import your initialized Firebase Admin

const verifyToken = async (req, res, next) => {
  // 1. Check if the authorization header exists
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access: No token provided' });
  }

  // 2. Extract the token (Format is usually "Bearer [token]")
  const token = authHeader.split(' ')[1];

  try {
    // 3. Use Firebase Admin to verify the token's validity
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 4. Attach the decoded user data (like email and uid) to the request object
    req.user = decodedToken; 
    
    // 5. Move to the next function (your route handler)
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).send({ message: 'Forbidden access: Invalid or expired token' });
  }
};

module.exports = verifyToken;