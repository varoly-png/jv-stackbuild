const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const NUM = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export const formatCurrency = (n) => USD.format(Number(n) || 0)

export const formatNumber = (n) => NUM.format(Number(n) || 0)

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelative(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(dateStr)
}
