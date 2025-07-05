import GroqAPI from '../groq-api.js';

const groqApi = new GroqAPI(process.env.GROQ_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, options = {} } = req.body;
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const response = await groqApi.generateResponse(messages, options);
    res.status(200).json({ response });
  } catch (error) {
    console.error('API Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
}
