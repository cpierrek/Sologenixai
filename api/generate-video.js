export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.RUNWAY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Runway API key not configured' });
    }

    try {
        const { prompt, imageUrl } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Start video generation task
        const createResponse = await fetch('https://api.runwayml.com/v1/image_to_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'X-Runway-Version': '2024-11-06'
            },
            body: JSON.stringify({
                model: 'gen3a_turbo',
                promptImage: imageUrl || undefined,
                promptText: prompt,
                duration: 5,
                ratio: '1280:768'
            })
        });

        const createData = await createResponse.json();

        if (createData.error) {
            console.error('Runway Create Error:', createData.error);
            return res.status(400).json({ error: createData.error });
        }

        const taskId = createData.id;

        // Poll for completion (max 2 minutes)
        let attempts = 0;
        const maxAttempts = 24;

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds

            const statusResponse = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Runway-Version': '2024-11-06'
                }
            });

            const statusData = await statusResponse.json();

            if (statusData.status === 'SUCCEEDED') {
                return res.status(200).json({
                    success: true,
                    videoUrl: statusData.output[0]
                });
            } else if (statusData.status === 'FAILED') {
                return res.status(400).json({ error: 'Video generation failed' });
            }

            attempts++;
        }

        return res.status(408).json({ error: 'Video generation timed out' });

    } catch (error) {
        console.error('Video generation failed:', error);
        return res.status(500).json({ error: 'Video generation failed' });
    }
}
