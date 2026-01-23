// Vercel Serverless Function - Upload Image to GitHub
// Uploads images to /images folder and returns URL

const https = require('https');

const REPO_OWNER = 'PheonixOfTesla';
const REPO_NAME = 'jlc-studio';

function log(...args) {
    console.log('[upload-image]', ...args);
}

async function githubRequest(method, path, body = null) {
    const token = (process.env.GITHUB_TOKEN || '').trim();
    if (!token) {
        throw new Error('GITHUB_TOKEN not configured');
    }

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${REPO_OWNER}/${REPO_NAME}${path}`,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'JLC-Studio-Admin',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(parsed.message || `GitHub API error: ${res.statusCode}`));
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data}`));
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function getFileSha(filePath) {
    try {
        const file = await githubRequest('GET', `/contents/${filePath}`);
        return file.sha;
    } catch (e) {
        return null;
    }
}

async function uploadImage(filename, base64Content) {
    const filePath = `images/${filename}`;
    const sha = await getFileSha(filePath);

    const body = {
        message: `Upload image: ${filename}`,
        content: base64Content,
        branch: 'main'
    };

    if (sha) {
        body.sha = sha;
    }

    const result = await githubRequest('PUT', `/contents/${filePath}`, body);

    // Return the raw.githubusercontent.com URL with cache-busting timestamp
    const timestamp = Date.now();
    return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${filePath}?v=${timestamp}`;
}

module.exports = async (req, res) => {
    log('Request received:', req.method);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify admin token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        log('Unauthorized - missing or invalid auth header');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!process.env.GITHUB_TOKEN) {
        log('ERROR: GITHUB_TOKEN environment variable not set!');
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'GITHUB_TOKEN not configured'
        });
    }

    try {
        const { filename, content, imageId } = req.body || {};

        if (!filename || !content) {
            return res.status(400).json({ error: 'Missing filename or content' });
        }

        // Extract base64 content (remove data:image/... prefix if present)
        const base64Content = content.includes('base64,')
            ? content.split('base64,')[1]
            : content;

        // Create clean filename using imageId or sanitized filename
        const ext = filename.split('.').pop();
        const cleanFilename = imageId ? `${imageId}.${ext}` : filename.replace(/[^a-zA-Z0-9.-]/g, '_');

        log('Uploading image:', cleanFilename);

        const imageUrl = await uploadImage(cleanFilename, base64Content);

        log('Upload successful, URL:', imageUrl);

        return res.status(200).json({
            success: true,
            url: imageUrl,
            filename: cleanFilename
        });

    } catch (error) {
        log('Upload error:', error.message);
        console.error('Full error:', error);
        return res.status(500).json({
            error: 'Failed to upload image',
            details: error.message
        });
    }
};
