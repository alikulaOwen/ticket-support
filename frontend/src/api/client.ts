import type {
    CreateTicketInput,
    ListTicketsParams,
    Ticket,
    TicketList,
    TicketStat,
    UpdateTicketInput,
  } from './types'
  
  const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  
  interface RequestOptions {
    method?: 'GET' | 'POST' | 'PATCH'
    body?: unknown
    signal?: AbortSignal
  }
  
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, signal } = options
  
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  
    if (!response.ok) {
      let message = `Request failed (${response.status})`
      try {
        const data = await response.json()
        if (typeof data?.error === 'string') message = data.error
      } catch {
        // body was empty or not JSON; keep the status-based message
      }
      throw new Error(message)
    }
  
    return response.json() as Promise<T>
  }
  
  export function listTickets(params: ListTicketsParams, signal?: AbortSignal) {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    })
    if (params.status !== 'all') query.set('status', params.status)
  
    return request<TicketList>(`/tickets?${query}`, { signal })
  }
  
  export function createTicket(input: CreateTicketInput) {
    return request<Ticket>('/tickets', { method: 'POST', body: input })
  }
  
  export function updateTicket(id: number, input: UpdateTicketInput) {
    return request<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: input })
  }
  
  export function getStats(signal?: AbortSignal) {
    return request<TicketStat[]>('/tickets/stats', { signal })
  }