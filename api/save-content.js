// Vercel Serverless Function - Save Content via GitHub API
// Requires GITHUB_TOKEN environment variable with repo write access

const https = require('https');

const REPO_OWNER = 'PheonixOfTesla';
const REPO_NAME = 'jlc-studio';

async function githubRequest(method, path, body = null) {
    const token = process.env.GITHUB_TOKEN;
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
        return null; // File doesn't exist
    }
}

async function saveFile(filePath, content, message) {
    const sha = await getFileSha(filePath);
    const base64Content = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    const body = {
        message: message,
        content: base64Content,
        branch: 'main'
    };

    if (sha) {
        body.sha = sha; // Required for updates
    }

    return githubRequest('PUT', `/contents/${filePath}`, body);
}

module.exports = async (req, res) => {
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
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { type, data } = req.body;

        if (!type || !data) {
            return res.status(400).json({ error: 'Missing type or data' });
        }

        // Map content types to file paths - ALL editable content
        const fileMap = {
            'hero': '_data/hero.json',
            'about': '_data/about.json',
            'settings': '_data/settings.json',
            'services': '_data/services.json',
            'packages': '_data/packages.json',
            'testimonials': '_data/testimonials.json',
            'faq': '_data/faq.json',
            'theme': '_data/theme.json',
            'gallery': '_data/gallery.json',
            'images': '_data/images.json'
        };

        const filePath = fileMap[type];
        if (!filePath) {
            return res.status(400).json({ error: `Unknown content type: ${type}` });
        }

        // Save to GitHub
        const result = await saveFile(
            filePath,
            data,
            `Update ${type} via admin panel`
        );

        return res.status(200).json({
            success: true,
            message: `${type} saved and deployed`,
            commit: result.commit?.sha?.substring(0, 7),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Save error:', error);
        return res.status(500).json({
            error: 'Failed to save content',
            details: error.message
        });
    }
};
