import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      style={{
        width: 'min(480px, 90vw)',
        padding: 24,
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--bg)',
        color: 'var(--text)',
        textAlign: 'left',
      }}
    >
      <h2>{title}</h2>
      {open && children}
    </dialog>
  )
}
