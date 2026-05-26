import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import { useEstimateDetail } from '@/hooks/useEstimates'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Modal } from '@/components/UI/Modal'
import { Input, Select, Textarea } from '@/components/UI/Input'
import { EmptyState } from '@/components/UI/EmptyState'
import { PageSpinner } from '@/components/UI/Spinner'
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters'
import { calcLineItemTotal, calcEstimateTotal } from '@/utils/calculations'
import { supabase } from '@/lib/supabase'

const UNITS = ['SF', 'LF', 'EA', 'CY', 'SY', 'CF', 'TON', 'LB', 'GAL', 'LS', 'HR', 'DAY']
const CSI_DIVISIONS = [
  '01 - General Requirements', '02 - Existing Conditions', '03 - Concrete',
  '04 - Masonry', '05 - Metals', '06 - Wood, Plastics & Composites',
  '07 - Thermal & Moisture Protection', '08 - Openings', '09 - Finishes',
  '10 - Specialties', '22 - Plumbing', '23 - HVAC', '26 - Electrical',
  '31 - Earthwork', '32 - Exterior Improvements', '33 - Utilities',
]

const BLANK_LINE = {
  division: CSI_DIVISIONS[0], description: '', quantity: '',
  unit: 'SF', material_unit_cost: '0', labor_unit_cost: '0',
  subcontractor_cost: '0', notes: '',
}

