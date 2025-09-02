// Cloud Database Configuration for Vercel
// This file provides configurations for cloud database services

// Option 1: PostgreSQL with Vercel Postgres
const { createClient } = require('@vercel/postgres');

const createPostgresClient = () => {
  return createClient({
    connectionString: process.env.POSTGRES_URL,
  });
};

// Option 2: MySQL with PlanetScale
const mysql = require('mysql2/promise');

const createMySQLConnection = () => {
  return mysql.createConnection({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    ssl: {
      rejectUnauthorized: true
    }
  });
};

// Option 3: In-memory storage for demo purposes (not recommended for production)
let memoryDB = {
  customers: [],
  addresses: [],
  nextCustomerId: 1,
  nextAddressId: 1
};

// PostgreSQL helper functions
const runPostgresQuery = async (query, params = []) => {
  const client = createPostgresClient();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    await client.end();
  }
};

// MySQL helper functions
const runMySQLQuery = async (query, params = []) => {
  const connection = await createMySQLConnection();
  try {
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
};

// In-memory helper functions (for demo only)
const runMemoryQuery = async (query, params = []) => {
  // Simple in-memory implementation for demo
  if (query.includes('SELECT * FROM customers')) {
    return memoryDB.customers;
  }
  if (query.includes('SELECT * FROM addresses')) {
    return memoryDB.addresses;
  }
  return [];
};

const runMemoryInsert = async (query, params = []) => {
  if (query.includes('INSERT INTO customers')) {
    const [name, email, phone] = params;
    const customer = {
      id: memoryDB.nextCustomerId++,
      name,
      email,
      phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryDB.customers.push(customer);
    return { id: customer.id, changes: 1 };
  }
  
  if (query.includes('INSERT INTO addresses')) {
    const [customer_id, street, city, state, zip_code, country, address_type] = params;
    const address = {
      id: memoryDB.nextAddressId++,
      customer_id,
      street,
      city,
      state,
      zip_code,
      country,
      address_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryDB.addresses.push(address);
    return { id: address.id, changes: 1 };
  }
  
  return { id: null, changes: 0 };
};

// Export based on environment
const DB_TYPE = process.env.DATABASE_TYPE || 'memory';

let runQuery, runInsert;

switch (DB_TYPE) {
  case 'postgres':
    runQuery = runPostgresQuery;
    runInsert = runPostgresQuery;
    break;
  case 'mysql':
    runQuery = runMySQLQuery;
    runInsert = runMySQLQuery;
    break;
  default:
    runQuery = runMemoryQuery;
    runInsert = runMemoryInsert;
}

module.exports = {
  runQuery,
  runInsert,
  memoryDB // For debugging
};
