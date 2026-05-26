import clsx from 'clsx'

export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg'

  const variants = {
    primary: 'bg-brand-orange text-white hover:bg-brand-orange-light',
    secondary: 'border border-surface-border bg-surface text-gray-300 hover:border-gray-500 hover:text-white',
    ghost: 'text-gray-400 hover:bg-surface hover:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  }

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
