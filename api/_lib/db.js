const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// For Vercel, we'll use a temporary database or suggest external DB
let db = null;

// Initialize database
const initDB = () => {
  if (db) return db;
  
  // In Vercel, we'll use /tmp directory for temporary files
  // Note: This is not persistent across function calls
  // For production, consider using a cloud database
  const dbPath = process.env.VERCEL 
    ? '/tmp/database.sqlite' 
    : path.join(__dirname, '../../server/database.sqlite');
  
  db = new sqlite3.Database(dbPath);
  
  // Initialize tables if they don't exist
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'USA',
      address_type TEXT DEFAULT 'home',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    )`);
  });
  
  return db;
};

// Helper function for database queries
const runQuery = (query, params = []) => {
  const database = initDB();
  return new Promise((resolve, reject) => {
    database.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const runInsert = (query, params = []) => {
  const database = initDB();
  return new Promise((resolve, reject) => {
    database.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

module.exports = {
  initDB,
  runQuery,
  runInsert
};
