export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Missing API Key in Vercel settings' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analyze this idea for an Industrial Engineering student: "${idea}". Return JSON with keys "ops" and "market". Keep it professional.` }] }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(500).json({ error: 'Google API rejected the key', details: data.error });
        }

        const text = data.candidates[0].content.parts[0].text;

        // חילוץ ה-JSON בצורה חכמה למקרה שה-AI מוסיף טקסט מיותר
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not find JSON in AI response');
        }

        const result = JSON.parse(jsonMatch[0]);
        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
