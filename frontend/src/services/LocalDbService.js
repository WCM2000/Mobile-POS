import * as SQLite from 'expo-sqlite';

let db;

export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('mobile_pos.db');
    
    // Create Products table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        category TEXT,
        image TEXT
      );
    `);

    // Create Customers table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT
      );
    `);

    // Create Invoices table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        total_amount REAL NOT NULL,
        discount REAL DEFAULT 0,
        date TEXT NOT NULL,
        items TEXT NOT NULL -- JSON string of items
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// Generic function to execute queries
export const getDb = () => db;

// Product Operations
export const addProductLocal = async (name, price, stock, category = '', image = '') => {
  return await db.runAsync(
    'INSERT INTO products (name, price, stock, category, image) VALUES (?, ?, ?, ?, ?)',
    [name, price, stock, category, image]
  );
};

export const getProductsLocal = async () => {
  return await db.getAllAsync('SELECT * FROM products');
};

// Invoice Operations
export const addInvoiceLocal = async (customerName, totalAmount, discount, items) => {
  const date = new Date().toISOString();
  const itemsJson = JSON.stringify(items);
  return await db.runAsync(
    'INSERT INTO invoices (customer_name, total_amount, discount, date, items) VALUES (?, ?, ?, ?, ?)',
    [customerName, totalAmount, discount, date, itemsJson]
  );
};

export const getInvoicesByDateLocal = async (dateStr) => {
  // dateStr format: YYYY-MM-DD
  return await db.getAllAsync('SELECT * FROM invoices WHERE date LIKE ?', [`${dateStr}%`]);
};
