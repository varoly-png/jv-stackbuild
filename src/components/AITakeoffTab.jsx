import { useState, useRef } from 'react'
import { ArrowUpTrayIcon, SparklesIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/UI/Button'
import { formatCurrency } from '@/utils/formatters'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export function AITakeoffTab({ onAddItems }) {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    if (!ACCEPTED.includes(f.type)) {
      setError('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.')
      return
    }
    setFile(f)
    setError('')
    setItems([])
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const readAsBase64 = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(f)
    })

  const analyse = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const base64 = await readAsBase64(file)
      const res = await fetch('/api/ai-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType: file.type, fileName: file.name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Server error ${res.status}`)
      }
      const { items: parsed } = await res.json()
      setItems(parsed.map((item, i) => ({ ...item, _id: i })))
    } catch (err) {
      setError(err.message ?? 'AI analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateItem = (idx, key, val) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: val } : item)))
  }

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const totalMaterial = items.reduce((s, i) => s + Number(i.quantity) * Number(i.estimated_cost_per_unit || 0), 0)
  const totalLabor = items.reduce((s, i) => s + Number(i.quantity) * Number(i.estimated_labor_per_unit || 0), 0)

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer p-10 transition-colors ${
          dragging ? 'border-brand-orange bg-brand-orange/5' : 'border-surface-border hover:border-brand-orange/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <ArrowUpTrayIcon className="h-8 w-8 text-gray-500" />
        {file ? (
          <div className="text-center">
            <p className="font-medium text-white">{file.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-400">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP — max 10 MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {file && (
        <div className="flex gap-3">
          <Button onClick={analyse} disabled={loading} className="flex-1">
            <SparklesIcon className="h-4 w-4" />
            {loading ? 'Analysing…' : 'Analyse with AI'}
          </Button>
          <Button variant="secondary" onClick={() => { setFile(null); setItems([]); setError('') }}>
            Clear
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-gray-400">
          <svg className="h-5 w-5 animate-spin text-brand-orange" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          AI is analysing your plan…
        </div>
      )}

      {items.length > 0 && <AIResultsTable items={items} onUpdate={updateItem} onRemove={removeItem} totalMaterial={totalMaterial} totalLabor={totalLabor} onAdd={() => onAddItems(items)} />}
    </div>
  )
}

export function AIDescribeTab({ onAddItems }) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  const examples = [
    'Build a 14×20 cedar pergola with 6×6 posts set in concrete',
    'Remodel kitchen 12×15, new cabinets, granite countertop, tile floor',
    'Pour a 20×30 concrete slab 4" thick with rebar',
    'Install 200 LF of 6-ft wood privacy fence',
  ]

  const analyse = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Server error ${res.status}`)
      }
      const { items: parsed } = await res.json()
      setItems(parsed.map((item, i) => ({ ...item, _id: i })))
    } catch (err) {
      setError(err.message ?? 'AI analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateItem = (idx, key, val) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: val } : item)))
  }

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const totalMaterial = items.reduce((s, i) => s + Number(i.quantity) * Number(i.estimated_cost_per_unit || 0), 0)
  const totalLabor = items.reduce((s, i) => s + Number(i.quantity) * Number(i.estimated_labor_per_unit || 0), 0)

  return (
    <div className="space-y-5">
      <div>
        <label className="form-label">Describe your project</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => { setDescription(e.target.value); setItems([]); setError('') }}
          placeholder="e.g. Build a 14×20 cedar pergola with 6×6 posts set in concrete"
          className="form-input w-full mt-1 resize-none"
        />
      </div>

      <div>
        <p className="text-xs text-gray-600 mb-2">Examples — click to use:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => { setDescription(ex); setItems([]); setError('') }}
              className="rounded-full border border-surface-border px-3 py-1 text-xs text-gray-400 hover:border-brand-orange/50 hover:text-white transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <Button onClick={analyse} disabled={loading || !description.trim()} className="w-full">
        <SparklesIcon className="h-4 w-4" />
        {loading ? 'Generating breakdown…' : 'Generate AI Breakdown'}
      </Button>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-8 text-sm text-gray-400">
          <svg className="h-5 w-5 animate-spin text-brand-orange" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          AI is generating your estimate…
        </div>
      )}

      {items.length > 0 && <AIResultsTable items={items} onUpdate={updateItem} onRemove={removeItem} totalMaterial={totalMaterial} totalLabor={totalLabor} onAdd={() => onAddItems(items)} />}
    </div>
  )
}

function AIResultsTable({ items, onUpdate, onRemove, totalMaterial, totalLabor, onAdd }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="section-title">AI-Generated Line Items</h4>
        <span className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Category', 'Description', 'Qty', 'Unit', 'Mat $/Unit', 'Lab $/Unit', 'Total', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const lineTotal = Number(item.quantity) * (Number(item.estimated_cost_per_unit || 0) + Number(item.estimated_labor_per_unit || 0))
                return (
                  <tr key={idx} className="table-row">
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{item.category}</td>
                    <td className="px-4 py-2.5">
                      <input
                        value={item.description}
                        onChange={(e) => onUpdate(idx, 'description', e.target.value)}
                        className="w-full bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-brand-orange/50 rounded px-1"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdate(idx, 'quantity', e.target.value)}
                        className="w-20 bg-transparent font-mono text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-orange/50 rounded px-1"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{item.unit}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        value={item.estimated_cost_per_unit}
                        onChange={(e) => onUpdate(idx, 'estimated_cost_per_unit', e.target.value)}
                        className="w-24 bg-transparent font-mono text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-orange/50 rounded px-1"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        value={item.estimated_labor_per_unit}
                        onChange={(e) => onUpdate(idx, 'estimated_labor_per_unit', e.target.value)}
                        className="w-24 bg-transparent font-mono text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-orange/50 rounded px-1"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-white whitespace-nowrap">
                      {formatCurrency(lineTotal)}
                    </td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => onRemove(idx)} className="text-red-500 hover:text-red-400 transition-colors">
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost summary */}
      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex gap-12 text-gray-400">
          <span>Material Cost</span>
          <span className="font-mono text-white">{formatCurrency(totalMaterial)}</span>
        </div>
        <div className="flex gap-12 text-gray-400">
          <span>Labor Cost</span>
          <span className="font-mono text-white">{formatCurrency(totalLabor)}</span>
        </div>
        <div className="flex gap-12 font-bold text-brand-orange">
          <span>Total Est.</span>
          <span className="font-mono">{formatCurrency(totalMaterial + totalLabor)}</span>
        </div>
      </div>

      {/* Add to estimate button */}
      <Button onClick={onAdd} className="w-full">
        <PlusIcon className="h-4 w-4" />
        Add All to Takeoff Sheet
      </Button>
    </div>
  )
}
