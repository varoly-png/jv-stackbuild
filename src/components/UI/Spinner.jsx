import clsx from 'clsx'

export function Spinner({ className }) {
  return (
    <div
      className={clsx(
        'h-5 w-5 animate-spin rounded-full border-2 border-surface-border border-t-brand-orange',
        className,
      )}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
