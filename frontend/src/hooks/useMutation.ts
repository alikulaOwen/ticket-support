import { useState } from 'react'

export function useMutation<Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(...args: Args): Promise<R | undefined> {
    setPending(true)
    setError(null)
    try {
      return await fn(...args)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      return undefined
    } finally {
      setPending(false)
    }
  }

  return { run, pending, error }
}