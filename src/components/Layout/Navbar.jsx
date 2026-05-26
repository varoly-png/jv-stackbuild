import { useLocation } from 'react-router-dom'
import { BellIcon } from '@heroicons/react/24/outline'

const PAGE_TITLES = {
  '/':          'Dashboard',
  '/projects':  'Projects',
  '/takeoff':   'Takeoff',
  '/estimates': 'Estimates',
}

export function Navbar() {
  const { pathname } = useLocation()

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  )?.[1] ?? 'JV StackBuild'

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-border bg-brand-dark px-6">
      <h1 className="text-sm font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <BellIcon className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-orange" />
        </button>
        <div className="h-5 w-px bg-surface-border" />
        <span className="text-xs text-gray-500">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
    </header>
  )
}
