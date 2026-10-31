import { NavLink } from 'react-router-dom'
import {
  Car,
  Gauge,
  Wrench,
  CreditCard,
  Shield,
  IdCard,
  FileCheck,
  ClipboardCheck,
  ReceiptIndianRupee,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import './Sidebar.css'

const navSections = [
  {
    section: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    section: 'Management',
    items: [
      { label: 'Vehicles', path: '/vehicles', icon: Car },
      { label: 'Mileage', path: '/mileage', icon: Gauge },
      { label: 'Maintenance', path: '/maintenance', icon: Wrench },
      { label: 'FASTag', path: '/fastag', icon: CreditCard },
    ],
  },
  {
    section: 'Compliance',
    items: [
      { label: 'Insurance', path: '/insurance', icon: Shield },
      { label: 'License', path: '/license', icon: IdCard },
      { label: 'PUC', path: '/puc', icon: FileCheck },
      { label: 'Fitness Certificate', path: '/fitness', icon: ClipboardCheck },
    ],
  },
  {
    section: 'Insights',
    items: [{ label: 'Expenses', path: '/expenses', icon: ReceiptIndianRupee }],
  },
]

const bottomItems = [{ label: 'Settings', path: '/settings', icon: Settings }]

export default function Sidebar({ isOpen, onToggle }) {
  const { signOut, user } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const linkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Car size={22} />
            </div>
            <span className="sidebar-logo-text">DriveMate</span>
          </div>
          <button className="sidebar-toggle" onClick={onToggle} title="Close menu">
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((group) => (
            <div key={group.section} className="sidebar-section">
              <div className="sidebar-section-label">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={linkClass}
                  onClick={() => window.innerWidth < 1024 && onToggle()}
                >
                  <item.icon size={19} />
                  <span className="sidebar-link-text">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-section">
            {bottomItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass}>
                <item.icon size={19} />
                <span className="sidebar-link-text">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user?.user_metadata?.full_name || 'User'}
              </span>
              <span className="sidebar-user-email">{user?.email}</span>
            </div>
            <button className="sidebar-logout" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}