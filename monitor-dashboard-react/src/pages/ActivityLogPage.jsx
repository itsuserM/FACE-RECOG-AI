import { useEffect, useMemo, useState } from 'react'
import { getActivity } from '../api'
import ActivityTable from '../components/tables/ActivityTable'

export default function ActivityLogPage({ token }) {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => {
    ;(async () => {
      const { items } = await getActivity(token, 500)
      setItems(items)
    })()
  }, [token])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((it) =>
      [it.user, it.event, it.ts].some((v) => String(v || '').toLowerCase().includes(s))
    )
  }, [items, q])

  return (
    <section className="hk-card">
      <div className="hk-cardHead">
        <div>
          <h2 className="hk-h2">Activity Log</h2>
          <p className="hk-p muted">Realtime events captured from monitoring node</p>
        </div>
        <div className="hk-search">
          <input
            className="hk-input"
            placeholder="Filter by user / event / time…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap hk-tableWrap">
        <ActivityTable items={filtered} />
      </div>
    </section>
  )
}
