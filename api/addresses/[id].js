const { runQuery, runInsert } = require('../_lib/db');

// CORS middleware
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT,DELETE,OPTIONS');
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
    if (req.method === 'PUT') {
      // Update an address
      const { street, city, state, zip_code, country, address_type } = req.body;

      // Validation
      if (!street || !city || !state || !zip_code) {
        return res.status(400).json({ error: 'Street, city, state, and zip code are required' });
      }

      const result = await runInsert(
        'UPDATE addresses SET street = ?, city = ?, state = ?, zip_code = ?, country = ?, address_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [street, city, state, zip_code, country || 'USA', address_type || 'home', id]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Address not found' });
      }

      const updatedAddress = await runQuery('SELECT * FROM addresses WHERE id = ?', [id]);
      res.status(200).json(updatedAddress[0]);
    } else if (req.method === 'DELETE') {
      // Delete an address
      const result = await runInsert('DELETE FROM addresses WHERE id = ?', [id]);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Address not found' });
      }

      res.status(200).json({ message: 'Address deleted successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in address API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
