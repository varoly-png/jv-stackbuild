import Anthropic from '@anthropic-ai/sdk'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

const SYSTEM_PROMPT =
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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    let contentBlock
    if (mediaType === 'application/pdf') {
      contentBlock = {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      }
    } else {
      contentBlock = {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      }
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: `Analyze this construction ${mediaType === 'application/pdf' ? 'document' : 'image'}${fileName ? ` (${fileName})` : ''} and return a JSON array of all materials and work items needed.`,
            },
          ],
        },
      ],
    })

    const raw = message.content[0].text.trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found in response')
    const items = JSON.parse(jsonMatch[0])
    res.status(200).json({ items })
  } catch (err) {
    console.error('ai-vision error:', err)
    res.status(500).json({ error: err.message ?? 'AI analysis failed' })
  }
}
