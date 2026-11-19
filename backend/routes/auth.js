const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

function makeToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role`,
            [name, email.toLowerCase(), hash]
        );

        const user = result.rows[0];
        res.status(201).json({ user, token: makeToken(user) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Wrong email or password' });
        }

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token: makeToken(user)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/auth/me  (needs login)
router.get('/me', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;