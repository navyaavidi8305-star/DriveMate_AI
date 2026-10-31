import { Car } from 'lucide-react'
import './AuthLayout.css'

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Car size={24} />
            </div>
            <h1 className="auth-logo-text">DriveMate</h1>
          </div>
          <p className="auth-tagline">Vehicle Management & Mileage Tracker</p>
        </div>
        <div className="auth-card-body">
          {children}
        </div>
      </div>
    </div>
  )
}
