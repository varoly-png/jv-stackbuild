import clsx from 'clsx'

export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="form-label">{label}</label>}
      <input
        className={clsx(
          'form-input',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Select({ label, error, className, children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="form-label">{label}</label>}
      <select
        className={clsx(
          'form-select',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="form-label">{label}</label>}
      <textarea
        className={clsx('form-input resize-none', error && 'border-red-500', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
