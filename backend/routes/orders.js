const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

function httpError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

// POST /api/orders   body: { "items": [ { "product_id": 1, "quantity": 2 } ] }
router.post('/', requireAuth, async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }
    for (const item of items) {
        if (!Number.isInteger(item.product_id) || !Number.isInteger(item.quantity) || item.quantity < 1) {
            return res.status(400).json({ message: 'Each item needs a product_id and a quantity of 1 or more' });
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let total = 0;
        const lines = [];

        for (const item of items) {
            // FOR UPDATE locks the row so two buyers can't take the same last item
            const p = await client.query(
                'SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE',
                [item.product_id]
            );
            const product = p.rows[0];

            if (!product) throw httpError(404, `Product ${item.product_id} not found`);
            if (product.stock < item.quantity) {
                throw httpError(400, `Not enough stock for ${product.name} (only ${product.stock} left)`);
            }

            await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, product.id]);

            total += Number(product.price) * item.quantity;
            lines.push({
                product_id: product.id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }

        total = Math.round(total * 100) / 100;

        const order = await client.query(
            'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id, total, status, created_at',
            [req.user.id, total]
        );
        const orderId = order.rows[0].id;

        for (const line of lines) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, line.product_id, line.quantity, line.price]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ ...order.rows[0], items: lines });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// GET /api/orders/my  -> the logged-in user's orders
router.get('/my', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.id, o.total, o.status, o.created_at,
                    COALESCE(
                      json_agg(json_build_object(
                        'product_id', oi.product_id,
                        'name', p.name,
                        'quantity', oi.quantity,
                        'price', oi.price
                      )) FILTER (WHERE oi.id IS NOT NULL),
                      '[]'
                    ) AS items
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE o.user_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ---------- Admin-only routes ----------

// GET /api/orders  -> every customer's orders
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.id, o.total, o.status, o.created_at,
                    u.name AS customer_name, u.email AS customer_email,
                    COALESCE(
                      json_agg(json_build_object(
                        'product_id', oi.product_id,
                        'name', p.name,
                        'quantity', oi.quantity,
                        'price', oi.price
                      )) FILTER (WHERE oi.id IS NOT NULL),
                      '[]'
                    ) AS items
             FROM orders o
             LEFT JOIN users u ON u.id = o.user_id
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products p ON p.id = oi.product_id
             GROUP BY o.id, u.name, u.email
             ORDER BY o.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/orders/:id/status   body: { "status": "shipped" }
// Cancelling an order puts its items back into stock.
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(orderId)) {
        return res.status(400).json({ message: 'Invalid order id' });
    }
    if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const current = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
        if (current.rows.length === 0) throw httpError(404, 'Order not found');

        const oldStatus = current.rows[0].status;
        if (oldStatus === 'cancelled' && status !== 'cancelled') {
            throw httpError(400, 'A cancelled order cannot be reopened');
        }

        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            const items = await client.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
                [orderId]
            );
            for (const it of items.rows) {
                await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [
                    it.quantity,
                    it.product_id,
                ]);
            }
        }

        await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
        await client.query('COMMIT');
        res.json({ id: orderId, status });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

module.exports = router;
