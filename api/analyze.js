export default async function handler(req, res) {
    // מאפשר גישה מכל מקום כדי למנוע חסימות דפדפן
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'מפתח ה-API חסר בהגדרות Vercel' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Analyze this business idea: "${idea}". Return ONLY a JSON object with keys "ops" and "market". No extra text.` }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: 'שגיאה מצד גוגל', details: data.error.message });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        // ניקוי תגיות קוד אם ה-AI הוסיף אותן
        const cleanJson = rawText.replace(/```json|```/g, "").trim();
        
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ error: 'שגיאת שרת פנימית', details: error.message });
    }
}
