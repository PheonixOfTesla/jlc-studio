// Vercel Serverless Function - Authentication
// Set ADMIN_USERNAME and ADMIN_PASSWORD in Vercel Environment Variables

const crypto = require('crypto');

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { username, password } = req.body;

        // Get credentials from environment variables
        const validUsername = process.env.ADMIN_USERNAME || 'jlcstudio';
        const validPassword = process.env.ADMIN_PASSWORD || 'JLC2024!';

        // Simple comparison (in production, use hashed passwords)
        if (username === validUsername && password === validPassword) {
            const token = generateToken();
            const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

            // Store token in response (in production, use a database or KV store)
            return res.status(200).json({
                success: true,
                token: token,
                expiresAt: expiresAt,
                user: username
            });
        } else {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};
