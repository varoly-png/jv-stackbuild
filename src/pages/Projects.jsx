import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  PlusIcon,
  FolderOpenIcon,
  MapPinIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { useProjects } from '@/hooks/useProjects'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Modal } from '@/components/UI/Modal'
import { Input, Select, Textarea } from '@/components/UI/Input'
import { EmptyState } from '@/components/UI/EmptyState'
import { PageSpinner } from '@/components/UI/Spinner'
import { formatDate } from '@/utils/formatters'

const PROJECT_TYPES = ['Commercial', 'Residential', 'Industrial', 'Municipal', 'Mixed-Use']
const STATUSES = ['active', 'bidding', 'awarded', 'complete', 'on_hold']

export default function Projects() {
  const { projects, loading, createProject } = useProjects()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { status: 'active', project_type: 'Commercial' },
  })

  const onSubmit = async (data) => {
    await createProject(data)
    reset()
    setShowModal(false)
  }

  const filtered = projects.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search && !`${p.name} ${p.client_name} ${p.city}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return <PageSpinner />

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="text-xs text-gray-500 mt-0.5">{projects.length} total project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 border-b border-surface-border px-6 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="form-input max-w-xs"
        />
        <div className="flex gap-1.5">
          {['all', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === s
                  ? 'bg-brand-orange text-white'
                  : 'bg-surface text-gray-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FolderOpenIcon}
            title={search ? 'No results found' : 'No projects yet'}
            description={search ? 'Try a different search term.' : 'Create your first project to get started.'}
            action={!search && (
              <Button onClick={() => setShowModal(true)}>
                <PlusIcon className="h-4 w-4" />
                New Project
              </Button>
            )}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="card flex flex-col gap-3 transition-all hover:border-brand-orange/40 hover:shadow-lg hover:shadow-brand-orange/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange/10">
                    <FolderOpenIcon className="h-5 w-5 text-brand-orange" />
                  </div>
                  <Badge status={p.status} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{p.project_type}</p>
                </div>
                {(p.client_name || p.city) && (
                  <div className="space-y-1">
                    {p.client_name && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <UserIcon className="h-3 w-3" />
                        {p.client_name}
                      </div>
                    )}
                    {p.city && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPinIcon className="h-3 w-3" />
                        {p.city}{p.state ? `, ${p.state}` : ''}
                      </div>
                    )}
                  </div>
                )}
                <div className="divider" />
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Bid: {p.bid_date ? formatDate(p.bid_date) : '—'}</span>
                  <span>Created {formatDate(p.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Project" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Project Name *" placeholder="Main Street Office Building" error={errors.name?.message}
                {...register('name', { required: 'Name is required' })} />
            </div>
            <Input label="Client Name" placeholder="Acme Corp" {...register('client_name')} />
            <Select label="Project Type" {...register('project_type')}>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Status" {...register('status')}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
            </Select>
            <Input label="Bid Date" type="date" {...register('bid_date')} />
            <Input label="Address" placeholder="123 Main St" {...register('address')} />
            <Input label="City" placeholder="Houston" {...register('city')} />
            <Input label="State" placeholder="TX" {...register('state')} />
            <Input label="ZIP" placeholder="77001" {...register('zip')} />
            <div className="col-span-2">
              <Textarea label="Description" placeholder="Project scope and notes…" rows={3} {...register('description')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
