import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">AI Security</div>
      <nav>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/monitoring">Monitoring</NavLink>
        <NavLink to="/activity">Activity Log</NavLink>
      </nav>
    </aside>
  )
}
