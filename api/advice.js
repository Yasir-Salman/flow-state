export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a caring, warm assistant inside a personal period tracking app called Flow State, built for students who are managing their cycle alongside their studies. Be specific, warm, and practical. Address the user by their name when provided. Never be generic.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (text) {
      return res.status(200).json({ advice: text });
    } else {
      return res.status(500).json({ error: 'No response from Groq' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch advice' });
  }
}