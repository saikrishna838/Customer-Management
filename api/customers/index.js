const { runQuery, runInsert } = require('../_lib/db');

// CORS middleware
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get all customers with optional search and pagination
      const { search, city, page = 1, limit = 10 } = req.query;
      let query = 'SELECT * FROM customers WHERE 1=1';
      let params = [];

      // Add search conditions
      if (search) {
        query += ' AND (name LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (city) {
        query += ` AND id IN (
          SELECT DISTINCT customer_id FROM addresses WHERE city LIKE ?
        )`;
        params.push(`%${city}%`);
      }

      // Add pagination
      const offset = (page - 1) * limit;
      query += ' ORDER BY name LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const customers = await runQuery(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
      let countParams = [];

      if (search) {
        countQuery += ' AND (name LIKE ? OR email LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }

      if (city) {
        countQuery += ` AND id IN (
          SELECT DISTINCT customer_id FROM addresses WHERE city LIKE ?
        )`;
        countParams.push(`%${city}%`);
      }

      const totalResult = await runQuery(countQuery, countParams);
      const total = totalResult[0].total;

      res.status(200).json({
        customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else if (req.method === 'POST') {
      // Create a new customer
      const { name, email, phone } = req.body;

      // Validation
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      try {
        const result = await runInsert(
          'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
          [name, email, phone]
        );

        const newCustomer = await runQuery('SELECT * FROM customers WHERE id = ?', [result.id]);
        res.status(201).json(newCustomer[0]);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        throw error;
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in customers API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
