// backend/routes/transactions.js

const express = require('express');
const router = express.Router();
const pool = require('../database/db'); // MySQL connection pool
const { protect } = require('../middleware/auth'); // Import the middleware

// @POST /api/transactions
// @Access Private (Requires JWT)
// Purpose: Log a new expense or income record for the authenticated user
router.post('/', protect, async (req, res) => {
    // req.userId is available because of the 'protect' middleware!
    const userId = req.userId; 
    
    // Get transaction details from the request body
    const { amount, type, category, description, transaction_date } = req.body;

    // Basic validation
    if (!amount || !type || !category) {
        return res.status(400).json({ message: 'Amount, type, and category are required.' });
    }

    try {
        // Note: The '?' placeholders are used by mysql2 for security (prepared statements)
        const sql = `
            INSERT INTO transactions 
            (user_id, amount, type, category, description, transaction_date) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.execute(sql, [
            userId,
            amount,
            type,
            category,
            description || null, // Allow description to be optional/null
            transaction_date || new Date() // Use provided date or current date
        ]);

        // Success response
        res.status(201).json({ 
            message: 'Transaction successfully logged.',
            transactionId: result.insertId 
        });

    } catch (error) {
        console.error('Transaction Logging Error:', error.message);
        res.status(500).json({ message: 'Server error while logging transaction.' });
    }
});

module.exports = router;