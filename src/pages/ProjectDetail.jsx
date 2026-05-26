import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { useProjects } from '@/hooks/useProjects'
import { useTakeoff } from '@/hooks/useTakeoff'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Modal } from '@/components/UI/Modal'
import { Input, Select, Textarea } from '@/components/UI/Input'
import { EmptyState } from '@/components/UI/EmptyState'
import { PageSpinner } from '@/components/UI/Spinner'
import { formatNumber, formatDate } from '@/utils/formatters'

const CSI_DIVISIONS = [
  '01 - General Requirements',
  '02 - Existing Conditions',
  '03 - Concrete',
  '04 - Masonry',
  '05 - Metals',
  '06 - Wood, Plastics & Composites',
  '07 - Thermal & Moisture Protection',
  '08 - Openings',
  '09 - Finishes',
  '10 - Specialties',
  '11 - Equipment',
  '12 - Furnishings',
  '13 - Special Construction',
  '14 - Conveying Equipment',
  '21 - Fire Suppression',
  '22 - Plumbing',
  '23 - HVAC',
  '26 - Electrical',
  '27 - Communications',
  '28 - Electronic Safety & Security',
  '31 - Earthwork',
  '32 - Exterior Improvements',
  '33 - Utilities',
]

const UNITS = ['SF', 'LF', 'EA', 'CY', 'SY', 'CF', 'TON', 'LB', 'GAL', 'LS', 'HR', 'DAY']

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, loading: pLoading, deleteProject } = useProjects()
  const { items, loading: tLoading, addItem, updateItem, deleteItem } = useTakeoff(id)

  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const project = projects.find((p) => p.id === id)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { division: CSI_DIVISIONS[0], unit: 'SF', quantity: '' },
  })

  if (pLoading || tLoading) return <PageSpinner />
  if (!project) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-gray-400">Project not found.</p>
      <Button variant="secondary" onClick={() => navigate('/projects')}>
        <ArrowLeftIcon className="h-4 w-4" /> Back to Projects
      </Button>
    </div>
  )

  const grouped = items.reduce((acc, item) => {
    acc[item.division] = acc[item.division] ?? []
    acc[item.division].push(item)
    return acc
  }, {})

  const openAdd = () => { reset({ division: CSI_DIVISIONS[0], unit: 'SF', quantity: '' }); setEditingItem(null); setShowAddItem(true) }
  const openEdit = (item) => { reset(item); setEditingItem(item); setShowAddItem(true) }

  const onSubmit = async (data) => {
    if (editingItem) await updateItem(editingItem.id, data)
    else await addItem(data)
    setShowAddItem(false)
    reset()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete project "${project.name}" and all its data? This cannot be undone.`)) return
    await deleteProject(id)
    navigate('/projects')
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="page-title">{project.name}</h2>
              <Badge status={project.status} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {project.client_name && `${project.client_name} · `}
              {[project.city, project.state].filter(Boolean).join(', ')}
              {project.bid_date && ` · Bid: ${formatDate(project.bid_date)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/estimates?project=${id}`}>
            <Button variant="secondary">View Estimates</Button>
          </Link>
          <Button onClick={openAdd}>
            <PlusIcon className="h-4 w-4" />
            Add Takeoff Item
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete project" className="text-red-500 hover:bg-red-500/10">
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Takeoff sheet */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title">Takeoff Sheet</h3>
          <span className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={ClipboardDocumentListIcon}
            title="No takeoff items yet"
            description="Start adding quantities by CSI division to build your takeoff sheet."
            action={<Button onClick={openAdd}><PlusIcon className="h-4 w-4" />Add First Item</Button>}
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([division, divItems]) => (
              <div key={division} className="card">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand-orange" />
                  <h4 className="text-sm font-semibold text-brand-orange">{division}</h4>
                  <span className="text-xs text-gray-600">({divItems.length})</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-left">
                      <th className="pb-2 text-xs font-medium text-gray-500 w-1/2">Description</th>
                      <th className="pb-2 text-xs font-medium text-gray-500">Quantity</th>
                      <th className="pb-2 text-xs font-medium text-gray-500">Unit</th>
                      <th className="pb-2 text-xs font-medium text-gray-500">Notes</th>
                      <th className="pb-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {divItems.map((item) => (
                      <tr key={item.id} className="table-row">
                        <td className="py-2.5 pr-4 font-medium text-white">{item.description}</td>
                        <td className="py-2.5 pr-4 font-mono text-gray-300">{formatNumber(item.quantity)}</td>
                        <td className="py-2.5 pr-4 text-gray-400">{item.unit}</td>
                        <td className="py-2.5 pr-4 text-gray-500 text-xs">{item.notes || '—'}</td>
                        <td className="py-2.5">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                              <PencilIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}
                              className="text-red-500 hover:bg-red-500/10">
                              <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      <Modal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        title={editingItem ? 'Edit Takeoff Item' : 'Add Takeoff Item'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="CSI Division *" {...register('division', { required: true })}>
            {CSI_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Input
            label="Description *"
            placeholder="e.g. 4000 PSI Concrete Slab on Grade"
            error={errors.description?.message}
            {...register('description', { required: 'Description is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity *"
              type="number"
              step="any"
              placeholder="0"
              error={errors.quantity?.message}
              {...register('quantity', { required: 'Required', min: { value: 0, message: 'Must be ≥ 0' } })}
            />
            <Select label="Unit *" {...register('unit', { required: true })}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </div>
          <Textarea label="Notes" placeholder="Additional notes or conditions…" rows={2} {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddItem(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
