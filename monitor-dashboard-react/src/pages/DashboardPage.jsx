import { useEffect, useMemo, useState } from 'react'
import { apiRequest, getActivity, getStats, wsUrl } from '../api'
import ActivityChart from '../components/charts/ActivityChart'
import BarHourly from '../components/charts/BarHourly'
import DonutEvents from '../components/charts/DonutEvents'
import StatCard from '../components/kpi/StatCard'

export default function DashboardPage({ token }) {
  const [stats, setStats] = useState({ total: 0, last_ts: null })
  const [items, setItems] = useState([])
  const [running, setRunning] = useState(false)

  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token])

  // Normalize event names (supports old + new)
  const norm = (it) => {
    const raw = it?.type || it?.event || ''
    if (raw === 'recognized') return 'authorized_user'
    if (raw === 'screen_off') return 'screen_locked'
    return raw
  }

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const s = await getStats(token)
        if (mounted) setStats(s)
      } catch {}

      try {
        const res = await getActivity(token, 600)
        if (mounted) setItems(res?.items || [])
      } catch {}

      try {
        const r = await apiRequest('/api/monitor/status', auth)
        if (mounted) setRunning(!!r?.running)
      } catch {}
    })()

    return () => {
      mounted = false
    }
  }, [token, auth])

  useEffect(() => {
    const ws = new WebSocket(wsUrl())

    ws.onopen = () => {
      try {
        ws.send('ping')
      } catch {}
    }

    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        if (d?.type !== 'event') return
        const evt = { ...d, _id: crypto.randomUUID() }
        setItems((prev) => [evt, ...prev])
        setStats((s) => ({ ...s, total: (s.total || 0) + 1, last_ts: d.ts }))
      } catch {}
    }

    return () => {
      try {
        ws.close()
      } catch {}
    }
  }, [])

  const derived = useMemo(() => {
    const safe = Array.isArray(items) ? items : []
    const sorted = [...safe].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

    let authorized = 0
    let unauthorized = 0
    let noUser = 0
    let locked = 0
    const hourly = {}

    for (const it of sorted) {
      const ev = norm(it)

      if (ev === 'authorized_user') authorized += 1
      if (ev === 'unauthorized_face') unauthorized += 1
      if (ev === 'no_face_detected') noUser += 1
      if (ev === 'screen_locked') locked += 1

      const h = new Date(it.ts).toISOString().slice(0, 13) + ':00'
      hourly[h] = hourly[h] || { authorized: 0, unauthorized: 0, noUser: 0 }

      if (ev === 'authorized_user') hourly[h].authorized += 1
      if (ev === 'unauthorized_face') hourly[h].unauthorized += 1
      if (ev === 'no_face_detected') hourly[h].noUser += 1
    }

    const last = sorted[0]?.ts ? new Date(sorted[0].ts).toLocaleString() : 'No events yet'
    const last24 = sorted.filter((it) => {
      const t = new Date(it.ts).getTime()
      return Number.isFinite(t) && Date.now() - t < 24 * 3600 * 1000
    }).length

    // Small “recent events” list for the System panel
    const recent = sorted.slice(0, 6).map((it) => {
      const ev = norm(it)
      const ts = it?.ts ? new Date(it.ts).toLocaleTimeString() : '--:--'
      return {
        id: it?._id || `${it.ts}-${ev}`,
        ts,
        ev
      }
    })

    return { authorized, unauthorized, noUser, locked, hourly, last, last24, recent }
  }, [items])

  return (
    <div className="dashWrap">
      <div className="dashContainer">
        {/* Header */}
        <div className="dashHeader">
          <div className="dashHeaderLeft">
            <div className="dashKicker">Security Overview</div>
            <h2 className="dashTitle">Threat &amp; Presence</h2>
            <div className="dashSub">
              Updated in real-time • Last event: <b>{derived.last}</b>
            </div>
          </div>

          <div className={`dashStatus ${running ? 'ok' : 'warn'}`}>
            <span className="dashStatusDot" />
            <span>{running ? 'Monitoring active' : 'Monitoring stopped'}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="dashGrid">
          {/* KPIs */}
          <div className="dashCard kpi" style={{ gridColumn: 'span 3' }}>
            <StatCard label="Total events" value={stats.total || 0} hint={`Last 24h: ${derived.last24}`} />
          </div>

          <div className="dashCard kpi" style={{ gridColumn: 'span 3' }}>
            <StatCard label="Authorized" value={derived.authorized} />
          </div>

          <div className="dashCard kpi" style={{ gridColumn: 'span 3' }}>
            <StatCard label="Unauthorized" value={derived.unauthorized} />
          </div>

          <div className="dashCard kpi" style={{ gridColumn: 'span 3' }}>
            <StatCard label="No face detected" value={derived.noUser} />
          </div>

          {/* Activity trend */}
          <section className="dashCard panel" style={{ gridColumn: 'span 8' }}>
            <div className="dashCardHead">
              <div>
                <div className="dashCardTitle">Activity trend</div>
                <div className="dashCardMeta">Hourly buckets</div>
              </div>
            </div>

            <div className="dashCardBody chartH320">
              <ActivityChart bucket={derived.hourly} />
            </div>
          </section>

          {/* System status */}
          <section className="dashCard panel" style={{ gridColumn: 'span 4' }}>
            <div className="dashCardHead">
              <div>
                <div className="dashCardTitle">System status</div>
                <div className="dashCardMeta">Snapshot</div>
              </div>
            </div>

            <div className="dashCardBody">
              <div className="kvList">
                <div className="kvRow">
                  <span>Status</span>
                  <b className={running ? 'ok' : 'warn'}>{running ? 'Active' : 'Stopped'}</b>
                </div>
                <div className="kvRow">
                  <span>Authorized</span>
                  <b>{derived.authorized}</b>
                </div>
                <div className="kvRow">
                  <span>Unauthorized</span>
                  <b>{derived.unauthorized}</b>
                </div>
                <div className="kvRow">
                  <span>No face detected</span>
                  <b>{derived.noUser}</b>
                </div>
                <div className="kvRow">
                  <span>System locked</span>
                  <b>{derived.locked}</b>
                </div>
                <div className="kvRow">
                  <span>Total in database</span>
                  <b>{stats.total || 0}</b>
                </div>
              </div>

              <div className="dashDivider" />

              <div className="recentBlock">
                <div className="recentTitle">Recent events</div>
                {derived.recent.length ? (
                  <ul className="recentList">
                    {derived.recent.map((r) => (
                      <li key={r.id} className="recentItem">
                        <span className="recentTs">{r.ts}</span>
                        <span className="recentEv">{r.ev}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="muted">No events yet</div>
                )}
              </div>
            </div>
          </section>

          {/* Donut */}
          <section className="dashCard panel" style={{ gridColumn: 'span 4' }}>
            <div className="dashCardHead">
              <div>
                <div className="dashCardTitle">Event mix</div>
                <div className="dashCardMeta">Authorized / Unauthorized / No face</div>
              </div>
            </div>

            <div className="dashCardBody chartH260">
              <DonutEvents
                counts={{
                  authorized: derived.authorized,
                  unauthorized: derived.unauthorized,
                  noUser: derived.noUser
                }}
              />
            </div>
          </section>

          {/* Bar */}
          <section className="dashCard panel" style={{ gridColumn: 'span 8' }}>
            <div className="dashCardHead">
              <div>
                <div className="dashCardTitle">Hourly load</div>
                <div className="dashCardMeta">Last 12 buckets</div>
              </div>
            </div>

            <div className="dashCardBody chartH260">
              <BarHourly bucket={derived.hourly} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
