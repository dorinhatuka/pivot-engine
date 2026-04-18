export default async function handler(req, res) {
    // מאפשר גישה מכל מקום
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        // שימוש במודל הכי יציב שיש כרגע
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Analyze this business idea: "${idea}". 
                    Return ONLY a JSON object with two keys: "ops" and "market". 
                    Example format: {"ops": "text", "market": "text"}. 
                    Keep the response concise.` }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: "Google API error", details: data });
        }

        const text = data.candidates[0].content.parts[0].text;
        
        // ניקוי תגיות JSON אם המודל הוסיף אותן בטעות
        const cleanJson = text.replace(/```json|```/g, "").trim();
        
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
}
