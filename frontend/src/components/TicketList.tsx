import { updateTicket } from '../api/client'
import type { Ticket, TicketPriority, TicketStatus } from '../api/types'
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
  if (error) {
    return (
      <div className="table-scroll">
        <p className="empty" role="alert">{error}</p>
      </div>
    )
  }
  if (loading && tickets.length === 0) {
    return (
      <div className="table-scroll">
        <p className="empty">Loading…</p>
      </div>
    )
  }
  if (tickets.length === 0) {
    return (
      <div className="table-scroll">
        <p className="empty">No tickets</p>
      </div>
    )
  }

  return (
    <div className="table-scroll">
      <table className="tickets">
        <thead>
          <tr>
            <th>Title</th>
            <th>Priority</th>
            <th>Created</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody className={loading ? 'is-loading' : undefined}>
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onChanged={onChanged} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface RowProps {
  ticket: Ticket
  onChanged: () => void
  onEdit: (ticket: Ticket) => void
}

function PriorityChip({ priority }: { priority: TicketPriority }) {
  return <span className={`chip chip-${priority}`}>{PRIORITY_LABELS[priority]}</span>
}

function CreatedAt({ value }: { value: string }) {
  const date = new Date(value)
  const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <time dateTime={value} className="created-at">
      <span className="created-at-date">{label}</span>
      <span className="created-at-time">{time}</span>
    </time>
  )
}

function TicketRow({ ticket, onChanged, onEdit }: RowProps) {
  const update = useMutation(updateTicket)

  async function changeStatus(status: TicketStatus) {
    const updated = await update.run(ticket.id, { status })
    if (updated) onChanged()
  }

  return (
    <tr>
      <td>
        <strong style={{ color: 'var(--text-h)' }}>{ticket.title}</strong>
        {ticket.description && <div>{ticket.description}</div>}
      </td>
      <td>
        <PriorityChip priority={ticket.priority} />
      </td>
      <td>
        <CreatedAt value={ticket.created_at} />
      </td>
      <td>
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
      <td>
        <button type="button" onClick={() => onEdit(ticket)}>
          Edit
        </button>
      </td>
    </tr>
  )
}
