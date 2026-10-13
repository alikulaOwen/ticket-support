import type { StatusFilter } from '../api/types'
import { STATUSES, STATUS_LABELS } from './labels'

interface Props {
  status: StatusFilter
  onChange: (status: StatusFilter) => void
}

export function TicketFilters({ status, onChange }: Props) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      Status:{' '}
      <select value={status} onChange={(e) => onChange(e.target.value as StatusFilter)}>
        <option value="all">All</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
  )
}
