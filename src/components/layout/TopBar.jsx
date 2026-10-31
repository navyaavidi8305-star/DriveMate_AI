import { Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import './TopBar.css'

function formatToday() {
  const d = new Date()
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TopBar({ onToggleMenu }) {
  const { user } = useAuth()
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initial = (user?.email?.charAt(0) || 'U').toUpperCase()

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu" onClick={onToggleMenu} title="Open menu" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <span className="topbar-date">{formatToday()}</span>
      </div>

      <div className="topbar-user">
        <div className="topbar-user-avatar">{initial}</div>
        <div className="topbar-user-meta">
          <span className="topbar-user-name">{name}</span>
          <span className="topbar-user-email">{user?.email}</span>
        </div>
      </div>
    </header>
  )
}