export default function EstimateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { estimate, lineItems, loading, addLineItem, updateLineItem, deleteLineItem, setEstimate } = useEstimateDetail(id)

  const [showAddLine, setShowAddLine] = useState(false)
  const [editingLine, setEditingLine] = useState(null)
  const [fields, setFields] = useState(BLANK_LINE)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  if (loading) return <PageSpinner />
  if (!estimate) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-gray-400">Estimate not found.</p>
      <Button variant="secondary" onClick={() => navigate('/estimates')}>
        <ArrowLeftIcon className="h-4 w-4" /> Back to Estimates
      </Button>
    </div>
  )

  const { subtotal, overhead, profit, total } = calcEstimateTotal(lineItems, estimate.overhead_percent, estimate.profit_percent)

  const grouped = lineItems.reduce((acc, item) => {
    const key = item.division || 'Uncategorized'
    acc[key] = acc[key] ?? []
    acc[key].push(item)
    return acc
  }, {})

  const openAdd = () => {
    setFields(BLANK_LINE)
    setErrors({})
    setServerError('')
    setEditingLine(null)
    setShowAddLine(true)
  }

  const openEdit = (item) => {
    setFields({
      division: item.division ?? CSI_DIVISIONS[0],
      description: item.description,
      quantity: String(item.quantity),
      unit: item.unit,
      material_unit_cost: String(item.material_unit_cost ?? 0),
      labor_unit_cost: String(item.labor_unit_cost ?? 0),
      subcontractor_cost: String(item.subcontractor_cost ?? 0),
      notes: item.notes ?? '',
    })
    setErrors({})
    setEditingLine(item)
    setShowAddLine(true)
  }

  const validate = () => {
    const next = {}
    if (!fields.description.trim()) next.description = 'Description is required'
    if (fields.quantity === '' || isNaN(Number(fields.quantity))) next.quantity = 'Valid quantity is required'
    else if (Number(fields.quantity) < 0) next.quantity = 'Must be ≥ 0'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setServerError('')
    setSubmitting(true)
    try {
      const payload = {
        ...fields,
        quantity: Number(fields.quantity),
        material_unit_cost: Number(fields.material_unit_cost),
        labor_unit_cost: Number(fields.labor_unit_cost),
        subcontractor_cost: Number(fields.subcontractor_cost),
      }
      if (editingLine) await updateLineItem(editingLine.id, payload)
      else await addLineItem(payload)
      setShowAddLine(false)
    } catch (err) {
      setServerError(err?.message ?? 'Failed to save line item. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateStatus = async (status) => {
    const { data, error } = await supabase
      .from('estimates')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error) setEstimate(data)
  }

  const handlePrint = () => window.print()

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/estimates')}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="page-title">{estimate.name}</h2>
              <Badge status={estimate.status} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {estimate.projects?.name && (
                <Link to={`/projects/${estimate.project_id}`} className="hover:text-brand-orange">
                  {estimate.projects.name}
                </Link>
              )}
              {estimate.projects?.client_name && ` · ${estimate.projects.client_name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={estimate.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="text-xs py-2"
          >
            {['draft', 'submitted', 'approved', 'rejected'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </Select>
          <Button variant="secondary" onClick={handlePrint}>
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={openAdd}>
            <PlusIcon className="h-4 w-4" />
            Add Line Item
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Estimate summary totals */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <TotalCard label="Direct Cost" value={formatCurrency(subtotal)} />
            <TotalCard label={`Overhead (${estimate.overhead_percent}%)`} value={formatCurrency(overhead)} />
            <TotalCard label={`Profit (${estimate.profit_percent}%)`} value={formatCurrency(profit)} />
            <TotalCard label="Total Bid" value={formatCurrency(total)} accent />
          </div>

          {/* Line items by division */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">Line Items</h3>
              <span className="text-xs text-gray-500">{lineItems.length} item{lineItems.length !== 1 ? 's' : ''}</span>
            </div>

            {lineItems.length === 0 ? (
              <EmptyState
                icon={DocumentTextIcon}
                title="No line items"
                description="Add line items to calculate the estimate total."
                action={<Button onClick={openAdd}><PlusIcon className="h-4 w-4" />Add Line Item</Button>}
              />
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([division, divItems]) => {
                  const divTotal = divItems.reduce((s, i) => s + calcLineItemTotal(i), 0)
                  return (
                    <div key={division} className="card overflow-hidden p-0">
                      <div className="flex items-center justify-between border-b border-surface-border bg-surface-raised px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-brand-orange" />
                          <span className="text-sm font-semibold text-brand-orange">{division}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{formatCurrency(divTotal)}</span>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-surface-border">
                            {['Description', 'Qty', 'Unit', 'Mat $/Unit', 'Lab $/Unit', 'Sub Total', 'Line Total', ''].map((h) => (
                              <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {divItems.map((item) => (
                            <tr key={item.id} className="table-row">
                              <td className="px-5 py-3 font-medium text-white max-w-xs">
                                <span className="block truncate">{item.description}</span>
                              </td>
                              <td className="px-5 py-3 font-mono text-gray-300">{formatNumber(item.quantity)}</td>
                              <td className="px-5 py-3 text-gray-400">{item.unit}</td>
                              <td className="px-5 py-3 font-mono text-gray-300">{formatCurrency(item.material_unit_cost)}</td>
                              <td className="px-5 py-3 font-mono text-gray-300">{formatCurrency(item.labor_unit_cost)}</td>
                              <td className="px-5 py-3 font-mono text-gray-400">{formatCurrency(item.subcontractor_cost)}</td>
                              <td className="px-5 py-3 font-mono font-semibold text-white">{formatCurrency(calcLineItemTotal(item))}</td>
                              <td className="px-5 py-3">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                    <PencilIcon className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10" onClick={() => deleteLineItem(item.id)}>
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}

                {/* Grand total footer */}
                <div className="flex justify-end">
                  <div className="rounded-xl border border-brand-orange/30 bg-brand-orange/5 px-8 py-5 text-right">
                    <div className="space-y-1 text-sm text-gray-400">
                      <div className="flex justify-between gap-16">
                        <span>Direct Cost</span>
                        <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between gap-16">
                        <span>Overhead ({estimate.overhead_percent}%)</span>
                        <span className="font-mono text-white">{formatCurrency(overhead)}</span>
                      </div>
                      <div className="flex justify-between gap-16">
                        <span>Profit ({estimate.profit_percent}%)</span>
                        <span className="font-mono text-white">{formatCurrency(profit)}</span>
                      </div>
                      <div className="divider my-2" />
                      <div className="flex justify-between gap-16 text-base font-bold text-brand-orange">
                        <span>Total Bid</span>
                        <span className="font-mono">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Line Item Modal */}
      <Modal
        open={showAddLine}
        onClose={() => setShowAddLine(false)}
        title={editingLine ? 'Edit Line Item' : 'Add Line Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Select label="CSI Division" value={fields.division} onChange={set('division')}>
            {CSI_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Input
            label="Description *"
            placeholder="e.g. 3000 PSI Concrete Foundation Walls"
            value={fields.description}
            onChange={set('description')}
            error={errors.description}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity *"
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={fields.quantity}
              onChange={set('quantity')}
              error={errors.quantity}
            />
            <Select label="Unit" value={fields.unit} onChange={set('unit')}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Material $/Unit" type="number" step="0.01" min="0" placeholder="0.00" value={fields.material_unit_cost} onChange={set('material_unit_cost')} />
            <Input label="Labor $/Unit" type="number" step="0.01" min="0" placeholder="0.00" value={fields.labor_unit_cost} onChange={set('labor_unit_cost')} />
            <Input label="Subcontractor $" type="number" step="0.01" min="0" placeholder="0.00" value={fields.subcontractor_cost} onChange={set('subcontractor_cost')} />
          </div>
          <Textarea
            label="Notes"
            placeholder="Spec section, assumptions…"
            rows={2}
            value={fields.notes}
            onChange={set('notes')}
          />
          {serverError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {serverError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddLine(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editingLine ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function TotalCard({ label, value, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-brand-orange/40 bg-brand-orange/5' : 'border-surface-border bg-surface'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${accent ? 'text-brand-orange' : 'text-white'}`}>{value}</p>
    </div>
  )
}
