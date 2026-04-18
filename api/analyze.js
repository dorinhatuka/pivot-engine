export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { idea } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Analyze this business idea: "${idea}". 
                                     Return a JSON object with two keys: "ops" and "market". 
                                     Keep it simple and clean.` }]
                }]
            })
        });

        const data = await response.json();
        
        // בדיקה אם גוגל החזיר שגיאה (למשל מפתח לא תקין)
        if (data.error) {
            console.error('Google API Error:', data.error);
            return res.status(500).json({ error: data.error.message });
        }

        let text = data.candidates[0].content.parts[0].text;
        
        // ניקוי תגיות markdown אם יש
        const cleanJson = text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(cleanJson);

        res.status(200).json(result);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ error: 'Failed to process request', details: error.message });
    }
}
