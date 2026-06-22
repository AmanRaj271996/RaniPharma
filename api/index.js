const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@libsql/client');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'MedicineStoreSecretKey2024SuperSecureKeyAtLeast32Chars!';
const JWT_ISSUER = 'MedicineStoreAPI';
const JWT_AUDIENCE = 'MedicineStoreApp';

// Turso Database
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined
});

// Initialize database tables
let dbInitialized = false;
async function initDb() {
  if (dbInitialized) return;
  await db.batch([
    `CREATE TABLE IF NOT EXISTS Users (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT NOT NULL UNIQUE,
      PasswordHash TEXT NOT NULL,
      FullName TEXT NOT NULL,
      Role TEXT NOT NULL DEFAULT 'Admin',
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS Medicines (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Manufacturer TEXT NOT NULL,
      Category TEXT NOT NULL,
      BatchNumber TEXT NOT NULL,
      Price REAL NOT NULL,
      StockQuantity INTEGER NOT NULL,
      ExpiryDate TEXT NOT NULL,
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      IsActive INTEGER NOT NULL DEFAULT 1
    )`
  ]);

  // Seed admin if not exists
  const admin = await db.execute({ sql: 'SELECT Id FROM Users WHERE Username = ?', args: ['admin'] });
  if (admin.rows.length === 0) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    await db.execute({
      sql: 'INSERT INTO Users (Username, PasswordHash, FullName, Role) VALUES (?, ?, ?, ?)',
      args: ['admin', hash, 'Store Administrator', 'Admin']
    });
  }
  dbInitialized = true;
}

// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size']
}));

// Ensure DB is ready before handling requests
app.use(async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database initialization failed', error: err.message });
  }
});

