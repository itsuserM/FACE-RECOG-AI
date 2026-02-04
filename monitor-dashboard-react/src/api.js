const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function apiRequest(path, init) {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
  const r = await fetch(`${API_BASE}${path}`, init)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}


export async function login(username, password) {
  const r = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!r.ok) throw new Error('Invalid credentials')
  return r.json()
}

export async function getStats(token) {
  const r = await fetch(`${API_BASE}/api/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!r.ok) throw new Error('Failed to fetch stats')
  return r.json()
}

export async function getActivity(token, limit = 200) {
  const r = await fetch(`${API_BASE}/api/activity?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!r.ok) throw new Error('Failed to fetch activity')
  return r.json()
}

export function wsUrl() { return (API_BASE || '').replace('http', 'ws') + '/ws' }
