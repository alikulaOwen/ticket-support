import { useState } from 'react'
import { useTickets } from './hooks/useTickets'
import { useStats } from './hooks/useStats'
import type { StatusFilter, Ticket } from './api/types'
import { StatsBar } from './components/StatsBar'
import { TicketForm } from './components/TicketForm'
import { TicketFilters } from './components/TicketFilters'
import { TicketList } from './components/TicketList'
import { Pagination } from './components/Pagination'
import { Modal } from './components/Modal'

const LIMIT = 10

function App() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState<Ticket | 'new' | null>(null)

  const tickets = useTickets({ status, page, limit: LIMIT }, refreshKey)
  const stats = useStats(refreshKey)

  function refresh() {
    setRefreshKey((k) => k + 1)
  }

  function changeStatus(next: StatusFilter) {
    setStatus(next)
    setPage(1)
  }

  function closeModal() {
    setEditing(null)
  }

  function handleSaved() {
    if (editing === 'new') setPage(1)
    setEditing(null)
    refresh()
  }

  return (
    <main style={{ padding: '0 24px' }}>
      <h1>Ticket Support</h1>
      <StatsBar stats={stats.data} error={stats.error} />

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <TicketFilters status={status} onChange={changeStatus} />
        <button onClick={() => setEditing('new')}>New ticket</button>
      </div>

      <TicketList
        tickets={tickets.data?.items ?? []}
        loading={tickets.loading}
        error={tickets.error}
        onChanged={refresh}
        onEdit={setEditing}
      />
      <Pagination
        page={page}
        limit={LIMIT}
        total={tickets.data?.total ?? 0}
        onPageChange={setPage}
      />

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'New ticket' : 'Edit ticket'}
        onClose={closeModal}
      >
        {editing !== null && (
          <TicketForm
            key={editing === 'new' ? 'new' : editing.id}
            ticket={editing === 'new' ? undefined : editing}
            onSaved={handleSaved}
            onCancel={closeModal}
          />
        )}
      </Modal>
    </main>
  )
}

export default App
