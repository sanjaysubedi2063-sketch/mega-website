// Serverless AI Reviewer handler for Vercel/Netlify-like environments
// POST /api/ai-reviewer
// Body: { code: string, language?: string }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code = '', language = 'auto' } = req.body || {};
    if (!code || typeof code !== 'string') return res.status(400).json({ error: 'code (string) is required' });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    // If no API key is configured, return a helpful fallback response and a suggested prompt
    if (!OPENAI_KEY) {
      const prompt = `Review the following ${language} code and provide: 1) a short summary of issues, 2) a list of line-based suggestions, and 3) a suggested patch or improved snippet.\n\nCODE:\n${code}`;
      return res.json({
        warning: 'OPENAI_API_KEY not configured. Enable an OpenAI key in environment to run real reviews.',
        example_prompt: prompt,
        summary: 'No AI key — run with OPENAI_API_KEY to get full results.',
        suggestions: [],
        patch: ''
      });
    }

    // Call OpenAI Chat Completions API
    const payload = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert senior software engineer. Provide concise, actionable code review suggestions and a minimal patch when possible.' },
        { role: 'user', content: `Review this ${language} code. Produce JSON only with keys: summary (string), suggestions (array of {line:number,message:string}), patch (string). Code follows:\n\n${code}` }
      ],
      temperature: 0.2,
      max_tokens: 800
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(502).json({ error: 'OpenAI API error', details: errText });
    }

    const data = await resp.json();
    const assistant = data?.choices?.[0]?.message?.content || '';

    // Try to parse JSON from assistant response. If it fails, return raw text under summary
    try {
      const parsed = JSON.parse(assistant);
      return res.json(parsed);
    } catch (e) {
      return res.json({
        raw: assistant,
        summary: 'AI returned non-JSON output. See raw for details.'
      });
    }

  } catch (err) {
    console.error('ai-reviewer error', err);
    res.status(500).json({ error: 'internal_error', details: String(err) });
  }
}
