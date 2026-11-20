const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// ---------- Public routes ----------

// GET /api/products  (optional ?category=Fashion&search=shoe)
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        const params = [];
        let sql = 'SELECT * FROM products WHERE 1=1';

        if (category) {
            params.push(category);
            sql += ` AND category = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            sql += ` AND name ILIKE $${params.length}`;
        }
        sql += ' ORDER BY id';

        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ---------- Admin-only routes ----------

// Checks and cleans the product data sent from the admin form.
// Returns { error } or { data }.
function parseProduct(body) {
    const name = String(body.name || '').trim();
    const price = Number(body.price);
    const stock = Number(body.stock);

    if (!name) return { error: 'Name is required' };
    if (!Number.isFinite(price) || price < 0) return { error: 'Price must be a number, 0 or more' };
    if (!Number.isInteger(stock) || stock < 0) return { error: 'Stock must be a whole number, 0 or more' };

    // Photos: a list of links. The first one is the main photo.
    let images = Array.isArray(body.images) ? body.images : [];
    images = images.map((u) => String(u || '').trim()).filter(Boolean);
    if (images.length === 0 && body.image_url) {
        images = [String(body.image_url).trim()].filter(Boolean); // older single-photo requests
    }
    if (images.length > 8) return { error: 'You can add up to 8 photos per product' };
    if (images.some((u) => !/^(https?:\/\/|\/)/.test(u))) {
        return { error: 'Each photo must be a web link (https://...) or start with /' };
    }
    if (images.length === 0) {
        images = [`https://picsum.photos/seed/${encodeURIComponent(name)}/400`];
    }

    return {
        data: {
            name,
            description: String(body.description || '').trim(),
            price,
            stock,
            images,
            image_url: images[0], // the main photo, used on the shop page and in the cart
            category: String(body.category || '').trim() || null,
        },
    };
}

// POST /api/products
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    const { error, data } = parseProduct(req.body);
    if (error) return res.status(400).json({ message: error });

    try {
        const result = await pool.query(
            `INSERT INTO products (name, description, price, stock, image_url, category, images)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [data.name, data.description, data.price, data.stock, data.image_url, data.category, data.images]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/products/:id
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    const { error, data } = parseProduct(req.body);
    if (error) return res.status(400).json({ message: error });

    try {
        const result = await pool.query(
            `UPDATE products
             SET name = $1, description = $2, price = $3, stock = $4, image_url = $5, category = $6, images = $7
             WHERE id = $8 RETURNING *`,
            [data.name, data.description, data.price, data.stock, data.image_url, data.category, data.images, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/products/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted' });
    } catch (err) {
        // 23503 = the product is used by an existing order, so the database refuses to delete it
        if (err.code === '23503') {
            return res.status(409).json({
                message: 'This product is in past orders, so it cannot be deleted. Set its stock to 0 instead.',
            });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
