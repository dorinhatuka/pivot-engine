/* This is a Serverless Function. It runs only when called. */

export default async function handler(req, res) {
  /* Security check: only allow POST requests */
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { idea } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; /* The key is pulled from the server's secret vault */

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `You are an Industrial Engineering expert. Analyze this idea: ${idea}. 
                          Return the response in JSON format with two fields: 
                          'ops' (Operational Strategy) and 'market' (Market Potential).` }]
        }]
      })
    });

    const data = await response.json();
    /* Extracting the AI text and sending it back to the user */
    const aiResponse = data.candidates[0].content.parts[0].text;
    res.status(200).json(JSON.parse(aiResponse));
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze idea' });
  }
}