function generateToken(user) {
  return jwt.sign(
    { id: user.Id, username: user.Username, fullName: user.FullName, role: user.Role },
    JWT_SECRET,
    { expiresIn: '24h', issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await db.execute({ sql: 'SELECT * FROM Users WHERE Username = ?', args: [username] });
  const user = result.rows[0];
  if (!user || !bcrypt.compareSync(password, user.PasswordHash)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  res.json({ token: generateToken(user), fullName: user.FullName, role: user.Role });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, fullName } = req.body;
  const existing = await db.execute({ sql: 'SELECT Id FROM Users WHERE Username = ?', args: [username] });
  if (existing.rows.length > 0) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = await db.execute({
    sql: 'INSERT INTO Users (Username, PasswordHash, FullName, Role) VALUES (?, ?, ?, ?)',
    args: [username, hash, fullName, 'Admin']
  });
  const user = { Id: Number(result.lastInsertRowid), Username: username, FullName: fullName, Role: 'Admin' };
  res.json({ token: generateToken(user), fullName: user.FullName, role: user.Role });
});

// Medicine helpers
function toMedicine(m) {
  return {
    id: m.Id, name: m.Name, manufacturer: m.Manufacturer,
    category: m.Category, batchNumber: m.BatchNumber,
    price: m.Price, stockQuantity: m.StockQuantity,
    expiryDate: m.ExpiryDate, createdAt: m.CreatedAt,
    updatedAt: m.UpdatedAt, isActive: m.IsActive === 1
  };
}

// GET medicines
app.get('/api/medicine', async (req, res) => {
  const { search, category, page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const limit = parseInt(pageSize);

  let where = 'WHERE IsActive = 1';
  const args = [];

  if (search) {
    where += ' AND (Name LIKE ? OR Manufacturer LIKE ? OR BatchNumber LIKE ?)';
    const term = `%${search}%`;
    args.push(term, term, term);
  }
  if (category) {
    where += ' AND Category = ?';
    args.push(category);
  }

  const countResult = await db.execute({ sql: `SELECT COUNT(*) as count FROM Medicines ${where}`, args });
  const total = countResult.rows[0].count;

  const result = await db.execute({
    sql: `SELECT * FROM Medicines ${where} ORDER BY Name ASC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset]
  });

  res.set('X-Total-Count', total.toString());
  res.set('X-Page', page.toString());
  res.set('X-Page-Size', pageSize.toString());
  res.json(result.rows.map(toMedicine));
});

// GET categories
app.get('/api/medicine/categories', async (req, res) => {
  const result = await db.execute('SELECT DISTINCT Category FROM Medicines WHERE IsActive = 1 ORDER BY Category');
  res.json(result.rows.map(r => r.Category));
});

// GET stats
app.get('/api/medicine/stats', authMiddleware, async (req, res) => {
  const total = await db.execute('SELECT COUNT(*) as c FROM Medicines WHERE IsActive = 1');
  const low = await db.execute('SELECT COUNT(*) as c FROM Medicines WHERE IsActive = 1 AND StockQuantity < 10');
  const expiring = await db.execute("SELECT COUNT(*) as c FROM Medicines WHERE IsActive = 1 AND ExpiryDate <= datetime('now', '+3 months')");
  const value = await db.execute('SELECT COALESCE(SUM(Price * StockQuantity), 0) as v FROM Medicines WHERE IsActive = 1');
  res.json({
    totalMedicines: total.rows[0].c,
    lowStock: low.rows[0].c,
    expiringSoon: expiring.rows[0].c,
    totalInventoryValue: value.rows[0].v
  });
});

// GET by id
app.get('/api/medicine/:id', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT * FROM Medicines WHERE Id = ?', args: [req.params.id] });
  if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
  res.json(toMedicine(result.rows[0]));
});

// POST create
app.post('/api/medicine', authMiddleware, async (req, res) => {
  const { name, manufacturer, category, batchNumber, price, stockQuantity, expiryDate } = req.body;
  const result = await db.execute({
    sql: 'INSERT INTO Medicines (Name, Manufacturer, Category, BatchNumber, Price, StockQuantity, ExpiryDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [name, manufacturer, category, batchNumber, price, stockQuantity, expiryDate]
  });
  const med = await db.execute({ sql: 'SELECT * FROM Medicines WHERE Id = ?', args: [Number(result.lastInsertRowid)] });
  res.status(201).json(toMedicine(med.rows[0]));
});

// PUT update
app.put('/api/medicine/:id', authMiddleware, async (req, res) => {
  const existing = await db.execute({ sql: 'SELECT * FROM Medicines WHERE Id = ?', args: [req.params.id] });
  if (existing.rows.length === 0) return res.status(404).json({ message: 'Not found' });
  const m = existing.rows[0];

  const { name, manufacturer, category, batchNumber, price, stockQuantity, expiryDate, isActive } = req.body;
  await db.execute({
    sql: `UPDATE Medicines SET Name=?, Manufacturer=?, Category=?, BatchNumber=?, Price=?, StockQuantity=?, ExpiryDate=?, IsActive=?, UpdatedAt=datetime('now') WHERE Id = ?`,
    args: [
      name ?? m.Name, manufacturer ?? m.Manufacturer, category ?? m.Category,
      batchNumber ?? m.BatchNumber, price ?? m.Price, stockQuantity ?? m.StockQuantity,
      expiryDate ?? m.ExpiryDate, isActive !== undefined ? (isActive ? 1 : 0) : m.IsActive,
      req.params.id
    ]
  });
  const updated = await db.execute({ sql: 'SELECT * FROM Medicines WHERE Id = ?', args: [req.params.id] });
  res.json(toMedicine(updated.rows[0]));
});

// DELETE (soft)
app.delete('/api/medicine/:id', authMiddleware, async (req, res) => {
  const existing = await db.execute({ sql: 'SELECT * FROM Medicines WHERE Id = ?', args: [req.params.id] });
  if (existing.rows.length === 0) return res.status(404).json({ message: 'Not found' });
  await db.execute({
    sql: "UPDATE Medicines SET IsActive = 0, UpdatedAt = datetime('now') WHERE Id = ?",
    args: [req.params.id]
  });
  res.status(204).send();
});

module.exports = app;
