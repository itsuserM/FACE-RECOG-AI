import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Layout from './layout/Layout'
import ActivityLogPage from './pages/ActivityLogPage'
import DashboardPage from './pages/DashboardPage'
import MonitoringPage from './pages/MonitoringPage'

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || '')

  const onLogin = (t) => {
    sessionStorage.setItem('token', t)
    setToken(t)
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    setToken('')
  }

  if (!token) return <Login onLogin={onLogin} />

  return (
    <BrowserRouter>
      <Layout onLogout={logout}>
        <Routes>
          <Route path="/" element={<DashboardPage token={token} />} />
          <Route path="/monitoring" element={<MonitoringPage token={token} />} />
          <Route path="/activity" element={<ActivityLogPage token={token} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
