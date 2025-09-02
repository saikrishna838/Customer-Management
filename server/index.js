const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000'];

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
    message: {
        error: 'Too many requests from this IP, please try again later.',
        resetTime: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.url === '/api/health'
});

app.use('/api/', limiter);

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Serve static files from React build (for production)
if (NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/build');
    app.use(express.static(clientBuildPath));
}

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
    // Create customers table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create addresses table
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

// Helper function for database queries
const runQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const runInsert = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

// API Routes

// GET /api/customers - Get all customers with optional search and pagination
app.get('/api/customers', async (req, res) => {
    try {
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

        res.json({
            customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/customers/:id - Get a specific customer
app.get('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const customers = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
        
        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customers[0]);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/customers - Create a new customer
app.post('/api/customers', async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        // Validation
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

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
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/customers/:id - Update a customer
app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;

        // Validation
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const result = await runInsert(
            'UPDATE customers SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, email, phone, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const updatedCustomer = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
        res.json(updatedCustomer[0]);
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/customers/:id - Delete a customer
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await runInsert('DELETE FROM customers WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/customers/:id/addresses - Get all addresses for a customer
app.get('/api/customers/:id/addresses', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if customer exists
        const customers = await runQuery('SELECT * FROM customers WHERE id = ?', [id]);
        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const addresses = await runQuery(
            'SELECT * FROM addresses WHERE customer_id = ? ORDER BY created_at DESC',
            [id]
        );

        res.json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/customers/:id/addresses - Add a new address for a customer
app.post('/api/customers/:id/addresses', async (req, res) => {
    try {
        const { id } = req.params;
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
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/addresses/:id - Update an address
app.put('/api/addresses/:id', async (req, res) => {
    try {
        const { id } = req.params;
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
        res.json(updatedAddress[0]);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/addresses/:id - Delete an address
app.delete('/api/addresses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await runInsert('DELETE FROM addresses WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Fallback route to serve React app for client-side routing in production
if (NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/build');
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
