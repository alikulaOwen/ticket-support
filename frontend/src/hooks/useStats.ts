import { useEffect, useState } from 'react'
import { getStats } from '../api/client'
import type { TicketStat } from '../api/types'

export function useStats(refreshKey: number) {
  const [data, setData] = useState<TicketStat[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setError(null)

    getStats(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      })

    return () => controller.abort()
  }, [refreshKey])

  return { data, error }
}