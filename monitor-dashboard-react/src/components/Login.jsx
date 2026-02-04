import { useState } from 'react'
import { login } from '../api'

export default function Login({ onLogin }) {
  const [u, setU] = useState('admin')
  const [p, setP] = useState('letmein123!')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const res = await login(u, p)
      onLogin(res.access_token)
    } catch {
      setMsg('ACCESS DENIED: Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hk-login">
      <div className="hk-noise" aria-hidden="true" />
      <div className="hk-scan" aria-hidden="true" />

      <section className="hk-panel" role="dialog" aria-labelledby="login-title">
        <header className="hk-head">
          <div className="hk-mark" aria-hidden="true">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <div className="hk-titlewrap">
            <h1 id="login-title" className="hk-title">Face Recognition System Using Artificial Intelligence</h1>
            <p className="hk-sub">Secure Employee Device and Data Security</p>
          </div>
          <div className="hk-badge" title="Connection">
            <span className="pulse" />
            <span>LOCALHOST</span>
          </div>
        </header>

        <form onSubmit={submit} className="hk-form">
          <label className="hk-label">
            <span>USERNAME</span>
            <input
              className="hk-input"
              placeholder="admin"
              autoComplete="username"
              value={u}
              onChange={(e) => setU(e.target.value)}
            />
          </label>

          <label className="hk-label">
            <span>PASSWORD</span>
            <div className="hk-pass">
              <input
                className="hk-input"
                type={show ? 'text' : 'password'}
                placeholder="••••••••••"
                autoComplete="current-password"
                value={p}
                onChange={(e) => setP(e.target.value)}
              />
              <button
                type="button"
                className="hk-eye"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                title={show ? 'Hide' : 'Show'}
              >
                {show ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </label>

          <button type="submit" className="hk-btn" disabled={loading}>
            <span className="hk-btnGlow" aria-hidden="true" />
            {loading ? 'AUTHENTICATING…' : 'LOGIN'}
          </button>

          {msg && (
            <p className="hk-msg" role="alert">
              {msg}
            </p>
          )}

        </form>
      </section>
      <footer className="hk-footer" aria-label="login footer">
            Powered by <span className="hk-footerName">Manish Kumar Maharjan</span>
      </footer>
    </div>
  )
}
