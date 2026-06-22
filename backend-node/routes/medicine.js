const express = require('express');
const { queryAll, queryOne, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function toMedicine(m) {
  return {
    id: m.Id, name: m.Name, manufacturer: m.Manufacturer,
    category: m.Category, batchNumber: m.BatchNumber,
    price: m.Price, stockQuantity: m.StockQuantity,
    expiryDate: m.ExpiryDate, createdAt: m.CreatedAt,
    updatedAt: m.UpdatedAt, isActive: m.IsActive === 1
  };
}

// GET /api/medicine - Public
router.get('/', (req, res) => {
  const { search, category, page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const limit = parseInt(pageSize);

  let where = 'WHERE IsActive = 1';
  const params = [];

  if (search) {
    where += ' AND (Name LIKE ? OR Manufacturer LIKE ? OR BatchNumber LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (category) {
    where += ' AND Category = ?';
    params.push(category);
  }

  const totalRow = queryOne(`SELECT COUNT(*) as count FROM Medicines ${where}`, params);
  const total = totalRow ? totalRow.count : 0;

  const medicines = queryAll(
    `SELECT * FROM Medicines ${where} ORDER BY Name ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.set('X-Total-Count', total.toString());
  res.set('X-Page', page.toString());
  res.set('X-Page-Size', pageSize.toString());
  res.json(medicines.map(toMedicine));
});

// GET /api/medicine/categories - Public
router.get('/categories', (req, res) => {
  const rows = queryAll('SELECT DISTINCT Category FROM Medicines WHERE IsActive = 1 ORDER BY Category');
  res.json(rows.map(r => r.Category));
});

// GET /api/medicine/stats - Auth required
router.get('/stats', authMiddleware, (req, res) => {
  const totalMedicines = queryOne('SELECT COUNT(*) as c FROM Medicines WHERE IsActive = 1').c;
  const lowStock = queryOne('SELECT COUNT(*) as c FROM Medicines WHERE IsActive = 1 AND StockQuantity < 10').c;
  const expiringSoon = queryOne("SELECT COUNT(*) as c FROM Medicines WHERE IsActive = 1 AND ExpiryDate <= datetime('now', '+3 months')").c;
  const totalInventoryValue = queryOne('SELECT COALESCE(SUM(Price * StockQuantity), 0) as v FROM Medicines WHERE IsActive = 1').v;
  res.json({ totalMedicines, lowStock, expiringSoon, totalInventoryValue });
});

// GET /api/medicine/:id - Public
router.get('/:id', (req, res) => {
  const medicine = queryOne('SELECT * FROM Medicines WHERE Id = ?', [req.params.id]);
  if (!medicine) return res.status(404).json({ message: 'Not found' });
  res.json(toMedicine(medicine));
});

// POST /api/medicine - Auth required
router.post('/', authMiddleware, (req, res) => {
  const { name, manufacturer, category, batchNumber, price, stockQuantity, expiryDate } = req.body;
  const result = run(
    'INSERT INTO Medicines (Name, Manufacturer, Category, BatchNumber, Price, StockQuantity, ExpiryDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, manufacturer, category, batchNumber, price, stockQuantity, expiryDate]
  );
  const medicine = queryOne('SELECT * FROM Medicines WHERE Id = ?', [result.lastInsertRowid]);
  res.status(201).json(toMedicine(medicine));
});

// PUT /api/medicine/:id - Auth required
router.put('/:id', authMiddleware, (req, res) => {
  const medicine = queryOne('SELECT * FROM Medicines WHERE Id = ?', [req.params.id]);
  if (!medicine) return res.status(404).json({ message: 'Not found' });

  const { name, manufacturer, category, batchNumber, price, stockQuantity, expiryDate, isActive } = req.body;
  const u = {
    Name: name ?? medicine.Name, Manufacturer: manufacturer ?? medicine.Manufacturer,
    Category: category ?? medicine.Category, BatchNumber: batchNumber ?? medicine.BatchNumber,
    Price: price ?? medicine.Price, StockQuantity: stockQuantity ?? medicine.StockQuantity,
    ExpiryDate: expiryDate ?? medicine.ExpiryDate,
    IsActive: isActive !== undefined ? (isActive ? 1 : 0) : medicine.IsActive
  };

  run(
    `UPDATE Medicines SET Name=?, Manufacturer=?, Category=?, BatchNumber=?, Price=?, StockQuantity=?, ExpiryDate=?, IsActive=?, UpdatedAt=datetime('now') WHERE Id = ?`,
    [u.Name, u.Manufacturer, u.Category, u.BatchNumber, u.Price, u.StockQuantity, u.ExpiryDate, u.IsActive, req.params.id]
  );

  const updated = queryOne('SELECT * FROM Medicines WHERE Id = ?', [req.params.id]);
  res.json(toMedicine(updated));
});

// DELETE /api/medicine/:id - Auth required (soft delete)
router.delete('/:id', authMiddleware, (req, res) => {
  const medicine = queryOne('SELECT * FROM Medicines WHERE Id = ?', [req.params.id]);
  if (!medicine) return res.status(404).json({ message: 'Not found' });
  run("UPDATE Medicines SET IsActive = 0, UpdatedAt = datetime('now') WHERE Id = ?", [req.params.id]);
  res.status(204).send();
});

module.exports = router;
