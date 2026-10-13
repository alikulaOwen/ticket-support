import { updateTicket } from '../api/client'
import type { Ticket, TicketStatus } from '../api/types'
import { useMutation } from '../hooks/useMutation'
import { PRIORITY_LABELS, STATUSES, STATUS_LABELS } from './labels'

interface ListProps {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  onChanged: () => void
  onEdit: (ticket: Ticket) => void
}

export function TicketList({ tickets, loading, error, onChanged, onEdit }: ListProps) {
  if (error) return <p role="alert">{error}</p>
  if (loading && tickets.length === 0) return <p>Loading…</p>
  if (tickets.length === 0) return <p>No tickets</p>

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead>
        <tr>
          <th>Title</th>
          <th>Priority</th>
          <th>Created</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody style={{ opacity: loading ? 0.6 : 1 }}>
        {tickets.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} onChanged={onChanged} onEdit={onEdit} />
        ))}
      </tbody>
    </table>
  )
}

interface RowProps {
  ticket: Ticket
  onChanged: () => void
  onEdit: (ticket: Ticket) => void
}

const cell = { padding: 8, borderTop: '1px solid var(--border)' }

function TicketRow({ ticket, onChanged, onEdit }: RowProps) {
  const update = useMutation(updateTicket)

  async function changeStatus(status: TicketStatus) {
    const updated = await update.run(ticket.id, { status })
    if (updated) onChanged()
  }

  return (
    <tr>
      <td style={cell}>
        <strong style={{ color: 'var(--text-h)' }}>{ticket.title}</strong>
        {ticket.description && <div>{ticket.description}</div>}
      </td>
      <td style={cell}>{PRIORITY_LABELS[ticket.priority]}</td>
      <td style={cell}>{new Date(ticket.created_at).toLocaleString()}</td>
      <td style={cell}>
        <select
          value={ticket.status}
          disabled={update.pending}
          onChange={(e) => changeStatus(e.target.value as TicketStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {update.error && <div role="alert">{update.error}</div>}
      </td>
      <td style={cell}>
        <button onClick={() => onEdit(ticket)}>Edit</button>
      </td>
    </tr>
  )
}
