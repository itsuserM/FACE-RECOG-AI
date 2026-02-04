import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

export default function MonitoringPage({ token }) {
  const [running, setRunning] = useState(false)
  const [busy, setBusy] = useState(false)
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  async function refresh() {
    const r = await apiRequest('/api/monitor/status', { headers })
    setRunning(!!r.running)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function start() {
    setBusy(true)
    try {
      await apiRequest('/api/monitor/start', { method: 'POST', headers })
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function stop() {
    setBusy(true)
    try {
      await apiRequest('/api/monitor/stop', { method: 'POST', headers })
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="hk-card">
      <div className="hk-cardHead">
        <div>
          <h2 className="hk-h2">Monitoring Control</h2>
          <p className="hk-p muted">Start/stop the face-recognition watcher process from dashboard.</p>
        </div>
        <div className={`hk-chip ${running ? 'ok' : 'warn'}`}>
          <span className="hk-chipDot" />
          {running ? 'RUNNING' : 'STOPPED'}
        </div>
      </div>

      <div className="hk-console">
        <div className="hk-consoleLine">
          <span className="muted">service</span> <b>monitor_embeddings.py</b>
        </div>
        <div className="hk-consoleLine">
          <span className="muted">status</span>{' '}
          <b className={running ? 'ok' : 'warn'}>{running ? 'ACTIVE' : 'INACTIVE'}</b>
        </div>
        <div className="hk-consoleLine">
          <span className="muted">policy</span> <b>unknown user &gt; 10s → screen off + log event</b>
        </div>
      </div>

      <div className="hk-actions">
        <button onClick={start} disabled={running || busy}>
          {busy && !running ? 'STARTING…' : 'START MONITORING'}
        </button>
        <button className="ghost" onClick={stop} disabled={!running || busy}>
          {busy && running ? 'STOPPING…' : 'STOP'}
        </button>
        <button className="ghost" onClick={refresh} disabled={busy} title="Refresh status">
          REFRESH
        </button>
      </div>

      <p className="hk-note muted">
        Tip: If the webcam is busy (Zoom/Teams), monitoring may fail to start.
      </p>
    </section>
  )
}
