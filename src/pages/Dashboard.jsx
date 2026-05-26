import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderOpenIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useProjects } from '@/hooks/useProjects'
import { useEstimates } from '@/hooks/useEstimates'
import { Badge } from '@/components/UI/Badge'
import { PageSpinner } from '@/components/UI/Spinner'
import { formatCurrency, formatRelative } from '@/utils/formatters'
import { calcEstimateTotal } from '@/utils/calculations'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-white">{label}</p>
        <p className="text-brand-orange">{formatCurrency(payload[0]?.value)}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { projects, loading: pLoading } = useProjects()
  const { estimates, loading: eLoading } = useEstimates()

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === 'active').length
    const bidding = projects.filter((p) => p.status === 'bidding').length
    const totalEstimateValue = estimates.reduce((sum, e) => {
      const { total } = calcEstimateTotal([], e.overhead_percent, e.profit_percent)
      return sum + total
    }, 0)
    return { total: projects.length, active, bidding, totalEstimateValue, estimateCount: estimates.length }
  }, [projects, estimates])

  const chartData = useMemo(() => {
    const byStatus = { active: 0, bidding: 0, awarded: 0, complete: 0 }
    projects.forEach((p) => { if (p.status in byStatus) byStatus[p.status]++ })
    return Object.entries(byStatus).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
  }, [projects])

  if (pLoading || eLoading) return <PageSpinner />

  const recentProjects = projects.slice(0, 5)
  const recentEstimates = estimates.slice(0, 5)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FolderOpenIcon}
          label="Total Projects"
          value={stats.total}
          sub={`${stats.active} active`}
          color="orange"
        />
        <StatCard
          icon={ClockIcon}
          label="In Bidding"
          value={stats.bidding}
          sub="awaiting award"
          color="blue"
        />
        <StatCard
          icon={CalculatorIcon}
          label="Estimates"
          value={stats.estimateCount}
          sub="across all projects"
          color="purple"
        />
        <StatCard
          icon={CurrencyDollarIcon}
          label="Est. Pipeline"
          value={formatCurrency(stats.totalEstimateValue)}
          sub="total estimate value"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Chart */}
        <div className="card xl:col-span-1">
          <h3 className="section-title mb-4">Projects by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid vertical={false} stroke="#3a3a3a" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#E87722" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent projects */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Projects</h3>
            <Link to="/projects" className="flex items-center gap-1 text-xs text-brand-orange hover:underline">
              View all <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No projects yet. <Link to="/projects" className="text-brand-orange hover:underline">Create one.</Link></p>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-raised"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.client_name || 'No client'} · {p.city || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={p.status} />
                    <span className="text-xs text-gray-600">{formatRelative(p.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent estimates */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Recent Estimates</h3>
          <Link to="/estimates" className="flex items-center gap-1 text-xs text-brand-orange hover:underline">
            View all <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
        {recentEstimates.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No estimates yet. <Link to="/estimates" className="text-brand-orange hover:underline">Create one.</Link></p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Name', 'Project', 'Status', 'Overhead', 'Profit', 'Created'].map((h) => (
                  <th key={h} className="pb-2.5 text-left text-xs font-medium text-gray-500 first:pl-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentEstimates.map((e) => (
                <tr key={e.id} className="table-row">
                  <td className="py-3 pr-4">
                    <Link to={`/estimates/${e.id}`} className="font-medium text-white hover:text-brand-orange">{e.name}</Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{e.projects?.name || '—'}</td>
                  <td className="py-3 pr-4"><Badge status={e.status} /></td>
                  <td className="py-3 pr-4 text-gray-400">{e.overhead_percent}%</td>
                  <td className="py-3 pr-4 text-gray-400">{e.profit_percent}%</td>
                  <td className="py-3 text-gray-500">{formatRelative(e.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    orange: 'text-brand-orange bg-brand-orange/10',
    blue:   'text-blue-400 bg-blue-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    green:  'text-green-400 bg-green-400/10',
  }
  return (
    <div className="stat-card">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  )
}
