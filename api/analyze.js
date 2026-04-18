export default async function handler(req, res) {
    // 1. הגדרת CORS חזקה
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 2. בדיקת מפתח
    if (!apiKey) {
        return res.status(500).json({ error: 'API Key is missing in Vercel' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analyze this idea: "${idea}". Return ONLY a JSON object: {"ops": "text", "market": "text"}. No extra text or markdown.` }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: 'Google API Error', details: data.error });
        }

        // 3. חילוץ וניקוי JSON - טיפול בסטייה של ה-AI
        let text = data.candidates[0].content.parts[0].text;
        
        // מציאת ה-JSON בתוך הטקסט (למקרה שיש שאריות)
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        if (start === -1 || end === 0) throw new Error("Invalid AI response format");
        
        const jsonString = text.substring(start, end);
        const result = JSON.parse(jsonString);

        return res.status(200).json(result);

    } catch (error) {
        console.error("Analysis Error:", error);
        return res.status(500).json({ error: 'Server Error', message: error.message });
    }
}
