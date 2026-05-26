import { GoogleGenerativeAI } from '@google/generative-ai'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

const PROMPT =
  'You are a construction estimator specializing in Florida construction costs. ' +
  'Analyze the provided construction plan, photo, or document and extract all materials needed. ' +
  'Return ONLY a valid JSON array with no markdown, no code fences, no explanation. ' +
  'Each element: { "description": string, "category": string, "quantity": number, "unit": string, ' +
  '"estimated_cost_per_unit": number, "estimated_labor_per_unit": number }. ' +
  'Use realistic Florida market rates. Be specific and practical.'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { base64, mediaType, fileName } = req.body
  if (!base64 || !mediaType) return res.status(400).json({ error: 'base64 and mediaType required' })

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  try {
    const filePart = { inlineData: { data: base64, mimeType: mediaType } }
    const textPart = `${PROMPT}\n\nAnalyze this construction ${mediaType === 'application/pdf' ? 'document' : 'image'}${fileName ? ` (${fileName})` : ''} and return the JSON array.`

    const result = await model.generateContent([textPart, filePart])
    const raw = result.response.text().trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found in response')
    const items = JSON.parse(jsonMatch[0])
    res.status(200).json({ items })
  } catch (err) {
    console.error('ai-vision error:', err)
    res.status(500).json({ error: err.message ?? 'AI analysis failed' })
  }
}
