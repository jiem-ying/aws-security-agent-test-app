const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Create tables with sample data
db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT,
    email TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    price REAL
  )`);

  // Insert sample data
  db.run(`INSERT INTO users (username, password, email, role) VALUES
    ('admin', 'admin123', 'admin@example.com', 'admin'),
    ('user1', 'password123', 'user1@example.com', 'user'),
    ('testuser', 'test123', 'test@example.com', 'user')`);

  db.run(`INSERT INTO products (name, description, price) VALUES
    ('Laptop', 'High-performance laptop', 999.99),
    ('Mouse', 'Wireless mouse', 29.99),
    ('Keyboard', 'Mechanical keyboard', 89.99)`);
});

// Home page
app.get('/', (req, res) => {
  res.render('index');
});

// Vulnerable to SQL Injection
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // VULNERABILITY: SQL Injection - direct string concatenation
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.get(query, (err, row) => {
    if (err) {
      res.status(500).send('Database error: ' + err.message);
      return;
    }

    if (row) {
      // VULNERABILITY: Storing sensitive data in cookies without encryption
      res.cookie('user', JSON.stringify(row), { httpOnly: false });
      res.send(`
        <h2>Login successful!</h2>
        <p>Welcome ${row.username}</p>
        <p>Role: ${row.role}</p>
        <a href="/dashboard">Go to Dashboard</a>
      `);
    } else {
      res.send('<h2>Login failed!</h2><a href="/">Try again</a>');
    }
  });
});

// Vulnerable to XSS
app.get('/search', (req, res) => {
  const searchTerm = req.query.q;

  // VULNERABILITY: XSS - directly rendering user input without sanitization
  res.send(`
    <html>
      <head><title>Search Results</title></head>
      <body>
        <h1>Search Results for: ${searchTerm}</h1>
        <p>No results found for "${searchTerm}"</p>
        <a href="/">Back to Home</a>
      </body>
    </html>
  `);
});

// Vulnerable to Command Injection
app.get('/ping', (req, res) => {
  const host = req.query.host;

  if (!host) {
    res.send('Please provide a host parameter');
    return;
  }

  // VULNERABILITY: Command Injection
  const { exec } = require('child_process');
  exec(`ping -c 4 ${host}`, (error, stdout, stderr) => {
    res.send(`<pre>${stdout}\n${stderr}</pre>`);
  });
});

// Insecure Direct Object Reference (IDOR)
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;

  // VULNERABILITY: No authorization check
  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) {
      res.status(500).send('Error: ' + err.message);
      return;
    }

    if (row) {
      res.json(row);
    } else {
      res.status(404).send('User not found');
    }
  });
});

// Exposed sensitive information
app.get('/debug', (req, res) => {
  // VULNERABILITY: Information disclosure
  res.json({
    environment: process.env,
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage()
  });
});

// Dashboard (no authentication check)
app.get('/dashboard', (req, res) => {
  // VULNERABILITY: Missing authentication
  const userCookie = req.cookies.user;

  if (userCookie) {
    const user = JSON.parse(userCookie);
    res.send(`
      <h1>Dashboard</h1>
      <p>Welcome ${user.username}</p>
      <p>Email: ${user.email}</p>
      <p>Role: ${user.role}</p>
      <a href="/user/${user.id}">View Profile</a> |
      <a href="/search?q=test">Search</a> |
      <a href="/ping?host=localhost">Ping Test</a> |
      <a href="/debug">Debug Info</a>
    `);
  } else {
    res.send('<h1>Please login first</h1><a href="/">Login</a>');
  }
});

// API endpoint with CORS misconfiguration
app.get('/api/products', (req, res) => {
  // VULNERABILITY: CORS misconfiguration
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');

  db.all('SELECT * FROM products', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('WARNING: This application contains intentional security vulnerabilities for pen-testing purposes only!');
});
