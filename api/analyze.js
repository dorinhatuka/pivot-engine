export default async function handler(req, res) {
    // מאפשר גישה מכל מקום (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analyze this idea: "${idea}". Return ONLY a JSON object: {"ops": "3 key points", "market": "3 key points"}. No extra text.` }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: 'Google Error', message: data.error.message });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = rawText.replace(/```json|```/g, "").trim();
        
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
