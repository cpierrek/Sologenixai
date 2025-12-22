export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard'
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('OpenAI Error:', data.error);
            return res.status(400).json({ error: data.error.message });
        }

        return res.status(200).json({
            success: true,
            imageUrl: data.data[0].url
        });

    } catch (error) {
        console.error('Image generation failed:', error);
        return res.status(500).json({ error: 'Image generation failed' });
    }
}
