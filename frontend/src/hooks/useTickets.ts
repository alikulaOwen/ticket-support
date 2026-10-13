import { useEffect, useState } from 'react'
import { listTickets } from '../api/client'
import type { ListTicketsParams, TicketList } from '../api/types'

export function useTickets(params: ListTicketsParams, refreshKey: number) {
  const [data, setData] = useState<TicketList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { status, page, limit } = params

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    listTickets({ status, page, limit }, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Failed to load tickets')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [status, page, limit, refreshKey])

  return { data, loading, error }
}