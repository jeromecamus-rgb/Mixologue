export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  console.log("API Key starts with:", apiKey.slice(0,10));
  console.log("Model:", req.body.model);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response error:", JSON.stringify(data.error));
    return res.status(response.status).json(data);
  } catch (error) {
    console.log("Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
