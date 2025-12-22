export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    try {
        const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // ElevenLabs text-to-speech API
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('ElevenLabs Error:', errorData);
            return res.status(400).json({ error: errorData.detail?.message || 'Voice generation failed' });
        }

        // Get audio as buffer
        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        return res.status(200).json({
            success: true,
            audioData: base64Audio,
            contentType: 'audio/mpeg'
        });

    } catch (error) {
        console.error('Voice generation failed:', error);
        return res.status(500).json({ error: 'Voice generation failed' });
    }
}
