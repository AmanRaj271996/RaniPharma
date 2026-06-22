const initSqlJs = require('sql.js');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'medicinestore.db');

let db;

async function initialize() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT NOT NULL UNIQUE,
      PasswordHash TEXT NOT NULL,
      FullName TEXT NOT NULL,
      Role TEXT NOT NULL DEFAULT 'Admin',
      CreatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Medicines (
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
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_medicines_name ON Medicines(Name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_medicines_batch ON Medicines(BatchNumber)`);

  const admin = queryOne("SELECT Id FROM Users WHERE Username = ?", ['admin']);
  if (!admin) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    run("INSERT INTO Users (Username, PasswordHash, FullName, Role) VALUES (?, ?, ?, ?)",
      ['admin', hash, 'Store Administrator', 'Admin']);
    console.log('Default admin user created');
  }

  save();
}

function save() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  save();
  return {
    lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0].values[0][0],
    changes: db.getRowsModified()
  };
}

module.exports = { initialize, queryAll, queryOne, run, save };
