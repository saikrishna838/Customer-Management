const { runQuery, runInsert } = require('../../_lib/db');

// CORS middleware
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // Get all addresses for a customer
      
      // Check if customer exists
      const customers = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
      if (customers.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const addresses = await runQuery(
        'SELECT * FROM addresses WHERE customer_id = ? ORDER BY created_at DESC',
        [id]
      );

      res.status(200).json(addresses);
    } else if (req.method === 'POST') {
      // Add a new address for a customer
      const { street, city, state, zip_code, country = 'USA', address_type = 'home' } = req.body;

      // Validation
      if (!street || !city || !state || !zip_code) {
        return res.status(400).json({ error: 'Street, city, state, and zip code are required' });
      }

      // Check if customer exists
      const customers = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
      if (customers.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const result = await runInsert(
        'INSERT INTO addresses (customer_id, street, city, state, zip_code, country, address_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, street, city, state, zip_code, country, address_type]
      );

      const newAddress = await runQuery('SELECT * FROM addresses WHERE id = ?', [result.id]);
      res.status(201).json(newAddress[0]);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in addresses API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
