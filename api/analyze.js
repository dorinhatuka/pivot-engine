export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        // הכתובת המדויקת לפי התיעוד הכי מעודכן של 2026
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analyze this idea: "${idea}". Return ONLY a JSON object: {"ops": "text", "market": "text"}.` }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            // זה יחזיר לנו את השגיאה המדויקת מגוגל אם משהו עדיין לא בסדר
            return res.status(data.error.code || 500).json({ error: data.error.message });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        const jsonString = rawText.substring(start, end);
        
        return res.status(200).json(JSON.parse(jsonString));

    } catch (error) {
        return res.status(500).json({ error: 'Server Error', message: error.message });
    }
}
