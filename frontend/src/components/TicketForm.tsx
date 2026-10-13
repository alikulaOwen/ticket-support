import { useState } from 'react'
import type { FormEvent } from 'react'
import { createTicket } from '../api/client'
import type { TicketPriority } from '../api/types'
import { useMutation } from '../hooks/useMutation'
import { PRIORITIES, PRIORITY_LABELS } from './labels'

interface Props {
  onCreated: () => void
}

export function TicketForm({ onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const create = useMutation(createTicket)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ticket = await create.run({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
    })
    if (ticket) {
      setTitle('')
      setDescription('')
      setPriority('medium')
      onCreated()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'grid', gap: 8, maxWidth: 480, margin: '0 auto 32px', textAlign: 'left' }}
    >
      <h2>New ticket</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={3}
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>
      <button type="submit" disabled={create.pending}>
        {create.pending ? 'Creating…' : 'Create ticket'}
      </button>
      {create.error && <p role="alert">{create.error}</p>}
    </form>
  )
}
