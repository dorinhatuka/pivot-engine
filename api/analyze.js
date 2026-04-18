export default async function handler(req, res) {
    // הגדרת כותרות כדי למנוע בעיות דפדפן
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // בדיקה פנימית - אם המפתח בכלל קיים במערכת
    if (!apiKey) {
        return res.status(500).json({ error: 'Missing API Key in Vercel settings' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
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
        const cleanJson = text.replace(/```json|```/g, "").trim();
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ error: 'Server Crash', details: error.message });
    }
}
