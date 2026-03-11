// backend/routes/reports.js

const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { protect } = require('../middleware/auth'); 

// @GET /api/reports/category-breakdown
// @Access Private (Requires JWT)
// Purpose: Get total expenses grouped by category for the current month (for Pie Chart)
router.get('/category-breakdown', protect, async (req, res) => {
    const userId = req.userId;
    // Get year-month string for current month (e.g., '2025-11')
    const currentMonth = new Date().toISOString().substring(0, 7); 

    try {
        // SQL to sum expenses by category for the current month
        const sql = `
            SELECT 
                category, 
                SUM(amount) AS total_spent
            FROM transactions
            WHERE user_id = ? 
            AND type = 'expense'
            AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
            GROUP BY category
            ORDER BY total_spent DESC
        `;
        
        const [results] = await pool.execute(sql, [userId, currentMonth]);

        res.json(results);

    } catch (error) {
        console.error('Category Breakdown Error:', error.message);
        res.status(500).json({ message: 'Server error fetching category breakdown.' });
    }
});

// @GET /api/reports/monthly-summary
// @Access Private (Requires JWT)
// Purpose: Get total income and expenses for the last 6 months (for Bar Chart)
router.get('/monthly-summary', protect, async (req, res) => {
    const userId = req.userId;

    try {
        // SQL to pivot and aggregate data by month for the last 6 months
        const sql = `
            SELECT 
                DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
            FROM transactions
            WHERE user_id = ? 
              AND transaction_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC;
        `;
        
        const [results] = await pool.execute(sql, [userId]);
        
        res.json(results);

    } catch (error) {
        console.error('Monthly Summary Error:', error.message);
        res.status(500).json({ message: 'Server error fetching monthly summary.' });
    }
});

module.exports = router;