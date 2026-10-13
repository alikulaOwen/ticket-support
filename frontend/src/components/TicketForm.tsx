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

  const save = useMutation(
    (fields: {
      title: string
      description?: string
      status: TicketStatus
      priority: TicketPriority
    }) =>
      ticket
        ? updateTicket(ticket.id, { status: fields.status, priority: fields.priority })
        : createTicket({
            title: fields.title,
            description: fields.description,
            priority: fields.priority,
          }),
  )

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = await save.run({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
    })
    if (saved) onSaved()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem' }}>
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

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={save.pending}>
          Cancel
        </button>
        <button className="primary" type="submit" disabled={save.pending}>
          {save.pending ? 'Saving…' : ticket ? 'Save changes' : 'Create ticket'}
        </button>
      </div>
    </form>
  )
}
