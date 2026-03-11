// backend/database/db.js (UPDATED for MySQL)

const mysql = require('mysql2/promise'); // Using 'mysql2/promise' for async/await support

// Create a connection pool using environment variables
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306, // Use 3306 for MySQL
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Simple test to ensure connection
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the MySQL database.');
        connection.release(); // Release the connection back to the pool
    })
    .catch(err => {
        console.error('MySQL Connection Error:', err.message);
    });

module.exports = pool;