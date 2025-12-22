export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    try {
        const { productName, productDesc, type } = req.body;

        if (!productName) {
            return res.status(400).json({ error: 'Product name is required' });
        }

        const prompts = {
            hook: `Write a short, punchy 2-3 sentence voiceover script for a social media ad hook about "${productName}". ${productDesc ? 'Product description: ' + productDesc : ''}. The script should grab attention immediately, create curiosity, and make viewers want to keep watching. Keep it under 50 words. Just provide the script, no quotes or labels.`,

            offer: `Write a short 2-3 sentence voiceover script for a sales offer ad about "${productName}". ${productDesc ? 'Product description: ' + productDesc : ''}. Focus on urgency, value, and a clear call-to-action. Mention a limited time offer or discount. Keep it under 50 words. Just provide the script, no quotes or labels.`,

            edu: `Write a short 2-3 sentence educational voiceover script about "${productName}". ${productDesc ? 'Product description: ' + productDesc : ''}. Explain a key benefit or how it solves a problem. Be informative but engaging. Keep it under 50 words. Just provide the script, no quotes or labels.`
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert ad copywriter who writes compelling, short voiceover scripts for social media ads.' },
                    { role: 'user', content: prompts[type] || prompts.hook }
                ],
                max_tokens: 150,
                temperature: 0.8
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('OpenAI Error:', data.error);
            return res.status(400).json({ error: data.error.message });
        }

        const script = data.choices[0].message.content.trim();

        return res.status(200).json({
            success: true,
            script: script
        });

    } catch (error) {
        console.error('Script generation failed:', error);
        return res.status(500).json({ error: 'Script generation failed' });
    }
}
