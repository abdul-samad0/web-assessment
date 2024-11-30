const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Home page with featured books and categories
router.get('/', async (req, res) => {
  try {
    const [books] = await db.query(`
      SELECT b.*, c.name as category_name, 
      (SELECT AVG(rating) FROM reviews WHERE book_id = b.id) as avg_rating
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.created_at DESC LIMIT 6
    `);
    
    const [categories] = await db.query('SELECT * FROM categories');
    res.render('home', { books, categories });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

// Book details page with reviews
router.get('/book/:id', async (req, res) => {
  try {
    const [books] = await db.query(`
      SELECT b.*, c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [req.params.id]);

    const [reviews] = await db.query(`
      SELECT r.*, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.book_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    res.render('book/details', { book: books[0], reviews });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

// Add book form (protected route)
router.get('/add-book', auth.isAuthenticated, async (req, res) => {
  const [categories] = await db.query('SELECT * FROM categories');
  res.render('book/add-book', { categories });
});

// Add book POST handler
router.post('/add-book', auth.isAuthenticated, upload.single('cover_image'), async (req, res) => {
  const { title, author, description, category_id } = req.body;
  const cover_image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await db.query(
      'INSERT INTO books (title, author, description, category_id, cover_image) VALUES (?, ?, ?, ?, ?)',
      [title, author, description, category_id, cover_image]
    );
    req.flash('success', 'Book added successfully');
    res.redirect('/');
  } catch (error) {
    req.flash('error', 'Failed to add book');
    res.redirect('/add-book');
  }
});

// Add review
router.post('/book/:id/review', auth.isAuthenticated, async (req, res) => {
  const { rating, comment } = req.body;
  const book_id = req.params.id;
  const user_id = req.session.userId;

  try {
    await db.query(
      'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [book_id, user_id, rating, comment]
    );
    req.flash('success', 'Review added successfully');
    res.redirect(`/book/${book_id}`);
  } catch (error) {
    req.flash('error', 'Failed to add review');
    res.redirect(`/book/${book_id}`);
  }
});

// Search with filters
router.get('/search', async (req, res) => {
  const { query, category } = req.query;
  try {
    let sql = `
      SELECT b.*, c.name as category_name,
      (SELECT AVG(rating) FROM reviews WHERE book_id = b.id) as avg_rating
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += ` AND (b.title LIKE ? OR b.author LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }

    if (category) {
      sql += ` AND b.category_id = ?`;
      params.push(category);
    }

    const [books] = await db.query(sql, params);
    const [categories] = await db.query('SELECT * FROM categories');
    
    res.render('search', { books, categories, query, selectedCategory: category });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

module.exports = router;