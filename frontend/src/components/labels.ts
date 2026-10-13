import type { TicketPriority, TicketStatus } from '../api/types'

export const STATUSES: TicketStatus[] = ['open', 'in_progress', 'closed']
export const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high']

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}
