// Test endpoint to verify environment variables
module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const hasToken = !!process.env.GITHUB_TOKEN;
    const tokenLength = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.length : 0;

    res.status(200).json({
        hasGitHubToken: hasToken,
        tokenLength: tokenLength,
        nodeEnv: process.env.NODE_ENV || 'not set',
        vercel: process.env.VERCEL || 'not set',
        timestamp: new Date().toISOString()
    });
};
