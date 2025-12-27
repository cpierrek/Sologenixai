export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        // Fetch the image from the URL
        const response = await fetch(imageUrl);

        if (!response.ok) {
            return res.status(400).json({ error: 'Failed to fetch image' });
        }

        // Get the image as a buffer
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // Determine content type
        const contentType = response.headers.get('content-type') || 'image/png';

        return res.status(200).json({
            success: true,
            imageData: base64,
            contentType: contentType
        });

    } catch (error) {
        console.error('Image download failed:', error);
        return res.status(500).json({ error: error.message || 'Download failed' });
    }
}
