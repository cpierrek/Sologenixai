export default async function handler(req, res) {
    const { code, shop, state } = req.query;

    if (!code || !shop) {
        return res.redirect('/?shopify_error=missing_params');
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return res.redirect('/?shopify_error=config_error');
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:', errorText);
            return res.redirect('/?shopify_error=token_failed');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get shop info
        const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
            headers: {
                'X-Shopify-Access-Token': accessToken
            }
        });

        let shopName = shop.replace('.myshopify.com', '');
        if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            shopName = shopData.shop?.name || shopName;
        }

        // Redirect back to app with token in URL fragment (client-side only)
        // Using fragment (#) so token isn't sent to server in logs
        const redirectUrl = `/?shopify_connected=true#shopify_token=${accessToken}&shopify_shop=${encodeURIComponent(shop)}&shopify_name=${encodeURIComponent(shopName)}`;

        res.redirect(302, redirectUrl);

    } catch (error) {
        console.error('Shopify OAuth error:', error);
        return res.redirect('/?shopify_error=server_error');
    }
}
