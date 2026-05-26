export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised">
          <Icon className="h-7 w-7 text-gray-500" />
        </div>
      )}
      <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
      {description && <p className="mb-6 max-w-xs text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  )
}
