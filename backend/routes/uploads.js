const express = require('express');
const crypto = require('crypto');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// POST /api/uploads/sign   (admin only)
// Gives the browser a short-lived signature so it can upload ONE photo straight to Cloudinary.
// The API secret never leaves the server.
router.post('/sign', requireAuth, requireAdmin, (req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({ message: 'Cloudinary keys are not set in the backend settings' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'sri-kumudha-trends';

    // Cloudinary signature = SHA-1 of "folder=...&timestamp=..." followed directly by the API secret
    const signature = crypto
        .createHash('sha1')
        .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');

    res.json({ cloud_name: cloudName, api_key: apiKey, timestamp, folder, signature });
});

module.exports = router;
