const { runQuery, runInsert } = require('../_lib/db');

// CORS middleware
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // Get a specific customer
      const customers = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
      
      if (customers.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.status(200).json(customers[0]);
    } else if (req.method === 'PUT') {
      // Update a customer
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
          'UPDATE customers SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [name, email, phone, id]
        );

        if (result.changes === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }

        const updatedCustomer = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
        res.status(200).json(updatedCustomer[0]);
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        throw error;
      }
    } else if (req.method === 'DELETE') {
      // Delete a customer
      const result = await runInsert('DELETE FROM customers WHERE id = ?', [id]);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.status(200).json({ message: 'Customer deleted successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in customer API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
