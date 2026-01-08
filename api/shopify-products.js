export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { storeUrl, accessToken, action } = req.body;

        if (!storeUrl || !accessToken) {
            return res.status(400).json({ error: 'Store URL and Access Token are required' });
        }

        const shopifyDomain = `${storeUrl}.myshopify.com`;
        const headers = {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
        };

        // Verify connection by fetching shop info
        if (action === 'verify') {
            const shopResponse = await fetch(`https://${shopifyDomain}/admin/api/2024-01/shop.json`, {
                headers: headers
            });

            if (!shopResponse.ok) {
                const errorText = await shopResponse.text();
                console.error('Shopify verify error:', errorText);
                return res.status(400).json({ error: 'Invalid credentials or store URL' });
            }

            const shopData = await shopResponse.json();

            return res.status(200).json({
                success: true,
                shopName: shopData.shop?.name || storeUrl,
                shopDomain: shopData.shop?.domain || shopifyDomain
            });
        }

        // Fetch products
        if (action === 'products') {
            const productsResponse = await fetch(`https://${shopifyDomain}/admin/api/2024-01/products.json?limit=50`, {
                headers: headers
            });

            if (!productsResponse.ok) {
                const errorText = await productsResponse.text();
                console.error('Shopify products error:', errorText);
                return res.status(400).json({ error: 'Failed to fetch products' });
            }

            const productsData = await productsResponse.json();

            // Transform products to simplified format
            const products = (productsData.products || []).map(product => ({
                id: product.id.toString(),
                title: product.title,
                description: product.body_html || '',
                price: product.variants?.[0]?.price || '0.00',
                image: product.image?.src || product.images?.[0]?.src || '',
                images: (product.images || []).map(img => img.src),
                handle: product.handle,
                vendor: product.vendor,
                productType: product.product_type,
                status: product.status
            }));

            return res.status(200).json({
                success: true,
                products: products,
                count: products.length
            });
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('Shopify API error:', error);
        return res.status(500).json({ error: error.message || 'Shopify API failed' });
    }
}

