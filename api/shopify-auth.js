export default async function handler(req, res) {
    const { shop } = req.query;

    if (!shop) {
        return res.status(400).json({ error: 'Shop parameter is required' });
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;

    if (!clientId) {
        return res.status(500).json({ error: 'Shopify Client ID not configured' });
    }

    // Ensure shop has .myshopify.com
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // Build the OAuth URL
    const redirectUri = `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://sologenix.vercel.app'}/api/shopify-callback`;
    const scopes = 'read_products';
    const state = Math.random().toString(36).substring(7); // Simple state for CSRF protection

    const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
        `client_id=${clientId}` +
        `&scope=${scopes}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`;

    // Redirect to Shopify OAuth
    res.redirect(302, authUrl);
}
