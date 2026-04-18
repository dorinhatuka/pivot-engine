export default async function handler(req, res) {
    // הגדרות CORS - כדי שהאתר יוכל לדבר עם ה-API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: "Missing API Key" });

    try {
        // שימוש בגרסת v1 היציבה והמודל המוכר
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analyze this idea: "${idea}". Return ONLY a JSON object: {"ops": "text", "market": "text"}.` }] }]
            })
        });

        const data = await response.json();

        // אם גוגל מחזיר שגיאת מודל או מפתח
        if (data.error) {
            return res.status(500).json({ error: "Google API Error", message: data.error.message });
        }

        // חילוץ התשובה
        const rawText = data.candidates[0].content.parts[0].text;
        
        // הניקוי הכי חזק שיש ל-JSON
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        
        return res.status(200).json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        // זה ידפיס לנו ב-Network את סיבת הקריסה האמיתית של השרת
        return res.status(500).json({ error: "Server Error", details: error.message });
    }
}
