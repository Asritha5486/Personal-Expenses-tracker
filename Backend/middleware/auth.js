// backend/middleware/auth.js

const jwt = require('jsonwebtoken');

// Middleware to verify the JWT token sent in the request header
const protect = (req, res, next) => {
    // 1. Check for the token in the headers
    let token;

    // The token is typically sent as: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get the token from the header (remove 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Attach the user ID to the request object
            // This makes the user's ID available in all protected routes
            req.userId = decoded.userId;

            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            // Handle token invalidity (e.g., expired, incorrect secret)
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        // Handle case where no token is provided
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };