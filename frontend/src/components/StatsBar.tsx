import type { TicketStat } from '../api/types'
import { STATUS_LABELS } from './labels'

interface Props {
  stats: TicketStat[]
  error: string | null
}

export function StatsBar({ stats, error }: Props) {
  if (error) return <p role="alert">{error}</p>

  return (
    <section style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
      {stats.map((stat) => (
        <div
          key={stat.status}
          style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px' }}
        >
          <div>{STATUS_LABELS[stat.status]}</div>
          <code>{stat.count}</code>
        </div>
      ))}
    </section>
  )
}
