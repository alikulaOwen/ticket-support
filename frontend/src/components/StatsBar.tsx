import type { TicketStat } from '../api/types'
import { STATUS_LABELS } from './labels'

interface Props {
  stats: TicketStat[]
  error: string | null
}

export function StatsBar({ stats, error }: Props) {
  if (error) return <p role="alert">{error}</p>

  return (
    <section className="stats">
      {stats.map((stat) => (
        <div key={stat.status} className="stats-item">
          <div>{STATUS_LABELS[stat.status]}</div>
          <code>{stat.count}</code>
        </div>
      ))}
    </section>
  )
}
