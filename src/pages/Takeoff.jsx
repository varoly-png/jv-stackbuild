import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardDocumentListIcon,
  FolderOpenIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useProjects } from '@/hooks/useProjects'
import { Badge } from '@/components/UI/Badge'
import { PageSpinner } from '@/components/UI/Spinner'
import { EmptyState } from '@/components/UI/EmptyState'

export default function Takeoff() {
  const { projects, loading } = useProjects()
  const [search, setSearch] = useState('')

  const filtered = projects.filter((p) =>
    !search || `${p.name} ${p.client_name}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <PageSpinner />

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Takeoff</h2>
          <p className="text-xs text-gray-500 mt-0.5">Select a project to open its takeoff sheet</p>
        </div>
      </div>

      <div className="border-b border-surface-border px-6 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter projects…"
          className="form-input max-w-xs"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardDocumentListIcon}
            title={search ? 'No matching projects' : 'No projects found'}
            description="Create a project first, then come back to add takeoff quantities."
            action={
              <Link to="/projects" className="btn-primary">
                <FolderOpenIcon className="h-4 w-4" />
                Go to Projects
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="card group flex items-start justify-between gap-4 transition-all hover:border-brand-orange/40"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-brand-orange" />
                  </div>
                  <div>
                    <p className="font-semibold text-white group-hover:text-brand-orange transition-colors">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.client_name || 'No client'}</p>
                    <div className="mt-2">
                      <Badge status={p.status} />
                    </div>
                  </div>
                </div>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-600 group-hover:text-brand-orange mt-1 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
