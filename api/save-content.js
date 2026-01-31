// Vercel Serverless Function - Save Content via GitHub API
// Requires GITHUB_TOKEN environment variable with repo write access

const https = require('https');

const REPO_OWNER = 'PheonixOfTesla';
const REPO_NAME = 'jlc-studio';

// Schema validation - required fields and structure
const REQUIRED_SCHEMA = {
    hero: ['badge', 'titleLine1', 'titleLine2'],
    about: ['name', 'bio'],
    settings: ['businessName', 'email'],
    labels: ['hero', 'about', 'services']
};

function validateSchema(data) {
    const errors = [];

    // Check required top-level keys
    for (const [key, requiredFields] of Object.entries(REQUIRED_SCHEMA)) {
        if (!data[key]) {
            errors.push(`Missing required section: ${key}`);
            continue;
        }
        if (Array.isArray(requiredFields)) {
            for (const field of requiredFields) {
                if (typeof data[key][field] === 'undefined') {
                    errors.push(`Missing required field: ${key}.${field}`);
                }
            }
        }
    }

    // Check for dangerous content (XSS prevention)
    const jsonStr = JSON.stringify(data);
    if (/<script/i.test(jsonStr)) {
        errors.push('Script tags not allowed in content');
    }

    return errors;
}

// Debug logging
function log(...args) {
    console.log('[save-content]', ...args);
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
        return { sha: file.sha, content: file.content };
    } catch (e) {
        return { sha: null, content: null }; // File doesn't exist
    }
}

async function saveFile(filePath, content, message, expectedSha = null) {
    const { sha: currentSha } = await getFileSha(filePath);

    // Conflict detection: if client sent expectedSha and it doesn't match current, reject
    if (expectedSha && currentSha && expectedSha !== currentSha) {
        const error = new Error('CONFLICT: File was modified by another user. Please refresh and try again.');
        error.code = 'CONFLICT';
        error.currentSha = currentSha;
        throw error;
    }

    const base64Content = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    const body = {
        message: message,
        content: base64Content,
        branch: 'main'
    };

    if (currentSha) {
        body.sha = currentSha; // Required for updates
    }

    const result = await githubRequest('PUT', `/contents/${filePath}`, body);
    result.newSha = result.content?.sha; // Return new SHA for client to track
    return result;
}

module.exports = async (req, res) => {
    log('Request received:', req.method, req.url);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        log('OPTIONS request, returning 200');
        return res.status(200).end();
    }

    // GET request = health check / debug
    if (req.method === 'GET') {
        const hasToken = !!process.env.GITHUB_TOKEN;
        const tokenPreview = hasToken ? process.env.GITHUB_TOKEN.substring(0, 15) + '...' : 'NOT SET';
        log('Health check - token status:', tokenPreview);
        return res.status(200).json({
            status: 'ok',
            tokenConfigured: hasToken,
            tokenPreview: tokenPreview,
            repo: `${REPO_OWNER}/${REPO_NAME}`
        });
    }

    if (req.method !== 'POST') {
        log('Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify admin token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        log('Unauthorized - missing or invalid auth header');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if GITHUB_TOKEN exists
    if (!process.env.GITHUB_TOKEN) {
        log('ERROR: GITHUB_TOKEN environment variable not set!');
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'GITHUB_TOKEN not configured'
        });
    }

    log('GITHUB_TOKEN is configured, length:', process.env.GITHUB_TOKEN.length);

    try {
        const { type, data, expectedSha } = req.body || {};
        log('Processing save for type:', type, 'expectedSha:', expectedSha?.substring(0, 7));

        if (!type || data === undefined) {
            log('Missing type or data in request body');
            return res.status(400).json({ error: 'Missing type or data' });
        }

        // Schema validation
        const validationErrors = validateSchema(data);
        if (validationErrors.length > 0) {
            log('Validation failed:', validationErrors);
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        // Single source of truth: admin.json contains all data
        const filePath = '_data/admin.json';

        log('Saving to master file:', filePath, 'Type:', type);

        // Save to GitHub with conflict detection
        const result = await saveFile(
            filePath,
            data,
            `Update admin data via admin panel (${type})`,
            expectedSha
        );

        log('Save successful, commit:', result.commit?.sha);

        return res.status(200).json({
            success: true,
            message: `${type} saved and deployed`,
            commit: result.commit?.sha?.substring(0, 7),
            sha: result.newSha, // Return new SHA for client tracking
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        log('Save error:', error.message);
        console.error('Full error:', error);

        // Handle conflict errors specially
        if (error.code === 'CONFLICT') {
            return res.status(409).json({
                error: 'Conflict detected',
                details: error.message,
                currentSha: error.currentSha
            });
        }

        // Provide more helpful error messages
        let userMessage = error.message;
        if (error.message.includes('Bad credentials')) {
            userMessage = 'GitHub token is invalid or expired. Please check your GITHUB_TOKEN.';
        } else if (error.message.includes('Not Found')) {
            userMessage = 'Repository not found or token lacks access. Check token permissions.';
        } else if (error.message.includes('Resource not accessible')) {
            userMessage = 'Token does not have write permission. Enable "Contents: Read and write" for the token.';
        }

        return res.status(500).json({
            error: 'Failed to save content',
            details: userMessage,
            raw: error.message
        });
    }
};
