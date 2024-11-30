const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'AS!12345',
  database: 'book_review_db'
}).promise();

async function initializeDatabase() {
  try {
    await pool.query(`CREATE DATABASE IF NOT EXISTS book_review_db`);
    await pool.query(`USE book_review_db`);

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT
      )
    `);

    // Books table with category
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT,
        cover_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Reviews table with user reference
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        book_id INT,
        user_id INT,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Insert default categories
    await pool.query(`
      INSERT IGNORE INTO categories (name, description) VALUES 
      ('Fiction', 'Fictional literature and novels'),
      ('Non-Fiction', 'Educational and factual books'),
      ('Science Fiction', 'Science fiction and fantasy'),
      ('Mystery', 'Mystery and thriller books'),
      ('Biography', 'Biographical and autobiographical books')
    `);

    console.log('Database and tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initializeDatabase();

module.exports = pool;