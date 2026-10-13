interface Props {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, limit, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <nav
      style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', margin: '24px 0' }}
    >
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next
      </button>
    </nav>
  )
}
