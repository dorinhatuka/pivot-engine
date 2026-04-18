export default async function handler(req, res) {
    // הגדרות גישה (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: "Missing API Key" });

    try {
        // שימוש ב-Native fetch שקיים ב-Vercel כברירת מחדל
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analyze this idea: "${idea}". Return ONLY a JSON object: {"ops": "text", "market": "text"}. No markdown.` }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: "Google API Error", message: data.error.message });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        
        // חילוץ ה-JSON בצורה הכי בטוחה שיש
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI did not return valid JSON");
        
        return res.status(200).json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        // זה ידפיס לך ב-Network את הסיבה המדויקת אם זה עדיין נכשל
        return res.status(500).json({ error: "Server Error", details: error.message });
    }
}
