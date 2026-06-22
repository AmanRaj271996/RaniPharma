const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'MedicineStoreSecretKey2024SuperSecureKeyAtLeast32Chars!';
const JWT_ISSUER = 'MedicineStoreAPI';
const JWT_AUDIENCE = 'MedicineStoreApp';

// In-memory database (persists per cold start, resets on new deployment)
// For production, connect to Turso/PlanetScale. This works for demo.
let users = [
  {
    Id: 1,
    Username: 'admin',
    PasswordHash: bcrypt.hashSync('Admin@123', 10),
    FullName: 'Store Administrator',
    Role: 'Admin',
    CreatedAt: new Date().toISOString()
  }
];
let medicines = [];
let nextUserId = 2;
let nextMedicineId = 1;

// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size']
}));

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
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.Username === username);
  if (!user || !bcrypt.compareSync(password, user.PasswordHash)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  res.json({ token: generateToken(user), fullName: user.FullName, role: user.Role });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName } = req.body;
  if (users.find(u => u.Username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  const user = {
    Id: nextUserId++, Username: username,
    PasswordHash: bcrypt.hashSync(password, 10),
    FullName: fullName, Role: 'Admin', CreatedAt: new Date().toISOString()
  };
  users.push(user);
  res.json({ token: generateToken(user), fullName: user.FullName, role: user.Role });
});

// Medicine helpers
function toMedicine(m) {
  return {
    id: m.Id, name: m.Name, manufacturer: m.Manufacturer,
    category: m.Category, batchNumber: m.BatchNumber,
    price: m.Price, stockQuantity: m.StockQuantity,
    expiryDate: m.ExpiryDate, createdAt: m.CreatedAt,
    updatedAt: m.UpdatedAt, isActive: m.IsActive
  };
}

// GET medicines
app.get('/api/medicine', (req, res) => {
  const { search, category, page = 1, pageSize = 20 } = req.query;
  let filtered = medicines.filter(m => m.IsActive);

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(m =>
      m.Name.toLowerCase().includes(s) ||
      m.Manufacturer.toLowerCase().includes(s) ||
      m.BatchNumber.toLowerCase().includes(s)
    );
  }
  if (category) {
    filtered = filtered.filter(m => m.Category === category);
  }

  filtered.sort((a, b) => a.Name.localeCompare(b.Name));
  const total = filtered.length;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const paged = filtered.slice(offset, offset + parseInt(pageSize));

  res.set('X-Total-Count', total.toString());
  res.set('X-Page', page.toString());
  res.set('X-Page-Size', pageSize.toString());
  res.json(paged.map(toMedicine));
});

// GET categories
app.get('/api/medicine/categories', (req, res) => {
  const cats = [...new Set(medicines.filter(m => m.IsActive).map(m => m.Category))].sort();
  res.json(cats);
});

// GET stats
app.get('/api/medicine/stats', authMiddleware, (req, res) => {
  const active = medicines.filter(m => m.IsActive);
  const now = new Date();
  const threeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  res.json({
    totalMedicines: active.length,
    lowStock: active.filter(m => m.StockQuantity < 10).length,
    expiringSoon: active.filter(m => new Date(m.ExpiryDate) <= threeMonths).length,
    totalInventoryValue: active.reduce((sum, m) => sum + m.Price * m.StockQuantity, 0)
  });
});

// GET by id
app.get('/api/medicine/:id', (req, res) => {
  const m = medicines.find(m => m.Id === parseInt(req.params.id));
  if (!m) return res.status(404).json({ message: 'Not found' });
  res.json(toMedicine(m));
});

// POST create
app.post('/api/medicine', authMiddleware, (req, res) => {
  const { name, manufacturer, category, batchNumber, price, stockQuantity, expiryDate } = req.body;
  const m = {
    Id: nextMedicineId++, Name: name, Manufacturer: manufacturer,
    Category: category, BatchNumber: batchNumber, Price: price,
    StockQuantity: stockQuantity, ExpiryDate: expiryDate,
    CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString(), IsActive: true
  };
  medicines.push(m);
  res.status(201).json(toMedicine(m));
});

// PUT update
app.put('/api/medicine/:id', authMiddleware, (req, res) => {
  const m = medicines.find(m => m.Id === parseInt(req.params.id));
  if (!m) return res.status(404).json({ message: 'Not found' });

  const { name, manufacturer, category, batchNumber, price, stockQuantity, expiryDate, isActive } = req.body;
  if (name !== undefined) m.Name = name;
  if (manufacturer !== undefined) m.Manufacturer = manufacturer;
  if (category !== undefined) m.Category = category;
  if (batchNumber !== undefined) m.BatchNumber = batchNumber;
  if (price !== undefined) m.Price = price;
  if (stockQuantity !== undefined) m.StockQuantity = stockQuantity;
  if (expiryDate !== undefined) m.ExpiryDate = expiryDate;
  if (isActive !== undefined) m.IsActive = isActive;
  m.UpdatedAt = new Date().toISOString();

  res.json(toMedicine(m));
});

// DELETE (soft)
app.delete('/api/medicine/:id', authMiddleware, (req, res) => {
  const m = medicines.find(m => m.Id === parseInt(req.params.id));
  if (!m) return res.status(404).json({ message: 'Not found' });
  m.IsActive = false;
  m.UpdatedAt = new Date().toISOString();
  res.status(204).send();
});

module.exports = app;
