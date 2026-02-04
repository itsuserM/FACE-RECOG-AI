import Sidebar from './Sidebar'

export default function Layout({ children, onLogout }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <h1>Face Recognition System Using Artificial Intelligence</h1>
          <button className="ghost" onClick={onLogout}>Logout</button>
        </header>
        {children}
      </main>
    </div>
  )
}
