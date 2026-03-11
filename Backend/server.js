// backend/server.js

// 1. Load Environment Variables 
require('dotenv').config();

// 2. Import Core Libraries and Custom Files
const express = require('express');
const cors = require('cors');
// The pool variable now holds the MySQL connection pool
const pool = require('./database/db'); 
const userRoutes = require('./routes/users'); 
const transactionRoutes = require('./routes/transactions'); 
const reportRoutes = require('./routes/reports'); // Import the Reports router

// --- 3. Initialize Express App and Middleware ---
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes (important for frontend communication)
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// --- 4. Core Routes ---

// @GET /api/test
// Purpose: Test route to verify server and database connection status
app.get('/api/test', async (req, res) => {
    try {
        // FIX: Use backticks (`) around the alias for compatibility with MySQL
        const [rows] = await pool.query('SELECT NOW() AS `current_time`'); 
        
        // Respond with success
        res.json({ 
            message: 'Backend API is running and connected to the database!',
            databaseTime: rows[0].current_time, 
            status: 'ok'
        });
    } catch (error) {
        console.error('Database Connection Error:', error.message); // Log only the message for cleaner output
        // Respond with error details if connection fails
        res.status(500).json({ 
            message: 'Backend API is running, but FAILED to connect to the database.',
            error: error.message,
            status: 'error'
        });
    }
});

// --- 5. API Endpoints (Mounting the Routers) ---

// All user-related routes (registration, login, profile)
app.use('/api/users', userRoutes); 

// Routes for adding, viewing, and managing expenses
app.use('/api/transactions', transactionRoutes); 

// Routes for D3.js reports and dashboard data
app.use('/api/reports', reportRoutes); // <--- MOUNT REPORTS ROUTER

// --- 6. Server Initialization ---
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});