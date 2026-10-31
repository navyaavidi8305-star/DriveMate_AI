import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../common/Sidebar/Sidebar'
import TopBar from './TopBar'
import './AppLayout.css'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <main className={`app-main ${sidebarOpen ? '' : 'app-main--expanded'}`}>
        <TopBar onToggleMenu={toggleSidebar} />
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
