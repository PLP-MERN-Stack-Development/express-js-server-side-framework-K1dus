// server.js - Complete Express.js API for Week 2 assignment

const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || '12345'; // Example API key for authentication

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Custom Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Authentication Middleware
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  next();
}

// Validation Middleware
function validateProduct(req, res, next) {
  const { name, description, price, category, inStock } = req.body;
  if (
    !name || typeof name !== 'string' ||
    !description || typeof description !== 'string' ||
    typeof price !== 'number' ||
    !category || typeof category !== 'string' ||
    typeof inStock !== 'boolean'
  ) {
    return res.status(400).json({ error: 'Validation Error: Invalid product data' });
  }
  next();
}

// Custom Error Classes
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.status = 404;
  }
}
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

// Sample in-memory products database
let products = [
  { id: '1', name: 'Laptop', description: 'High-performance laptop with 16GB RAM', price: 1200, category: 'electronics', inStock: true },
  { id: '2', name: 'Smartphone', description: 'Latest model with 128GB storage', price: 800, category: 'electronics', inStock: true },
  { id: '3', name: 'Coffee Maker', description: 'Programmable coffee maker with timer', price: 50, category: 'kitchen', inStock: false }
];

// Root Route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// =======================
// CRUD ROUTES
// =======================

// GET /api/products - List all products (with optional filtering, pagination)
app.get('/api/products', (req, res) => {
  let result = [...products];

  // Filter by category
  if (req.query.category) {
    result = result.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || result.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResult = result.slice(startIndex, endIndex);

  res.json({ total: result.length, page, limit, data: paginatedResult });
});

// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return next(new NotFoundError('Product not found'));
  res.json(product);
});

// POST /api/products - Create a new product
app.post('/api/products', authenticate, validateProduct, (req, res) => {
  const newProduct = { id: uuidv4(), ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /api/products/:id - Update an existing product
app.put('/api/products/:id', authenticate, validateProduct, (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError('Product not found'));

  products[index] = { id: req.params.id, ...req.body };
  res.json(products[index]);
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', authenticate, (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError('Product not found'));

  const deleted = products.splice(index, 1);
  res.json({ message: 'Product deleted', product: deleted[0] });
});

// =======================
// Advanced Features
// =======================

// GET /api/products/search?name=xyz - Search products by name
app.get('/api/products/search', (req, res) => {
  const query = req.query.name ? req.query.name.toLowerCase() : '';
  const results = products.filter(p => p.name.toLowerCase().includes(query));
  res.json({ total: results.length, data: results });
});

// GET /api/products/stats - Product statistics (count by category)
app.get('/api/products/stats', (req, res) => {
  const stats = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  res.json(stats);
});

// =======================
// Global Error Handler
// =======================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

// Export app for testing
module.exports = app;
