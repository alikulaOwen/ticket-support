export type TicketStatus = 'open' | 'in_progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface Ticket {
    id: number
    title: string
    description: string | null
    status: TicketStatus
    priority: TicketPriority
    created_at: string
}

export type StatusFilter = TicketStatus | 'all'

export interface ListTicketsParams {
  status: StatusFilter
  page: number
  limit: number
}

export interface TicketList { items: Ticket[]; total: number; page: number; limit: number }
export interface TicketStat { status: TicketStatus; count: number }

export interface CreateTicketInput { title: string; description?: string; priority?: TicketPriority }
export interface UpdateTicketInput { status?: TicketStatus; priority?: TicketPriority }