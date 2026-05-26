import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { PlusIcon, CalculatorIcon } from '@heroicons/react/24/outline'
import { useEstimates } from '@/hooks/useEstimates'
import { useProjects } from '@/hooks/useProjects'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Modal } from '@/components/UI/Modal'
import { Input, Select, Textarea } from '@/components/UI/Input'
import { EmptyState } from '@/components/UI/EmptyState'
import { PageSpinner } from '@/components/UI/Spinner'
import { formatRelative } from '@/utils/formatters'

const ESTIMATE_STATUSES = ['draft', 'submitted', 'approved', 'rejected']

export default function Estimates() {
  const [searchParams] = useSearchParams()
  const preselectedProject = searchParams.get('project') || ''

  const { estimates, loading: eLoading, createEstimate } = useEstimates()
  const { projects, loading: pLoading } = useProjects()
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      status: 'draft',
      overhead_percent: 10,
      profit_percent: 10,
      project_id: preselectedProject,
    },
  })

  const onSubmit = async (data) => {
    await createEstimate({ ...data, overhead_percent: Number(data.overhead_percent), profit_percent: Number(data.profit_percent) })
    reset()
    setShowModal(false)
  }

  const filtered = estimates.filter((e) => {
    if (filter !== 'all' && e.status !== filter) return false
    if (search && !`${e.name} ${e.projects?.name}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (eLoading || pLoading) return <PageSpinner />

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Estimates</h2>
          <p className="text-xs text-gray-500 mt-0.5">{estimates.length} total estimate{estimates.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <PlusIcon className="h-4 w-4" />
          New Estimate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 border-b border-surface-border px-6 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search estimates…"
          className="form-input max-w-xs"
        />
        <div className="flex gap-1.5">
          {['all', ...ESTIMATE_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === s ? 'bg-brand-orange text-white' : 'bg-surface text-gray-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={CalculatorIcon}
            title={search ? 'No results' : 'No estimates yet'}
            description={search ? 'Try a different search.' : 'Create an estimate to start tracking costs.'}
            action={!search && (
              <Button onClick={() => setShowModal(true)}>
                <PlusIcon className="h-4 w-4" />
                New Estimate
              </Button>
            )}
          />
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Estimate Name', 'Project', 'Status', 'Overhead', 'Profit', 'Updated'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="table-row">
                    <td className="px-5 py-3.5">
                      <Link to={`/estimates/${e.id}`} className="font-medium text-white hover:text-brand-orange">
                        {e.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      {e.projects ? (
                        <Link to={`/projects/${e.project_id}`} className="hover:text-white">
                          {e.projects.name}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5"><Badge status={e.status} /></td>
                    <td className="px-5 py-3.5 text-gray-400">{e.overhead_percent}%</td>
                    <td className="px-5 py-3.5 text-gray-400">{e.profit_percent}%</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatRelative(e.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Estimate Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Estimate">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Estimate Name *"
            placeholder="Base Bid – Structural Package"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Select label="Project *" error={errors.project_id?.message} {...register('project_id', { required: 'Select a project' })}>
            <option value="">— Select a project —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Status" {...register('status')}>
            {ESTIMATE_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Overhead %"
              type="number"
              step="0.1"
              min="0"
              max="100"
              {...register('overhead_percent')}
            />
            <Input
              label="Profit %"
              type="number"
              step="0.1"
              min="0"
              max="100"
              {...register('profit_percent')}
            />
          </div>
          <Textarea label="Notes" placeholder="Scope notes, exclusions…" rows={2} {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Estimate'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
