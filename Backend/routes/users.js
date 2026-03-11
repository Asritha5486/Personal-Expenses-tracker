// backend/routes/users.js

const express = require('express');
const router = express.Router();
const pool = require('../database/db'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 

// Number of salt rounds for bcrypt
const saltRounds = 10;
// Get JWT Secret from environment variables (CRITICAL)
const jwtSecret = process.env.JWT_SECRET; 

// @POST /api/users/register 
// Purpose: Register a new user
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // 1. Hash the password
        const password_hash = await bcrypt.hash(password, saltRounds);

        // 2. Insert the new user into the database (using MySQL '?' placeholders)
        const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
        
        // pool.execute is the correct method for prepared statements in mysql2
        const [result] = await pool.execute(sql, [username, password_hash]);

        // Success response
        res.status(201).json({ 
            message: 'User registered successfully! Please log in.',
            userId: result.insertId
        });

    } catch (error) {
        // Handle MySQL duplicate entry error (error code for unique constraint violation)
        if (error.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ message: 'Username already taken.' });
        }
        console.error('Registration Error:', error.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// @POST /api/users/login
// Purpose: Authenticate user and issue a JWT
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // 1. Find the user by username (using MySQL '?' placeholder)
        const sql = 'SELECT * FROM users WHERE username = ?';
        const [rows] = await pool.execute(sql, [username]);
        
        // MySQL results are in rows[0]
        const user = rows[0]; 

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 2. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 3. Issue a JSON Web Token (JWT)
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            jwtSecret,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Success response: Send the token back to the client
        res.json({ 
            message: 'Login successful!',
            token,
            userId: user.id
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;