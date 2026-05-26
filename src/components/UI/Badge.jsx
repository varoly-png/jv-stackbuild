import clsx from 'clsx'

const STATUS_STYLES = {
  // Project statuses
  active:    'bg-green-500/15 text-green-400 border border-green-500/20',
  bidding:   'bg-brand-orange/15 text-brand-orange border border-brand-orange/20',
  awarded:   'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  complete:  'bg-gray-500/15 text-gray-400 border border-gray-500/20',
  on_hold:   'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  // Estimate statuses
  draft:     'bg-gray-500/15 text-gray-400 border border-gray-500/20',
  submitted: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  approved:  'bg-green-500/15 text-green-400 border border-green-500/20',
  rejected:  'bg-red-500/15 text-red-400 border border-red-500/20',
}

export function Badge({ status, label, className }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-500/15 text-gray-400'
  const text = label ?? (status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : '')
  return (
    <span className={clsx('badge', style, className)}>
      {text}
    </span>
  )
}
