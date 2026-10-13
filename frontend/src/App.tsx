import { useState } from 'react'
import { useTickets } from './hooks/useTickets'
import { useStats } from './hooks/useStats'
import type { StatusFilter } from './api/types'
import { StatsBar } from './components/StatsBar'
import { TicketForm } from './components/TicketForm'
import { TicketFilters } from './components/TicketFilters'
import { TicketList } from './components/TicketList'
import { Pagination } from './components/Pagination'

const LIMIT = 10

function App() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const tickets = useTickets({ status, page, limit: LIMIT }, refreshKey)
  const stats = useStats(refreshKey)

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  function changeStatus(next: StatusFilter) {
    setStatus(next)
    setPage(1)
  }

  function handleCreated() {
    setPage(1)
    refresh()
  }

  return (
    <main style={{ padding: '0 24px' }}>
      <h1>Ticket Support</h1>
      <StatsBar stats={stats.data} error={stats.error} />
      <TicketForm onCreated={handleCreated} />
      <TicketFilters status={status} onChange={changeStatus} />
      <TicketList
        tickets={tickets.data?.items ?? []}
        loading={tickets.loading}
        error={tickets.error}
        onChanged={refresh}
      />
      <Pagination
        page={page}
        limit={LIMIT}
        total={tickets.data?.total ?? 0}
        onPageChange={setPage}
      />
    </main>
  )
}

export default App
