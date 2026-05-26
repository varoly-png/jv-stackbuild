import Groq from 'groq-sdk'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

const PROMPT =
  'You are a construction estimator specializing in Florida construction costs. ' +
  'Analyze the provided construction plan or photo and extract all materials needed. ' +
  'Return ONLY a valid JSON array with no markdown, no code fences, no explanation. ' +
  'Each element: { "description": string, "category": string, "quantity": number, "unit": string, ' +
  '"estimated_cost_per_unit": number, "estimated_labor_per_unit": number }. ' +
  'Use realistic Florida market rates. Be specific and practical.'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { base64, mediaType, fileName } = req.body
  if (!base64 || !mediaType) return res.status(400).json({ error: 'base64 and mediaType required' })
  if (mediaType === 'application/pdf') return res.status(400).json({ error: 'PDF files are not supported for vision analysis. Please upload a JPG or PNG image.' })

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.2-90b-vision-preview',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${base64}` },
            },
            {
              type: 'text',
              text: `${PROMPT}\n\nAnalyze this construction image${fileName ? ` (${fileName})` : ''} and return the JSON array.`,
            },
          ],
        },
      ],
    })

    const raw = completion.choices[0].message.content.trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found in response')
    const items = JSON.parse(jsonMatch[0])
    res.status(200).json({ items })
  } catch (err) {
    console.error('ai-vision error:', err)
    res.status(500).json({ error: err.message ?? 'AI analysis failed' })
  }
}
