import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  FolderOpenIcon,
  CalculatorIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'

const NAV = [
  { to: '/',          label: 'Dashboard',  Icon: HomeIcon },
  { to: '/projects',  label: 'Projects',   Icon: FolderOpenIcon },
  { to: '/takeoff',   label: 'Takeoff',    Icon: ClipboardDocumentListIcon },
  { to: '/estimates', label: 'Estimates',  Icon: CalculatorIcon },
]

export function Sidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="flex w-60 flex-col border-r border-surface-border bg-brand-dark">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange text-white font-extrabold text-sm select-none">
          JV
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-white">JV StackBuild</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Takeoff & Estimating</p>
        </div>
      </div>

      <div className="divider mx-4" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
          Menu
        </p>
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" style={{ width: '1.125rem', height: '1.125rem' }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold uppercase">
            {user?.email?.[0] ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-white">{user?.email}</p>
            <p className="text-[10px] text-gray-500">Administrator</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="text-gray-500 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
