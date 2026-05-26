import { GoogleGenerativeAI } from '@google/generative-ai'

const PROMPT =
  'You are a construction estimator specializing in Florida construction costs. ' +
  'Given a plain-English description of a construction project or task, generate a detailed materials and labor breakdown. ' +
  'Return ONLY a valid JSON array with no markdown, no code fences, no explanation. ' +
  'Each element: { "description": string, "category": string, "quantity": number, "unit": string, ' +
  '"estimated_cost_per_unit": number, "estimated_labor_per_unit": number }. ' +
  'Use realistic Florida market rates. Be specific and practical.'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { description } = req.body
  if (!description?.trim()) return res.status(400).json({ error: 'description required' })

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  try {
    const result = await model.generateContent(
      `${PROMPT}\n\nGenerate a construction materials and labor breakdown for: ${description}`
    )
    const raw = result.response.text().trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found in response')
    const items = JSON.parse(jsonMatch[0])
    res.status(200).json({ items })
  } catch (err) {
    console.error('ai-describe error:', err)
    res.status(500).json({ error: err.message ?? 'AI analysis failed' })
  }
}
