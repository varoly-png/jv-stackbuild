import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full ${widths[size]} rounded-2xl border border-surface-border bg-surface shadow-2xl animate-fade-in`}>
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
