import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { createTicket, updateTicket } from '../api/client'
import type { Ticket, TicketPriority, TicketStatus } from '../api/types'
import { useMutation } from '../hooks/useMutation'
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from './labels'

interface Props {
  ticket?: Ticket
  onSaved: () => void
  onCancel: () => void
}

export function TicketForm({ ticket, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TicketStatus>(ticket?.status ?? 'open')
  const [priority, setPriority] = useState<TicketPriority>(ticket?.priority ?? 'medium')

  const save = useMutation(() =>
    ticket
      ? updateTicket(ticket.id, { status, priority })
      : createTicket({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
        }),
  )

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = await save.run()
    if (saved) onSaved()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
      {ticket ? (
        <div>
          <strong style={{ color: 'var(--text-h)' }}>{ticket.title}</strong>
          {ticket.description && <p>{ticket.description}</p>}
        </div>
      ) : (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
          />
        </>
      )}

      {ticket && (
        <label>
          Status{' '}
          <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Priority{' '}
        <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </label>

      {save.error && <p role="alert">{save.error}</p>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={save.pending}>
          Cancel
        </button>
        <button type="submit" disabled={save.pending}>
          {save.pending ? 'Saving…' : ticket ? 'Save changes' : 'Create ticket'}
        </button>
      </div>
    </form>
  )
}
