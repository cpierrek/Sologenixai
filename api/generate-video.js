export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.RUNWAY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Runway API key not configured' });
    }

    try {
        const { prompt, taskId } = req.body;

        // If taskId provided, check status of existing task
        if (taskId) {
            const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'X-Runway-Version': '2024-11-06'
                }
            });

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                return res.status(400).json({ error: 'Failed to check status: ' + errorText });
            }

            const statusData = await statusResponse.json();

            if (statusData.status === 'SUCCEEDED') {
                return res.status(200).json({
                    success: true,
                    status: 'completed',
                    videoUrl: statusData.output?.[0] || statusData.output
                });
            } else if (statusData.status === 'FAILED') {
                return res.status(200).json({
                    success: false,
                    status: 'failed',
                    error: statusData.failure || statusData.failureCode || 'Video generation failed'
                });
            } else {
                return res.status(200).json({
                    success: true,
                    status: 'processing',
                    progress: statusData.progress || 0
                });
            }
        }

        // Start new video generation task
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Using veo3.1_fast for text-to-video (gen3a_turbo only supports image-to-video)
        const createResponse = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'X-Runway-Version': '2024-11-06'
            },
            body: JSON.stringify({
                model: 'veo3.1_fast',
                promptText: prompt,
                ratio: '1920:1080',
                duration: 4,
                audio: false
            })
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('Runway Create Error:', errorText);
            return res.status(400).json({ error: 'Failed to start video generation: ' + errorText });
        }

        const createData = await createResponse.json();

        if (!createData.id) {
            return res.status(400).json({ error: 'No task ID returned from Runway' });
        }

        // Return task ID immediately - frontend will poll for completion
        return res.status(200).json({
            success: true,
            status: 'started',
            taskId: createData.id
        });

    } catch (error) {
        console.error('Video generation failed:', error);
        return res.status(500).json({ error: error.message || 'Video generation failed' });
    }
}
